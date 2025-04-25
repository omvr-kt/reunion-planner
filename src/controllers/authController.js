// src/controllers/authController.js
const userModel = require('../models/userModel');

const authController = {
  // Afficher la page de connexion
  getLoginPage: (req, res) => {
    res.render('pages/auth/login', { title: 'Connexion' });
  },
  
  // Traiter la demande de connexion
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Vérifier si l'utilisateur existe
      const user = await userModel.findByEmail(email);
      if (!user) {
        req.flash('error', 'Email ou mot de passe incorrect');
        return res.redirect('/auth/login');
      }
      
      // Vérifier le mot de passe
      const isPasswordValid = await userModel.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        req.flash('error', 'Email ou mot de passe incorrect');
        return res.redirect('/auth/login');
      }
      
      // Créer la session utilisateur
      req.session.user = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_organizer: user.is_organizer
      };
      
      // Rediriger vers la page précédente ou le tableau de bord
      const redirectTo = req.session.returnTo || '/dashboard';
      delete req.session.returnTo;
      
      req.flash('success', 'Connexion réussie');
      res.redirect(redirectTo);
    } catch (error) {
      console.error('Erreur de connexion:', error);
      req.flash('error', 'Une erreur s\'est produite lors de la connexion');
      res.redirect('/auth/login');
    }
  },
  
  // Afficher la page d'inscription
  getRegisterPage: (req, res) => {
    res.render('pages/auth/register', { title: 'Inscription' });
  },
  
  // Traiter la demande d'inscription
  register: async (req, res) => {
    try {
      const { email, password, confirm_password, first_name, last_name, is_organizer } = req.body;
      
      // Vérifier si les mots de passe correspondent
      if (password !== confirm_password) {
        req.flash('error', 'Les mots de passe ne correspondent pas');
        return res.redirect('/auth/register');
      }
      
      // Vérifier si l'email existe déjà
      const existingUser = await userModel.findByEmail(email);
      if (existingUser) {
        req.flash('error', 'Cet email est déjà utilisé');
        return res.redirect('/auth/register');
      }
      
      // Créer le nouvel utilisateur
      const newUser = await userModel.create({
        email,
        password,
        first_name,
        last_name,
        is_organizer: is_organizer === 'on'
      });
      
      // Créer la session utilisateur
      req.session.user = {
        id: newUser.id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        is_organizer: newUser.is_organizer
      };
      
      req.flash('success', 'Inscription réussie');
      res.redirect('/dashboard');
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      req.flash('error', 'Une erreur s\'est produite lors de l\'inscription');
      res.redirect('/auth/register');
    }
  },
  
  // Déconnexion
  logout: (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Erreur de déconnexion:', err);
      }
      res.redirect('/');
    });
  }
};

module.exports = authController;