# Development Guide

This guide covers everything you need to know to develop and contribute to the Habit Tracker application.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Code Organization](#code-organization)
4. [Database Management](#database-management)
5. [API Development](#api-development)
6. [Frontend Development](#frontend-development)
7. [Mobile Development](#mobile-development)
8. [Testing Guide](#testing-guide)
9. [Performance Optimization](#performance-optimization)
10. [Troubleshooting](#troubleshooting)

## Getting Started

### System Requirements

- **Node.js**: v20.0.0 or higher
- **pnpm**: v9.0.0 or higher
- **PostgreSQL**: v14 or higher (or use cloud provider)
- **Git**: v2.0.0 or higher

### Initial Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/habit-tracker.git
   cd habit-tracker
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Configuration**
   ```bash
   # Copy example env files
   cp apps/web/.env.example apps/web/.env.local
   cp apps/mobile/.env.example apps/mobile/.env.local
   
   # Edit with your values
   code apps/web/.env.local
   ```

4. **Database Setup**
   ```bash
   cd apps/web
   
   # Generate Prisma client
   pnpm prisma generate
   
   # Push schema to database
   pnpm prisma db push
   
   # (Optional) Seed with sample data
   pnpm db:seed
   ```

5. **Start Development Server**
   ```bash
   # From root directory
   pnpm dev
   ```

## Development Workflow

### Branch Strategy

We use a simplified Git Flow:

```
main
  └── develop
       ├── feature/add-notifications
       ├── fix/streak-calculation
       └── chore/update-deps
```

### Creating a Feature

1. **Create Feature Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write code
   - Add tests
   - Update documentation

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

4. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Review Process

1. All PRs require at least one review
2. CI checks must pass
3. No decrease in test coverage
4. Documentation must be updated

## Code Organization

### Directory Structure

```
apps/web/src/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Auth group routes
│   ├── (dashboard)/       # Dashboard group
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── habits/           # Habit-specific components
│   └── error-boundaries/ # Error handling
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and services
│   ├── api/             # API utilities
│   ├── analytics/       # Analytics service
│   └── prisma.ts        # Database client
└── types/               # TypeScript types
```

### Naming Conventions

- **Files**: `kebab-case.ts`
- **Components**: `PascalCase.tsx`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`

### Import Order

1. External dependencies
2. Internal aliases (`@/`)
3. Relative imports
4. Type imports

```typescript
// External
import { useState } from 'react';
import { format } from 'date-fns';

// Internal aliases
import { Button } from '@/components/ui/button';
import { useHabits } from '@/hooks/useHabits';

// Relative
import { HabitCard } from './HabitCard';

// Types
import type { Habit } from '@/types';
```

## Database Management

### Schema Changes

1. **Edit Schema**
   ```prisma
   // prisma/schema.prisma
   model Habit {
     // ... existing fields
     newField String? // Add new field
   }
   ```

2. **Create Migration** (Production)
   ```bash
   pnpm prisma migrate dev --name add_habit_field
   ```

3. **Push Changes** (Development)
   ```bash
   pnpm prisma db push
   ```

### Working with Prisma

```typescript
// Simple query
const habits = await prisma.habit.findMany({
  where: { userId: user.id },
  include: { entries: true }
});

// With transactions
const [habit, entry] = await prisma.$transaction([
  prisma.habit.create({ data: habitData }),
  prisma.habitEntry.create({ data: entryData })
]);

// Optimized queries
const habitsWithTodayEntry = await prisma.habit.findMany({
  where: { userId },
  include: {
    entries: {
      where: { date: today },
      take: 1
    }
  }
});
```

## API Development

### Creating an API Route

1. **Create Route File**
   ```typescript
   // app/api/habits/stats/route.ts
   import { NextRequest, NextResponse } from 'next/server';
   import { auth } from '@clerk/nextjs/server';
   import { z } from 'zod';
   
   const querySchema = z.object({
     period: z.enum(['week', 'month', 'year']).default('week')
   });
   
   export async function GET(request: NextRequest) {
     const { userId } = auth();
     if (!userId) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }
     
     // Validate query params
     const result = querySchema.safeParse(
       Object.fromEntries(request.nextUrl.searchParams)
     );
     
     if (!result.success) {
       return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
     }
     
     // Fetch and return data
     const stats = await getHabitStats(userId, result.data.period);
     return NextResponse.json(stats);
   }
   ```

2. **Add Rate Limiting**
   ```typescript
   import { checkRateLimit } from '@/lib/rate-limit';
   
   export async function POST(request: NextRequest) {
     const { success, response } = await checkRateLimit(request);
     if (!success) return response;
     
     // ... rest of handler
   }
   ```

3. **Add Logging**
   ```typescript
   import { logger } from '@/lib/logger';
   
   export async function POST(request: NextRequest) {
     const requestId = request.headers.get('x-request-id');
     
     try {
       // ... handler logic
       logger.info('Habit created', { requestId, habitId });
     } catch (error) {
       logger.error('Failed to create habit', { requestId, error });
       throw error;
     }
   }
   ```

## Frontend Development

### Component Guidelines

1. **Use TypeScript**
   ```typescript
   interface HabitCardProps {
     habit: Habit;
     onToggle: (id: string) => Promise<void>;
     isLoading?: boolean;
   }
   
   export function HabitCard({ habit, onToggle, isLoading }: HabitCardProps) {
     // Component logic
   }
   ```

2. **Handle Loading States**
   ```typescript
   function HabitList() {
     const { habits, isLoading, error } = useHabits();
     
     if (isLoading) return <HabitListSkeleton />;
     if (error) return <ErrorState error={error} />;
     if (!habits.length) return <EmptyState />;
     
     return <>{/* Render habits */}</>;
   }
   ```

3. **Use Error Boundaries**
   ```typescript
   <DataErrorBoundary>
     <AsyncBoundary fallback={<Loading />}>
       <HabitDashboard />
     </AsyncBoundary>
   </DataErrorBoundary>
   ```

### State Management

- **Server State**: Use SWR for caching and synchronization
- **Form State**: Use React Hook Form
- **UI State**: Use React state/context

```typescript
// SWR for server state
const { data, error, mutate } = useSWR('/api/habits', fetcher);

// React Hook Form
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(habitSchema)
});

// Local UI state
const [isOpen, setIsOpen] = useState(false);
```

## Mobile Development

### Setup React Native

1. **Install Expo CLI**
   ```bash
   npm install -g expo-cli
   ```

2. **Run Mobile App**
   ```bash
   cd apps/mobile
   pnpm start
   ```

3. **Test on Device**
   - Install Expo Go app
   - Scan QR code from terminal

### Mobile-Specific Components

```typescript
// Use platform-specific code
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30
  }
});

// Use mobile-optimized components
import { 
  ScrollView, 
  RefreshControl,
  KeyboardAvoidingView 
} from 'react-native';
```

## Testing Guide

### Unit Tests

```typescript
// habits.test.ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HabitCard } from '@/components/habits/HabitCard';

describe('HabitCard', () => {
  it('displays habit name', () => {
    const habit = { id: '1', name: 'Exercise', streak: 5 };
    render(<HabitCard habit={habit} onToggle={vi.fn()} />);
    
    expect(screen.getByText('Exercise')).toBeInTheDocument();
    expect(screen.getByText('5 days')).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
// api/habits.test.ts
import { createMocks } from 'node-mocks-http';
import { GET } from '@/app/api/habits/route';

describe('/api/habits', () => {
  it('returns 401 when not authenticated', async () => {
    const { req } = createMocks({ method: 'GET' });
    const response = await GET(req);
    
    expect(response.status).toBe(401);
  });
});
```

### E2E Tests

```typescript
// e2e/habits.spec.ts
test('create and complete habit', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Create habit
  await page.click('button:has-text("Create Habit")');
  await page.fill('input[name="name"]', 'Test Habit');
  await page.click('button[type="submit"]');
  
  // Complete habit
  await page.click('role=checkbox');
  await expect(page.getByText('1 day')).toBeVisible();
});
```

## Performance Optimization

### Database Queries

1. **Use Indexes**
   ```prisma
   model Habit {
     // ... fields
     
     @@index([userId, isActive])
     @@index([createdAt])
   }
   ```

2. **Avoid N+1 Queries**
   ```typescript
   // Bad: N+1 query
   const habits = await prisma.habit.findMany();
   for (const habit of habits) {
     habit.entries = await prisma.habitEntry.findMany({
       where: { habitId: habit.id }
     });
   }
   
   // Good: Single query
   const habits = await prisma.habit.findMany({
     include: { entries: true }
   });
   ```

3. **Use Select for Partial Data**
   ```typescript
   const habits = await prisma.habit.findMany({
     select: {
       id: true,
       name: true,
       streak: true
     }
   });
   ```

### Frontend Performance

1. **Code Splitting**
   ```typescript
   const HabitChart = dynamic(() => import('./HabitChart'), {
     loading: () => <ChartSkeleton />
   });
   ```

2. **Image Optimization**
   ```typescript
   import Image from 'next/image';
   
   <Image
     src="/achievement.png"
     alt="Achievement"
     width={100}
     height={100}
     loading="lazy"
   />
   ```

3. **Memoization**
   ```typescript
   const MemoizedHabitCard = memo(HabitCard);
   
   const expensiveValue = useMemo(
     () => calculateStats(habits),
     [habits]
   );
   ```

## Troubleshooting

### Common Issues

1. **Prisma Client Not Found**
   ```bash
   pnpm prisma generate
   ```

2. **Environment Variables Not Loading**
   - Ensure `.env.local` exists (not `.env`)
   - Restart dev server after changes
   - Check for typos in variable names

3. **TypeScript Errors**
   ```bash
   pnpm typecheck
   pnpm --filter @habit-app/shared build
   ```

4. **Database Connection Issues**
   - Verify DATABASE_URL is correct
   - Check if database is accessible
   - Try connection pooling mode

### Debug Tools

1. **React Developer Tools**
   - Install browser extension
   - Inspect component props/state

2. **Prisma Studio**
   ```bash
   pnpm prisma studio
   ```

3. **API Testing**
   ```bash
   # Using httpie
   http localhost:3000/api/habits \
     Authorization:"Bearer $TOKEN"
   
   # Using curl
   curl -H "Authorization: Bearer $TOKEN" \
     localhost:3000/api/habits
   ```

4. **Performance Profiling**
   - Use Chrome DevTools Performance tab
   - Enable React Profiler in production build
   - Monitor with Web Vitals

### Getting Help

1. Check existing issues on GitHub
2. Ask in discussions
3. Read the source code
4. Contact maintainers

---

Happy coding! 🚀