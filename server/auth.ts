import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// JWT secret - in production this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-development';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    isAdmin?: boolean;
    isSuperAdmin?: boolean;
    organizationId?: number;
  };
}

export function generateToken(user: { id: number; email: string; isAdmin?: boolean; isSuperAdmin?: boolean; organizationId?: number }): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      isAdmin: user.isAdmin || false
    },
    JWT_SECRET,
    { 
      expiresIn: '7d' // Token expires in 7 days
    }
  );
}

export function verifyToken(token: string): { id: number; email: string; isAdmin?: boolean; isSuperAdmin?: boolean; organizationId?: number } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; isAdmin?: boolean };
    return decoded;
  } catch (error) {
    return null;
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7)
    : req.cookies?.authToken; // Also check cookies as fallback

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
  req.user = user;
  next();
}

export async function requireAdmin(req: any, res: Response, next: NextFunction) {
  if (!req.user?.claims?.sub) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  try {
    // Import storage here to avoid circular dependency
    const { storage } = await import('./storage');
    const user = await storage.getUser(req.user.claims.sub);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    if (!user.isAdmin && !user.isSuperAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    // Attach user data to request for use in route handlers
    req.userData = user;
    next();
  } catch (error) {
    console.error("Error checking admin status:", error);
    return res.status(500).json({ message: "Authentication error" });
  }
}

export async function requireSuperAdmin(req: any, res: Response, next: NextFunction) {
  if (!req.user?.claims?.sub) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  try {
    // Import storage here to avoid circular dependency
    const { storage } = await import('./storage');
    const user = await storage.getUser(req.user.claims.sub);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    if (!user.isSuperAdmin) {
      return res.status(403).json({ message: "Super admin access required" });
    }
    
    // Attach user data to request for use in route handlers
    req.userData = user;
    next();
  } catch (error) {
    console.error("Error checking super admin status:", error);
    return res.status(500).json({ message: "Authentication error" });
  }
}