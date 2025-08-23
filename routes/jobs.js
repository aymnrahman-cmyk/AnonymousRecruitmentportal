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

// Create job (employer only)
router.post('/', ensureDbConnection, async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.session.user.userType !== 'employer') {
      return res.status(403).json({ error: 'Only employers can post jobs' });
    }

    const { title, responsibilities, requirements, salary, location, jobType } = req.body;
    const employerId = req.session.user.id;

    if (!title) {
      return res.status(400).json({ error: 'Job title is required' });
    }

    const result = await db.run(
      'INSERT INTO jobs (employer_id, title, responsibilities, requirements, salary, location, job_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [employerId, title, responsibilities, requirements, salary, location, jobType]
    );

    res.status(201).json({
      message: 'Job posted successfully',
      jobId: result.id
    });
  } catch (error) {
    console.error('Job creation error:', error);
    res.status(500).json({ error: 'Failed to post job' });
  } finally {
    await db.disconnect();
  }
});

// Get all jobs (for jobseekers)
router.get('/all', ensureDbConnection, async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.session.user.userType !== 'jobseeker') {
      return res.status(403).json({ error: 'Only jobseekers can browse jobs' });
    }

    const jobseekerId = req.session.user.id;

    // Get jobs that haven't been applied to by this jobseeker
    const jobs = await db.all(`
      SELECT j.id, j.title, j.responsibilities, j.requirements, j.salary, j.location, j.job_type, j.created_at
      FROM jobs j
      WHERE j.id NOT IN (
        SELECT job_id FROM applications WHERE jobseeker_id = ?
      )
      ORDER BY j.created_at DESC
    `, [jobseekerId]);

    res.json({ jobs });
  } catch (error) {
    console.error('Jobs retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve jobs' });
  } finally {
    await db.disconnect();
  }
});

// Get jobs posted by employer
router.get('/my-jobs', ensureDbConnection, async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.session.user.userType !== 'employer') {
      return res.status(403).json({ error: 'Only employers can view their jobs' });
    }

    const jobs = await db.all(
      'SELECT id, title, responsibilities, requirements, salary, location, job_type, created_at FROM jobs WHERE employer_id = ? ORDER BY created_at DESC',
      [req.session.user.id]
    );

    res.json({ jobs });
  } catch (error) {
    console.error('My jobs retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve jobs' });
  } finally {
    await db.disconnect();
  }
});

// Apply to job (jobseeker only)
router.post('/apply', ensureDbConnection, async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.session.user.userType !== 'jobseeker') {
      return res.status(403).json({ error: 'Only jobseekers can apply to jobs' });
    }

    const { jobId } = req.body;
    const jobseekerId = req.session.user.id;

    // Check if job exists
    const job = await db.get('SELECT id, employer_id FROM jobs WHERE id = ?', [jobId]);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if already applied
    const existingApplication = await db.get(
      'SELECT id FROM applications WHERE jobseeker_id = ? AND job_id = ?',
      [jobseekerId, jobId]
    );

    if (existingApplication) {
      return res.status(400).json({ error: 'Already applied to this job' });
    }

    // Create application
    await db.run(
      'INSERT INTO applications (jobseeker_id, job_id) VALUES (?, ?)',
      [jobseekerId, jobId]
    );

    // Create conversation
    await db.run(
      'INSERT INTO conversations (employer_id, jobseeker_id) VALUES (?, ?)',
      [job.employer_id, jobseekerId]
    );

    res.json({ message: 'Application submitted successfully' });
  } catch (error) {
    console.error('Job application error:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  } finally {
    await db.disconnect();
  }
});

// Get applications for a job (employer only)
router.get('/:jobId/applications', ensureDbConnection, async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.session.user.userType !== 'employer') {
      return res.status(403).json({ error: 'Only employers can view applications' });
    }

    const { jobId } = req.params;
    const employerId = req.session.user.id;

    // Verify job belongs to employer
    const job = await db.get('SELECT id FROM jobs WHERE id = ? AND employer_id = ?', [jobId, employerId]);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const applications = await db.all(`
      SELECT a.id, a.status, a.created_at, c.unique_id, c.education, c.experience, c.skills
      FROM applications a
      JOIN cvs c ON a.jobseeker_id = c.user_id
      WHERE a.job_id = ?
      ORDER BY a.created_at DESC
    `, [jobId]);

    res.json({ applications });
  } catch (error) {
    console.error('Applications retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve applications' });
  } finally {
    await db.disconnect();
  }
});

// Update application status (employer only)
router.put('/applications/:applicationId', ensureDbConnection, async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.session.user.userType !== 'employer') {
      return res.status(403).json({ error: 'Only employers can update application status' });
    }

    const { applicationId } = req.params;
    const { status } = req.body;
    const employerId = req.session.user.id;

    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Verify application belongs to employer's job
    const application = await db.get(`
      SELECT a.id FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE a.id = ? AND j.employer_id = ?
    `, [applicationId, employerId]);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    await db.run(
      'UPDATE applications SET status = ? WHERE id = ?',
      [status, applicationId]
    );

    res.json({ message: 'Application status updated successfully' });
  } catch (error) {
    console.error('Application update error:', error);
    res.status(500).json({ error: 'Failed to update application status' });
  } finally {
    await db.disconnect();
  }
});

module.exports = router; 