import cron from 'node-cron';
import { matchingService } from './matching';
import { storage } from '../storage';
import { emailService } from './email';

class SchedulerService {
  init() {
    // Run monthly matching on the 1st of each month at 9 AM
    cron.schedule('0 9 1 * *', async () => {
      console.log('Running scheduled monthly matching...');
      try {
        await matchingService.runMonthlyMatching();
      } catch (error) {
        console.error('Error in scheduled matching:', error);
      }
    });

    // Send meeting reminders daily at 9 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('Checking for meeting reminders...');
      try {
        await this.sendMeetingReminders();
      } catch (error) {
        console.error('Error sending meeting reminders:', error);
      }
    });

    console.log('Scheduled tasks initialized');
  }

  private async sendMeetingReminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    // Get all users to check their meetings
    const users = await storage.getAllUsers();
    
    for (const user of users) {
      const meetings = await storage.getMeetingsByUser(user.id);
      
      for (const meetingWithMatch of meetings) {
        const meeting = meetingWithMatch;
        const scheduledDate = meeting.scheduledAt ? new Date(meeting.scheduledAt) : null;
        
        if (scheduledDate && 
            scheduledDate >= tomorrow && 
            scheduledDate < dayAfterTomorrow &&
            meeting.status === 'scheduled') {
          
          // Determine the other user in the meeting
          const otherUser = meeting.match.user1Id === user.id 
            ? meeting.match.user2 
            : meeting.match.user1;
          
          await emailService.sendMeetingReminder(user, otherUser, meeting);
        }
      }
    }
  }

  // Manual trigger for testing
  async triggerMonthlyMatching() {
    return await matchingService.runMonthlyMatching();
  }
}

export const schedulerService = new SchedulerService();
