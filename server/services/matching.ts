import { storage } from '../storage';
import { emailService } from './email';
import type { User, ProfileQuestions } from '@shared/schema';

class MatchingService {
  async runMonthlyMatching(weights?: any, organizationId?: number) {
    console.log('Starting monthly matching process...');
    
    const currentDate = new Date();
    const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Get all active users - filter by organization if specified
    const allUsers = await storage.getAllUsers();
    let activeUsers = allUsers.filter(user => user.isActive);
    
    // If organizationId is specified, only match users from that organization
    if (organizationId) {
      activeUsers = activeUsers.filter(user => user.organizationId === organizationId);
      console.log(`Filtering to organization ${organizationId}: ${activeUsers.length} users`);
    }
    
    console.log(`Found ${activeUsers.length} active users for matching`);
    
    if (activeUsers.length < 2) {
      console.log('Not enough users for matching');
      return [];
    }
    
    // Get existing matches for this month to avoid duplicates
    const existingMatches = await storage.getMatchesByMonth(monthYear);
    const existingPairs = new Set(
      existingMatches.map(match => 
        [match.user1Id, match.user2Id].sort().join('-')
      )
    );
    
    const matches = [];
    const unmatchedUsers = [];
    const userMatchCount = new Map();
    
    // Initialize match counts
    activeUsers.forEach(user => userMatchCount.set(user.id, 0));
    
    // Phase 1: High-quality matching (60%+ compatibility)
    const potentialMatches = [];
    
    for (let i = 0; i < activeUsers.length; i++) {
      for (let j = i + 1; j < activeUsers.length; j++) {
        const user1 = activeUsers[i];
        const user2 = activeUsers[j];
        
        const pairKey = [user1.id, user2.id].sort().join('-');
        
        // Skip if already matched this month
        if (existingPairs.has(pairKey)) {
          continue;
        }
        
        // Calculate match score
        const matchScore = await this.calculateMatchScore(user1, user2, weights);
        
        potentialMatches.push({
          user1,
          user2,
          matchScore,
          pairKey
        });
      }
    }
    
    // Sort by match score (highest first)
    potentialMatches.sort((a, b) => b.matchScore - a.matchScore);
    
    // Create high-quality matches (one per user)
    for (const potential of potentialMatches) {
      if (potential.matchScore >= 60) {
        // Only match if both users don't have a match yet
        if (userMatchCount.get(potential.user1.id) === 0 && userMatchCount.get(potential.user2.id) === 0) {
          console.log(`🎯 Creating HIGH-QUALITY match: ${potential.user1.email} ↔ ${potential.user2.email} (${potential.matchScore}%)`);
          const match = await this.createMatch(potential.user1, potential.user2, potential.matchScore, monthYear);
          matches.push(match);
          
          userMatchCount.set(potential.user1.id, 1);
          userMatchCount.set(potential.user2.id, 1);
          
          existingPairs.add(potential.pairKey);
        }
      }
    }
    
    // Phase 2: Random backup matching for unmatched users
    const usersWithoutMatches = activeUsers.filter(user => userMatchCount.get(user.id) === 0);
    console.log(`${usersWithoutMatches.length} users without high-quality matches, applying random matching...`);
    
    if (usersWithoutMatches.length >= 2) {
      // Shuffle unmatched users for random pairing
      const shuffledUnmatched = [...usersWithoutMatches].sort(() => Math.random() - 0.5);
      
      // Pair users sequentially, ensuring each gets only one match
      for (let i = 0; i < shuffledUnmatched.length - 1; i += 2) {
        const user1 = shuffledUnmatched[i];
        const user2 = shuffledUnmatched[i + 1];
        
        // Double-check neither user has been matched yet
        if (userMatchCount.get(user1.id) === 0 && userMatchCount.get(user2.id) === 0) {
          const pairKey = [user1.id, user2.id].sort().join('-');
          
          if (!existingPairs.has(pairKey)) {
            const randomScore = Math.floor(Math.random() * 25) + 35; // 35-60% for random matches
            console.log(`🔀 Creating RANDOM match: ${user1.email} ↔ ${user2.email} (${randomScore}%)`);
            const match = await this.createMatch(user1, user2, randomScore, monthYear);
            matches.push(match);
            
            userMatchCount.set(user1.id, 1);
            userMatchCount.set(user2.id, 1);
            existingPairs.add(pairKey);
          }
        }
      }
    }
    
    // Handle odd number of users - one will remain unmatched
    const finalUnmatched = activeUsers.filter(user => userMatchCount.get(user.id) === 0);
    if (finalUnmatched.length > 0) {
      console.log(`${finalUnmatched.length} user(s) remain unmatched due to odd number of active users`);
      
      // Option 1: Create a notification for unmatched users
      for (const user of finalUnmatched) {
        try {
          await storage.createNotification({
            userId: user.id,
            type: 'no_match',
            title: 'No Match This Month',
            message: 'Due to an odd number of participants, you were not matched this month. You will be prioritized next month!'
          });
        } catch (error) {
          console.log('Failed to create notification for unmatched user:', error);
        }
      }
    }
    
    console.log(`Monthly matching complete. Created ${matches.length} new matches.`);
    return matches;
  }
  
