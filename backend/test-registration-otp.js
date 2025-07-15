const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:5000/api';
const testEmail = 'ahmedwaleedusa@gmail.com';
const testPassword = 'TestPassword123!';

console.log('🧪 Testing Registration and OTP Functionality...\n');

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

// Test 1: Check if server is running
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

// Test 2: User Registration
const testUserRegistration = async () => {
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
    console.log('   🆔 User ID:', result.data.data?.user?.id);
    console.log('   📝 Note: Check if verification email was sent');
  } else {
    console.log('   ❌ User registration failed:', result.error);
    if (result.error.message?.includes('already exists')) {
      console.log('   ℹ️  User already exists, continuing with OTP test...');
      return true;
    }
    return false;
  }
  console.log('');
  return true;
};

// Test 3: Send OTP
const testSendOTP = async () => {
  console.log('3. 🔐 Testing Send OTP...');
  const result = await makeRequest('POST', '/auth/send-otp', {
    email: testEmail,
    purpose: 'verification'
  });
  
  if (result.success) {
    console.log('   ✅ OTP sent successfully');
    console.log('   📧 Message:', result.data.message);
    console.log('   🎯 Code:', result.data.code);
    console.log('   📮 Target Email:', testEmail);
    console.log('   ⏰ OTP expires in 10 minutes');
    console.log('   📧 CHECK YOUR EMAIL FOR THE OTP CODE!');
  } else {
    console.log('   ❌ Send OTP failed:', result.error);
    return false;
  }
  console.log('');
  return true;
};

// Test 4: Verify OTP (Interactive)
const testVerifyOTP = async () => {
  console.log('4. ✅ Testing Verify OTP...');
  console.log('   ⚠️  This test requires manual input');
  console.log('   📧 Check your email for the OTP code');
  console.log('   🔢 You can test OTP verification by making a POST request to:');
  console.log('   🌐 URL: http://localhost:5000/api/auth/verify-otp');
  console.log('   📝 Body: {');
  console.log('     "email": "' + testEmail + '",');
  console.log('     "otp": "YOUR_OTP_CODE_HERE",');
  console.log('     "purpose": "verification"');
  console.log('   }');
  console.log('');
  
  // Example of how to verify OTP programmatically (commented out for manual testing)
  /*
  const otpCode = '123456'; // Replace with actual OTP from email
  const result = await makeRequest('POST', '/auth/verify-otp', {
    email: testEmail,
    otp: otpCode,
    purpose: 'verification'
  });
  
  if (result.success) {
    console.log('   ✅ OTP verified successfully');
    console.log('   📧 Message:', result.data.message);
  } else {
    console.log('   ❌ OTP verification failed:', result.error);
  }
  */
  
  return true;
};

// Test 5: Login Test
const testLogin = async () => {
  console.log('5. 🔑 Testing User Login...');
  const result = await makeRequest('POST', '/auth/login', {
    email: testEmail,
    password: testPassword
  });
  
  if (result.success) {
    console.log('   ✅ User login successful');
    console.log('   👤 User:', result.data.data.user.email);
    console.log('   ✅ Verified:', result.data.data.user.isVerified);
    console.log('   🎫 Token received:', result.data.data.token ? 'Yes' : 'No');
  } else {
    console.log('   ❌ User login failed:', result.error);
    console.log('   ℹ️  This might be expected if email verification is required');
  }
  console.log('');
  return true;
};

// Test 6: Password Reset OTP
const testPasswordResetOTP = async () => {
  console.log('6. 🔄 Testing Password Reset OTP...');
  const result = await makeRequest('POST', '/auth/send-otp', {
    email: testEmail,
    purpose: 'password_reset'
  });
  
  if (result.success) {
    console.log('   ✅ Password reset OTP sent successfully');
    console.log('   📧 Message:', result.data.message);
    console.log('   🎯 Purpose: password_reset');
  } else {
    console.log('   ❌ Password reset OTP failed:', result.error);
  }
  console.log('');
  return true;
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 SpeedForce Authentication System - Registration & OTP Tests');
  console.log('='.repeat(70));
  console.log('📧 Test Email: ' + testEmail);
  console.log('🔐 Test Password: ' + testPassword);
  console.log('='.repeat(70));
  console.log('');
  
  const serverHealthy = await testServerHealth();
  if (!serverHealthy) {
    console.log('❌ Server is not running. Please start the server first.');
    console.log('   Run: npm run dev');
    return;
  }
  
  await testUserRegistration();
  await testSendOTP();
  await testVerifyOTP();
  await testLogin();
  await testPasswordResetOTP();
  
  console.log('='.repeat(70));
  console.log('✅ All tests completed!');
  console.log('');
  console.log('📧 IMPORTANT: Check your email (' + testEmail + ') for:');
  console.log('   1. Registration verification email');
  console.log('   2. OTP verification email');
  console.log('   3. Password reset OTP email');
  console.log('');
  console.log('🔧 To manually verify OTP, use the curl command or Postman:');
  console.log('curl -X POST http://localhost:5000/api/auth/verify-otp \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"email":"' + testEmail + '","otp":"YOUR_OTP_CODE","purpose":"verification"}\'');
};

// Run the tests
runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
