const fs = require('fs').promises;
const path = require('path');
const { sanitizeHTML, formatDateTime, generateICSFile } = require('../utils/helpers');
const meetingModel = require('../models/meetingModel');
const userModel = require('../models/userModel');
const mailService = require('../services/mailService');

const meetingController = {
  getCreatePage: (req, res) => {
    res.render('pages/meetings/create', { 
      title: 'Créer une réunion'
    });
  },
  
  create: async (req, res) => {
    try {
      const { title, description, location, timeslots, participants } = req.body;
      const organizerId = req.session.user.id;
      
      const newMeeting = await meetingModel.create({
        title,
        description,
        location,
        organizer_id: organizerId
      });
      
      const timeslotsArray = Array.isArray(timeslots) ? timeslots : [timeslots];
      for (const timeslotStr of timeslotsArray) {
        if (timeslotStr) {
          const [startTimeStr, endTimeStr] = timeslotStr.split(' - ');
          const startTime = new Date(startTimeStr);
          const endTime = new Date(endTimeStr);
          
          await meetingModel.addTimeslot(newMeeting.id, startTime, endTime);
        }
      }
      
      const participantsArray = Array.isArray(participants) ? participants : [participants];
      for (const email of participantsArray) {
        if (email && email.trim()) {
          const user = await userModel.findByEmail(email.trim());
          
          const participant = await meetingModel.addParticipant(
            newMeeting.id,
            email.trim(),
            user ? user.id : null
          );
          
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
  
  getDetails: async (req, res) => {
    try {
      const meetingId = req.params.id;
      const userId = req.session.user.id;
      
      const meeting = await meetingModel.findById(meetingId);
      if (!meeting) {
        req.flash('error', 'Réunion non trouvée');
        return res.redirect('/dashboard');
      }
      
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
      
      const timeslots = await meetingModel.getTimeslots(meetingId);
      const participants = await meetingModel.getParticipants(meetingId);
      
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
  
  getEditPage: async (req, res) => {
    try {
      const meetingId = req.params.id;
      const userId = req.session.user.id;
      
      const meeting = await meetingModel.findById(meetingId);
      if (!meeting) {
        req.flash('error', 'Réunion non trouvée');
        return res.redirect('/dashboard');
      }
      
      if (meeting.organizer_id !== userId) {
        req.flash('error', 'Vous n\'êtes pas autorisé à modifier cette réunion');
        return res.redirect('/dashboard');
      }
      
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
  
  update: async (req, res) => {
    try {
      const meetingId = req.params.id;
      const userId = req.session.user.id;
      const { title, description, location, new_timeslots, new_participants } = req.body;
      
      const meeting = await meetingModel.findById(meetingId);
      if (!meeting) {
        req.flash('error', 'Réunion non trouvée');
        return res.redirect('/dashboard');
      }
      
      if (meeting.organizer_id !== userId) {
        req.flash('error', 'Vous n\'êtes pas autorisé à modifier cette réunion');
        return res.redirect('/dashboard');
      }
      
      await meetingModel.update(meetingId, {
        title,
        description,
        location
      });
      
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
      
      if (new_participants) {
        const participantsArray = Array.isArray(new_participants) ? new_participants : [new_participants];
        for (const email of participantsArray) {
          if (email && email.trim()) {
            const user = await userModel.findByEmail(email.trim());
            
            const participant = await meetingModel.addParticipant(
              meetingId,
              email.trim(),
              user ? user.id : null
            );
            
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
  
  finalize: async (req, res) => {
    try {
      const meetingId = req.params.id;
      const userId = req.session.user.id;
      const { timeslot_id } = req.body;
      
      const meeting = await meetingModel.findById(meetingId);
      if (!meeting) {
        req.flash('error', 'Réunion non trouvée');
        return res.redirect('/dashboard');
      }
      
      if (meeting.organizer_id !== userId) {
        req.flash('error', 'Vous n\'êtes pas autorisé à finaliser cette réunion');
        return res.redirect('/dashboard');
      }
      
      await meetingModel.finalize(meetingId, timeslot_id);
      
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
  
  getResponsePage: async (req, res) => {
    try {
      const token = req.params.token;
      
      const participant = await meetingModel.findParticipantByToken(token);
      if (!participant) {
        return res.render('pages/meetings/invalid-token', {
          title: 'Lien invalide'
        });
      }
      
      if (participant.token_expires_at && new Date() > new Date(participant.token_expires_at)) {
        return res.render('pages/meetings/invalid-token', {
          title: 'Lien expiré'
        });
      }
      
      const meeting = await meetingModel.findById(participant.meeting_id);
      const timeslots = await meetingModel.getTimeslots(participant.meeting_id);
      
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
  
  saveResponse: async (req, res) => {
    try {
      const token = req.params.token;
      const { responses } = req.body;
      
      const participant = await meetingModel.findParticipantByToken(token);
      if (!participant) {
        return res.render('pages/meetings/invalid-token', {
          title: 'Lien invalide'
        });
      }
      
      const formattedResponses = [];
      for (const key in responses) {
        const timeslot_id = parseInt(key.replace('timeslot_', ''));
        const availability = responses[key] === 'yes';
        
        formattedResponses.push({
          timeslot_id,
          availability
        });
      }
      
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
  },
  exportToICS: async (req, res) => {
    try {
      const meetingId = req.params.id;
      const userId = req.session.user.id;
      
      const meeting = await meetingModel.findById(meetingId);
      if (!meeting) {
        req.flash('error', 'Réunion non trouvée');
        return res.redirect('/dashboard');
      }
      
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
      
      let timeslot;
      if (meeting.is_finalized && meeting.final_timeslot_id) {
        const timeslots = await meetingModel.getTimeslots(meetingId);
        timeslot = timeslots.find(t => t.id === meeting.final_timeslot_id);
      } else {
        const timeslots = await meetingModel.getTimeslots(meetingId);
        if (timeslots.length > 0) {
          timeslot = timeslots[0];
          req.flash('warning', 'Cette réunion n\'est pas encore finalisée. Le fichier ICS contient le premier créneau proposé.');
        } else {
          req.flash('error', 'Cette réunion ne contient aucun créneau horaire');
          return res.redirect(`/meetings/${meetingId}`);
        }
      }
      
      const icsContent = generateICSFile(meeting, timeslot);
      
      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', `attachment; filename="${meeting.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics"`);
      
      res.send(icsContent);
    } catch (error) {
      console.error('Erreur export ICS:', error);
      req.flash('error', 'Une erreur s\'est produite lors de l\'export au format ICS');
      res.redirect(`/meetings/${req.params.id}`);
    }
  },
  
  exportToICSPublic: async (req, res) => {
    try {
      const token = req.params.token;
      
      const participant = await meetingModel.findParticipantByToken(token);
      if (!participant) {
        return res.render('pages/meetings/invalid-token', {
          title: 'Lien invalide'
        });
      }
      
      if (participant.token_expires_at && new Date() > new Date(participant.token_expires_at)) {
        return res.render('pages/meetings/invalid-token', {
          title: 'Lien expiré'
        });
      }
      
      const meeting = await meetingModel.findById(participant.meeting_id);
      
      let timeslot;
      if (meeting.is_finalized && meeting.final_timeslot_id) {
        const timeslots = await meetingModel.getTimeslots(participant.meeting_id);
        timeslot = timeslots.find(t => t.id === meeting.final_timeslot_id);
      } else {
        const timeslots = await meetingModel.getTimeslots(participant.meeting_id);
        if (timeslots.length > 0) {
          timeslot = timeslots[0];
        } else {
          return res.status(400).send('Cette réunion ne contient aucun créneau horaire');
        }
      }
      
      const icsContent = generateICSFile(meeting, timeslot);
      
      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', `attachment; filename="${meeting.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics"`);
      
      res.send(icsContent);
    } catch (error) {
      console.error('Erreur export ICS public:', error);
      res.status(500).send('Une erreur s\'est produite lors de l\'export au format ICS');
    }
  },
  
  getCalendarView: async (req, res) => {
    try {
      const meetingId = req.params.id;
      const userId = req.session.user.id;
      
      const meeting = await meetingModel.findById(meetingId);
      if (!meeting) {
        req.flash('error', 'Réunion non trouvée');
        return res.redirect('/dashboard');
      }
      
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
      
      const timeslots = await meetingModel.getTimeslots(meetingId);
      const participants = await meetingModel.getParticipants(meetingId);
      
      const availabilityStats = await meetingModel.getAvailabilityStats(meetingId);
      
      for (const participant of participants) {
        participant.responses = await meetingModel.getParticipantResponses(participant.id);
      }
      
      const calendarDays = {};
      
      for (const timeslot of timeslots) {
        const startDate = new Date(timeslot.start_time);
        const dateKey = startDate.toISOString().split('T')[0];
        
        if (!calendarDays[dateKey]) {
          calendarDays[dateKey] = {
            date: startDate,
            timeslots: []
          };
        }
        
        calendarDays[dateKey].timeslots.push(timeslot);
      }
      
      res.render('pages/meetings/calendar', {
        title: `Calendrier - ${meeting.title}`,
        meeting,
        calendarDays,
        participants,
        availabilityStats,
        isOrganizer,
        userTimezone: req.session.timezone || 'Europe/Paris'
      });
    } catch (error) {
      console.error('Erreur vue calendrier:', error);
      req.flash('error', 'Une erreur s\'est produite lors du chargement de la vue calendrier');
      res.redirect(`/meetings/${req.params.id}`);
    }
  },
  
  setTimezone: async (req, res) => {
    try {
      const { timezone, redirect_url } = req.body;
      
      if (!timezone || !require('moment-timezone').tz.zone(timezone)) {
        req.flash('error', 'Fuseau horaire invalide');
        return res.redirect(redirect_url || '/dashboard');
      }
      
      req.session.timezone = timezone;
      
      if (req.query.participant_id) {
        await meetingModel.updateParticipantTimezone(req.query.participant_id, timezone);
      }
      
      req.flash('success', 'Fuseau horaire mis à jour');
      res.redirect(redirect_url || '/dashboard');
    } catch (error) {
      console.error('Erreur mise à jour fuseau horaire:', error);
      req.flash('error', 'Une erreur s\'est produite lors de la mise à jour du fuseau horaire');
      res.redirect(req.body.redirect_url || '/dashboard');
    }
  },
  
  setParticipantTimezone: async (req, res) => {
    try {
      const token = req.params.token;
      const { timezone } = req.body;
      
      const participant = await meetingModel.findParticipantByToken(token);
      if (!participant) {
        return res.render('pages/meetings/invalid-token', {
          title: 'Lien invalide'
        });
      }
      
      if (!timezone || !require('moment-timezone').tz.zone(timezone)) {
        return res.redirect(`/meetings/respond/${token}`);
      }
      
      await meetingModel.updateParticipantTimezone(participant.id, timezone);
      
      res.redirect(`/meetings/respond/${token}`);
    } catch (error) {
      console.error('Erreur mise à jour fuseau horaire participant:', error);
      res.redirect(`/meetings/respond/${req.params.token}`);
    }
  },
  
  getDocumentsPage: async (req, res) => {
    try {
      const meetingId = req.params.id;
      const userId = req.session.user.id;
      
      const meeting = await meetingModel.findById(meetingId);
      if (!meeting) {
        req.flash('error', 'Réunion non trouvée');
        return res.redirect('/dashboard');
      }
      
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
      
      const documents = await meetingModel.getDocuments(meetingId);
      
      res.render('pages/meetings/documents', {
        title: `Documents - ${meeting.title}`,
        meeting,
        documents,
        isOrganizer
      });
    } catch (error) {
      console.error('Erreur page documents:', error);
      req.flash('error', 'Une erreur s\'est produite lors du chargement de la page de documents');
      res.redirect(`/meetings/${req.params.id}`);
    }
  },
  
  uploadDocument: async (req, res) => {
    try {
      if (!req.file) {
        req.flash('error', 'Aucun fichier n\'a été uploadé');
        return res.redirect(`/meetings/${req.params.id}/documents`);
      }
      
      const meetingId = req.params.id;
      const userId = req.session.user.id;
      
      const meeting = await meetingModel.findById(meetingId);
      if (!meeting) {
        await fs.unlink(req.file.path);
        
        req.flash('error', 'Réunion non trouvée');
        return res.redirect('/dashboard');
      }
      
      const isOrganizer = meeting.organizer_id === userId;
      let isParticipant = false;
      
      if (!isOrganizer) {
        const participants = await meetingModel.getParticipants(meetingId);
        isParticipant = participants.some(p => p.user_id === userId);
        
        if (!isParticipant) {
          await fs.unlink(req.file.path);
          
          req.flash('error', 'Vous n\'avez pas accès à cette réunion');
          return res.redirect('/dashboard');
        }
      }
      
      await meetingModel.addDocument(meetingId, userId, req.file);
      
      req.flash('success', 'Document uploadé avec succès');
      res.redirect(`/meetings/${meetingId}/documents`);
    } catch (error) {
      console.error('Erreur upload document:', error);
      
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Erreur suppression fichier:', unlinkError);
        }
      }
      
      req.flash('error', 'Une erreur s\'est produite lors de l\'upload du document');
      res.redirect(`/meetings/${req.params.id}/documents`);
    }
  },
  
  downloadDocument: async (req, res) => {
    try {
      const meetingId = req.params.id;
      const documentId = req.params.documentId;
      const userId = req.session.user.id;
      
      const meeting = await meetingModel.findById(meetingId);
      if (!meeting) {
        req.flash('error', 'Réunion non trouvée');
        return res.redirect('/dashboard');
      }
      
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
      
        const document = await meetingModel.getDocumentById(documentId);
      if (!document || document.meeting_id !== parseInt(meetingId)) {
        req.flash('error', 'Document non trouvé');
        return res.redirect(`/meetings/${meetingId}/documents`);
      }
      
      // Vérifier si le fichier existe
      try {
        await fs.access(document.file_path);
      } catch (error) {
        req.flash('error', 'Le fichier n\'existe plus sur le serveur');
        return res.redirect(`/meetings/${meetingId}/documents`);
      }
      
      // Délivrer le fichier
      res.download(document.file_path, document.original_name);
    } catch (error) {
      console.error('Erreur téléchargement document:', error);
      req.flash('error', 'Une erreur s\'est produite lors du téléchargement du document');
      res.redirect(`/meetings/${req.params.id}/documents`);
    }
  }
};

module.exports = meetingController;