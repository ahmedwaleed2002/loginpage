const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');

// Data validation utilities
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 8;
};

const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>"'&]/g, '');
};

// Helper to convert Firebase Timestamp to Date safely
const toDate = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp);
};

// Helper to format dates consistently for Firestore
const formatDateForFirestore = (date) => {
  if (!date) return null;
  return new Date(date);
};

class User {
  constructor(userData) {
    // Validate and sanitize required fields
    if (!userData.email || !validateEmail(userData.email)) {
      throw new Error('Valid email is required');
    }
    
    this.id = userData.id;
    this.email = sanitizeString(userData.email).toLowerCase();
    this.password = userData.password; // Never sanitize password
    this.firstName = sanitizeString(userData.firstName || '');
    this.lastName = sanitizeString(userData.lastName || '');
    this.isVerified = Boolean(userData.isVerified);
    this.verificationToken = userData.verificationToken || null;
    this.passwordResetToken = userData.passwordResetToken || null;
    this.passwordResetExpires = toDate(userData.passwordResetExpires);
    this.rememberMe = Boolean(userData.rememberMe);
    this.lastLogin = toDate(userData.lastLogin);
    this.createdAt = toDate(userData.createdAt) || new Date();
    this.updatedAt = toDate(userData.updatedAt) || new Date();
    this.loginAttempts = Number(userData.loginAttempts) || 0;
    this.lockUntil = toDate(userData.lockUntil);
    
    // OTP fields
    this.otp = userData.otp || null;
    this.otpExpires = toDate(userData.otpExpires);
    this.otpPurpose = userData.otpPurpose || null;
    
    // GitHub OAuth fields
    this.githubId = userData.githubId || null;
    this.githubUsername = sanitizeString(userData.githubUsername || '');
    this.githubAccessToken = userData.githubAccessToken || null;
  }
  
  // Convert user data to Firestore-safe format
  toFirestoreData() {
    const data = {
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      isVerified: this.isVerified,
      rememberMe: this.rememberMe,
      loginAttempts: this.loginAttempts,
      createdAt: formatDateForFirestore(this.createdAt),
      updatedAt: formatDateForFirestore(this.updatedAt)
    };
    
    // Only include fields that have values
    if (this.password) data.password = this.password;
    if (this.verificationToken) data.verificationToken = this.verificationToken;
    if (this.passwordResetToken) data.passwordResetToken = this.passwordResetToken;
    if (this.passwordResetExpires) data.passwordResetExpires = formatDateForFirestore(this.passwordResetExpires);
    if (this.lastLogin) data.lastLogin = formatDateForFirestore(this.lastLogin);
    if (this.lockUntil) data.lockUntil = formatDateForFirestore(this.lockUntil);
    if (this.githubId) data.githubId = this.githubId;
    if (this.githubUsername) data.githubUsername = this.githubUsername;
    if (this.githubAccessToken) data.githubAccessToken = this.githubAccessToken;
    if (this.otp) data.otp = this.otp;
    if (this.otpExpires) data.otpExpires = formatDateForFirestore(this.otpExpires);
    if (this.otpPurpose) data.otpPurpose = this.otpPurpose;
    
    return data;
  }

  // Create a new user
  static async create(userData) {
    try {
      // Validate password before hashing
      if (!validatePassword(userData.password)) {
        throw new Error('Password must be at least 8 characters long');
      }
      
      const userRef = db.collection('users').doc();
      const hashedPassword = await bcrypt.hash(userData.password, parseInt(process.env.BCRYPT_SALT_ROUNDS));
      
      const newUser = new User({
        id: userRef.id,
        ...userData,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Use the new toFirestoreData method for consistent formatting
      const firestoreData = newUser.toFirestoreData();
      
      console.log('🔧 Creating user in Firestore with data:', {
        ...firestoreData,
        password: '[REDACTED]'
      });
      
      await userRef.set(firestoreData);
      
      console.log('✅ User created successfully in Firestore');
      return newUser;
    } catch (error) {
      console.error('❌ Error creating user:', error.message);
      throw new Error(`Error creating user: ${error.message}`);
    }
  };

  // Find user by ID
  static async findById(id) {
    try {
      const userDoc = await db.collection('users').doc(id).get();
      if (userDoc.exists) {
        return new User({ id: userDoc.id, ...userDoc.data() });
      }
      return null;
    } catch (error) {
      throw new Error(`Error finding user by ID: ${error.message}`);
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const querySnapshot = await db.collection('users').where('email', '==', email).get();
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return new User({ id: userDoc.id, ...userDoc.data() });
      }
      return null;
    } catch (error) {
      throw new Error(`Error finding user by email: ${error.message}`);
    }
  }

  // Find user by verification token
  static async findByVerificationToken(token) {
    try {
      const querySnapshot = await db.collection('users').where('verificationToken', '==', token).get();
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return new User({ id: userDoc.id, ...userDoc.data() });
      }
      return null;
    } catch (error) {
      throw new Error(`Error finding user by verification token: ${error.message}`);
    }
  }

