import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
// Removed JWT auth imports - using Replit Auth only
import { insertUserSchema, insertProfileQuestionsSchema, insertMeetingSchema, insertAvailabilitySchema } from "@shared/schema";

import { schedulerService } from "./services/scheduler";
import { timeSlotService } from "./services/timeSlots";
import { emailService } from "./services/email";
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

  // Public community creation endpoint (no auth required)
  app.post('/api/public/create-community', async (req, res) => {
    try {
      const { name, slug, adminEmail, description, communitySize } = req.body;
      console.log("Public community creation request:", { name, slug, adminEmail, description, communitySize });
      
      if (!name || !slug || !adminEmail) {
        return res.status(400).json({ message: "Name, slug, and admin email are required" });
      }

      // Check if slug already exists
      const existingOrgs = await storage.getAllOrganizations();
      console.log("Existing organizations:", existingOrgs.map(org => ({ name: org.name, slug: org.slug })));
      
      const slugExists = existingOrgs.some(org => 
        (org.slug && org.slug.toLowerCase() === slug.toLowerCase()) ||
        org.name.toLowerCase().replace(/[^a-z0-9]/g, '') === slug.toLowerCase()
      );

      if (slugExists) {
        console.log("Slug already exists:", slug);
        return res.status(400).json({ message: "A community with this name already exists. Please choose a different name." });
      }

      // Create the organization first
      const organizationData = {
        name,
        slug,
        description: description || `A community for ${name} members to connect through meaningful 1:1 conversations.`,
        domain: `${slug}.matches.community`,
        isActive: true,
        settings: {
          appName: name,
          matchingDay: 15,
          monthlyGoals: ["Learning technical skills", "Building data projects", "Job hunting", "Networking"],
          communityMeetingLink: "https://meet.google.com/new",
          preventMeetingOverlap: true,
          weights: { industry: 35, company: 20, networkingGoals: 30, jobTitle: 15 }
        }
      };

      console.log("Creating organization with data:", organizationData);
      const newOrganization = await storage.createOrganization(organizationData);
      console.log("Successfully created organization:", newOrganization);

      // Check if user already exists with this email
      let adminUser = await storage.getUserByEmail(adminEmail);
      
      if (adminUser) {
        // Update existing user to be admin of this organization
        console.log("Updating existing user to be admin:", adminUser.id);
        adminUser = await storage.updateUser(adminUser.id, { 
          isAdmin: true, 
          organizationId: newOrganization.id 
        });
      } else {
        // Create new admin user
        const userId = `admin-${Date.now()}`;
        console.log("Creating new admin user with ID:", userId);
        
        adminUser = await storage.createUser({
          id: userId,
          email: adminEmail,
          firstName: adminEmail.split('@')[0],
          lastName: "Admin",
          profileImageUrl: null,
          isActive: true,
          isAdmin: true,
          organizationId: newOrganization.id
        });
      }

      // Update organization with admin ID
      console.log("Updating organization with admin ID:", adminUser.id);
      await storage.updateOrganization(newOrganization.id, { adminId: adminUser.id });

      // Create signup URL for the new community
      const signupUrl = `/community/${slug}`;

      console.log("Community creation completed successfully");
      res.status(201).json({ 
        community: newOrganization, 
        adminUser,
        signupUrl,
        message: "Community created successfully! You are now the admin." 
      });
    } catch (error) {
      console.error("Error creating community from homepage - full error:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ 
        message: "Failed to create community", 
        error: error.message,
        details: error.stack
      });
    }
  });

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

  app.post('/api/meetings', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertMeetingSchema.parse(req.body);
      const meeting = await storage.createMeeting(validatedData);
      
      // Send admin notification about new meeting
      try {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        
        if (user?.organizationId) {
          const organization = await storage.getOrganization(user.organizationId);
          if (organization) {
            // Get admin user for this organization
            const allUsers = await storage.getAllUsers();
            const adminUser = allUsers.find(u => 
              u.organizationId === user.organizationId && u.isAdmin
            );
            
            if (adminUser) {
              // Get meeting with match details
              const meetingWithMatch = await storage.getMeeting(meeting.id);
              if (meetingWithMatch) {
                console.log(`📧 Sending admin notification about new meeting to ${adminUser.email}`);
                await emailService.sendAdminMatchSummary(
                  adminUser, 
                  organization.name, 
                  [], // No new matches, just meeting
                  [meetingWithMatch]
                );
              }
            }
          }
        }
      } catch (emailError) {
        console.error('Failed to send admin notification for new meeting:', emailError);
      }
      
      res.json(meeting);
    } catch (error) {
      console.error("Error creating meeting:", error);
      res.status(500).json({ message: "Failed to create meeting" });
    }
  });

  app.patch('/api/meetings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const meetingId = parseInt(req.params.id);
      const updateData = req.body;
      
      console.log("Meeting update request:", { meetingId, updateData });
      
      // Convert scheduledAt to proper date format if provided
      if (updateData.scheduledAt) {
        updateData.scheduledAt = new Date(updateData.scheduledAt);
      }
      
      const updatedMeeting = await storage.updateMeeting(meetingId, updateData);
      
      if (!updatedMeeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      
      // Send admin notification about meeting update
      try {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        
        if (user?.organizationId) {
          const organization = await storage.getOrganization(user.organizationId);
          if (organization) {
            // Get admin user for this organization
            const allUsers = await storage.getAllUsers();
            const adminUser = allUsers.find(u => 
              u.organizationId === user.organizationId && u.isAdmin
            );
            
            if (adminUser) {
              // Get meeting with match details
              const meetingWithMatch = await storage.getMeeting(meetingId);
              if (meetingWithMatch) {
                console.log(`📧 Sending admin notification about meeting update to ${adminUser.email}`);
                await emailService.sendAdminMatchSummary(
                  adminUser, 
                  organization.name, 
                  [], // No new matches, just meeting update
                  [meetingWithMatch]
                );
              }
            }
          }
        }
      } catch (emailError) {
        console.error('Failed to send admin notification for meeting update:', emailError);
      }
      
      console.log("Meeting updated successfully:", updatedMeeting);
      res.json(updatedMeeting);
    } catch (error) {
      console.error("Error updating meeting:", error);
      res.status(500).json({ message: "Failed to update meeting" });
    }
  });

