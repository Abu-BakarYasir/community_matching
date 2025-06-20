import { storage } from '../storage';
import { emailService } from './email';
import type { User, ProfileQuestions } from '@shared/schema';

class MatchingService {
  async runMonthlyMatching() {
    console.log('Starting monthly matching process...');
    
    const currentDate = new Date();
    const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Get all active users
    const users = await storage.getAllUsers();
    const activeUsers = users.filter(user => user.isActive);
    
    console.log(`Found ${activeUsers.length} active users for matching`);
    
    // Get existing matches for this month to avoid duplicates
    const existingMatches = await storage.getMatchesByMonth(monthYear);
    const existingPairs = new Set(
      existingMatches.map(match => 
        [match.user1Id, match.user2Id].sort().join('-')
      )
    );
    
    const matches = [];
    
    // Generate matches for each user
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
        const matchScore = await this.calculateMatchScore(user1, user2);
        
        // Only create matches with score >= 60%
        if (matchScore >= 60) {
          const match = await storage.createMatch({
            user1Id: user1.id,
            user2Id: user2.id,
            matchScore,
            monthYear,
            status: 'pending'
          });
          
          matches.push(match);
          
          // Send email notifications
          await emailService.sendMatchNotification(user1, user2, matchScore);
          
          // Create notifications
          await storage.createNotification({
            userId: user1.id,
            type: 'match_found',
            title: 'New Match Found!',
            message: `You have a new ${matchScore}% match with ${user2.firstName} ${user2.lastName}`
          });
          
          await storage.createNotification({
            userId: user2.id,
            type: 'match_found',
            title: 'New Match Found!',
            message: `You have a new ${matchScore}% match with ${user1.firstName} ${user1.lastName}`
          });
        }
      }
    }
    
    console.log(`Monthly matching complete. Created ${matches.length} new matches.`);
    return matches;
  }
  
  private async calculateMatchScore(user1: User, user2: User): Promise<number> {
    const profile1 = await storage.getProfileQuestions(user1.id);
    const profile2 = await storage.getProfileQuestions(user2.id);
    
    let score = 0;
    let factors = 0;
    
    // Industry matching (25% weight)
    if (user1.industry && user2.industry) {
      factors++;
      if (user1.industry === user2.industry) {
        score += 25;
      } else {
        // Related industries get partial score
        score += this.getIndustryCompatibility(user1.industry, user2.industry);
      }
    }
    
    // Experience level matching (20% weight)
    if (user1.experienceLevel && user2.experienceLevel) {
      factors++;
      score += this.getExperienceCompatibility(user1.experienceLevel, user2.experienceLevel);
    }
    
    // Networking goals overlap (30% weight)
    if (profile1?.networkingGoals && profile2?.networkingGoals) {
      factors++;
      const goals1 = profile1.networkingGoals as string[];
      const goals2 = profile2.networkingGoals as string[];
      const overlap = goals1.filter(goal => goals2.includes(goal)).length;
      const maxGoals = Math.max(goals1.length, goals2.length);
      score += (overlap / maxGoals) * 30;
    }
    
    // Availability compatibility (15% weight)
    if (profile1?.availabilityPreferences && profile2?.availabilityPreferences) {
      factors++;
      const avail1 = profile1.availabilityPreferences as string[];
      const avail2 = profile2.availabilityPreferences as string[];
      const overlap = avail1.filter(time => avail2.includes(time)).length;
      const maxAvail = Math.max(avail1.length, avail2.length);
      score += (overlap / maxAvail) * 15;
    }
    
    // Interests overlap (10% weight)
    if (profile1?.interests && profile2?.interests) {
      factors++;
      const interests1 = profile1.interests as string[];
      const interests2 = profile2.interests as string[];
      const overlap = interests1.filter(interest => interests2.includes(interest)).length;
      const maxInterests = Math.max(interests1.length, interests2.length);
      score += (overlap / maxInterests) * 10;
    }
    
    // Normalize score based on available factors
    if (factors === 0) return 50; // Default score if no data
    
    return Math.round(Math.min(100, Math.max(0, score)));
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
  
  private getExperienceCompatibility(exp1: string, exp2: string): number {
    const levels = ['0-2', '3-5', '6-10', '10+'];
    const idx1 = levels.indexOf(exp1);
    const idx2 = levels.indexOf(exp2);
    
    if (idx1 === -1 || idx2 === -1) return 10;
    
    const diff = Math.abs(idx1 - idx2);
    
    if (diff === 0) return 20; // Same level
    if (diff === 1) return 15; // Adjacent levels
    if (diff === 2) return 10; // Two levels apart
    return 5; // Far apart
  }
}

export const matchingService = new MatchingService();
