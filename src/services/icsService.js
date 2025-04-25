// src/services/icsService.js
const icalParser = require('ical-parser');
const fs = require('fs').promises;

const icsService = {
  // Analyser un fichier ICS
  parseIcsFile: async (filePath) => {
    try {
      // Lire le contenu du fichier
      const fileContent = await fs.readFile(filePath, 'utf8');
      
      // Parser le contenu
      const calendar = icalParser.parseString(fileContent);
      
      // Extraire les événements
      const events = [];
      
      if (calendar && calendar.events) {
        for (const event of calendar.events) {
          events.push({
            uid: event.uid,
            summary: event.summary,
            description: event.description,
            start: new Date(event.start),
            end: new Date(event.end),
            location: event.location
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
  checkAvailability: (events, startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    // Vérifier si l'un des événements chevauche le créneau proposé
    for (const event of events) {
      // Cas 1: l'événement commence pendant le créneau
      const startsInSlot = event.start >= start && event.start < end;
      
      // Cas 2: l'événement se termine pendant le créneau
      const endsInSlot = event.end > start && event.end <= end;
      
      // Cas 3: l'événement englobe entièrement le créneau
      const containsSlot = event.start <= start && event.end >= end;
      
      if (startsInSlot || endsInSlot || containsSlot) {
        return false; // Non disponible
      }
    }
    
    return true; // Disponible
  }
};

module.exports = icsService;