# Development Guide

## Quick Start

```bash
npm install
npm run dev
```

Backend runs on `http://localhost:3000`, frontend on `http://localhost:5173`.

## Database

### Prisma Commands

```bash
# Generate Prisma client
npm --workspace backend run prisma:generate

# Push schema to database
npm --workspace backend run db:push

# Create migration
npm --workspace backend run db:migrate -- --name your_migration_name

# Seed database
npm --workspace backend run db:seed

# Open Prisma Studio (GUI)
npm --workspace backend run prisma studio
```

### Database Schema

All models defined in `backend/prisma/schema.prisma`:

- **Student**: User account with gamification stats (totalXp, currentStreak)
- **Parent**: Guardian account linked to students
- **Topic**: CBSE syllabus reference (subject, chapter, subtopic, expected_concepts)
- **StudentTopicProgress**: Tracks mastery for each student-topic pair
- **CheckInSession**: Records daily check-ins with LLM evaluation results
- **Badge**: Achievement definitions
- **StudentBadge**: Earned achievements

### Sample Data

Run `npm --workspace backend run db:seed` to populate:

- 10 CBSE Class 10 Science topics
- 5 badges (Sharp Eye, Speed Learner, Consistency Champion, Knowledge Master, First Step)
- 1 test student (`student@example.com`)
- 1 test parent (`parent@example.com`)

## Backend Development

### File Structure

```
backend/
├── src/
│   ├── server.ts              # Express setup & middleware
│   ├── config/
│   │   └── llm.ts             # LLM abstraction layer
│   ├── services/
│   │   ├── prisma.ts          # Prisma client instance
│   │   ├── auth.ts            # Auth logic
│   │   ├── gamification.ts    # XP, streak, badge logic
│   │   └── scheduler.ts       # Spaced repetition logic
│   ├── routes/
│   │   ├── health.ts          # GET /api/health
│   │   ├── auth.ts            # Auth endpoints
│   │   ├── checkin.ts         # Check-in endpoints
│   │   ├── widgets.ts         # Widget content generation
│   │   ├── progress.ts        # Dashboard endpoints
│   │   ├── gamification.ts    # XP/badge endpoints
│   │   ├── scheduler.ts       # Scheduler endpoints
│   │   └── parent.ts          # Parent dashboard endpoints
│   └── prompts/
│       ├── evaluation.txt      # LLM prompt for initial eval
│       ├── gap_analysis.txt    # Prompt for gap analysis
│       └── follow_up.txt       # Retrieval-practice prompt
└── prisma/
    ├── schema.prisma          # Data models
    └── seed.ts                # Database seeding script
```

### Environment Variables

Required in `.env`:

```
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY="sk-ant-..."
JWT_SECRET="your-secret"
BACKEND_PORT=3000
NODE_ENV=development
```

### LLM Abstraction (`backend/src/config/llm.ts`)

All AI calls go through a single `callLLM()` function:

```typescript
async function callLLM(
  type: "evaluation" | "gap-analysis" | "widget-content" | "follow-up",
  content: Record<string, unknown>,
  options?: { studentId?: string }
): Promise<Record<string, unknown>>
```

**Model selection**:
- `evaluation`, `follow-up`: claude-haiku-4-5 (faster, cheaper for routine tasks)
- `gap-analysis`, `widget-content`: claude-sonnet-4-6 (better reasoning for complex tasks)

**Prompt loading**:
- Reads from `backend/src/prompts/{type}.txt`
- Interpolates variables like `${studentName}`, `${concept}`
- Returns parsed JSON from LLM

**To change models per task**: Edit the model mapping in `config/llm.ts`.

### Running Server

```bash
# Development (with auto-reload)
npm --workspace backend run dev

# Build for production
npm --workspace backend run build

# Run built code
npm --workspace backend run start

# Type check
npm --workspace backend run type-check
```

Server listens on port defined in `.env` (default 3000).

### Health Check

Test backend connectivity:

```bash
curl http://localhost:3000/api/health
```

Returns:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "database": "connected"
}
```

## Frontend Development

### File Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── CheckIn.tsx         # "What did you study?" flow
│   │   ├── ReConfirm.tsx       # Re-explain after widget
│   │   ├── Progress.tsx        # Student dashboard
│   │   ├── ParentDashboard.tsx # Parent view
│   │   └── Auth.tsx            # Login/OTP
│   ├── components/
│   │   ├── widgets/
│   │   │   ├── Flashcard.tsx
│   │   │   ├── FillInBlank.tsx
│   │   │   └── DragDropLabel.tsx
│   │   ├── WidgetRouter.tsx    # Routes to appropriate widget
│   │   ├── TopicSelector.tsx   # Subject/chapter dropdown
│   │   └── ProtectedRoute.tsx  # Route guard
│   ├── services/
│   │   └── api.ts             # API client wrapper
│   ├── hooks/
│   │   ├── useCheckIn.ts      # Check-in logic
│   │   └── useAuth.ts         # Auth context hook
│   ├── context/
│   │   └── AuthContext.tsx    # Auth state & JWT
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### Environment Variables

Frontend environment vars (prefixed with `VITE_`):

```
VITE_API_URL=http://localhost:3000
```

Access in code:
```typescript
const apiUrl = import.meta.env.VITE_API_URL
```

### Running Frontend

```bash
# Development (Vite dev server)
npm --workspace frontend run dev

