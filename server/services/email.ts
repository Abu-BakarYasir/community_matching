import { MailService } from '@sendgrid/mail';
import type { User, Match, Meeting } from '@shared/schema';

class EmailService {
  private mailService: MailService;
  private isConfigured: boolean;

  constructor() {
    this.mailService = new MailService();
    this.isConfigured = !!process.env.SENDGRID_API_KEY;
    
    if (this.isConfigured) {
      this.mailService.setApiKey(process.env.SENDGRID_API_KEY!);
      console.log('✅ SendGrid email service initialized');
    } else {
      console.log('⚠️ SENDGRID_API_KEY not found. Email functionality will be simulated.');
    }
  }

  async sendMatchNotification(user1: User, user2: User, matchScore: number) {
    const subject = '🎉 New Networking Match Found!';
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0066CC;">You have a new networking match!</h2>
        
        <p>Hi ${user1.firstName},</p>
        
        <p>Great news! We've found a new networking match for you with a <strong>${matchScore}% compatibility score</strong>.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e293b;">Your Match:</h3>
          <p><strong>${user2.firstName} ${user2.lastName}</strong></p>
          <p>${user2.jobTitle} at ${user2.company}</p>
          <p>Industry: ${user2.industry}</p>
        </div>
        
        <p>Ready to connect? Log in to your NetworkMatch dashboard to schedule a meeting!</p>
        
        <a href="${process.env.APP_URL || 'http://localhost:5000'}/dashboard" 
           style="display: inline-block; background: #0066CC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          View Match & Schedule Meeting
        </a>
        
        <p>Best regards,<br>The NetworkMatch Team</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.EMAIL_FROM || '"NetworkMatch" <noreply@networkmatch.com>',
        to: user1.email,
        subject,
        html: htmlContent,
      });

      // Send to user2 as well
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.EMAIL_FROM || '"NetworkMatch" <noreply@networkmatch.com>',
        to: user2.email,
        subject,
        html: htmlContent.replace(user1.firstName, user2.firstName).replace(`${user2.firstName} ${user2.lastName}`, `${user1.firstName} ${user1.lastName}`).replace(`${user2.jobTitle} at ${user2.company}`, `${user1.jobTitle} at ${user1.company}`).replace(`Industry: ${user2.industry}`, `Industry: ${user1.industry}`),
      });

      console.log(`Match notification emails sent to ${user1.email} and ${user2.email}`);
    } catch (error) {
      console.error('Failed to send match notification:', error);
    }
  }

  async sendMeetingScheduledNotification(user1: User, user2: User, meeting: Meeting) {
    const subject = '📅 Meeting Scheduled - NetworkMatch';
    
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
        
        <p>Best regards,<br>The NetworkMatch Team</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.EMAIL_FROM || '"NetworkMatch" <noreply@networkmatch.com>',
        to: user1.email,
        subject,
        html: htmlContent,
      });

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.EMAIL_FROM || '"NetworkMatch" <noreply@networkmatch.com>',
        to: user2.email,
        subject,
        html: htmlContent.replace(user1.firstName, user2.firstName).replace(`${user2.firstName} ${user2.lastName}`, `${user1.firstName} ${user1.lastName}`),
      });

      console.log(`Meeting notification emails sent to ${user1.email} and ${user2.email}`);
    } catch (error) {
      console.error('Failed to send meeting notification:', error);
    }
  }

  async sendMeetingReminder(user: User, otherUser: User, meeting: Meeting) {
    const subject = '⏰ Meeting Reminder - Tomorrow!';
    
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
        
        <p>Best regards,<br>The NetworkMatch Team</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.EMAIL_FROM || '"NetworkMatch" <noreply@networkmatch.com>',
        to: user.email,
        subject,
        html: htmlContent,
      });

      console.log(`Meeting reminder sent to ${user.email}`);
    } catch (error) {
      console.error('Failed to send meeting reminder:', error);
    }
  }
}

export const emailService = new EmailService();
