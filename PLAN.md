# Student Learning Companion App - Implementation Plan

## Context

Building a mobile-first web app for CBSE school students (India) that conducts daily "what did you study today" check-ins, uses AI (Claude) to evaluate understanding, serves interactive practice widgets for detected gaps, and tracks progress with gamification. This is an MVP to prove the end-to-end concept—prioritize working flows over polish.

## Assumptions Made

1. **Project location**: Will create `/home/repl/student-learning-companion` as the project root (new monorepo)
2. **GitHub repo**: Will configure git to push to `https://github.com/rithvikjasla26/student-learning-companion`
3. **Structure**: Monorepo with `/frontend` (React + Vite) and `/backend` (Express + Node.js) directories
4. **Auth token**: Will use provided GitHub token via git credential helper
5. **Database**: PostgreSQL; will set up local SQLite for MVP development (easily swappable via Prisma)
6. **Commits**: Will commit at each major milestone with clear messages

## Implementation Phases

### Phase 1: Project Scaffolding & Infrastructure
**Deliverables**: Project structure, package setup, Prisma schema, env config

**Files to create**:
- Root `package.json` (monorepo with workspaces)
- `backend/package.json`, `backend/tsconfig.json`, `backend/src/` structure
- `frontend/package.json`, `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/src/` structure
- `backend/prisma/schema.prisma` (full data model)
- `.env.example`, `.gitignore`
- `README.md` with setup instructions

**Key setup tasks**:
- Initialize TypeScript, Vite, Tailwind, Express, Prisma
- Create Prisma schema with models: Student, Parent, Topic, StudentTopicProgress, CheckInSession, Badge, StudentBadge
- Seed Topic table with 5-10 sample CBSE Class 10 Science topics
- Set up `.env` for `DATABASE_URL` and `ANTHROPIC_API_KEY`
- Configure git to push to GitHub repo

**Commit**: "feat: project scaffolding with Prisma schema and seeded topics"

### Phase 2: Backend Foundation & LLM Integration
**Deliverables**: Express server, Anthropic SDK setup, LLM call abstraction, database connectivity

**Files to create**:
- `backend/src/server.ts` - Express server with CORS, body parser
- `backend/src/config/llm.ts` - `callLLM()` function that abstracts model selection (haiku for routine, sonnet for gap analysis)
- `backend/src/prompts/` - Separate prompt template files:
  - `evaluation.txt` - LLM prompt for evaluating student explanations
  - `gap_analysis.txt` - Prompt for detailed gap analysis
  - `follow_up.txt` - Retrieval-practice follow-up question prompt
- `backend/src/services/prisma.ts` - Prisma client initialization
- `backend/src/routes/health.ts` - Health check endpoint

**Key implementation**:
- Express setup with environment variable loading
- Prisma client initialization and connection pooling
- `callLLM(type, content, student_id?)` function that:
  - Routes to haiku for routine evals, sonnet for gap analysis
  - Loads appropriate prompt template
  - Calls Anthropic API with structured JSON response
  - Handles errors gracefully
- Health check endpoint to verify DB + API connectivity

**Commit**: "feat: backend foundation with LLM abstraction and prompt templates"

### Phase 3: Check-in Flow (Core Feature 1)
**Deliverables**: Frontend UI + backend API for check-in workflow

**Backend files**:
- `backend/src/routes/checkin.ts`:
  - POST `/api/checkin/start` - Get available topics for student
  - POST `/api/checkin/submit` - Student submits explanation
    - Calls `callLLM()` for evaluation
    - Returns: `{ mastery_score, gap_type, gap_description, follow_up_question }`
    - Stores CheckInSession record in DB

**Frontend files**:
- `frontend/src/pages/CheckIn.tsx` - Main check-in page:
  - Input: Subject + Chapter dropdown (populate from Topics)
  - Input: Text area for explanation (voice button stubbed, non-functional)
  - Submit button calls backend
  - Display result or route to widget
- `frontend/src/components/TopicSelector.tsx` - Dropdown for subjects/chapters
- `frontend/src/services/api.ts` - API client with fetch wrapper
- `frontend/src/hooks/useCheckIn.ts` - Custom hook for check-in logic

**Key implementation**:
- Fetch topics from DB, filter by student's subjects
- LLM evaluation returns structured gap info
- Store evaluation result in CheckInSession
- Route to widget flow based on gap_type (or to re-confirm if gap_type="none")

**Commit**: "feat: end-to-end check-in flow with LLM evaluation"

### Phase 4: Widget Engine (Core Feature 2)
**Deliverables**: 3 reusable widget components + router logic

**Frontend files**:
- `frontend/src/components/widgets/Flashcard.tsx` - Flip card component
  - Props: `{ front, back, onNext }`
  - CSS transitions for flip animation
- `frontend/src/components/widgets/FillInBlank.tsx` - Sentence with blank input
  - Props: `{ sentence, correctAnswer, onSubmit }` (sentence has `[BLANK]` placeholder)
  - Case-insensitive answer checking
