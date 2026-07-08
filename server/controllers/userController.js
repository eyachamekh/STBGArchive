const bcrypt = require('bcrypt');
const db = require('../db');

// CREATE USER (admin only)
exports.createUser = async (req, res) => {
  const { username, full_name, service_code, role, password } = req.body;
  if (!username || !full_name || !service_code || !role || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    db.query(
      'INSERT INTO users (username, full_name, service_code, role, password) VALUES (?,?,?,?,?)',
      [username, full_name, service_code, role, hash],
      (err, result) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Username already exists' });
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'User created', id: result.insertId });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// DELETE USER (admin only)
exports.deleteUser = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM users WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  });
};

// GET ALL USERS (public - for login dropdown)
exports.getPublicUsers = (req, res) => {
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
};

// GET ALL USERS (admin or archiviste)
exports.getAllUsers = (req, res) => {
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
};

// RESET USER PASSWORD
exports.resetPassword = async (req, res) => {
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
};
