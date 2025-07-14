const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');
const { generateTokens } = require('../utils/jwt');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL || "http://localhost:5000/api/auth/github/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    let user = await User.findByEmail(profile.emails[0].value);
    
    if (user) {
      // Update GitHub info and mark as verified
      await user.update({
        githubId: profile.id,
        githubUsername: profile.username,
        githubAccessToken: accessToken,
        isVerified: true, // GitHub OAuth users are considered verified
        lastLogin: new Date()
      });
      return done(null, user);
    }
    
    // Create new user
    user = await User.create({
      email: profile.emails[0].value,
      firstName: profile.displayName?.split(' ')[0] || profile.username,
      lastName: profile.displayName?.split(' ')[1] || '',
      githubId: profile.id,
      githubUsername: profile.username,
      githubAccessToken: accessToken,
      isVerified: true, // GitHub OAuth users are considered verified
      password: 'github-oauth-' + Math.random().toString(36), // Random password for OAuth users
      lastLogin: new Date()
    });
    
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

module.exports = passport;
