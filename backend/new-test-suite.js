const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_URL;

const testEndpoints = [
  { method: 'GET', endpoint: '/api/auth/health' },
  { method: 'POST', endpoint: '/api/auth/register', data: { email: 'test@example.com', password: 'password', firstName: 'Test', lastName: 'User' } },
  { method: 'POST', endpoint: '/api/auth/login', data: { email: 'test@example.com', password: 'password' } },
  { method: 'POST', endpoint: '/api/auth/request-password-reset', data: { email: 'test@example.com' } }
];

async function runTests() {
  for (const { method, endpoint, data } of testEndpoints) {
    try {
      console.log(`Testing ${method} ${endpoint}`);
      const response = await axios({ method, url: `${API_URL}${endpoint}`, data });
      console.log('Success:', response.status, response.data);
    } catch (error) {
      console.error('Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
  }
}

runTests();

