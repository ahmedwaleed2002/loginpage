const sgMail = require('@sendgrid/mail');
require('dotenv').config();

// Initialize SendGrid API
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Send email function
const sendEmail = async (to, subject, html) => {
  try {
    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject,
      html
    };

    await sgMail.send(msg);
  } catch (error) {
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
  const subject = 'Your OTP Code';

  const html = `
    <h2>Your OTP Code</h2>
    <p>Your OTP code is <strong>${otp}</strong>. Please use it to complete your action. This code will expire in 10 minutes.</p>
  `;

  await sendEmail(email, subject, html);
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOtpEmail
};
