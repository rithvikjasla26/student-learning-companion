# Database Setup Guide - Student Learning Companion

**Last Updated:** August 19, 2026
**Database:** PostgreSQL 14+
**ORM:** Prisma 5.8

---

## Quick Start (Using Prisma - Recommended)

If you're setting up the application for the first time, **use Prisma** (easier, recommended):

```bash
cd packages/backend

# 1. Create .env with DATABASE_URL
cp .env.example .env
# Edit .env and set: DATABASE_URL=postgresql://user:password@localhost:5432/student_companion_db

# 2. Run migrations (creates all tables)
npx prisma migrate dev --name init

# 3. Seed with sample data
npx prisma db seed

# 4. View database visually (optional)
npx prisma studio
```

**Done!** Your database is ready. Skip to "Verify Setup" below.

---

## Alternative: Using Raw SQL Script

If you prefer direct SQL or need to set up without Prisma:

### Prerequisites
- PostgreSQL 14+ installed and running
- `psql` command-line tool
- Database user with CREATE DATABASE privileges

### Step 1: Create the Database

```bash
# Connect to PostgreSQL as admin user
psql -U postgres

# Inside psql:
CREATE DATABASE student_companion_db;
CREATE USER app_user WITH PASSWORD 'secure_password_here';
ALTER ROLE app_user SET client_encoding TO 'utf8';
ALTER ROLE app_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE app_user SET default_transaction_deferrable TO on;
ALTER ROLE app_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE student_companion_db TO app_user;
\q
```

### Step 2: Run the SQL Script

```bash
# Option A: Using the provided script
psql -U app_user -d student_companion_db -f DATABASE_SETUP.sql

# Option B: Copy-paste the entire script
psql -U app_user -d student_companion_db
# Then paste contents of DATABASE_SETUP.sql and press Ctrl+D
```

### Step 3: Verify Setup

```bash
psql -U app_user -d student_companion_db

# Check tables were created:
\dt

# Count records:
SELECT COUNT(*) FROM topics;      -- Should show 8
SELECT COUNT(*) FROM badges;      -- Should show 5

# View topics:
SELECT subject, chapter, subtopic FROM topics ORDER BY subject;

# Exit:
\q
```

---

## Environment Variables Setup

Create `.env` in `packages/backend/` with these values:

```bash
# Database (using our new credentials)
DATABASE_URL=postgresql://app_user:secure_password_here@localhost:5432/student_companion_db

# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Authentication
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Email/OTP (stub for MVP)
OTP_EXPIRY_MINUTES=10

# App Settings
NODE_ENV=development
BACKEND_PORT=5000
FRONTEND_URL=http://localhost:5173

# Scheduler
SCHEDULER_TIMEZONE=Asia/Kolkata
```

---

## Database Schema Overview

### Core Tables (13 total)

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| **users** | Authentication | id, email, role (STUDENT/PARENT/ADMIN) |
| **students** | Student profiles | id, user_id, name, grade_level, subjects |
| **parents** | Parent profiles | id, user_id, name |
| **parent_students** | M2M linking | parent_id, student_id |
| **invite_codes** | Parent invitations | code, parent_id, expires_at, used_by |
| **topics** | CBSE curriculum | subject, chapter, subtopic, exam_weight, expected_concepts |
| **student_topic_progress** | Learning progress | mastery_score, confidence_score, SM-2 metrics |
| **check_in_sessions** | Daily check-ins | student_id, topic_id, transcript, ai_evaluation |
| **widgets** | Practice widgets | type (FLASHCARD/FILL_IN_BLANK/DRAG_DROP_LABEL), content_json |
| **widget_responses** | Widget attempts | widget_id, student_id, student_answer, is_correct |
| **badges** | Achievement definitions | name, description, criteria_type, criteria_value |
| **student_badges** | Earned badges | student_id, badge_id, earned_at |
| **student_stats** | Denormalized stats | student_id, total_xp, level, streak_count |

### Relationships

```
users (1) ──── (1) students
         └──── (1) parents

parents (1) ──── (M) parent_students ──── (M) students
        (1) ──── (M) invite_codes

students (1) ──── (M) check_in_sessions
         (1) ──── (M) student_topic_progress
         (1) ──── (M) widget_responses
         (1) ──── (M) student_badges
         (1) ──── (1) student_stats

topics (1) ──── (M) student_topic_progress
       (1) ──── (M) widgets

widgets (1) ──── (M) widget_responses

badges (1) ──── (M) student_badges

check_in_sessions (1) ──── (M) widget_responses
```

