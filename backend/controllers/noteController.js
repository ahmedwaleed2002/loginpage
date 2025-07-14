const Note = require('../models/Note');
const ActivityLog = require('../models/ActivityLog');
const { marked } = require('marked');
const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Create a new note
const createNote = async (req, res) => {
  try {
    const { title, content, tags = [], isPublic = false } = req.body;
    const userId = req.user.id;

    const newNote = await Note.create({
      title,
      content,
      userId,
      tags,
      isPublic
    });

    // Log the activity
    await ActivityLog.logNoteCreate(userId, newNote.id, req.ip, req.headers['user-agent']);

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      code: 'NOTE_CREATED',
      data: newNote
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during note creation',
      code: 'NOTE_CREATION_ERROR'
    });
  }
};

// Get all notes by user
const getNotesByUser = async (req, res) => {
  try {
    const notes = await Note.findByUserId(req.user.id, req.query);

    res.json({
      success: true,
      message: 'Notes retrieved successfully',
      code: 'NOTES_RETRIEVED',
      data: notes
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'GET_NOTES_ERROR'
    });
  }
};

// Get a single note
const getNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
        code: 'NOTE_NOT_FOUND'
      });
    }

    // Log the view activity
    if (note.userId === req.user.id || note.isPublic) {
      await ActivityLog.logNoteView(req.user.id, note.id, req.ip, req.headers['user-agent']);
    }

    res.json({
      success: true,
      message: 'Note retrieved successfully',
      code: 'NOTE_RETRIEVED',
      data: note
    });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'GET_NOTE_ERROR'
    });
  }
};

// Update a note
const updateNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
        code: 'NOTE_NOT_FOUND'
      });
    }

    if (note.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this note',
        code: 'UNAUTHORIZED_UPDATE'
      });
    }

    const updatedNote = await note.update(req.body);

    // Log the update activity
    await ActivityLog.logNoteUpdate(req.user.id, note.id, req.ip, req.headers['user-agent']);

    res.json({
      success: true,
      message: 'Note updated successfully',
      code: 'NOTE_UPDATED',
      data: updatedNote
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'UPDATE_NOTE_ERROR'
    });
  }
};

// Delete a note
const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
        code: 'NOTE_NOT_FOUND'
      });
    }

    if (note.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this note',
        code: 'UNAUTHORIZED_DELETE'
      });
    }

    await note.delete();

    // Log the delete activity
    await ActivityLog.logNoteDelete(req.user.id, note.id, req.ip, req.headers['user-agent']);

    res.json({
      success: true,
      message: 'Note deleted successfully',
      code: 'NOTE_DELETED'
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'DELETE_NOTE_ERROR'
    });
  }
};

// Render note content to HTML
const renderNoteContent = async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
        code: 'NOTE_NOT_FOUND'
      });
    }

    const htmlContent = purify.sanitize(marked(note.content));

    res.json({
      success: true,
      message: 'Note rendered successfully',
      code: 'NOTE_RENDERED',
      data: {
        htmlContent
      }
    });
  } catch (error) {
    console.error('Render note error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'RENDER_NOTE_ERROR'
    });
  }
};

module.exports = {
  createNote,
  getNotesByUser,
  getNote,
  updateNote,
  deleteNote,
  renderNoteContent
};

