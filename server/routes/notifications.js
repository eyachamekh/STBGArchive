const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'stbg_secret_key';

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Notification auth error:', err);
    res.status(401).json({ message: 'Invalid token' });
  }
};

router.get('/', authenticate, (req, res) => {
  db.query(
    'SELECT id, type, title, message, meta, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id],
    (err, results) => {
      if (err) {
        console.error('Error fetching notifications:', err);
        return res.status(500).json({ error: err.message });
      }
      const notifications = results.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        msg: n.message,
        meta: n.meta ? JSON.parse(n.meta) : {},
        is_read: Boolean(n.is_read),
        time: n.created_at
      }));
      res.json(notifications);
    }
  );
});

router.put('/:id/read', authenticate, (req, res) => {
  const { id } = req.params;
  db.query(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [id, req.user.id],
    (err, result) => {
      if (err) {
        console.error('Error marking notification read:', err);
        return res.status(500).json({ error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      res.json({ message: 'Notification marked read' });
    }
  );
});

module.exports = router;
