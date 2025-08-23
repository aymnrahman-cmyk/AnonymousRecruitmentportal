const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config({ path: '../env.local' });

const dbPath = process.env.DB_PATH || './database/recruitment.db';

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
const fs = require('fs');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

// Create tables
const createTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        user_type TEXT NOT NULL CHECK(user_type IN ('employer', 'jobseeker')),
        company_name TEXT,
        designation TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // CVs table
      db.run(`CREATE TABLE IF NOT EXISTS cvs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        unique_id TEXT UNIQUE NOT NULL,
        education TEXT,
        experience TEXT,
        skills TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`);

      // Jobs table
      db.run(`CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employer_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        responsibilities TEXT,
        requirements TEXT,
        salary TEXT,
        location TEXT,
        job_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employer_id) REFERENCES users (id)
      )`);

      // Applications table
      db.run(`CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL,
        jobseeker_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES jobs (id),
        FOREIGN KEY (jobseeker_id) REFERENCES users (id)
      )`);

      // CV Swipes table (for employers swiping jobseeker CVs)
      db.run(`CREATE TABLE IF NOT EXISTS cv_swipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employer_id INTEGER NOT NULL,
        cv_id INTEGER NOT NULL,
        swipe_direction TEXT NOT NULL CHECK(swipe_direction IN ('left', 'right')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employer_id) REFERENCES users (id),
        FOREIGN KEY (cv_id) REFERENCES cvs (id)
      )`);

      // Messages table
      db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users (id),
        FOREIGN KEY (receiver_id) REFERENCES users (id)
      )`);

      // Conversations table
      db.run(`CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employer_id INTEGER NOT NULL,
        jobseeker_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employer_id) REFERENCES users (id),
        FOREIGN KEY (jobseeker_id) REFERENCES users (id)
      )`);

      db.run("PRAGMA foreign_keys = ON", (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
};

// Initialize database
createTables()
  .then(() => {
    console.log('Database initialized successfully!');
    console.log('Tables created: users, cvs, jobs, applications, cv_swipes, messages, conversations');
    db.close();
  })
  .catch((err) => {
    console.error('Error initializing database:', err);
    db.close();
    process.exit(1);
  }); 