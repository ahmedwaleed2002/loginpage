const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:5000';

// Test data
const TEST_EMAIL = `otp.test.${Date.now()}@speedforce.dev`;
const TEST_PASSWORD = 'TestPassword123!';

const makeRequest = async (method, endpoint, data = null) => {
  try {
    const response = await axios({
      method,
      url: `${API_URL}${endpoint}`,
      data,
      headers: { 'Content-Type': 'application/json' }
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
};

const testOTPReuse = async () => {
  console.log('🧪 Testing OTP Reuse Functionality\n');
  
  // Step 1: Register a new user
  console.log('📝 Step 1: Registering new user...');
  const registerResult = await makeRequest('POST', '/api/auth/register', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    firstName: 'Test',
    lastName: 'User'
  });
  
  if (registerResult.success) {
    console.log('✅ Registration successful');
    console.log('📧 Email:', TEST_EMAIL);
    console.log('⏰ OTP expires in:', registerResult.data.data?.otpExpiresIn, 'minutes');
    console.log('🆕 New OTP sent:', registerResult.data.data?.newOtpSent);
  } else {
    console.log('❌ Registration failed:', registerResult.error);
    return;
  }
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 2: Try to register again with the same email
  console.log('\n📝 Step 2: Trying to register again with same email...');
  const registerAgainResult = await makeRequest('POST', '/api/auth/register', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    firstName: 'Test',
    lastName: 'User'
  });
  
  if (registerAgainResult.success) {
    console.log('✅ Second registration handled correctly');
    console.log('📧 Email:', TEST_EMAIL);
    console.log('⏰ OTP expires in:', registerAgainResult.data.data?.otpExpiresIn, 'minutes');
    console.log('🆕 New OTP sent:', registerAgainResult.data.data?.newOtpSent);
    console.log('💬 Message:', registerAgainResult.data.message);
  } else {
    console.log('❌ Second registration failed:', registerAgainResult.error);
  }
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 3: Try to login with the same user
  console.log('\n🔐 Step 3: Trying to login...');
  const loginResult = await makeRequest('POST', '/api/auth/login', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });
  
  if (loginResult.success) {
    console.log('✅ Login step 1 successful');
    console.log('📧 Email:', TEST_EMAIL);
    console.log('⏰ OTP expires in:', loginResult.data.data?.otpExpiresIn, 'minutes');
    console.log('🆕 New OTP sent:', loginResult.data.data?.newOtpSent);
    console.log('💬 Message:', loginResult.data.message);
  } else {
    console.log('❌ Login failed:', loginResult.error);
  }
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 4: Try to login again (should reuse OTP)
  console.log('\n🔐 Step 4: Trying to login again (should reuse OTP)...');
  const loginAgainResult = await makeRequest('POST', '/api/auth/login', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });
  
  if (loginAgainResult.success) {
    console.log('✅ Second login handled correctly');
    console.log('📧 Email:', TEST_EMAIL);
    console.log('⏰ OTP expires in:', loginAgainResult.data.data?.otpExpiresIn, 'minutes');
    console.log('🆕 New OTP sent:', loginAgainResult.data.data?.newOtpSent);
    console.log('💬 Message:', loginAgainResult.data.message);
  } else {
    console.log('❌ Second login failed:', loginAgainResult.error);
  }
  
  // Step 5: Test resend registration OTP
  console.log('\n🔄 Step 5: Testing resend registration OTP...');
  const resendResult = await makeRequest('POST', '/api/auth/resend-registration-otp', {
    email: TEST_EMAIL
  });
  
  if (resendResult.success) {
    console.log('✅ Resend OTP successful');
    console.log('📧 Email:', TEST_EMAIL);
    console.log('⏰ OTP expires in:', resendResult.data.data?.otpExpiresIn, 'minutes');
    console.log('🆕 New OTP sent:', resendResult.data.data?.newOtpSent);
    console.log('💬 Message:', resendResult.data.message);
  } else {
    console.log('❌ Resend OTP failed:', resendResult.error);
  }
  
  console.log('\n🎉 OTP Reuse Test Complete!');
  console.log('\n📋 Summary:');
  console.log('- Registration should create new OTP');
  console.log('- Duplicate registration should reuse valid OTP or create new if expired');
  console.log('- Login should create new OTP for different purpose');
  console.log('- Subsequent logins should reuse valid login OTP');
  console.log('- Resend should work appropriately');
};

// Check if server is running
const checkServer = async () => {
  try {
    await axios.get(`${API_URL}/api/auth/health`);
    console.log('✅ Server is running, starting OTP reuse tests...\n');
    return true;
  } catch (error) {
    console.log('❌ Cannot connect to server. Please make sure it\'s running.');
    console.log('   Run: npm run dev');
    return false;
  }
};

// Start testing
checkServer().then(isRunning => {
  if (isRunning) {
    testOTPReuse();
  }
});
