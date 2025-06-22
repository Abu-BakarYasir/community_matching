import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupDevAuth, authenticateToken } from "./devAuth";
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
  // Setup development authentication
  await setupDevAuth(app);

  // Test endpoint
  app.get("/api/test", authenticateToken, async (req: any, res) => {
    res.json({ message: "Authentication working", userId: req.userId });
  });

  const httpServer = createServer(app);
  return httpServer;
}