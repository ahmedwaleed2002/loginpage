const { db } = require('../config/firebase');
const { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs 
} = require('firebase/firestore');
const bcrypt = require('bcryptjs');

class User {
  constructor(userData) {
    this.id = userData.id;
    this.email = userData.email;
    this.password = userData.password;
    this.firstName = userData.firstName;
    this.lastName = userData.lastName;
    this.isVerified = userData.isVerified || false;
    this.verificationToken = userData.verificationToken;
    this.passwordResetToken = userData.passwordResetToken;
    this.passwordResetExpires = userData.passwordResetExpires;
    this.rememberMe = userData.rememberMe || false;
    this.lastLogin = userData.lastLogin;
    this.createdAt = userData.createdAt || new Date();
    this.updatedAt = userData.updatedAt || new Date();
    this.loginAttempts = userData.loginAttempts || 0;
    this.lockUntil = userData.lockUntil;
    // GitHub OAuth fields
    this.githubId = userData.githubId;
    this.githubUsername = userData.githubUsername;
    this.githubAccessToken = userData.githubAccessToken;
  }

  // Create a new user
  static async create(userData) {
    try {
      const userRef = doc(collection(db, 'users'));
      const hashedPassword = await bcrypt.hash(userData.password, parseInt(process.env.BCRYPT_SALT_ROUNDS));
      
      const newUser = new User({
        id: userRef.id,
        ...userData,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await setDoc(userRef, {
        email: newUser.email,
        password: newUser.password,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        isVerified: newUser.isVerified,
        verificationToken: newUser.verificationToken,
        passwordResetToken: newUser.passwordResetToken,
        passwordResetExpires: newUser.passwordResetExpires,
        rememberMe: newUser.rememberMe,
        lastLogin: newUser.lastLogin,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
        loginAttempts: newUser.loginAttempts,
        lockUntil: newUser.lockUntil,
        githubId: newUser.githubId,
        githubUsername: newUser.githubUsername,
        githubAccessToken: newUser.githubAccessToken
      });

      return newUser;
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const userDoc = await getDoc(doc(db, 'users', id));
      if (userDoc.exists()) {
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
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
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
      const q = query(collection(db, 'users'), where('verificationToken', '==', token));
      const querySnapshot = await getDocs(q);
      
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
      const q = query(collection(db, 'users'), where('passwordResetToken', '==', token));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const user = new User({ id: userDoc.id, ...userDoc.data() });
        
        // Check if token is still valid
        if (user.passwordResetExpires && user.passwordResetExpires > new Date()) {
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
      const userRef = doc(db, 'users', this.id);
      const updatedData = {
        ...updateData,
        updatedAt: new Date()
      };

      await updateDoc(userRef, updatedData);
      
      // Update current instance
      Object.assign(this, updatedData);
      
      return this;
    } catch (error) {
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
    return this.lockUntil && this.lockUntil > new Date();
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
