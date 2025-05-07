# ReunionPlanner

Application web permettant l'organisation, la gestion et la planification collaborative de réunions d'une manière robuste et sécurisée.

## Principales fonctionnalités

### Système d'authentification et autorisation multiniveau

- **Gestion des rôles utilisateurs** : Distinction entre organisateurs (droits étendus) et participants (droits limités)
- **Système de tokens JWT** avec expiration pour authentification persistante
- **Protection contre le CSRF** via helmet
- **Sessions sécurisées** avec cookies HttpOnly et options SameSite pour prévenir les attaques XSS

### Gestion avancée des réunions

- **Système de proposition multi-créneaux**
- **Système de votes** pour les participants avec visualisation en temps réel
- **Notification par email** à tous les participants

### Gestion des fuseaux horaires

- **Support de plusieurs fuseaux horaires**
- **Détection automatique** du fuseau horaire de l'utilisateur
- **Conversion dynamique** des horaires selon les préférences utilisateurs

### Import/Export avancés

- **Parsing de fichiers iCalendar (.ics)** pour analyse automatique des disponibilités
- **Export au format .ics** des réunions planifiées pour intégration au calendrier personnel

### Système de partage de documents

- **Upload** avec validation de type MIME
- **Contrôle d'accès** pour chaque document

### Design responsive

- **Interface adaptive** avec grille CSS optimisée pour mobiles, tablettes et desktop
- **Composants d'interface optimisés** pour chaque taille d'écran
- **Tests cross-browser** sur Chrome, Firefox, Safari et Edge

### Sécurité

- **Protection XSS complète** via DOMPurify
- **Sanitization** de toutes les entrées utilisateur

### Architecture technique

#### Frontend
- **Framework HTML/CSS/JS** avec Bootstrap 5
- **Manipulation DOM optimisée** via jQuery
- **Validation côté client** avec schémas JSON
- **Architecture modulaire** avec composants réutilisables
- **Lazy loading** pour optimisation des performances

#### Backend
- **Architecture MVC** sur Node.js/Express
- **ORM personnalisé** pour PostgreSQL avec pool de connexions
- **Middleware Express** personnalisé pour chaque fonctionnalité

#### Base de données
- **PostgreSQL** avec indexation et transactions ACID
- **Schéma relationnel optimisé** avec clés étrangères et contraintes
- **Requêtes paramétrées** pour prévenir les injections SQL

## Architecture technique détaillée

### Structure de la base de données
```
┌───────────────────┐      ┌───────────────────┐
│     users         │      │    meetings       │
├───────────────────┤      ├───────────────────┤
│ id                │      │ id                │
│ email             │      │ title             │
│ password          │      │ description       │
│ first_name        │      │ location          │
│ last_name         │      │ organizer_id      │◄─┐
│ is_organizer      │      │ is_finalized      │  │
│ created_at        │      │ final_timeslot_id │◄┐│
│ updated_at        │      │ created_at        │ ││
└───────┬───────────┘      │ updated_at        │ ││
        │                  └─────────┬─────────┘ ││
        │                            │           ││
        │                            │           ││
        │                  ┌─────────▼─────────┐ ││
        │                  │     timeslots     │ ││
        │                  ├───────────────────┤ ││
        │                  │ id                │◄┘│
        │                  │ meeting_id        │◄─┘
        │                  │ start_time        │
        │                  │ end_time          │
        │                  │ created_at        │
        │                  └─────────┬─────────┘
        │                            │
┌───────▼───────────┐      ┌─────────▼─────────┐
│meeting_participants│      │attendee_responses │
├───────────────────┤      ├───────────────────┤
│ id                │      │ id                │
│ meeting_id        │◄─┐   │ participant_id    │◄─┐
│ user_id           │◄─┘   │ timeslot_id       │◄─┘
│ email             │      │ availability      │
│ access_token      │      │ comment           │
│ token_expires_at  │      │ created_at        │
│ timezone          │      │ updated_at        │
│ has_responded     │      └───────────────────┘
│ created_at        │
│ updated_at        │      ┌───────────────────┐
└───────────────────┘      │ meeting_documents │
                           ├───────────────────┤
                           │ id                │
                           │ meeting_id        │◄─┐
                           │ uploaded_by       │◄─┘
                           │ file_name         │
                           │ original_name     │
                           │ file_path         │
                           │ file_size         │
                           │ file_type         │
                           │ created_at        │
                           └───────────────────┘
```

## Installation

### Prérequis
- Node.js v16+
- PostgreSQL 13+
- npm ou yarn

