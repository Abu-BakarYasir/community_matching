// This file is deprecated - all authentication now uses Replit Auth
// JWT authentication has been completely replaced with Replit Auth system
import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    isAdmin?: boolean;
    isSuperAdmin?: boolean;
    organizationId?: number;
  };
}

// All JWT functions have been replaced with Replit Auth
// These functions are no longer used and kept only for reference

// This function is replaced by inline admin checks using Replit Auth
// Use isAuthenticated + manual admin check in routes instead

// This function is replaced by inline super admin checks using Replit Auth
// Use isAuthenticated + manual super admin check in routes instead