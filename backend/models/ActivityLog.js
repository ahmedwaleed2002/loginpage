const { db } = require('../config/firebase');

class ActivityLog {
  constructor(activityData) {
    this.id = activityData.id;
    this.userId = activityData.userId;
    this.action = activityData.action;
    this.resource = activityData.resource;
    this.resourceId = activityData.resourceId;
    this.details = activityData.details || {};
    this.ipAddress = activityData.ipAddress;
    this.userAgent = activityData.userAgent;
    this.timestamp = activityData.timestamp || new Date();
  }

  // Create a new activity log
  static async create(activityData) {
    try {
      const activityRef = db.collection('activity_logs').doc();
      
      const newActivity = new ActivityLog({
        id: activityRef.id,
        ...activityData,
        timestamp: new Date()
      });

      await activityRef.set({
        userId: newActivity.userId,
        action: newActivity.action,
        resource: newActivity.resource,
        resourceId: newActivity.resourceId,
        details: newActivity.details,
        ipAddress: newActivity.ipAddress,
        userAgent: newActivity.userAgent,
        timestamp: newActivity.timestamp
      });

      return newActivity;
    } catch (error) {
      throw new Error(`Error creating activity log: ${error.message}`);
    }
  }

  // Find activity logs by user ID
  static async findByUserId(userId, options = {}) {
    try {
      const { page = 1, limit: pageLimit = 20, action: actionFilter } = options;
      
      let activityQuery = db.collection('activity_logs')
        .where('userId', '==', userId)
        .limit(pageLimit);

      // Add action filter if provided
      if (actionFilter) {
        activityQuery = db.collection('activity_logs')
          .where('userId', '==', userId)
          .where('action', '==', actionFilter)
          .limit(pageLimit);
      }

      // For pagination (simplified for now)
      if (page > 1) {
        const offset = (page - 1) * pageLimit;
        const offsetQuery = db.collection('activity_logs')
          .where('userId', '==', userId)
          .limit(offset);
        const offsetSnapshot = await offsetQuery.get();
        if (!offsetSnapshot.empty) {
          const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
          activityQuery = db.collection('activity_logs')
            .where('userId', '==', userId)
            .startAfter(lastDoc)
            .limit(pageLimit);
        }
      }

      const querySnapshot = await activityQuery.get();
      const activities = [];
      
      querySnapshot.forEach((doc) => {
        activities.push(new ActivityLog({ id: doc.id, ...doc.data() }));
      });

      return activities;
    } catch (error) {
      throw new Error(`Error finding activity logs: ${error.message}`);
    }
  }

  // Log user login
  static async logLogin(userId, ipAddress, userAgent) {
    return await ActivityLog.create({
      userId,
      action: 'LOGIN',
      resource: 'USER',
      resourceId: userId,
      details: { loginMethod: 'email' },
      ipAddress,
      userAgent
    });
  }

  // Log GitHub OAuth login
  static async logGitHubLogin(userId, ipAddress, userAgent) {
    return await ActivityLog.create({
      userId,
      action: 'LOGIN',
      resource: 'USER',
      resourceId: userId,
      details: { loginMethod: 'github' },
      ipAddress,
      userAgent
    });
  }

  // Log user logout
  static async logLogout(userId, ipAddress, userAgent) {
    return await ActivityLog.create({
      userId,
      action: 'LOGOUT',
      resource: 'USER',
      resourceId: userId,
      details: {},
      ipAddress,
      userAgent
    });
  }

  // Log note creation
  static async logNoteCreate(userId, noteId, ipAddress, userAgent) {
    return await ActivityLog.create({
      userId,
      action: 'CREATE',
      resource: 'NOTE',
      resourceId: noteId,
      details: {},
      ipAddress,
      userAgent
    });
  }

  // Log note update
  static async logNoteUpdate(userId, noteId, ipAddress, userAgent) {
    return await ActivityLog.create({
      userId,
      action: 'UPDATE',
      resource: 'NOTE',
      resourceId: noteId,
      details: {},
      ipAddress,
      userAgent
    });
  }

  // Log note deletion
  static async logNoteDelete(userId, noteId, ipAddress, userAgent) {
    return await ActivityLog.create({
      userId,
      action: 'DELETE',
      resource: 'NOTE',
      resourceId: noteId,
      details: {},
      ipAddress,
      userAgent
    });
  }

  // Log note view
  static async logNoteView(userId, noteId, ipAddress, userAgent) {
    return await ActivityLog.create({
      userId,
      action: 'VIEW',
      resource: 'NOTE',
      resourceId: noteId,
      details: {},
      ipAddress,
      userAgent
    });
  }

  // Get activity statistics for a user
  static async getStats(userId) {
    try {
      const activities = await ActivityLog.findByUserId(userId, { limit: 1000 });
      
      const stats = {
        totalActivities: activities.length,
        loginCount: activities.filter(a => a.action === 'LOGIN').length,
        noteActivities: activities.filter(a => a.resource === 'NOTE').length,
        recentActivities: activities.slice(0, 10),
        activityByAction: activities.reduce((acc, activity) => {
          acc[activity.action] = (acc[activity.action] || 0) + 1;
          return acc;
        }, {})
      };

      return stats;
    } catch (error) {
      throw new Error(`Error getting activity statistics: ${error.message}`);
    }
  }

  // Get public representation of activity log
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      action: this.action,
      resource: this.resource,
      resourceId: this.resourceId,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

module.exports = ActivityLog;
