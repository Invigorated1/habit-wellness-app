# HabitStory Coding Conventions

## TypeScript Guidelines

### Type Safety
- **Strict mode**: Always enabled in tsconfig.json
- **No `any`**: Use `unknown` or specific types
- **Explicit return types**: For all public functions

```typescript
// ✅ Good
export function calculateStreak(entries: HabitEntry[]): number {
  return entries.filter(e => e.completed).length;
}

// ❌ Bad
export function calculateStreak(entries: any) {
  return entries.filter(e => e.completed).length;
}
```

### Interfaces vs Types
- Use `interface` for object shapes
- Use `type` for unions, primitives, and utilities

```typescript
// Object shapes
interface User {
  id: string;
  name: string;
}

// Unions and utilities
type Status = 'pending' | 'active' | 'completed';
type Nullable<T> = T | null;
```

## File Organization

### Naming Conventions
- **Files**: kebab-case (`user-profile.tsx`)
- **Components**: PascalCase (`UserProfile.tsx`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Types**: PascalCase with `.types.ts` suffix

### File Structure
```typescript
// 1. Imports (sorted: React, Next, external, internal, types)
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';
import type { User } from '@/types';

// 2. Type definitions
interface Props {
  user: User;
}

// 3. Component/Function
export function UserProfile({ user }: Props) {
  // Implementation
}

// 4. Helper functions (if needed)
function formatUserName(name: string): string {
  return name.trim().toLowerCase();
}
```

## React/Next.js Patterns

### Component Structure
```typescript
// Use function components with TypeScript
export function HabitCard({ habit, onComplete }: HabitCardProps) {
  // 1. Hooks first
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  // 2. Derived state
  const isCompleted = habit.lastCompletedAt === today();
  
  // 3. Event handlers
  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await completeHabit(habit.id);
      onComplete?.(habit);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 4. Early returns
  if (!habit) return null;
  
  // 5. Main render
  return (
    <Card>
      {/* Content */}
    </Card>
  );
}
```

### State Management
- Use Zustand for complex client state
- Use SWR for server state
- Keep component state minimal

```typescript
// Zustand store
export const useOnboardingStore = create<OnboardingState>((set) => ({
  currentStep: 'personality',
  setCurrentStep: (step) => set({ currentStep: step }),
}));

// SWR usage
export function useHabits() {
  const { data, error, mutate } = useSWR('/api/habits', fetcher);
  return {
    habits: data?.habits,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
```

## API Design

### RESTful Routes
```typescript
// Resource-based URLs
GET    /api/habits       // List
POST   /api/habits       // Create
GET    /api/habits/:id   // Read
PUT    /api/habits/:id   // Update
DELETE /api/habits/:id   // Delete

// Actions as sub-resources
POST   /api/habits/:id/complete
POST   /api/habits/:id/archive
```

### Response Format
```typescript
// Success response
{
  data: T,
  meta?: {
    pagination?: PaginationMeta
  }
}

// Error response
{
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

## Error Handling

### Custom Error Classes
```typescript
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

### API Error Handling
```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = habitSchema.parse(body);
    
    const habit = await createHabit(validated);
    return NextResponse.json({ data: habit });
    
  } catch (error) {
    logger.error('Failed to create habit', { error });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.errors } },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
```

## Database Patterns

### Prisma Best Practices
```typescript
// Use select to minimize data transfer
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    profile: {
      select: {
        timezone: true,
      },
    },
  },
});

// Use transactions for related operations
const [user, profile] = await prisma.$transaction([
  prisma.user.create({ data: userData }),
  prisma.profile.create({ data: profileData }),
]);
```

## Testing Conventions

### Test Structure
```typescript
describe('HabitService', () => {
  describe('createHabit', () => {
    it('should create a habit with valid data', async () => {
      // Arrange
      const input = { name: 'Meditate', frequency: 'daily' };
      
      // Act
      const result = await createHabit(input);
      
      // Assert
      expect(result).toMatchObject({
        name: 'Meditate',
        frequency: 'daily',
      });
    });
    
    it('should throw ValidationError for invalid data', async () => {
      // Test error cases
    });
  });
});
```

## Comments and Documentation

### JSDoc for Public APIs
```typescript
/**
 * Calculate user's current streak based on habit entries
 * @param entries - List of habit entries sorted by date
 * @returns Current streak count
 * @example
 * const streak = calculateStreak(user.habitEntries);
 */
export function calculateStreak(entries: HabitEntry[]): number {
  // Implementation
}
```

### Inline Comments
```typescript
// Use comments to explain WHY, not WHAT
// ❌ Bad: Increment counter
counter++;

// ✅ Good: Buffer size must be power of 2 for bit masking
const bufferSize = 1 << 16;
```

## CSS and Styling

### Tailwind Classes
- Use semantic color variables
- Group related utilities
- Extract common patterns

```tsx
// ✅ Good: Organized and uses CSS variables
<div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
  <h3 className="text-lg font-semibold text-[var(--text)]">Title</h3>
</div>

// Extract repeated patterns
const cardStyles = "rounded-lg border border-[var(--border)] bg-[var(--card)] p-6";
```

## Performance Guidelines

### Optimization Patterns
```typescript
// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return calculateComplexValue(data);
}, [data]);

// Debounce user input
const debouncedSearch = useMemo(
  () => debounce((term: string) => search(term), 300),
  []
);
```

### Code Splitting
```typescript
// Lazy load heavy components
const SkillTreeVisualization = lazy(() => 
  import('@/components/progress/SkillTreeVisualization')
);
```

## Git Conventions

### Commit Messages
```
feat: add variable rewards system
fix: resolve streak calculation bug
docs: update API documentation
refactor: simplify notification engine
test: add habit service tests
chore: update dependencies
```

### Branch Naming
```
feature/variable-rewards
fix/streak-calculation
docs/api-updates
refactor/notification-system
```