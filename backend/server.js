console.log('📚 Loading required modules...');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const session = require('express-session');
console.log('🔐 Loading passport configuration...');
const passport = require('./config/passport');
const { errorHandler } = require('./middleware/errorHandler');
require('dotenv').config();
console.log('✅ All modules loaded successfully!');

const app = express();
const port = process.env.PORT || 5000;

// Import routes
console.log('🛣️ Loading routes...');
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const activityRoutes = require('./routes/activity');
console.log('✅ All routes loaded successfully!');

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('tiny'));

// Session configuration for passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Root route for testing
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 SpeedForce Authentication API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/auth/health',
      register: '/api/auth/register',
      login: '/api/auth/login',
      notes: '/api/notes',
      activity: '/api/activity'
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/activity', activityRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Not Found',
    code: 'NOT_FOUND'
  });
});

// Enhanced error handler
app.use(errorHandler);

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 SpeedForce Auth Server running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/auth/health`);
  console.log(`🌐 Server bound to 0.0.0.0:${port}`);
});

server.on('error', (err) => {
  console.error('❌ Server startup error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${port} is already in use`);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
