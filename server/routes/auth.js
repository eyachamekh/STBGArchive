const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// LOGIN
router.post('/login', authController.login);

// GET CURRENT USER INFO
router.get('/me', authController.getMe);

module.exports = router;