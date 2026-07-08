const express = require('express');
const jwt = require('jsonwebtoken');
const userController = require('../controllers/userController');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'stbg_secret_key';

const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const authenticatePrivileged = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, SECRET);
    if (decoded.role !== 'admin' && decoded.role !== 'archiviste') return res.status(403).json({ message: 'Access denied' });
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// CREATE USER (admin only)
router.post('/', authenticateAdmin, userController.createUser);

// DELETE USER (admin only)
router.delete('/:id', authenticateAdmin, userController.deleteUser);

// GET ALL USERS (public - for login dropdown)
router.get('/public', userController.getPublicUsers);

// GET ALL USERS (admin or archiviste)
router.get('/', authenticatePrivileged, userController.getAllUsers);

// RESET USER PASSWORD
router.put('/:id/reset', authenticateAdmin, userController.resetPassword);

module.exports = router;