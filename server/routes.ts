import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { requireSuperAdmin, requireAdmin } from "./auth";
import { insertUserSchema, insertProfileQuestionsSchema, insertMeetingSchema, insertAvailabilitySchema } from "@shared/schema";

import { schedulerService } from "./services/scheduler";
import { timeSlotService } from "./services/timeSlots";
import { z } from "zod";



export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit authentication
  await setupAuth(app);

  // Testing endpoints for role switching (development only)
  if (process.env.NODE_ENV === 'development') {
    app.post('/api/test/switch-user', async (req, res) => {
      try {
        const testUser = req.body;
        
        // Store test user in session for development testing
        (req.session as any).testUser = testUser;
        
        // Create/update the test user in database with proper roles
        const testUserData = {
          id: testUser.id,
          email: testUser.email,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
  
        };
        
        // Set organization and admin status based on test user type
        if (testUser.id === 'test-super-admin') {
          testUserData.isSuperAdmin = true;
          testUserData.organizationId = null;
        } else if (testUser.id === 'test-daa-admin') {
          testUserData.isAdmin = true;
          testUserData.organizationId = 2; // DAA organization
        } else if (testUser.id.startsWith('test-daa-user')) {
          testUserData.organizationId = 2; // DAA organization
        }
        
        await storage.upsertUser(testUserData);
        
        res.json({ message: 'Test user set', user: testUser });
      } catch (error) {
        console.error('Error switching user:', error);
        res.status(500).json({ message: 'Failed to switch user' });
      }
    });

    app.post('/api/test/clear-user', async (req, res) => {
      try {
        delete (req.session as any).testUser;
        res.json({ message: 'Test mode cleared' });
      } catch (error) {
        res.status(500).json({ message: 'Failed to clear test mode' });
      }
    });
  }

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

      // Get organization name for header display
      let organizationName = "Community";
      if (user.organizationId) {
        const organization = await storage.getOrganization(user.organizationId);
        if (organization) {
          organizationName = organization.name;
        }
      }
      
      console.log("Returning user data:", { id: user.id, email: user.email, isAdmin: user.isAdmin });
      res.json({
        ...user,
        organizationName
      });
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

      // Get organization name for header display
      let organizationName = "Community";
      if (user.organizationId) {
        const organization = await storage.getOrganization(user.organizationId);
        if (organization) {
          organizationName = organization.name;
        }
      }
      
      console.log("Returning user data via /me:", { id: user.id, email: user.email, isAdmin: user.isAdmin });
      res.json({
        ...user,
        organizationName
      });
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
        linkedinUrl: req.body.linkedinUrl
      };
      
      console.log("Profile update request:", { userId, updateData });
      const user = await storage.updateUser(userId, updateData);
      console.log("Profile updated successfully:", user);
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

  // User opt-in/opt-out endpoint
  app.patch('/api/user/opt-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { isActive } = req.body;
      
      const user = await storage.updateUser(userId, { isActive });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ success: true, isActive: user.isActive });
    } catch (error) {
      console.error("Error updating opt-in status:", error);
      res.status(500).json({ message: "Failed to update opt-in status" });
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

// In-memory settings storage for demo (in production, this would be in database)
let adminSettings = {
  appName: "DAA Monthly Matching",
  nextMatchingDate: "2025-07-01",
  matchingDay: 1,
  monthlyFocusGoals: ["Learning technical skills", "Building data projects", "Job hunting", "Networking"],
  googleMeetLink: "https://meet.google.com/wnf-cjab-twp",
  preventMeetingOverlap: true,
  weights: {
    industry: 35,
    company: 20,
    goals: 30,
    jobTitle: 15
  }
};

// Settings endpoints
app.get('/api/settings/public', async (req, res) => {
  try {
    console.log("Public settings request - current adminSettings:", adminSettings);
    res.json({
      appName: adminSettings.appName,
      nextMatchingDate: adminSettings.nextMatchingDate,
      matchingDay: adminSettings.matchingDay
    });
  } catch (error) {
    console.error("Error fetching public settings:", error);
    res.status(500).json({ message: "Failed to fetch settings" });
  }
});

  // Get organization details by slug for signup page
  app.get('/api/organizations/:slug', async (req: any, res) => {
    try {
      const { slug } = req.params;
      console.log("Looking for organization with slug:", slug);
      
      const organizations = await storage.getAllOrganizations();
      console.log("Available organizations:", organizations.map(o => ({ id: o.id, name: o.name, slug: o.slug })));
      
      const organization = organizations.find(org => 
        (org.slug && org.slug.toLowerCase() === slug.toLowerCase()) ||
        org.name.toLowerCase().replace(/[^a-z0-9]/g, '') === slug.toLowerCase()
      );
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found", availableOrgs: organizations.map(o => o.slug || o.name.toLowerCase().replace(/[^a-z0-9]/g, '')) });
      }
      
      // Return public organization info (no sensitive data)
      res.json({
        id: organization.id,
        name: organization.name,
        domain: organization.domain,
        isActive: organization.isActive,
        settings: {
          appName: organization.settings?.appName || organization.name
        }
      });
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  app.get('/api/admin/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.organizationId) {
        return res.json(adminSettings); // Fallback to default settings
      }

      const organization = await storage.getOrganization(user.organizationId);
      if (!organization) {
        return res.json(adminSettings); // Fallback to default settings
      }

      // Return organization settings
      const settings = {
        appName: organization.settings?.appName || organization.name,
        nextMatchingDate: "2025-07-01",
        matchingDay: organization.settings?.matchingDay || 1,
        monthlyGoals: organization.settings?.monthlyGoals || ["Learning technical skills", "Building data projects", "Job hunting", "Networking"],
        googleMeetLink: organization.settings?.googleMeetLink || "https://meet.google.com/new",
        preventMeetingOverlap: organization.settings?.preventMeetingOverlap || true,
        weights: organization.settings?.weights || { industry: 35, company: 20, networkingGoals: 30, jobTitle: 15 }
      };
      res.json(settings);
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      res.status(500).json({ message: "Failed to fetch admin settings" });
    }
  });

  // Admin API endpoints - only show users from admin's organization
  app.get('/api/admin/users', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const admin = await storage.getUser(userId);
      
      if (!admin || !admin.organizationId) {
        return res.json([]);
      }
      
      // Get all users from the admin's organization
      const allUsers = await storage.getAllUsers();
      const organizationUsers = allUsers.filter(user => user.organizationId === admin.organizationId);
      
      res.json(organizationUsers);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/matches', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const admin = await storage.getUser(userId);
      
      if (!admin || !admin.organizationId) {
        return res.json([]);
      }
      
      // Get matches only for users in the admin's organization
      const allMatches = await storage.getAllMatches();
      const organizationMatches = allMatches.filter(match => 
        match.user1.organizationId === admin.organizationId && 
        match.user2.organizationId === admin.organizationId
      );
      
      res.json(organizationMatches);
    } catch (error) {
      console.error("Error fetching admin matches:", error);
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  app.get('/api/admin/meetings', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const admin = await storage.getUser(userId);
      
      if (!admin || !admin.organizationId) {
        return res.json([]);
      }
      
      // Get meetings only for users in the admin's organization
      const allMeetings = await storage.getAllMeetings();
      const organizationMeetings = allMeetings.filter(meeting => 
        meeting.match?.user1?.organizationId === admin.organizationId && 
        meeting.match?.user2?.organizationId === admin.organizationId
      );
      
      res.json(organizationMeetings);
    } catch (error) {
      console.error("Error fetching admin meetings:", error);
      res.status(500).json({ message: "Failed to fetch meetings" });
    }
  });

  // Admin settings update endpoint
  app.patch('/api/admin/settings', isAuthenticated, async (req: any, res) => {
    try {
      const updates = req.body;
      console.log("Admin settings update request:", updates);
      
      // Update the in-memory settings
      adminSettings = { ...adminSettings, ...updates };
      
      console.log("Updated admin settings:", adminSettings);
      
      res.json({ 
        message: "Settings updated successfully",
        settings: adminSettings
      });
    } catch (error) {
      console.error("Error updating admin settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Super Admin API endpoints
  app.get('/api/super-admin/organizations', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const organizations = await storage.getAllOrganizations();
      res.json(organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  app.post('/api/super-admin/organizations', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const { name, slug, description } = req.body;
      
      if (!name || !slug) {
        return res.status(400).json({ message: "Name and slug are required" });
      }

      // Check if slug already exists
      const existingOrgs = await storage.getAllOrganizations();
      const slugExists = existingOrgs.some(org => 
        (org.slug && org.slug.toLowerCase() === slug.toLowerCase()) ||
        org.name.toLowerCase().replace(/[^a-z0-9]/g, '') === slug.toLowerCase()
      );

      if (slugExists) {
        return res.status(400).json({ message: "Community slug already exists" });
      }

      const organizationData = {
        name,
        slug,
        description: description || "",
        adminId: "", // Will be set when an admin is assigned
        domain: `${slug}.matches.community`,
        isActive: true,
        settings: {
          appName: name,
          matchingDay: 1,
          monthlyGoals: ["Learning technical skills", "Building data projects", "Job hunting", "Networking"],
          googleMeetLink: "https://meet.google.com/new",
          preventMeetingOverlap: true,
          weights: { industry: 35, company: 20, networkingGoals: 30, jobTitle: 15 }
        }
      };

      const newOrganization = await storage.createOrganization(organizationData);
      res.status(201).json(newOrganization);
    } catch (error) {
      console.error("Error creating community:", error);
      res.status(500).json({ message: "Failed to create community" });
    }
  });

  app.get('/api/super-admin/users', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/super-admin/stats', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      const organizations = await storage.getAllOrganizations();
      const stats = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.isActive).length,
        adminUsers: users.filter(u => u.isAdmin).length,
        superAdminUsers: users.filter(u => u.isSuperAdmin).length,
        totalCommunities: organizations.length,
        activeCommunities: organizations.filter(o => o.isActive).length,
      };
      res.json(stats);
    } catch (error) {
      console.error("Error fetching platform stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.patch('/api/super-admin/users/:userId/super-admin', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { isSuperAdmin } = req.body;
      
      const updatedUser = await storage.updateUser(userId, { isSuperAdmin });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating super admin status:", error);
      res.status(500).json({ message: "Failed to update super admin status" });
    }
  });

  // Admin trigger matching endpoint
  app.post('/api/admin/trigger-matching', isAuthenticated, async (req: any, res) => {
    try {
      // For now, just simulate matching process
      console.log("Manual matching triggered by admin");
      
      res.json({ 
        message: "Matching process started successfully",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error triggering matching:", error);
      res.status(500).json({ message: "Failed to trigger matching" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}