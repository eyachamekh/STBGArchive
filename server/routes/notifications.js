const express = require('express');
const jwt = require('jsonwebtoken');
const notificationController = require('../controllers/notificationController');

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

// GET ALL NOTIFICATIONS
router.get('/', authenticate, notificationController.getNotifications);

// MARK NOTIFICATION AS READ
router.put('/:id/read', authenticate, notificationController.markAsRead);

module.exports = router;
