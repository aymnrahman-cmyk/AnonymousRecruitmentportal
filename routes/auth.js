const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

// Register new user
router.post('/register', ensureDbConnection, async (req, res) => {
  try {
    const { email, password, fullName, userType, companyName, designation } = req.body;

    // Validate required fields
    if (!email || !password || !fullName || !userType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['employer', 'jobseeker'].includes(userType)) {
      return res.status(400).json({ error: 'Invalid user type' });
    }

    // Check if user already exists
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await db.run(
      'INSERT INTO users (email, password, full_name, user_type, company_name, designation) VALUES (?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, fullName, userType, companyName || null, designation || null]
    );

    res.status(201).json({
      message: 'User registered successfully',
      userId: result.id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  } finally {
    await db.disconnect();
  }
});

// Login user
router.post('/login', ensureDbConnection, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await db.get(
      'SELECT id, email, password, full_name, user_type, company_name, designation FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        userType: user.user_type 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Store user info in session
    req.session.user = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      userType: user.user_type,
      companyName: user.company_name,
      designation: user.designation
    };

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        userType: user.user_type,
        companyName: user.company_name,
        designation: user.designation
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  } finally {
    await db.disconnect();
  }
});

// Logout user
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Get current user
router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user: req.session.user });
});

module.exports = router; 