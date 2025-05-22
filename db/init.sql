-- db/init.sql
CREATE DATABASE reunion_db;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_organizer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE meetings (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    organizer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_finalized BOOLEAN DEFAULT FALSE,
    final_timeslot_id INTEGER,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_type VARCHAR(20), -- 'daily', 'weekly', 'monthly'
    recurrence_count INTEGER, -- nombre de répétitions
    recurrence_end_date DATE, -- date de fin de récurrence (alternative au nombre)
    parent_meeting_id INTEGER REFERENCES meetings(id) ON DELETE SET NULL, -- pour lier les instances récurrentes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE timeslots (
    id SERIAL PRIMARY KEY,
    meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE meeting_participants (
    id SERIAL PRIMARY KEY,
    meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    access_token VARCHAR(255) NOT NULL UNIQUE,
    token_expires_at TIMESTAMP,
    timezone VARCHAR(100) DEFAULT 'Europe/Paris',
    has_responded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attendee_responses (
    id SERIAL PRIMARY KEY,
    participant_id INTEGER NOT NULL REFERENCES meeting_participants(id) ON DELETE CASCADE,
    timeslot_id INTEGER NOT NULL REFERENCES timeslots(id) ON DELETE CASCADE,
    availability BOOLEAN NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(participant_id, timeslot_id)
);

CREATE TABLE meeting_documents (
    id SERIAL PRIMARY KEY,
    meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE session (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL,
    CONSTRAINT session_pkey PRIMARY KEY (sid)
);

CREATE INDEX ON meeting_participants (meeting_id);
CREATE INDEX ON meeting_participants (email);
CREATE INDEX ON meeting_participants (access_token);
CREATE INDEX ON timeslots (meeting_id);
CREATE INDEX ON attendee_responses (participant_id);
CREATE INDEX ON attendee_responses (timeslot_id);
CREATE INDEX ON meetings (is_recurring);
CREATE INDEX ON meetings (parent_meeting_id);
CREATE INDEX idx_session_expire ON session (expire);

INSERT INTO users (email, password, first_name, last_name, is_organizer)
VALUES
    ('admin@example.com', '$2b$10$zP2DRSyg8VNJx.AG5zYTuewP8xK2cH4JLR1Q9nR4W/P0JRIj2h85.', 'Admin', 'User', TRUE),
    ('user1@example.com', '$2b$10$zP2DRSyg8VNJx.AG5zYTuewP8xK2cH4JLR1Q9nR4W/P0JRIj2h85.', 'John', 'Doe', FALSE),
    ('user2@example.com', '$2b$10$zP2DRSyg8VNJx.AG5zYTuewP8xK2cH4JLR1Q9nR4W/P0JRIj2h85.', 'Jane', 'Smith', FALSE);

INSERT INTO meetings (title, description, location, organizer_id)
VALUES ('Réunion de planification', 'Discussion sur les objectifs du projet', 'Salle de conférence A', 1);

INSERT INTO timeslots (meeting_id, start_time, end_time)
VALUES 
    (1, '2025-05-10 09:00:00', '2025-05-10 10:00:00'),
    (1, '2025-05-10 14:00:00', '2025-05-10 15:00:00'),
    (1, '2025-05-11 11:00:00', '2025-05-11 12:00:00');

INSERT INTO meeting_participants (meeting_id, user_id, email, access_token)
VALUES 
    (1, 2, 'user1@example.com', 'token123'),
    (1, 3, 'user2@example.com', 'token456'),
    (1, NULL, 'external@example.com', 'token789');

INSERT INTO attendee_responses (participant_id, timeslot_id, availability)
VALUES 
    (1, 1, TRUE),
    (1, 2, FALSE),
    (1, 3, TRUE),
    (2, 1, FALSE),
    (2, 2, TRUE),
    (2, 3, TRUE);