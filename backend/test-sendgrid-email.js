const sgMail = require('@sendgrid/mail');
require('dotenv').config();

console.log('🧪 Testing SendGrid Email Configuration...\n');

// Set API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Test email configuration
const testEmail = async () => {
  try {
    console.log('🔑 API Key configured:', process.env.SENDGRID_API_KEY ? 'Yes' : 'No');
    console.log('📧 From Email:', process.env.SENDGRID_FROM_EMAIL);
    console.log('📮 Test Email Target: ahmedwaleedusa@gmail.com');
    console.log('');

    const msg = {
      to: 'ahmedwaleedusa@gmail.com',
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: 'SendGrid Test Email - SpeedForce Digital',
      text: 'This is a test email from your SpeedForce authentication system.',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { color: #11153f; font-size: 24px; font-weight: bold; }
            .content { color: #333; line-height: 1.6; }
            .success { background: #11153f; color: white; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">SpeedForce Digital</div>
              <h2 style="color: #11153f; margin: 10px 0;">SendGrid Test Email</h2>
            </div>
            
            <div class="content">
              <p>Hello Ahmed,</p>
              <p>This is a test email from your SpeedForce authentication system to verify that SendGrid is working correctly.</p>
              
              <div class="success">
                ✅ SendGrid Configuration is Working!
              </div>
              
              <p>If you received this email, your email service is properly configured and ready for:</p>
              <ul>
                <li>User registration verification</li>
                <li>Password reset emails</li>
                <li>OTP code delivery</li>
                <li>Account notifications</li>
              </ul>
              
              <p>Your authentication system is ready to use!</p>
            </div>
            
            <div class="footer">
              <p>This is an automated test message from SpeedForce Digital.</p>
              <p>Test completed at: ${new Date().toISOString()}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    console.log('📤 Sending test email...');
    const response = await sgMail.send(msg);
    console.log('✅ Test email sent successfully!');
    console.log('📋 Response Status:', response[0].statusCode);
    console.log('📧 Email sent to: ahmedwaleedusa@gmail.com');
    console.log('');
    console.log('🎉 SendGrid is working correctly!');
    console.log('💡 Check your email inbox for the test message.');
    
  } catch (error) {
    console.error('❌ Error sending test email:', error);
    if (error.response) {
      console.error('📋 Response body:', error.response.body);
    }
    console.log('');
    console.log('🔧 Troubleshooting steps:');
    console.log('1. Check your SendGrid API key in .env file');
    console.log('2. Verify sender email is authenticated in SendGrid');
    console.log('3. Check SendGrid account status and limits');
  }
};

// Run the test
testEmail();
