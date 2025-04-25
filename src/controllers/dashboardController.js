// src/controllers/dashboardController.js
const meetingModel = require('../models/meetingModel');

const dashboardController = {
  // Afficher le tableau de bord
  getDashboard: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const isOrganizer = req.session.user.is_organizer;
      
      let userMeetings = [];
      
      if (isOrganizer) {
        // Récupérer les réunions organisées par l'utilisateur
        userMeetings = await meetingModel.findByOrganizerId(userId);
      } else {
        // Récupérer les réunions auxquelles l'utilisateur participe
        userMeetings = await meetingModel.findByParticipantId(userId);
      }
      
      res.render('pages/dashboard/index', {
        title: 'Tableau de bord',
        meetings: userMeetings,
        isOrganizer
      });
    } catch (error) {
      console.error('Erreur dashboard:', error);
      req.flash('error', 'Une erreur s\'est produite lors du chargement du tableau de bord');
      res.redirect('/');
    }
  }
};

module.exports = dashboardController;