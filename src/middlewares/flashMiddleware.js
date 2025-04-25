// src/middlewares/flashMiddleware.js
module.exports = (req, res, next) => {
    // Initialiser req.flash s'il n'existe pas
    if (!req.flash) {
      req.flash = function(type, message) {
        if (!req.session.flash) {
          req.session.flash = {};
        }
        if (!req.session.flash[type]) {
          req.session.flash[type] = [];
        }
        req.session.flash[type].push(message);
      };
    }
    
    // Vérifier et récupérer les messages flash
    if (req.session.flash) {
      res.locals.successMessage = req.session.flash.success ? req.session.flash.success[0] : null;
      res.locals.errorMessage = req.session.flash.error ? req.session.flash.error[0] : null;
      
      // Supprimer les messages après les avoir récupérés
      delete req.session.flash;
    }
    
    // Rendre l'utilisateur disponible dans tous les templates
    if (req.session && req.session.user) {
      res.locals.user = req.session.user;
    }
    
    next();
  };