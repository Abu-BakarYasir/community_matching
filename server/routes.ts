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

  const httpServer = createServer(app);
  return httpServer;
}