- `frontend/src/components/widgets/DragDropLabel.tsx` - Drag labels to diagram
  - Props: `{ imageUrl, labels[], dropZones[], onComplete }`
  - Uses HTML5 drag-drop API or React-based library (minimal)
- `frontend/src/components/WidgetRouter.tsx` - Router function
  - Inputs: gap_type, gap_description, student response
  - Logic: gap_type="recall" → Flashcard, "structural" → DragDropLabel, "sequence" → FillInBlank, etc.
  - Calls LLM (sonnet) to generate widget content from gap_description
  - Renders appropriate widget

**Backend files**:
- `backend/src/routes/widgets.ts`:
  - POST `/api/widgets/content` - Given gap_type + gap_description, generate widget content via LLM

**Key implementation**:
- Widget content is not hardcoded—comes from LLM or seed data
- WidgetRouter is the glue: takes LLM output, generates widget JSON, routes to UI component
- Each widget handles its own validation/submission

**Commit**: "feat: widget engine with 3 reusable components and router"

### Phase 5: Re-confirm Understanding (Core Feature 3)
**Deliverables**: UI flow to re-evaluate after widget

**Frontend files**:
- `frontend/src/pages/ReConfirm.tsx` - Re-ask student to explain, similar to CheckIn page

**Backend files**:
- `backend/src/routes/checkin.ts` - Extend with:
  - POST `/api/checkin/reevaluate` - Submit re-explanation, update CheckInSession.mastery_score

**Key implementation**:
- After widget completion, show "explain it again" prompt
- Call LLM again (haiku for routine eval)
- Update StudentTopicProgress with new mastery_score
- Award XP based on improvement

**Commit**: "feat: re-confirmation flow with score update"

### Phase 6: Spaced Repetition Scheduler (Core Feature 4)
**Deliverables**: Scheduling algorithm, daily topic picker

**Backend files**:
- `backend/src/services/scheduler.ts`:
  - `calculatePriority(topic_progress, topic_exam_weight)` - SM-2 style scoring
  - `pickTodaysTopic(student_id)` - Select top-priority topic
- `backend/src/routes/scheduler.ts`:
  - POST `/api/scheduler/next-topic` - Return tomorrow's topic
  - (Nightly job can be manually triggered; real cron later)

**Database migrations**:
- Ensure StudentTopicProgress has columns: ease_factor, interval_days, last_reviewed_at, next_due_at

**Key implementation**:
- Priority = weighted sum of:
  - Due-ness: (today - next_due_at) / max_days
  - Mastery gap: (100 - mastery_score) / 100
  - Confidence mismatch: |mastery_score - confidence_rating|
  - Exam weight: exam_weight / max_weight
- Update next_due_at and interval_days using SM-2 formula after each check-in

**Commit**: "feat: spaced repetition scheduler with SM-2 algorithm"

### Phase 7: Gamification (Core Feature 5)
**Deliverables**: XP, streaks, levels, badge unlock logic

**Backend files**:
- `backend/src/services/gamification.ts`:
  - `calculateXP(mastery_improvement, explanation_quality)` - XP calc
  - `updateStreak(student_id, last_checkin_date)` - 1-day grace period
  - `checkBadgeUnlock(student_id, check_in_session)` - Trigger badge logic
  - `assignLevel(total_xp)` - XP-to-level mapping

**Database models**:
- Add to Student: total_xp, current_streak, last_checkin_date
- Add to StudentTopicProgress: subject_xp, subject_level (per-subject tracking)
- Badges: "Sharp Eye" (low confidence then correct), "Speed Learner" (3 topics in 1 day), "Consistency" (7-day streak)

**Routes**:
- `backend/src/routes/gamification.ts`:
  - GET `/api/gamification/xp` - Current XP + level
  - GET `/api/gamification/streak` - Current streak + grace periods left
  - GET `/api/gamification/badges` - List earned badges

**Key implementation**:
- Award XP on check-in completion (base XP) + gap closure (bonus)
- Update StudentTopicProgress.subject_level per subject
- Streak logic: +1 if checked in within 24 hours, reset after grace period expires

**Commit**: "feat: gamification system with XP, streaks, levels, and badge logic"

### Phase 8: Progress Screen (Core Feature 6)
**Deliverables**: Dashboard UI showing progress metrics

**Frontend files**:
- `frontend/src/pages/Progress.tsx` - Main progress dashboard
  - Header: Streak counter + XP bar + current level
  - Section: Per-subject mastery bars (0-100%)
  - Section: Badge grid with earned badges
  - Section: Syllabus map grid (Topics as cards, color-coded by mastery: green >70%, amber 40-70%, grey <40%)

**Backend files**:
- `backend/src/routes/progress.ts`:
  - GET `/api/progress/dashboard` - Return aggregated data for student
  - GET `/api/progress/subject/:subject` - Per-subject mastery breakdown

**Key implementation**:
- Fetch StudentTopicProgress for all topics, compute per-subject averages
- Fetch current XP, level, streak, earned badges
- Format Topics with mastery color codes and metadata

**Commit**: "feat: progress dashboard with syllabus map and metrics"

### Phase 9: Parent View (Core Feature 7)
**Deliverables**: Read-only parent dashboard

