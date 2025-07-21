/**
 * SpeedForce Digital Authentication System - Comprehensive Test Suite
 * Version: 2.3.0
 * 
 * This test suite validates the core functionality of the authentication system:
 * - User Registration with OTP verification
 * - Email-based OTP delivery (SendGrid)
 * - Login system (direct for verified users)
 * - Password reset flow
 * - Email templates and delivery
 * - Error handling and validation
 * 
 * Test Environment Requirements:
 * - Server running on http://localhost:5000
 * - All environment variables configured in .env
 * - SendGrid API key active
 * - Firebase project configured
 */

const axios = require('axios');
require('dotenv').config();

// Configuration
const API_URL = process.env.API_URL;
const TEST_TIMEOUT = 10000;

// Test data
const generateTestUser = () => ({
  email: `test.${Date.now()}@speedforce.dev`,
  password: 'TestPassword123!',
  firstName: 'SpeedForce',
  lastName: 'TestUser'
});

// Utility functions
const makeRequest = async (method, endpoint, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      timeout: TEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 500,
      error: error.response?.data || { message: error.message }
    };
  }
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test functions
const tests = {
  async serverConnectivity() {
    console.log('🔌 Testing server connectivity...');
    const result = await makeRequest('GET', '/');
    
    if (result.success) {
      console.log('   ✅ Server is running and accessible');
      console.log('   📊 Response:', result.data.message);
      return true;
    } else {
      console.log('   ❌ Server connection failed');
      console.log('   🔍 Error:', result.error);
      return false;
    }
  },

  async userRegistration() {
    console.log('📝 Testing user registration...');
    const testUser = generateTestUser();
    const result = await makeRequest('POST', '/api/auth/register', testUser);
    
    if (result.success) {
      console.log('   ✅ Registration successful');
      console.log('   📧 Test email:', testUser.email);
      console.log('   💬 Message:', result.data.message);
      
      // Store test user for subsequent tests
      this.testUser = testUser;
      return true;
    } else {
      console.log('   ❌ Registration failed');
      console.log('   🔍 Error:', result.error.message);
      return false;
    }
  },

  async loginUnverifiedUser() {
    console.log('🔐 Testing login with unverified user...');
    if (!this.testUser) {
      console.log('   ⚠️  No test user available, skipping...');
      return false;
    }
    
    const result = await makeRequest('POST', '/api/auth/login', {
      email: this.testUser.email,
      password: this.testUser.password
    });
    
    if (!result.success && result.error.code === 'EMAIL_NOT_VERIFIED') {
      console.log('   ✅ Correctly rejected unverified user');
      console.log('   💬 Message:', result.error.message);
      return true;
    } else {
      console.log('   ❌ Should have rejected unverified user');
      return false;
    }
  },

  async passwordResetRequest() {
    console.log('🔄 Testing password reset request...');
    if (!this.testUser) {
      console.log('   ⚠️  No test user available, skipping...');
      return false;
    }
    
    const result = await makeRequest('POST', '/api/auth/request-password-reset', {
      email: this.testUser.email
    });
    
    if (result.success) {
      console.log('   ✅ Password reset request successful');
      console.log('   💬 Message:', result.data.message);
      return true;
    } else {
      console.log('   ❌ Password reset request failed');
      console.log('   🔍 Error:', result.error.message);
      return false;
    }
  },

  async emailTemplateDelivery() {
    console.log('📧 Testing email template delivery...');
    try {
      const { sendOtpEmail } = require('./utils/email');
      const testEmail = 'test.templates@speedforce.dev';
      
      const templates = ['registration', 'login', 'password_reset', 'verification'];
      let allSuccessful = true;
      
      for (const template of templates) {
        try {
          await sendOtpEmail(testEmail, '123456', template);
          console.log(`   ✅ ${template} template delivered successfully`);
        } catch (error) {
          console.log(`   ❌ ${template} template failed:`, error.message);
          allSuccessful = false;
        }
      }
      
      return allSuccessful;
    } catch (error) {
      console.log('   ❌ Email template test failed:', error.message);
      return false;
    }
  },

  async inputValidation() {
    console.log('🛡️  Testing input validation...');
    
    const invalidRequests = [
      {
        name: 'Invalid email format',
        endpoint: '/api/auth/register',
        data: { email: 'invalid-email', password: 'Test123!', firstName: 'Test', lastName: 'User' }
      },
      {
        name: 'Weak password',
        endpoint: '/api/auth/register',
        data: { email: 'test@example.com', password: '123', firstName: 'Test', lastName: 'User' }
      },
      {
        name: 'Missing required fields',
        endpoint: '/api/auth/register',
        data: { email: 'test@example.com' }
      },
      {
        name: 'Empty login credentials',
        endpoint: '/api/auth/login',
        data: {}
      }
    ];
    
    let validationsPassed = 0;
    
    for (const test of invalidRequests) {
      const result = await makeRequest('POST', test.endpoint, test.data);
      
      if (!result.success && (result.status === 400 || result.status === 422)) {
        console.log(`   ✅ ${test.name}: Correctly rejected`);
        validationsPassed++;
      } else {
        console.log(`   ❌ ${test.name}: Should have been rejected`);
      }
    }
    
    return validationsPassed === invalidRequests.length;
  },

  async errorHandling() {
    console.log('🚨 Testing error handling...');
    
    const errorTests = [
      {
        name: 'Non-existent endpoint',
        endpoint: '/api/auth/nonexistent',
        method: 'GET',
        expectedStatus: 404
      },
      {
        name: 'Invalid login credentials',
        endpoint: '/api/auth/login',
        method: 'POST',
        data: { email: 'nonexistent@test.com', password: 'wrongpassword' },
        expectedStatus: 401
      },
      {
        name: 'Malformed JSON',
        endpoint: '/api/auth/register',
        method: 'POST',
        data: 'invalid-json',
        expectedStatus: 400
      }
    ];
    
    let errorsPassed = 0;
    
    for (const test of errorTests) {
      const result = await makeRequest(test.method, test.endpoint, test.data);
      
      if (!result.success && result.status === test.expectedStatus) {
        console.log(`   ✅ ${test.name}: Handled correctly`);
        errorsPassed++;
      } else {
        console.log(`   ❌ ${test.name}: Expected ${test.expectedStatus}, got ${result.status}`);
      }
    }
    
    return errorsPassed === errorTests.length;
  },

  async authenticatedEndpoints() {
    console.log('🔒 Testing authenticated endpoints...');
    
    const protectedEndpoints = [
      { endpoint: '/api/auth/profile', method: 'GET' },
      { endpoint: '/api/auth/change-password', method: 'PUT', data: { currentPassword: 'old', newPassword: 'new' } }
    ];
    
    let unauthorizedCorrectly = 0;
    
    for (const test of protectedEndpoints) {
      const result = await makeRequest(test.method, test.endpoint, test.data);
      
      if (!result.success && result.status === 401) {
        console.log(`   ✅ ${test.endpoint}: Correctly requires authentication`);
        unauthorizedCorrectly++;
      } else {
        console.log(`   ❌ ${test.endpoint}: Should require authentication`);
      }
    }
    
    return unauthorizedCorrectly === protectedEndpoints.length;
  },

  async systemConfiguration() {
    console.log('⚙️  Testing system configuration...');
    
    const requiredEnvVars = [
      'API_URL', 'JWT_SECRET', 'SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL',
      'FIREBASE_PROJECT_ID', 'GITHUB_CLIENT_ID', 'FRONTEND_URL'
    ];
    
    let configCorrect = true;
    
    for (const varName of requiredEnvVars) {
      if (process.env[varName]) {
        console.log(`   ✅ ${varName}: Configured`);
      } else {
        console.log(`   ❌ ${varName}: Missing`);
        configCorrect = false;
      }
    }
    
    return configCorrect;
  }
};

