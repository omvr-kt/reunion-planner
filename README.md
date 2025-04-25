Plateforme de Planification de Réunions
Cette application web permet aux utilisateurs de proposer, visualiser et valider des dates de réunion en fonction de leurs disponibilités. Conçue pour offrir une expérience utilisateur fluide et intuitive, elle minimise le nombre de clics nécessaires pour organiser des réunions.
Fonctionnalités
Gestion des utilisateurs

Deux types d'utilisateurs : organisateurs et participants
Système d'authentification pour les utilisateurs enregistrés
Possibilité de participer sans inscription via un lien unique

Création et gestion des réunions

Proposition de multiples créneaux horaires
Invitation de participants par email
Modification des réunions existantes
Finalisation avec choix du créneau définitif

Réponses des participants

Interface intuitive pour indiquer ses disponibilités
Import de fichiers de calendrier (.ics) pour analyse automatique des disponibilités
Visualisation claire des disponibilités de tous les participants

Expérience utilisateur optimisée

Interface responsive (mobile, tablette, ordinateur)
Affichage interactif (calendrier/liste)
Notifications par email

Technologies utilisées

Frontend : HTML, CSS, JavaScript, Bootstrap, jQuery
Backend : Node.js, Express
Base de données : PostgreSQL
Templates : EJS
Autres : Multer (upload de fichiers), bcrypt (chiffrement), ical (parsing de calendriers)

Installation

Clonez le dépôt
git clone https://github.com/username/plateforme-reunion.git
cd plateforme-reunion

Installez les dépendances
npm install

Configurez le fichier .env (voir .env.example)
# Configuration du serveur
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000

# Configuration de la base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=reunion_db
DB_USER=your_username
DB_PASSWORD=your_password

# Configuration des emails
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=your_email@example.com
MAIL_PASS=your_password
MAIL_FROM=Planificateur <noreply@your-app.com>

# Secret pour les sessions
SESSION_SECRET=your_secret_key

Initialisez la base de données
psql -U your_username -d postgres -c "CREATE DATABASE reunion_db;"
psql -U your_username -d reunion_db -f db/init.sql

Démarrez l'application
npm start
Pour le développement, utilisez :
npm run dev

Accédez à l'application dans votre navigateur : http://localhost:3000

Structure du projet
projet-reunion/
├── node_modules/
├── public/                    # Fichiers statiques
│   ├── css/                   # Styles CSS et Bootstrap
│   ├── js/                    # Scripts jQuery et JavaScript
│   ├── img/                   # Images
│   └── uploads/               # Fichiers .ics importés
├── views/                     # Templates EJS
│   ├── partials/              # Éléments réutilisables
│   ├── pages/                 # Pages principales
│   │   ├── auth/              # Pages d'authentification
│   │   ├── dashboard/         # Pages du tableau de bord
│   │   ├── meetings/          # Pages de gestion des réunions
│   │   └── participant/       # Pages pour participants
│   └── emails/                # Templates pour les emails
├── src/                       # Code source principal
│   ├── routes/                # Routes Express
│   ├── controllers/           # Logique métier
│   ├── models/                # Modèles de données
│   ├── services/              # Services (email, ics parser, etc.)
│   ├── middlewares/           # Middlewares personnalisés
│   └── utils/                 # Fonctions utilitaires
├── config/                    # Configuration de l'application
├── db/                        # Scripts SQL
├── app.js                     # Point d'entrée de l'application
├── package.json
└── README.md
Utilisation
En tant qu'organisateur

Inscrivez-vous et connectez-vous
Créez une nouvelle réunion
Ajoutez des créneaux horaires et invitez des participants
Consultez les réponses et finalisez le créneau définitif

En tant que participant

Recevez un email d'invitation avec un lien unique
Indiquez vos disponibilités manuellement ou importez votre calendrier .ics
Recevez une notification quand le créneau définitif est choisi

Développement
Workflow Git

Branche main : version stable
Branche develop : développement principal
Branches de fonctionnalités : feature/nom-de-la-fonctionnalite
Branches de corrections : fix/description-du-bug

Commandes utiles
# Lancer en mode développement avec rechargement automatique
npm run dev

# Lancer les tests
npm test

# Linter le code
npm run lint