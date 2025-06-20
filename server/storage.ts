import { users, profileQuestions, matches, meetings, availability, notifications, type User, type InsertUser, type ProfileQuestions, type InsertProfileQuestions, type Match, type InsertMatch, type Meeting, type InsertMeeting, type Availability, type InsertAvailability, type Notification, type InsertNotification, type UserWithProfile, type MatchWithUsers, type MeetingWithMatch } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private profileQuestions: Map<number, ProfileQuestions>;
  private matches: Map<number, Match>;
  private meetings: Map<number, Meeting>;
  private availability: Map<number, Availability>;
  private notifications: Map<number, Notification>;
  
  private currentUserId: number;
  private currentProfileQuestionId: number;
  private currentMatchId: number;
  private currentMeetingId: number;
  private currentAvailabilityId: number;
  private currentNotificationId: number;

  constructor() {
    this.users = new Map();
    this.profileQuestions = new Map();
    this.matches = new Map();
    this.meetings = new Map();
    this.availability = new Map();
    this.notifications = new Map();
    
    this.currentUserId = 1;
    this.currentProfileQuestionId = 1;
    this.currentMatchId = 1;
    this.currentMeetingId = 1;
    this.currentAvailabilityId = 1;
    this.currentNotificationId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser,
      id, 
      createdAt: new Date(),
      isActive: insertUser.isActive ?? true,
      jobTitle: insertUser.jobTitle ?? null,
      company: insertUser.company ?? null,
      industry: insertUser.industry ?? null,
      experienceLevel: insertUser.experienceLevel ?? null,
      profileImageUrl: insertUser.profileImageUrl ?? null,
      bio: insertUser.bio ?? null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getProfileQuestions(userId: number): Promise<ProfileQuestions | undefined> {
    return Array.from(this.profileQuestions.values()).find(pq => pq.userId === userId);
  }

  async createProfileQuestions(questions: InsertProfileQuestions): Promise<ProfileQuestions> {
    const id = this.currentProfileQuestionId++;
    const profileQuestion: ProfileQuestions = { 
      ...questions, 
      id,
      userId: questions.userId ?? null,
      networkingGoals: (questions.networkingGoals as string[]) ?? null,
      availabilityPreferences: (questions.availabilityPreferences as string[]) ?? null,
      interests: (questions.interests as string[]) ?? null,
      lookingFor: questions.lookingFor ?? null
    };
    this.profileQuestions.set(id, profileQuestion);
    return profileQuestion;
  }

  async updateProfileQuestions(userId: number, updates: Partial<InsertProfileQuestions>): Promise<ProfileQuestions | undefined> {
    const existing = Array.from(this.profileQuestions.values()).find(pq => pq.userId === userId);
    if (!existing) return undefined;
    
    const updated = { 
      ...existing, 
      ...updates,
      networkingGoals: (updates.networkingGoals as string[]) ?? existing.networkingGoals,
      availabilityPreferences: (updates.availabilityPreferences as string[]) ?? existing.availabilityPreferences,
      interests: (updates.interests as string[]) ?? existing.interests
    };
    this.profileQuestions.set(existing.id, updated);
    return updated;
  }

  async getMatch(id: number): Promise<Match | undefined> {
    return this.matches.get(id);
  }

  async getMatchesByUser(userId: number): Promise<MatchWithUsers[]> {
    const userMatches = Array.from(this.matches.values())
      .filter(match => match.user1Id === userId || match.user2Id === userId);
    
    const matchesWithUsers: MatchWithUsers[] = [];
    for (const match of userMatches) {
      const user1 = this.users.get(match.user1Id!);
      const user2 = this.users.get(match.user2Id!);
      const meeting = Array.from(this.meetings.values()).find(m => m.matchId === match.id);
      
      if (user1 && user2) {
        matchesWithUsers.push({
          ...match,
          user1,
          user2,
          meeting
        });
      }
    }
    
    return matchesWithUsers;
  }

  async getMatchesByMonth(monthYear: string): Promise<MatchWithUsers[]> {
    const monthMatches = Array.from(this.matches.values())
      .filter(match => match.monthYear === monthYear);
    
    const matchesWithUsers: MatchWithUsers[] = [];
    for (const match of monthMatches) {
      const user1 = this.users.get(match.user1Id!);
      const user2 = this.users.get(match.user2Id!);
      const meeting = Array.from(this.meetings.values()).find(m => m.matchId === match.id);
      
      if (user1 && user2) {
        matchesWithUsers.push({
          ...match,
          user1,
          user2,
          meeting
        });
      }
    }
    
    return matchesWithUsers;
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const id = this.currentMatchId++;
    const match: Match = { 
      ...insertMatch, 
      id, 
      createdAt: new Date(),
      status: insertMatch.status ?? "pending",
      user1Id: insertMatch.user1Id ?? null,
      user2Id: insertMatch.user2Id ?? null,
      matchScore: insertMatch.matchScore ?? null,
      monthYear: insertMatch.monthYear ?? null
    };
    this.matches.set(id, match);
    return match;
  }

  async updateMatch(id: number, updates: Partial<InsertMatch>): Promise<Match | undefined> {
    const match = this.matches.get(id);
    if (!match) return undefined;
    
    const updatedMatch = { ...match, ...updates };
    this.matches.set(id, updatedMatch);
    return updatedMatch;
  }

  async getMeeting(id: number): Promise<Meeting | undefined> {
    return this.meetings.get(id);
  }

  async getMeetingsByUser(userId: number): Promise<MeetingWithMatch[]> {
    const userMatches = await this.getMatchesByUser(userId);
    const matchIds = userMatches.map(match => match.id);
    
    const userMeetings = Array.from(this.meetings.values())
      .filter(meeting => matchIds.includes(meeting.matchId!));
    
    const meetingsWithMatch: MeetingWithMatch[] = [];
    for (const meeting of userMeetings) {
      const match = userMatches.find(m => m.id === meeting.matchId);
      if (match) {
        meetingsWithMatch.push({
          ...meeting,
          match
        });
      }
    }
    
    return meetingsWithMatch;
  }

  async createMeeting(insertMeeting: InsertMeeting): Promise<Meeting> {
    const id = this.currentMeetingId++;
    const meeting: Meeting = { 
      ...insertMeeting, 
      id,
      duration: insertMeeting.duration ?? 30,
      status: insertMeeting.status ?? "scheduled",
      matchId: insertMeeting.matchId ?? null,
      scheduledAt: insertMeeting.scheduledAt ?? null,
      meetingType: insertMeeting.meetingType ?? null,
      meetingLink: insertMeeting.meetingLink ?? null,
      location: insertMeeting.location ?? null,
      notes: insertMeeting.notes ?? null
    };
    this.meetings.set(id, meeting);
    return meeting;
  }

  async updateMeeting(id: number, updates: Partial<InsertMeeting>): Promise<Meeting | undefined> {
    const meeting = this.meetings.get(id);
    if (!meeting) return undefined;
    
    const updatedMeeting = { ...meeting, ...updates };
    this.meetings.set(id, updatedMeeting);
    return updatedMeeting;
  }

  async getAvailability(userId: number): Promise<Availability[]> {
    return Array.from(this.availability.values()).filter(avail => avail.userId === userId);
  }

  async createAvailability(insertAvailability: InsertAvailability): Promise<Availability> {
    const id = this.currentAvailabilityId++;
    const availability: Availability = { 
      ...insertAvailability, 
      id,
      isAvailable: insertAvailability.isAvailable ?? true,
      userId: insertAvailability.userId ?? null,
      dayOfWeek: insertAvailability.dayOfWeek ?? null,
      startTime: insertAvailability.startTime ?? null,
      endTime: insertAvailability.endTime ?? null
    };
    this.availability.set(id, availability);
    return availability;
  }

  async updateAvailability(id: number, updates: Partial<InsertAvailability>): Promise<Availability | undefined> {
    const availability = this.availability.get(id);
    if (!availability) return undefined;
    
    const updatedAvailability = { ...availability, ...updates };
    this.availability.set(id, updatedAvailability);
    return updatedAvailability;
  }

  async deleteAvailability(id: number): Promise<boolean> {
    return this.availability.delete(id);
  }

  async getNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.currentNotificationId++;
    const notification: Notification = { 
      ...insertNotification, 
      id,
      createdAt: new Date(),
      isRead: insertNotification.isRead ?? false,
      type: insertNotification.type ?? null,
      title: insertNotification.title ?? null,
      message: insertNotification.message ?? null,
      userId: insertNotification.userId ?? null
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;
    
    notification.isRead = true;
    this.notifications.set(id, notification);
    return true;
  }
}

export const storage = new MemStorage();
