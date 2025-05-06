// src/routes/index.js
const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const meetingRoutes = require('./meetingRoutes');

router.get('/', (req, res) => {
  res.render('pages/home', { title: 'Accueil - Reunion Planner' });
});

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/meetings', meetingRoutes);

module.exports = router;