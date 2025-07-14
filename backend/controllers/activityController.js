const ActivityLog = require('../models/ActivityLog');

// Get user activity logs
const getUserActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, action } = req.query;
    const userId = req.user.id;

    const activities = await ActivityLog.findByUserId(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      action
    });

    res.json({
      success: true,
      message: 'Activity logs retrieved successfully',
      code: 'ACTIVITY_LOGS_RETRIEVED',
      data: activities
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'GET_ACTIVITY_LOGS_ERROR'
    });
  }
};

// Get user activity statistics
const getUserActivityStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await ActivityLog.getStats(userId);

    res.json({
      success: true,
      message: 'Activity statistics retrieved successfully',
      code: 'ACTIVITY_STATS_RETRIEVED',
      data: stats
    });
  } catch (error) {
    console.error('Get activity stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'GET_ACTIVITY_STATS_ERROR'
    });
  }
};

module.exports = {
  getUserActivityLogs,
  getUserActivityStats
};
