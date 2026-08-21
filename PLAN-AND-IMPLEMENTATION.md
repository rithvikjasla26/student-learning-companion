# Learning Hub Dashboard - Plan & Implementation Tracking

## Plan Overview
Create a unified Learning Hub Dashboard that consolidates teaching/progress/review workflow into a single page.

**Status**: 🟡 PLANNING PHASE
**Last Updated**: 2026-08-21

---

## Phase Breakdown & Status

### Phase 1: Backend Enhancements
Status: ⏳ PENDING

#### 1.1 New API Endpoint: Review Queue
- [ ] Create `/packages/backend/src/routes/learningHub.routes.ts`
- [ ] Create `/packages/backend/src/controllers/learningHub.controller.ts`
- [ ] Create `/packages/backend/src/services/learningHub.service.ts`
- Endpoint: `GET /learning-hub/review-queue?filter=all|today|this-week|overdue`
- Returns: `{ dueTopics[], totalDue, overdueCount }`

#### 1.2 Enhance TaughtLog Service
- [ ] Update `/packages/backend/src/services/taughtlog.service.ts`
  - Add `getTopicsHierarchy()` method
  - Returns: Subject → Chapter → Topic/Subtopic mapping
  - Add caching layer

#### 1.3 Validation Schemas
- [ ] Update `/packages/backend/src/types/validation.schemas.ts`
  - Add `reviewQueueFilters` validation
  - Add `logTeachingQuick` validation

#### 1.4 App Integration
- [ ] Update `/packages/backend/src/app.ts`
  - Import and register learningHub routes

---

### Phase 2: Frontend - Learning Hub Page
Status: ⏳ PENDING

#### 2.1 Main Page Component
- [ ] Create `/packages/frontend/src/pages/LearningHubPage.tsx`
  - Main container (350-400 lines)
  - Three sections: Log Teaching | Due for Review | Progress Overview
  - Responsive grid layout

#### 2.2 Sub-components
- [ ] Create `QuickStatBar.tsx` (80 lines)
  - Today's check-ins, streak, total mastery, topics due
  - Real-time updates

- [ ] Create `LogTeachingSection.tsx` (200 lines)
  - Hierarchical select: Subject → Chapter → Topic
  - Source radio buttons (School/Coaching/Self-study)
  - Coverage radio buttons (Intro/Practice/Revision)
  - Homework checkbox

- [ ] Create `ReviewQueueSection.tsx` (250 lines)
  - Filter buttons: All | Today | This Week | Overdue
  - Topic table with mastery/confidence scores
  - SM-2 details (collapsible)
  - Start Review button

- [ ] Create `ProgressOverviewSection.tsx` (180 lines)
  - Subject cards with progress bars
  - XP and level display
  - Recent topics list

- [ ] Create `TopicHierarchySelect.tsx` (120 lines)
  - Reusable cascading select component
  - Subject → Chapter → Topic
  - Lazy loading

#### 2.3 Service Layer
- [ ] Create `/packages/frontend/src/services/learningHub.service.ts`
  - `getReviewQueue(filter)`
  - `getTaughtHistory()`
  - `getTopicHierarchy()`
  - `getQuickStats()`

#### 2.4 Navigation Integration
- [ ] Update `/packages/frontend/src/components/Header.tsx`
  - Add "Learning Hub" nav item

- [ ] Update `/packages/frontend/src/App.tsx`
  - Add route: `/learning-hub`

---

### Phase 3: UI/UX Improvements
Status: ⏳ PENDING

#### 3.1 Topic Selection UX
- [ ] Show topic/chapter counts in dropdown labels
- [ ] Add search/filter for topics
- [ ] Recent topics quick-access

#### 3.2 Forgetting Curve Visualization
- [ ] SM-2 details display in ReviewQueueSection
- [ ] Show: Ease Factor, Interval, Repetitions
- [ ] Educational popup on how SM-2 works

#### 3.3 Color Coding & Visual Design
- [ ] Mastery bars: Red (0-30%) → Yellow (30-60%) → Green (60-100%)
- [ ] Confidence vs Mastery mismatch highlighting
- [ ] Overdue: Red badge "OVERDUE"
- [ ] Due today: Orange badge "TODAY"
- [ ] Due soon: Gray "In X days"

---

### Phase 4: Navigation & Routing
Status: ⏳ PENDING

- [ ] Add Learning Hub to header navigation
- [ ] Update app routing with `/learning-hub` path
- [ ] Link from CheckInPage: "Return to Learning Hub" button
- [ ] Link from ProgressPage: "Topics Due for Review" widget

---

### Phase 5: Testing & Verification
Status: ⏳ PENDING

