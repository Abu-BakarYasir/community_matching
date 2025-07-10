import { MailService } from '@sendgrid/mail';
import type { User, Meeting } from '@shared/schema';
import { timeSlotService } from './timeSlots';

class EmailService {
  private mailService: MailService;
  private isConfigured: boolean;

  constructor() {
    this.mailService = new MailService();
    this.isConfigured = !!process.env.SENDGRID_API_KEY;
    
    if (this.isConfigured) {
      this.mailService.setApiKey(process.env.SENDGRID_API_KEY!);
      console.log('✅ SendGrid email service initialized');
      console.log('   Note: Verify your sender email is authenticated in SendGrid dashboard');
    } else {
      console.log('⚠️ SENDGRID_API_KEY not found. Email functionality will be simulated.');
    }
  }

  async sendMatchNotification(user1: User, user2: User, matchScore: number) {
    if (!this.isConfigured) {
      console.log(`📧 [SIMULATED] Match notification emails would be sent to ${user1.email} and ${user2.email} (Match Score: ${matchScore}%)`);
      return;
    }

    console.log(`📧 Preparing to send match notification emails via SendGrid...`);
    console.log(`   Recipients: ${user1.email}, ${user2.email}`);
    console.log(`   Match Score: ${matchScore}%`);

    const subject = '🎯 New Match Found - DAA Monthly Matching';
    // Use verified sender identity from DataAnalystRoadmap.com domain
    const fromEmail = process.env.EMAIL_FROM || 'avery@dataanalystroadmap.com';
    
    // Get suggested meeting times and check if meeting already exists
    const suggestedTimes = await timeSlotService.getSuggestedMeetingTimes(user1.id, user2.id);
    
    // Check if there's already a scheduled meeting for this match
    const user1Meetings = await storage.getMeetingsByUser(user1.id);
    const user2Meetings = await storage.getMeetingsByUser(user2.id);
    
    const matchMeeting = [...user1Meetings, ...user2Meetings].find(m => {
      if (!m.match) return false;
      return (m.match.user1Id === user1.id && m.match.user2Id === user2.id) ||
             (m.match.user1Id === user2.id && m.match.user2Id === user1.id);
    });

    const { storage } = await import('../storage');
    const createEmailContent = (recipient: User, partner: User) => {
      // Meeting information section
      const meetingInfoHtml = matchMeeting 
        ? `
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #28a745; margin-top: 0;">📅 Meeting Scheduled</h3>
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 10px 0;">
              <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${new Date(matchMeeting.scheduledAt).toLocaleDateString()} at ${new Date(matchMeeting.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              <p style="margin: 5px 0;"><strong>Duration:</strong> ${matchMeeting.duration} minutes</p>
              <p style="margin: 5px 0;"><strong>Meeting Link:</strong> <a href="${matchMeeting.meetingLink}" style="color: #667eea; text-decoration: none;">${matchMeeting.meetingLink}</a></p>
            </div>
            <div style="text-align: center; margin-top: 15px;">
              <a href="${matchMeeting.meetingLink}" 
                 style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 14px; margin-right: 10px;">
                Join Meeting
              </a>
              <a href="https://daa-monthly-matching.replit.app/dashboard" 
                 style="background: #6c757d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 14px;">
                Reschedule
              </a>
            </div>
          </div>
        `
        : suggestedTimes.length > 0 
        ? `
          <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-top: 0;">🗓️ Auto-Scheduled Meeting</h3>
            <p style="margin-bottom: 15px;">We've automatically scheduled your meeting for next week at 2 PM. You can reschedule if needed.</p>
            <div style="background: #fff8dc; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h4 style="margin-top: 0; color: #b8860b;">Alternative Times Available:</h4>
              ${suggestedTimes.slice(0, 3).map(slot => 
                `<div style="background: white; padding: 10px; margin: 8px 0; border-radius: 5px; border-left: 4px solid #667eea;">
                  <strong>${slot.dayName}, ${new Date(slot.date).toLocaleDateString()}</strong> at ${slot.time}
                </div>`
              ).join('')}
            </div>
          </div>
        `
        : `
          <div style="background: #fff8dc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #b8860b; margin: 0;">💡 Meeting auto-scheduled for next week. Set your availability in the dashboard to see more options!</p>
          </div>
        `;

      return {
        from: fromEmail,
        to: recipient.email,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2px;">
            <div style="background: white; color: #333; margin: 2px; padding: 30px; border-radius: 8px;">
              <h2 style="color: #667eea; margin-top: 0;">🎯 You've been matched!</h2>
              
              <p>Hi ${recipient.firstName},</p>
              
              <p>Great news! We've found you a networking match based on your professional profile and goals.</p>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                <h3 style="margin-top: 0; color: #1e293b;">Your Match:</h3>
                <p style="margin: 8px 0;"><strong>${partner.firstName} ${partner.lastName}</strong></p>
                <p style="margin: 4px 0; color: #64748b;">${partner.jobTitle || 'Professional'} ${partner.company ? `at ${partner.company}` : ''}</p>
                <p style="margin: 4px 0; color: #64748b;">Industry: ${partner.industry || 'Various'}</p>
              </div>
              
              <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #059669;"><strong>Match Score: ${matchScore}%</strong></p>
                <div style="background: #d1fae5; height: 8px; border-radius: 4px; margin-top: 8px;">
                  <div style="background: #10b981; height: 8px; border-radius: 4px; width: ${matchScore}%;"></div>
                </div>
              </div>
              
              ${meetingInfoHtml}
              
              <p>This match was made based on your professional backgrounds, networking goals, and industry compatibility.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://daa-monthly-matching.replit.app/dashboard" 
                   style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                  View Dashboard
                </a>
              </div>
              
              <p>Best regards,<br>The DAA Monthly Matching Team</p>
            </div>
          </div>
        `
      };
    };

    try {
      console.log(`📧 Sending emails via SendGrid API...`);
      console.log(`   → FROM: ${fromEmail}`);
      console.log(`   → TO: ${user1.email}, ${user2.email}`);
      console.log(`   → SUBJECT: ${subject}`);
      
      // Create email content for debugging
      const email1Content = createEmailContent(user1, user2);
      const email2Content = createEmailContent(user2, user1);
      
      console.log(`   → Email 1 TO: ${email1Content.to}`);
      console.log(`   → Email 2 TO: ${email2Content.to}`);
      
      // Send emails to both users using SendGrid
      const emailPromises = [
        this.mailService.send(email1Content),
        this.mailService.send(email2Content)
      ];

      const results = await Promise.all(emailPromises);
      
      console.log(`✅ SUCCESS: Match notification emails sent via SendGrid!`);
      console.log(`   → Email 1 sent to ${user1.email}`);
      console.log(`   → Email 2 sent to ${user2.email}`);
      console.log(`   → Match Score: ${matchScore}%`);
      console.log('   → SendGrid Response Details:', JSON.stringify(results.map(r => ({
        statusCode: r[0]?.statusCode,
        body: r[0]?.body,
        headers: r[0]?.headers?.['x-message-id']
      })), null, 2));
      
    } catch (error) {
      console.error('❌ FAILED: Error sending match notification via SendGrid:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error response:', error.response?.body);
      if (error.response && error.response.body && error.response.body.errors) {
        console.error('❌ SendGrid error details:', JSON.stringify(error.response.body.errors, null, 2));
      }
      // Don't throw error to prevent blocking the matching process
    }
  }

  async sendMeetingScheduledNotification(user1: User, user2: User, meeting: Meeting) {
    if (!this.isConfigured) {
      console.log(`📧 [SIMULATED] Meeting scheduled notification emails would be sent to ${user1.email} and ${user2.email}`);
      return;
    }

    const subject = '📅 Meeting Scheduled - DAA Monthly Matching';
    const fromEmail = process.env.EMAIL_FROM || 'avery@dataanalystroadmap.com';
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    };

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0066CC;">Your networking meeting is scheduled!</h2>
        
        <p>Hi ${user1.firstName},</p>
        
        <p>Your meeting with <strong>${user2.firstName} ${user2.lastName}</strong> has been scheduled.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e293b;">Meeting Details:</h3>
          <p><strong>Date & Time:</strong> ${meeting.scheduledAt ? formatDate(new Date(meeting.scheduledAt)) : 'TBD'}</p>
          <p><strong>Duration:</strong> ${meeting.duration} minutes</p>
          <p><strong>Type:</strong> ${meeting.meetingType === 'video' ? 'Video Call' : meeting.meetingType === 'coffee' ? 'Coffee Chat' : 'Meeting'}</p>
          ${meeting.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${meeting.meetingLink}">${meeting.meetingLink}</a></p>` : ''}
          ${meeting.location ? `<p><strong>Location:</strong> ${meeting.location}</p>` : ''}
        </div>
        
        <p>A calendar invite has been sent to both participants. We're excited for you to connect!</p>
        
        <p>Best regards,<br>The DAA Monthly Matching Team</p>
      </div>
    `;

    try {
      await Promise.all([
        this.mailService.send({
          from: fromEmail,
          to: user1.email,
          subject,
          html: htmlContent,
        }),
        this.mailService.send({
          from: fromEmail,
          to: user2.email,
          subject,
          html: htmlContent.replace(user1.firstName, user2.firstName).replace(`${user2.firstName} ${user2.lastName}`, `${user1.firstName} ${user1.lastName}`),
        })
      ]);

      console.log(`✅ Meeting notification emails sent via SendGrid to ${user1.email} and ${user2.email}`);
    } catch (error) {
      console.error('❌ Failed to send meeting notification via SendGrid:', error);
    }
  }

  async sendMeetingReminder(user: User, otherUser: User, meeting: Meeting) {
    if (!this.isConfigured) {
      console.log(`📧 [SIMULATED] Meeting reminder email would be sent to ${user.email}`);
      return;
    }

    const subject = '⏰ Meeting Reminder - Tomorrow!';
    const fromEmail = process.env.EMAIL_FROM || 'avery@dataanalystroadmap.com';
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0066CC;">Reminder: Your meeting is tomorrow!</h2>
        
        <p>Hi ${user.firstName},</p>
        
        <p>This is a friendly reminder that you have a networking meeting scheduled for tomorrow with <strong>${otherUser.firstName} ${otherUser.lastName}</strong>.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e293b;">Meeting Details:</h3>
          <p><strong>Time:</strong> ${meeting.scheduledAt ? new Date(meeting.scheduledAt).toLocaleTimeString() : 'TBD'}</p>
          <p><strong>Duration:</strong> ${meeting.duration} minutes</p>
          <p><strong>Type:</strong> ${meeting.meetingType === 'video' ? 'Video Call' : meeting.meetingType === 'coffee' ? 'Coffee Chat' : 'Meeting'}</p>
          ${meeting.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${meeting.meetingLink}">${meeting.meetingLink}</a></p>` : ''}
          ${meeting.location ? `<p><strong>Location:</strong> ${meeting.location}</p>` : ''}
        </div>
        
        <p>Looking forward to a great networking session!</p>
        
        <p>Best regards,<br>The DAA Monthly Matching Team</p>
      </div>
    `;

    try {
      await this.mailService.send({
        from: fromEmail,
        to: user.email,
        subject,
        html: htmlContent,
      });

      console.log(`✅ Meeting reminder email sent via SendGrid to ${user.email}`);
    } catch (error) {
      console.error('❌ Failed to send meeting reminder via SendGrid:', error);
    }
  }
}

export const emailService = new EmailService();