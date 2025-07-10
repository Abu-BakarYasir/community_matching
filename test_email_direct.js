// Direct email test using the same configuration as the app
const { MailService } = require('@sendgrid/mail');

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

const testEmail = {
  to: 'averyjs@gmail.com',
  from: 'avery@dataanalystroadmap.com',
  subject: '🎯 Test Match Notification - DAA Monthly Matching',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2px;">
      <div style="background: white; color: #333; margin: 2px; padding: 30px; border-radius: 8px;">
        <h2 style="color: #667eea; margin-top: 0;">🎯 Test Match Notification</h2>
        <p>This is a test to verify that match notification emails are working properly.</p>
        <p>If you receive this email, the SendGrid integration is functioning correctly.</p>
      </div>
    </div>
  `
};

console.log('Sending test match notification email...');
console.log('To:', testEmail.to);
console.log('From:', testEmail.from);

mailService.send(testEmail)
  .then((response) => {
    console.log('✅ Test email sent successfully!');
    console.log('Status Code:', response[0].statusCode);
    console.log('Message ID:', response[0].headers['x-message-id']);
    console.log('Response Body:', response[0].body);
  })
  .catch((error) => {
    console.error('❌ Error sending test email:', error);
    if (error.response) {
      console.error('Error Response:', error.response.body);
    }
  });