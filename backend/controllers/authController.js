const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { generateTokens, generateVerificationToken, generatePasswordResetToken, generateOTP, setTokenCookies, clearTokenCookies } = require('../utils/jwt');
const { sendVerificationEmail, sendPasswordResetEmail, sendOtpEmail } = require('../utils/email');

// Register a new user
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
        code: 'USER_ALREADY_EXISTS'
      });
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      verificationToken
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Don't fail registration if email fails
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for verification.',
      code: 'REGISTRATION_SUCCESS',
      data: {
        user: user.getProfile()
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      code: 'REGISTRATION_ERROR'
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password, rememberMe = false } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts',
        code: 'ACCOUNT_LOCKED'
      });
    }

    // Verify password
    const isPasswordValid = await user.verifyPassword(password);
    if (!isPasswordValid) {
      await user.incrementLoginAttempts();
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();
    
    // Update last login and remember me preference
    await user.update({ 
      lastLogin: new Date(),
      rememberMe: rememberMe
    });

    // Log the login activity
    await ActivityLog.logLogin(user.id, req.ip, req.headers['user-agent']);

    // Generate tokens
    const { token, refreshToken } = generateTokens(user);

    // Set cookies
    setTokenCookies(res, token, refreshToken, rememberMe);

    res.json({
      success: true,
      message: 'Login successful',
      code: 'LOGIN_SUCCESS',
      data: {
        user: user.getProfile(),
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
      code: 'LOGIN_ERROR'
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    // Log the logout activity if user is authenticated
    if (req.user) {
      await ActivityLog.logLogout(req.user.id, req.ip, req.headers['user-agent']);
    }

    // Clear cookies
    clearTokenCookies(res);

    res.json({
      success: true,
      message: 'Logout successful',
      code: 'LOGOUT_SUCCESS'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout',
      code: 'LOGOUT_ERROR'
    });
  }
};

// Verify email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    // Find user by verification token
    const user = await User.findByVerificationToken(token);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
        code: 'INVALID_VERIFICATION_TOKEN'
      });
    }

    // Update user as verified
    await user.update({
      isVerified: true,
      verificationToken: null
    });

    res.json({
      success: true,
      message: 'Email verified successfully',
      code: 'EMAIL_VERIFIED'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during email verification',
      code: 'EMAIL_VERIFICATION_ERROR'
    });
  }
};

// Resend verification email
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user is already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified',
        code: 'EMAIL_ALREADY_VERIFIED'
      });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    await user.update({ verificationToken });

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email',
        code: 'EMAIL_SEND_ERROR'
      });
    }

    res.json({
      success: true,
      message: 'Verification email sent successfully',
      code: 'VERIFICATION_EMAIL_SENT'
    });

  } catch (error) {
    console.error('Resend verification email error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'RESEND_VERIFICATION_ERROR'
    });
  }
};

// Request password reset
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not
      return res.json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link',
        code: 'PASSWORD_RESET_REQUESTED'
      });
    }

    // Generate password reset token
    const passwordResetToken = generatePasswordResetToken();
    const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with reset token
    await user.update({
      passwordResetToken,
      passwordResetExpires
    });

    // Send password reset email
    try {
      await sendPasswordResetEmail(email, passwordResetToken);
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: 'If your email is registered, you will receive a password reset link',
      code: 'PASSWORD_RESET_REQUESTED'
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'PASSWORD_RESET_REQUEST_ERROR'
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Find user by reset token
    const user = await User.findByPasswordResetToken(token);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
        code: 'INVALID_RESET_TOKEN'
      });
    }

    // Update password
    await user.updatePassword(newPassword);

    res.json({
      success: true,
      message: 'Password reset successfully',
      code: 'PASSWORD_RESET_SUCCESS'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during password reset',
      code: 'PASSWORD_RESET_ERROR'
    });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const user = req.user;

    // Generate new tokens
    const { token, refreshToken: newRefreshToken } = generateTokens(user);

    // Set cookies
    setTokenCookies(res, token, newRefreshToken, user.rememberMe);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      code: 'TOKEN_REFRESHED',
      data: {
        token,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during token refresh',
      code: 'TOKEN_REFRESH_ERROR'
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      code: 'PROFILE_RETRIEVED',
      data: {
        user: user.getProfile()
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'PROFILE_ERROR'
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const { firstName, lastName, email } = req.body;

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken',
          code: 'EMAIL_ALREADY_TAKEN'
        });
      }
    }

    // Update user
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) {
      updateData.email = email;
      updateData.isVerified = false; // Require re-verification for email change
      updateData.verificationToken = generateVerificationToken();
    }

    await user.update(updateData);

    // Send verification email if email was changed
    if (email && email !== user.email) {
      try {
        await sendVerificationEmail(email, updateData.verificationToken);
      } catch (emailError) {
        console.error('Error sending verification email:', emailError);
      }
    }

    res.json({
      success: true,
      message: email && email !== user.email ? 
        'Profile updated successfully. Please verify your new email.' : 
        'Profile updated successfully',
      code: 'PROFILE_UPDATED',
      data: {
        user: user.getProfile()
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'PROFILE_UPDATE_ERROR'
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const user = req.user;
    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isCurrentPasswordValid = await user.verifyPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Update password
    await user.updatePassword(newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully',
      code: 'PASSWORD_CHANGED'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'PASSWORD_CHANGE_ERROR'
    });
  }
};

// GitHub OAuth success handler
const githubSuccess = async (req, res) => {
  try {
    const user = req.user;
    
    // Log the GitHub login activity
    await ActivityLog.logGitHubLogin(user.id, req.ip, req.headers['user-agent']);
    
    // Generate tokens
    const { token, refreshToken } = generateTokens(user);
    
    // Set cookies
    setTokenCookies(res, token, refreshToken, user.rememberMe);
    
    // Redirect to frontend dashboard
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}`);
  } catch (error) {
    console.error('GitHub OAuth success error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_error`);
  }
};

// GitHub OAuth failure handler
const githubFailure = (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
};

module.exports = {
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
  githubFailure
};
