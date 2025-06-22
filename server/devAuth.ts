import jwt from "jsonwebtoken";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

const JWT_SECRET = process.env.SESSION_SECRET || "dev-secret-key";

// Development authentication - creates test users and JWT tokens
export async function setupDevAuth(app: Express) {
  // Create test users if they don't exist
  await createTestUsers();

  // Login endpoint for development
  app.post("/api/dev/login", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          isAdmin: user.isAdmin
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({ 
        token, 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin
        }
      });
    } catch (error) {
      console.error("Dev login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Auth user endpoint
  app.get("/api/auth/user", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  console.log("Development authentication setup complete");
}

// JWT authentication middleware
export const authenticateToken: RequestHandler = (req: any, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.isAdmin = decoded.isAdmin;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Create test users for development
async function createTestUsers() {
  try {
    // Create admin user
    const adminExists = await storage.getUserByEmail("admin@example.com");
    if (!adminExists) {
      await storage.upsertUser({
        id: "admin-user-1",
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
        isAdmin: true,
        isActive: true
      });
      console.log("Created admin test user: admin@example.com");
    }

    // Create regular user
    const userExists = await storage.getUserByEmail("user@example.com");
    if (!userExists) {
      await storage.upsertUser({
        id: "test-user-1",
        email: "user@example.com",
        firstName: "Test",
        lastName: "User",
        isAdmin: false,
        isActive: true
      });
      console.log("Created regular test user: user@example.com");
    }
  } catch (error) {
    console.error("Error creating test users:", error);
  }
}