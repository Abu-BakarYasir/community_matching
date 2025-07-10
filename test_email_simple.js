// Test script to verify email functionality using SendGrid directly
import { MailService } from '@sendgrid/mail';

async function testEmail() {
  console.log('Testing SendGrid email directly...');
  
  if (!process.env.SENDGRID_API_KEY) {
    console.error('❌ SENDGRID_API_KEY environment variable not set');
    return;
  }
  
  const mailService = new MailService();
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
  
  const emailData = {
    from: {
      email: process.env.EMAIL_FROM || 'no-reply@matches.community',
      name: 'Matches.Community Admin Test'
    },
    to: 'averyjs@gmail.com',
    subject: '🧪 Test Admin Summary Email - Matches.Community',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Test Email Working!</h1>
        <p>Hi Avery,</p>
        <p>This is a test email to confirm that the admin notification system is working correctly.</p>
        <p>✅ SendGrid API key is configured</p>
        <p>✅ Email service is functional</p>
        <p>✅ Admin notifications will be sent automatically when matches are created</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <h3>Admin Notification Features:</h3>
          <ul>
            <li>Monthly matching completion summaries</li>
            <li>Real-time meeting scheduling updates</li>
            <li>Professional HTML formatted emails</li>
            <li>Eastern Time formatting for all dates</li>
          </ul>
        </div>
        <p>Best regards,<br>Matches.Community Platform</p>
      </div>
    `
  };
  
  try {
    console.log('Sending test email via SendGrid...');
    const result = await mailService.send(emailData);
    console.log('✅ Test email sent successfully!');
    console.log('✅ SendGrid response:', {
      statusCode: result[0]?.statusCode,
      messageId: result[0]?.headers?.['x-message-id']
    });
  } catch (error) {
    console.error('❌ Test email failed:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.body
    });
  }
}

testEmail();