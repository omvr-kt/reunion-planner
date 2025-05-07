// src/services/icsService.js
const ical = require('ical');
const fs = require('fs').promises;
const moment = require('moment-timezone');

const icsService = {
  // Analyser un fichier ICS
  parseIcsFile: async (filePath) => {
    try {
      // Lire le contenu du fichier
      const fileContent = await fs.readFile(filePath, 'utf8');
      
      // Parser le contenu
      const calendar = ical.parseICS(fileContent);
      
      // Extraire les événements
      const events = [];
      
      for (const key in calendar) {
        if (calendar[key].type === 'VEVENT') {
          const event = calendar[key];
          
          // Ignorer les événements sans dates de début ou de fin
          if (!event.start || !event.end) {
            console.log('Événement sans dates ignoré:', event.summary || 'Inconnu');
            continue;
          }
          
          // Ignorer les événements qui sont marqués comme annulés
          if (event.status && event.status.toLowerCase() === 'cancelled') {
            console.log('Événement annulé ignoré:', event.summary || 'Inconnu');
            continue;
          }
          
          // Pour les événements récurrents, ical.js les traite déjà en créant des instances individuelles
          events.push({
            uid: event.uid,
            summary: event.summary || 'Sans titre',
            description: event.description || '',
            start: event.start,
            end: event.end,
            location: event.location || '',
            isRecurring: !!event.rrule,
            status: event.status || 'CONFIRMED'
          });
        }
      }
      
      return events;
    } catch (error) {
      console.error('Erreur parsing ICS:', error);
      throw new Error('Impossible d\'analyser le fichier ICS');
    }
  },
  
  // Vérifier la disponibilité d'un utilisateur pour un créneau donné
  checkAvailability: (events, startTime, endTime, timezone = 'Europe/Paris') => {
    // Convertir les dates en utilisant moment-timezone pour tenir compte du fuseau horaire
    const start = moment.tz(startTime, timezone).toDate();
    const end = moment.tz(endTime, timezone).toDate();
    
    // Vérifier si l'un des événements chevauche le créneau proposé
    for (const event of events) {
      // Sauter les événements annulés ou déclinés
      if (event.status && ['cancelled', 'declined'].includes(event.status.toLowerCase())) {
        continue;
      }
      
      // Les heures de début et de fin de l'événement
      const eventStart = event.start;
      const eventEnd = event.end;
      
      // Cas 1: l'événement commence pendant le créneau
      const startsInSlot = eventStart >= start && eventStart < end;
      
      // Cas 2: l'événement se termine pendant le créneau
      const endsInSlot = eventEnd > start && eventEnd <= end;
      
      // Cas 3: l'événement englobe entièrement le créneau
      const containsSlot = eventStart <= start && eventEnd >= end;
      
      // Cas 4: l'événement est entièrement contenu dans le créneau
      const containedInSlot = eventStart >= start && eventEnd <= end;
      
      if (startsInSlot || endsInSlot || containsSlot || containedInSlot) {
        console.log(`Conflit trouvé pour "${event.summary}" (${event.start} - ${event.end})`);
        return false; // Non disponible
      }
    }
    
    return true; // Disponible
  },
  
  // Obtenir les statistiques d'un calendrier ICS
  getCalendarStats: (events) => {
    if (!events || events.length === 0) {
      return {
        total: 0,
        upcoming: 0,
        past: 0,
        recurring: 0,
        allDayEvents: 0
      };
    }
    
    const now = new Date();
    
    return {
      total: events.length,
      upcoming: events.filter(event => event.start > now).length,
      past: events.filter(event => event.end < now).length,
      recurring: events.filter(event => event.isRecurring).length,
      allDayEvents: events.filter(event => {
        // Un événement est considéré comme toute la journée si :
        // 1. Il commence à minuit
        // 2. Sa durée est un multiple de 24 heures (à quelques secondes près)
        const start = event.start;
        const end = event.end;
        const isStartMidnight = start.getHours() === 0 && start.getMinutes() === 0;
        const duration = (end - start) / (1000 * 60 * 60); // durée en heures
        const isDurationWholeDay = Math.abs(duration - Math.round(duration / 24) * 24) < 0.1;
        
        return isStartMidnight && isDurationWholeDay;
      }).length
    };
  }
};

module.exports = icsService;