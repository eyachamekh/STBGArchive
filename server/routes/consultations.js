const express = require('express');
const jwt = require('jsonwebtoken');
const consultationController = require('../controllers/consultationController');

const router = express.Router();
const SECRET = process.env.JWT_SECRET;
if (!SECRET) { throw new Error('JWT_SECRET manquant : arrêt du serveur'); }

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Consultation auth error:', err);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// GET ALL CONSULTATIONS
router.get('/', authenticate, consultationController.getConsultations);

// CREATE NEW CONSULTATION
router.post('/', authenticate, consultationController.createConsultation);

// UPDATE CONSULTATION STATUS
router.put('/:id/status', authenticate, consultationController.updateConsultationStatus);

module.exports = router;
