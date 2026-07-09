const jwt = require('jsonwebtoken');
const db = require('../db');
const SECRET = process.env.JWT_SECRET;
if (!SECRET) { throw new Error('JWT_SECRET manquant : arrêt du serveur'); }

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Non authentifié' });
  }
  
  try {
    const decoded = jwt.verify(token, SECRET);
    
    // Query database to check latest must_change_password status
    db.query('SELECT must_change_password FROM users WHERE id = ?', [decoded.id], (dbErr, results) => {
      if (dbErr) {
        return res.status(500).json({ error: dbErr.message });
      }
      if (results.length === 0) {
        return res.status(401).json({ message: 'Utilisateur non trouvé' });
      }
      
      const mustChange = !!results[0].must_change_password;
      
      // If user must change password, restrict access to all routes except change-password
      if (mustChange && !req.originalUrl.includes('/change-password')) {
        return res.status(403).json({ message: 'Changement de mot de passe requis', mustChangePassword: true });
      }
      
      req.user = decoded;
      req.user.mustChangePassword = mustChange;
      next();
    });
  } catch (err) {
    return res.status(401).json({ message: 'Jeton invalide' });
  }
};
