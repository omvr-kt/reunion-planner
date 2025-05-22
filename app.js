// app.js
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { pool } = require('./config/database');
const csrfMiddleware = require('./src/middlewares/csrfMiddleware');
const moment = require('moment-timezone');
const helmet = require('helmet');
const cors = require('cors'); // Importation du module cors
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Faire confiance au reverse proxy (si vous en utilisez un pour HTTPS)
// Cela permet à req.protocol et req.secure de refléter la connexion d'origine
app.set('trust proxy', 1); 

// Configuration CORS
// Doit être placé avant vos routes et potentiellement avant helmet/session si des problèmes persistent
app.use(cors({
  origin: ['http://localhost:3000', 'https://localhost:3000'], // Autoriser les deux origines pendant le développement/test
  credentials: true, // Important pour les sessions/cookies avec les requêtes cross-origin
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'], // Autoriser l'en-tête CSRF
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] // Méthodes HTTP à autoriser
}));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "code.jquery.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"], 
      fontSrc: ["'self'", "cdn.jsdelivr.net"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  xssFilter: true,
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
}));

app.use(require('./src/middlewares/flashMiddleware'));

app.use(csrfMiddleware.generate);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
  res.locals.escapeHTML = (text) => {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };
  
  res.locals.formatDate = (date, format = 'DD/MM/YYYY') => {
    if (!date) return '';
    return moment(date).format(format);
  };
  
  res.locals.formatDateTime = (date, format = 'DD/MM/YYYY HH:mm', timezone = 'Europe/Paris') => {
    if (!date) return '';
    return moment(date).tz(timezone).format(format);
  };
  
  res.locals.userTimezone = req.session.timezone || 'Europe/Paris';
  // Rendre l'objet utilisateur de la session disponible pour tous les templates
  if (req.session.user) {
    res.locals.user = req.session.user;
  }
  
  res.locals.commonTimezones = [
    'Europe/Paris', 'Europe/London', 'Europe/Berlin', 'Europe/Moscow',
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Dubai', 'Asia/Singapore',
    'Australia/Sydney', 'Australia/Perth',
    'Africa/Cairo', 'Africa/Johannesburg',
    'Pacific/Auckland'
  ];
  
  next();
});

app.use(require('./src/routes'));

app.use((req, res, next) => {
  res.status(404).render('pages/404', { title: 'Page non trouvée' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('pages/error', { 
    title: 'Erreur serveur',
    error: process.env.NODE_ENV === 'development' ? err : { message: 'Une erreur s\'est produite' }
  });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});

module.exports = app;