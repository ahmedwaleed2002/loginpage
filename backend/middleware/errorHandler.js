const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let error = {
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR'
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error = {
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }))
    };
    return res.status(400).json(error);
  }

  if (err.name === 'MongoError' && err.code === 11000) {
    error = {
      success: false,
      message: 'Duplicate field value entered',
      code: 'DUPLICATE_FIELD'
    };
    return res.status(400).json(error);
  }

  if (err.name === 'JsonWebTokenError') {
    error = {
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    };
    return res.status(401).json(error);
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      success: false,
      message: 'Token expired',
      code: 'TOKEN_EXPIRED'
    };
    return res.status(401).json(error);
  }

  // Firebase errors
  if (err.code && err.code.includes('firebase')) {
    error = {
      success: false,
      message: 'Database operation failed',
      code: 'DATABASE_ERROR'
    };
    return res.status(500).json(error);
  }

  // Custom application errors
  if (err.isOperational) {
    error = {
      success: false,
      message: err.message,
      code: err.code || 'APPLICATION_ERROR'
    };
    return res.status(err.statusCode || 500).json(error);
  }

  // Send generic error response
  res.status(500).json(error);
};

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  AppError,
  asyncHandler
};
