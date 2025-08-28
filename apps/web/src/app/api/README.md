# API Routes Documentation

## 🏗️ Architecture

All API routes follow a consistent pattern using our custom handlers:

```typescript
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { getOrCreateUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const GET = withErrorHandler(async (request: Request) => {
  // 1. Auth is automatic via getOrCreateUser
  const user = await getOrCreateUser();
  
  // 2. Log the action
  logger.info('Fetching data', { userId: user.id });
  
  // 3. Perform database operations
  const data = await prisma.model.findMany({
    where: { userId: user.id } // Always scope to user!
  });
  
  // 4. Return standardized response
  return successResponse(data);
});
```

## 📁 Current Endpoints

### `/api/habits`
- **GET**: List all habits for authenticated user
- **POST**: Create a new habit
  - Body: `{ name: string, description?: string }`

### `/api/habits/[id]`
- **GET**: Get single habit with entries
- **PATCH**: Update habit
  - Body: `{ name?: string, description?: string, isActive?: boolean, streak?: number }`
- **DELETE**: Delete habit (cascades to entries)

### `/api/webhooks/clerk`
- **POST**: Webhook for Clerk user events
- Handles: user.created, user.updated, user.deleted

### `/api/test-db` (Dev only)
- **GET**: Test database connection

### `/api/test-habits` (Dev only)  
- **GET**: Test all CRUD operations

## 🔐 Authentication

- Handled automatically by middleware
- Routes are protected by default
- Use `getOrCreateUser()` to get current user
- Throws `UnauthorizedError` if not authenticated

## 🛡️ Error Handling

Errors are automatically caught and logged:

```typescript
// These are caught and handled:
throw new ValidationError(['Name is required']);
throw new NotFoundError('Habit not found');
throw new UnauthorizedError();
```

Response format:
```json
{
  "error": "Error message",
  "statusCode": 400
}
```

## 📊 Rate Limiting

- Default: 100 requests/minute per user
- Headers included in response:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## 🧪 Testing APIs

```bash
# Test database connection
curl http://localhost:3000/api/test-db

# Test with httpie (better output)
http GET localhost:3000/api/habits \
  Cookie:"your-auth-cookie"

# Create a habit
http POST localhost:3000/api/habits \
  name="Exercise" \
  description="Daily workout"
```

## 📝 Adding New Endpoints

1. Create file: `/api/your-endpoint/route.ts`
2. Copy this template:

```typescript
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { getOrCreateUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { ValidationError } from '@/lib/errors';

export const GET = withErrorHandler(async (request: Request) => {
  const user = await getOrCreateUser();
  logger.info('Your action', { userId: user.id });
  
  // Your logic here
  
  return successResponse(data);
});

export const POST = withErrorHandler(async (request: Request) => {
  const user = await getOrCreateUser();
  const body = await request.json();
  
  // Validate input
  if (!body.field) {
    throw new ValidationError(['Field is required']);
  }
  
  // Your logic here
  
  return successResponse(data, 201);
});
```

## ⚡ Best Practices

1. **Always scope to user**: `where: { userId: user.id }`
2. **Log important actions**: Use logger with context
3. **Validate input**: Throw ValidationError with clear messages
4. **Use transactions**: For multiple related operations
5. **Return consistent format**: Use successResponse()

## 🚫 Common Mistakes

- ❌ Forgetting userId filter (security issue!)
- ❌ Using console.log instead of logger
- ❌ Returning custom error formats
- ❌ Not validating input
- ❌ Catching errors manually (wrapper handles it)