### Clonage et configuration
```bash
# Cloner le dépôt
git clone https://moule.informatique.univ-paris-diderot.fr/guessoum/reunion-planner
cd reunion-planner

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer le fichier .env avec vos configurations
```

### Initialisation de la base de données
```bash
# Créer la base de données
psql -U your_username -d postgres -c "CREATE DATABASE reunion_db;"

# Initialiser les tables et données 
psql -U your_username -d reunion_db -f db/init.sql
```

### Démarrage de l'application
```bash
# Mode production
npm start

# Mode développement avec hot reload
npm run dev
```

## Structure complète du projet
```
plateforme-reunion/
├── node_modules/
├── public/                    # Fichiers statiques
│   ├── css/                   # Styles CSS et Bootstrap
│   │   └── style.css          # Styles personnalisés
│   ├── js/                    # Scripts jQuery et JavaScript
│   │   ├── main.js            # Script principal
│   │   └── script.js          # Fonctions utilitaires
│   ├── img/                   # Images
│   └── uploads/               # Fichiers uploadés (ics, documents)
│       ├── documents/         # Documents partagés
│       └── ics/               # Fichiers calendrier importés
├── views/                     # Templates EJS
│   ├── partials/              # Éléments réutilisables
│   │   ├── header.ejs         # En-tête de page
│   │   └── footer.ejs         # Pied de page
│   ├── pages/                 # Pages principales
│   │   ├── 404.ejs            # Page non trouvée
│   │   ├── error.ejs          # Erreur générique
│   │   ├── home.ejs           # Page d'accueil
│   │   ├── auth/              # Pages d'authentification
│   │   │   ├── login.ejs      # Connexion
│   │   │   └── register.ejs   # Inscription
│   │   ├── dashboard/         # Pages du tableau de bord
│   │   │   └── index.ejs      # Vue principale
│   │   ├── meetings/          # Pages de gestion des réunions
│   │   │   ├── calendar.ejs   # Vue calendrier
│   │   │   ├── create.ejs     # Création
│   │   │   ├── details.ejs    # Détails
│   │   │   ├── documents.ejs  # Gestion des documents
│   │   │   ├── edit.ejs       # Modification
│   │   │   ├── invalid-token.ejs  # Token invalide
│   │   │   ├── list.ejs       # Liste des réunions
│   │   │   ├── respond.ejs    # Réponse à invitation
│   │   │   └── response-success.ejs  # Confirmation
│   │   └── participant/       # Pages pour participants
│   │       └── respond.ejs    # Réponse aux invitations
│   └── emails/                # Templates pour les emails
│       └── invitation.ejs     # Email d'invitation
├── src/                       # Code source principal
│   ├── routes/                # Routes Express
│   │   ├── authRoutes.js      # Routes d'authentification
│   │   ├── dashboardRoutes.js # Routes du tableau de bord
│   │   ├── index.js           # Point d'entrée des routes
│   │   └── meetingRoutes.js   # Routes des réunions
│   ├── controllers/           # Logique métier
│   │   ├── authController.js  # Gestion de l'authentification
│   │   ├── dashboardController.js # Gestion du tableau de bord
│   │   ├── icsController.js   # Gestion des fichiers ics
│   │   ├── meetingController.js # Gestion des réunions
│   │   └── userController.js  # Gestion des utilisateurs
│   ├── models/                # Modèles de données
│   │   ├── meetingModel.js    # Modèle de réunion
│   │   └── userModel.js       # Modèle d'utilisateur
│   ├── services/              # Services métier
│   │   ├── icsService.js      # Service pour les calendriers
│   │   └── mailService.js     # Service d'envoi d'emails
│   ├── middlewares/           # Middlewares personnalisés
│   │   ├── authMiddleware.js  # Middleware d'authentification
│   │   ├── csrfMiddleware.js  # Protection CSRF
│   │   ├── flashMiddleware.js # Messages flash
│   │   ├── rateLimit.js       # Limitation de requêtes
│   │   ├── uploadMiddleware.js # Gestion des uploads
│   │   └── validationMiddleware.js # Validation des données
│   └── utils/                 # Fonctions utilitaires
│       └── helpers.js         # Fonctions d'aide diverses
├── config/                    # Configuration de l'application
│   ├── app.js                 # Configuration de l'app Express
│   └── database.js            # Configuration de la BDD
├── db/                        # Scripts SQL
│   └── init.sql               # Initialisation de la BDD
├── app.js                     # Point d'entrée de l'application
├── package.json               # Dépendances et scripts
├── .env.example               # Exemple de configuration
└── README.md                  # Documentation
```