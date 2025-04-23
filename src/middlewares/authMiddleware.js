// src/middlewares/authMiddleware.js
const authMiddleware = {
    // Vérifier si l'utilisateur est connecté
    isAuthenticated: (req, res, next) => {
      if (req.session && req.session.user) {
        return next();
      }
      
      // Enregistrer l'URL à laquelle l'utilisateur essayait d'accéder
      req.session.returnTo = req.originalUrl;
      
      req.flash('errorMessage', 'Veuillez vous connecter pour accéder à cette page');
      return res.redirect('/auth/login');
    },
    
    // Vérifier si l'utilisateur est un organisateur
    isOrganizer: (req, res, next) => {
      if (req.session && req.session.user && req.session.user.is_organizer) {
        return next();
      }
      
      req.flash('errorMessage', 'Vous devez être organisateur pour accéder à cette page');
      return res.redirect('/dashboard');
    },
    
    // Rediriger si l'utilisateur est déjà connecté
    redirectIfAuthenticated: (req, res, next) => {
      if (req.session && req.session.user) {
        return res.redirect('/dashboard');
      }
      
      return next();
    }
  };
  
  module.exports = authMiddleware;