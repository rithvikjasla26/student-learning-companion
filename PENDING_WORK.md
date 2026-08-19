# PENDING WORK ITEMS

**Generated:** August 19, 2026
**Based On:** Comprehensive Audit (audit_project.md)
**Status:** 2 Critical Gaps, 3 Polish Items

---

## P0 - CRITICAL (Blocks Spec Compliance)

### ✅ P0.1: Award XP on Widget Completion

**Priority:** CRITICAL
**Impact:** Gamification incomplete - students don't get rewarded for practicing
**Effort:** 15 minutes
**Files Affected:** 1 file

**Current State:**
```typescript
// packages/backend/src/services/widget.service.ts
const XP_WIDGET_COMPLETE = 5; // ← Defined but never used ❌

async submitWidgetResponse(studentId, widgetId, studentAnswer, sessionId) {
  // Evaluates answer
  // Stores response
  // ❌ NO XP AWARDED
}
```

**Required Changes:**

**File 1:** `packages/backend/src/services/widget.service.ts`
```typescript
// After line 80 (after widgetResponse is created):
// Add:
if (isCorrect) {
  await gamificationService.awardXP(studentId, XP_WIDGET_COMPLETE, 'widget_completion');

  // If part of a check-in session, update session's total XP
  if (sessionId) {
    await prisma.checkInSession.update({
      where: { id: sessionId },
      data: { xpEarned: { increment: XP_WIDGET_COMPLETE } }
    });
  }
}
```

**Testing:**
1. Student completes widget correctly → should receive 5 XP
2. Check session total XP should increment
3. StudentStats.totalXp should increase
4. If this brings them to 100 XP, level should increment

**Verification Script:**
```bash
# After fix, check-in → widget → verify XP awarded
curl -X GET http://localhost:5000/api/progress/overview \
  -H "Authorization: Bearer <token>" | jq '.xp, .level'
```

---

### ✅ P0.2: Implement Per-Subject Levels

**Priority:** HIGH
**Impact:** Spec non-compliance - levels are global-only, should be per-subject
**Effort:** 45 minutes
**Files Affected:** 3-4 files

**Current State:**
```typescript
// packages/backend/prisma/schema.prisma
model StudentStats {
  level: Int @default(1)  // ← Global level only
  // Missing: per-subject level tracking
}
```

**Spec Requirement:**
> "Level thresholds implemented, **per-subject levels tracked separately**"

**Recommended Solution (Option A - Simpler):**

**File 1:** `packages/backend/prisma/schema.prisma`
```prisma
model StudentStats {
  id              String   @id @default(cuid())
  studentId       String   @unique
  totalXp         Int      @default(0)
  level           Int      @default(1)  // Keep for global reference

  // ← NEW: Per-subject levels
  subjectLevels   Json     @default("{}")  // {"Science": 3, "Math": 2, ...}

  streakCount     Int      @default(0)
  lastCheckInDate DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@map("student_stats")
}
```

**File 2:** `packages/backend/src/services/gamification.service.ts`
```typescript
// Add new function after awardXP():
async awardXPBySubject(
  studentId: string,
  subject: string,
  amount: number,
  reason: string
): Promise<{
  totalXp: number;
  globalLevel: number;
  subjectLevel: number;
  leveledUp: boolean;
}> {
  const stats = await prisma.studentStats.findUnique({
    where: { studentId },
  });

  if (!stats) throw new Error('Student stats not found');

  // Update global XP
  const newTotalXp = stats.totalXp + amount;
  const previousGlobalLevel = this.getLevel(stats.totalXp);
  const newGlobalLevel = this.getLevel(newTotalXp);

  // Update subject-specific XP & level
  const subjectLevels = (stats.subjectLevels as any) || {};
  const currentSubjectXp = (subjectLevels[subject] || 0) as number;
  const newSubjectXp = currentSubjectXp + amount;
  const previousSubjectLevel = this.getLevel(currentSubjectXp);
  const newSubjectLevel = this.getLevel(newSubjectXp);

  subjectLevels[subject] = newSubjectXp;

  const updated = await prisma.studentStats.update({
    where: { studentId },
    data: {
      totalXp: newTotalXp,
      level: newGlobalLevel,
      subjectLevels,
    },
  });

  return {
    totalXp: updated.totalXp,
    globalLevel: newGlobalLevel,
    subjectLevel: newSubjectLevel,
    leveledUp: newSubjectLevel > previousSubjectLevel,
  };
}
```

