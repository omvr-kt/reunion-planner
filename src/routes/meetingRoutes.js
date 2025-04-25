// src/routes/meetingRoutes.js (mise à jour)
const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const icsController = require('../controllers/icsController');
const authMiddleware = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/uploadMiddleware');

// Routes pour les organisateurs (protégées)
router.get('/create', authMiddleware.isAuthenticated, authMiddleware.isOrganizer, meetingController.getCreatePage);
router.post('/create', authMiddleware.isAuthenticated, authMiddleware.isOrganizer, meetingController.create);

router.get('/:id/edit', authMiddleware.isAuthenticated, meetingController.getEditPage);
router.post('/:id/update', authMiddleware.isAuthenticated, meetingController.update);
router.post('/:id/finalize', authMiddleware.isAuthenticated, authMiddleware.isOrganizer, meetingController.finalize);

// Routes pour tous les utilisateurs authentifiés
router.get('/:id', authMiddleware.isAuthenticated, meetingController.getDetails);

// Routes pour les participants externes (via token)
router.get('/respond/:token', meetingController.getResponsePage);
router.post('/respond/:token', meetingController.saveResponse);
router.post('/respond/:token/upload-ics', upload.single('ics_file'), icsController.analyzeIcsFile);

module.exports = router;