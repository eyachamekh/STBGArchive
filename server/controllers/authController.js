const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const SECRET = process.env.JWT_SECRET || "stbg_secret_key";

// LOGIN
exports.login = (req, res) => {
  const { username, password } = req.body;

  db.query(
    'SELECT u.*, s.service_name FROM users u LEFT JOIN services s ON u.service_code = s.code WHERE u.username = ?',
    [username],
    async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (results.length === 0) {
        return res.status(401).json({ message: "User not found" });
      }

      const user = results[0];

      try {
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
          return res.status(401).json({ message: "Wrong password" });
        }

        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role },
          SECRET,
          { expiresIn: '7d' }
        );

        const userInfo = {
          id: user.id,
          username: user.username,
          name: user.full_name,
          svc: user.service_name,
          code: user.service_code,
          role: user.role
        };

        res.json({ token, user: userInfo });
      } catch (err) {
        console.error('Authentication error:', err);
        res.status(500).json({ error: 'Authentication failed' });
      }
    }
  );
};

// GET CURRENT USER INFO
exports.getMe = (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    
    db.query(
      'SELECT u.*, s.service_name FROM users u LEFT JOIN services s ON u.service_code = s.code WHERE u.id = ?',
      [decoded.id],
      (err, results) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (results.length === 0) {
          return res.status(404).json({ message: "User not found" });
        }

        const user = results[0];
        const userInfo = {
          id: user.id,
          username: user.username,
          name: user.full_name,
          svc: user.service_name,
          code: user.service_code,
          role: user.role
        };

        res.json(userInfo);
      }
    );
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(401).json({ message: "Invalid token" });
  }
};