**File 3:** `packages/backend/src/services/checkin.service.ts`
```typescript
// In evaluateExplanation(), after awardXP():
// Replace:
// await gamificationService.awardXP(studentId, xpEarned, reason);
//
// With:
await gamificationService.awardXPBySubject(
  studentId,
  topic.subject,
  xpEarned,
  reason
);
```

**File 4:** `packages/frontend/src/pages/ProgressPage.tsx`
```typescript
// In subjectLevels calculation, show per-subject level:
const subjectXpMap = /* calculate from progress */;
const subjectLevelMap = {};
for (const [subject, xp] of Object.entries(subjectXpMap)) {
  subjectLevelMap[subject] = Math.floor((xp as number) / 100) + 1;
}

// In render:
{Object.entries(subjectLevelMap).map(([subject, level]) => (
  <div key={subject}>
    <p>{subject} Level: {level}</p>
  </div>
))}
```

**Testing:**
1. Student checks in on Science topic
2. Awards 15 XP for check-in
3. Verify `studentStats.subjectLevels` has `Science: 15`
4. After 100 XP in Science, level should be 2

**Verification:**
```bash
curl -X GET http://localhost:5000/api/progress/overview \
  -H "Authorization: Bearer <token>" | jq '.subjectLevels'
# Expected: { "Science": 2, "Math": 1, ... }
```

---

## P1 - HIGH PRIORITY (Polish & Error Handling)

### P1.1: Add Retry Logic for LLM Failures

**Priority:** MEDIUM
**Impact:** Resilience - LLM API failures cause check-ins to fail completely
**Effort:** 30 minutes
**Files Affected:** 1 file

**Current State:**
```typescript
// If Claude API fails, request fails immediately
// No fallback, no retry, no graceful degradation
```

**Solution:**
```typescript
// packages/backend/src/services/llm.service.ts
async callLLMWithRetry(
  model: 'haiku' | 'sonnet',
  userMessage: string,
  systemPrompt?: string,
  maxRetries = 3
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await this.callLLM(model, userMessage, systemPrompt);
    } catch (error: any) {
      lastError = error;

      if (error.status === 429) {
        // Rate limited, wait exponentially longer
        await new Promise(resolve =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      } else if (error.status >= 500) {
        // Server error, retry
        await new Promise(resolve =>
          setTimeout(resolve, 1000)
        );
      } else {
        // Client error, don't retry
        throw error;
      }
    }
  }

  throw new Error(
    `LLM call failed after ${maxRetries} attempts: ${lastError?.message}`
  );
}
```

**Replace all `this.callLLM()` calls with `this.callLLMWithRetry()`**

---

### P1.2: Add E2E Test for Full Check-in Flow

**Priority:** MEDIUM
**Impact:** Confidence in full user flow, catch integration issues
**Effort:** 90 minutes
**Files Affected:** 1 new file

**Location:** `packages/backend/src/__tests__/e2e/checkin-flow.test.ts`

**Test Cases:**
```typescript
describe('E2E: Complete Check-in Flow', () => {
  it('should run full check-in → widget → reconfirm flow', async () => {
    // 1. Create student user
    // 2. GET /api/check-in/start → get topic
    // 3. POST /api/check-in/submit → LLM evaluation
    // 4. GET /api/widget/... → get widget
    // 5. POST /api/widget/submit → widget response
    // 6. POST /api/reconfirm/submit → reconfirm evaluation
    // 7. GET /api/progress/overview → verify stats updated
    // 8. Assert: XP awarded, mastery updated, SM2 metrics changed
  });
});
```

---

### P1.3: Add Frontend Unit Tests for Components

**Priority:** LOW
**Impact:** Confidence in UI components
**Effort:** 120 minutes
**Files Affected:** Multiple test files

