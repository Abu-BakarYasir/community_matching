import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// For development, provide fallback values
const replitDomains = process.env.REPLIT_DOMAINS || "localhost";
const replId = process.env.REPL_ID || "dev-repl-id";

console.log("Replit Auth config:", { domains: replitDomains, replId });

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      replId
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true, // Allow creating sessions table
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || 'dev-session-secret-key-replit-auth',
    store: sessionStore,
    resave: false,
    saveUninitialized: true, // Save uninitialized sessions for Replit Auth
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for development
      maxAge: sessionTtl,
      sameSite: 'lax', // Important for cross-site auth
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  console.log("Upserting user:", claims["email"], claims);
  
  try {
    const email = claims["email"] || "";
    const existingUser = await storage.getUserByEmail(email);
    
    if (existingUser) {
      console.log("User exists, updating:", existingUser.id);
      await storage.updateUser(existingUser.id, {
        email: claims["email"],
        firstName: claims["first_name"] || existingUser.firstName,
        lastName: claims["last_name"] || existingUser.lastName,
        profileImageUrl: claims["profile_image_url"] || existingUser.profileImageUrl,
      });
    } else {
      console.log("Creating new user for:", email);
      
      // First create the user
      const newUser = await storage.createUser({
        id: claims["sub"],
        email: claims["email"],
        firstName: claims["first_name"] || email.split('@')[0],
        lastName: claims["last_name"] || "Member",
        profileImageUrl: claims["profile_image_url"],
        isActive: true,
        isAdmin: true, // New users are admins of their own organization
      });

      // Then create an organization for this user
      const organizationName = `${newUser.firstName}'s Community`;
      const organization = await storage.createOrganization({
        name: organizationName,
        adminId: newUser.id,
        domain: email.split('@')[1], // Use email domain
        settings: {
          appName: organizationName,
          matchingDay: 1,
          monthlyGoals: ["Learning technical skills", "Building data projects", "Job hunting", "Networking"],
          googleMeetLink: "https://meet.google.com/new",
          preventMeetingOverlap: true,
          weights: { industry: 35, company: 20, networkingGoals: 30, jobTitle: 15 }
        }
      });

      // Update user with organization ID
      await storage.updateUser(newUser.id, { organizationId: organization.id });
    }
  } catch (error) {
    console.error("Error upserting user:", error);
    throw error;
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of replitDomains.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, async (err, user) => {
      if (err || !user) {
        console.error("Authentication callback error:", err);
        return res.redirect("/api/login");
      }
      
      req.logIn(user, async (loginErr) => {
        if (loginErr) {
          console.error("Login error:", loginErr);
          return res.redirect("/api/login");
        }
        
        // Ensure user exists in database before redirecting
        try {
          const userId = user.claims.sub;
          console.log("Processing callback for user:", userId, user.claims.email);
          
          // Use upsertUser to ensure user exists in database
          await upsertUser(user.claims);
          
          // Check if user is super admin, admin, or regular user and redirect accordingly
          const dbUser = await storage.getUser(userId);
          let redirectPath = "/dashboard";
          if (dbUser?.isSuperAdmin) {
            redirectPath = "/super-admin";
          } else if (dbUser?.isAdmin) {
            redirectPath = "/admin";
          }
          console.log("Redirecting authenticated user to:", redirectPath);
          res.redirect(redirectPath);
        } catch (error) {
          console.error("Error ensuring user exists in database:", error);
          // Even if database operations fail, redirect to dashboard
          res.redirect("/dashboard");
        }
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: replId,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });

  // Add POST logout endpoint for API calls
  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true, message: "Logged out successfully" });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user as any;

    // Check if user is authenticated and has claims
    if (!req.isAuthenticated() || !user || !user.claims) {
      console.log("Authentication failed: no user or claims");
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (user.expires_at && now > user.expires_at) {
      // Try to refresh the token
      const refreshToken = user.refresh_token;
      if (!refreshToken) {
        console.log("Authentication failed: token expired, no refresh token");
        return res.status(401).json({ message: "Unauthorized" });
      }

      try {
        const config = await getOidcConfig();
        const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
        updateUserSession(user, tokenResponse);
        console.log("Token refreshed successfully");
        return next();
      } catch (error) {
        console.log("Token refresh failed:", error);
        return res.status(401).json({ message: "Unauthorized" });
      }
    }

    // User is authenticated and token is valid
    console.log("User authenticated:", { sub: user.claims.sub, email: user.claims.email });
    return next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};