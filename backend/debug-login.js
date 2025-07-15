const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const debugLogin = async (email, password) => {
  try {
    console.log('🔍 Debug Login Process');
    console.log('='.repeat(50));
    console.log(`📧 Email: ${email}`);
    console.log(`🔐 Password: ${password}`);
    console.log('');
    
    // Step 1: Find user
    console.log('1. 👤 Finding user...');
    const user = await User.findByEmail(email);
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    console.log('✅ User found');
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - First Name: ${user.firstName}`);
    console.log(`   - Last Name: ${user.lastName}`);
    console.log(`   - Verified: ${user.isVerified}`);
    console.log(`   - Login Attempts: ${user.loginAttempts}`);
    console.log(`   - Locked: ${user.isLocked()}`);
    console.log('');
    
    // Step 2: Check if account is locked
    console.log('2. 🔒 Checking account lock status...');
    if (user.isLocked()) {
      console.log('❌ Account is locked');
      const lockTime = Math.ceil((user.lockUntil - new Date()) / (1000 * 60));
      console.log(`   - Lock time remaining: ${lockTime} minutes`);
      return;
    }
    console.log('✅ Account is not locked');
    console.log('');
    
    // Step 3: Check password
    console.log('3. 🔑 Checking password...');
    console.log(`   - Stored password hash: ${user.password.substring(0, 20)}...`);
    console.log(`   - Testing password: ${password}`);
    
    const isPasswordValid = await user.verifyPassword(password);
    if (!isPasswordValid) {
      console.log('❌ Password is incorrect');
      console.log('');
      
      // Let's try to create a new password hash to compare
      const newHash = await bcrypt.hash(password, 12);
      console.log(`   - New hash would be: ${newHash.substring(0, 20)}...`);
      console.log('');
      
      // Test with a few common passwords
      const testPasswords = ['TestPassword123!', 'password123', 'admin123', 'test123'];
      console.log('🧪 Testing common passwords...');
      for (const testPass of testPasswords) {
        const testResult = await user.verifyPassword(testPass);
        console.log(`   - "${testPass}": ${testResult ? '✅ MATCH' : '❌ No match'}`);
      }
      return;
    }
    console.log('✅ Password is correct');
    console.log('');
    
    // Step 4: Check email verification
    console.log('4. 📧 Checking email verification...');
    if (!user.isVerified) {
      console.log('❌ Email is not verified');
      console.log('   - User needs to verify email before login');
      return;
    }
    console.log('✅ Email is verified');
    console.log('');
    
    // Step 5: Check OTP status
    console.log('5. 🔐 Checking OTP status...');
    if (user.otp) {
      console.log('⚠️  OTP exists in database');
      console.log(`   - OTP: ${user.otp}`);
      console.log(`   - OTP Purpose: ${user.otpPurpose}`);
      console.log(`   - OTP Expires: ${user.otpExpires}`);
      
      const otpExpiresDate = user.otpExpires?.toDate ? user.otpExpires.toDate() : user.otpExpires;
      const isExpired = otpExpiresDate && otpExpiresDate < new Date();
      console.log(`   - OTP Expired: ${isExpired ? '✅ Yes' : '❌ No'}`);
    } else {
      console.log('✅ No pending OTP');
    }
    console.log('');
    
    console.log('🎯 SUMMARY:');
    console.log('='.repeat(50));
    console.log(`✅ User exists: ${!!user}`);
    console.log(`✅ Account not locked: ${!user.isLocked()}`);
    console.log(`✅ Password correct: ${isPasswordValid}`);
    console.log(`✅ Email verified: ${user.isVerified}`);
    console.log(`📧 Has pending OTP: ${!!user.otp}`);
    console.log('');
    
    if (user && !user.isLocked() && isPasswordValid && user.isVerified) {
      console.log('🎉 LOGIN SHOULD WORK!');
      console.log('   - All conditions met for successful login');
      console.log('   - 2-step authentication should trigger OTP sending');
    } else {
      console.log('❌ LOGIN REQUIREMENTS NOT MET');
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
  
  process.exit(0);
};

const email = process.argv[2] || 'ahmedwaleedusa@gmail.com';
const password = process.argv[3] || 'TestPassword123!';

debugLogin(email, password);
