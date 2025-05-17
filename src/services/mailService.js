// src/services/mailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuration du transporteur d'email
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: process.env.MAIL_PORT === '465',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  },
  // Ajouter ces paramètres pour améliorer la délivrabilité
  tls: {
    rejectUnauthorized: false // Utile en développement
  },
  // Paramètres DKIM si vous en avez (en production)
  // dkim: {
  //   domainName: 'votredomaine.com',
  //   keySelector: 'email',
  //   privateKey: '...' // Votre clé privée DKIM
  // }
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

// Fonction pour générer un identifiant unique pour les messages
const generateMessageId = (domain = 'reunion-planner.app') => {
  const uuid = require('uuid').v4();
  return `${uuid}@${domain}`;
};

const mailService = {
  // Envoyer une invitation à une réunion
  sendMeetingInvitation: async (participant, meeting) => {
    // Récupérer les informations de l'organisateur si disponibles
    let organizerName = "L'équipe de Planification de Réunions";
    if (meeting.organizer_first_name && meeting.organizer_last_name) {
      organizerName = `${meeting.organizer_first_name} ${meeting.organizer_last_name}`;
    }

    const responseUrl = `${process.env.APP_URL}/meetings/respond/${participant.access_token}`;
    
    // Date de création formatée
    const creationDate = formatDateTime(meeting.created_at);
    
    const mailOptions = {
      // En-têtes améliorés pour éviter les spams
      from: {
        name: 'Planificateur de Réunions',
        address: process.env.MAIL_USER
      },
      to: participant.email,
      subject: `📅 Invitation: "${meeting.title}" - Réunion organisée par ${organizerName}`,
      // Identifiant unique du message
      messageId: generateMessageId(),
      // Priorité normale (pas trop haute qui pourrait sembler suspecte)
      priority: 'normal',
      // En-tête List-Unsubscribe pour les bonnes pratiques
      headers: {
        'List-Unsubscribe': `<${process.env.APP_URL}/unsubscribe?token=${participant.access_token}>`,
        'Precedence': 'bulk'
      },
      // Version texte simple (important pour la délivrabilité)
      text: `
Invitation à une réunion

Vous avez été invité(e) par ${organizerName} à participer à la réunion "${meeting.title}".

Description: ${meeting.description || 'Aucune description'}
Lieu: ${meeting.location || 'Non spécifié'}
Crée le: ${creationDate}

Pour indiquer vos disponibilités, veuillez visiter:
${responseUrl}

Merci!
      `,
      // Version HTML améliorée
      html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation à une réunion</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-top: 4px solid #4a69bd;">
    <h2 style="color: #4a69bd; margin-top: 0;">Invitation à une réunion</h2>
    
    <p>Bonjour,</p>
    
    <p>Vous avez été invité(e) par <strong>${organizerName}</strong> à participer à la réunion :</p>
    
    <div style="background-color: #fff; border-left: 4px solid #4a69bd; padding: 15px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #4a69bd;">${meeting.title}</h3>
      <p><strong>Description :</strong> ${meeting.description || 'Aucune description'}</p>
      <p><strong>Lieu :</strong> ${meeting.location || 'Non spécifié'}</p>
      <p><strong>Créée le :</strong> ${creationDate}</p>
    </div>
    
    <p>Pour indiquer vos disponibilités, veuillez cliquer sur le bouton ci-dessous :</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${responseUrl}" style="display: inline-block; background-color: #4a69bd; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Répondre à l'invitation</a>
    </div>
    
    <p>Si vous ne pouvez pas cliquer sur le bouton, copiez et collez le lien suivant dans votre navigateur :</p>
    <p style="word-break: break-all; background-color: #f1f1f1; padding: 10px; border-radius: 4px; font-size: 14px;">${responseUrl}</p>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #777; text-align: center;">
      Cet email vous a été envoyé car vous avez été invité(e) à une réunion sur notre plateforme.<br>
      © ${new Date().getFullYear()} Plateforme de Planification de Réunions
    </p>
  </div>
</body>
</html>
      `
    };
    
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email d\'invitation envoyé avec succès:', info.messageId);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email d\'invitation:', error);
      if (process.env.NODE_ENV === 'development') {
        console.log('Email qui aurait été envoyé:', mailOptions);
      }
      return false;
    }
  },
  
  // Envoyer une notification de finalisation de réunion (utiliser la même structure améliorée)
  sendMeetingFinalization: async (participant, meeting, selectedTimeslot) => {
    // Récupérer les informations de l'organisateur si disponibles
    let organizerName = "L'équipe de Planification de Réunions";
    if (meeting.organizer_first_name && meeting.organizer_last_name) {
      organizerName = `${meeting.organizer_first_name} ${meeting.organizer_last_name}`;
    }

    const startTime = formatDateTime(selectedTimeslot.start_time);
    const endTime = formatDateTime(selectedTimeslot.end_time);
    
    const mailOptions = {
      // En-têtes améliorés pour éviter les spams
      from: {
        name: 'Planificateur de Réunions',
        address: process.env.MAIL_USER
      },
      to: participant.email,
      subject: `✅ Confirmation: "${meeting.title}" - Réunion finalisée`,
      // Identifiant unique du message
      messageId: generateMessageId(),
      priority: 'normal',
      headers: {
        'List-Unsubscribe': `<${process.env.APP_URL}/unsubscribe?token=${participant.access_token}>`,
        'Precedence': 'bulk'
      },
      // Version texte simple
      text: `
Confirmation de réunion

La réunion "${meeting.title}" organisée par ${organizerName} a été confirmée pour la date suivante :

Date et heure: ${startTime} - ${endTime}
Lieu: ${meeting.location || 'Non spécifié'}
Description: ${meeting.description || 'Aucune description'}

Merci pour votre participation!
      `,
      // Version HTML améliorée
      html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de réunion</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-top: 4px solid #28a745;">
    <h2 style="color: #28a745; margin-top: 0;">Réunion confirmée</h2>
    
    <p>Bonjour,</p>
    
    <p>La réunion "<strong>${meeting.title}</strong>" organisée par <strong>${organizerName}</strong> a été <span style="color: #28a745; font-weight: bold;">confirmée</span> pour la date suivante :</p>
    
    <div style="background-color: #fff; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
      <p><strong>Date et heure :</strong> ${startTime} - ${endTime}</p>
      <p><strong>Lieu :</strong> ${meeting.location || 'Non spécifié'}</p>
      <p><strong>Description :</strong> ${meeting.description || 'Aucune description'}</p>
    </div>
    
    <p>Notez cet événement dans votre agenda. À bientôt !</p>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #777; text-align: center;">
      Cet email vous a été envoyé car vous participez à une réunion sur notre plateforme.<br>
      © ${new Date().getFullYear()} Plateforme de Planification de Réunions
    </p>
  </div>
</body>
</html>
      `
    };
    
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email de confirmation envoyé avec succès:', info.messageId);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de confirmation:', error);
      if (process.env.NODE_ENV === 'development') {
        console.log('Email qui aurait été envoyé:', mailOptions);
      }
      return false;
    }
  }
};

module.exports = mailService;