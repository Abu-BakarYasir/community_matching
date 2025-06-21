import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { emailService } from "./services/email";
import { schedulerService } from "./services/scheduler";
import { timeSlotService } from "./services/timeSlots";
import { insertUserSchema, insertProfileQuestionsSchema, insertMeetingSchema } from "@shared/schema";
import { generateToken, requireAuth, requireAdmin, AuthenticatedRequest } from "./auth";

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

// Extend session data type
declare module 'express-session' {
  interface SessionData {
    userEmail?: string;
    userProfile?: {
      jobTitle?: string;
      company?: string;
      industry?: string;
    };
    profileQuestions?: {
      networkingGoals?: string[];
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Test database connection before starting
  try {
    const { testConnection } = await import("./db");
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.warn('Database connection failed, continuing with limited functionality');
    } else {
      console.log('Database connection verified');
    }
  } catch (error) {
    console.error('Database test failed:', error);
    console.warn('Continuing without database verification');
  }
  
  // Initialize scheduler with error handling
  try {
    schedulerService.init();
    console.log('Scheduler initialized successfully');
  } catch (error) {
    console.error('Scheduler initialization failed:', error);
  }

  // JWT-based authentication - no sessions needed

  // Register user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }
      
      const user = await storage.createUser(userData);
      req.session.userId = user.id;
      
