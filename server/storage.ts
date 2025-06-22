import {
  users,
  profileQuestions,
  matches,
  meetings,
  availability,
  notifications,
  type User,
  type UpsertUser,
  type InsertUser,
  type ProfileQuestions,
  type InsertProfileQuestions,
  type Match,
  type InsertMatch,
  type MatchWithUsers,
  type Meeting,
  type InsertMeeting,
  type MeetingWithMatch,
  type Availability,
  type InsertAvailability,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Profile questions operations
  getProfileQuestions(userId: string): Promise<ProfileQuestions | undefined>;
  createProfileQuestions(questions: InsertProfileQuestions): Promise<ProfileQuestions>;
  updateProfileQuestions(userId: string, updates: Partial<InsertProfileQuestions>): Promise<ProfileQuestions | undefined>;

  // Match operations
  getMatch(id: number): Promise<Match | undefined>;
  getMatchesByUser(userId: string): Promise<MatchWithUsers[]>;
  getMatchesByMonth(monthYear: string): Promise<MatchWithUsers[]>;
  getAllMatches(): Promise<MatchWithUsers[]>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatch(id: number, updates: Partial<InsertMatch>): Promise<Match | undefined>;
  deleteMatch(id: number): Promise<boolean>;

  // Meeting operations
  getMeeting(id: number): Promise<Meeting | undefined>;
  getMeetingsByUser(userId: string): Promise<MeetingWithMatch[]>;
  getAllMeetings(): Promise<Meeting[]>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: number, updates: Partial<InsertMeeting>): Promise<Meeting | undefined>;

  // Availability operations
  getAvailability(userId: string): Promise<Availability[]>;
  createAvailability(availability: InsertAvailability): Promise<Availability>;
  updateAvailability(id: number, updates: Partial<InsertAvailability>): Promise<Availability | undefined>;
  deleteAvailability(id: number): Promise<boolean>;

  // Notification operations
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  deleteNotification?(id: number): Promise<boolean>;
  
  // Profile operations
  deleteProfileQuestions?(userId: string): Promise<boolean>;
  
  // Meeting operations
  deleteMeeting?(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      // First try to find existing user by ID or email
      const existingUser = await this.getUser(userData.id) || 
                          (userData.email ? await this.getUserByEmail(userData.email) : null);
      
      if (existingUser) {
        // Update existing user
        const [user] = await db
          .update(users)
          .set({
            ...userData,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser.id))
          .returning();
        return user;
      } else {
        // Create new user
        const [user] = await db
          .insert(users)
          .values(userData)
          .returning();
        return user;
      }
    } catch (error) {
      console.error('Error in upsertUser:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const result = await db.delete(users).where(eq(users.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getProfileQuestions(userId: string): Promise<ProfileQuestions | undefined> {
    const [questions] = await db.select().from(profileQuestions).where(eq(profileQuestions.userId, userId));
    return questions || undefined;
  }

  async createProfileQuestions(questions: InsertProfileQuestions): Promise<ProfileQuestions> {
    const [result] = await db
      .insert(profileQuestions)
      .values(questions)
      .returning();
    return result;
  }

  async updateProfileQuestions(userId: string, updates: Partial<InsertProfileQuestions>): Promise<ProfileQuestions | undefined> {
    const [result] = await db
      .update(profileQuestions)
      .set(updates)
      .where(eq(profileQuestions.userId, userId))
      .returning();
    return result || undefined;
  }

  async getMatch(id: number): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match || undefined;
  }

  async getMatchesByUser(userId: string): Promise<MatchWithUsers[]> {
    const userMatches = await db.select({
      match: matches,
      user1: users,
      user2: users,
      meeting: meetings
    })
    .from(matches)
    .leftJoin(meetings, eq(matches.id, meetings.matchId))
    .innerJoin(users, eq(matches.user1Id, users.id))
    .innerJoin(users, eq(matches.user2Id, users.id))
    .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)));

    return userMatches.map(row => ({
      ...row.match,
      user1: row.user1,
      user2: row.user2,
      meeting: row.meeting || undefined
    }));
  }

  async getMatchesByMonth(monthYear: string): Promise<MatchWithUsers[]> {
    const monthMatches = await db.select({
      match: matches,
      user1: users,
      user2: users,
      meeting: meetings
    })
    .from(matches)
    .leftJoin(meetings, eq(matches.id, meetings.matchId))
    .innerJoin(users, eq(matches.user1Id, users.id))
    .innerJoin(users, eq(matches.user2Id, users.id))
    .where(eq(matches.monthYear, monthYear));

    return monthMatches.map(row => ({
      ...row.match,
      user1: row.user1,
      user2: row.user2,
      meeting: row.meeting || undefined
    }));
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const [match] = await db
      .insert(matches)
      .values(insertMatch)
      .returning();
    return match;
  }

  async updateMatch(id: number, updates: Partial<InsertMatch>): Promise<Match | undefined> {
    const [match] = await db
      .update(matches)
      .set(updates)
      .where(eq(matches.id, id))
      .returning();
    return match || undefined;
  }

  async getAllMatches(): Promise<MatchWithUsers[]> {
    const allMatches = await db.select({
      match: matches,
      user1: users,
      user2: users,
      meeting: meetings
    })
    .from(matches)
    .leftJoin(meetings, eq(matches.id, meetings.matchId))
    .innerJoin(users, eq(matches.user1Id, users.id))
    .innerJoin(users, eq(matches.user2Id, users.id));

    return allMatches.map(row => ({
      ...row.match,
      user1: row.user1,
      user2: row.user2,
      meeting: row.meeting || undefined
    }));
  }

  async deleteMatch(id: number): Promise<boolean> {
    try {
      const result = await db.delete(matches).where(eq(matches.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting match:', error);
      return false;
    }
  }

  async getMeeting(id: number): Promise<Meeting | undefined> {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    return meeting || undefined;
  }

  async getMeetingsByUser(userId: string): Promise<MeetingWithMatch[]> {
    const userMeetings = await db.select({
      meeting: meetings,
      match: matches,
      user1: users,
      user2: users
    })
    .from(meetings)
    .innerJoin(matches, eq(meetings.matchId, matches.id))
    .innerJoin(users, eq(matches.user1Id, users.id))
    .innerJoin(users, eq(matches.user2Id, users.id))
    .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)));

    return userMeetings.map(row => ({
      ...row.meeting,
      match: {
        ...row.match,
        user1: row.user1,
        user2: row.user2,
        meeting: row.meeting
      }
    }));
  }

  async createMeeting(insertMeeting: InsertMeeting): Promise<Meeting> {
    const [meeting] = await db
      .insert(meetings)
      .values(insertMeeting)
      .returning();
    return meeting;
  }

  async updateMeeting(id: number, updates: Partial<InsertMeeting>): Promise<Meeting | undefined> {
    const [meeting] = await db
      .update(meetings)
      .set(updates)
      .where(eq(meetings.id, id))
      .returning();
    return meeting || undefined;
  }

  async getAvailability(userId: string): Promise<Availability[]> {
    return await db.select().from(availability).where(eq(availability.userId, userId));
  }

  async createAvailability(insertAvailability: InsertAvailability): Promise<Availability> {
    const [availabilityRecord] = await db
      .insert(availability)
      .values(insertAvailability)
      .returning();
    return availabilityRecord;
  }

  async updateAvailability(id: number, updates: Partial<InsertAvailability>): Promise<Availability | undefined> {
    const [availabilityRecord] = await db
      .update(availability)
      .set(updates)
      .where(eq(availability.id, id))
      .returning();
    return availabilityRecord || undefined;
  }

  async deleteAvailability(id: number): Promise<boolean> {
    try {
      const result = await db.delete(availability).where(eq(availability.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting availability:', error);
      return false;
    }
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    try {
      const result = await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  async getAllMeetings(): Promise<Meeting[]> {
    return await db.select().from(meetings);
  }

  async deleteMeeting(id: number): Promise<boolean> {
    try {
      const result = await db.delete(meetings).where(eq(meetings.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting meeting:', error);
      return false;
    }
  }

  async deleteNotification(id: number): Promise<boolean> {
    try {
      const result = await db.delete(notifications).where(eq(notifications.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  async deleteProfileQuestions(userId: string): Promise<boolean> {
    try {
      const result = await db.delete(profileQuestions).where(eq(profileQuestions.userId, userId));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting profile questions:', error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();