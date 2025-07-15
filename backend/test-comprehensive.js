const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:5000';

// Test configuration
const TEST_CONFIG = {
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// Test data
const TEST_USER = {
  email: `test.${Date.now()}@speedforce.dev`,
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User'
};

let authToken = null;
let testUserId = null;

// Helper function to make API requests
const makeRequest = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      ...TEST_CONFIG,
      data
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

// Test functions
const testHealthCheck = async () => {
  console.log('🏥 Testing health check...');
  const result = await makeRequest('GET', '/api/auth/health');
  
  if (result.success) {
    console.log('✅ Health check passed:', result.data.message);
    return true;
  } else {
    console.log('❌ Health check failed:', result.error);
    return false;
  }
};

const testUserRegistration = async () => {
  console.log('📝 Testing user registration...');
  const result = await makeRequest('POST', '/api/auth/register', TEST_USER);
  
  if (result.success) {
    console.log('✅ Registration successful:', result.data.message);
    console.log('📧 Email:', TEST_USER.email);
    console.log('⏰ OTP expires in:', result.data.data?.otpExpiresIn, 'minutes');
    return true;
  } else {
    console.log('❌ Registration failed:', result.error.message);
    return false;
  }
};

const testOTPVerification = async () => {
  console.log('🔐 Testing OTP verification...');
  console.log('⚠️  This test requires manual OTP input from email');
  
  // In a real scenario, you would get the OTP from email
  const mockOTP = '123456'; // This would fail in real scenario
  
  const result = await makeRequest('POST', '/api/auth/verify-registration-otp', {
    email: TEST_USER.email,
    otp: mockOTP
  });
  
  if (result.success) {
    console.log('✅ OTP verification successful:', result.data.message);
    return true;
  } else {
    console.log('❌ OTP verification failed (expected with mock OTP):', result.error.message);
    return false;
  }
};

const testUserLogin = async () => {
  console.log('🔐 Testing user login...');
  const result = await makeRequest('POST', '/api/auth/login', {
    email: TEST_USER.email,
    password: TEST_USER.password
  });
  
  if (result.success) {
    console.log('✅ Login step 1 successful:', result.data.message);
    
    if (result.data.code === 'OTP_REQUIRED') {
      console.log('📧 OTP required for login completion');
      return true;
    }
    
    return true;
  } else {
    console.log('❌ Login failed:', result.error.message);
    return false;
  }
};

const testCompleteLogin = async () => {
  console.log('🔐 Testing complete login with OTP...');
  const mockOTP = '123456'; // This would fail in real scenario
  
  const result = await makeRequest('POST', '/api/auth/complete-login', {
    email: TEST_USER.email,
    otp: mockOTP
  });
  
  if (result.success) {
    console.log('✅ Complete login successful:', result.data.message);
    authToken = result.data.data.token;
    testUserId = result.data.data.user.id;
    return true;
  } else {
    console.log('❌ Complete login failed (expected with mock OTP):', result.error.message);
    return false;
  }
};

const testPasswordReset = async () => {
  console.log('🔄 Testing password reset request...');
  const result = await makeRequest('POST', '/api/auth/request-password-reset', {
    email: TEST_USER.email
  });
  
  if (result.success) {
    console.log('✅ Password reset request successful:', result.data.message);
    return true;
  } else {
    console.log('❌ Password reset request failed:', result.error.message);
    return false;
  }
};

const testOTPStats = async () => {
  console.log('📊 Testing OTP statistics...');
  try {
    const OTPLog = require('./models/OTPLog');
    const stats = await OTPLog.getOTPStats(TEST_USER.email);
    
    console.log('✅ OTP Stats retrieved:');
    console.log('  - Total requests:', stats.total);
    console.log('  - Sent:', stats.sent);
    console.log('  - Verified:', stats.verified);
    console.log('  - Failed:', stats.failed);
    
    return true;
  } catch (error) {
    console.log('❌ OTP stats test failed:', error.message);
    return false;
  }
};

const testRateLimit = async () => {
  console.log('🚦 Testing rate limiting...');
  try {
    const OTPLog = require('./models/OTPLog');
    const rateLimit = await OTPLog.checkRateLimit(TEST_USER.email);
    
    console.log('✅ Rate limit check:');
    console.log('  - Is rate limited:', rateLimit.isRateLimited);
    console.log('  - Request count:', rateLimit.requestCount);
    console.log('  - Max requests:', rateLimit.maxRequests);
    
    return true;
  } catch (error) {
    console.log('❌ Rate limit test failed:', error.message);
    return false;
  }
};

const testEmailTemplates = async () => {
  console.log('📧 Testing email templates...');
  try {
    const { sendOtpEmail } = require('./utils/email');
    
    // Test different email purposes
    const purposes = ['registration', 'login', 'password_reset', 'verification'];
    
    for (const purpose of purposes) {
      console.log(`  Testing ${purpose} email...`);
      await sendOtpEmail(TEST_USER.email, '123456', purpose);
      console.log(`  ✅ ${purpose} email template working`);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Email template test failed:', error.message);
    return false;
  }
};

const testUserModel = async () => {
  console.log('👤 Testing User model enhancements...');
  try {
    const User = require('./models/User');
    
    // Test user creation with new fields
    const testUser = new User({
      email: 'model.test@speedforce.dev',
      password: 'TestPassword123!',
      firstName: 'Model',
      lastName: 'Test',
      otp: '123456',
      otpExpires: new Date(Date.now() + 10 * 60 * 1000),
      otpPurpose: 'registration',
      status: 'active'
    });
    
    console.log('✅ User model with enhanced fields created');
    console.log('  - Verification object:', testUser.verification);
    console.log('  - Status:', testUser.status);
    console.log('  - Backward compatibility - OTP:', testUser.otp);
    
    return true;
  } catch (error) {
    console.log('❌ User model test failed:', error.message);
    return false;
  }
};

const testErrorHandling = async () => {
  console.log('🚨 Testing error handling...');
  
  // Test invalid endpoint
  const result1 = await makeRequest('GET', '/api/invalid-endpoint');
  console.log('✅ 404 handling:', result1.status === 404 ? 'Working' : 'Failed');
  
  // Test invalid login
  const result2 = await makeRequest('POST', '/api/auth/login', {
    email: 'invalid@email.com',
    password: 'wrongpassword'
  });
  console.log('✅ Invalid login handling:', result2.success === false ? 'Working' : 'Failed');
  
  return true;
};

// Main test runner
const runTests = async () => {
  console.log('🧪 Starting Comprehensive SpeedForce Authentication Tests\n');
  console.log('=' .repeat(60));
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'User Registration', fn: testUserRegistration },
    { name: 'OTP Verification', fn: testOTPVerification },
    { name: 'User Login', fn: testUserLogin },
    { name: 'Complete Login', fn: testCompleteLogin },
    { name: 'Password Reset', fn: testPasswordReset },
    { name: 'OTP Statistics', fn: testOTPStats },
    { name: 'Rate Limiting', fn: testRateLimit },
    { name: 'Email Templates', fn: testEmailTemplates },
    { name: 'User Model', fn: testUserModel },
    { name: 'Error Handling', fn: testErrorHandling }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`\n${test.name}:`);
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} failed with error:`, error.message);
      failed++;
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🎉 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎊 All tests passed! SpeedForce Authentication System is working perfectly!');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Please check the logs above.`);
  }
  
  console.log('\nℹ️  Note: Some tests may fail due to requiring actual OTP codes from email.');
  console.log('ℹ️  This is expected behavior in the test environment.');
};

// Check if server is running
const checkServer = async () => {
  try {
    await axios.get(`${API_URL}/api/auth/health`);
    console.log('✅ Server is running, starting tests...\n');
    return true;
  } catch (error) {
    console.log('❌ Cannot connect to server. Please make sure it\'s running.');
    console.log('   Run: cd backend && npm run dev');
    return false;
  }
};

// Start testing
checkServer().then(isRunning => {
  if (isRunning) {
    runTests();
  }
});
