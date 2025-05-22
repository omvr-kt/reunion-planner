// src/utils/helpers.js
const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const moment = require('moment-timezone');
require('moment/locale/fr'); // Importe explicitement la locale française
moment.locale('fr'); // Configure moment pour utiliser le français globalement
const crypto = require('crypto');
const icalGenerator = require('ical-generator');

const window = new JSDOM('').window;
const purify = DOMPurify(window);

const helpers = {
  sanitizeHTML: (html) => {
    if (!html) return '';
    return purify.sanitize(html, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });
  },

  sanitizeHTMLWithTags: (html) => {
    if (!html) return '';
    return purify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['href', 'target']
    });
  },
  
  escapeHTML: (text) => {
    if (!text) return '';
    return text.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&#039;');
  },

  isValidEmail: (email) => {
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  },

  isValidDate: (dateString) => {
    return !isNaN(Date.parse(dateString));
  },
  formatDateTime: (date, format = 'DD/MM/YYYY HH:mm', timezone = 'Europe/Paris') => {
    if (!date) return '';
    // Configurer moment.js pour utiliser le français
    moment.locale('fr');
    return moment(date).tz(timezone).format(format);
  },

  convertTimezone: (date, fromTimezone = 'UTC', toTimezone = 'Europe/Paris') => {
    return moment.tz(date, fromTimezone).tz(toTimezone).toDate();
  },
  generateCSRFToken: () => {
    return crypto.randomBytes(32).toString('hex');
  },

  generateAccessToken: (expireDays = 30) => {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expireDays);
    
    return {
      token,
      expiresAt
    };
  },

  generateICSFile: (meeting, timeslot) => {
    const ical = require('ical-generator');
    const calendar = ical.default({
      domain: 'reunion-planner.fr',
      name: 'Réunion planifiée',
    });

    const event = calendar.createEvent({
      start: timeslot.start_time,
      end: timeslot.end_time,
      summary: meeting.title,
      description: meeting.description || '',
      location: meeting.location || '',
      organizer: {
        name: `${meeting.organizer_first_name} ${meeting.organizer_last_name}`,
        email: meeting.organizer_email || 'no-reply@reunion-planner.fr'
      },
      status: 'CONFIRMED'
    });

    return calendar.toString();
  },

  getTimezones: () => {
    return moment.tz.names();
  },
  isValidTimezone: (timezone) => {
    return moment.tz.zone(timezone) !== null;
  }
};

module.exports = helpers;