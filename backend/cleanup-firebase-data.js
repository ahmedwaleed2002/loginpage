const { db } = require('./config/firebase');
require('dotenv').config();

console.log('🔧 Starting Firebase Data Cleanup and Migration...\n');

// Helper function to safely convert dates
const cleanupDate = (dateValue) => {
  if (!dateValue) return null;
  
  if (dateValue.toDate && typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }
  
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  // If it's a string or number, try to convert it
  const parsedDate = new Date(dateValue);
  return isNaN(parsedDate.getTime()) ? null : parsedDate;
};

// Clean up user data
const cleanupUsers = async () => {
  console.log('👥 Cleaning up user data...');
  
  try {
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('   No users found to cleanup');
      return;
    }
    
    const batch = db.batch();
    let cleanedCount = 0;
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      const userRef = db.collection('users').doc(doc.id);
      
      // Clean up the user data
      const cleanedData = {
        ...userData,
        createdAt: cleanupDate(userData.createdAt) || new Date(),
        updatedAt: cleanupDate(userData.updatedAt) || new Date(),
        lastLogin: cleanupDate(userData.lastLogin),
        passwordResetExpires: cleanupDate(userData.passwordResetExpires),
        lockUntil: cleanupDate(userData.lockUntil),
        otpExpires: cleanupDate(userData.otpExpires),
        loginAttempts: Number(userData.loginAttempts) || 0,
        isVerified: Boolean(userData.isVerified),
        rememberMe: Boolean(userData.rememberMe)
      };
      
      // Remove undefined values
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === undefined) {
          delete cleanedData[key];
        }
      });
      
      batch.update(userRef, cleanedData);
      cleanedCount++;
    });
    
    if (cleanedCount > 0) {
      await batch.commit();
      console.log(`   ✅ Cleaned up ${cleanedCount} user records`);
    } else {
      console.log('   ✅ No user records needed cleanup');
    }
    
  } catch (error) {
    console.error('   ❌ Error cleaning up users:', error.message);
  }
};

// Clean up notes data
const cleanupNotes = async () => {
  console.log('📝 Cleaning up notes data...');
  
  try {
    const notesSnapshot = await db.collection('notes').get();
    
    if (notesSnapshot.empty) {
      console.log('   No notes found to cleanup');
      return;
    }
    
    const batch = db.batch();
    let cleanedCount = 0;
    
    notesSnapshot.forEach((doc) => {
      const noteData = doc.data();
      const noteRef = db.collection('notes').doc(doc.id);
      
      // Clean up the note data
      const cleanedData = {
        ...noteData,
        createdAt: cleanupDate(noteData.createdAt) || new Date(),
        updatedAt: cleanupDate(noteData.updatedAt) || new Date(),
        tags: Array.isArray(noteData.tags) ? noteData.tags : [],
        isPublic: Boolean(noteData.isPublic)
      };
      
      // Remove undefined values
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === undefined) {
          delete cleanedData[key];
        }
      });
      
      batch.update(noteRef, cleanedData);
      cleanedCount++;
    });
    
    if (cleanedCount > 0) {
      await batch.commit();
      console.log(`   ✅ Cleaned up ${cleanedCount} note records`);
    } else {
      console.log('   ✅ No note records needed cleanup');
    }
    
  } catch (error) {
    console.error('   ❌ Error cleaning up notes:', error.message);
  }
};

// Clean up activity logs
const cleanupActivityLogs = async () => {
  console.log('📊 Cleaning up activity logs...');
  
  try {
    const logsSnapshot = await db.collection('activity_logs').get();
    
    if (logsSnapshot.empty) {
      console.log('   No activity logs found to cleanup');
      return;
    }
    
    const batch = db.batch();
    let cleanedCount = 0;
    
    logsSnapshot.forEach((doc) => {
      const logData = doc.data();
      const logRef = db.collection('activity_logs').doc(doc.id);
      
      // Clean up the activity log data
      const cleanedData = {
        ...logData,
        timestamp: cleanupDate(logData.timestamp) || new Date(),
        details: logData.details || {}
      };
      
      // Remove undefined values
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === undefined) {
          delete cleanedData[key];
        }
      });
      
      batch.update(logRef, cleanedData);
      cleanedCount++;
    });
    
    if (cleanedCount > 0) {
      await batch.commit();
      console.log(`   ✅ Cleaned up ${cleanedCount} activity log records`);
    } else {
      console.log('   ✅ No activity log records needed cleanup');
    }
    
  } catch (error) {
    console.error('   ❌ Error cleaning up activity logs:', error.message);
  }
};

// Generate database statistics
const generateStatistics = async () => {
  console.log('📈 Generating database statistics...');
  
  try {
    const usersSnapshot = await db.collection('users').get();
    const notesSnapshot = await db.collection('notes').get();
    const logsSnapshot = await db.collection('activity_logs').get();
    
    console.log('   Database Statistics:');
    console.log(`   - Users: ${usersSnapshot.size}`);
    console.log(`   - Notes: ${notesSnapshot.size}`);
    console.log(`   - Activity Logs: ${logsSnapshot.size}`);
    
    // User statistics
    if (!usersSnapshot.empty) {
      let verifiedUsers = 0;
      let githubUsers = 0;
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.isVerified) verifiedUsers++;
        if (userData.githubId) githubUsers++;
      });
      
      console.log(`   - Verified Users: ${verifiedUsers}`);
      console.log(`   - GitHub OAuth Users: ${githubUsers}`);
    }
    
  } catch (error) {
    console.error('   ❌ Error generating statistics:', error.message);
  }
};

// Main cleanup function
const runCleanup = async () => {
  console.log('🚀 Firebase Data Cleanup and Migration Script');
  console.log('=' .repeat(60));
  
  await cleanupUsers();
  console.log('');
  
  await cleanupNotes();
  console.log('');
  
  await cleanupActivityLogs();
  console.log('');
  
  await generateStatistics();
  console.log('');
  
  console.log('=' .repeat(60));
  console.log('✅ Database cleanup completed successfully!');
  console.log('🔧 All data has been normalized and cleaned up.');
  
  process.exit(0);
};

// Run the cleanup
runCleanup().catch(error => {
  console.error('❌ Cleanup failed:', error);
  process.exit(1);
});
