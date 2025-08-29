# Test Coverage Improvement Plan

## Current Status

### ✅ Passing Tests (4 suites, 38 tests)
- `validations.test.ts` - 12 tests
- `rate-limit.test.ts` - 6 tests  
- `logger.test.ts` - 3 tests
- `errors.test.ts` - 10 tests

### ❌ Failing Tests (6 suites, 25 tests)
1. **api-handler.test.ts** - 5/11 tests failing
   - Issue: Request object structure mismatch
   - Fix: Mock request objects properly

2. **habits route tests** - 8/9 tests failing
   - Issue: Request URL undefined, error handling
   - Fix: Proper request mocking

3. **classifier.test.ts** - 7/7 tests failing  
   - Issue: `traitScores` expects array, getting object
   - Fix: Update test data structure

4. **task-scheduler.test.ts** - 5/5 tests failing
   - Issue: Methods not exported
   - Fix: Export public methods

5. **variable-rewards.test.ts** - Compilation error
   - Issue: `await` in non-async function
   - Fix: Make function async

6. **graceful-streaks.test.ts** - Import error
   - Issue: Prisma middleware not supported in mocks
   - Fix: Mock Prisma properly

## Coverage Gaps

### Critical Missing Tests
1. **Components** (0% coverage)
   - Onboarding components
   - Theme components
   - UI components
   - Dashboard components

2. **API Routes** (partial coverage)
   - `/api/webhooks/clerk`
   - `/api/onboarding/submit`
   - `/api/cron/schedule-tasks`
   - `/api/monitoring/*`

3. **Hooks** (0% coverage)
   - `useRewards`
   - `useAnnouncer`

4. **Stores** (0% coverage)
   - `onboarding` store

5. **Utilities** (partial coverage)
   - `redis.ts`
   - `monitoring/*`
   - `notifications/*`

## Action Plan

### Phase 1: Fix Failing Tests (Priority)
1. Fix api-handler test request mocking
2. Fix classifier test data structure
3. Fix async/await in variable-rewards
4. Fix Prisma mocking for middleware
5. Export missing methods in task-scheduler

### Phase 2: Add Unit Tests (Core Logic)
1. Archetype classifier edge cases
2. Task scheduler logic
3. Reward engine probability
4. Streak system calculations
5. Notification engine rules

### Phase 3: Add Integration Tests
1. Database operations with test DB
2. API endpoint integration
3. Webhook handling
4. Cron job execution

### Phase 4: Add Component Tests
1. Onboarding flow components
2. Theme switching
3. Accessibility features
4. Interactive UI elements

### Phase 5: Add E2E Tests (Separate)
1. Complete onboarding journey
2. Daily task completion
3. Streak maintenance
4. Reward collection

## Target Metrics
- **Current**: ~40% coverage (estimated)
- **Goal**: 80% coverage
- **Critical paths**: 95% coverage

## Testing Best Practices
1. Use test factories for consistent data
2. Mock external services (Clerk, PostHog, Redis)
3. Test both success and error paths
4. Use descriptive test names
5. Group related tests logically
6. Add performance benchmarks for critical paths

## Next Steps
1. Fix all failing tests first
2. Add missing unit tests for business logic
3. Add integration tests for API routes
4. Add component tests with React Testing Library
5. Set up E2E tests with Playwright
6. Configure coverage reporting in CI