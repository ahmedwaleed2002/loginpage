const sgMail = require('@sendgrid/mail');
require('dotenv').config();

// Initialize SendGrid API
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Mock email service for development when SendGrid is not properly configured
const mockEmailService = {
  async send(msg) {
    console.log('📧 MOCK EMAIL SERVICE - Email would be sent:');
    console.log(`To: ${msg.to}`);
    console.log(`From: ${msg.from}`);
    console.log(`Subject: ${msg.subject}`);
    console.log(`HTML: ${msg.html.substring(0, 100)}...`);
    console.log('✅ Mock email sent successfully');
    return { statusCode: 202 };
  }
};

// Check if SendGrid is properly configured
const isSendGridConfigured = () => {
  return process.env.SENDGRID_API_KEY && 
         process.env.SENDGRID_FROM_EMAIL && 
         process.env.SENDGRID_API_KEY.startsWith('SG.');
};

// Send email function with fallback to mock service
const sendEmail = async (to, subject, html) => {
  try {
    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@speedforce.dev',
      subject,
      html
    };

    console.log(`📧 Attempting to send email to: ${to}`);
    console.log(`📧 From: ${msg.from}`);
    console.log(`📧 SendGrid configured: ${isSendGridConfigured()}`);
    
    if (isSendGridConfigured()) {
      await sgMail.send(msg);
      console.log(`✅ Email sent successfully via SendGrid to: ${to}`);
    } else {
      console.log('⚠️ SendGrid not properly configured, using mock email service');
      await mockEmailService.send(msg);
    }
  } catch (error) {
    console.error(`❌ Email Error:`, error.response?.body || error.message);
    
    // If SendGrid fails, fallback to mock service in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Falling back to mock email service...');
      const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@speedforce.dev',
        subject,
        html
      };
      await mockEmailService.send(msg);
      return;
    }
    
    if (error.response?.body?.errors) {
      const errorMessages = error.response.body.errors.map(err => err.message).join(', ');
      throw new Error(`SendGrid Error: ${errorMessages}`);
    }
    throw new Error(`Error sending email: ${error.message}`);
  }
};

// Send verification email
const sendVerificationEmail = async (email, token) => {
  const subject = 'Email Verification';
  const verificationLink = `http://localhost:3000/verify-email?token=${token}`;

  const html = `
    <h2>Verify your email</h2>
    <p>Please click the link below to verify your email address:</p>
    <a href="${verificationLink}">Verify Email</a>
  `;

  await sendEmail(email, subject, html);
};

// Send password reset email
const sendPasswordResetEmail = async (email, token) => {
  const subject = 'Reset Your Password';
  const resetLink = `http://localhost:3000/reset-password?token=${token}`;

  const html = `
    <h2>Reset your password</h2>
    <p>Please click the link below to reset your password:</p>
    <a href="${resetLink}">Reset Password</a>
  `;

  await sendEmail(email, subject, html);
};

// Send OTP email
const sendOtpEmail = async (email, otp) => {
  const subject = 'Your OTP Code - SpeedForce Digital';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { color: #11153f; font-size: 24px; font-weight: bold; }
        .otp-code { background: #11153f; color: white; padding: 15px 30px; font-size: 24px; font-weight: bold; text-align: center; border-radius: 5px; margin: 20px 0; letter-spacing: 3px; }
        .warning { color: #ed1e2b; font-size: 14px; margin-top: 20px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">SpeedForce Digital</div>
          <h2 style="color: #11153f; margin: 10px 0;">Your OTP Code</h2>
        </div>
        
        <p>Hello,</p>
        <p>You have requested an OTP code for verification. Please use the code below to complete your action:</p>
        
        <div class="otp-code">${otp}</div>
        
        <p>This code will expire in <strong>10 minutes</strong> for security purposes.</p>
        
        <div class="warning">
          <strong>Security Notice:</strong> If you did not request this code, please ignore this email or contact support immediately.
        </div>
        
        <div class="footer">
          <p>This is an automated message from SpeedForce Digital.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, subject, html);
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOtpEmail
};