  private async createMatch(user1: User, user2: User, matchScore: number, monthYear: string) {
    const match = await storage.createMatch({
      user1Id: user1.id,
      user2Id: user2.id,
      matchScore,
      monthYear,
      status: 'pending'
    });
    
    // Auto-schedule a meeting 7 days from now at 2 PM
    try {
      const suggestedDate = new Date();
      suggestedDate.setDate(suggestedDate.getDate() + 7);
      suggestedDate.setHours(14, 0, 0, 0); // 2 PM

      await storage.createMeeting({
        matchId: match.id,
        scheduledAt: suggestedDate,
        meetingType: "video",
        duration: 30,
        meetingLink: "https://meet.google.com/wnf-cjab-twp",
        status: "scheduled"
      });

      console.log(`Auto-scheduled meeting for match ${match.id} on ${suggestedDate.toISOString()}`);
    } catch (meetingError) {
      console.log('Could not auto-schedule meeting:', meetingError);
    }
    
    // Send email notifications
    console.log(`🔄 CALLING emailService.sendMatchNotification for match ${match.id}`);
    console.log(`   → User 1: ${user1.email} (${user1.firstName} ${user1.lastName})`);
    console.log(`   → User 2: ${user2.email} (${user2.firstName} ${user2.lastName})`);
    console.log(`   → Match Score: ${matchScore}%`);
    
    try {
      console.log(`📧 About to send match notification email...`);
      await emailService.sendMatchNotification(user1, user2, matchScore);
      console.log(`✅ Email notification completed for match ${match.id}`);
    } catch (error) {
      console.error(`❌ Email notification failed for match ${match.id}:`, error);
      console.error(`❌ Error details:`, error.message);
    }
    
    // Create notifications
    try {
      await storage.createNotification({
        userId: user1.id,
        type: 'match_found',
        title: 'New Match Found!',
        message: `You have a new ${matchScore}% match with ${user2.firstName} ${user2.lastName}. Meeting auto-scheduled for next week.`
      });
      
      await storage.createNotification({
        userId: user2.id,
        type: 'match_found',
        title: 'New Match Found!',
        message: `You have a new ${matchScore}% match with ${user1.firstName} ${user1.lastName}. Meeting auto-scheduled for next week.`
      });
    } catch (error) {
      console.log('Notification creation failed:', error);
    }
    
    return match;
  }
  
  private async calculateMatchScore(user1: User, user2: User, weights?: any): Promise<number> {
    const profile1 = await storage.getProfileQuestions(user1.id);
    const profile2 = await storage.getProfileQuestions(user2.id);
    
    // Default weights (can be overridden from admin settings)
    const defaultWeights = {
      industry: 35,
      company: 20,
      networkingGoals: 30,
      jobTitle: 15
    };
    
    const w = weights || defaultWeights;
    let score = 0;
    let factors = 0;
    
    // Industry matching
    if (user1.industry && user2.industry) {
      factors++;
      if (user1.industry === user2.industry) {
        score += w.industry;
      } else {
        score += this.getIndustryCompatibility(user1.industry, user2.industry);
      }
    }
    
    // Company size/type compatibility
    if (user1.company && user2.company) {
      factors++;
      if (user1.company === user2.company) {
        score += w.company; // Same company
      } else {
        score += this.getCompanyCompatibility(user1.company, user2.company);
      }
    }
    
    // Job title compatibility
    if (user1.jobTitle && user2.jobTitle) {
      factors++;
      score += this.getJobTitleCompatibility(user1.jobTitle, user2.jobTitle, w.jobTitle);
    }
    
    // Networking goals overlap
    if (profile1?.networkingGoals && profile2?.networkingGoals) {
      factors++;
      const goals1 = Array.isArray(profile1.networkingGoals) ? profile1.networkingGoals : [];
      const goals2 = Array.isArray(profile2.networkingGoals) ? profile2.networkingGoals : [];
      
      if (goals1.length > 0 && goals2.length > 0) {
        const overlap = goals1.filter(goal => goals2.includes(goal)).length;
        const union = new Set([...goals1, ...goals2]).size;
        score += (overlap / union) * w.networkingGoals;
      }
    }
    
    // Base compatibility for having profiles
    if (factors === 0) {
      return 40; // Low but not zero for users without much profile data
    }
    
    // Normalize score
    const finalScore = Math.round(Math.min(100, Math.max(0, score * (4 / factors))));
    return finalScore;
  }
  
