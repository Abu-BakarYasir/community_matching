import type { 
  User, InsertUser, 
  ProfileQuestions, InsertProfileQuestions,
  Match, InsertMatch, MatchWithUsers,
  Meeting, InsertMeeting, MeetingWithMatch,
  Availability, InsertAvailability,
  Notification, InsertNotification
} from "@shared/schema";
import { users, profileQuestions, matches, meetings, availability, notifications } from "@shared/schema";
import { db } from "./db";
import { eq, and, or } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Profile questions operations
  getProfileQuestions(userId: number): Promise<ProfileQuestions | undefined>;
  createProfileQuestions(questions: InsertProfileQuestions): Promise<ProfileQuestions>;
  updateProfileQuestions(userId: number, updates: Partial<InsertProfileQuestions>): Promise<ProfileQuestions | undefined>;

  // Match operations
  getMatch(id: number): Promise<Match | undefined>;
  getMatchesByUser(userId: number): Promise<MatchWithUsers[]>;
  getMatchesByMonth(monthYear: string): Promise<MatchWithUsers[]>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatch(id: number, updates: Partial<InsertMatch>): Promise<Match | undefined>;
  deleteMatch(id: number): Promise<boolean>;

  // Meeting operations
  getMeeting(id: number): Promise<Meeting | undefined>;
  getMeetingsByUser(userId: number): Promise<MeetingWithMatch[]>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: number, updates: Partial<InsertMeeting>): Promise<Meeting | undefined>;

  // Availability operations
  getAvailability(userId: number): Promise<Availability[]>;
  createAvailability(availability: InsertAvailability): Promise<Availability>;
  updateAvailability(id: number, updates: Partial<InsertAvailability>): Promise<Availability | undefined>;
  deleteAvailability(id: number): Promise<boolean>;

  // Notification operations
  getNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  deleteNotification?(id: number): Promise<boolean>;
  
  // Profile operations
  deleteProfileQuestions?(userId: number): Promise<boolean>;
  
  // Meeting operations
  deleteMeeting?(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
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

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      const result = await db.delete(users).where(eq(users.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getProfileQuestions(userId: number): Promise<ProfileQuestions | undefined> {
    const [questions] = await db.select().from(profileQuestions).where(eq(profileQuestions.userId, userId));
    return questions || undefined;
  }

  async createProfileQuestions(questions: InsertProfileQuestions): Promise<ProfileQuestions> {
    const [profileQuestion] = await db
      .insert(profileQuestions)
      .values(questions)
      .returning();
    return profileQuestion;
  }

  async updateProfileQuestions(userId: number, updates: Partial<InsertProfileQuestions>): Promise<ProfileQuestions | undefined> {
    const [updated] = await db
      .update(profileQuestions)
      .set(updates)
      .where(eq(profileQuestions.userId, userId))
      .returning();
    return updated || undefined;
  }

  async getMatch(id: number): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match || undefined;
  }

  async getMatchesByUser(userId: number): Promise<MatchWithUsers[]> {
    const userMatches = await db
      .select({
        id: matches.id,
        user1Id: matches.user1Id,
        user2Id: matches.user2Id,
        matchScore: matches.matchScore,
        status: matches.status,
        monthYear: matches.monthYear,
        createdAt: matches.createdAt,
        user1: users,
        user2: users
      })
      .from(matches)
      .leftJoin(users, eq(matches.user1Id, users.id))
      .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)));

    // We need to get both users for each match
    const matchesWithUsers: MatchWithUsers[] = [];
    
    for (const match of userMatches) {
      const user1 = await this.getUser(match.user1Id!);
      const user2 = await this.getUser(match.user2Id!);
      
      if (user1 && user2) {
        matchesWithUsers.push({
          id: match.id,
          user1Id: match.user1Id,
          user2Id: match.user2Id,
          matchScore: match.matchScore,
          status: match.status,
          monthYear: match.monthYear,
          createdAt: match.createdAt,
          user1,
          user2
        });
      }
    }
    
    return matchesWithUsers;
  }

  async getMatchesByMonth(monthYear: string): Promise<MatchWithUsers[]> {
    const monthMatches = await db
      .select()
      .from(matches)
      .where(eq(matches.monthYear, monthYear));

    const matchesWithUsers: MatchWithUsers[] = [];
    
    for (const match of monthMatches) {
      const user1 = await this.getUser(match.user1Id!);
      const user2 = await this.getUser(match.user2Id!);
      
      if (user1 && user2) {
        matchesWithUsers.push({
          ...match,
          user1,
          user2
        });
      }
    }
    
    return matchesWithUsers;
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

  async deleteMatch(id: number): Promise<boolean> {
    try {
      const result = await db.delete(matches).where(eq(matches.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting match:', error);
      return false;
    }
  }

  async getMeeting(id: number): Promise<Meeting | undefined> {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    return meeting || undefined;
  }

  async getMeetingsByUser(userId: number): Promise<MeetingWithMatch[]> {
    const userMeetings = await db
      .select({
        meeting: meetings,
        match: matches
      })
      .from(meetings)
      .innerJoin(matches, eq(meetings.matchId, matches.id))
      .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)));

    const meetingsWithMatch: MeetingWithMatch[] = [];
    
    for (const result of userMeetings) {
      const user1 = await this.getUser(result.match.user1Id!);
      const user2 = await this.getUser(result.match.user2Id!);
      
      if (user1 && user2) {
        meetingsWithMatch.push({
          ...result.meeting,
          match: {
            ...result.match,
            user1,
            user2
          }
        });
      }
    }
    
    return meetingsWithMatch;
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

  async getAvailability(userId: number): Promise<Availability[]> {
    return await db.select().from(availability).where(eq(availability.userId, userId));
  }

  async createAvailability(insertAvailability: InsertAvailability): Promise<Availability> {
    const [avail] = await db
      .insert(availability)
      .values(insertAvailability)
      .returning();
    return avail;
  }

  async updateAvailability(id: number, updates: Partial<InsertAvailability>): Promise<Availability | undefined> {
    const [avail] = await db
      .update(availability)
      .set(updates)
      .where(eq(availability.id, id))
      .returning();
    return avail || undefined;
  }

  async deleteAvailability(id: number): Promise<boolean> {
    console.log("DatabaseStorage.deleteAvailability ID:", id);
    const result = await db.delete(availability).where(eq(availability.id, id));
    console.log("DatabaseStorage delete result rowCount:", result.rowCount);
    return result.rowCount > 0;
  }

  async getNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(notifications.createdAt);
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
    return result.rowCount > 0;
  }

  async deleteNotification(id: number): Promise<boolean> {
    try {
      const result = await db.delete(notifications).where(eq(notifications.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  async deleteProfileQuestions(userId: number): Promise<boolean> {
    try {
      const result = await db.delete(profileQuestions).where(eq(profileQuestions.userId, userId));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting profile questions:', error);
      return false;
    }
  }

  async deleteMeeting(id: number): Promise<boolean> {
    try {
      const result = await db.delete(meetings).where(eq(meetings.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting meeting:', error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();