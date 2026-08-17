# Testing Guide

This document describes the testing structure and how to run tests for the backend.

## Test Structure

The backend uses **Vitest** for testing with the following structure:

```
packages/backend/src/__tests__/
├── unit/                      # Unit tests (no database dependencies)
│   ├── auth.service.test.ts   # Auth logic validation
│   └── checkin.service.test.ts # Check-in logic validation
├── integration/               # Integration tests (require PostgreSQL)
│   ├── auth.test.ts           # Auth API endpoints
│   ├── checkin.test.ts        # Check-in flow
│   ├── widget.test.ts         # Widget submission
│   └── progress.test.ts       # Progress API
├── helpers/
│   └── setup.ts               # Test utilities and database cleanup
```

## Running Tests

### Unit Tests (No Database Required)

Unit tests validate business logic without requiring a database:

```bash
npm test                        # Run all tests
npm run test:watch            # Run tests in watch mode
npm test -- src/__tests__/unit # Run only unit tests
```

### Integration Tests (PostgreSQL Required)

Integration tests require a running PostgreSQL database. Set up before running:

#### 1. Start PostgreSQL

**Docker Compose:**
```bash
# From project root
docker-compose up -d
```

**Or locally:**
```bash
# macOS
brew services start postgresql

# Linux
sudo service postgresql start

# Windows
# Use PostgreSQL installer or WSL
```

#### 2. Set Up Environment

Create `.env` in `packages/backend/`:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/student_companion_db
ANTHROPIC_API_KEY=sk-ant-... # For testing, can be a dummy key
CLAUDE_HAIKU_MODEL=claude-3-5-haiku-20241022
CLAUDE_SONNET_MODEL=claude-3-5-sonnet-20241022
JWT_SECRET=test-secret-key-change-in-production
JWT_EXPIRES_IN=7d
SENDGRID_API_KEY=SG... # Optional
OTP_EXPIRY_MINUTES=10
NODE_ENV=test
BACKEND_PORT=5000
FRONTEND_URL=http://localhost:5173
SCHEDULER_TIMEZONE=Asia/Kolkata
```

#### 3. Run Integration Tests

```bash
npm test -- src/__tests__/integration  # Run integration tests only
```

#### 4. Clean Up

```bash
# Reset database
npx prisma migrate reset --force

# Or manually drop and recreate
docker-compose down -v              # Remove volumes
docker-compose up -d                # Recreate database
npx prisma migrate dev --name init   # Run migrations
```

## Test Coverage

### Unit Tests (Available Now)

- ✅ Auth service logic validation
- ✅ Check-in logic validation
- ✅ Email, OTP, role validation
- ✅ XP calculation
- ✅ Check-in frequency limiting
- ✅ Topic and explanation validation

### Integration Tests (Setup in Progress)

- ⏳ Auth flow (OTP send, verify, token refresh)
- ⏳ Check-in flow (start, submit, evaluate)
- ⏳ Widget flow (submit response, score)
- ⏳ Progress API (overview, topics, history)
- ⏳ Parent API (children, progress, invites)
- ⏳ Rate limiting enforcement
- ⏳ Error handling

### E2E Tests (To Be Implemented)

- ⏳ Complete user journey (login → check-in → widget → progress)
- ⏳ Parent-child linking flow
- ⏳ Badge unlocking
- ⏳ Streak calculation
- ⏳ Scheduler job execution

## Mocking Strategy

### LLM Calls

LLM calls (Claude API) are mocked in tests to:
- Avoid API costs
- Enable offline testing
- Ensure consistent test results

Example mock response:
```javascript
{
  mastery_score: 75,
  gap_type: 'none',
  gap_description: 'Good understanding',
  follow_up_question: 'Tell me more about this'
}
```

### Email Service

Email sending is stubbed and returns success without actually sending emails.

## CI/CD Integration

Tests run automatically in GitHub Actions on every PR (setup in progress).

### Test Expectations

- All unit tests must pass
- Integration tests must pass when database is available
- Code coverage > 70% for critical paths
- No breaking changes to API

## Adding New Tests

### Unit Test Template

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  describe('Specific functionality', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test input';

      // Act
      const result = someFunction(input);

      // Assert
      expect(result).toBe('expected output');
    });
  });
});
```

### Integration Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app, cleanupDatabase, prismaTest } from '../helpers/setup.js';

describe('API Endpoint', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterEach(async () => {
    await cleanupDatabase();
  });

  it('should handle valid request', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .send({ data: 'test' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('result');
  });
});
```

## Debugging Tests

### Run Single Test File

```bash
npm test -- src/__tests__/unit/auth.service.test.ts
```

### Run Tests Matching Pattern

```bash
npm test -- --grep "mastery score"
```

### Debug Mode (with inspect)

```bash
node --inspect-brk ./node_modules/vitest/vitest.mjs run
```

Then open `chrome://inspect` in Chrome DevTools.

## Known Issues

1. **Database Connection**: Tests require PostgreSQL. Use Docker Compose for easy setup.
2. **Rate Limiting**: Integration tests may trigger rate limits. Run in isolation if needed.
3. **Time-Sensitive Tests**: Tests using time-based logic may be flaky. Use mocked dates when possible.

## Performance

- Unit tests: ~1-2 seconds
- Integration tests: ~5-10 seconds (depending on database performance)
- Full test suite: ~10-15 seconds

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing/unit-testing)
