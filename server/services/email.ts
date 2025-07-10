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
      console.log(`   → API Key: ${process.env.SENDGRID_API_KEY.substring(0, 10)}...`);
      console.log(`   → Default sender: ${process.env.EMAIL_FROM || 'no-reply@matches.community'}`);
      console.log('   → Verify your sender email is authenticated in SendGrid dashboard');
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

    // Import storage service at the top of the function
    const { storage } = await import('../storage');
    
    // Get community name for the email
    let communityName = 'Your Community';
    if (user1.organizationId) {
      const organization = await storage.getOrganization(user1.organizationId);
      if (organization) {
        communityName = organization.name;
      }
    }

    // Use verified sender identity from Matches.Community domain
    const fromEmail = process.env.EMAIL_FROM || 'no-reply@matches.community';
    
    // Get the actual meeting for this specific match from the database
    let matchMeeting = null;
    try {
      // Look for the newest match (just created) between these two users
      const allMatches = await storage.getAllMatches();
      
      // Sort by ID descending to get the newest match first
      const sortedMatches = allMatches.sort((a, b) => b.id - a.id);
      
      const currentMatch = sortedMatches.find(match => 
        (match.user1Id === user1.id && match.user2Id === user2.id) ||
        (match.user1Id === user2.id && match.user2Id === user1.id)
      );
      
      console.log(`📅 Looking for meeting for newest match between ${user1.id} and ${user2.id}`);
      console.log(`📅 Found match:`, currentMatch ? `ID ${currentMatch.id}` : 'No match found');
      
      if (currentMatch) {
        // Get all meetings and find the one for this match
        const allMeetings = await storage.getAllMeetings();
        matchMeeting = allMeetings.find(meeting => meeting.matchId === currentMatch.id);
        
        console.log(`📅 Found meeting:`, matchMeeting ? `ID ${matchMeeting.id} scheduled for ${matchMeeting.scheduledAt} with link ${matchMeeting.meetingLink}` : 'No meeting found');
      }
    } catch (error) {
      console.log(`⚠️ Error fetching meeting data:`, error.message);
    }

    const createEmailContent = (recipient: User, partner: User) => {
      const subject = `[${communityName}] - ${recipient.firstName} <> ${partner.firstName}`;
      
      // Format meeting date and time if available
      let meetingDetails;
      let calendarLink = '';
      
      if (matchMeeting) {
        const meetingDate = new Date(matchMeeting.scheduledAt);
        const formattedDate = meetingDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        const formattedTime = meetingDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        // Create Google Calendar link
        const startDate = meetingDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const endDate = new Date(meetingDate.getTime() + 30 * 60000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const eventTitle = encodeURIComponent(`Networking Meeting: ${recipient.firstName} & ${partner.firstName}`);
        const eventDetails = encodeURIComponent(`Meeting with ${partner.firstName} from ${communityName}. Join: ${matchMeeting.meetingLink}`);
        
        calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${startDate}/${endDate}&details=${eventDetails}&location=${encodeURIComponent(matchMeeting.meetingLink)}`;
        
        meetingDetails = `
Date and time: ${formattedDate} at ${formattedTime}
Link: ${matchMeeting.meetingLink}
        `.trim();
      } else {
        meetingDetails = `
Date and time: Your meeting will be scheduled soon
Link: Will be provided once scheduled
        `.trim();
      }

      return {
        from: {
          email: fromEmail,
          name: 'Matches.Community'
        },
        to: recipient.email,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <p>Hi ${recipient.firstName},</p>
            
            <p>Great news. You matched with someone in your community. ${recipient.firstName}, meet ${partner.firstName}.</p>
            
            <p>Your meeting has been automatically scheduled.</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
              <p style="margin: 0 0 10px 0;"><strong>Your match - ${partner.firstName}</strong></p>
              <p style="margin: 0 0 15px 0; white-space: pre-line;">${meetingDetails}</p>
              ${calendarLink ? `<a href="${calendarLink}" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">📅 Add to Calendar</a>` : ''}
            </div>
            
            <p>Enjoy your chat!</p>
            
            <p>${communityName} Matching Team</p>
          </div>
        `
      };
    };

    try {
      // Create email content for debugging
      const email1Content = createEmailContent(user1, user2);
      const email2Content = createEmailContent(user2, user1);
      
      console.log(`📧 Sending emails via SendGrid API...`);
      console.log(`   → FROM: ${fromEmail}`);
      console.log(`   → TO: ${user1.email}, ${user2.email}`);
      console.log(`   → Email 1 Subject: ${email1Content.subject}`);
      console.log(`   → Email 2 Subject: ${email2Content.subject}`);
      
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
    const fromEmail = process.env.EMAIL_FROM || 'no-reply@matches.community';
    
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
          from: {
            email: fromEmail,
            name: 'Matches.Community'
          },
          to: user1.email,
          subject,
          html: htmlContent,
        }),
        this.mailService.send({
          from: {
            email: fromEmail,
            name: 'Matches.Community'
          },
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
    const fromEmail = process.env.EMAIL_FROM || 'no-reply@matches.community';
    
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
        from: {
          email: fromEmail,
          name: 'Matches.Community'
        },
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