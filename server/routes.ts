import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { emailService } from "./services/email";
import { schedulerService } from "./services/scheduler";
import { insertUserSchema, insertProfileQuestionsSchema, insertMeetingSchema } from "@shared/schema";
import { z } from "zod";

// Extend session data type
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize scheduler
  schedulerService.init();

  // Auth middleware - simple session-based auth
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

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

  // Login user
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      req.session.userId = user.id;
      res.json(user);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout user
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const profileQuestions = await storage.getProfileQuestions(user.id);
      const availability = await storage.getAvailability(user.id);
      
      res.json({
        ...user,
        profileQuestions,
        availability
      });
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ message: "Failed to get user data" });
    }
  });

  // Update user profile
  app.patch("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      const userId = req.session.userId!;
      const user = await storage.updateUser(userId, updates);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Save profile questions
  app.post("/api/user/profile-questions", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const questionsData = insertProfileQuestionsSchema.parse({
        ...req.body,
        userId
      });
      
      // Check if profile questions already exist
      const existing = await storage.getProfileQuestions(userId);
      
      let profileQuestions;
      if (existing) {
        profileQuestions = await storage.updateProfileQuestions(userId, questionsData);
      } else {
        profileQuestions = await storage.createProfileQuestions(questionsData);
      }
      
      res.json(profileQuestions);
    } catch (error) {
      console.error("Save profile questions error:", error);
      res.status(400).json({ message: "Invalid profile questions data" });
    }
  });

  // Get user matches
  app.get("/api/matches", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const matches = await storage.getMatchesByUser(userId);
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
  app.post("/api/meetings", requireAuth, async (req, res) => {
    try {
      const meetingData = insertMeetingSchema.parse(req.body);
      
      // Verify the user is part of this match
      const userId = req.session.userId!;
      const match = await storage.getMatch(meetingData.matchId!);
      if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
        return res.status(403).json({ message: "Not authorized to schedule this meeting" });
      }
      
      const meeting = await storage.createMeeting(meetingData);
      
      // Update match status
      await storage.updateMatch(meetingData.matchId!, { status: "meeting_scheduled" });
      
      // Get users for email notification
      const user1 = await storage.getUser(match.user1Id!);
      const user2 = await storage.getUser(match.user2Id!);
      
      if (user1 && user2) {
        await emailService.sendMeetingScheduledNotification(user1, user2, meeting);
        
        // Create notifications
        await storage.createNotification({
          userId: match.user1Id!,
          type: 'meeting_scheduled',
          title: 'Meeting Scheduled',
          message: `Your meeting with ${user2.firstName} ${user2.lastName} has been scheduled`
        });
        
        await storage.createNotification({
          userId: match.user2Id!,
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
  app.get("/api/meetings", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const meetings = await storage.getMeetingsByUser(userId);
      res.json(meetings);
    } catch (error) {
      console.error("Get meetings error:", error);
      res.status(500).json({ message: "Failed to get meetings" });
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
      
      const userId = req.session.userId!;
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
  app.get("/api/availability", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const availability = await storage.getAvailability(userId);
      res.json(availability);
    } catch (error) {
      console.error("Get availability error:", error);
      res.status(500).json({ message: "Failed to get availability" });
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

  // Update availability
  app.post("/api/availability", requireAuth, async (req, res) => {
    try {
      const { availability } = req.body;
      
      const userId = req.session.userId!;
      
      // Delete existing availability
      const existing = await storage.getAvailability(userId);
      for (const avail of existing) {
        await storage.deleteAvailability(avail.id);
      }
      
      // Create new availability entries
      const newAvailability = [];
      for (const avail of availability) {
        const created = await storage.createAvailability({
          ...avail,
          userId
        });
        newAvailability.push(created);
      }
      
      res.json(newAvailability);
    } catch (error) {
      console.error("Update availability error:", error);
      res.status(500).json({ message: "Failed to update availability" });
    }
  });

  // Get notifications
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const success = await storage.markNotificationAsRead(notificationId);
      
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const matches = await storage.getMatchesByUser(userId);
      const meetings = await storage.getMeetingsByUser(userId);
      const notifications = await storage.getNotifications(userId);
      
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

  // Trigger manual matching (for testing)
  app.post("/api/admin/trigger-matching", async (req, res) => {
    try {
      const matches = await schedulerService.triggerMonthlyMatching();
      res.json({ matches: matches.length, message: "Matching completed successfully" });
    } catch (error) {
      console.error("Manual matching error:", error);
      res.status(500).json({ message: "Failed to trigger matching" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
