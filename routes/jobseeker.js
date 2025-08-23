const express = require('express');
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

// Get jobseeker dashboard data
router.get('/dashboard', ensureDbConnection, async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.session.user.userType !== 'jobseeker') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const jobseekerId = req.session.user.id;

    // Get application statistics
    const applicationStats = await db.get(`
      SELECT 
        COUNT(*) as totalApplications,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingApplications,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as acceptedApplications,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejectedApplications
      FROM applications 
      WHERE jobseeker_id = ?
    `, [jobseekerId]);

    // Get recent applications
    const recentApplications = await db.all(`
      SELECT a.id, a.status, a.created_at, j.title, j.location, j.job_type
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE a.jobseeker_id = ?
      ORDER BY a.created_at DESC
      LIMIT 5
    `, [jobseekerId]);

    // Get recent conversations
    const recentConversations = await db.all(`
      SELECT c.id, c.created_at, u.full_name, u.company_name, u.designation
      FROM conversations c
      JOIN users u ON c.employer_id = u.id
      WHERE c.jobseeker_id = ?
      ORDER BY c.created_at DESC
      LIMIT 5
    `, [jobseekerId]);

    res.json({
      applicationStats,
      recentApplications,
      recentConversations
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  } finally {
    await db.disconnect();
  }
});

// Get jobseeker profile
router.get('/profile', ensureDbConnection, async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.session.user.userType !== 'jobseeker') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await db.get(
      'SELECT id, email, full_name, created_at FROM users WHERE id = ?',
      [req.session.user.id]
    );

    res.json({ user });
  } catch (error) {
    console.error('Profile retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  } finally {
    await db.disconnect();
  }
});

// Update jobseeker profile
router.put('/profile', ensureDbConnection, async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.session.user.userType !== 'jobseeker') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { fullName } = req.body;
    const userId = req.session.user.id;

    await db.run(
      'UPDATE users SET full_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [fullName, userId]
    );

    // Update session
    req.session.user.fullName = fullName;

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  } finally {
    await db.disconnect();
  }
});

// Get jobseeker's applications
router.get('/applications', ensureDbConnection, async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.session.user.userType !== 'jobseeker') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const applications = await db.all(`
      SELECT a.id, a.status, a.created_at, j.title, j.location, j.job_type, j.salary
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE a.jobseeker_id = ?
      ORDER BY a.created_at DESC
    `, [req.session.user.id]);

    res.json({ applications });
  } catch (error) {
    console.error('Applications retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve applications' });
  } finally {
    await db.disconnect();
  }
});

module.exports = router; 