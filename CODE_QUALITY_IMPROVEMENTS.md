# 📊 Code Quality Improvement Plan

## Current State Assessment

While the codebase follows many good practices, there are several areas where we can improve to achieve "excellent" code quality.

## 🎯 Priority Improvements

### 1. Replace Console Logging with Proper Logger (High Priority)
**Current Issue**: Using `console.log` and `console.error` throughout the API routes.

**Solution**: Implement a structured logging system.

```typescript
// src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

// Usage in API routes
logger.error({ error, userId }, 'Failed to create habit');
```

**Benefits**:
- Structured logs for better debugging
- Log levels (debug, info, warn, error)
- Easier log aggregation in production
- Performance improvements

### 2. Remove TypeScript `any` Types (High Priority)
**Current Issue**: Using `any` type in updates object reduces type safety.

```typescript
// Current (bad)
const updates: any = {};

// Improved
interface HabitUpdateData {
  name?: string;
  description?: string | null;
  isActive?: boolean;
  streak?: number;
}
const updates: HabitUpdateData = {};
```

### 3. Add Input Validation Library (Medium Priority)
**Current Issue**: Manual validation is error-prone and verbose.

**Solution**: Use Zod for schema validation.

```typescript
// src/lib/validations/habit.ts
import { z } from 'zod';

export const createHabitSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).optional().nullable(),
});

export const updateHabitSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
  streak: z.number().int().min(0).optional(),
});

// Usage in API
const validatedData = createHabitSchema.parse(body);
```

### 4. Implement Error Handling Middleware (High Priority)
**Current Issue**: Repetitive error handling in every route.

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

// src/lib/errorHandler.ts
export function withErrorHandler(handler: Function) {
  return async (req: Request, ...args: any[]) => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode }
        );
      }
      logger.error({ error }, 'Unhandled error');
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
```

### 5. Add API Response Types (Medium Priority)
**Current Issue**: No consistent API response format.

```typescript
// src/types/api.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 6. Implement Rate Limiting (Medium Priority)
```typescript
// src/lib/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const rateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
});
```

### 7. Add Unit Tests (High Priority)
**Current Issue**: No tests exist.

```typescript
// src/lib/__tests__/auth.test.ts
import { describe, it, expect, vi } from 'vitest';
import { getOrCreateUser } from '../auth';

describe('getOrCreateUser', () => {
  it('should return existing user if found', async () => {
    // Mock implementation
  });
  
  it('should create new user if not found', async () => {
    // Mock implementation
  });
});
```

### 8. Add API Documentation (Medium Priority)
**Current Issue**: API docs are in markdown, not interactive.

**Solution**: Add Swagger/OpenAPI documentation.

```typescript
// src/lib/swagger.ts
import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = () => {
  const spec = createSwaggerSpec({
    apiFolder: 'src/app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Habit Wellness API',
        version: '1.0',
      },
    },
  });
  return spec;
};
```

### 9. Environment Variable Validation (High Priority)
```typescript
// src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const env = envSchema.parse(process.env);
```

### 10. Add Database Query Optimization (Low Priority)
```typescript
// Add indexes to frequently queried fields
model Habit {
  // ... existing fields
  
  @@index([userId, isActive])
  @@index([userId, createdAt])
}
```

## 📋 Implementation Checklist

### Immediate (Do Now)
- [ ] Replace all console.log with structured logger
- [ ] Fix TypeScript `any` types
- [ ] Add error handling wrapper
- [ ] Validate environment variables

### Short Term (This Week)
- [ ] Add Zod validation schemas
- [ ] Implement consistent API response format
- [ ] Set up basic unit tests
- [ ] Add rate limiting

### Medium Term (This Month)
- [ ] Add comprehensive test coverage
- [ ] Implement Swagger documentation
- [ ] Add monitoring and alerts
- [ ] Performance optimization

## 🎯 Code Quality Metrics Goals

- **Type Coverage**: 100% (no `any` types)
- **Test Coverage**: 80%+ 
- **ESLint Issues**: 0
- **Bundle Size**: < 500KB
- **API Response Time**: < 200ms (p95)

## 🛠️ Tooling Recommendations

1. **Logging**: Pino or Winston
2. **Validation**: Zod
3. **Testing**: Vitest + Testing Library
4. **Documentation**: Swagger/OpenAPI
5. **Monitoring**: Sentry
6. **Analytics**: PostHog
7. **Rate Limiting**: Upstash
8. **Code Quality**: ESLint + Prettier + Husky

## 📈 Expected Benefits

1. **Reliability**: Fewer runtime errors
2. **Maintainability**: Easier to understand and modify
3. **Performance**: Faster response times
4. **Developer Experience**: Better tooling and documentation
5. **Security**: Input validation and rate limiting
6. **Observability**: Better logging and monitoring