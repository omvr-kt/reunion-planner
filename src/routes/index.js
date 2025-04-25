// src/routes/index.js
const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const meetingRoutes = require('./meetingRoutes');

// Route d'accueil
router.get('/', (req, res) => {
  res.render('pages/home', { title: 'Accueil - Plateforme de Réunions' });
});

// Regroupement des routes
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/meetings', meetingRoutes);

module.exports = router;