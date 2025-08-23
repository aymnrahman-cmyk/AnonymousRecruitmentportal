const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Database = require('../utils/database');

const router = express.Router();
const db = new Database();

// Middleware to ensure database connection
const ensureDbConnection = async (req, res, next) => {
  try {
    await db.connect();
    next();
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
};

// Create CV
router.post('/', ensureDbConnection, async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.session.user.userType !== 'jobseeker') {
      return res.status(403).json({ error: 'Only jobseekers can create CVs' });
    }

    const { education, experience, skills } = req.body;
    const userId = req.session.user.id;
    const uniqueId = uuidv4();

    // Check if user already has a CV
    const existingCV = await db.get('SELECT id FROM cvs WHERE user_id = ?', [userId]);
    if (existingCV) {
      return res.status(400).json({ error: 'CV already exists for this user' });
    }

    // Create CV
    const result = await db.run(
      'INSERT INTO cvs (user_id, unique_id, education, experience, skills) VALUES (?, ?, ?, ?, ?)',
      [userId, uniqueId, education, experience, skills]
    );

    res.status(201).json({
      message: 'CV created successfully',
      cvId: result.id,
      uniqueId
    });
  } catch (error) {
    console.error('CV creation error:', error);
    res.status(500).json({ error: 'Failed to create CV' });
  } finally {
    await db.disconnect();
  }
});

// Get CV by user
router.get('/my-cv', ensureDbConnection, async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.session.user.userType !== 'jobseeker') {
      return res.status(403).json({ error: 'Only jobseekers can view their CV' });
    }

    const cv = await db.get(
      'SELECT id, unique_id, education, experience, skills, created_at, updated_at FROM cvs WHERE user_id = ?',
      [req.session.user.id]
    );

    if (!cv) {
      return res.status(404).json({ error: 'CV not found' });
    }

    res.json({ cv });
  } catch (error) {
    console.error('CV retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve CV' });
  } finally {
    await db.disconnect();
  }
});

// Update CV
router.put('/my-cv', ensureDbConnection, async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.session.user.userType !== 'jobseeker') {
      return res.status(403).json({ error: 'Only jobseekers can update their CV' });
    }

    const { education, experience, skills } = req.body;
    const userId = req.session.user.id;

    // Check if CV exists
    const existingCV = await db.get('SELECT id FROM cvs WHERE user_id = ?', [userId]);
    if (!existingCV) {
      return res.status(404).json({ error: 'CV not found' });
    }

    // Update CV
    await db.run(
      'UPDATE cvs SET education = ?, experience = ?, skills = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [education, experience, skills, userId]
    );

    res.json({ message: 'CV updated successfully' });
  } catch (error) {
    console.error('CV update error:', error);
    res.status(500).json({ error: 'Failed to update CV' });
  } finally {
    await db.disconnect();
  }
});

// Get all CVs for employers (anonymous)
router.get('/all', ensureDbConnection, async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.session.user.userType !== 'employer') {
      return res.status(403).json({ error: 'Only employers can view CVs' });
    }

    const employerId = req.session.user.id;

    // Get CVs that haven't been swiped by this employer
    const cvs = await db.all(`
      SELECT c.id, c.unique_id, c.education, c.experience, c.skills, c.created_at
      FROM cvs c
      WHERE c.id NOT IN (
        SELECT cv_id FROM cv_swipes WHERE employer_id = ?
      )
      ORDER BY c.created_at DESC
    `, [employerId]);

    res.json({ cvs });
  } catch (error) {
    console.error('CVs retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve CVs' });
  } finally {
    await db.disconnect();
  }
});

// Swipe CV (right or left)
router.post('/swipe', ensureDbConnection, async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.session.user.userType !== 'employer') {
      return res.status(403).json({ error: 'Only employers can swipe CVs' });
    }

    const { cvId, direction } = req.body;
    const employerId = req.session.user.id;

    if (!['left', 'right'].includes(direction)) {
      return res.status(400).json({ error: 'Invalid swipe direction' });
    }

    // Check if CV exists
    const cv = await db.get('SELECT id, user_id FROM cvs WHERE id = ?', [cvId]);
    if (!cv) {
      return res.status(404).json({ error: 'CV not found' });
    }

    // Check if already swiped
    const existingSwipe = await db.get(
      'SELECT id FROM cv_swipes WHERE employer_id = ? AND cv_id = ?',
      [employerId, cvId]
    );

    if (existingSwipe) {
      return res.status(400).json({ error: 'CV already swiped' });
    }

    // Record swipe
    await db.run(
      'INSERT INTO cv_swipes (employer_id, cv_id, swipe_direction) VALUES (?, ?, ?)',
      [employerId, cvId, direction]
    );

    // If swiped right, create conversation
    if (direction === 'right') {
      await db.run(
        'INSERT INTO conversations (employer_id, jobseeker_id) VALUES (?, ?)',
        [employerId, cv.user_id]
      );
    }

    res.json({ 
      message: 'Swipe recorded successfully',
      direction,
      match: direction === 'right'
    });
  } catch (error) {
    console.error('Swipe error:', error);
    res.status(500).json({ error: 'Failed to record swipe' });
  } finally {
    await db.disconnect();
  }
});

module.exports = router; 