// In-memory settings storage for demo (in production, this would be in database)
let adminSettings = {
  appName: "DAA Monthly Matching",
  nextMatchingDate: "2025-07-01",
  matchingDay: 1,
  monthlyFocusGoals: ["Learning technical skills", "Building data projects", "Job hunting", "Networking"],
  communityMeetingLink: "https://meet.google.com/wnf-cjab-twp",
  preventMeetingOverlap: true,
  showMonthlyGoals: false, // Feature toggle for monthly goals
  weights: {
    industry: 35,
    company: 20,
    goals: 30,
    jobTitle: 15
  },
  defaultFirstName: "New",
  defaultLastName: "Member"
};

// Settings endpoints
app.get('/api/settings/public', isAuthenticated, async (req: any, res) => {
  try {
    // Get user's organization settings from database
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    if (!user?.organizationId) {
      // Fallback to default settings if no organization
      return res.json({
        appName: adminSettings.appName,
        nextMatchingDate: adminSettings.nextMatchingDate,
        matchingDay: adminSettings.matchingDay,
        showMonthlyGoals: adminSettings.showMonthlyGoals
      });
    }

    const organization = await storage.getOrganization(user.organizationId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Return organization settings from database
    const settings = organization.settings || {};
    console.log("Public settings from database:", settings);
    
    res.json({
      appName: settings.appName || organization.name,
      nextMatchingDate: "2025-07-01",
      matchingDay: settings.matchingDay || 15,
      showMonthlyGoals: adminSettings.showMonthlyGoals || false
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
        matchingDay: organization.settings?.matchingDay || 15,
        monthlyGoals: organization.settings?.monthlyGoals || ["Learning technical skills", "Building data projects", "Job hunting", "Networking"],
        communityMeetingLink: organization.settings?.communityMeetingLink || "https://meet.google.com/new",
        preventMeetingOverlap: organization.settings?.preventMeetingOverlap || true,
        showMonthlyGoals: adminSettings.showMonthlyGoals || false, // Use global feature toggle
        weights: organization.settings?.weights || { industry: 35, company: 20, networkingGoals: 30, jobTitle: 15 }
      };
      res.json(settings);
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      res.status(500).json({ message: "Failed to fetch admin settings" });
    }
  });

  // Admin API endpoints - only show users from admin's organization
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const admin = await storage.getUser(userId);
      
      if (!admin || (!admin.isAdmin && !admin.isSuperAdmin)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      if (!admin.organizationId) {
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

  app.get('/api/admin/matches', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const admin = await storage.getUser(userId);
      
      if (!admin || (!admin.isAdmin && !admin.isSuperAdmin)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      if (!admin.organizationId) {
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

  app.get('/api/admin/meetings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const admin = await storage.getUser(userId);
      
      if (!admin || (!admin.isAdmin && !admin.isSuperAdmin)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      if (!admin.organizationId) {
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
      
      // Get user's organization
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.organizationId) {
        return res.status(400).json({ message: 'User not associated with an organization' });
      }

      const organization = await storage.getOrganization(user.organizationId);
      if (!organization) {
        return res.status(404).json({ message: 'Organization not found' });
      }

      // Update organization settings in database
      const currentSettings = organization.settings || {};
      const newSettings = { ...currentSettings, ...updates };
      
      // If appName is being updated, also update the organization slug
      const updateData: any = { settings: newSettings };
      if (updates.appName) {
        updateData.slug = updates.appName.toLowerCase().replace(/[^a-z0-9]/g, '');
        console.log("Updating organization slug to:", updateData.slug);
      }
      
      await storage.updateOrganization(organization.id, updateData);
      
      console.log("Updated organization settings in database:", newSettings);
      
      res.json({ 
        message: "Settings updated successfully",
        settings: newSettings
      });
    } catch (error) {
      console.error("Error updating admin settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Test endpoint to send admin summary email
  app.post('/api/test/admin-email', isAuthenticated, async (req: any, res) => {
    try {
      console.log('Testing admin email notification...');
      
      // Create test admin user
      const testAdmin = {
        id: 'test-admin',
        email: 'averyjs@gmail.com',
        firstName: 'Avery',
        lastName: 'Admin',
        isAdmin: true,
        organizationId: 2
      };
      
      // Create test match data
      const testMatches = [
        {
          id: 1,
          user1Id: 'user1',
          user2Id: 'user2',
          matchScore: 85,
          monthYear: '2025-01',
          status: 'pending',
          createdAt: new Date(),
          user1: {
            id: 'user1',
            email: 'user1@test.com',
            firstName: 'John',
            lastName: 'Doe',
            jobTitle: 'Software Engineer',
            company: 'Tech Corp'
          },
          user2: {
            id: 'user2',
            email: 'user2@test.com',
            firstName: 'Jane',
            lastName: 'Smith',
            jobTitle: 'Product Manager',
            company: 'Innovation Inc'
          }
        }
      ];
      
      // Create test meeting data
      const testMeetings = [
        {
          id: 1,
          matchId: 1,
          scheduledAt: new Date('2025-01-15T14:00:00Z'),
          meetingType: 'video',
          duration: 30,
          meetingLink: 'https://meet.google.com/test-meeting',
          status: 'scheduled',
          match: testMatches[0]
        }
      ];
      
      console.log('📧 Sending test admin summary email to averyjs@gmail.com...');
      console.log('📧 Test admin user:', JSON.stringify(testAdmin, null, 2));
      console.log('📧 Test matches data:', JSON.stringify(testMatches, null, 2));
      console.log('📧 Test meetings data:', JSON.stringify(testMeetings, null, 2));
      
      const result = await emailService.sendAdminMatchSummary(
        testAdmin,
        'Test Community',
        testMatches,
        testMeetings
      );
      
      console.log('📧 Email service result:', result);
      console.log('✅ Test admin email sent successfully!');
      res.json({ 
        message: 'Test admin email sent successfully to averyjs@gmail.com',
        details: {
          recipient: testAdmin.email,
          communityName: 'Test Community',
          matchCount: testMatches.length,
          meetingCount: testMeetings.length
        }
      });
    } catch (error) {
      console.error('❌ Error sending test admin email:', error);
      res.status(500).json({ message: 'Failed to send test admin email', error: error.message });
    }
  });

  // Super Admin API endpoints
  app.get('/api/super-admin/organizations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.isSuperAdmin) {
        return res.status(403).json({ message: "Super admin access required" });
      }
      
      const organizations = await storage.getAllOrganizations();
      res.json(organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  app.post('/api/super-admin/organizations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.isSuperAdmin) {
        return res.status(403).json({ message: "Super admin access required" });
      }
      
      const { name, slug, description } = req.body;
      console.log("Creating community with data:", { name, slug, description });
      
      if (!name || !slug) {
        return res.status(400).json({ message: "Name and slug are required" });
      }

      // Check if slug already exists
      const existingOrgs = await storage.getAllOrganizations();
      console.log("Existing organizations:", existingOrgs.map(org => ({ name: org.name, slug: org.slug })));
      
      const slugExists = existingOrgs.some(org => 
        (org.slug && org.slug.toLowerCase() === slug.toLowerCase()) ||
        org.name.toLowerCase().replace(/[^a-z0-9]/g, '') === slug.toLowerCase()
      );

      if (slugExists) {
        console.log("Slug already exists:", slug);
        return res.status(400).json({ message: "Community slug already exists" });
      }

      const organizationData = {
        name,
        slug,
        description: description || "",
        domain: `${slug}.matches.community`,
        isActive: true,
        settings: {
          appName: name,
          matchingDay: 15,
          monthlyGoals: ["Learning technical skills", "Building data projects", "Job hunting", "Networking"],
          communityMeetingLink: "https://meet.google.com/new",
          preventMeetingOverlap: true,
          weights: { industry: 35, company: 20, networkingGoals: 30, jobTitle: 15 }
        }
      };

      console.log("Creating organization with data:", organizationData);
      const newOrganization = await storage.createOrganization(organizationData);
      console.log("Successfully created organization:", newOrganization);
      res.status(201).json(newOrganization);
    } catch (error) {
      console.error("Error creating community - full error:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ 
        message: "Failed to create community", 
        error: error.message,
        details: error.stack
      });
    }
  });

  app.get('/api/super-admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.isSuperAdmin) {
        return res.status(403).json({ message: "Super admin access required" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/super-admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.isSuperAdmin) {
        return res.status(403).json({ message: "Super admin access required" });
      }
      
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

  app.patch('/api/super-admin/users/:userId/super-admin', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const currentUser = await storage.getUser(currentUserId);
      
      if (!currentUser || !currentUser.isSuperAdmin) {
        return res.status(403).json({ message: "Super admin access required" });
      }
      
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.isAdmin && !user.isSuperAdmin)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      console.log("Manual matching triggered by admin:", user.email);
      
      // Import the matching service
      const { matchingService } = await import('./services/matching');
      
      // Run the monthly matching for this admin's organization only
      const result = await matchingService.runMonthlyMatching(undefined, user.organizationId);
      
      res.json({ 
        message: "Matching process completed successfully",
        matchCount: result?.length || 0,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error triggering matching:", error);
      res.status(500).json({ message: "Failed to trigger matching: " + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}