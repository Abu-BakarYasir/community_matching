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
  // Extract email to generate default names if needed
  const email = claims["email"] || "";
  const emailPrefix = email.split('@')[0] || 'User';
  
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"] || emailPrefix,
    lastName: claims["last_name"] || "Member",
    profileImageUrl: claims["profile_image_url"],
  });
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
          
          // Check if user is admin and redirect accordingly
          const dbUser = await storage.getUser(userId);
          const redirectPath = dbUser?.isAdmin ? "/admin" : "/dashboard";
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