# Habit Wellness App - Web

This is the main web application for the Habit Wellness platform, built with Next.js 15, TypeScript, Prisma, and Clerk authentication.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **State Management**: React hooks + SWR for data fetching
- **Testing**: Vitest

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Clerk account for authentication

### Environment Setup

1. Copy the environment variables template:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your values:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: From your Clerk dashboard
   - `CLERK_SECRET_KEY`: From your Clerk dashboard
   - `CLERK_WEBHOOK_SECRET`: For syncing users (optional, but recommended)

### Database Setup

1. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

2. Push the database schema:
   ```bash
   npm run db:push
   ```

3. (Optional) Seed the database with sample data:
   ```bash
   npm run db:seed
   ```

### Clerk Webhook Setup (Recommended)

To automatically sync Clerk users with your database:

1. Go to your Clerk dashboard
2. Navigate to Webhooks
3. Add a new endpoint: `https://your-domain.com/api/webhooks/clerk`
4. Select the following events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Copy the signing secret and add it to your `.env` as `CLERK_WEBHOOK_SECRET`

### Development

First, install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Testing

Run the test suite:

```bash
npm run test
# or watch mode
npm run test:watch
```

## Project Structure

```
src/
├── app/                    # Next.js app router pages and API routes
│   ├── api/               # API endpoints
│   │   ├── habits/        # Habits CRUD operations
│   │   └── webhooks/      # Webhook handlers (Clerk)
│   ├── dashboard/         # Protected dashboard pages
│   ├── sign-in/          # Clerk sign-in page
│   ├── sign-up/          # Clerk sign-up page
│   └── providers/        # React context providers
├── lib/                   # Shared libraries and utilities
│   └── prisma.ts         # Prisma client singleton
└── generated/            # Generated Prisma client
```

## API Endpoints

All API endpoints require authentication via Clerk.

### Habits

- `GET /api/habits` - Get all habits for the authenticated user
- `POST /api/habits` - Create a new habit
  - Body: `{ name: string, description?: string }`

## Database Schema

The application uses the following main models:

- **User**: Synced from Clerk, stores user profile
- **Habit**: User's habits with name, description, and tracking info
- **HabitEntry**: Daily completion records for habits

See `prisma/schema.prisma` for the complete schema.

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Environment Variables for Production

Make sure to set all the environment variables from `.env.example` in your production environment.

### Database Migrations

For production, consider using Prisma migrations instead of `db push`:

```bash
npx prisma migrate deploy
```
