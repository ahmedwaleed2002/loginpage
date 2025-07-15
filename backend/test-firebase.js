const { db } = require('./config/firebase');

async function testFirebaseConnection() {
  try {
    console.log('🔥 Testing Firebase connection...');
    
    // Test basic connection by trying to get a non-existent document
    const testDoc = await db.collection('test').doc('connection-test').get();
    
    console.log('✅ Firebase connection successful!');
    console.log('📝 Firebase project ID:', db._settings?.projectId || 'undefined');
    
    // Test write operation
    await db.collection('test').doc('connection-test').set({
      timestamp: new Date(),
      test: true
    });
    
    console.log('✅ Firebase write operation successful!');
    
    // Test read operation
    const readTest = await db.collection('test').doc('connection-test').get();
    if (readTest.exists) {
      console.log('✅ Firebase read operation successful!');
      console.log('📊 Test data:', readTest.data());
    }
    
    // Cleanup
    await db.collection('test').doc('connection-test').delete();
    console.log('✅ Firebase cleanup successful!');
    
  } catch (error) {
    console.error('❌ Firebase connection failed:', error.message);
    console.error('🔍 Error details:', error);
  }
}

testFirebaseConnection();