#### Manual Testing Checklist
- [ ] Log new teaching: Subject → Chapter → Topic selection
- [ ] Verify teaching appears in history
- [ ] Review queue sorted by nextDueAt
- [ ] Filters work correctly (Today/This Week/Overdue)
- [ ] Start Review → navigates to CheckInPage
- [ ] Post check-in → review queue updates with new SM-2 schedule
- [ ] Progress section shows correct XP/levels
- [ ] SM-2 details show reasonable values
- [ ] Mobile responsive layout

#### Edge Cases
- [ ] First-time user (no taught logs) → empty state
- [ ] No topics due → "All caught up" message
- [ ] Multiple topics due → correct sort order
- [ ] Confidence > mastery → highlight false confidence
- [ ] High mastery (95%+) → ease factor > 2.0

---

## Implementation Files Checklist

### Backend (5 files)
- [ ] `/packages/backend/src/routes/learningHub.routes.ts` (NEW)
- [ ] `/packages/backend/src/controllers/learningHub.controller.ts` (NEW)
- [ ] `/packages/backend/src/services/learningHub.service.ts` (NEW)
- [ ] `/packages/backend/src/services/taughtlog.service.ts` (MODIFY)
- [ ] `/packages/backend/src/types/validation.schemas.ts` (MODIFY)
- [ ] `/packages/backend/src/app.ts` (MODIFY)

### Frontend (8 files)
- [ ] `/packages/frontend/src/pages/LearningHubPage.tsx` (NEW)
- [ ] `/packages/frontend/src/services/learningHub.service.ts` (NEW)
- [ ] `/packages/frontend/src/components/QuickStatBar.tsx` (NEW)
- [ ] `/packages/frontend/src/components/LogTeachingSection.tsx` (NEW)
- [ ] `/packages/frontend/src/components/ReviewQueueSection.tsx` (NEW)
- [ ] `/packages/frontend/src/components/ProgressOverviewSection.tsx` (NEW)
- [ ] `/packages/frontend/src/components/TopicHierarchySelect.tsx` (NEW)
- [ ] `/packages/frontend/src/components/Header.tsx` (MODIFY)
- [ ] `/packages/frontend/src/App.tsx` (MODIFY)

---

## API Contracts

### GET /learning-hub/review-queue
```json
{
  "dueTopics": [
    {
      "id": "topic-123",
      "subject": "Science",
      "chapter": "Photosynthesis",
      "subtopic": "Light Reactions",
      "masteryScore": 65,
      "confidenceScore": 72,
      "nextDueAt": "2026-08-21",
      "daysUntilDue": 0,
      "sm2State": {
        "easeFactor": 2.1,
        "intervalDays": 3,
        "repetitions": 5
      }
    }
  ],
  "totalDue": 3,
  "overdueCount": 1
}
```

### GET /learning-hub/quick-stats
```json
{
  "checkInsToday": 2,
  "streak": 5,
  "totalMastery": 72,
  "topicsDue": 3
}
```

### GET /learning-hub/topics-hierarchy
```json
{
  "subjects": [
    {
      "name": "Science",
      "chapters": [
        {
          "name": "Photosynthesis",
          "topics": ["Light Reactions", "Dark Reactions"]
        }
      ]
    }
  ]
}
```

---

## Design Philosophy

1. **One-screen experience** - Core workflow on single page
2. **Progressive disclosure** - SM-2 details expandable, not forced
3. **Data-driven UI** - Color coding tells the story at a glance
4. **Spaced repetition transparent** - Show HOW algorithm works
5. **Mobile-first** - Responsive, touch-friendly
6. **Fast interactions** - Instant feedback, no spinners

---

## Session Notes & Resumption Points

### Session 1 (2026-08-21)
- ✅ Plan created and approved
- ✅ Comprehensive design documented
- Next: Start Phase 1 backend implementation

### Session 2
- [ ] Complete Phase 1 (Backend)
- [ ] Start Phase 2 (Frontend)

### Session 3
- [ ] Complete Phase 2 (Frontend pages)
- [ ] Start Phase 3 (UI/UX polish)

### Session 4
- [ ] Complete Phase 3 (UI/UX)
- [ ] Phase 4 (Navigation)
- [ ] Phase 5 (Testing)

---

## Success Metrics

- ✅ Users can log teaching in <30 seconds
- ✅ Clear understanding of "what's due for review"
- ✅ Users see SM-2 algorithm working (growing intervals)
- ✅ Increased check-in frequency (better visibility)
- ✅ Reduced navigation overhead (one-page experience)

---

## Critical Reminders

- Reuse existing SM-2 algorithm from `/packages/backend/src/utils/sm2.ts`
- Reuse StudentTopicProgress model for tracking
- Keep components under 250 lines each (split if needed)
- Mobile-first responsive design
- Real-time stats updates after actions
- Color-coded urgency (Red=Overdue, Orange=Today, Gray=Future)

---

*Generated: 2026-08-21 | Plan Status: Ready for Implementation*