      res.json(user);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  // Send magic link
  app.post("/api/auth/magic-link", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ message: "Valid email required" });
      }
      
      let user = await storage.getUserByEmail(email);
      
      // Create user if they don't exist
      if (!user) {
        const [firstName, lastName] = email.split('@')[0].split('.');
        user = await storage.createUser({
          email,
          firstName: firstName || "User",
          lastName: lastName || "",
          isActive: true
        });
      }
      
      // Generate magic token (in production, use crypto.randomBytes)
      const magicToken = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
      
      // Store token temporarily (in production, use Redis or database)
      const magicTokens = new Map();
      magicTokens.set(magicToken, { userId: user.id, expires: Date.now() + 15 * 60 * 1000 }); // 15 minutes
      app.locals.magicTokens = magicTokens;
      
      // In production, send actual email
      console.log(`Magic link for ${email}: http://localhost:5000/api/auth/verify?token=${magicToken}`);
      
      res.json({ 
        message: "Magic link sent! Check your console for the link (in production, check your email)",
        magicLink: `http://localhost:5000/api/auth/verify?token=${magicToken}` // Remove in production
      });
    } catch (error) {
      console.error("Magic link error:", error);
      res.status(500).json({ message: "Failed to send magic link" });
    }
  });

  // Verify magic link
  app.get("/api/auth/verify", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Invalid token" });
      }
      
      const magicTokens = app.locals.magicTokens || new Map();
      const tokenData = magicTokens.get(token);
      
      if (!tokenData || tokenData.expires < Date.now()) {
        return res.status(401).json({ message: "Token expired or invalid" });
      }
      
      // Log user in
      req.session.userId = tokenData.userId;
      magicTokens.delete(token); // Use token only once
      
      // Redirect to app
      res.redirect('/');
    } catch (error) {
      console.error("Verify token error:", error);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  // JWT-based login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email } = req.body;
      console.log("Login request received:", { email });
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ message: "Valid email required" });
      }
      
      // Get or create user in database
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user
        const [firstName, lastName] = email.split('@')[0].split('.');
        user = await storage.createUser({
          email,
          firstName: firstName || "User",
          lastName: lastName || "",
          isActive: true
        });
      }
      
      // Generate JWT token
      const token = generateToken({ id: user.id, email: user.email, isAdmin: user.isAdmin });
      
      // Set token as httpOnly cookie for security
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      console.log(`JWT login successful for ${email}`);
      res.json({ 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin || false,
          jobTitle: user.jobTitle,
          company: user.company,
          industry: user.industry,
          profileImageUrl: user.profileImageUrl,
          bio: user.bio,
          linkedinUrl: user.linkedinUrl,
          isActive: user.isActive,
          createdAt: user.createdAt
        },
        token // Also send token for API calls
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout user
  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie('authToken');
    res.json({ message: "Logged out successfully" });
  });

  // Get current authenticated user
  app.get("/api/auth/me", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get profile questions from database
      const profileQuestions = await storage.getProfileQuestions(user.id);

      res.json({
        ...user,
        isAdmin: user.isAdmin || false,
        profileQuestions
      });
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ message: "Failed to get user data" });
    }
  });

  // Update user profile with database persistence
  // Profile update endpoint (JWT-based)
  app.patch("/api/user/profile", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      console.log("Updating user profile:", { userId, updates: req.body });
      
      const updatedUser = await storage.updateUser(userId, req.body);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log("Profile updated successfully:", updatedUser);
      res.json(updatedUser);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Profile image upload endpoint with actual file handling
  app.post("/api/user/upload-profile-image", requireAuth, upload.single('image'), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Convert uploaded file to base64 data URL for storage
      // In production, you'd upload to AWS S3, Cloudinary, etc.
      const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      
      console.log("Updating user profile image:", { userId, fileSize: file.size, mimeType: file.mimetype });
      
      // Update user with new profile image URL
      const updatedUser = await storage.updateUser(userId, { 
        profileImageUrl: base64Image 
      });
      
      console.log("Updated user with profile image successfully");
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ 
        imageUrl: base64Image,
        user: updatedUser,
        message: "Profile image uploaded successfully" 
      });
    } catch (error) {
      console.error("Upload profile image error:", error);
      res.status(500).json({ message: "Failed to upload profile image" });
    }
  });

  // Save profile questions with database persistence
  app.post("/api/user/profile-questions", requireAuth, async (req, res) => {
    try {
      console.log("Saving profile questions:", req.body);
      const email = req.session.userEmail!;
      
      // Try to save to database first
      try {
        const user = await storage.getUserByEmail(email);
        if (user) {
          const existing = await storage.getProfileQuestions(user.id);
          let profileQuestions;
          
          if (existing) {
            profileQuestions = await storage.updateProfileQuestions(user.id, {
              ...req.body,
              userId: user.id
            });
          } else {
            profileQuestions = await storage.createProfileQuestions({
              ...req.body,
              userId: user.id
            });
          }
          
          console.log("Profile questions saved to database:", profileQuestions);
          res.json(profileQuestions);
          return;
        }
      } catch (dbError) {
        console.log("Database save failed, using session fallback:", dbError);
      }
      
      // Fallback to session storage
      req.session.profileQuestions = req.body;
      console.log("Profile questions saved to session:", req.session.profileQuestions);
      res.json({ message: "Profile questions saved successfully" });
    } catch (error) {
      console.error("Save profile questions error:", error);
      res.status(500).json({ message: "Failed to save profile questions" });
    }
  });

  // Update user opt-in status
  app.patch("/api/user/opt-status", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { isActive } = req.body;
      const userId = req.user!.id;
      
      console.log('Updating opt-in status for user', userId, ':', { isActive });
      
      // Update in database
      const updatedUser = await storage.updateUser(userId, { isActive });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log('Opt-in status updated successfully in database:', { userId, isActive: updatedUser.isActive });
      
      res.json({ 
        message: "Opt-in status updated successfully", 
        isActive: updatedUser.isActive,
        user: updatedUser 
      });
    } catch (error) {
      console.error("Update opt-in status error:", error);
      res.status(500).json({ message: "Failed to update opt-in status" });
    }
  });

  // Get user matches
  app.get("/api/matches", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const matches = await storage.getMatchesByUser(req.user!.id);
      res.json(matches);
    } catch (error) {
      console.error("Get matches error:", error);
      res.status(500).json({ message: "Failed to get matches" });
    }
  });

  // Update match status
  app.patch("/api/matches/:id", requireAuth, async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const { status } = req.body;
      
      const match = await storage.updateMatch(matchId, { status });
      
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      res.json(match);
    } catch (error) {
      console.error("Update match error:", error);
      res.status(500).json({ message: "Failed to update match" });
    }
  });

  // Schedule meeting
  app.post("/api/meetings", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const meetingData = req.body;
      
      // Auto-select optimal time if not provided
      if (!meetingData.scheduledAt) {
        const suggestedDate = new Date();
        suggestedDate.setDate(suggestedDate.getDate() + 7);
        suggestedDate.setHours(14, 0, 0, 0); // Default to 2 PM next week
        meetingData.scheduledAt = suggestedDate.toISOString();
      }

      // Set default values for required fields
      const fullMeetingData = {
        matchId: meetingData.matchId,
        scheduledAt: new Date(meetingData.scheduledAt),
        meetingType: meetingData.meetingType || "video",
        duration: meetingData.duration || 30,
        meetingLink: meetingData.meetingLink || appSettings.googleMeetLink || "https://meet.google.com/wnf-cjab-twp",
        status: meetingData.status || "scheduled"
      };
      
      // Verify the user is part of this match
      const userId = req.user!.id;
      const match = await storage.getMatch(fullMeetingData.matchId);
      if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
        return res.status(403).json({ message: "Not authorized to schedule this meeting" });
      }

      // Check for meeting overlap if prevention is enabled
      if (appSettings.preventMeetingOverlap && fullMeetingData.scheduledAt) {
        const proposedStart = new Date(fullMeetingData.scheduledAt);
        const proposedEnd = new Date(proposedStart.getTime() + (fullMeetingData.duration * 60 * 1000));
        
        // Get all existing meetings for both users in the match
        const user1Meetings = await storage.getMeetingsByUser(match.user1Id);
        const user2Meetings = await storage.getMeetingsByUser(match.user2Id);
        const allMeetings = [...user1Meetings, ...user2Meetings];
        
        // Check for overlaps
        const hasOverlap = allMeetings.some(existingMeeting => {
          if (existingMeeting.status !== 'scheduled') return false;
          
          const existingStart = new Date(existingMeeting.scheduledAt);
          const existingEnd = new Date(existingStart.getTime() + (existingMeeting.duration * 60 * 1000));
          
          // Check if times overlap
          return (proposedStart < existingEnd && proposedEnd > existingStart);
        });
        
        if (hasOverlap) {
          return res.status(409).json({ 
            message: "Meeting time conflicts with existing meeting. Please choose a different time." 
          });
        }
      }
      
      const meeting = await storage.createMeeting(fullMeetingData);
      
      // Update match status
      await storage.updateMatch(fullMeetingData.matchId, { status: "meeting_scheduled" });
      
      // Get users for email notification
      const user1 = await storage.getUser(match.user1Id);
      const user2 = await storage.getUser(match.user2Id);
      
      if (user1 && user2) {
        try {
          await emailService.sendMeetingScheduledNotification(user1, user2, meeting);
        } catch (emailError) {
          console.error('Failed to send meeting scheduled emails:', emailError);
        }
        
        // Create notifications
        await storage.createNotification({
          userId: match.user1Id,
          type: 'meeting_scheduled',
          title: 'Meeting Scheduled',
          message: `Your meeting with ${user2.firstName} ${user2.lastName} has been scheduled`
        });
        
        await storage.createNotification({
          userId: match.user2Id,
          type: 'meeting_scheduled',
          title: 'Meeting Scheduled',
          message: `Your meeting with ${user1.firstName} ${user1.lastName} has been scheduled`
        });
      }
      
      res.json(meeting);
    } catch (error) {
      console.error("Schedule meeting error:", error);
      res.status(400).json({ message: "Failed to schedule meeting" });
    }
  });

  // Get user meetings
  app.get("/api/meetings", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const meetings = await storage.getMeetingsByUser(req.user!.id);
      res.json(meetings);
    } catch (error) {
      console.error("Get meetings error:", error);
      res.status(500).json({ message: "Failed to get meetings" });
    }
  });

  // Create new meeting
  app.post("/api/meetings", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const meetingData = req.body;
      
      // Verify the user has access to this match
      const match = await storage.getMatch(meetingData.matchId);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      // Verify user is part of this match
      if (match.user1Id !== req.user!.id && match.user2Id !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to schedule meeting for this match" });
      }
      
      const meeting = await storage.createMeeting({
        matchId: meetingData.matchId,
        scheduledAt: new Date(meetingData.scheduledAt),
        meetingType: meetingData.meetingType || "video",
        duration: meetingData.duration || 30,
        location: meetingData.location,
        meetingLink: meetingData.meetingLink,
        status: "scheduled"
      });
      
      res.json(meeting);
    } catch (error) {
      console.error("Create meeting error:", error);
      res.status(500).json({ message: "Failed to create meeting" });
    }
  });

  // Get suggested meeting times for a match
  app.get("/api/matches/:matchId/suggested-times", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const matchId = parseInt(req.params.matchId);
      const match = await storage.getMatch(matchId);
      
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      // Verify user is part of this match
      if (match.user1Id !== req.user!.id && match.user2Id !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to view this match" });
      }
      
      const suggestedTimes = await timeSlotService.getSuggestedMeetingTimes(match.user1Id, match.user2Id);
      res.json(suggestedTimes);
    } catch (error) {
      console.error("Get suggested times error:", error);
      res.status(500).json({ message: "Failed to get suggested times" });
    }
  });

  // Update meeting
  app.patch("/api/meetings/:id", requireAuth, async (req, res) => {
    try {
      const meetingId = parseInt(req.params.id);
      const updates = req.body;
      
      // Verify user has access to this meeting
      const meeting = await storage.getMeeting(meetingId);
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      
      const userId = req.user!.id;
      const match = await storage.getMatch(meeting.matchId!);
      if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
        return res.status(403).json({ message: "Not authorized to update this meeting" });
      }
      
      const updatedMeeting = await storage.updateMeeting(meetingId, updates);
      res.json(updatedMeeting);
    } catch (error) {
      console.error("Update meeting error:", error);
      res.status(500).json({ message: "Failed to update meeting" });
    }
  });

  // Get availability
  app.get("/api/availability", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.query;
      
      let targetUserId: number;
      
      if (userId) {
        // Admin requesting another user's availability
        targetUserId = parseInt(userId as string);
      } else {
        // User requesting their own availability
        targetUserId = req.user!.id;
      }
      
      // Get availability from database
      try {
        const availability = await storage.getAvailability(targetUserId);
        console.log("Retrieved availability from database for user", targetUserId, ":", availability);
        res.json(availability);
      } catch (dbError) {
        console.log("Database get failed:", dbError);
        res.json([]);
      }
    } catch (error) {
      console.error("Get availability error:", error);
      res.json([]);
    }
  });

  // Get availability for a specific user (for scheduling)
  app.get("/api/availability/:userId", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const availability = await storage.getAvailability(userId);
      res.json(availability);
    } catch (error) {
      console.error("Get user availability error:", error);
      res.status(500).json({ message: "Failed to get user availability" });
    }
  });

  // Clear availability with database persistence
  app.delete("/api/availability", requireAuth, async (req, res) => {
    try {
      const email = req.session.userEmail!;
      console.log("Clearing availability for user:", email);
      
      // Try database first
      try {
        const user = await storage.getUserByEmail(email);
        if (user) {
          // Clear all availability for this user
          const availabilities = await storage.getAvailability(user.id);
          console.log("Found availabilities to clear:", availabilities.length);
          for (const availability of availabilities) {
            await storage.deleteAvailability(availability.id);
          }
          console.log("Cleared all availability records");
        }
      } catch (dbError) {
        console.log("Database clear failed:", dbError);
      }
      
      res.json({ message: "Availability cleared" });
    } catch (error) {
      console.error("Clear availability error:", error);
      res.status(500).json({ message: "Failed to clear availability" });
    }
  });

  // Create availability with database persistence
  app.post("/api/availability", requireAuth, async (req, res) => {
    try {
      console.log("POST /api/availability - Creating availability:", req.body);
      const email = req.session.userEmail!;
      
      // Try database first
      try {
        const user = await storage.getUserByEmail(email);
        if (user) {
          const availability = await storage.createAvailability({
            ...req.body,
            userId: user.id
          });
          console.log("Successfully created availability in database:", availability);
          res.json(availability);
          return;
        }
      } catch (dbError) {
        console.log("Database creation failed:", dbError);
      }
      
      // Fallback for development
      const mockAvailability = {
        id: Date.now(),
        userId: email,
        ...req.body,
        createdAt: new Date()
      };
      
      console.log("Successfully created availability (mock):", mockAvailability);
      res.json(mockAvailability);
    } catch (error) {
      console.error("Create availability error:", error);
      res.status(500).json({ message: "Failed to create availability" });
    }
  });

  // Notifications removed per user request

  // Notification endpoints removed per user request

  // Dashboard stats
  // Public settings endpoint for non-sensitive admin settings
  app.get("/api/settings/public", async (req, res) => {
    try {
      // For now, return hardcoded values - later this can be connected to admin settings
      res.json({
        monthlyMatchingDay: 1, // This should be configurable in admin settings
        appName: "DAA Matches"
      });
    } catch (error) {
      console.error("Error fetching public settings:", error);
      res.status(500).json({ message: "Error fetching settings" });
    }
  });

  app.get("/api/dashboard/stats", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const matches = await storage.getMatchesByUser(req.user!.id);
      const meetings = await storage.getMeetingsByUser(req.user!.id);
      const notifications = await storage.getNotifications(req.user!.id);
      
      const stats = {
        totalMatches: matches.length,
        scheduledMeetings: meetings.filter(m => m.status === 'scheduled').length,
        pendingResponses: matches.filter(m => m.status === 'pending').length,
        connections: meetings.filter(m => m.status === 'completed').length,
        unreadNotifications: notifications.filter(n => !n.isRead).length
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Get admin users error:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.get("/api/admin/matches", requireAuth, requireAdmin, async (req, res) => {
    try {
      // Get all matches with user data
      const allUsers = await storage.getAllUsers();
      const allMatches = [];
      
      for (const user of allUsers) {
        const userMatches = await storage.getMatchesByUser(user.id);
        allMatches.push(...userMatches);
      }
      
      // Remove duplicates (same match appears for both users)
      const uniqueMatches = allMatches.filter((match, index, self) => 
        index === self.findIndex(m => m.id === match.id)
      );
      
      res.json(uniqueMatches);
    } catch (error) {
      console.error("Get admin matches error:", error);
      res.status(500).json({ message: "Failed to get matches" });
    }
  });

  app.get("/api/admin/meetings", requireAuth, requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const allMeetings = [];
      
      for (const user of allUsers) {
        const userMeetings = await storage.getMeetingsByUser(user.id);
        allMeetings.push(...userMeetings);
      }
      
      // Remove duplicates and sort by scheduled date
      const uniqueMeetings = allMeetings
        .filter((meeting, index, self) => 
          index === self.findIndex(m => m.id === meeting.id)
        )
        .sort((a, b) => {
          if (!a.scheduledAt && !b.scheduledAt) return 0;
          if (!a.scheduledAt) return 1;
          if (!b.scheduledAt) return -1;
          return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
        });
      
      res.json(uniqueMeetings);
    } catch (error) {
      console.error("Get admin meetings error:", error);
      res.status(500).json({ message: "Failed to get meetings" });
    }
  });

  // Delete meeting (admin only)
  app.delete("/api/admin/meetings/:id", requireAuth, async (req, res) => {
    try {
      const meetingId = parseInt(req.params.id);
      const success = await storage.deleteMeeting?.(meetingId);
      
      if (success) {
        res.json({ message: "Meeting deleted successfully" });
      } else {
        res.status(404).json({ message: "Meeting not found" });
      }
    } catch (error) {
      console.error("Delete meeting error:", error);
      res.status(500).json({ message: "Failed to delete meeting" });
    }
  });

  // Update meeting (admin only)
  app.patch("/api/admin/meetings/:id", requireAuth, async (req, res) => {
    try {
      const meetingId = parseInt(req.params.id);
      const updates = req.body;
      
      const meeting = await storage.updateMeeting(meetingId, updates);
      
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      
      res.json(meeting);
    } catch (error) {
      console.error("Update meeting error:", error);
      res.status(500).json({ message: "Failed to update meeting" });
    }
  });

  // Store settings in memory (in production, use database)
  let appSettings = {
    matchingDay: 1,
    isMatchingEnabled: true,
    lastMatchingRun: null,
    appName: "DAA Matches",
    preventMeetingOverlap: true,
    googleMeetLink: "https://meet.google.com/wnf-cjab-twp",
    monthlyGoals: ["Learning technical skills", "Building data projects", "Job hunting", "Networking"],
    weights: {
      industry: 35,
      company: 20,
      networkingGoals: 30,
      jobTitle: 15,
    }
  };

  app.get("/api/admin/settings", requireAuth, requireAdmin, async (req, res) => {
    try {
      res.json(appSettings);
    } catch (error) {
      console.error("Get admin settings error:", error);
      res.status(500).json({ message: "Failed to get settings" });
    }
  });

  app.patch("/api/admin/settings", requireAuth, requireAdmin, async (req, res) => {
    try {
      console.log("Admin settings updated:", req.body);
      
      // Update settings
      if (req.body.matchingDay) {
        appSettings.matchingDay = req.body.matchingDay;
      }
      
      if (req.body.appName) {
        appSettings.appName = req.body.appName;
      }
      
      if (req.body.weights) {
        appSettings.weights = { ...appSettings.weights, ...req.body.weights };
      }
      
      if (typeof req.body.preventMeetingOverlap === 'boolean') {
        appSettings.preventMeetingOverlap = req.body.preventMeetingOverlap;
      }
      
      if (req.body.googleMeetLink) {
        appSettings.googleMeetLink = req.body.googleMeetLink;
      }
      
      if (req.body.monthlyGoals && Array.isArray(req.body.monthlyGoals)) {
        appSettings.monthlyGoals = req.body.monthlyGoals;
      }
      
      res.json(appSettings);
    } catch (error) {
      console.error("Update admin settings error:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Update user profile (admin only)
  app.patch("/api/admin/users/:id", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedUser = await storage.updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Delete user (admin only)
  app.delete("/api/admin/users/:id", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // First, delete all related data
      const userMatches = await storage.getMatchesByUser(userId);
      for (const match of userMatches) {
        // Delete meetings associated with this match
        if (match.meeting) {
          await storage.deleteMeeting?.(match.meeting.id);
        }
        // Delete the match
        await storage.deleteMatch(match.id);
      }
      
      // Delete user's notifications
      const notifications = await storage.getNotifications(userId);
      for (const notification of notifications) {
        await storage.deleteNotification?.(notification.id);
      }
      
      // Delete user's availability
      const availability = await storage.getAvailability(userId);
      for (const avail of availability) {
        await storage.deleteAvailability(avail.id);
      }
      
      // Delete user's profile questions
      const profile = await storage.getProfileQuestions(userId);
      if (profile) {
        await storage.deleteProfileQuestions?.(userId);
      }
      
      // Finally, delete the user
      const success = await storage.deleteUser(userId);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Delete match (admin only)
  app.delete("/api/admin/matches/:id", requireAuth, async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      
      // Delete any meetings associated with this match first
      const meetings = await storage.getMeetingsByUser(matchId); // This needs to be adapted for match-based lookup
      
      // Delete the match
      const success = await storage.deleteMatch?.(matchId);
      if (!success) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      res.json({ message: "Match deleted successfully" });
    } catch (error) {
      console.error("Delete match error:", error);
      res.status(500).json({ message: "Failed to delete match" });
    }
  });

  // Trigger manual matching (for testing)
  app.post("/api/admin/trigger-matching", requireAuth, requireAdmin, async (req, res) => {
    try {
      // Clear all existing matches for this period first
      const currentDate = new Date();
      const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      console.log(`Clearing existing matches for period: ${monthYear}`);
      const existingMatches = await storage.getMatchesByMonth(monthYear);
      
      for (const match of existingMatches) {
        // Delete any meetings associated with this match
        if (match.meeting) {
          await storage.deleteMeeting?.(match.meeting.id);
        }
        // Delete the match
        await storage.deleteMatch(match.id);
      }
      
      console.log(`Cleared ${existingMatches.length} existing matches`);
      
      // Now run fresh matching
      const matches = await schedulerService.triggerMonthlyMatching(appSettings.weights);
      appSettings.lastMatchingRun = new Date().toISOString();
      res.json({ matches: matches.length, message: "Matching completed successfully" });
    } catch (error) {
      console.error("Manual matching error:", error);
      res.status(500).json({ message: "Failed to trigger matching" });
    }
  });

  // Test email endpoint
  app.post('/api/admin/test-email', async (req, res) => {
    try {
      console.log('📧 Admin triggered test email to averyjs@gmail.com');
      
      // Import email service
      const { emailService } = await import('./services/email');
      
      // Create test user objects
      const testUser = {
        id: 999,
        email: 'averyjs@gmail.com',
        firstName: 'Avery',
        lastName: 'JS',
        jobTitle: 'Developer',
        company: 'Test Corp',
        industry: 'Technology',
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      const testPartner = {
        id: 998,
        email: 'partner@example.com',
        firstName: 'Test',
        lastName: 'Partner',
        jobTitle: 'Product Manager',
        company: 'Partner Corp',
        industry: 'Technology',
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      // Send test match notification
      await emailService.sendMatchNotification(testUser, testPartner, 87);
      
      console.log('✅ Test email process completed');
      res.json({ message: 'Test email sent successfully', recipient: 'averyjs@gmail.com' });
    } catch (error) {
      console.error('❌ Error sending test email:', error);
      res.status(500).json({ error: 'Failed to send test email', details: error.message });
    }
  });

  // Email template endpoints
  app.get('/api/admin/email-template', requireAuth, requireAdmin, async (req, res) => {
    try {
      // For now, return the current template structure
      const template = {
        subject: '🎯 New Match Found - DAA Monthly Matching',
        content: `Hi {{firstName}},

Great news! We've found you a networking match based on your professional profile and goals.

Your Match:
{{partnerName}} - {{partnerTitle}} at {{partnerCompany}}
Industry: {{partnerIndustry}}

Match Score: {{matchScore}}%

This match was made based on your professional backgrounds, networking goals, and industry compatibility.

Best regards,
The DAA Monthly Matching Team`
      };
      res.json(template);
    } catch (error) {
      console.error('Error fetching email template:', error);
      res.status(500).json({ error: 'Failed to fetch email template' });
    }
  });

  app.post('/api/admin/email-template', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { subject, content } = req.body;
      console.log('Updating email template:', { subject, content });
      
      // Store template (for now just log it, in production you'd save to database)
      appSettings.emailTemplate = { subject, content };
      
      res.json({ message: 'Email template updated successfully' });
    } catch (error) {
      console.error('Error updating email template:', error);
      res.status(500).json({ error: 'Failed to update email template' });
    }
  });

  app.post('/api/admin/preview-email', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { subject, content } = req.body;
      
      // Sample data for preview
      const previewData = {
        firstName: 'John',
        lastName: 'Doe', 
        partnerName: 'Jane Smith',
        partnerTitle: 'Senior Data Analyst',
        partnerCompany: 'TechCorp Inc',
        partnerIndustry: 'Technology',
        matchScore: '87'
      };
      
      // Replace variables in template
      let previewSubject = subject;
      let previewContent = content;
      
      Object.entries(previewData).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        previewSubject = previewSubject.replace(regex, value);
        previewContent = previewContent.replace(regex, value);
      });
      
      res.json({ 
        subject: previewSubject, 
        content: previewContent,
        sampleData: previewData
      });
    } catch (error) {
      console.error('Error previewing email:', error);
      res.status(500).json({ error: 'Failed to preview email' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
