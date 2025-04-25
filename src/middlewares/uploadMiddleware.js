// src/middlewares/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer le dossier d'upload s'il n'existe pas
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration de Multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// Filtrer les types de fichiers
const fileFilter = (req, file, cb) => {
  // Pour les fichiers ICS
  if (file.fieldname === 'ics_file') {
    if (file.mimetype === 'text/calendar' || path.extname(file.originalname) === '.ics') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers .ics sont acceptés'), false);
    }
  } else {
    cb(null, true);
  }
};

// Créer l'instance Multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

module.exports = {
  upload
};