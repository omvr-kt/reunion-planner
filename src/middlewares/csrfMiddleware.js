const { generateCSRFToken } = require('../utils/helpers');

const csrfMiddleware = {
  generate: (req, res, next) => {
    if (!req.session.csrfToken) {
      req.session.csrfToken = generateCSRFToken();
    }
    
    res.locals.csrfToken = req.session.csrfToken;
    next();
  },
  verify: (req, res, next) => {
    const token = req.body._csrf || req.query._csrf || req.headers['x-csrf-token'];
    
    if (!token || token !== req.session.csrfToken) {
      return res.status(403).render('pages/error', { 
        title: 'Erreur de sécurité',
        error: {
          message: 'Token CSRF invalide. Veuillez réessayer.'
        }
      });
    }
    
    next();
  }
};

module.exports = csrfMiddleware;