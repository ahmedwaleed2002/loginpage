const { db } = require('../config/firebase');

class Note {
  constructor(noteData) {
    this.id = noteData.id;
    this.title = noteData.title;
    this.content = noteData.content;
    this.userId = noteData.userId;
    this.createdAt = noteData.createdAt || new Date();
    this.updatedAt = noteData.updatedAt || new Date();
    this.tags = noteData.tags || [];
    this.isPublic = noteData.isPublic || false;
  }

  // Create a new note
  static async create(noteData) {
    try {
      const noteRef = db.collection('notes').doc();
      
      const newNote = new Note({
        id: noteRef.id,
        ...noteData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Clean note data to remove undefined values
      const cleanNoteData = {
        title: newNote.title,
        content: newNote.content,
        userId: newNote.userId,
        createdAt: newNote.createdAt,
        updatedAt: newNote.updatedAt,
        tags: newNote.tags || [],
        isPublic: newNote.isPublic || false
      };

      await noteRef.set(cleanNoteData);

      return newNote;
    } catch (error) {
      throw new Error(`Error creating note: ${error.message}`);
    }
  }

  // Find note by ID
  static async findById(id) {
    try {
      const noteDoc = await db.collection('notes').doc(id).get();
      if (noteDoc.exists) {
        return new Note({ id: noteDoc.id, ...noteDoc.data() });
      }
      return null;
    } catch (error) {
      throw new Error(`Error finding note by ID: ${error.message}`);
    }
  }

  // Find notes by user ID
  static async findByUserId(userId, options = {}) {
    try {
      const { page = 1, limit: pageLimit = 10 } = options;
      
      let noteQuery = db.collection('notes')
        .where('userId', '==', userId)
        .limit(pageLimit);

      // For pagination (simplified for now)
      if (page > 1) {
        const offset = (page - 1) * pageLimit;
        const offsetQuery = db.collection('notes')
          .where('userId', '==', userId)
          .limit(offset);
        const offsetSnapshot = await offsetQuery.get();
        if (!offsetSnapshot.empty) {
          const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
          noteQuery = db.collection('notes')
            .where('userId', '==', userId)
            .startAfter(lastDoc)
            .limit(pageLimit);
        }
      }

      const querySnapshot = await noteQuery.get();
      const notes = [];
      
      querySnapshot.forEach((doc) => {
        notes.push(new Note({ id: doc.id, ...doc.data() }));
      });

      return notes;
    } catch (error) {
      throw new Error(`Error finding notes by user ID: ${error.message}`);
    }
  }

  // Search notes by title or content
  static async search(userId, searchTerm, options = {}) {
    try {
      const { limit: pageLimit = 10 } = options;
      
      // Note: Firestore doesn't have full-text search, so we'll get all user notes
      // and filter them. For production, consider using Algolia or Elasticsearch
      const userNotes = await Note.findByUserId(userId, { limit: 100 });
      
      const searchResults = userNotes.filter(note => 
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return searchResults.slice(0, pageLimit);
    } catch (error) {
      throw new Error(`Error searching notes: ${error.message}`);
    }
  }

  // Update note
  async update(updateData) {
    try {
      const noteRef = db.collection('notes').doc(this.id);
      
      // Clean the update data to remove undefined values
      const cleanUpdateData = { updatedAt: new Date() };
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          cleanUpdateData[key] = updateData[key];
        }
      });

      await noteRef.update(cleanUpdateData);
      
      // Update current instance
      Object.assign(this, cleanUpdateData);
      
      return this;
    } catch (error) {
      throw new Error(`Error updating note: ${error.message}`);
    }
  }

  // Delete note
  async delete() {
    try {
      await db.collection('notes').doc(this.id).delete();
      return true;
    } catch (error) {
      throw new Error(`Error deleting note: ${error.message}`);
    }
  }

  // Get note statistics for a user
  static async getStats(userId) {
    try {
      const userNotes = await Note.findByUserId(userId, { limit: 1000 });
      
      const stats = {
        totalNotes: userNotes.length,
        publicNotes: userNotes.filter(note => note.isPublic).length,
        privateNotes: userNotes.filter(note => !note.isPublic).length,
        totalCharacters: userNotes.reduce((sum, note) => sum + note.content.length, 0),
        totalWords: userNotes.reduce((sum, note) => sum + note.content.split(/\s+/).length, 0),
        recentNotes: userNotes.slice(0, 5)
      };

      return stats;
    } catch (error) {
      throw new Error(`Error getting note statistics: ${error.message}`);
    }
  }

  // Get public representation of note
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      userId: this.userId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      tags: this.tags,
      isPublic: this.isPublic
    };
  }
}

module.exports = Note;
