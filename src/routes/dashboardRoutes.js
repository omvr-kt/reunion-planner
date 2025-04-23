// src/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');

// Routes pour le tableau de bord (protégées par l'authentification)
router.get('/', authMiddleware.isAuthenticated, dashboardController.getDashboard);

module.exports = router;