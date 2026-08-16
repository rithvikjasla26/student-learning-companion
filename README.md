# Student Learning Companion

An AI-powered mobile-first web app for CBSE school students that conducts daily "what did you study today" check-ins, uses Claude AI to evaluate understanding, serves interactive practice widgets for detected gaps, and tracks progress with gamification.

## Overview

### What It Does

1. **Daily Check-ins**: Students log in and answer "What did you study today?" by selecting a topic and explaining their understanding
2. **AI Evaluation**: Claude API evaluates explanations and identifies learning gaps (recall, structural, sequence, application)
3. **Interactive Widgets**: Serves targeted practice widgets (flashcards, fill-in-blank, drag-drop labels) based on gap type
4. **Spaced Repetition**: Uses SM-2 algorithm to schedule topics intelligently
5. **Gamification**: Awards XP, maintains streaks, unlocks badges
6. **Progress Tracking**: Dashboard showing mastery scores, syllabus map, and per-subject levels
7. **Parent View**: Read-only dashboard with weekly summaries and trends

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS (mobile-first, PWA-capable)
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite (dev) / PostgreSQL (prod) via Prisma ORM
- **LLM**: Anthropic Claude API (claude-haiku-4-5 for routine, claude-sonnet-4-6 for analysis)
- **Auth**: Email/OTP-based (MVP)

## Project Structure

```
student-learning-companion/
├── frontend/                    # React + Vite app
│   ├── src/
│   │   ├── pages/              # Page components (CheckIn, Progress, etc.)
│   │   ├── components/         # Reusable components (widgets, etc.)
│   │   ├── services/           # API client
│   │   ├── hooks/              # Custom React hooks
│   │   ├── context/            # Auth context
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                     # Express server
│   ├── src/
│   │   ├── server.ts           # Express setup
│   │   ├── config/             # Configuration
│   │   │   └── llm.ts          # LLM abstraction
│   │   ├── services/           # Business logic
│   │   │   ├── prisma.ts       # Prisma client
│   │   │   ├── auth.ts
│   │   │   ├── gamification.ts
│   │   │   └── scheduler.ts
│   │   ├── routes/             # API endpoints
│   │   │   ├── health.ts
│   │   │   ├── auth.ts
│   │   │   ├── checkin.ts
│   │   │   ├── widgets.ts
│   │   │   ├── progress.ts
│   │   │   ├── gamification.ts
│   │   │   ├── scheduler.ts
│   │   │   └── parent.ts
│   │   └── prompts/            # LLM prompt templates
│   │       ├── evaluation.txt
│   │       ├── gap_analysis.txt
│   │       └── follow_up.txt
│   ├── prisma/
│   │   ├── schema.prisma       # Data models
│   │   └── seed.ts             # Database seeding
│   ├── dist/                   # Compiled output
│   ├── tsconfig.json
│   └── package.json
│
├── PLAN.md                      # Implementation roadmap
├── .env.example                 # Environment template
├── .gitignore
├── package.json                 # Root monorepo config
└── README.md                    # This file
```

## Setup & Installation

### Prerequisites

