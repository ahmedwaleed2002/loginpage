const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:5000/api';
const testEmail = 'awby2002+test@gmail.com';
const testPassword = 'TestPassword123!';

console.log('🧪 Starting OTP and Email Functionality Tests...\n');

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

// Test functions
const testHealthCheck = async () => {
  console.log('1. Testing Health Check...');
  const result = await makeRequest('GET', '/auth/health');
  
  if (result.success) {
    console.log('✅ Health check passed');
  } else {
    console.log('❌ Health check failed:', result.error);
  }
  console.log('');
};

const testUserRegistration = async () => {
  console.log('2. Testing User Registration...');
  const result = await makeRequest('POST', '/auth/register', {
    email: testEmail,
    password: testPassword,
    firstName: 'Test',
    lastName: 'User'
  });
  
  if (result.success) {
    console.log('✅ User registration successful');
    console.log('   Message:', result.data.message);
  } else {
    console.log('❌ User registration failed:', result.error);
  }
  console.log('');
};

const testSendOTP = async () => {
  console.log('3. Testing Send OTP...');
  const result = await makeRequest('POST', '/auth/send-otp', {
    email: testEmail,
    purpose: 'verification'
  });
  
  if (result.success) {
    console.log('✅ OTP sent successfully');
    console.log('   Message:', result.data.message);
    console.log('   Code:', result.data.code);
  } else {
    console.log('❌ Send OTP failed:', result.error);
  }
  console.log('');
};

const testVerifyOTP = async () => {
  console.log('4. Testing Verify OTP...');
  console.log('   ⚠️  This test requires manual input of OTP from email');
  console.log('   Skipping automated verification for now...');
  console.log('');
};

const testPasswordReset = async () => {
  console.log('5. Testing Password Reset Request...');
  const result = await makeRequest('POST', '/auth/request-password-reset', {
    email: testEmail
  });
  
  if (result.success) {
    console.log('✅ Password reset request successful');
    console.log('   Message:', result.data.message);
  } else {
    console.log('❌ Password reset request failed:', result.error);
  }
  console.log('');
};

const testLogin = async () => {
  console.log('6. Testing User Login...');
  const result = await makeRequest('POST', '/auth/login', {
    email: testEmail,
    password: testPassword
  });
  
  if (result.success) {
    console.log('✅ User login successful');
    console.log('   User ID:', result.data.data.user.id);
    console.log('   Email:', result.data.data.user.email);
    console.log('   Verified:', result.data.data.user.isVerified);
  } else {
    console.log('❌ User login failed:', result.error);
  }
  console.log('');
};

const testSendGridConfiguration = async () => {
  console.log('7. Testing SendGrid Configuration...');
  console.log('   API Key configured:', process.env.SENDGRID_API_KEY ? 'Yes' : 'No');
  console.log('   From Email configured:', process.env.SENDGRID_FROM_EMAIL ? 'Yes' : 'No');
  console.log('   API Key format valid:', process.env.SENDGRID_API_KEY?.startsWith('SG.') ? 'Yes' : 'No');
  console.log('');
};

// Run all tests
const runAllTests = async () => {
  console.log('🚀 SpeedForce Authentication System - OTP & Email Tests\n');
  console.log('='.repeat(60));
  
  await testHealthCheck();
  await testSendGridConfiguration();
  await testUserRegistration();
  await testSendOTP();
  await testVerifyOTP();
  await testPasswordReset();
  await testLogin();
  
  console.log('='.repeat(60));
  console.log('✅ All tests completed!');
  console.log('📝 Note: Some tests may fail if user already exists or server is not running');
  console.log('🔧 Make sure the server is running with: npm run dev');
};

// Check if server is running first
const checkServer = async () => {
  try {
    const result = await makeRequest('GET', '/auth/health');
    if (result.success) {
      console.log('🌐 Server is running, starting tests...\n');
      await runAllTests();
    } else {
      console.log('❌ Server is not responding. Please start the server first.');
      console.log('   Run: cd backend && npm run dev');
    }
  } catch (error) {
    console.log('❌ Cannot connect to server. Please make sure it\'s running.');
    console.log('   Run: cd backend && npm run dev');
  }
};

checkServer();