**Components to Test:**
- CheckInPage (form submission, state management)
- EvaluationFeedback (conditional rendering)
- WidgetPage (widget loading and interaction)
- ReconfirmPage (re-explanation submission)
- ProgressPage (data fetching and chart rendering)

---

## P2 - NICE-TO-HAVE (Enhancements)

### P2.1: Improve Widget Answer Validation

**Priority:** LOW
**Impact:** Better gamification fairness
**Effort:** 20 minutes
**Current:** Fuzzy matching is too lenient
**Recommendation:** Add concept keywords matching for FillInBlank

### P2.2: Add Real Email/OTP Implementation

**Priority:** MEDIUM
**Impact:** Production readiness for real deployments
**Current:** Hardcoded OTP "123456"
**Recommendation:** Integrate SendGrid or AWS SES

### P2.3: Implement Voice Input (Whisper API)

**Priority:** MEDIUM
**Impact:** Accessibility and ease of use
**Current:** AudioRecorder UI component exists but backend stub returns placeholder
**Recommendation:** Integrate Anthropic's Whisper API or OpenAI Whisper

---

## WORK PRIORITY SCHEDULE

### Week 1 (Immediate)
- [ ] **P0.1** - Award XP on Widget Completion (15 min)
  - Unblocks full gamification flow
  - Critical for fairness of reward system

### Week 1 (Following)
- [ ] **P0.2** - Implement Per-Subject Levels (45 min)
  - Completes spec compliance
  - Enhances user engagement with subject-specific progression

### Week 2
- [ ] **P1.1** - Add LLM Retry Logic (30 min)
  - Improves reliability
  - Reduces user-facing failures

### Week 2-3
- [ ] **P1.2** - E2E Tests (90 min)
  - Validates full flows
  - Prevents regressions

### Week 3+
- [ ] **P1.3** - Frontend Component Tests (120 min)
- [ ] **P2.x** - Nice-to-have enhancements

---

## VERIFICATION CHECKLIST

After implementing each fix:

### P0.1 Verification
- [ ] Widget response → 5 XP awarded
- [ ] Session total XP incremented
- [ ] StudentStats.totalXp increased
- [ ] Progress page shows new XP
- [ ] Level increments at 100 XP threshold

### P0.2 Verification
- [ ] Schema migration succeeds
- [ ] Per-subject levels calculated correctly
- [ ] Progress page shows subject-specific levels
- [ ] XP awarded by subject (not just global)
- [ ] Multiple subjects tracked independently

### P1.1 Verification
- [ ] Simulate API failure (mock)
- [ ] Verify retry occurs
- [ ] Exponential backoff working
- [ ] Final failure after max retries

### P1.2 Verification
- [ ] Test runs against PostgreSQL
- [ ] All assertions pass
- [ ] Check-in → widget → reconfirm completes
- [ ] Database state correct at each step
- [ ] Stats and metrics updated

---

## DEPLOYMENT CONSIDERATIONS

**Before Production:**
1. ✅ All P0 items fixed and tested
2. ✅ Environment variables secured (use .env production)
3. ⏳ Database migrated (schema changes for per-subject levels)
4. ⏳ E2E tests passing
5. ✅ Error handling comprehensive

**Current Status:** Can deploy after P0.1 and P0.2 fixes

---

## Questions for Product/Engineering

1. **Per-Subject Levels:** Should subject levels affect badge unlock criteria? (e.g., "Science Expert" at Science Level 10)
2. **LLM Costs:** Is Sonnet for re-confirmation sustainable long-term? Consider moving to Haiku or intermediate model
3. **Widget XP:** Should widget XP scale with difficulty? (easy=3, medium=5, hard=8)
4. **User Testing:** When should real user testing begin? (After P0.1? P0.2? All E2E tests?)
5. **Deployment Target:** Render.com (config provided) or other platform?

---

## Related Documents

- **Completed Audit:** `audit_project.md` (comprehensive findings)
- **Progress Summary:** `PROGRESS_SUMMARY.md` (previous milestone tracking)
- **Deployment Guide:** `DEPLOYMENT.md` (production setup)
- **Testing Guide:** `packages/backend/TESTING.md` (test framework)

---

**Last Updated:** August 19, 2026
**Status:** Ready for implementation
**Next Review:** After P0 items completed

