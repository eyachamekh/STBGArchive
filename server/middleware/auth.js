const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;
if (!SECRET) { throw new Error('JWT_SECRET manquant : arrêt du serveur'); }
module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Non authentifié' });
  }
  
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Jeton invalide' });
  }
};
