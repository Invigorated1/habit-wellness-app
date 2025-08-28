# 🤖 AI Assistant Context File

## Project State Snapshot
**Last Updated**: Current Session
**Project**: Habit Wellness App
**Stage**: MVP Development (60% complete)
**Next Task**: Build habit creation/management UI

## Quick Facts for AI
- **Framework**: Next.js 15 with App Router (not Pages Router!)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Clerk (users auto-created on first API call)
- **Styling**: TailwindCSS v4
- **Monorepo**: Yes, using pnpm workspaces

## Current File Structure
```
/workspace/
├── apps/web/src/
│   ├── app/
│   │   ├── api/habits/         # ✅ CRUD endpoints complete
│   │   ├── dashboard/          # ⚠️ Basic UI, needs features
│   │   └── page.tsx           # ⚠️ Needs landing page
│   └── lib/
│       ├── prisma.ts          # ✅ DB client singleton
│       ├── auth.ts            # ✅ User helpers
│       ├── logger.ts          # ✅ Structured logging
│       ├── errors.ts          # ✅ Error classes
│       └── validations/       # ✅ Input validation
```

## Code Patterns to Follow

### ✅ ALWAYS use this API pattern:
```typescript
export const GET = withErrorHandler(async (request: Request) => {
  const user = await getOrCreateUser();
  logger.info('Action', { userId: user.id });
  // Logic here
  return successResponse(data);
});
```

### ✅ ALWAYS filter by user:
```typescript
await prisma.habit.findMany({
  where: { userId: user.id } // Required!
});
```

### ✅ ALWAYS throw errors (don't catch):
```typescript
throw new NotFoundError('Habit not found');
throw new ValidationError(['Invalid input']);
```

## What's Working
- ✅ User authentication (Clerk)
- ✅ Database connection (Neon)
- ✅ All API endpoints (habits CRUD)
- ✅ Error handling system
- ✅ Logging system
- ✅ Rate limiting
- ✅ Input validation
- ✅ Basic tests

## What's Needed for MVP
1. **Habit Creation Form** - UI to create new habits
2. **Habit List with Actions** - Edit/delete buttons
3. **Daily Check-off** - Mark habits complete
4. **Streak Display** - Show consecutive days
5. **Landing Page** - Home page with sign-up CTA

## Common Commands
```bash
cd apps/web
pnpm dev          # Start dev server
pnpm test         # Run tests
pnpm db:studio    # View database GUI
```

## Environment Variables Needed
```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

## Database Schema
```prisma
model User {
  id        String   @id
  clerkId   String   @unique
  email     String   @unique
  habits    Habit[]
}

model Habit {
  id          String   @id
  name        String
  description String?
  streak      Int      @default(0)
  isActive    Boolean  @default(true)
  userId      String
  user        User     @relation(...)
  entries     HabitEntry[]
}

model HabitEntry {
  id        String   @id
  date      DateTime
  completed Boolean
  habitId   String
  habit     Habit    @relation(...)
}
```

## UI Component Patterns
When creating components:
- Use `'use client'` for interactive components
- Use SWR for data fetching
- Use Tailwind classes for styling
- Follow existing dashboard pattern

## Testing
- Framework: Vitest
- Run: `pnpm test`
- Pattern: `src/**/__tests__/*.test.ts`

## Important Context
1. **Monorepo**: This is apps/web in a monorepo
2. **No Redux**: Using SWR for server state
3. **TypeScript**: Strict mode enabled
4. **Protected Routes**: Middleware handles auth
5. **User Sync**: Webhook + fallback pattern

## Common Pitfalls to Avoid
- ❌ Don't use Pages Router patterns
- ❌ Don't forget userId filtering
- ❌ Don't use console.log (use logger)
- ❌ Don't catch errors in routes
- ❌ Don't create users manually

## AI Instructions
1. When adding features, check existing patterns first
2. Always maintain type safety
3. Follow the established error handling
4. Use the logger for debugging
5. Test changes with `pnpm test`

## Current Session Goals
- Build habit creation UI
- Add edit/delete functionality
- Implement daily tracking
- Calculate streaks properly
- Polish the dashboard

Remember: Backend is complete, focus on frontend!