### Key Indexes

Created for query performance:

```sql
-- Student lookup
idx_student_due (student_id, next_due_at)    -- For scheduler
idx_student (student_id)                      -- For general queries

-- Check-in history
idx_student_date (student_id, created_at)    -- For paginated history

-- Invite code lookup
idx_code (code)                               -- Fast code lookup
idx_parent_expires (parent_id, expires_at)   -- Expiry cleanup
```

---

## Sample Data Included

### 8 CBSE Class 10 Topics

| Subject | Chapter | Subtopic | Weight |
|---------|---------|----------|--------|
| Science | Biology | Photosynthesis | 95% |
| Science | Physics | Refraction of Light | 90% |
| Science | Chemistry | Chemical Reactions | 85% |
| Science | Biology | Respiration | 80% |
| Science | Physics | Electricity | 92% |
| Science | Chemistry | Acids and Bases | 88% |
| Science | Physics | Motion | 85% |
| Science | Biology | Heredity | 82% |

### 5 Badges

1. **First Check-in** - Complete 1 check-in
2. **7-Day Streak** - Maintain 7-day streak
3. **Hundred XP** - Earn 100 XP
4. **Chapter Expert** - Achieve 90% mastery
5. **Consistent Learner** - Complete 10 check-ins

---

## Verify Setup

### Using Prisma Studio (Visual Database)

```bash
cd packages/backend
npx prisma studio
# Opens http://localhost:5555 - visual database browser
```

### Using psql

```bash
psql -U app_user -d student_companion_db

-- Count tables
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';

-- List all tables
SELECT table_name FROM information_schema.tables WHERE table_schema='public';

-- Check data
SELECT COUNT(*) as topic_count FROM topics;
SELECT COUNT(*) as badge_count FROM badges;

-- View topics
SELECT subject, chapter, subtopic, exam_weight FROM topics ORDER BY subject;

-- View badges
SELECT name, criteria_type, criteria_value FROM badges;
```

---

## Connecting Your Application

### Backend (.env)

```bash
DATABASE_URL=postgresql://app_user:secure_password_here@localhost:5432/student_companion_db
```

### Test Connection

```bash
cd packages/backend

# With Prisma:
npx prisma db execute --stdin <<'EOF'
SELECT version();
EOF

# Or directly:
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect().then(() => console.log('✅ Connected')).catch(e => console.error('❌ Failed', e));
"
```

---

## Creating a New Student (Manual Setup)

If you need to manually create test data:

```sql
-- 1. Create user
INSERT INTO users (id, email, role) VALUES
  ('user_student1', 'student@example.com', 'STUDENT');

-- 2. Create student
INSERT INTO students (id, user_id, name, grade_level, subjects) VALUES
  ('student_1', 'user_student1', 'John Doe', 10, ARRAY['Science', 'Math']);

-- 3. Create student stats
INSERT INTO student_stats (id, student_id) VALUES
  ('stats_1', 'student_1');

-- 4. Link student to topics
INSERT INTO student_topic_progress (id, student_id, topic_id) VALUES
  ('progress_1', 'student_1', 'topic_001'),
  ('progress_2', 'student_1', 'topic_002');

-- Verify
SELECT * FROM students WHERE id = 'student_1';
SELECT COUNT(*) FROM student_topic_progress WHERE student_id = 'student_1';
```

---

## Database Maintenance

### Backup Database

```bash
# Full backup
pg_dump -U app_user student_companion_db > backup.sql

# With compression
pg_dump -U app_user student_companion_db | gzip > backup.sql.gz
```

### Restore Database

```bash
# From SQL file
psql -U app_user -d student_companion_db < backup.sql

# From compressed file
gunzip -c backup.sql.gz | psql -U app_user -d student_companion_db
```

### Reset Database (Development Only!)

```bash
# With Prisma:
cd packages/backend
npx prisma migrate reset  # Drops & recreates schema, re-runs seeds

# With SQL:
psql -U app_user -d student_companion_db -c "
  DROP SCHEMA public CASCADE;
  CREATE SCHEMA public;
"
# Then re-run DATABASE_SETUP.sql
```

### Clean Old Data

