const { isValidEmail, isValidDate, sanitizeHTML, isValidTimezone } = require('../utils/helpers');

const validationMiddleware = {
  validateMeeting: (req, res, next) => {
    const errors = [];
    
    if (!req.body.title || req.body.title.trim() === '') {
      errors.push('Le titre de la réunion est requis');
    } else if (req.body.title.length > 255) {
      errors.push('Le titre de la réunion ne doit pas dépasser 255 caractères');
    }
    
    req.body.title = sanitizeHTML(req.body.title);
    req.body.description = sanitizeHTML(req.body.description);
    req.body.location = sanitizeHTML(req.body.location);
    
    if (!req.body.timeslots || 
        (Array.isArray(req.body.timeslots) && req.body.timeslots.length === 0) ||
        (!Array.isArray(req.body.timeslots) && !req.body.timeslots)) {
      errors.push('Au moins un créneau horaire est requis');
    } else {
      const timeslotsArray = Array.isArray(req.body.timeslots) ? req.body.timeslots : [req.body.timeslots];
      
      for (const timeslotStr of timeslotsArray) {
        if (timeslotStr) {
          const [startTimeStr, endTimeStr] = timeslotStr.split(' - ');
          
          if (!isValidDate(startTimeStr) || !isValidDate(endTimeStr)) {
            errors.push('Format de date invalide pour un créneau');
            break;
          }
          
          const startTime = new Date(startTimeStr);
          const endTime = new Date(endTimeStr);
          const currentTime = new Date();
          
          if (startTime < currentTime) {
            errors.push('La date de début ne peut pas être dans le passé');
            break;
          }
          
          if (startTime >= endTime) {
            errors.push('La date de début doit être antérieure à la date de fin');
            break;
          }
        }
      }
    }
    
    if (!req.body.participants || 
        (Array.isArray(req.body.participants) && req.body.participants.length === 0) ||
        (!Array.isArray(req.body.participants) && !req.body.participants)) {
      errors.push('Au moins un participant est requis');
    } else {
      const participantsArray = Array.isArray(req.body.participants) ? req.body.participants : [req.body.participants];
      
      for (const email of participantsArray) {
        if (email && email.trim() && !isValidEmail(email.trim())) {
          errors.push(`Adresse email invalide: ${email.trim()}`);
          break;
        }
      }
    }
    
    if (req.body.timezone && !isValidTimezone(req.body.timezone)) {
      errors.push('Fuseau horaire invalide');
    }
    
    if (errors.length > 0) {
      req.flash('error', errors.join('<br>'));
      return res.redirect(req.originalUrl);
    }
    
    next();
  },
  
  validateUser: (req, res, next) => {
    const errors = [];
    
    if (!req.body.email || !isValidEmail(req.body.email.trim())) {
      errors.push('Adresse email invalide');
    }
    
    if (!req.body.first_name || req.body.first_name.trim() === '') {
      errors.push('Le prénom est requis');
    } else if (req.body.first_name.length > 100) {
      errors.push('Le prénom ne doit pas dépasser 100 caractères');
    }
    
    if (!req.body.last_name || req.body.last_name.trim() === '') {
      errors.push('Le nom est requis');
    } else if (req.body.last_name.length > 100) {
      errors.push('Le nom ne doit pas dépasser 100 caractères');
    }
    
    req.body.first_name = sanitizeHTML(req.body.first_name);
    req.body.last_name = sanitizeHTML(req.body.last_name);
    req.body.email = sanitizeHTML(req.body.email);
    
    if (errors.length > 0) {
      req.flash('error', errors.join('<br>'));
      return res.redirect(req.originalUrl);
    }
    
    next();
  }
};

module.exports = validationMiddleware;