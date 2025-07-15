const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test data
const testUser = {
  email: 'test@speedforce.dev',
  password: 'TestPass123!@#',
  firstName: 'Test',
  lastName: 'User'
};

let authToken = '';

// Function to test registration
async function testRegistration() {
  try {
    console.log('🔐 Testing user registration...');
    const response = await axios.post(`${API_BASE}/auth/register`, testUser);
    console.log('✅ Registration successful:', response.data.message);
    return true;
  } catch (error) {
    console.log('❌ Registration failed:', error.response?.data?.message || error.message);
    return false;
  }
}

// Function to test login
async function testLogin() {
  try {
    console.log('🔐 Testing user login...');
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login successful:', response.data.message);
    authToken = response.data.data.token;
    return true;
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

// Function to test protected route
async function testProfile() {
  try {
    console.log('👤 Testing profile retrieval...');
    const response = await axios.get(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Profile retrieved:', response.data.data.user.email);
    return true;
  } catch (error) {
    console.log('❌ Profile retrieval failed:', error.response?.data?.message || error.message);
    return false;
  }
}

// Function to test note creation
async function testNoteCreation() {
  try {
    console.log('📝 Testing note creation...');
    const response = await axios.post(`${API_BASE}/notes`, {
      title: 'Test Note',
      content: '# Hello World\n\nThis is a test note with **markdown** content!',
      tags: ['test', 'markdown'],
      isPublic: false
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Note created:', response.data.data.title);
    return response.data.data.id;
  } catch (error) {
    console.log('❌ Note creation failed:', error.response?.data?.message || error.message);
    return null;
  }
}

// Function to test note retrieval
async function testNoteRetrieval() {
  try {
    console.log('📚 Testing notes retrieval...');
    const response = await axios.get(`${API_BASE}/notes`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Notes retrieved:', response.data.data.length, 'notes');
    return true;
  } catch (error) {
    console.log('❌ Notes retrieval failed:', error.response?.data?.message || error.message);
    return false;
  }
}

// Function to test activity logs
async function testActivityLogs() {
  try {
    console.log('📊 Testing activity logs...');
    const response = await axios.get(`${API_BASE}/activity`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Activity logs retrieved:', response.data.data.length, 'activities');
    return true;
  } catch (error) {
    console.log('❌ Activity logs failed:', error.response?.data?.message || error.message);
    return false;
  }
}

// Function to test health check
async function testHealthCheck() {
  try {
    console.log('🏥 Testing health check...');
    const response = await axios.get(`${API_BASE}/auth/health`);
    console.log('✅ Health check passed:', response.data.message);
    return true;
  } catch (error) {
    console.log('❌ Health check failed:', error.response?.data?.message || error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting SpeedForce Authentication API Tests\n');
  
  // Test health check first
  await testHealthCheck();
  console.log('');
  
  // Test registration
  await testRegistration();
  console.log('');
  
  // For testing purposes, manually verify the user to skip email verification
  console.log('⚠️  Note: In production, email verification would be required');
  console.log('');
  
  // Try login (might fail due to email verification requirement)
  const loginSuccess = await testLogin();
  console.log('');
  
  if (loginSuccess && authToken) {
    // Test protected routes
    await testProfile();
    console.log('');
    
    await testNoteCreation();
    console.log('');
    
    await testNoteRetrieval();
    console.log('');
    
    await testActivityLogs();
    console.log('');
  }
  
  console.log('🎉 API Testing Complete!');
}

// Start tests
runTests().catch(console.error);
