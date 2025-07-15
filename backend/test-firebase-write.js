const { db, admin } = require('./config/firebase');

async function testFirebaseConnection() {
  try {
    console.log('🔥 Testing Firebase connection...');
    
    // Test writing to Firestore
    const testRef = db.collection('test').doc('connection-test');
    const testData = {
      message: 'Firebase connection test',
      timestamp: new Date(),
      success: true
    };
    
    console.log('📝 Writing test data to Firestore...');
    await testRef.set(testData);
    console.log('✅ Test data written successfully!');
    
    // Test reading from Firestore
    console.log('📖 Reading test data from Firestore...');
    const doc = await testRef.get();
    if (doc.exists) {
      console.log('✅ Test data read successfully:', doc.data());
    } else {
      console.log('❌ Test document not found');
    }
    
    // Test user collection exists
    console.log('👤 Checking users collection...');
    const usersSnapshot = await db.collection('users').limit(5).get();
    console.log(`📊 Found ${usersSnapshot.size} users in database`);
    
    if (!usersSnapshot.empty) {
      console.log('👥 Sample users:');
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        console.log(`- ID: ${doc.id}, Email: ${userData.email}, Verified: ${userData.isVerified}`);
      });
    }
    
    // Clean up test document
    await testRef.delete();
    console.log('🗑️ Test document cleaned up');
    
    console.log('🎉 Firebase connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
  }
}

testFirebaseConnection();
