const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const fixUser = async (email, newPassword) => {
  try {
    console.log('🔧 Fixing user issues...');
    console.log(`📧 Email: ${email}`);
    console.log(`🔐 New Password: ${newPassword}`);
    console.log('');
    
    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found');
    console.log(`   - Current verified status: ${user.isVerified}`);
    console.log(`   - Current login attempts: ${user.loginAttempts}`);
    console.log('');
    
    // Fix 1: Verify email
    console.log('1. 📧 Verifying email...');
    await user.update({
      isVerified: true,
      verificationToken: null
    });
    console.log('✅ Email verified');
    console.log('');
    
    // Fix 2: Reset password
    console.log('2. 🔑 Resetting password...');
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await user.update({
      password: hashedPassword
    });
    console.log('✅ Password reset');
    console.log('');
    
    // Fix 3: Reset login attempts
    console.log('3. 🔓 Resetting login attempts...');
    await user.update({
      loginAttempts: 0,
      lockUntil: null
    });
    console.log('✅ Login attempts reset');
    console.log('');
    
    // Fix 4: Clear any existing OTP
    console.log('4. 🔐 Clearing existing OTP...');
    await user.update({
      otp: null,
      otpExpires: null,
      otpPurpose: null
    });
    console.log('✅ OTP cleared');
    console.log('');
    
    console.log('🎉 User fixed successfully!');
    console.log('='.repeat(50));
    console.log('✅ Email verified');
    console.log('✅ Password reset');
    console.log('✅ Login attempts reset');
    console.log('✅ OTP cleared');
    console.log('');
    console.log('🔧 You can now test login with:');
    console.log(`   - Email: ${email}`);
    console.log(`   - Password: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Error fixing user:', error);
  }
  
  process.exit(0);
};

const email = process.argv[2] || 'ahmedwaleedusa@gmail.com';
const newPassword = process.argv[3] || 'TestPassword123!';

fixUser(email, newPassword);
