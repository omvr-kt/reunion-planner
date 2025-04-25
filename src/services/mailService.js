// src/services/mailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

// Création du transporteur
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: process.env.MAIL_PORT === '465',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// Fonction pour formater la date et l'heure
const formatDateTime = (date) => {
  return new Date(date).toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const mailService = {
  // Envoyer une invitation à une réunion
  sendMeetingInvitation: async (participant, meeting) => {
    const responseUrl = `${process.env.APP_URL}/meetings/respond/${participant.access_token}`;
    
    const mailOptions = {
      from: `"Plateforme de Réunions" <${process.env.MAIL_FROM}>`,
      to: participant.email,
      subject: `Invitation à une réunion : ${meeting.title}`,
      html: `
        <h2>Invitation à une réunion</h2>
        <p>Vous avez été invité(e) à participer à la réunion "${meeting.title}".</p>
        <p><strong>Description :</strong> ${meeting.description || 'Aucune description'}</p>
        <p><strong>Lieu :</strong> ${meeting.location || 'Non spécifié'}</p>
        
        <p>Pour indiquer vos disponibilités, veuillez cliquer sur le lien ci-dessous :</p>
        <p><a href="${responseUrl}" style="display: inline-block; background-color: #4a69bd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Répondre à l'invitation</a></p>
        
        <p>Si vous ne pouvez pas cliquer sur le bouton, copiez et collez le lien suivant dans votre navigateur :</p>
        <p>${responseUrl}</p>
        
        <p>Merci !</p>
      `
    };
    
    // En mode développement, ne pas envoyer réellement l'email
    if (process.env.NODE_ENV === 'development') {
      console.log('Email d\'invitation (mode développement) :');
      console.log(mailOptions);
      return true;
    }
    
    return await transporter.sendMail(mailOptions);
  },
  
  // Envoyer une notification de finalisation de réunion
  sendMeetingFinalization: async (participant, meeting, selectedTimeslot) => {
    const startTime = formatDateTime(selectedTimeslot.start_time);
    const endTime = formatDateTime(selectedTimeslot.end_time);
    
    const mailOptions = {
      from: `"Plateforme de Réunions" <${process.env.MAIL_FROM}>`,
      to: participant.email,
      subject: `Réunion confirmée : ${meeting.title}`,
      html: `
        <h2>Réunion confirmée</h2>
        <p>La réunion "${meeting.title}" a été confirmée pour la date suivante :</p>
        
        <p><strong>Date et heure :</strong> ${startTime} - ${endTime}</p>
        <p><strong>Lieu :</strong> ${meeting.location || 'Non spécifié'}</p>
        <p><strong>Description :</strong> ${meeting.description || 'Aucune description'}</p>
        
        <p>Merci pour votre participation !</p>
      `
    };
    
    // En mode développement, ne pas envoyer réellement l'email
    if (process.env.NODE_ENV === 'development') {
      console.log('Email de finalisation (mode développement) :');
      console.log(mailOptions);
      return true;
    }
    
    return await transporter.sendMail(mailOptions);
  }
};

module.exports = mailService;