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

// Get employer dashboard data
router.get('/dashboard', ensureDbConnection, async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.session.user.userType !== 'employer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const employerId = req.session.user.id;

    // Get job statistics
    const jobStats = await db.get(`
      SELECT 
        COUNT(*) as totalJobs,
        COUNT(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 END) as jobsThisWeek
      FROM jobs 
      WHERE employer_id = ?
    `, [employerId]);

    // Get application statistics
    const applicationStats = await db.get(`
      SELECT 
        COUNT(*) as totalApplications,
        COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as pendingApplications,
        COUNT(CASE WHEN a.status = 'accepted' THEN 1 END) as acceptedApplications,
        COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) as rejectedApplications
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE j.employer_id = ?
    `, [employerId]);

    // Get recent conversations
    const recentConversations = await db.all(`
      SELECT c.id, c.created_at, cv.unique_id
      FROM conversations c
      JOIN users u ON c.jobseeker_id = u.id
      JOIN cvs cv ON u.id = cv.user_id
      WHERE c.employer_id = ?
      ORDER BY c.created_at DESC
      LIMIT 5
    `, [employerId]);

    res.json({
      jobStats,
      applicationStats,
      recentConversations
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  } finally {
    await db.disconnect();
  }
});

// Get employer profile
router.get('/profile', ensureDbConnection, async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.session.user.userType !== 'employer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await db.get(
      'SELECT id, email, full_name, company_name, designation, created_at FROM users WHERE id = ?',
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

// Update employer profile
router.put('/profile', ensureDbConnection, async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.session.user.userType !== 'employer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { fullName, companyName, designation } = req.body;
    const userId = req.session.user.id;

    await db.run(
      'UPDATE users SET full_name = ?, company_name = ?, designation = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [fullName, companyName, designation, userId]
    );

    // Update session
    req.session.user.fullName = fullName;
    req.session.user.companyName = companyName;
    req.session.user.designation = designation;

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  } finally {
    await db.disconnect();
  }
});

module.exports = router; 