```sql
-- Remove old check-in sessions (older than 90 days)
DELETE FROM check_in_sessions
WHERE created_at < NOW() - INTERVAL '90 days';

-- Archive widget responses and re-create fresh
DELETE FROM widget_responses
WHERE created_at < NOW() - INTERVAL '180 days';
```

---

## Troubleshooting

### "Database does not exist"

```bash
# Check if database exists:
psql -U postgres -l | grep student_companion_db

# If not, create it:
psql -U postgres -c "CREATE DATABASE student_companion_db;"
```

### "Permission denied"

```bash
# Grant all privileges to user:
psql -U postgres -d student_companion_db -c "
  GRANT ALL PRIVILEGES ON DATABASE student_companion_db TO app_user;
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
"
```

### Connection Timeout

```bash
# Check PostgreSQL is running:
psql -U postgres -h localhost  # Should connect

# Check firewall:
sudo ufw allow 5432  # If using ufw

# Check PostgreSQL config:
sudo nano /etc/postgresql/14/main/postgresql.conf
# Ensure: listen_addresses = 'localhost'
```

### "relation does not exist"

```bash
# Verify tables created:
psql -U app_user -d student_companion_db
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';

# If empty, run DATABASE_SETUP.sql again
```

### Prisma Sync Issues

```bash
# Update Prisma schema from database:
cd packages/backend
npx prisma introspect

# Or reset and regenerate:
npx prisma generate
npx prisma migrate diff --from-empty --script > manual_migration.sql
```

---

## Production Database Setup

### Using Managed Services

#### **AWS RDS**
```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier student-companion \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password '<strong-password>'

# Get endpoint:
aws rds describe-db-instances --db-instance-identifier student-companion | jq '.DBInstances[0].Endpoint.Address'

# Connection string:
DATABASE_URL=postgresql://admin:password@endpoint:5432/student_companion_db
```

#### **DigitalOcean Managed Database**
```bash
# Create via doctl:
doctl databases create student-companion-db \
  --engine pg \
  --region nyc3 \
  --num-nodes 1

# Get connection string from dashboard
```

#### **Azure Database for PostgreSQL**
```bash
# Create via Azure CLI:
az postgres server create \
  --resource-group mygroup \
  --name student-companion \
  --admin-user admin \
  --admin-password '<strong-password>'
```

### Production Environment Variables

```bash
# Use strong passwords and managed services
DATABASE_URL=postgresql://admin:very_strong_password_here@managed-db-endpoint:5432/student_companion_db

# Set environment
NODE_ENV=production

# SSL/TLS
DATABASE_URL=postgresql://admin:password@endpoint:5432/student_companion_db?sslmode=require
```

---

## Performance Tuning

### Enable Slow Query Logging

```sql
-- Log queries slower than 1 second
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();
```

### Analyze Query Performance

```sql
-- Explain a query
EXPLAIN ANALYZE SELECT * FROM student_topic_progress
  WHERE student_id = 'student_1'
  ORDER BY next_due_at;

-- Check index usage
SELECT schemaname, tablename, indexname FROM pg_indexes
  WHERE schemaname = 'public'
  ORDER BY tablename;
```

### Vacuum & Analyze

```sql
-- Clean up and optimize
VACUUM ANALYZE;

-- Or for specific table:
VACUUM ANALYZE student_topic_progress;
```

---

## Database Monitoring

### Check Disk Usage

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Active Connections

```sql
SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;
```

### Check Table Sizes

```sql
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Summary Checklist

- [ ] PostgreSQL 14+ installed
- [ ] Database created: `student_companion_db`
- [ ] User created: `app_user`
- [ ] Schema created (via Prisma or SQL script)
- [ ] Sample data seeded (8 topics, 5 badges)
- [ ] Environment variables configured in `.env`
- [ ] Connection verified: `psql -U app_user -d student_companion_db`
- [ ] Application can connect to database
- [ ] Prisma Studio accessible (if using Prisma): `npx prisma studio`

---

## Next Steps

1. ✅ Database created and seeded
2. → Start backend server: `npm run dev:backend`
3. → Start frontend: `npm run dev:frontend`
4. → Navigate to http://localhost:5173
5. → Create test account and run first check-in

---

**For questions:** Refer to DEPLOYMENT.md for full setup guide
**Last verified:** August 19, 2026
