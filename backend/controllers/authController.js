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

    // Generate OTP for email verification
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create user (not verified initially)
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      isVerified: false,
      otp,
      otpExpires,
      otpPurpose: 'registration'
    });

    // Send OTP email for registration verification
    try {
      await sendOtpEmail(email, otp);
    } catch (emailError) {
      console.error('Error sending registration OTP:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Unable to send verification code. Please try again or contact support.',
        code: 'OTP_SEND_ERROR'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for the verification code to complete your account setup.',
      code: 'REGISTRATION_OTP_SENT',
      data: {
        email: email,
        requiresVerification: true,
        otpExpiresIn: 15 // minutes
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

// Login user (Step 1: Password verification)
const login = async (req, res) => {
  try {
    const { email, password, rememberMe = false } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'The email address you entered is not registered. Please check your email or sign up for a new account.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      const lockTime = Math.ceil((user.lockUntil - new Date()) / (1000 * 60));
      return res.status(423).json({
        success: false,
        message: `Your account has been temporarily locked due to multiple failed login attempts. Please try again in ${lockTime} minutes or reset your password.`,
        code: 'ACCOUNT_LOCKED',
        lockTimeMinutes: lockTime
      });
    }

    // Verify password
    const isPasswordValid = await user.verifyPassword(password);
    if (!isPasswordValid) {
      await user.incrementLoginAttempts();
      const remainingAttempts = 5 - user.loginAttempts - 1;
      return res.status(400).json({
        success: false,
        message: remainingAttempts > 0 
          ? `Incorrect password. You have ${remainingAttempts} attempts remaining before your account is locked.`
          : 'Too many failed login attempts. Your account will be locked temporarily.',
        code: 'INVALID_PASSWORD',
        remainingAttempts: Math.max(0, remainingAttempts)
      });
    }

    // Check if email is verified (temporarily disabled for development)
    // if (!user.isVerified) {
    //   return res.status(401).json({
    //     success: false,
    //     message: 'Please verify your email address before logging in. Check your inbox for the verification email.',
    //     code: 'EMAIL_NOT_VERIFIED'
    //   });
    // }

    // Reset login attempts on successful password verification
    await user.resetLoginAttempts();
    
    // Generate and send OTP for 2-step authentication
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await user.update({
      otp,
      otpExpires,
      otpPurpose: 'login',
      rememberMe: rememberMe
    });

    // Send OTP email
    try {
      await sendOtpEmail(email, otp);
    } catch (emailError) {
      console.error('Error sending login OTP:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Unable to send verification code. Please try again or contact support.',
        code: 'OTP_SEND_ERROR'
      });
    }

    res.json({
      success: true,
      message: 'Password verified successfully. Please check your email for the verification code to complete login.',
      code: 'OTP_REQUIRED',
      data: {
        email: user.email,
        requiresOTP: true,
        otpExpiresIn: 10 // minutes
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'We\'re experiencing technical difficulties. Please try again in a few moments.',
      code: 'LOGIN_ERROR'
    });
  }
};

// Complete login with OTP (Step 2: OTP verification)
const completeLogin = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found. Please start the login process again.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if OTP exists and matches
    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please check your email and try again.',
        code: 'INVALID_OTP'
      });
    }

    // Check if OTP is expired
    const otpExpiresDate = user.otpExpires?.toDate ? user.otpExpires.toDate() : user.otpExpires;
    if (!user.otpExpires || otpExpiresDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one by logging in again.',
        code: 'OTP_EXPIRED'
      });
    }

    // Check if OTP purpose is for login
    if (user.otpPurpose !== 'login') {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please request a new one by logging in again.',
        code: 'INVALID_OTP_PURPOSE'
      });
    }

    // Clear OTP and update last login
    await user.update({
      otp: null,
      otpExpires: null,
      otpPurpose: null,
      lastLogin: new Date()
    });

    // Log the login activity
    await ActivityLog.logLogin(user.id, req.ip, req.headers['user-agent']);

    // Generate tokens
    const { token, refreshToken } = generateTokens(user);

    // Set cookies
    setTokenCookies(res, token, refreshToken, user.rememberMe);

    res.json({
      success: true,
      message: 'Login completed successfully. Welcome back!',
      code: 'LOGIN_SUCCESS',
      data: {
        user: user.getProfile(),
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Complete login error:', error);
    res.status(500).json({
      success: false,
      message: 'We\'re experiencing technical difficulties. Please try again in a few moments.',
      code: 'COMPLETE_LOGIN_ERROR'
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
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If your email is registered with us, you will receive a password reset verification code shortly. Please check your inbox and spam folder.',
        code: 'PASSWORD_RESET_REQUESTED'
      });
    }

    // Generate OTP for password reset
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Update user with OTP
    await user.update({
      otp,
      otpExpires,
      otpPurpose: 'password_reset'
    });

    // Send OTP email for password reset
    try {
      await sendOtpEmail(email, otp);
    } catch (emailError) {
      console.error('Error sending password reset OTP:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Unable to send password reset code. Please try again or contact support if the problem persists.',
        code: 'EMAIL_SEND_ERROR'
      });
    }

    res.json({
      success: true,
      message: 'A password reset verification code has been sent to your email. Please check your inbox and enter the code to continue.',
      code: 'PASSWORD_RESET_OTP_SENT',
      data: {
        email: email,
        otpExpiresIn: 15 // minutes
      }
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'We\'re experiencing technical difficulties. Please try again in a few moments.',
      code: 'PASSWORD_RESET_REQUEST_ERROR'
    });
  }
};

