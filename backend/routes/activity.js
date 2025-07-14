const express = require('express');
const router = express.Router();

// Import controllers
const { getUserActivityLogs, getUserActivityStats } = require('../controllers/activityController');

// Import middleware
const { verifyToken } = require('../middleware/auth');

// All activity routes require authentication
router.use(verifyToken);

// Activity log routes
router.get('/', getUserActivityLogs);
router.get('/stats', getUserActivityStats);

module.exports = router;