- Node.js 18+ and npm
- Anthropic API key (from [console.anthropic.com](https://console.anthropic.com))

### 1. Clone & Install

```bash
cd /home/repl/student-learning-companion
npm install
```

This installs dependencies for both frontend and backend via npm workspaces.

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY="sk-ant-..." # Your Anthropic API key
JWT_SECRET="your-secret-key-here"
BACKEND_PORT=3000
NODE_ENV=development
```

### 3. Database Setup

```bash
# Generate Prisma client
npm --workspace backend run prisma:generate

# Push schema to database
npm --workspace backend run db:push

# Seed with sample data (10 CBSE Class 10 Science topics + test student)
npm --workspace backend run db:seed
```

### 4. Run Development Servers

```bash
# Runs both backend (port 3000) and frontend (port 5173) concurrently
npm run dev
```

Or run separately:

```bash
# Terminal 1: Backend
npm --workspace backend run dev

# Terminal 2: Frontend
npm --workspace frontend run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Sample Data

After seeding, you can log in with:

- **Student**: `student@example.com` (OTP: whatever appears in backend logs)
- **Parent**: `parent@example.com`

The database includes:
- 10 CBSE Class 10 Science topics (Physics, Chemistry, Biology)
- 5 pre-configured badges
- Sample student linked to a parent

## API Endpoints (MVP)

All endpoints return JSON. See `DEVELOPMENT.md` for detailed API docs.

### Auth
- `POST /api/auth/request-otp` - Request OTP for login
- `POST /api/auth/verify-otp` - Verify OTP and get JWT token
- `POST /api/auth/logout` - Log out

### Check-in (Core Feature)
- `POST /api/checkin/start` - Get available topics
- `POST /api/checkin/submit` - Submit explanation for evaluation
- `POST /api/checkin/reevaluate` - Re-explain after widget

### Widgets
- `POST /api/widgets/content` - Generate widget content from gap analysis

### Progress
- `GET /api/progress/dashboard` - Student dashboard data
- `GET /api/progress/subject/:subject` - Per-subject breakdown

### Gamification
- `GET /api/gamification/xp` - XP and level info
- `GET /api/gamification/streak` - Streak counter
- `GET /api/gamification/badges` - Earned badges

### Scheduler
- `POST /api/scheduler/next-topic` - Get tomorrow's scheduled topic

### Parent
- `GET /api/parent/children` - List child students
- `GET /api/parent/child/:student_id/summary` - Weekly summary
- `GET /api/parent/child/:student_id/trend` - Mastery trend

## Implementation Phases

See `PLAN.md` for the full roadmap. Current status:

- ✅ **Phase 1**: Project Scaffolding & Prisma Schema
- ⏳ **Phase 2**: Backend Foundation & LLM Integration
- ⏳ **Phase 3**: Check-in Flow
- ⏳ **Phase 4**: Widget Engine
- ⏳ **Phase 5**: Re-confirm Understanding
- ⏳ **Phase 6**: Spaced Repetition Scheduler
- ⏳ **Phase 7**: Gamification
- ⏳ **Phase 8**: Progress Screen
- ⏳ **Phase 9**: Parent View
- ⏳ **Phase 10**: Auth System
- ⏳ **Phase 11**: Documentation & Polish

## Development Notes

### LLM Abstraction

All LLM calls go through `backend/src/config/llm.ts`:

```typescript
callLLM(type, content, studentId?)
```

- `type`: "evaluation" (haiku), "gap-analysis" (sonnet), etc.
- Automatically selects the right model
- Loads prompt templates from `backend/src/prompts/`
- Returns structured JSON

### Prompt Templates

Edit `backend/src/prompts/*.txt` files to tweak LLM behavior without code changes.

### Database Migrations

```bash
# Create new migration
npm --workspace backend run db:migrate -- --name feature_name

# Seed database again
npm --workspace backend run db:seed
```

### Type Safety

Both frontend and backend use strict TypeScript. Run type checks:

```bash
npm run type-check
```

## Stubbed Features (Future Phases)

- 🔇 Voice input (button exists, recording not implemented)
- 📧 Real email OTP (logs to console in development)
- ⏰ Real cron jobs (manual endpoint triggers)
- 📱 Native mobile app (web app is mobile-first only)
- 🔔 Push notifications
- 📊 Analytics & usage tracking
- 🔐 Advanced auth (OAuth, role-based access control)

## Troubleshooting

### Port already in use?

Change ports in `.env`:
```
BACKEND_PORT=3001
VITE_API_PORT=5174
```

### Database locked?

Delete `dev.db` and re-seed:
```bash
rm backend/dev.db
npm --workspace backend run db:seed
```

### API calls failing?

Ensure backend is running on port 3000 and check browser console for CORS errors.

### Prisma client out of sync?

Regenerate:
```bash
npm --workspace backend run prisma:generate
```

## Contributing

This is an MVP. Code is optimized for working features over polish. Add `// TODO` comments for future improvements.

## License

MIT
