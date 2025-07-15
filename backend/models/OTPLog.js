const { db } = require('../config/firebase');

class OTPLog {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.purpose = data.purpose;
    this.action = data.action; // sent, verified, expired, failed
    this.ip = data.ip;
    this.userAgent = data.userAgent;
    this.timestamp = data.timestamp || new Date();
    this.success = data.success;
    this.errorMessage = data.errorMessage;
  }

  // Log OTP request
  static async logOTPRequest(email, purpose, action, ip, userAgent, success = true, errorMessage = null) {
    try {
      const logRef = db.collection('otpLogs').doc();
      const logData = new OTPLog({
        id: logRef.id,
        email,
        purpose,
        action,
        ip,
        userAgent,
        success,
        errorMessage
      });

      await logRef.set({
        email: logData.email,
        purpose: logData.purpose,
        action: logData.action,
        ip: logData.ip,
        userAgent: logData.userAgent,
        timestamp: logData.timestamp,
        success: logData.success,
        errorMessage: logData.errorMessage
      });

      console.log(`📝 OTP Log: ${action} - ${email} - ${purpose} - ${success ? 'Success' : 'Failed'}`);
    } catch (error) {
      console.error('Error logging OTP request:', error);
    }
  }

  // Get OTP statistics for an email
  static async getOTPStats(email, timeWindow = 24) {
    try {
      const hoursAgo = new Date(Date.now() - timeWindow * 60 * 60 * 1000);
      const querySnapshot = await db.collection('otpLogs')
        .where('email', '==', email)
        .where('timestamp', '>=', hoursAgo)
        .get();

      const logs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        total: logs.length,
        sent: logs.filter(log => log.action === 'sent').length,
        verified: logs.filter(log => log.action === 'verified').length,
        failed: logs.filter(log => log.action === 'failed').length,
        lastRequest: logs.length > 0 ? logs[logs.length - 1].timestamp : null
      };
    } catch (error) {
      console.error('Error getting OTP stats:', error);
      return {
        total: 0,
        sent: 0,
        verified: 0,
        failed: 0,
        lastRequest: null
      };
    }
  }

  // Check if user has exceeded OTP request limits
  static async checkRateLimit(email, maxRequests = 5, timeWindow = 60) {
    try {
      const minutesAgo = new Date(Date.now() - timeWindow * 60 * 1000);
      const querySnapshot = await db.collection('otpLogs')
        .where('email', '==', email)
        .where('action', '==', 'sent')
        .where('timestamp', '>=', minutesAgo)
        .get();

      const requestCount = querySnapshot.docs.length;
      const isRateLimited = requestCount >= maxRequests;

      return {
        isRateLimited,
        requestCount,
        maxRequests,
        timeWindow,
        resetTime: new Date(Date.now() + timeWindow * 60 * 1000)
      };
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return {
        isRateLimited: false,
        requestCount: 0,
        maxRequests,
        timeWindow,
        resetTime: new Date()
      };
    }
  }

  // Clean up old logs (keep last 30 days)
  static async cleanupOldLogs() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const querySnapshot = await db.collection('otpLogs')
        .where('timestamp', '<', thirtyDaysAgo)
        .get();

      const batch = db.batch();
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`🧹 Cleaned up ${querySnapshot.docs.length} old OTP logs`);
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
    }
  }
}

module.exports = OTPLog;
