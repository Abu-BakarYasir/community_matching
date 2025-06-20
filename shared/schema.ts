import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  jobTitle: text("job_title"),
  company: text("company"),
  industry: text("industry"),
  experienceLevel: text("experience_level"), // "0-2", "3-5", "6-10", "10+"
  profileImageUrl: text("profile_image_url"),
  bio: text("bio"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const profileQuestions = pgTable("profile_questions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  networkingGoals: json("networking_goals").$type<string[]>(), // ["career_advancement", "knowledge_sharing", etc.]
  availabilityPreferences: json("availability_preferences").$type<string[]>(), // ["weekday_mornings", etc.]
  interests: json("interests").$type<string[]>(),
  lookingFor: text("looking_for"), // what they want from networking
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").references(() => users.id),
  user2Id: integer("user2_id").references(() => users.id),
  matchScore: integer("match_score"), // percentage
  status: text("status").default("pending"), // "pending", "accepted", "declined", "meeting_scheduled"
  createdAt: timestamp("created_at").defaultNow(),
  monthYear: text("month_year"), // "2024-12" for tracking monthly matches
});

export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").references(() => matches.id),
  scheduledAt: timestamp("scheduled_at"),
  duration: integer("duration").default(30), // minutes
  meetingType: text("meeting_type"), // "video", "coffee", "lunch"
  status: text("status").default("scheduled"), // "scheduled", "completed", "cancelled", "no_show"
  meetingLink: text("meeting_link"),
  location: text("location"),
  notes: text("notes"),
});

export const availability = pgTable("availability", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  dayOfWeek: integer("day_of_week"), // 0-6, Sunday = 0
  startTime: text("start_time"), // "09:00"
  endTime: text("end_time"), // "17:00"
  isAvailable: boolean("is_available").default(true),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  type: text("type"), // "match_found", "meeting_scheduled", "meeting_reminder"
  title: text("title"),
  message: text("message"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertProfileQuestionsSchema = createInsertSchema(profileQuestions).omit({
  id: true,
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
});

export const insertMeetingSchema = createInsertSchema(meetings).omit({
  id: true,
});

export const insertAvailabilitySchema = createInsertSchema(availability).omit({
  id: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type ProfileQuestions = typeof profileQuestions.$inferSelect;
export type InsertProfileQuestions = z.infer<typeof insertProfileQuestionsSchema>;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Availability = typeof availability.$inferSelect;
export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Extended types for API responses
export type UserWithProfile = User & {
  profileQuestions?: ProfileQuestions;
  availability?: Availability[];
};

export type MatchWithUsers = Match & {
  user1: User;
  user2: User;
  meeting?: Meeting;
};

export type MeetingWithMatch = Meeting & {
  match: MatchWithUsers;
};
