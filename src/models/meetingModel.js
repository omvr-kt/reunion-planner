// src/models/meetingModel.js
const db = require('../../config/database');

const meetingModel = {
  // Trouver les réunions par organisateur
  findByOrganizerId: async (organizerId) => {
    const query = `
      SELECT m.*, COUNT(mp.id) as participant_count
      FROM meetings m
      LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id
      WHERE m.organizer_id = $1
      GROUP BY m.id
      ORDER BY m.created_at DESC
    `;
    
    const result = await db.query(query, [organizerId]);
    return result.rows;
  },
  
  // Trouver les réunions par participant
  findByParticipantId: async (userId) => {
    const query = `
      SELECT m.*, u.first_name as organizer_first_name, u.last_name as organizer_last_name, mp.has_responded
      FROM meetings m
      JOIN meeting_participants mp ON m.id = mp.meeting_id
      JOIN users u ON m.organizer_id = u.id
      WHERE mp.user_id = $1
      ORDER BY m.created_at DESC
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows;
  }
};

module.exports = meetingModel;