const User = require('./models/User');
require('dotenv').config();

const unlockAccount = async (email) => {
  try {
    console.log(`🔓 Unlocking account for: ${email}`);
    
    const user = await User.findByEmail(email);
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    // Reset login attempts and unlock
    await user.update({
      loginAttempts: 0,
      lockUntil: null
    });
    
    console.log('✅ Account unlocked successfully');
    console.log('✅ Login attempts reset to 0');
    console.log('🔑 You can now try logging in again');
    
  } catch (error) {
    console.error('❌ Error unlocking account:', error);
  }
  
  process.exit(0);
};

const email = process.argv[2] || 'ahmedwaleedusa@gmail.com';
unlockAccount(email);
