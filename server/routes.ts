import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertUserSchema, insertProfileQuestionsSchema, insertMeetingSchema, insertAvailabilitySchema } from "@shared/schema";
import multer from 'multer';
import { schedulerService } from "./services/scheduler";
import { timeSlotService } from "./services/timeSlots";
import { z } from "zod";

// Configure multer for file uploads
const storage_multer = multer.memoryStorage();
const upload = multer({ 
  storage: storage_multer,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);
      
      if (!user) {
        console.log("User not found in database, creating:", userId, req.user.claims.email);
        // Create user if not found (should have been created in callback, but fallback)
        const claims = req.user.claims;
        await storage.upsertUser({
          id: claims.sub,
          email: claims.email,
          firstName: claims.first_name || claims.email.split('@')[0],
          lastName: claims.last_name || "Member",
          profileImageUrl: claims.profile_image_url,
        });
        user = await storage.getUser(userId);
      }
      
      if (!user) {
        console.error("Still no user found after creation attempt:", userId);
        return res.status(500).json({ message: "Failed to create or retrieve user" });
      }
      
      console.log("Returning user data:", { id: user.id, email: user.email, isAdmin: user.isAdmin });
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Add /api/auth/me endpoint that frontend expects
  app.get('/api/auth/me', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);
      
      if (!user) {
        console.log("User not found in database, creating:", userId, req.user.claims.email);
        // Create user if not found
        const claims = req.user.claims;
        await storage.upsertUser({
          id: claims.sub,
          email: claims.email,
          firstName: claims.first_name || claims.email.split('@')[0],
          lastName: claims.last_name || "Member",
          profileImageUrl: claims.profile_image_url,
        });
        user = await storage.getUser(userId);
      }
      
      if (!user) {
        console.error("Still no user found after creation attempt:", userId);
        return res.status(500).json({ message: "Failed to create or retrieve user" });
      }
      
      console.log("Returning user data via /me:", { id: user.id, email: user.email, isAdmin: user.isAdmin });
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Availability endpoints
  app.get('/api/availability', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const availability = await storage.getAvailability(userId);
      res.json(availability);
    } catch (error) {
      console.error("Error fetching availability:", error);
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });

  app.post('/api/availability', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertAvailabilitySchema.parse({
        ...req.body,
        userId
      });
      
      const availability = await storage.createAvailability(validatedData);
      res.json(availability);
    } catch (error) {
      console.error("Error creating availability:", error);
      res.status(500).json({ message: "Failed to create availability" });
    }
  });

  app.delete('/api/availability', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userAvailability = await storage.getAvailability(userId);
      
      // Delete all availability records for the user
      for (const avail of userAvailability) {
        await storage.deleteAvailability(avail.id);
      }
      
      res.json({ message: "All availability deleted successfully" });
    } catch (error) {
      console.error("Error deleting availability:", error);
      res.status(500).json({ message: "Failed to delete availability" });
    }
  });

  // User profile endpoints
  app.patch('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updateData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        jobTitle: req.body.jobTitle,
        company: req.body.company,
        industry: req.body.industry,
        bio: req.body.bio,
        linkedinUrl: req.body.linkedinUrl,
      };
      
      const user = await storage.updateUser(userId, updateData);
      res.json(user);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.post('/api/user/profile-questions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertProfileQuestionsSchema.parse({
        ...req.body,
        userId
      });
      
      // Check if profile questions already exist
      const existing = await storage.getProfileQuestions(userId);
      if (existing) {
        const updated = await storage.updateProfileQuestions(userId, validatedData);
        res.json(updated);
      } else {
        const created = await storage.createProfileQuestions(validatedData);
        res.json(created);
      }
    } catch (error) {
      console.error("Error saving profile questions:", error);
      res.status(500).json({ message: "Failed to save profile questions" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      res.json({
        totalMatches: 0,
        scheduledMeetings: 0,
        completedMeetings: 0,
        profileCompletion: 75
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Matches endpoints
  app.get('/api/matches', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const matches = await storage.getMatchesByUser(userId);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  // Meetings endpoints
  app.get('/api/meetings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const meetings = await storage.getMeetingsByUser(userId);
      res.json(meetings);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      res.status(500).json({ message: "Failed to fetch meetings" });
    }
  });

  // Settings endpoints
  app.get('/api/settings/public', async (req, res) => {
    try {
      res.json({
        appName: "DAA Monthly Matching",
        nextMatchingDate: "2025-07-01",
        matchingDay: 1
      });
    } catch (error) {
      console.error("Error fetching public settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.get('/api/admin/settings', isAuthenticated, async (req: any, res) => {
    try {
      res.json({
        appName: "DAA Monthly Matching",
        nextMatchingDate: "2025-07-01",
        matchingDay: 1,
        monthlyFocusGoals: ["Learning technical skills", "Building data projects", "Job hunting", "Networking"]
      });
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      res.status(500).json({ message: "Failed to fetch admin settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}