# 🚀 Developer Onboarding Guide

## 📍 You Are Here
You're working on a **Habit Tracking Web Application** built with modern web technologies. This guide will get you productive in < 10 minutes.

## 🎯 Quick Context
- **What**: Web app for tracking daily habits and building streaks
- **Stack**: Next.js 15, TypeScript, Prisma, PostgreSQL, Clerk Auth
- **Status**: ~60% to MVP - Backend complete, needs UI components
- **Architecture**: Monorepo structure, ready for mobile apps later

## 🏃 Instant Start (3 Steps)
```bash
# 1. Install dependencies
cd apps/web && pnpm install

# 2. Copy environment variables
cp .env.example .env
# Then add your actual credentials to .env

# 3. Start development
pnpm dev
```

## 🗺️ Codebase Map
```
apps/web/src/
├── app/                    # Next.js 15 App Router
│   ├── api/               # Backend endpoints
│   │   ├── habits/        # CRUD operations for habits
│   │   ├── webhooks/      # Clerk user sync
│   │   └── test-*/        # Test endpoints (remove in prod)
│   ├── dashboard/         # Main user interface (needs work)
│   ├── sign-in/          # Auth pages (complete)
│   └── page.tsx          # Home page (needs work)
├── lib/                   # Shared utilities
│   ├── prisma.ts         # Database client
│   ├── auth.ts           # User helpers
│   ├── logger.ts         # Logging utility
│   ├── errors.ts         # Error classes
│   ├── api-handler.ts    # API wrappers
│   └── validations/      # Input validation
└── generated/            # Prisma types
```

## 💡 Key Concepts for New Developers

### 1. **Authentication Flow**
```typescript
// Every API route automatically has user context
const user = await getOrCreateUser(); // Gets or creates DB user from Clerk
```

### 2. **Database Queries**
```typescript
// Always scoped to current user
const habits = await prisma.habit.findMany({
  where: { userId: user.id }
});
```

### 3. **API Pattern**
```typescript
// All routes use this pattern
export const GET = withErrorHandler(async () => {
  const user = await getOrCreateUser();
  // Your logic here
  return successResponse(data);
});
```

### 4. **Error Handling**
```typescript
// Throw errors, they're caught automatically
throw new NotFoundError('Habit not found');
throw new ValidationError(['Name is required']);
```

## 🔧 Common Tasks

### Add a New API Endpoint
1. Create file in `app/api/your-endpoint/route.ts`
2. Use the standard pattern:
```typescript
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { getOrCreateUser } from '@/lib/auth';

export const GET = withErrorHandler(async () => {
  const user = await getOrCreateUser();
  // Implementation
  return successResponse(data);
});
```

### Add a New Database Model
1. Edit `prisma/schema.prisma`
2. Run `pnpm db:push` (dev) or `pnpm db:migrate` (prod)
3. Types are auto-generated

### Add a New Page
1. Create folder in `app/your-page/`
2. Add `page.tsx` file
3. Page is automatically routed at `/your-page`

## 🧪 Testing
```bash
pnpm test          # Run tests
pnpm test:watch    # Watch mode
pnpm test:coverage # Coverage report
```

## 📝 Current TODO List
1. **Habit Creation UI** - Form to create new habits
2. **Habit Management** - Edit/delete habits
3. **Daily Tracking** - Check off habits each day
4. **Streak Display** - Show consecutive days
5. **Home Page** - Landing page with CTAs

## 🚨 Important Notes
- **Environment Variables**: Never commit `.env` file
- **Database**: Always use `userId` filtering
- **Auth**: Routes are protected by default via middleware
- **Logging**: Use `logger`, not `console.log`
- **Errors**: Throw custom errors, don't return error responses

## 📚 Quick Reference

### Database Schema
```prisma
User {
  id, clerkId, email, name
  habits: Habit[]
}

Habit {
  id, name, description, streak, isActive
  user: User
  entries: HabitEntry[]
}

HabitEntry {
  id, date, completed, notes
  habit: Habit
}
```

### API Endpoints
- `GET/POST /api/habits` - List/create habits
- `GET/PATCH/DELETE /api/habits/[id]` - Single habit ops
- `POST /api/webhooks/clerk` - User sync webhook

### Key Commands
```bash
pnpm dev          # Start development server
pnpm db:studio    # View database GUI
pnpm lint         # Check code quality
pnpm build        # Production build
```

## 🆘 Getting Help
1. Check existing code patterns in `/api/habits/`
2. Run tests to understand behavior
3. Use TypeScript for autocomplete
4. Database GUI: `pnpm db:studio`

## 🎉 You're Ready!
Start with the dashboard at `/dashboard` and work on adding the missing UI components. The backend is fully functional - you just need to build the frontend!