const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'stbg_secret_key';

const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    console.error('User auth error:', err);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// CREATE USER
router.post('/', async (req, res) => {
  const { username, full_name, service_code, role, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  db.query(
    'INSERT INTO users (username, full_name, service_code, role, password) VALUES (?,?,?,?,?)',
    [username, full_name, service_code, role, hash],
    (err) => {
      if (err) return res.json(err);
      res.json({ message: "User created" });
    }
  );
});

// GET ALL USERS (public - for login dropdown)
router.get('/public', (req, res) => {
  db.query(
    'SELECT u.id, u.username, u.full_name, s.service_name, u.service_code, u.role FROM users u LEFT JOIN services s ON u.service_code = s.code ORDER BY u.full_name',
    (err, results) => {
      if (err) {
        console.error('Error fetching public users:', err);
        return res.status(500).json({ error: err.message });
      }
      const users = results.map(u => ({
        id: u.id,
        username: u.username,
        name: u.full_name,
        svc: u.service_name,
        code: u.service_code,
        role: u.role
      }));
      res.json(users);
    }
  );
});

// GET ALL USERS (admin only)
router.get('/', authenticateAdmin, (req, res) => {
  db.query(
    'SELECT id, username, full_name, service_code, role FROM users ORDER BY full_name',
    (err, results) => {
      if (err) {
        console.error('Error fetching users:', err);
        return res.status(500).json({ error: err.message });
      }
      const users = results.map(u => ({
        id: u.id,
        username: u.username,
        name: u.full_name,
        code: u.service_code,
        role: u.role,
        pass: '••••••••'
      }));
      res.json(users);
    }
  );
});

// RESET USER PASSWORD
router.put('/:id/reset', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  console.log('=== PASSWORD RESET REQUEST ===');
  console.log('User ID from params:', id);
  console.log('New password provided:', !!newPassword);
  console.log('New password length:', newPassword ? newPassword.length : 0);

  if (!newPassword || newPassword.length < 4) {
    console.log('Password validation failed');
    return res.status(400).json({ message: 'New password is required and must be at least 4 characters long' });
  }

  try {
    const hash = await bcrypt.hash(newPassword, 10);
    console.log('Password hashed successfully');
    console.log('Updating user ID in database:', id);

    db.query('UPDATE users SET password = ? WHERE id = ?', [hash, id], (err, result) => {
      if (err) {
        console.error('Database error updating password:', err);
        return res.status(500).json({ error: err.message });
      }
      console.log('Database update result:', result);
      console.log('Affected rows:', result.affectedRows);
      if (result.affectedRows === 0) {
        console.log('No user found with ID:', id);
        return res.status(404).json({ message: 'User not found' });
      }
      console.log('Password updated successfully for user ID:', id);

    db.query(
      'INSERT INTO notifications (user_id, type, title, message, meta) VALUES (?, ?, ?, ?, ?)',
      [id, 'info', 'Réinitialisation de mot de passe', 'Votre mot de passe a été réinitialisé par l’administrateur.', JSON.stringify({ action: 'password-reset' })],
      (notifErr) => {
        if (notifErr) {
          console.error('Error creating password reset notification:', notifErr);
        }
        res.json({ message: 'Password reset successfully' });
      }
    );
  });
  } catch (hashErr) {
    console.error('Error hashing password:', hashErr);
    return res.status(500).json({ error: 'Failed to process password' });
  }
});

module.exports = router;