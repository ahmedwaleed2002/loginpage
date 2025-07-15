const express = require('express');
const router = express.Router();
const passport = require('../config/passport');

// Import controllers
const {
  register,
  login,
  completeLogin,
  logout,
  verifyEmail,
  resendVerificationEmail,
  verifyRegistrationOTP,
  resendRegistrationOTP,
  requestPasswordReset,
  resetPassword,
  resetPasswordWithOTP,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
  githubSuccess,
  githubFailure,
  sendOTP,
  verifyOTP
} = require('../controllers/authController');

// Import middleware
const { verifyToken, verifyRefreshToken } = require('../middleware/auth');
const {
  validateRegistration,
  validateLogin,
  validatePasswordResetRequest,
  validatePasswordReset,
  validateEmailVerification,
  validateProfileUpdate,
  validateChangePassword
} = require('../middleware/validation');
// Rate limiters removed for development/testing

// Authentication routes
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.post('/complete-login', completeLogin);
router.post('/logout', logout);

// Email verification routes
router.post('/verify-email', validateEmailVerification, verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

// Registration OTP routes
router.post('/verify-registration-otp', verifyRegistrationOTP);
router.post('/resend-registration-otp', resendRegistrationOTP);

// OTP routes
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

// Password reset routes
router.post('/request-password-reset', validatePasswordResetRequest, requestPasswordReset);
router.post('/reset-password', validatePasswordReset, resetPassword);
router.post('/reset-password-otp', resetPasswordWithOTP);

// Token management routes
router.post('/refresh-token', verifyRefreshToken, refreshToken);

// GitHub OAuth routes
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback', 
  passport.authenticate('github', { failureRedirect: '/api/auth/github/failure' }),
  githubSuccess
);
router.get('/github/failure', githubFailure);

// Protected routes (require authentication)
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, validateProfileUpdate, updateProfile);
router.put('/change-password', verifyToken, validateChangePassword, changePassword);

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Authentication service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
