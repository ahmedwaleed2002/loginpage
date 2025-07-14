const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// Import controllers
const {
  createNote,
  getNotesByUser,
  getNote,
  updateNote,
  deleteNote,
  renderNoteContent
} = require('../controllers/noteController');

// Import middleware
const { verifyToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

// Validation middleware for notes
const validateNote = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 1, max: 50000 })
    .withMessage('Content must be between 1 and 50,000 characters'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean value'),
  
  handleValidationErrors
];

const validateNoteUpdate = [
  body('title')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('content')
    .optional()
    .isLength({ min: 1, max: 50000 })
    .withMessage('Content must be between 1 and 50,000 characters'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean value'),
  
  handleValidationErrors
];

// All note routes require authentication
router.use(verifyToken);

// Note CRUD routes
router.post('/', validateNote, createNote);
router.get('/', getNotesByUser);
router.get('/:noteId', getNote);
router.put('/:noteId', validateNoteUpdate, updateNote);
router.delete('/:noteId', deleteNote);

// Note rendering route
router.get('/:noteId/render', renderNoteContent);

module.exports = router;
