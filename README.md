# Student Learning Companion

An AI-powered learning companion for CBSE school students. Daily check-ins with AI evaluation, interactive practice widgets, and gamified progress tracking.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **LLM:** Anthropic Claude API (Haiku + Sonnet models)
- **Auth:** Email/OTP-based (student + parent roles)

## Project Structure

```
student-learning-companion/
├── packages/
│   ├── backend/          # Node.js + Express backend
│   │   ├── src/
│   │   │   ├── config/   # Env validation, database config
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── routes/
│   │   │   ├── middleware/
│   │   │   ├── types/
│   │   │   ├── prompts/  # LLM prompt templates
│   │   │   ├── jobs/     # Scheduled jobs
│   │   │   └── app.ts
│   │   └── prisma/       # Database schema & migrations
│   │
│   └── frontend/         # React + Vite frontend
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── hooks/
│       │   ├── services/
│       │   ├── stores/    # Zustand state management
│       │   ├── types/
│       │   └── App.tsx
│       └── public/
│
├── README.md
└── package.json (monorepo root)
```

## Getting Started

### Prerequisites
- Node.js 18+ ([download](https://nodejs.org/))
- PostgreSQL 14+ ([download](https://www.postgresql.org/))
- Anthropic API key ([get here](https://console.anthropic.com))

### Installation

1. **Clone the repository**
   ```bash
   cd student-learning-companion
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cp packages/backend/.env.example packages/backend/.env
   # Edit packages/backend/.env and fill in:
   # - DATABASE_URL (PostgreSQL connection string)
   # - ANTHROPIC_API_KEY (from console.anthropic.com)
   # - JWT_SECRET (any strong random string)

   # Frontend
   cp packages/frontend/.env.example packages/frontend/.env
   ```

4. **Initialize the database**
   ```bash
   cd packages/backend
   npx prisma migrate dev --name init
   npx prisma db seed
   cd ../..
   ```

5. **Start development servers**
   ```bash
   # Terminal 1: Backend (http://localhost:5000)
   npm run dev:backend

   # Terminal 2: Frontend (http://localhost:5173)
   npm run dev:frontend
   ```

## Features

### Core MVP Features

✅ **Check-in Flow** (Milestone 3)
- Daily "what did you study today" prompt
- Subject + chapter selection
- Free-text explanation input
- AI-powered evaluation with Claude Haiku
- Immediate feedback on understanding

✅ **Widget Engine** (Milestone 4)
- **Flashcard:** Flip card with front/back
- **Fill-in-the-Blank:** Text input with fuzzy matching
- **Drag-and-Drop Label:** Label placement on diagrams
- Automatic widget generation based on detected gaps

✅ **Spaced Repetition** (Milestone 5)
- SM-2 algorithm for intelligent review scheduling
- Re-confirmation assessment with Claude Sonnet
- Next-due topics calculated nightly

✅ **Gamification** (Milestone 6)
- XP rewards for check-ins and correct widget responses
- Daily streak tracking with 1-day grace period
- Level system (1-100, XP thresholds)
- Badge unlocking (First Check-in, 7-Day Streak, Chapter Expert, etc.)

✅ **Progress Dashboard** (Milestone 7)
- XP and level progress bar
- Streak counter and last check-in date
- Per-subject mastery visualization
- Recent check-in history
- Charts: XP trend over time, weekly check-in scores

✅ **Parent Dashboard** (Milestone 7)
- Read-only view of child's progress
- Child selection (for multiple children)
- Weekly activity summary
- Weak topic alerts
- Invitation code for secure linking

### Post-MVP Features (Future)
- Voice input (Whisper API)
- Teacher dashboard
- Leaderboard (with privacy controls)
- Multi-language support (Hindi)
- Mobile app (React Native)
- Offline sync (Service Worker)

## Development Workflow

### Running Tests
```bash
npm run test              # Run all tests
npm run test:backend      # Backend tests only
npm run test:frontend     # Frontend tests only
```

### Building for Production
```bash
npm run build             # Build both packages
npm run build:backend     # Backend only
npm run build:frontend    # Frontend only
```

### Database Commands
```bash
cd packages/backend

# Run migrations
npx prisma migrate dev --name <name>

# Reset database (development only!)
npx prisma migrate reset

# Seed with sample data
npx prisma db seed

# Open Prisma Studio (visual database explorer)
npx prisma studio
```

## API Endpoints (MVP)

### Authentication
- `POST /auth/send-otp` - Request OTP via email
- `POST /auth/verify-otp` - Verify OTP, receive JWT
- `POST /auth/refresh-token` - Refresh JWT token
- `GET /auth/profile` - Get logged-in user profile

### Check-in
- `POST /api/check-in/start` - Start new check-in session
- `POST /api/check-in/submit` - Submit study explanation (triggers LLM evaluation)
- `GET /api/check-in/history` - Paginated check-in history

### Widgets
- `POST /api/widget/submit` - Submit widget response, get scoring feedback

### Scheduler (Spaced Repetition)
- `GET /api/scheduler/next-topic` - Get top-priority topic for student (SM-2 based)
- `POST /api/scheduler/run-now` - Admin: Manually trigger nightly scheduler job

### Progress
- `GET /api/progress/overview` - XP, level, streak, badges summary
- `GET /api/progress/topics` - Detailed progress per topic
- `GET /api/progress/check-ins` - Paginated check-in history with scores

### Parent
- `GET /api/parent/children` - List of linked children
- `GET /api/parent/children/:id/progress` - Child's progress snapshot
- `POST /api/parent/invite-code` - Generate invitation code

## Sample Data

The database is seeded with:
- **8 sample CBSE Class 10 Science/Physics/Chemistry topics** (photosynthesis, refraction, chemical reactions, etc.)
- **5 badges** (First Check-in, 7-Day Streak, Hundred XP, Chapter Expert, Consistent Learner)

Topics can be expanded later by adding records to the `topics` table.

## Configuration

### Environment Variables

**Backend (.env)**
```
DATABASE_URL=postgresql://user:password@localhost:5432/student_companion_db
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_HAIKU_MODEL=claude-3-5-haiku-20241022
CLAUDE_SONNET_MODEL=claude-3-5-sonnet-20241022
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
NODE_ENV=development
BACKEND_PORT=5000
FRONTEND_URL=http://localhost:5173
SCHEDULER_TIMEZONE=Asia/Kolkata
OTP_EXPIRY_MINUTES=10
```

**Frontend (.env)**
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Student Learning Companion
```

## LLM Integration

The app uses two Claude models:

1. **Claude Haiku** (fast, cheap)
   - Check-in explanation evaluation
   - Widget generation
   - Common tasks where speed is important

2. **Claude Sonnet** (more capable, used sparingly)
   - Re-confirmation assessments (deeper reasoning)
   - Complex gap analysis

Prompts are stored as templates in `packages/backend/src/prompts/` for easy iteration.

## Database Schema

8 core entities:
- **User** - Email + role (STUDENT, PARENT, ADMIN)
- **Student** - Grade level, subjects, linked parent
- **Parent** - Can view multiple children's progress
- **Topic** - CBSE curriculum reference (subject, chapter, subtopic, expected concepts)
- **StudentTopicProgress** - Mastery score, SM-2 intervals, next due date
- **CheckInSession** - Daily check-in record with AI evaluation
- **Widget** - Practice widget (flashcard, fill_blank, drag_drop)
- **Badge** - Achievement definition + StudentBadge (earned)
- **StudentStats** - Denormalized: XP, level, streak (for fast dashboard queries)

See `packages/backend/prisma/schema.prisma` for full schema.

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Monorepo** | Shared types, coordinated versioning, easier to sync frontend/backend |
| **Zustand** (state mgmt) | Minimal boilerplate, small bundle size, fast for MVP |
| **Prisma** (ORM) | Type-safe, auto-migrations, excellent DevX |
| **Claude Haiku + Sonnet** | Cost/speed balance (Haiku for routine, Sonnet for complex) |
| **Email/OTP auth** | No third-party dependency, works offline, suitable for schools |
| **SM-2 algorithm** | Proven for long-term retention, well-documented |
| **Tailwind CSS** | Rapid UI development, consistent design, small final bundle |

## Assumptions & Notes

- **CBSE Curriculum:** Topics are seeded with Class 10 Science/Physics/Chemistry. Can expand easily.
- **Voice Input:** Stubbed button for now—no real Whisper integration yet.
- **Notifications:** Email notifications stub—no push notifications in MVP.
- **Offline:** PWA skeleton—full offline sync is post-MVP.
- **Privacy:** Parent-child linking via email verification + invite codes.

## Milestones

- ✅ **Milestone 1 (Days 1-2):** Project scaffolding, Prisma schema
- ⏳ **Milestone 2 (Days 3-4):** Email/OTP authentication
- ⏳ **Milestone 3 (Days 5-7):** Check-in flow (CORE MVP)
- ⏳ **Milestone 4 (Days 8-10):** Widget engine
- ⏳ **Milestone 5 (Days 11-12):** Spaced repetition scheduler
- ⏳ **Milestone 6 (Days 13-14):** Gamification system
- ⏳ **Milestone 7 (Days 15-16):** Progress & parent dashboards
- ⏳ **Milestone 8 (Days 17-18):** Error handling, validation, documentation

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
- Ensure PostgreSQL is running: `brew services start postgresql` (macOS) or `sudo service postgresql start` (Linux)
- Check DATABASE_URL in `.env` is correct

### Prisma Migration Error
```
Database error: can't add a NOT NULL column without a default value
```
- Ensure the migration is correct. If development, use `npx prisma migrate reset` to reset the database.

### API calls return 401 Unauthorized
- Check JWT token is included in request headers: `Authorization: Bearer <token>`
- Token expiry: tokens are valid for 7 days by default

## Contributing

(Development guidelines to be added)

## License

(To be determined)

## Support

For questions or issues:
1. Check the [plan file](/plan) for architecture details
2. Review the Prisma schema for data model
3. Check LLM prompts in `packages/backend/src/prompts/` for AI behavior

---

**Built with ❤️ for CBSE students**
