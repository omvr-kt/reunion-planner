// src/models/userModel.js
const db = require('../../config/database');
const bcrypt = require('bcrypt');

const userModel = {
  // Trouver un utilisateur par email
  findByEmail: async (email) => {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0];
  },

  // Trouver un utilisateur par id
  findById: async (id) => {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  // Créer un nouvel utilisateur
  create: async (userData) => {
    const { email, password, first_name, last_name, is_organizer } = userData;

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (email, password, first_name, last_name, is_organizer)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [email, hashedPassword, first_name, last_name, is_organizer || false];
    const result = await db.query(query, values);
    
    return result.rows[0];
  },

  // Vérifier le mot de passe
  verifyPassword: async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },

  // Mettre à jour un utilisateur
  update: async (id, userData) => {
    const { email, first_name, last_name, is_organizer } = userData;
    
    const query = `
      UPDATE users
      SET email = $1, first_name = $2, last_name = $3, is_organizer = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
    
    const values = [email, first_name, last_name, is_organizer, id];
    const result = await db.query(query, values);
    
    return result.rows[0];
  },

  // Mettre à jour le mot de passe
  updatePassword: async (id, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const query = `
      UPDATE users
      SET password = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id
    `;
    
    const result = await db.query(query, [hashedPassword, id]);
    return result.rows[0];
  }
};

module.exports = userModel;