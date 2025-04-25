// src/models/meetingModel.js
const db = require('../../config/database');
const { v4: uuidv4 } = require('uuid');

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
  },

  // Trouver une réunion par ID
  findById: async (id) => {
    const query = `
      SELECT m.*, u.first_name as organizer_first_name, u.last_name as organizer_last_name
      FROM meetings m
      JOIN users u ON m.organizer_id = u.id
      WHERE m.id = $1
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  // Créer une nouvelle réunion
  create: async (meetingData) => {
    const { title, description, location, organizer_id } = meetingData;
    
    const query = `
      INSERT INTO meetings (title, description, location, organizer_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [title, description, location, organizer_id];
    const result = await db.query(query, values);
    
    return result.rows[0];
  },

  // Mettre à jour une réunion
  update: async (id, meetingData) => {
    const { title, description, location } = meetingData;
    
    const query = `
      UPDATE meetings
      SET title = $1, description = $2, location = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
    
    const values = [title, description, location, id];
    const result = await db.query(query, values);
    
    return result.rows[0];
  },

  // Supprimer une réunion
  delete: async (id) => {
    const query = 'DELETE FROM meetings WHERE id = $1';
    return await db.query(query, [id]);
  },

  // Finaliser une réunion (choisir un créneau définitif)
  finalize: async (id, timeslotId) => {
    const query = `
      UPDATE meetings
      SET is_finalized = true, final_timeslot_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [timeslotId, id]);
    return result.rows[0];
  },

  // Ajouter un créneau à une réunion
  addTimeslot: async (meetingId, startTime, endTime) => {
    const query = `
      INSERT INTO timeslots (meeting_id, start_time, end_time)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const values = [meetingId, startTime, endTime];
    const result = await db.query(query, values);
    
    return result.rows[0];
  },

  // Obtenir tous les créneaux d'une réunion
  getTimeslots: async (meetingId) => {
    const query = `
      SELECT t.*, 
             (SELECT COUNT(*) FROM attendee_responses ar 
              JOIN meeting_participants mp ON ar.participant_id = mp.id 
              WHERE ar.timeslot_id = t.id AND ar.availability = true) as available_count,
             (SELECT COUNT(*) FROM meeting_participants WHERE meeting_id = $1) as total_participants
      FROM timeslots t
      WHERE t.meeting_id = $1
      ORDER BY t.start_time
    `;
    
    const result = await db.query(query, [meetingId]);
    return result.rows;
  },

  // Ajouter un participant à une réunion
  addParticipant: async (meetingId, email, userId = null) => {
    // Générer un token d'accès unique
    const accessToken = uuidv4();
    
    const query = `
      INSERT INTO meeting_participants (meeting_id, user_id, email, access_token)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [meetingId, userId, email, accessToken];
    const result = await db.query(query, values);
    
    return result.rows[0];
  },

  // Obtenir tous les participants d'une réunion
  getParticipants: async (meetingId) => {
    const query = `
      SELECT mp.*, u.first_name, u.last_name
      FROM meeting_participants mp
      LEFT JOIN users u ON mp.user_id = u.id
      WHERE mp.meeting_id = $1
      ORDER BY mp.created_at
    `;
    
    const result = await db.query(query, [meetingId]);
    return result.rows;
  },

  // Trouver un participant par token d'accès
  findParticipantByToken: async (token) => {
    const query = `
      SELECT mp.*, m.title as meeting_title
      FROM meeting_participants mp
      JOIN meetings m ON mp.meeting_id = m.id
      WHERE mp.access_token = $1
    `;
    
    const result = await db.query(query, [token]);
    return result.rows[0];
  },

  // Enregistrer la réponse d'un participant
  saveResponse: async (participantId, responses) => {
    // Commencer une transaction
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Supprimer les anciennes réponses
      await client.query('DELETE FROM attendee_responses WHERE participant_id = $1', [participantId]);
      
      // Insérer les nouvelles réponses
      for (const response of responses) {
        const { timeslot_id, availability } = response;
        
        await client.query(
          'INSERT INTO attendee_responses (participant_id, timeslot_id, availability) VALUES ($1, $2, $3)',
          [participantId, timeslot_id, availability]
        );
      }
      
      // Marquer le participant comme ayant répondu
      await client.query(
        'UPDATE meeting_participants SET has_responded = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [participantId]
      );
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Obtenir les réponses d'un participant
  getParticipantResponses: async (participantId) => {
    const query = `
      SELECT ar.timeslot_id, ar.availability
      FROM attendee_responses ar
      WHERE ar.participant_id = $1
    `;
    
    const result = await db.query(query, [participantId]);
    return result.rows;
  }
};

module.exports = meetingModel;