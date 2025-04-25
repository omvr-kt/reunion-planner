// src/controllers/meetingController.js
const meetingModel = require('../models/meetingModel');
const userModel = require('../models/userModel');
const mailService = require('../services/mailService');

const meetingController = {
  // Afficher la page de création d'une réunion
  getCreatePage: (req, res) => {
    res.render('pages/meetings/create', { 
      title: 'Créer une réunion'
    });
  },
  
  // Créer une nouvelle réunion
  create: async (req, res) => {
    try {
      const { title, description, location, timeslots, participants } = req.body;
      const organizerId = req.session.user.id;
      
      // Créer la réunion
      const newMeeting = await meetingModel.create({
        title,
        description,
        location,
        organizer_id: organizerId
      });
      
      // Ajouter les créneaux horaires
      const timeslotsArray = Array.isArray(timeslots) ? timeslots : [timeslots];
      for (const timeslotStr of timeslotsArray) {
        if (timeslotStr) {
          const [startTimeStr, endTimeStr] = timeslotStr.split(' - ');
          const startTime = new Date(startTimeStr);
          const endTime = new Date(endTimeStr);
          
          await meetingModel.addTimeslot(newMeeting.id, startTime, endTime);
        }
      }
      
      // Ajouter les participants
      const participantsArray = Array.isArray(participants) ? participants : [participants];
      for (const email of participantsArray) {
        if (email && email.trim()) {
          // Vérifier si l'utilisateur existe
          const user = await userModel.findByEmail(email.trim());
          
          const participant = await meetingModel.addParticipant(
            newMeeting.id,
            email.trim(),
            user ? user.id : null
          );
          
          // Envoyer un email d'invitation
          await mailService.sendMeetingInvitation(participant, newMeeting);
        }
      }
      
      req.flash('success', 'Réunion créée avec succès');
      res.redirect(`/meetings/${newMeeting.id}`);
    } catch (error) {
      console.error('Erreur création réunion:', error);
      req.flash('error', 'Une erreur s\'est produite lors de la création de la réunion');
      res.redirect('/meetings/create');
    }
  },
  
  // Afficher les détails d'une réunion
  getDetails: async (req, res) => {
    try {
      const meetingId = req.params.id;
      const userId = req.session.user.id;
      
      // Récupérer les informations de la réunion
      const meeting = await meetingModel.findById(meetingId);
      if (!meeting) {
        req.flash('error', 'Réunion non trouvée');
        return res.redirect('/dashboard');
      }
      
      // Vérifier si l'utilisateur est l'organisateur ou un participant
      const isOrganizer = meeting.organizer_id === userId;
      let isParticipant = false;
      
      if (!isOrganizer) {
        const participants = await meetingModel.getParticipants(meetingId);
        isParticipant = participants.some(p => p.user_id === userId);
        
        if (!isParticipant) {
          req.flash('error', 'Vous n\'avez pas accès à cette réunion');
          return res.redirect('/dashboard');
        }
      }
      
      // Récupérer les créneaux et participants
      const timeslots = await meetingModel.getTimeslots(meetingId);
      const participants = await meetingModel.getParticipants(meetingId);
      
      // Récupérer les réponses pour chaque participant
      for (const participant of participants) {
        participant.responses = await meetingModel.getParticipantResponses(participant.id);
      }
      
      res.render('pages/meetings/details', {
        title: meeting.title,
        meeting,
        timeslots,
        participants,
        isOrganizer
      });
    } catch (error) {
      console.error('Erreur détails réunion:', error);
      req.flash('error', 'Une erreur s\'est produite lors du chargement des détails de la réunion');
      res.redirect('/dashboard');
    }
  },
  
  // Afficher la page de modification d'une réunion
  getEditPage: async (req, res) => {
    try {
      const meetingId = req.params.id;
      const userId = req.session.user.id;
      
      // Récupérer les informations de la réunion
      const meeting = await meetingModel.findById(meetingId);
      if (!meeting) {
        req.flash('error', 'Réunion non trouvée');
        return res.redirect('/dashboard');
      }
      
      // Vérifier si l'utilisateur est l'organisateur
      if (meeting.organizer_id !== userId) {
        req.flash('error', 'Vous n\'êtes pas autorisé à modifier cette réunion');
        return res.redirect('/dashboard');
      }
      
      // Récupérer les créneaux et participants
      const timeslots = await meetingModel.getTimeslots(meetingId);
      const participants = await meetingModel.getParticipants(meetingId);
      
      res.render('pages/meetings/edit', {
        title: `Modifier ${meeting.title}`,
        meeting,
        timeslots,
        participants
      });
    } catch (error) {
      console.error('Erreur page modification réunion:', error);
      req.flash('error', 'Une erreur s\'est produite lors du chargement de la page de modification');
      res.redirect('/dashboard');
    }
  },
  
  // Mettre à jour une réunion
  update: async (req, res) => {
    try {
      const meetingId = req.params.id;
      const userId = req.session.user.id;
      const { title, description, location, new_timeslots, new_participants } = req.body;
      
      // Récupérer les informations de la réunion
      const meeting = await meetingModel.findById(meetingId);
      if (!meeting) {
        req.flash('error', 'Réunion non trouvée');
        return res.redirect('/dashboard');
      }
      
      // Vérifier si l'utilisateur est l'organisateur
      if (meeting.organizer_id !== userId) {
        req.flash('error', 'Vous n\'êtes pas autorisé à modifier cette réunion');
        return res.redirect('/dashboard');
      }
      
      // Mettre à jour les informations de base
      await meetingModel.update(meetingId, {
        title,
        description,
        location
      });
      
      // Ajouter de nouveaux créneaux horaires
      if (new_timeslots) {
        const timeslotsArray = Array.isArray(new_timeslots) ? new_timeslots : [new_timeslots];
        for (const timeslotStr of timeslotsArray) {
          if (timeslotStr) {
            const [startTimeStr, endTimeStr] = timeslotStr.split(' - ');
            const startTime = new Date(startTimeStr);
            const endTime = new Date(endTimeStr);
            
            await meetingModel.addTimeslot(meetingId, startTime, endTime);
          }
        }
      }
      
      // Ajouter de nouveaux participants
      if (new_participants) {
        const participantsArray = Array.isArray(new_participants) ? new_participants : [new_participants];
        for (const email of participantsArray) {
          if (email && email.trim()) {
            // Vérifier si l'utilisateur existe
            const user = await userModel.findByEmail(email.trim());
            
            const participant = await meetingModel.addParticipant(
              meetingId,
              email.trim(),
              user ? user.id : null
            );
            
            // Envoyer un email d'invitation
            await mailService.sendMeetingInvitation(participant, meeting);
          }
        }
      }
      
      req.flash('success', 'Réunion mise à jour avec succès');
      res.redirect(`/meetings/${meetingId}`);
    } catch (error) {
      console.error('Erreur modification réunion:', error);
      req.flash('error', 'Une erreur s\'est produite lors de la modification de la réunion');
      res.redirect(`/meetings/${req.params.id}/edit`);
    }
  },
  
  // Finaliser une réunion (choisir un créneau définitif)
  finalize: async (req, res) => {
    try {
      const meetingId = req.params.id;
      const userId = req.session.user.id;
      const { timeslot_id } = req.body;
      
      // Récupérer les informations de la réunion
      const meeting = await meetingModel.findById(meetingId);
      if (!meeting) {
        req.flash('error', 'Réunion non trouvée');
        return res.redirect('/dashboard');
      }
      
      // Vérifier si l'utilisateur est l'organisateur
      if (meeting.organizer_id !== userId) {
        req.flash('error', 'Vous n\'êtes pas autorisé à finaliser cette réunion');
        return res.redirect('/dashboard');
      }
      
      // Finaliser la réunion
      await meetingModel.finalize(meetingId, timeslot_id);
      
      // Notifier les participants
      const participants = await meetingModel.getParticipants(meetingId);
      const timeslots = await meetingModel.getTimeslots(meetingId);
      const selectedTimeslot = timeslots.find(t => t.id === parseInt(timeslot_id));
      
      for (const participant of participants) {
        await mailService.sendMeetingFinalization(participant, meeting, selectedTimeslot);
      }
      
      req.flash('success', 'Réunion finalisée avec succès. Les participants ont été notifiés.');
      res.redirect(`/meetings/${meetingId}`);
    } catch (error) {
      console.error('Erreur finalisation réunion:', error);
      req.flash('error', 'Une erreur s\'est produite lors de la finalisation de la réunion');
      res.redirect(`/meetings/${req.params.id}`);
    }
  },
  
  // Afficher la page de réponse pour un participant externe (via token)
  getResponsePage: async (req, res) => {
    try {
      const token = req.params.token;
      
      // Récupérer les informations du participant
      const participant = await meetingModel.findParticipantByToken(token);
      if (!participant) {
        return res.render('pages/meetings/invalid-token', {
          title: 'Lien invalide'
        });
      }
      
      // Récupérer les informations de la réunion
      const meeting = await meetingModel.findById(participant.meeting_id);
      const timeslots = await meetingModel.getTimeslots(participant.meeting_id);
      
      // Récupérer les réponses existantes du participant
      const responses = await meetingModel.getParticipantResponses(participant.id);
      
      res.render('pages/meetings/respond', {
        title: `Répondre à ${meeting.title}`,
        meeting,
        participant,
        timeslots,
        responses
      });
    } catch (error) {
      console.error('Erreur page réponse:', error);
      res.render('pages/error', {
        title: 'Erreur',
        error: {
          message: 'Une erreur s\'est produite lors du chargement de la page de réponse'
        }
      });
    }
  },
  
  // Enregistrer la réponse d'un participant
  saveResponse: async (req, res) => {
    try {
      const token = req.params.token;
      const { responses } = req.body;
      
      // Récupérer les informations du participant
      const participant = await meetingModel.findParticipantByToken(token);
      if (!participant) {
        return res.render('pages/meetings/invalid-token', {
          title: 'Lien invalide'
        });
      }
      
      // Formater les réponses
      const formattedResponses = [];
      for (const key in responses) {
        const timeslot_id = parseInt(key.replace('timeslot_', ''));
        const availability = responses[key] === 'yes';
        
        formattedResponses.push({
          timeslot_id,
          availability
        });
      }
      
      // Enregistrer les réponses
      await meetingModel.saveResponse(participant.id, formattedResponses);
      
      res.render('pages/meetings/response-success', {
        title: 'Réponse enregistrée',
        meetingTitle: participant.meeting_title
      });
    } catch (error) {
      console.error('Erreur enregistrement réponse:', error);
      res.render('pages/error', {
        title: 'Erreur',
        error: {
          message: 'Une erreur s\'est produite lors de l\'enregistrement de votre réponse'
        }
      });
    }
  }
};

module.exports = meetingController;