  // Find user by password reset token
  static async findByPasswordResetToken(token) {
    try {
      const querySnapshot = await db.collection('users').where('passwordResetToken', '==', token).get();
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const user = new User({ id: userDoc.id, ...userDoc.data() });
        
        // Check if token is still valid
        const expiresDate = user.passwordResetExpires?.toDate ? user.passwordResetExpires.toDate() : user.passwordResetExpires;
        if (user.passwordResetExpires && expiresDate > new Date()) {
          return user;
        }
      }
      return null;
    } catch (error) {
      throw new Error(`Error finding user by password reset token: ${error.message}`);
    }
  }

  // Update user
  async update(updateData) {
    try {
      const userRef = db.collection('users').doc(this.id);
      
      // Update instance properties first
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          this[key] = updateData[key];
        }
      });
      
      // Always update the updatedAt timestamp
      this.updatedAt = new Date();
      
      // Prepare clean update data for Firestore
      const cleanUpdateData = { updatedAt: formatDateForFirestore(this.updatedAt) };
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          if (key.includes('Date') || key.includes('Login') || key.includes('Until')) {
            // Handle date fields
            cleanUpdateData[key] = formatDateForFirestore(updateData[key]);
          } else if (typeof updateData[key] === 'string' && key !== 'password') {
            // Sanitize string fields (except password)
            cleanUpdateData[key] = sanitizeString(updateData[key]);
          } else {
            cleanUpdateData[key] = updateData[key];
          }
        }
      });
      
      console.log('🔧 Updating user in Firestore:', {
        userId: this.id,
        updateData: { ...cleanUpdateData, password: cleanUpdateData.password ? '[REDACTED]' : undefined }
      });

      await userRef.update(cleanUpdateData);
      
      console.log('✅ User updated successfully in Firestore');
      return this;
    } catch (error) {
      console.error('❌ Error updating user:', error.message);
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  // Verify password
  async verifyPassword(password) {
    try {
      return await bcrypt.compare(password, this.password);
    } catch (error) {
      throw new Error(`Error verifying password: ${error.message}`);
    }
  }

  // Update password
  async updatePassword(newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_SALT_ROUNDS));
      await this.update({ 
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      });
      return true;
    } catch (error) {
      throw new Error(`Error updating password: ${error.message}`);
    }
  }

  // Increment login attempts
  async incrementLoginAttempts() {
    try {
      const updates = {
        loginAttempts: this.loginAttempts + 1
      };

      // Lock account after 5 failed attempts for 30 minutes
      if (this.loginAttempts + 1 >= 5) {
        updates.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }

      await this.update(updates);
      return true;
    } catch (error) {
      throw new Error(`Error incrementing login attempts: ${error.message}`);
    }
  }

  // Reset login attempts
  async resetLoginAttempts() {
    try {
      await this.update({
        loginAttempts: 0,
        lockUntil: null
      });
      return true;
    } catch (error) {
      throw new Error(`Error resetting login attempts: ${error.message}`);
    }
  }

  // Check if account is locked
  isLocked() {
    if (!this.lockUntil) return false;
    const lockDate = this.lockUntil?.toDate ? this.lockUntil.toDate() : this.lockUntil;
    return lockDate > new Date();
  }

  // Update last login
  async updateLastLogin() {
    try {
      await this.update({ lastLogin: new Date() });
      return true;
    } catch (error) {
      throw new Error(`Error updating last login: ${error.message}`);
    }
  }

  // Get user profile (without sensitive data)
  getProfile() {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      isVerified: this.isVerified,
      lastLogin: this.lastLogin,
      createdAt: this.createdAt
    };
  }
}

module.exports = User;
