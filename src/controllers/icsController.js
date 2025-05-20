// src/controllers/icsController.js
const fs = require('fs').promises;
const icsService = require('../services/icsService');
const meetingModel = require('../models/meetingModel');

const icsController = {
  // Analyser un fichier ICS pour une réponse de participant
  analyzeIcsFile: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier n\'a été uploadé' });
      }
      
      const token = req.params.token;
      const filePath = req.file.path;
      
      // Récupérer les informations du participant
      const participant = await meetingModel.findParticipantByToken(token);
      if (!participant) {
        // Supprimer le fichier si le token est invalide
        await fs.unlink(filePath);
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
      console.error('Erreur analyse ICS:', error);
      
      // Supprimer le fichier en cas d'erreur
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Erreur suppression fichier:', unlinkError);
        }
      }
      
      res.status(500).json({ error: 'Erreur lors de l\'analyse du fichier ICS' });
    }
  }
};

module.exports = icsController;