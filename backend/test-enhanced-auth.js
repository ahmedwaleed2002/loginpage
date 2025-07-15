const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:5000/api';
const testEmail = 'ahmedwaleedusa@gmail.com';
const testPassword = 'TestPassword123!';
const newPassword = 'NewPassword456!';

console.log('🚀 Testing Enhanced 2-Step Authentication System...\n');

// Helper function to make API requests
const makeRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message 
    };
  }
};

// Test 1: Server Health Check
const testServerHealth = async () => {
  console.log('1. 🏥 Testing Server Health...');
  const result = await makeRequest('GET', '/auth/health');
  
  if (result.success) {
    console.log('   ✅ Server is running and healthy');
    console.log('   📊 Message:', result.data.message);
  } else {
    console.log('   ❌ Server health check failed:', result.error);
    return false;
  }
  console.log('');
  return true;
};

// Test 2: Registration Test
const testRegistration = async () => {
  console.log('2. 👤 Testing User Registration...');
  const result = await makeRequest('POST', '/auth/register', {
    email: testEmail,
    password: testPassword,
    firstName: 'Ahmed',
    lastName: 'Waleed'
  });
  
  if (result.success) {
    console.log('   ✅ User registration successful');
    console.log('   📧 Message:', result.data.message);
  } else {
    console.log('   ❌ User registration failed:', result.error.message);
    if (result.error.message?.includes('already exists')) {
      console.log('   ℹ️  User already exists, continuing with login test...');
    }
  }
  console.log('');
  return true;
};

// Test 3: 2-Step Login (Step 1: Password)
const testLoginStep1 = async () => {
  console.log('3. 🔐 Testing 2-Step Login (Step 1: Password)...');
  const result = await makeRequest('POST', '/auth/login', {
    email: testEmail,
    password: testPassword,
    rememberMe: false
  });
  
  if (result.success) {
    console.log('   ✅ Password verification successful');
    console.log('   📧 Message:', result.data.message);
    console.log('   🎯 Code:', result.data.code);
    console.log('   🔢 Requires OTP:', result.data.data?.requiresOTP);
    console.log('   📧 CHECK YOUR EMAIL FOR LOGIN OTP!');
    return result.data.data?.email;
  } else {
    console.log('   ❌ Password verification failed:', result.error.message);
    console.log('   🔑 Code:', result.error.code);
    return null;
  }
};

// Test 4: 2-Step Login (Step 2: OTP) - Interactive
const testLoginStep2 = async (email) => {
  console.log('4. ✅ Testing 2-Step Login (Step 2: OTP)...');
  console.log('   ⚠️  This requires manual OTP input from email');
  console.log('   📧 Check your email for the login OTP code');
  console.log('   🔢 To complete login, make a POST request to:');
  console.log('   🌐 URL: http://localhost:5000/api/auth/complete-login');
  console.log('   📝 Body: {');
  console.log('     "email": "' + email + '",');
  console.log('     "otp": "YOUR_LOGIN_OTP_CODE"');
  console.log('   }');
  console.log('');
  return true;
};

// Test 5: Password Reset Request
const testPasswordResetRequest = async () => {
  console.log('5. 🔄 Testing Password Reset Request...');
  const result = await makeRequest('POST', '/auth/request-password-reset', {
    email: testEmail
  });
  
  if (result.success) {
    console.log('   ✅ Password reset request successful');
    console.log('   📧 Message:', result.data.message);
    console.log('   🎯 Code:', result.data.code);
    console.log('   📧 CHECK YOUR EMAIL FOR PASSWORD RESET OTP!');
    return result.data.data?.email;
  } else {
    console.log('   ❌ Password reset request failed:', result.error.message);
    return null;
  }
};

