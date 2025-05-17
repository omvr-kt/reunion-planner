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
      
      // Vérifier l'extension du fichier
      if (!req.file.originalname.toLowerCase().endsWith('.ics')) {
        await fs.unlink(filePath);
        return res.status(400).json({ error: 'Le fichier doit être au format .ics' });
      }
      
      // Vérifier la taille du fichier (max 5MB)
      if (req.file.size > 5 * 1024 * 1024) {
        await fs.unlink(filePath);
        return res.status(400).json({ error: 'Le fichier est trop volumineux (max 5MB)' });
      }
      
      // Récupérer les informations du participant
      const participant = await meetingModel.findParticipantByToken(token);
      if (!participant) {
        // Supprimer le fichier si le token est invalide
        await fs.unlink(filePath);
        return res.status(400).json({ error: 'Token invalide' });
      }
      
      // Vérifier si la réunion est déjà finalisée
      const meeting = await meetingModel.findById(participant.meeting_id);
      if (meeting && meeting.is_finalized) {
        await fs.unlink(filePath);
        return res.status(400).json({ error: 'Cette réunion a déjà été finalisée. Vous ne pouvez plus modifier vos disponibilités.' });
      }
      
      // Lire le contenu du fichier pour vérifier s'il est vide
      const fileContent = await fs.readFile(filePath, 'utf8');
      if (!fileContent || fileContent.trim() === '') {
        await fs.unlink(filePath);
        return res.status(400).json({ error: 'Le fichier ICS est vide' });
      }
      
      // Analyser le fichier ICS
      const events = await icsService.parseIcsFile(filePath);
      
      // Vérifier si des événements ont été trouvés
      if (!events || events.length === 0) {
        await fs.unlink(filePath);
        return res.status(400).json({ error: 'Aucun événement n\'a été trouvé dans le fichier ICS' });
      }
      
      console.log(`Fichier ICS analysé avec succès. ${events.length} événements trouvés.`);
      
      // Récupérer les créneaux de la réunion
      const timeslots = await meetingModel.getTimeslots(participant.meeting_id);
      
      // Vérifier la disponibilité pour chaque créneau
      const availabilityResults = {};
      
      for (const timeslot of timeslots) {
        // Utiliser le fuseau horaire du participant si disponible
        const timezone = participant.timezone || 'Europe/Paris';
        
        const isAvailable = icsService.checkAvailability(
          events,
          timeslot.start_time,
          timeslot.end_time,
          timezone
        );
        
        availabilityResults[`timeslot_${timeslot.id}`] = isAvailable ? 'yes' : 'no';
      }
      
      // Supprimer le fichier après analyse
      await fs.unlink(filePath);
      
      // Ajouter des statistiques dans la réponse
      const stats = {
        totalEvents: events.length,
        totalTimeslots: timeslots.length,
        availableSlots: Object.values(availabilityResults).filter(v => v === 'yes').length,
        unavailableSlots: Object.values(availabilityResults).filter(v => v === 'no').length
      };
      
      res.json({ 
        success: true, 
        availability: availabilityResults,
        stats: stats
      });
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
      
      // Message d'erreur plus explicite
      let errorMessage = 'Erreur lors de l\'analyse du fichier ICS';
      
      if (error.message && error.message.includes('Impossible d\'analyser le fichier ICS')) {
        errorMessage = 'Format de fichier ICS invalide ou corrompu';
      }
      
      res.status(500).json({ error: errorMessage });
    }
  }
};

module.exports = icsController;