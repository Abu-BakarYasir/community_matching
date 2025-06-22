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

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  next();
}

export function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (!req.user.isSuperAdmin) {
    return res.status(403).json({ message: "Super admin access required" });
  }
  
  next();
}