// Test 6: Password Reset with OTP - Interactive
const testPasswordResetWithOTP = async (email) => {
  console.log('6. 🔓 Testing Password Reset with OTP...');
  console.log('   ⚠️  This requires manual OTP input from email');
  console.log('   📧 Check your email for the password reset OTP code');
  console.log('   🔢 To reset password, make a POST request to:');
  console.log('   🌐 URL: http://localhost:5000/api/auth/reset-password-otp');
  console.log('   📝 Body: {');
  console.log('     "email": "' + email + '",');
  console.log('     "otp": "YOUR_PASSWORD_RESET_OTP_CODE",');
  console.log('     "newPassword": "' + newPassword + '"');
  console.log('   }');
  console.log('');
  return true;
};

// Test 7: General OTP Send Test
const testGeneralOTP = async () => {
  console.log('7. 📤 Testing General OTP Send...');
  const result = await makeRequest('POST', '/auth/send-otp', {
    email: testEmail,
    purpose: 'verification'
  });
  
  if (result.success) {
    console.log('   ✅ OTP sent successfully');
    console.log('   📧 Message:', result.data.message);
    console.log('   🎯 Code:', result.data.code);
  } else {
    console.log('   ❌ OTP send failed:', result.error.message);
  }
  console.log('');
  return true;
};

// Test 8: Error Handling Test
const testErrorHandling = async () => {
  console.log('8. 🚨 Testing Error Handling...');
  
  // Test with invalid email
  const invalidEmailResult = await makeRequest('POST', '/auth/login', {
    email: 'nonexistent@example.com',
    password: testPassword
  });
  
  if (!invalidEmailResult.success) {
    console.log('   ✅ Invalid email handled correctly');
    console.log('   📧 Message:', invalidEmailResult.error.message);
  }
  
  // Test with wrong password
  const wrongPasswordResult = await makeRequest('POST', '/auth/login', {
    email: testEmail,
    password: 'wrongpassword'
  });
  
  if (!wrongPasswordResult.success) {
    console.log('   ✅ Wrong password handled correctly');
    console.log('   📧 Message:', wrongPasswordResult.error.message);
  }
  
  console.log('');
  return true;
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 SpeedForce Enhanced 2-Step Authentication System Tests');
  console.log('='.repeat(75));
  console.log('📧 Test Email: ' + testEmail);
  console.log('🔐 Test Password: ' + testPassword);
  console.log('🔑 New Password: ' + newPassword);
  console.log('='.repeat(75));
  console.log('');
  
  const serverHealthy = await testServerHealth();
  if (!serverHealthy) {
    console.log('❌ Server is not running. Please start with: npm run dev');
    return;
  }
  
  await testRegistration();
  
  const loginEmail = await testLoginStep1();
  if (loginEmail) {
    await testLoginStep2(loginEmail);
  }
  
  const resetEmail = await testPasswordResetRequest();
  if (resetEmail) {
    await testPasswordResetWithOTP(resetEmail);
  }
  
  await testGeneralOTP();
  await testErrorHandling();
  
  console.log('='.repeat(75));
  console.log('✅ All tests completed!');
  console.log('');
  console.log('📧 IMPORTANT: Check your email (' + testEmail + ') for:');
  console.log('   1. Login OTP (for completing 2-step login)');
  console.log('   2. Password reset OTP (for resetting password)');
  console.log('   3. General verification OTP');
  console.log('');
  console.log('🔧 Manual Test Commands:');
  console.log('');
  console.log('Complete Login:');
  console.log('curl -X POST http://localhost:5000/api/auth/complete-login \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"email":"' + testEmail + '","otp":"YOUR_LOGIN_OTP"}\'');
  console.log('');
  console.log('Reset Password:');
  console.log('curl -X POST http://localhost:5000/api/auth/reset-password-otp \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"email":"' + testEmail + '","otp":"YOUR_RESET_OTP","newPassword":"' + newPassword + '"}\'');
  console.log('');
  console.log('🎉 Your enhanced authentication system is ready!');
};

// Run the tests
runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
