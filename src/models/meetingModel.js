const db = require('../../config/database');
const { v4: uuidv4 } = require('uuid');

const meetingModel = {
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

  delete: async (id) => {
    const query = 'DELETE FROM meetings WHERE id = $1';
    return await db.query(query, [id]);
  },
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

  addParticipant: async (meetingId, email, userId = null, timezone = 'Europe/Paris') => {
    const accessToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    const query = `
      INSERT INTO meeting_participants (meeting_id, user_id, email, access_token, token_expires_at, timezone)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [meetingId, userId, email, accessToken, expiresAt, timezone];
    const result = await db.query(query, values);
    
    return result.rows[0];
  },
  
  updateParticipantTimezone: async (participantId, timezone) => {
    const query = `
      UPDATE meeting_participants
      SET timezone = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [timezone, participantId]);
    return result.rows[0];
  },

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

  saveResponse: async (participantId, responses) => {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      await client.query('DELETE FROM attendee_responses WHERE participant_id = $1', [participantId]);
      
      for (const response of responses) {
        const { timeslot_id, availability } = response;
        
        await client.query(
          'INSERT INTO attendee_responses (participant_id, timeslot_id, availability) VALUES ($1, $2, $3)',
          [participantId, timeslot_id, availability]
        );
      }
      
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

  getParticipantResponses: async (participantId) => {
    const query = `
      SELECT ar.timeslot_id, ar.availability
      FROM attendee_responses ar
      WHERE ar.participant_id = $1
    `;
    
    const result = await db.query(query, [participantId]);
    return result.rows;
  },
  
  addDocument: async (meetingId, userId, fileData) => {
    const { originalname, filename, path, size, mimetype } = fileData;
    
    const query = `
      INSERT INTO meeting_documents (meeting_id, uploaded_by, file_name, original_name, file_path, file_size, file_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [meetingId, userId, filename, originalname, path, size, mimetype];
    const result = await db.query(query, values);
    
    return result.rows[0];
  },
  
  getDocuments: async (meetingId) => {
    const query = `
      SELECT md.*, u.first_name, u.last_name
      FROM meeting_documents md
      LEFT JOIN users u ON md.uploaded_by = u.id
      WHERE md.meeting_id = $1
      ORDER BY md.created_at DESC
    `;
    
    const result = await db.query(query, [meetingId]);
    return result.rows;
  },
  
  getDocumentById: async (documentId) => {
    const query = `
      SELECT *
      FROM meeting_documents
      WHERE id = $1
    `;
    
    const result = await db.query(query, [documentId]);
    return result.rows[0];
  },
  
  getAvailabilityStats: async (meetingId) => {
    const query = `
      SELECT 
        t.id as timeslot_id,
        t.start_time,
        t.end_time,
        (SELECT COUNT(*) FROM meeting_participants WHERE meeting_id = $1) as total_participants,
        (SELECT COUNT(*) FROM attendee_responses ar 
         JOIN meeting_participants mp ON ar.participant_id = mp.id 
         WHERE ar.timeslot_id = t.id AND ar.availability = true AND mp.meeting_id = $1) as available_count,
        (SELECT COUNT(*) FROM attendee_responses ar 
         JOIN meeting_participants mp ON ar.participant_id = mp.id 
         WHERE ar.timeslot_id = t.id AND ar.availability = false AND mp.meeting_id = $1) as unavailable_count,
        (SELECT COUNT(*) FROM attendee_responses ar 
         JOIN meeting_participants mp ON ar.participant_id = mp.id 
         WHERE ar.timeslot_id = t.id AND mp.meeting_id = $1) as response_count
      FROM timeslots t
      WHERE t.meeting_id = $1
      ORDER BY t.start_time
    `;
    
    const result = await db.query(query, [meetingId]);
    return result.rows;
  }
};

module.exports = meetingModel;