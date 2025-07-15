const express = require('express');
const router = express.Router();
const passport = require('../config/passport');

// Import controllers
const {
  register,
  login,
  logout,
  verifyEmail,
  resendVerificationEmail,
  requestPasswordReset,
  resetPassword,
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
const {
  authLimiter,
  passwordResetLimiter,
  registrationLimiter,
  emailVerificationLimiter
} = require('../middleware/rateLimiter');

// Authentication routes
router.post('/register', registrationLimiter, validateRegistration, register);
router.post('/login', authLimiter, validateLogin, login);
router.post('/logout', logout);

// Email verification routes
router.post('/verify-email', emailVerificationLimiter, validateEmailVerification, verifyEmail);
router.post('/resend-verification', emailVerificationLimiter, resendVerificationEmail);

// OTP routes
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

// Password reset routes
router.post('/request-password-reset', passwordResetLimiter, validatePasswordResetRequest, requestPasswordReset);
router.post('/reset-password', validatePasswordReset, resetPassword);

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