# Build for production
npm --workspace frontend run build

# Preview built app
npm --workspace frontend run preview

# Type check
npm --workspace frontend run type-check
```

App runs on `http://localhost:5173` by default.

### API Client (`frontend/src/services/api.ts`)

Wrapper around fetch that handles JWT token and base URL:

```typescript
import { api } from "@/services/api"

// Auto-adds JWT token from localStorage
const data = await api.post("/checkin/submit", { explanation, topicId })
```

### Styling

- **Tailwind CSS** for utility-first styling
- **Mobile-first** responsive design
- Customization in `frontend/tailwind.config.js`

### Routing

React Router v6 in `App.tsx`:
- `/auth` - Login/OTP
- `/checkin` - Daily check-in
- `/progress` - Student dashboard
- `/parent` - Parent dashboard

## Testing the App End-to-End

### 1. Start Servers

```bash
npm run dev
```

Wait for both backend and frontend to start.

### 2. Login

Visit `http://localhost:5173/auth`

- **Email**: `student@example.com`
- **OTP**: Check backend console output (logged during development)

### 3. Daily Check-in

- Click "What did you study today?"
- Select: Subject (Physics) > Chapter (Light) > Subtopic (Laws of Reflection)
- Type explanation: "Angle of incidence equals angle of reflection. The normal is perpendicular to the surface."
- Submit

### 4. View Results

- Backend calls Claude to evaluate explanation
- Frontend shows detected gap (or no gap if explanation is good)
- Routes to appropriate widget (if gap detected)

### 5. Complete Widget

- Interact with widget (flashcard flip, fill in blank, etc.)
- Re-confirm understanding

### 6. Check Progress

- Visit `/progress` to see dashboard
- XP, streak, mastery scores updated

## Adding New Features

### Adding a New Route

1. Create file in `backend/src/routes/feature.ts`:

```typescript
import { Router } from "express"

const router = Router()

router.get("/", (req, res) => {
  res.json({ message: "Feature endpoint" })
})

export default router
```

2. Import in `backend/src/server.ts`:

```typescript
import featureRouter from "./routes/feature.ts"
app.use("/api/feature", featureRouter)
```

### Adding a Database Model

1. Edit `backend/prisma/schema.prisma`
2. Create migration: `npm --workspace backend run db:migrate -- --name add_feature`
3. Regenerate Prisma client: `npm --workspace backend run prisma:generate`

### Updating LLM Prompts

1. Edit `backend/src/prompts/{type}.txt`
2. No code changes needed—next call will use updated prompt

### Adding a New Page

1. Create `frontend/src/pages/Feature.tsx`
2. Add route to `frontend/src/App.tsx`:

```typescript
<Route path="/feature" element={<Feature />} />
```

3. Link from navigation component

## Common Tasks

### Debug LLM Calls

Set `DEBUG=true` in `.env` to log full prompts and responses:

```
DEBUG=true
```

Check backend console for LLM request/response details.

### Check Database

Open Prisma Studio GUI:

```bash
npm --workspace backend run prisma studio
```

Visit `http://localhost:5555` to browse data.

### Format Code

Install Prettier:

```bash
npm install -D prettier
npx prettier --write .
```

### Type Check Everything

```bash
npm run type-check
```

Both frontend and backend must pass TypeScript strict mode.

## Performance Tips

- **LLM calls**: Use haiku for routine tasks, sonnet only for gap analysis
- **Database**: Indexes on frequently queried fields (studentId, topicId, nextDueAt)
- **Frontend**: Code-split pages with React.lazy()
- **Assets**: Optimize images, use WebP

## Deployment Notes

- Build: `npm run build`
- Backend compiled to `backend/dist/`
- Frontend compiled to `frontend/dist/`
- Use PostgreSQL in production (swap provider in `schema.prisma`)
- Set real JWT_SECRET and secure ANTHROPIC_API_KEY
- Configure CORS_ORIGIN for production domain

## Troubleshooting

### Port in use?

```bash
lsof -i :3000  # Find process on port 3000
kill -9 <PID>  # Kill it
```

### Prisma out of sync?

```bash
npm --workspace backend run prisma:generate
npm --workspace backend run db:push
```

### API calls return 401 Unauthorized?

- Check JWT token in localStorage
- Verify token isn't expired
- Re-login to get new token

### LLM calls failing?

- Verify ANTHROPIC_API_KEY in `.env`
- Check API key has sufficient credits
- Review prompt template for syntax errors

### Build errors?

```bash
npm install  # Reinstall all dependencies
npm run type-check  # Identify TypeScript errors
```
