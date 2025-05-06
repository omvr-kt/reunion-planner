const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const icsController = require('../controllers/icsController');
const authMiddleware = require('../middlewares/authMiddleware');
const validationMiddleware = require('../middlewares/validationMiddleware');
const csrfMiddleware = require('../middlewares/csrfMiddleware');
const { upload } = require('../middlewares/uploadMiddleware');

router.get('/create', authMiddleware.isAuthenticated, authMiddleware.isOrganizer, meetingController.getCreatePage);
router.post('/create', 
    authMiddleware.isAuthenticated, 
    authMiddleware.isOrganizer, 
    csrfMiddleware.verify, 
    validationMiddleware.validateMeeting, 
    meetingController.create
);

router.get('/:id/edit', authMiddleware.isAuthenticated, meetingController.getEditPage);
router.post('/:id/update', 
    authMiddleware.isAuthenticated, 
    csrfMiddleware.verify, 
    validationMiddleware.validateMeeting, 
    meetingController.update
);
router.post('/:id/finalize', 
    authMiddleware.isAuthenticated, 
    authMiddleware.isOrganizer, 
    csrfMiddleware.verify, 
    meetingController.finalize
);

router.get('/:id/export-ics', authMiddleware.isAuthenticated, meetingController.exportToICS);

router.get('/:id', authMiddleware.isAuthenticated, meetingController.getDetails);

router.get('/:id/calendar', authMiddleware.isAuthenticated, meetingController.getCalendarView);

router.get('/:id/documents', authMiddleware.isAuthenticated, meetingController.getDocumentsPage);
router.post('/:id/upload-document', 
    authMiddleware.isAuthenticated, 
    upload.single('document'), 
    csrfMiddleware.verify, 
    meetingController.uploadDocument
);
router.get('/:id/documents/:documentId', authMiddleware.isAuthenticated, meetingController.downloadDocument);

router.post('/set-timezone', 
    authMiddleware.isAuthenticated, 
    csrfMiddleware.verify, 
    meetingController.setTimezone
);

router.get('/respond/:token', meetingController.getResponsePage);
router.post('/respond/:token', meetingController.saveResponse);
router.post('/respond/:token/set-timezone', meetingController.setParticipantTimezone);
router.post('/respond/:token/upload-ics', upload.single('ics_file'), icsController.analyzeIcsFile);
router.get('/respond/:token/export-ics', meetingController.exportToICSPublic);

module.exports = router;