// Reset password with OTP
const resetPasswordWithOTP = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found. Please start the password reset process again.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if OTP exists and matches
    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please check your email and try again.',
        code: 'INVALID_OTP'
      });
    }

    // Check if OTP is expired
    const otpExpiresDate = user.otpExpires?.toDate ? user.otpExpires.toDate() : user.otpExpires;
    if (!user.otpExpires || otpExpiresDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new password reset.',
        code: 'OTP_EXPIRED'
      });
    }

    // Check if OTP purpose is for password reset
    if (user.otpPurpose !== 'password_reset') {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please request a new password reset.',
        code: 'INVALID_OTP_PURPOSE'
      });
    }

    // Update password and clear OTP
    await user.updatePassword(newPassword);
    await user.update({
      otp: null,
      otpExpires: null,
      otpPurpose: null
    });

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
      code: 'PASSWORD_RESET_SUCCESS'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'We\'re experiencing technical difficulties. Please try again in a few moments.',
      code: 'PASSWORD_RESET_ERROR'
    });
  }
};

// Legacy reset password (kept for backward compatibility)
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

// Send OTP for additional verification
const sendOTP = async (req, res) => {
  try {
    const { email, purpose = 'verification' } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in user record
    await user.update({
      otp,
      otpExpires,
      otpPurpose: purpose
    });

    // Send OTP email
    try {
      await sendOtpEmail(email, otp);
      
      res.json({
        success: true,
        message: 'OTP sent successfully to your email',
        code: 'OTP_SENT'
      });
    } catch (emailError) {
      console.error('Error sending OTP email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email',
        code: 'OTP_SEND_ERROR'
      });
    }

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'SEND_OTP_ERROR'
    });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otp, purpose = 'verification' } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if OTP exists and matches
    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
        code: 'INVALID_OTP'
      });
    }

    // Check if OTP is expired
    const otpExpiresDate = user.otpExpires?.toDate ? user.otpExpires.toDate() : user.otpExpires;
    if (!user.otpExpires || otpExpiresDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired',
        code: 'OTP_EXPIRED'
      });
    }

    // Check if OTP purpose matches
    if (user.otpPurpose !== purpose) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP purpose',
        code: 'INVALID_OTP_PURPOSE'
      });
    }

    // Clear OTP from user record
    await user.update({
      otp: null,
      otpExpires: null,
      otpPurpose: null,
      isVerified: purpose === 'verification' ? true : user.isVerified
    });

    res.json({
      success: true,
      message: 'OTP verified successfully',
      code: 'OTP_VERIFIED'
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'VERIFY_OTP_ERROR'
    });
  }
};

// Verify registration OTP
const verifyRegistrationOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found. Please register again.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user is already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified. You can now login.',
        code: 'EMAIL_ALREADY_VERIFIED'
      });
    }

    // Check if OTP exists and matches
    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please check your email and try again.',
        code: 'INVALID_OTP'
      });
    }

    // Check if OTP is expired
    const otpExpiresDate = user.otpExpires?.toDate ? user.otpExpires.toDate() : user.otpExpires;
    if (!user.otpExpires || otpExpiresDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.',
        code: 'OTP_EXPIRED'
      });
    }

    // Check if OTP purpose is for registration
    if (user.otpPurpose !== 'registration') {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please request a new one.',
        code: 'INVALID_OTP_PURPOSE'
      });
    }

    // Verify user and clear OTP
    await user.update({
      isVerified: true,
      otp: null,
      otpExpires: null,
      otpPurpose: null
    });

    res.json({
      success: true,
      message: 'Email verified successfully! You can now login to your account.',
      code: 'REGISTRATION_VERIFIED',
      data: {
        user: user.getProfile()
      }
    });

  } catch (error) {
    console.error('Registration OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during verification',
      code: 'REGISTRATION_OTP_VERIFICATION_ERROR'
    });
  }
};

// Resend registration OTP
const resendRegistrationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found. Please register again.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user is already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified. You can now login.',
        code: 'EMAIL_ALREADY_VERIFIED'
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Update user with new OTP
    await user.update({
      otp,
      otpExpires,
      otpPurpose: 'registration'
    });

    // Send OTP email
    try {
      await sendOtpEmail(email, otp);
      
      res.json({
        success: true,
        message: 'Verification code sent successfully to your email',
        code: 'REGISTRATION_OTP_SENT',
        data: {
          email: email,
          otpExpiresIn: 15 // minutes
        }
      });
    } catch (emailError) {
      console.error('Error sending registration OTP:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification code. Please try again.',
        code: 'OTP_SEND_ERROR'
      });
    }

  } catch (error) {
    console.error('Resend registration OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'RESEND_REGISTRATION_OTP_ERROR'
    });
  }
};

module.exports = {
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
};
