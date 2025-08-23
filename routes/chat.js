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

// Get conversations for current user
router.get('/conversations', ensureDbConnection, async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.session.user.id;
    const userType = req.session.user.userType;

    let conversations;
    if (userType === 'employer') {
      conversations = await db.all(`
        SELECT c.id, c.created_at, cv.unique_id
        FROM conversations c
        JOIN users u ON c.jobseeker_id = u.id
        JOIN cvs cv ON u.id = cv.user_id
        WHERE c.employer_id = ?
        ORDER BY c.created_at DESC
      `, [userId]);
    } else {
      conversations = await db.all(`
        SELECT c.id, c.created_at, u.full_name, u.email, u.company_name, u.designation
        FROM conversations c
        JOIN users u ON c.employer_id = u.id
        WHERE c.jobseeker_id = ?
        ORDER BY c.created_at DESC
      `, [userId]);
    }

    res.json({ conversations });
  } catch (error) {
    console.error('Conversations retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve conversations' });
  } finally {
    await db.disconnect();
  }
});

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', ensureDbConnection, async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { conversationId } = req.params;
    const userId = req.session.user.id;

    // Verify user is part of the conversation
    const conversation = await db.get(`
      SELECT id FROM conversations 
      WHERE id = ? AND (employer_id = ? OR jobseeker_id = ?)
    `, [conversationId, userId, userId]);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await db.all(`
      SELECT m.id, m.message, m.is_read, m.created_at, 
             CASE 
               WHEN m.sender_id = ? THEN 'sent'
               ELSE 'received'
             END as message_type
      FROM messages m
      WHERE m.sender_id IN (
        SELECT employer_id FROM conversations WHERE id = ?
        UNION
        SELECT jobseeker_id FROM conversations WHERE id = ?
      )
      AND m.receiver_id IN (
        SELECT employer_id FROM conversations WHERE id = ?
        UNION
        SELECT jobseeker_id FROM conversations WHERE id = ?
      )
      ORDER BY m.created_at ASC
    `, [userId, conversationId, conversationId, conversationId, conversationId]);

    res.json({ messages });
  } catch (error) {
    console.error('Messages retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  } finally {
    await db.disconnect();
  }
});

// Send message
router.post('/conversations/:conversationId/messages', ensureDbConnection, async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { conversationId } = req.params;
    const { message } = req.body;
    const senderId = req.session.user.id;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    // Verify user is part of the conversation
    const conversation = await db.get(`
      SELECT id, employer_id, jobseeker_id FROM conversations 
      WHERE id = ? AND (employer_id = ? OR jobseeker_id = ?)
    `, [conversationId, senderId, senderId]);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Determine receiver ID
    const receiverId = conversation.employer_id === senderId ? conversation.jobseeker_id : conversation.employer_id;

    // Insert message
    const result = await db.run(
      'INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)',
      [senderId, receiverId, message.trim()]
    );

    res.status(201).json({
      message: 'Message sent successfully',
      messageId: result.id
    });
  } catch (error) {
    console.error('Message sending error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  } finally {
    await db.disconnect();
  }
});

// Mark messages as read
router.put('/conversations/:conversationId/messages/read', ensureDbConnection, async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { conversationId } = req.params;
    const userId = req.session.user.id;

    // Verify user is part of the conversation
    const conversation = await db.get(`
      SELECT id FROM conversations 
      WHERE id = ? AND (employer_id = ? OR jobseeker_id = ?)
    `, [conversationId, userId, userId]);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Mark messages as read
    await db.run(`
      UPDATE messages 
      SET is_read = 1 
      WHERE receiver_id = ? AND is_read = 0
      AND sender_id IN (
        SELECT employer_id FROM conversations WHERE id = ?
        UNION
        SELECT jobseeker_id FROM conversations WHERE id = ?
      )
    `, [userId, conversationId, conversationId]);

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  } finally {
    await db.disconnect();
  }
});

// Get unread message count
router.get('/unread-count', ensureDbConnection, async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.session.user.id;

    const unreadCount = await db.get(
      'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0',
      [userId]
    );

    res.json({ unreadCount: unreadCount.count });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  } finally {
    await db.disconnect();
  }
});

module.exports = router; 