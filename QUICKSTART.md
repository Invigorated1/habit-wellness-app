# Quick Start Guide - Try the App Now! 🚀

This guide will help you get the Habit Tracker running locally in under 10 minutes.

## Option 1: Minimal Setup (Fastest)

This gets the core app running with minimal external dependencies.

### 1. Prerequisites
- Node.js 20+ installed
- Git installed

### 2. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd habit-tracker

# Install dependencies
npm install -g pnpm
pnpm install
```

### 3. Quick Database Setup

**Option A: Use SQLite (Easiest for testing)**

```bash
# Update the schema for SQLite
cd apps/web

# Create a minimal .env.local
cat > .env.local << EOF
# Use SQLite for quick testing
DATABASE_URL="file:./dev.db"

# Minimal Clerk setup (test mode)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Y2xlYW4tbGVtdXItNTEuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_Ayc3JJq3zl9FCRkpQ3Eno93RNLyWM3NZMQg5IquqJD

# Development URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/dashboard
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Disable optional features for now
CRON_SECRET=development-secret
EOF
```

**Option B: Use Free PostgreSQL (Neon)**

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new database
3. Copy the connection string and add to `.env.local`:

```bash
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
```

### 4. Setup Database

```bash
# Generate Prisma client
pnpm prisma generate

# Push schema to database
pnpm prisma db push

# (Optional) Seed with sample data
pnpm db:seed
```

### 5. Start the App

```bash
# From the apps/web directory
pnpm dev
```

### 6. Access the App

Open your browser and go to:
- **Home**: http://localhost:3000
- **Sign Up**: http://localhost:3000/sign-up
- **Dashboard**: http://localhost:3000/dashboard (after signing in)

## Option 2: Full Setup (All Features)

To enable all features (analytics, error tracking, notifications), you'll need:

### Required Services (Free Tiers Available)

1. **Clerk** (Authentication)
   - Go to [clerk.com](https://clerk.com)
   - Create a new application
   - Copy your keys to `.env.local`

2. **Neon/Supabase** (Database)
   - [neon.tech](https://neon.tech) - Recommended
   - [supabase.com](https://supabase.com) - Alternative
   - Create database and copy connection string

3. **Upstash** (Redis + QStash) - Optional but recommended
   - Go to [upstash.com](https://upstash.com)
   - Create Redis database (for rate limiting)
   - Create QStash queue (for background jobs)

4. **Sentry** (Error Tracking) - Optional
   - Go to [sentry.io](https://sentry.io)
   - Create a new project
   - Copy DSN

5. **PostHog** (Analytics) - Optional
   - Go to [posthog.com](https://posthog.com)
   - Create project
   - Copy API key

### Full .env.local Example

```bash
# Database (Required)
DATABASE_URL="postgresql://..."

# Clerk (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/dashboard

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Upstash (Optional - for rate limiting)
UPSTASH_REDIS_URL=...
UPSTASH_REDIS_TOKEN=...

# QStash (Optional - for background jobs)
QSTASH_TOKEN=...

# Sentry (Optional - for error tracking)
NEXT_PUBLIC_SENTRY_DSN=...
SENTRY_ORG=...
SENTRY_PROJECT=...

# PostHog (Optional - for analytics)
NEXT_PUBLIC_POSTHOG_KEY=...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Security
CRON_SECRET=your-secret-here
```

## Try the Demo Features

Once the app is running, you can test these features:

### 1. Create Your First Habit
- Sign up for an account
- Click "Create Habit"
- Add a habit like "Daily Exercise" or "Read Books"

### 2. Track Progress
- Click the checkbox to mark habits as complete
- Watch your streak increase
- View the progress chart

### 3. Explore Features
- **Filtering**: Search and filter your habits
- **Charts**: Click on a habit to see detailed progress
- **Sharing**: Create a shareable link for your progress

### 4. Test Error Handling
- Try creating a habit with a very long name (>100 chars)
- Disconnect internet and see offline handling
- Check error boundaries work correctly

## Troubleshooting

### Common Issues

1. **"Cannot find module '@habit-app/shared'"**
   ```bash
   cd packages/shared
   pnpm build
   cd ../../apps/web
   ```

2. **"Prisma Client not generated"**
   ```bash
   pnpm prisma generate
   ```

3. **"Database connection failed"**
   - Check DATABASE_URL is correct
   - For SQLite, make sure the file path is valid
   - For PostgreSQL, ensure the database exists

4. **"Clerk keys invalid"**
   - Make sure you're using the correct environment keys
   - Test keys work for localhost only
   - Production keys need proper domain configuration

### Quick Reset

If something goes wrong:

```bash
# Clean everything
rm -rf node_modules
rm -rf apps/web/.next
rm -rf apps/web/prisma/dev.db

# Reinstall
pnpm install
cd apps/web
pnpm prisma generate
pnpm prisma db push
pnpm dev
```

## Next Steps

Once you have the app running:

1. **Explore the codebase**
   - Check out `/apps/web/src/app` for pages
   - Look at `/apps/web/src/components` for UI components
   - Review `/apps/web/src/app/api` for API endpoints

2. **Make changes**
   - Try modifying a component
   - Add a new API endpoint
   - Create a new page

3. **Run tests**
   ```bash
   pnpm test        # Unit tests
   pnpm test:e2e    # E2E tests (requires app running)
   ```

4. **Check out mobile** (requires Expo)
   ```bash
   cd apps/mobile
   pnpm start
   ```

## Need Help?

- Check the [Development Guide](./docs/DEVELOPMENT.md)
- Review the [API Documentation](./docs/API.md)
- Look at existing code examples
- Open an issue on GitHub

---

**Tip**: Start with Option 1 to quickly see the app in action, then gradually add services as needed!