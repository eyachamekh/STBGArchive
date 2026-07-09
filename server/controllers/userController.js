const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { validatePassword } = require('../utils/passwordValidator');

const SECRET = process.env.JWT_SECRET || "stbg_secret_key";

// CREATE USER (admin only)
exports.createUser = async (req, res) => {
  const { username, full_name, service_code, role, password } = req.body;
  if (!username || !full_name || !service_code || !role || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const validation = validatePassword(password);
  if (!validation.isValid) {
    return res.status(400).json({ message: validation.message });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    db.query(
      'INSERT INTO users (username, full_name, service_code, role, password, must_change_password) VALUES (?,?,?,?,?,1)',
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
    'SELECT username FROM users ORDER BY username',
    (err, results) => {
      if (err) {
        console.error('Error fetching public users:', err);
        return res.status(500).json({ error: err.message });
      }
      const users = results.map(u => ({
        username: u.username
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

  const validation = validatePassword(newPassword);
  if (!validation.isValid) {
    console.log('Password validation failed:', validation.message);
    return res.status(400).json({ message: validation.message });
  }

  try {
    const hash = await bcrypt.hash(newPassword, 10);
    console.log('Password hashed successfully');
    console.log('Updating user ID in database:', id);

    db.query('UPDATE users SET password = ?, must_change_password = 1 WHERE id = ?', [hash, id], (err, result) => {
      if (err) {
        console.error('Database error updating password:', err);
        return res.status(500).json({ error: err.message });
      }
      if (result.affectedRows === 0) {
        console.log('No user found with ID:', id);
        return res.status(404).json({ message: 'User not found' });
      }
      console.log('Password updated successfully for user ID:', id);

      db.query(
        'INSERT INTO notifications (user_id, type, title, message, meta) VALUES (?, ?, ?, ?, ?)',
        [id, 'info', 'Réinitialisation de mot de passe', 'Votre mot de passe a été réinitialisé par l’administrateur. Veuillez le modifier à votre prochaine connexion.', JSON.stringify({ action: 'password-reset' })],
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

// CHANGE OWN PASSWORD
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'L\'ancien et le nouveau mot de passe sont requis.' });
  }

  const validation = validatePassword(newPassword);
  if (!validation.isValid) {
    return res.status(400).json({ message: validation.message });
  }

  // Get current user's password hash from database
  db.query('SELECT password FROM users WHERE id = ?', [userId], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

    const user = results[0];
    try {
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) {
        return res.status(400).json({ message: 'L\'ancien mot de passe est incorrect.' });
      }

      const hash = await bcrypt.hash(newPassword, 10);
      db.query(
        'UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?',
        [hash, userId],
        (updateErr) => {
          if (updateErr) return res.status(500).json({ error: updateErr.message });

          // Generate new token without mustChangePassword constraint
          const token = jwt.sign(
            { id: req.user.id, username: req.user.username, role: req.user.role, mustChangePassword: false },
            SECRET,
            { expiresIn: '7d' }
          );

          res.json({ message: 'Mot de passe changé avec succès.', token });
        }
      );
    } catch (processErr) {
      console.error('Error changing password:', processErr);
      return res.status(500).json({ error: 'Erreur lors du traitement du mot de passe.' });
    }
  });
};