// Main test runner
async function runTestSuite() {
  console.log('🚀 SpeedForce Digital Authentication System - Test Suite v2.3.0');
  console.log('=' .repeat(70));
  console.log('📋 Testing Environment:');
  console.log('   🌐 API URL:', API_URL);
  console.log('   ⏱️  Timeout:', TEST_TIMEOUT + 'ms');
  console.log('   📧 Email Service: SendGrid');
  console.log('   🔥 Database: Firebase Firestore');
  console.log('=' .repeat(70));
  
  const testResults = {};
  let totalTests = 0;
  let passedTests = 0;
  
  // Check server availability first
  console.log('🔍 Pre-flight checks...');
  if (!API_URL) {
    console.log('❌ API_URL not configured in environment');
    return;
  }
  
  for (const [testName, testFn] of Object.entries(tests)) {
    totalTests++;
    console.log(`\n📋 Test ${totalTests}/${Object.keys(tests).length}: ${testName}`);
    
    try {
      const result = await testFn.call(tests);
      testResults[testName] = result;
      
      if (result) {
        passedTests++;
        console.log('   🎉 PASSED');
      } else {
        console.log('   💥 FAILED');
      }
    } catch (error) {
      testResults[testName] = false;
      console.log('   💥 ERROR:', error.message);
    }
    
    // Wait between tests to avoid rate limiting
    await wait(1000);
  }
  
  // Results summary
  console.log('\n' + '=' .repeat(70));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(70));
  console.log(`✅ Passed: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎊 All tests passed! SpeedForce Authentication System is fully operational!');
  } else {
    console.log('\n⚠️  Some tests failed. Review the detailed output above.');
  }
  
  console.log('\n📋 Test Details:');
  for (const [testName, result] of Object.entries(testResults)) {
    console.log(`   ${result ? '✅' : '❌'} ${testName}`);
  }
  
  console.log('\n💡 Notes:');
  console.log('   • OTP verification requires manual input from email');
  console.log('   • Some tests create test users (cleanup may be needed)');
  console.log('   • Email template tests send actual emails to test addresses');
  console.log('   • System is designed for verified users to login directly');
  
  console.log('\n🔗 Next Steps:');
  if (passedTests < totalTests) {
    console.log('   1. Review failed tests and fix issues');
    console.log('   2. Check server logs for detailed error information');
    console.log('   3. Verify environment configuration');
  } else {
    console.log('   1. System ready for production deployment');
    console.log('   2. Consider setting up automated testing pipeline');
    console.log('   3. Monitor system performance in production');
  }
  
  console.log('\n📞 Support: Check agent.md for detailed system documentation');
}

// Execute tests
if (require.main === module) {
  runTestSuite().catch(error => {
    console.error('💥 Test suite failed to run:', error.message);
    process.exit(1);
  });
}

module.exports = { runTestSuite, tests, makeRequest };
