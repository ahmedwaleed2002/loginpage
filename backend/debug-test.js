const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test login first to get token
async function testLogin() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test@speedforce.dev',
      password: 'TestPass123!@#'
    });
    return response.data.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    return null;
  }
}

// Test notes with detailed error logging
async function testNotes(token) {
  try {
    console.log('🔍 Testing notes retrieval with detailed logging...');
    const response = await axios.get(`${API_BASE}/notes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Notes retrieved:', response.data);
  } catch (error) {
    console.log('❌ Notes failed:');
    console.log('Status:', error.response?.status);
    console.log('Error data:', error.response?.data);
    console.log('Full error:', error.message);
  }
}

// Test activity with detailed error logging
async function testActivity(token) {
  try {
    console.log('🔍 Testing activity logs with detailed logging...');
    const response = await axios.get(`${API_BASE}/activity`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Activity retrieved:', response.data);
  } catch (error) {
    console.log('❌ Activity failed:');
    console.log('Status:', error.response?.status);
    console.log('Error data:', error.response?.data);
    console.log('Full error:', error.message);
  }
}

async function runDetailedTests() {
  console.log('🔍 Running detailed API tests...\n');
  
  const token = await testLogin();
  if (!token) {
    console.log('❌ Cannot proceed without authentication token');
    return;
  }
  
  console.log('✅ Token obtained, proceeding with tests...\n');
  
  await testNotes(token);
  console.log('');
  await testActivity(token);
}

runDetailedTests().catch(console.error);
