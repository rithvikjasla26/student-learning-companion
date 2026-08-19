-- ============================================================================
-- Student Learning Companion - PostgreSQL Database Setup Script
-- ============================================================================
-- Run this script to create the complete database schema for the application
-- PostgreSQL 14+ required
-- ============================================================================

-- Step 1: Create database (if using local PostgreSQL without managed service)
-- Uncomment the line below if you're creating from scratch:
-- CREATE DATABASE student_companion_db;

-- Step 2: Create all tables with proper relationships

CREATE TABLE users (
  id VARCHAR(25) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('STUDENT', 'PARENT', 'ADMIN')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE students (
  id VARCHAR(25) PRIMARY KEY,
  user_id VARCHAR(25) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  grade_level INTEGER NOT NULL,
  subjects TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE parents (
  id VARCHAR(25) PRIMARY KEY,
  user_id VARCHAR(25) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE parent_students (
  id VARCHAR(25) PRIMARY KEY,
  parent_id VARCHAR(25) NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  student_id VARCHAR(25) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(parent_id, student_id)
);

CREATE TABLE invite_codes (
  id VARCHAR(25) PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  parent_id VARCHAR(25) NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  used_by VARCHAR(25),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_parent_expires (parent_id, expires_at)
);

CREATE TABLE topics (
  id VARCHAR(25) PRIMARY KEY,
  subject VARCHAR(100) NOT NULL,
  chapter VARCHAR(255) NOT NULL,
  subtopic VARCHAR(255) NOT NULL,
  exam_weight FLOAT NOT NULL DEFAULT 50.0,
  expected_concepts TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(subject, chapter, subtopic)
);

CREATE TABLE student_topic_progress (
  id VARCHAR(25) PRIMARY KEY,
  student_id VARCHAR(25) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  topic_id VARCHAR(25) NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  mastery_score INTEGER NOT NULL DEFAULT 0,
  confidence_score INTEGER NOT NULL DEFAULT 50,
  last_reviewed_at TIMESTAMP,
  next_due_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ease_factor FLOAT NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 1,
  repetitions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, topic_id),
  INDEX idx_student_due (student_id, next_due_at),
  INDEX idx_student (student_id)
);

CREATE TABLE check_in_sessions (
  id VARCHAR(25) PRIMARY KEY,
  student_id VARCHAR(25) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  topic_id VARCHAR(25),
  transcript TEXT,
  gap_type VARCHAR(50),
  ai_evaluation JSONB,
  reconfirmation_evaluation JSONB,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_student_date (student_id, created_at)
);

CREATE TABLE widgets (
  id VARCHAR(25) PRIMARY KEY,
  type VARCHAR(50) NOT NULL CHECK (type IN ('FLASHCARD', 'FILL_IN_BLANK', 'DRAG_DROP_LABEL')),
  content_json JSONB NOT NULL,
  difficulty VARCHAR(20) NOT NULL DEFAULT 'medium',
  topic_id VARCHAR(25) REFERENCES topics(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE widget_responses (
  id VARCHAR(25) PRIMARY KEY,
  widget_id VARCHAR(25) NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
  student_id VARCHAR(25) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_id VARCHAR(25) REFERENCES check_in_sessions(id) ON DELETE SET NULL,
  student_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_ms INTEGER NOT NULL DEFAULT 0,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE badges (
  id VARCHAR(25) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(255),
  criteria_type VARCHAR(50) NOT NULL,
  criteria_value INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE student_badges (
  id VARCHAR(25) PRIMARY KEY,
  student_id VARCHAR(25) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  badge_id VARCHAR(25) NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, badge_id)
);

CREATE TABLE student_stats (
  id VARCHAR(25) PRIMARY KEY,
  student_id VARCHAR(25) NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak_count INTEGER NOT NULL DEFAULT 0,
  last_check_in_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Step 3: Create indexes for optimized queries
-- ============================================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_parents_user_id ON parents(user_id);
CREATE INDEX idx_topics_subject ON topics(subject);
CREATE INDEX idx_check_in_sessions_topic ON check_in_sessions(topic_id);
CREATE INDEX idx_student_stats_student ON student_stats(student_id);

-- ============================================================================
-- Step 4: Seed initial data (CBSE Topics + Badges)
-- ============================================================================

-- Insert Sample CBSE Class 10 Topics
INSERT INTO topics (id, subject, chapter, subtopic, exam_weight, expected_concepts) VALUES
('topic_001', 'Science', 'Biology', 'Photosynthesis', 95.0, ARRAY['Light reaction', 'Dark reaction', 'Chlorophyll', 'Photolysis']),
('topic_002', 'Science', 'Physics', 'Refraction of Light', 90.0, ARRAY['Snell''s law', 'Refractive index', 'Critical angle', 'Total internal reflection']),
('topic_003', 'Science', 'Chemistry', 'Chemical Reactions', 85.0, ARRAY['Exothermic', 'Endothermic', 'Oxidation-reduction', 'Catalyst']),
('topic_004', 'Science', 'Biology', 'Respiration', 80.0, ARRAY['Aerobic respiration', 'Anaerobic respiration', 'Mitochondria', 'ATP']),
('topic_005', 'Science', 'Physics', 'Electricity', 92.0, ARRAY['Ohm''s law', 'Resistance', 'Current', 'Voltage']),
('topic_006', 'Science', 'Chemistry', 'Acids and Bases', 88.0, ARRAY['pH scale', 'Neutralization', 'Salt formation', 'Titration']),
('topic_007', 'Science', 'Physics', 'Motion', 85.0, ARRAY['Velocity', 'Acceleration', 'Distance', 'Displacement']),
('topic_008', 'Science', 'Biology', 'Heredity', 82.0, ARRAY['Genes', 'Alleles', 'Dominant', 'Recessive']);

-- Insert Badges
INSERT INTO badges (id, name, description, icon, criteria_type, criteria_value) VALUES
('badge_001', 'First Check-in', 'Completed your first check-in', '🎯', 'check_in_count', 1),
('badge_002', '7-Day Streak', 'Maintained a 7-day learning streak', '🔥', 'streak_days', 7),
('badge_003', 'Hundred XP', 'Earned 100 XP', '⭐', 'xp_threshold', 100),
('badge_004', 'Chapter Expert', 'Achieved 90% mastery on a topic', '🏆', 'topic_mastery', 90),
('badge_005', 'Consistent Learner', 'Completed 10 check-ins', '📚', 'check_in_count', 10);

-- ============================================================================
-- Step 5: Verify tables created
-- ============================================================================

-- Run this query to verify all tables were created:
-- SELECT table_name FROM information_schema.tables WHERE table_schema='public';

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- Database is now ready for the application to use.
-- The application will create additional schemas/migrations as needed.
--
-- Connection String Format:
-- postgresql://username:password@localhost:5432/student_companion_db
--
-- Next Steps:
-- 1. Verify tables: SELECT * FROM information_schema.tables WHERE table_schema='public';
-- 2. Check data: SELECT COUNT(*) FROM topics;
-- 3. Connect your application with the DATABASE_URL environment variable
-- ============================================================================