  private getIndustryCompatibility(industry1: string, industry2: string): number {
    const relatedIndustries: { [key: string]: string[] } = {
      'Technology': ['Software', 'Hardware', 'Cybersecurity', 'AI/ML'],
      'Finance': ['Banking', 'Investment', 'Insurance', 'FinTech'],
      'Healthcare': ['Medical', 'Pharmaceutical', 'Biotech', 'Health Tech'],
      'Marketing': ['Digital Marketing', 'Advertising', 'PR', 'Content'],
      'Consulting': ['Management', 'Strategy', 'Operations', 'Business']
    };
    
    for (const [category, related] of Object.entries(relatedIndustries)) {
      if ((category === industry1 && related.includes(industry2)) ||
          (category === industry2 && related.includes(industry1)) ||
          (related.includes(industry1) && related.includes(industry2))) {
        return 15; // Partial match for related industries
      }
    }
    
    return 5; // Small score for different industries
  }
  
  private getCompanyCompatibility(company1: string, company2: string): number {
    // Same company gets full points (handled above)
    // Different companies get partial points based on size/type
    
    const startups = ['startup', 'inc', 'llc', 'co'];
    const enterprises = ['corp', 'corporation', 'ltd', 'limited', 'group'];
    
    const isStartup1 = startups.some(term => company1.toLowerCase().includes(term));
    const isStartup2 = startups.some(term => company2.toLowerCase().includes(term));
    
    const isEnterprise1 = enterprises.some(term => company1.toLowerCase().includes(term));
    const isEnterprise2 = enterprises.some(term => company2.toLowerCase().includes(term));
    
    if ((isStartup1 && isStartup2) || (isEnterprise1 && isEnterprise2)) {
      return 12; // Similar company types
    }
    
    return 5; // Different company types
  }
  
  private getJobTitleCompatibility(title1: string, title2: string, weight: number): number {
    const senior1 = title1.toLowerCase().includes('senior') || title1.toLowerCase().includes('lead');
    const senior2 = title2.toLowerCase().includes('senior') || title2.toLowerCase().includes('lead');
    
    const roles1 = this.extractRoleKeywords(title1);
    const roles2 = this.extractRoleKeywords(title2);
    
    const commonRoles = roles1.filter(role => roles2.includes(role));
    
    let score = 0;
    
    // Same seniority level
    if (senior1 === senior2) {
      score += weight * 0.3;
    }
    
    // Role overlap
    if (commonRoles.length > 0) {
      score += weight * 0.7;
    } else if (this.areRelatedRoles(roles1, roles2)) {
      score += weight * 0.4;
    }
    
    return Math.min(weight, score);
  }
  
  private extractRoleKeywords(title: string): string[] {
    const keywords = [
      'engineer', 'developer', 'programmer', 'architect',
      'manager', 'director', 'lead', 'coordinator',
      'analyst', 'scientist', 'researcher', 'specialist',
      'designer', 'product', 'marketing', 'sales',
      'consultant', 'advisor', 'founder', 'ceo'
    ];
    
    return keywords.filter(keyword => 
      title.toLowerCase().includes(keyword)
    );
  }
  
  private areRelatedRoles(roles1: string[], roles2: string[]): boolean {
    const relatedGroups = [
      ['engineer', 'developer', 'programmer', 'architect'],
      ['manager', 'director', 'lead', 'coordinator'],
      ['analyst', 'scientist', 'researcher'],
      ['designer', 'product'],
      ['marketing', 'sales'],
      ['consultant', 'advisor'],
      ['founder', 'ceo']
    ];
    
    for (const group of relatedGroups) {
      const hasRole1 = roles1.some(role => group.includes(role));
      const hasRole2 = roles2.some(role => group.includes(role));
      
      if (hasRole1 && hasRole2) {
        return true;
      }
    }
    
    return false;
  }
}

export const matchingService = new MatchingService();
