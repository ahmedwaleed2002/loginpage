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
    console.error('Full Error:', error.toString()); // Additional logging for the error
    
    // If SendGrid fails, log error details
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
      console.error(`SendGrid Error Details: ${errorMessages}`); // Log detailed SendGrid errors
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

// Enhanced HTML template for OTP emails
const getOTPEmailTemplate = (otp, purpose = 'verification') => {
  const purposeTexts = {
    registration: {
      title: 'Welcome to SpeedForce! 🚀',
      subtitle: 'Complete your account setup',
      greeting: 'Welcome to SpeedForce Digital!',
      message: 'Thank you for joining us! To complete your account setup and start using our platform, please verify your email address with the code below:',
      expiry: '15 minutes'
    },
    login: {
      title: 'Secure Login Verification',
      subtitle: 'Complete your login process',
      greeting: 'Welcome back!',
      message: 'We\'ve detected a login attempt on your account. Please enter the verification code below to complete your login securely:',
      expiry: '10 minutes'
    },
    password_reset: {
      title: 'Password Reset Request',
      subtitle: 'Reset your account password',
      greeting: 'Password Reset Request',
      message: 'You\'ve requested to reset your password. Please use the verification code below to proceed with setting a new password:',
      expiry: '15 minutes'
    },
    verification: {
      title: 'Account Verification',
      subtitle: 'Verify your account',
      greeting: 'Account Verification Required',
      message: 'Please verify your account using the code below to continue:',
      expiry: '10 minutes'
    }
  };
  
  const content = purposeTexts[purpose] || purposeTexts.verification;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SpeedForce Digital - ${content.title}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin: 0;
      padding: 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.98);
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
    }
    .header {
      text-align: center;
      margin-bottom: 35px;
    }
    .logo {
      width: 90px;
      height: 90px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      margin: 0 auto 25px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 28px;
      font-weight: bold;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
    }
    .title {
      color: #2c3e50;
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .subtitle {
      color: #7f8c8d;
      font-size: 16px;
      margin-bottom: 30px;
    }
    .greeting {
      color: #34495e;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .otp-container {
      background: linear-gradient(145deg, #f8f9fa, #e9ecef);
      border-radius: 15px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
      border: 2px solid #667eea;
    }
    .otp-code {
      font-size: 36px;
      font-weight: bold;
      color: #667eea;
      letter-spacing: 8px;
      margin: 20px 0;
      padding: 20px;
      background: white;
      border-radius: 10px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
      font-family: 'Courier New', monospace;
    }
    .otp-label {
      color: #6c757d;
      font-size: 14px;
      margin-bottom: 10px;
      font-weight: 500;
    }
    .expiry-info {
      color: #e74c3c;
      font-size: 14px;
      margin-top: 15px;
      font-weight: bold;
      background: #fee;
      padding: 8px;
      border-radius: 8px;
      border: 1px solid #fcc;
    }
    .content {
      color: #555;
      line-height: 1.6;
      margin: 20px 0;
      font-size: 15px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #eee;
      text-align: center;
      color: #999;
      font-size: 12px;
    }
    .brand {
      color: #667eea;
      font-weight: bold;
    }
    .security-note {
      background: linear-gradient(135deg, #fff3cd, #ffeaa7);
      border: 1px solid #ffc107;
      border-radius: 10px;
      padding: 15px;
      margin: 20px 0;
      color: #856404;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">SF</div>
      <div class="title">${content.title}</div>
      <div class="subtitle">${content.subtitle}</div>
    </div>
    
    <div class="content">
      <div class="greeting">${content.greeting}</div>
      <p>${content.message}</p>
    </div>
    
    <div class="otp-container">
      <div class="otp-label">Your Verification Code</div>
      <div class="otp-code">${otp}</div>
      <div class="expiry-info">⏰ This code expires in ${content.expiry}</div>
    </div>
    
    <div class="content">
      <p>Please enter this code in the application to continue. If you didn't request this code, please ignore this email.</p>
    </div>
    
    <div class="security-note">
      <strong>🔒 Security Note:</strong> Never share this code with anyone. SpeedForce Digital will never ask for your verification code via phone or email.
    </div>
    
    <div class="footer">
      <p>This email was sent by <span class="brand">SpeedForce Digital</span></p>
      <p>If you're having trouble, please contact our support team.</p>
      <p>© 2024 SpeedForce Digital. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
};

// Send OTP email
const sendOtpEmail = async (email, otp, purpose = 'verification') => {
  const subject = `SpeedForce Digital - ${purpose === 'registration' ? 'Welcome!' : 'Verification Code'}`;
  const html = getOTPEmailTemplate(otp, purpose);
  await sendEmail(email, subject, html);
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOtpEmail
};
