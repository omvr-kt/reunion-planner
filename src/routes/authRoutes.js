// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const csrfMiddleware = require('../middlewares/csrfMiddleware');

// Routes pour l'authentification
router.get('/login', authMiddleware.redirectIfAuthenticated, authController.getLoginPage);
router.post('/login', authMiddleware.redirectIfAuthenticated, csrfMiddleware.verify, authController.login);

router.get('/register', authMiddleware.redirectIfAuthenticated, authController.getRegisterPage);
router.post('/register', authMiddleware.redirectIfAuthenticated, csrfMiddleware.verify, authController.register);

router.get('/logout', authController.logout);

module.exports = router;