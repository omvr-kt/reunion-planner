// src/utils/frenchDateFormatter.js
const moment = require('moment');
require('moment/locale/fr'); // Importe explicitement la locale française

// Configure moment pour utiliser le français globalement
moment.locale('fr');

// Jours de la semaine en français (pour remplacer les abréviations anglaises si nécessaire)
const frenchDays = {
  'Mon': 'Lun',
  'Tue': 'Mar',
  'Wed': 'Mer',
  'Thu': 'Jeu',
  'Fri': 'Ven',
  'Sat': 'Sam',
  'Sun': 'Dim',
  'Monday': 'Lundi',
  'Tuesday': 'Mardi',
  'Wednesday': 'Mercredi',
  'Thursday': 'Jeudi',
  'Friday': 'Vendredi',
  'Saturday': 'Samedi',
  'Sunday': 'Dimanche'
};

// Mois en français (pour remplacer les abréviations anglaises si nécessaire)
const frenchMonths = {
  'Jan': 'Jan',
  'Feb': 'Fév',
  'Mar': 'Mar',
  'Apr': 'Avr',
  'May': 'Mai',
  'Jun': 'Juin',
  'Jul': 'Juil',
  'Aug': 'Août',
  'Sep': 'Sep',
  'Oct': 'Oct',
  'Nov': 'Nov',
  'Dec': 'Déc',
  'January': 'Janvier',
  'February': 'Février',
  'March': 'Mars',
  'April': 'Avril',
  'May': 'Mai',
  'June': 'Juin',
  'July': 'Juillet',
  'August': 'Août',
  'September': 'Septembre',
  'October': 'Octobre',
  'November': 'Novembre',
  'December': 'Décembre'
};

/**
 * Formate une date en français
 * @param {Date|string} date - Date à formater
 * @param {string} format - Format moment.js
 * @param {string} timezone - Fuseau horaire
 * @returns {string} - Date formatée en français
 */
function formatDateFrench(date, format = 'DD/MM/YYYY HH:mm', timezone = 'Europe/Paris') {
  if (!date) return '';
  
  // Utilise moment.js avec la locale française
  let formattedDate = moment(date).tz(timezone).format(format);
  
  // Remplace manuellement les jours et mois anglais par leurs équivalents français
  // au cas où la locale ne fonctionnerait pas correctement
  Object.keys(frenchDays).forEach(englishDay => {
    formattedDate = formattedDate.replace(new RegExp(englishDay, 'g'), frenchDays[englishDay]);
  });
  
  Object.keys(frenchMonths).forEach(englishMonth => {
    formattedDate = formattedDate.replace(new RegExp(englishMonth, 'g'), frenchMonths[englishMonth]);
  });
  
  return formattedDate;
}

module.exports = formatDateFrench;
