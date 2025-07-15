const { sendVerificationEmail } = require('./utils/email');

async function testImprovedEmail() {
  console.log('🧪 Testing improved email service...');
  
  try {
    await sendVerificationEmail('test@example.com', 'test-verification-token');
    console.log('✅ Email service test completed successfully!');
  } catch (error) {
    console.error('❌ Email service test failed:', error.message);
  }
}

testImprovedEmail();