**Frontend files**:
- `frontend/src/pages/ParentDashboard.tsx` - Parent view
  - Weekly summary: Topics covered this week
  - Mastery trend: Chart of child's mastery over time
  - Flagged weak topics: List of topics with mastery <40%
  - Child selector (if parent linked to multiple students)

**Backend files**:
- `backend/src/routes/parent.ts`:
  - GET `/api/parent/children` - List child students
  - GET `/api/parent/child/:student_id/summary` - Weekly summary
  - GET `/api/parent/child/:student_id/trend` - Mastery trend data

**Key implementation**:
- Filter CheckInSessions by date range (past 7 days)
- Aggregate mastery scores to show trend
- Identify topics with mastery < 40%

**Commit**: "feat: read-only parent dashboard with weekly summary and trends"

### Phase 10: Auth (Email/OTP MVP)
**Deliverables**: Simple email + OTP authentication

**Backend files**:
- `backend/src/services/auth.ts`:
  - `sendOTP(email, student_or_parent)` - Generate + send OTP (stub email; just log to console for MVP)
  - `verifyOTP(email, otp)` - Verify OTP, create session token (JWT)
- `backend/src/routes/auth.ts`:
  - POST `/api/auth/request-otp` - Email + role
  - POST `/api/auth/verify-otp` - OTP + email
  - POST `/api/auth/logout`

**Frontend files**:
- `frontend/src/pages/Auth.tsx` - OTP login flow
- `frontend/src/context/AuthContext.tsx` - Auth state + token storage (localStorage)
- `frontend/src/components/ProtectedRoute.tsx` - Route guard

**Key implementation**:
- JWT token valid for 7 days
- OTP valid for 10 minutes (for MVP, no real email—just log OTP to backend console)
- Student/Parent roles determine dashboard access

**Commit**: "feat: email/OTP auth with role-based access"

### Phase 11: Documentation & Polish
**Deliverables**: README, API docs, .env.example, final testing

**Files**:
- `README.md` - Setup instructions, project overview, architecture diagram
- `.env.example` - Template for environment variables
- `API.md` - OpenAPI/endpoint reference
- `DEVELOPMENT.md` - Dev setup, seed data, running locally

**Key tasks**:
- Verify all endpoints work end-to-end
- Test student check-in → widget → re-confirm → progress update flow
- Seed database with 5-10 CBSE Class 10 Science topics
- Ensure error handling and validation throughout

**Commit**: "docs: README, API docs, and development guide"

## Critical Files to Create/Modify

### Data Models (Prisma Schema)
- `backend/prisma/schema.prisma` - All entities listed in requirements
- Seed file: `backend/prisma/seed.ts` - 5-10 CBSE Class 10 Science topics

### LLM Abstraction Layer
- `backend/src/config/llm.ts` - Core `callLLM()` function
- Prompt templates in `backend/src/prompts/` (separate files, not inline)

### API Routes
- `/api/checkin/*` - Check-in submission and re-evaluation
- `/api/widgets/*` - Widget content generation
- `/api/scheduler/*` - Topic scheduling
- `/api/gamification/*` - XP, streak, badge info
- `/api/progress/*` - Student dashboard
- `/api/parent/*` - Parent dashboard
- `/api/auth/*` - Auth flows

### Frontend Pages
- CheckIn, ReConfirm, Progress, ParentDashboard, Auth

### Widgets
- Flashcard, FillInBlank, DragDropLabel, WidgetRouter

## Verification & Testing

**End-to-end flow**:
1. Student logs in via OTP
2. Sees "What did you study today?" with topic dropdown
3. Selects Class 10 Science > Photosynthesis
4. Types explanation
5. Backend calls LLM, detects gap_type="structural"
6. Frontend routes to DragDropLabel widget
7. Student completes widget
8. Re-explains concept, mastery_score improves
9. XP awarded, streak updated
10. Progress dashboard reflects new data
11. Parent sees updated summary

**Database seeding**:
- Run `npx prisma db seed` to populate Topics and sample students

**Local development**:
- Backend: `npm run dev` (Express on :3000 with auto-reload)
- Frontend: `npm run dev` (Vite on :5173)
- Database: SQLite file (easily swap to PostgreSQL via Prisma)

## Notes on Stubbing & MVP Scope

- **Voice input**: Button exists but doesn't capture audio; text input is primary
- **Push notifications**: Not implemented
- **Real email OTP**: Stubbed; logs OTP to console for MVP
- **Cron jobs**: Manual endpoint triggers instead of scheduled cron
- **Analytics**: Not included
- **Real-time features**: Not included
- **Mobile app**: Web is mobile-first (responsive design only)

All above are documented in the code with `// TODO` comments for future phases.

## Commit Strategy

- **Milestone commits**: One commit per phase with clear subject
- **GitHub push**: After each phase, push to `https://github.com/rithvikjasla26/student-learning-companion`
- **Commit format**: "feat: X" or "fix: X" with descriptive body if needed

---

**Ready to scaffold and implement Phase 1 → Phase 11 in order.**
