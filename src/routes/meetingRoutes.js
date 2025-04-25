// src/routes/meetingRoutes.js
const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configuration de Multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/calendar' || path.extname(file.originalname) === '.ics') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers .ics sont acceptés'));
    }
  }
});

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
router.post('/respond/:token/upload-ics', upload.single('ics_file'), async (req, res) => {
    try {
      const token = req.params.token;
      const filePath = req.file.path;
      
      // Récupérer les informations du participant
      const participant = await meetingModel.findParticipantByToken(token);
      if (!participant) {
        return res.status(400).json({ error: 'Token invalide' });
      }
      
      // Analyser le fichier ICS
      const events = await icsService.parseIcsFile(filePath);
      
      // Récupérer les créneaux de la réunion
      const timeslots = await meetingModel.getTimeslots(participant.meeting_id);
      
      // Vérifier la disponibilité pour chaque créneau
      const availabilityResults = {};
      
      for (const timeslot of timeslots) {
        const isAvailable = icsService.checkAvailability(
          events,
          timeslot.start_time,
          timeslot.end_time
        );
        
        availabilityResults[`timeslot_${timeslot.id}`] = isAvailable ? 'yes' : 'no';
      }
      
      // Supprimer le fichier après analyse
      await fs.unlink(filePath);
      
      res.json({ success: true, availability: availabilityResults });
    } catch (error) {
      console.error('Erreur upload ICS:', error);
      res.status(500).json({ error: 'Erreur lors de l\'analyse du fichier ICS' });
    }
  });
  
  module.exports = router;