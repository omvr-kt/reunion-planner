const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
require('dotenv').config();

// Initialisation de l'application Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration de la connexion à la base de données
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

// Configuration des middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuration des sessions
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'session' // Nous devrons créer cette table dans notre script SQL
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 jours
}));

// Configuration du moteur de template EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes de base (à compléter plus tard)
app.get('/', (req, res) => {
  res.render('pages/home', { title: 'Accueil - Plateforme de Réunions' });
});

// Middleware pour gérer les erreurs 404
app.use((req, res, next) => {
  res.status(404).render('pages/404', { title: 'Page non trouvée' });
});

// Middleware pour gérer les erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('pages/error', { 
    title: 'Erreur serveur',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});

module.exports = app;