const sgMail = require('@sendgrid/mail');
require('dotenv').config();

// Set API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Test email function
async function testSendGrid() {
  try {
    console.log('🔑 API Key loaded:', process.env.SENDGRID_API_KEY ? 'Yes' : 'No');
    console.log('📧 From Email:', process.env.SENDGRID_FROM_EMAIL);
    
    const msg = {
      to: 'ahmedwaleedusa@gmail.com', // Ahmed's email
      from: process.env.SENDGRID_FROM_EMAIL, // Use the verified sender
      subject: 'SendGrid Test Email - SpeedForce Digital',
      text: 'This is a test email from SendGrid integration.',
      html: '<strong>This is a test email from SendGrid integration.</strong>',
    };

    console.log('📤 Sending test email...');
    const response = await sgMail.send(msg);
    console.log('✅ Email sent successfully!');
    console.log('📋 Response:', response[0].statusCode);
    
  } catch (error) {
    console.error('❌ Error sending email:', error);
    if (error.response) {
      console.error('Response body:', error.response.body);
    }
  }
}

testSendGrid();
