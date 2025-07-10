const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'averyjs@gmail.com',
  from: 'avery@dataanalystroadmap.com', 
  subject: 'Test Email from Matches.Community',
  text: 'This is a test email to verify SendGrid configuration.',
  html: '<strong>This is a test email to verify SendGrid configuration.</strong>',
};

console.log('Sending test email...');
sgMail
  .send(msg)
  .then((response) => {
    console.log('✅ Email sent successfully!');
    console.log('Status Code:', response[0].statusCode);
    console.log('Message ID:', response[0].headers['x-message-id']);
  })
  .catch((error) => {
    console.error('❌ Error sending email:', error);
    if (error.response) {
      console.error('Error body:', error.response.body);
    }
  });