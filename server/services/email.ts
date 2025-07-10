import { MailService } from '@sendgrid/mail';
import { formatInTimeZone } from 'date-fns-tz';
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
        const formattedDate = formatInTimeZone(meetingDate, 'America/New_York', 'EEEE, MMMM d, yyyy');
        const formattedTime = formatInTimeZone(meetingDate, 'America/New_York', 'h:mm a');
        const timezone = formatInTimeZone(meetingDate, 'America/New_York', 'zzz');
        
        // Create Google Calendar link with proper timezone handling
        // Convert Eastern Time to UTC for Google Calendar
        const startDate = meetingDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const endDate = new Date(meetingDate.getTime() + 30 * 60000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const eventTitle = encodeURIComponent(`Networking Meeting: ${recipient.firstName} & ${partner.firstName}`);
        const eventDetails = encodeURIComponent(`Meeting with ${partner.firstName} from ${communityName}. Join: ${matchMeeting.meetingLink}`);
        
        calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${startDate}/${endDate}&details=${eventDetails}&location=${encodeURIComponent(matchMeeting.meetingLink)}`;
        
        meetingDetails = `
Date and time: ${formattedDate} at ${formattedTime} ${timezone}
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
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                ${calendarLink ? `<a href="${calendarLink}" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">📅 Add to Calendar</a>` : ''}
                <a href="${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'https://matches.community'}" style="display: inline-block; background: #f97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">🔄 Reschedule</a>
              </div>
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
      return formatInTimeZone(date, 'America/New_York', 'EEEE, MMMM d, yyyy \'at\' h:mm a zzz');
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
          <p><strong>Time:</strong> ${meeting.scheduledAt ? formatInTimeZone(new Date(meeting.scheduledAt), 'America/New_York', 'h:mm a zzz') : 'TBD'}</p>
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

  async sendAdminMatchSummary(adminUser: User, organizationName: string, matches: any[], meetings: any[]) {
    if (!this.isConfigured) {
      console.log(`📧 [SIMULATED] Admin match summary email would be sent to ${adminUser.email}`);
      return;
    }

    const subject = `📊 ${organizationName} - New Matches & Meetings Summary`;
    const fromEmail = process.env.EMAIL_FROM || 'no-reply@matches.community';
    
    // Create meetings table HTML
    const meetingsTableRows = meetings.map(meeting => {
      const formatMeetingDate = (date: Date) => {
        return formatInTimeZone(date, 'America/New_York', 'MMM d, yyyy \'at\' h:mm a zzz');
      };

      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px; text-align: left;">${meeting.match?.user1?.firstName} ${meeting.match?.user1?.lastName} & ${meeting.match?.user2?.firstName} ${meeting.match?.user2?.lastName}</td>
          <td style="padding: 12px; text-align: left;">${meeting.scheduledAt ? formatMeetingDate(new Date(meeting.scheduledAt)) : 'Pending'}</td>
          <td style="padding: 12px; text-align: left;">${meeting.duration} min</td>
          <td style="padding: 12px; text-align: left;">${meeting.meetingType === 'video' ? 'Video Call' : meeting.meetingType === 'coffee' ? 'Coffee Chat' : 'Meeting'}</td>
          <td style="padding: 12px; text-align: left;">
            ${meeting.meetingLink ? `<a href="${meeting.meetingLink}" style="color: #2563eb; text-decoration: underline;">Join Meeting</a>` : 'TBD'}
          </td>
        </tr>
      `;
    }).join('');

    const matchesTableRows = matches.map(match => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; text-align: left;">${match.user1?.firstName} ${match.user1?.lastName}</td>
        <td style="padding: 12px; text-align: left;">${match.user2?.firstName} ${match.user2?.lastName}</td>
        <td style="padding: 12px; text-align: left;">${match.matchScore}%</td>
        <td style="padding: 12px; text-align: left;">
          <span style="background: ${match.meeting ? '#10b981' : '#6b7280'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
            ${match.meeting ? 'Meeting Scheduled' : 'Pending'}
          </span>
        </td>
      </tr>
    `).join('');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 28px;">${organizationName}</h1>
          <h2 style="color: #1e293b; margin: 10px 0 0 0; font-size: 20px;">Community Activity Summary</h2>
        </div>
        
        <p style="color: #475569; font-size: 16px;">Hi ${adminUser.firstName},</p>
        
        <p style="color: #475569; font-size: 16px;">Here's a summary of the latest activity in your ${organizationName} community:</p>
        
        ${matches.length > 0 ? `
        <div style="margin: 30px 0;">
          <h3 style="color: #1e293b; border-bottom: 2px solid #2563eb; padding-bottom: 8px;">🤝 New Matches (${matches.length})</h3>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">User 1</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">User 2</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Match Score</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${matchesTableRows}
              </tbody>
            </table>
          </div>
        </div>
        ` : ''}

        ${meetings.length > 0 ? `
        <div style="margin: 30px 0;">
          <h3 style="color: #1e293b; border-bottom: 2px solid #2563eb; padding-bottom: 8px;">📅 Scheduled Meetings (${meetings.length})</h3>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Participants</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Date & Time</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Duration</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Type</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Meeting Link</th>
                </tr>
              </thead>
              <tbody>
                ${meetingsTableRows}
              </tbody>
            </table>
          </div>
        </div>
        ` : ''}

        <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
          <h3 style="margin: 0 0 10px 0; font-size: 18px;">Community Dashboard</h3>
          <p style="margin: 0 0 15px 0; opacity: 0.9;">Monitor all community activity and manage settings</p>
          <a href="${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}/admin` : '#'}" 
             style="display: inline-block; background: white; color: #2563eb; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            View Admin Dashboard
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #6b7280; font-size: 14px;">
          <p>This is an automated summary from your Matches.Community platform.</p>
          <p>To manage these notifications, visit your admin dashboard.</p>
        </div>
      </div>
    `;

    try {
      await this.mailService.send({
        from: {
          email: fromEmail,
          name: 'Matches.Community Admin'
        },
        to: adminUser.email,
        subject,
        html: htmlContent,
      });

      console.log(`✅ Admin summary email sent to ${adminUser.email} for ${organizationName}`);
    } catch (error) {
      console.error('❌ Failed to send admin summary email:', error);
    }
  }
}

export const emailService = new EmailService();