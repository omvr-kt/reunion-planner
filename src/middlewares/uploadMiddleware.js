const multer = require('multer');
const path = require('path');
const fs = require('fs');

const baseUploadDir = path.join(__dirname, '../../public/uploads');
const icsUploadDir = path.join(baseUploadDir, 'ics');
const documentsUploadDir = path.join(baseUploadDir, 'documents');

if (!fs.existsSync(baseUploadDir)) {
  fs.mkdirSync(baseUploadDir, { recursive: true });
}
if (!fs.existsSync(icsUploadDir)) {
  fs.mkdirSync(icsUploadDir, { recursive: true });
}
if (!fs.existsSync(documentsUploadDir)) {
  fs.mkdirSync(documentsUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'ics_file') {
      cb(null, icsUploadDir);
    } else if (file.fieldname === 'document') {
      cb(null, documentsUploadDir);
    } else {
      cb(null, baseUploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'ics_file') {
    if (file.mimetype === 'text/calendar' || path.extname(file.originalname).toLowerCase() === '.ics') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers .ics sont acceptés'), false);
    }
  } 
  else if (file.fieldname === 'document') {
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/jpeg',
      'image/png'
    ];
    if (allowedTypes.includes(file.mimetype) || 
        ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.jpg', '.jpeg', '.png']
          .includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non supporté. Les formats acceptés sont PDF, Word, Excel, PowerPoint, texte et images.'), false);
    }
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

module.exports = {
  upload
};