const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m'
  });
};

// Generate refresh token
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });
};

// Generate both tokens
const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email
  };

  const token = generateToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return { token, refreshToken };
};

// Generate verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate password reset token
const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Set token cookies
const setTokenCookies = (res, token, refreshToken, rememberMe = false) => {
  const tokenExpire = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 15 * 60 * 1000; // 7 days or 15 minutes
  const refreshTokenExpire = 7 * 24 * 60 * 60 * 1000; // 7 days

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  };

  res.cookie('token', token, {
    ...cookieOptions,
    maxAge: tokenExpire
  });

  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: refreshTokenExpire
  });
};

// Clear token cookies
const clearTokenCookies = (res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  };

  res.clearCookie('token', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
};

module.exports = {
  generateToken,
  generateRefreshToken,
  generateTokens,
  generateVerificationToken,
  generatePasswordResetToken,
  generateOTP,
  setTokenCookies,
  clearTokenCookies
};
