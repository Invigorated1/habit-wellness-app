# Database Setup Guide

## Prerequisites
- Neon PostgreSQL database account
- Database connection string

## Setup Steps

1. **Copy environment file**
```bash
cp .env.example .env
```

2. **Configure your .env file**
Add your actual database connection string:
```env
DATABASE_URL="postgresql://username:password@ep-xyz.us-east-2.aws.neon.tech/habit_wellness_app?sslmode=require"
```

3. **Generate Prisma Client**
```bash
pnpm db:generate
```

4. **Push schema to database**
```bash
pnpm db:push
```

## Available Database Commands

- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema changes to database (development)
- `pnpm db:migrate` - Create and apply migrations (production)
- `pnpm db:studio` - Open Prisma Studio GUI

## Testing Database Connection

After setup, test your connection:
```bash
curl http://localhost:3000/api/test-db
```

## Prisma Client Usage

The Prisma client is available as a singleton:

```typescript
import { prisma } from '@/lib/prisma';

// Example usage
const users = await prisma.user.findMany();
```

## Authentication Helper

Use the `getOrCreateUser()` helper in API routes:

```typescript
import { getOrCreateUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getOrCreateUser();
    // User is now available with their database ID
  } catch (error) {
    // Handle unauthorized access
  }
}
```