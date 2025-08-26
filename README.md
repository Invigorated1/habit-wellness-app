# 🎯 Habit Tracker

A production-ready habit tracking application built with Next.js 15, featuring real-time analytics, social sharing, mobile support, and enterprise-grade security.

## 🚀 Features

### Core Functionality
- ✅ **Habit Management**: Create, update, delete, and track daily habits
- ✅ **Streak Tracking**: Automatic streak calculation with milestone notifications
- ✅ **Progress Visualization**: Charts, heatmaps, and completion statistics
- ✅ **Social Sharing**: Share achievements and progress with friends
- ✅ **Mobile App**: React Native app with shared codebase

### Technical Features
- ✅ **Authentication**: Secure auth with Clerk (social + email)
- ✅ **Real-time Updates**: SWR for optimistic updates and caching
- ✅ **Background Jobs**: QStash for streak calculations and notifications
- ✅ **Analytics**: PostHog integration with comprehensive taxonomy
- ✅ **Error Tracking**: Sentry for client/server/edge monitoring
- ✅ **Performance**: Web Vitals monitoring and optimization
- ✅ **Security**: Rate limiting, input validation, CSP headers

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Security](#-security)
- [API Reference](#-api-reference)
- [Contributing](#-contributing)

## 🏃 Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+
- PostgreSQL database (or use Neon)
- Clerk account
- Optional: Redis (Upstash), Sentry, PostHog accounts

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd habit-tracker
pnpm install
```

2. **Set up environment variables**
```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env.local
```

3. **Configure your `.env.local`** with actual values:
```env
# Required
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Optional but recommended
UPSTASH_REDIS_URL=...
QSTASH_TOKEN=...
SENTRY_DSN=...
POSTHOG_KEY=...
```

4. **Set up the database**
```bash
cd apps/web
pnpm prisma generate
pnpm prisma db push
pnpm db:seed # Optional: Add sample data
```

5. **Start development**
```bash
pnpm dev
```

Visit:
- Web app: http://localhost:3000
- API health: http://localhost:3000/api/health

## 🏗️ Architecture

### Tech Stack

#### Frontend
- **Framework**: Next.js 15 with App Router
- **UI**: React 19, TailwindCSS v4
- **State**: SWR for server state, React Hook Form
- **Charts**: Recharts, custom heatmap component
- **Mobile**: React Native with Expo

#### Backend
- **API**: Next.js Route Handlers
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Clerk with middleware protection
- **Jobs**: QStash for background processing
- **Cache**: Upstash Redis for rate limiting

#### Infrastructure
- **Hosting**: Vercel (web), Expo (mobile)
- **Monitoring**: Sentry, PostHog, Web Vitals
- **CI/CD**: GitHub Actions with security scanning
- **Monorepo**: Turborepo with pnpm workspaces

### Project Structure

```
habit-tracker/
├── apps/
│   ├── web/                    # Next.js web application
│   │   ├── src/
│   │   │   ├── app/           # App router pages & API
│   │   │   ├── components/    # React components
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   └── lib/           # Utilities & services
│   │   └── prisma/            # Database schema & migrations
│   │
│   └── mobile/                # React Native app
│       ├── src/
│       │   ├── screens/       # App screens
│       │   ├── components/    # Native components
│       │   └── navigation/    # React Navigation setup
│       └── app.json          # Expo configuration
│
├── packages/
│   └── shared/               # Shared types & utilities
│       ├── src/
│       │   ├── schemas/      # Zod validation schemas
│       │   └── analytics/    # Analytics taxonomy
│       └── tsup.config.ts    # Build configuration
│
├── docs/                     # Documentation
│   ├── adr/                 # Architecture decisions
│   └── runbooks/            # Operational guides
│
└── .github/
    └── workflows/           # CI/CD pipelines
```

### Database Schema

```prisma
model User {
  id                     String    @id @default(cuid())
  clerkId                String    @unique
  email                  String    @unique
  name                   String?
  habits                 Habit[]
  sharedHabits          SharedHabit[]
  notifications         Notification[]
  notificationPreference NotificationPreference?
}

model Habit {
  id              String    @id @default(cuid())
  name            String
  description     String?
  streak          Int       @default(0)
  longestStreak   Int       @default(0)
  lastCompletedAt DateTime?
  isActive        Boolean   @default(true)
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  entries         HabitEntry[]
  sharedHabits    SharedHabit[]
  
  @@index([userId, isActive])
  @@index([streak])
}

model HabitEntry {
  id        String   @id @default(cuid())
  date      DateTime @db.Date
  completed Boolean  @default(false)
  notes     String?
  habitId   String
  habit     Habit    @relation(fields: [habitId], references: [id], onDelete: Cascade)
  
  @@unique([habitId, date])
  @@index([date])
}
```

## 🛠️ Development

### Available Scripts

```bash
# Development
pnpm dev              # Start all apps
pnpm dev:web          # Start web only
pnpm dev:mobile       # Start mobile only

# Testing
pnpm test             # Run unit tests
pnpm test:e2e         # Run E2E tests
pnpm test:watch       # Watch mode

# Building
pnpm build            # Build all apps
pnpm typecheck        # Type checking
pnpm lint             # Linting

# Database
pnpm db:push          # Push schema changes
pnpm db:seed          # Seed sample data
pnpm prisma:studio    # Open Prisma Studio
```

### Code Quality

- **Linting**: ESLint with Next.js config
- **Formatting**: Prettier (optional)
- **Type Safety**: TypeScript strict mode
- **Git Hooks**: Husky for pre-commit checks

## 🧪 Testing

### Test Stack
- **Unit**: Vitest + React Testing Library
- **E2E**: Playwright
- **API**: Vitest with MSW
- **Mobile**: Jest + React Native Testing Library

### Running Tests

```bash
# Unit tests
pnpm test

# E2E tests (requires app running)
pnpm test:e2e

# E2E with UI
pnpm test:e2e:ui

# Coverage
pnpm test:coverage
```

### Key Test Files
- `security.test.ts` - Security and auth tests
- `auth.spec.ts` - E2E authentication flows
- `habits.spec.ts` - E2E habit management
- `performance.spec.ts` - Performance and error scenarios

## 🚀 Deployment

### Prerequisites
1. Vercel account (for web hosting)
2. Production database (Neon, Supabase, or self-hosted)
3. Environment variables configured in Vercel

### Deploy Web App

```bash
# Using Vercel CLI
vercel

# Or connect GitHub repo for auto-deployment
```

### Deploy Mobile App

```bash
cd apps/mobile
eas build --platform all
eas submit
```

### Environment Variables

See `.env.example` for all required variables. Key production configs:
- Set `NODE_ENV=production`
- Use strong `CRON_SECRET`
- Configure `ALLOWED_ORIGINS`
- Enable `DATABASE_PROXY_URL` for connection pooling

## 🔐 Security

### Implemented Security Measures

1. **Authentication & Authorization**
   - Clerk middleware on all protected routes
   - User data isolation with row-level security
   - Session management with secure cookies

2. **Input Validation**
   - Zod schemas for all API inputs
   - Request size limits (10KB default)
   - HTML sanitization

3. **Rate Limiting**
   - IP-based: 60 req/min
   - User-based: 100 req/min
   - API key-based: 1000 req/hour

4. **Security Headers**
   - Content Security Policy
   - HSTS with preload
   - X-Frame-Options: DENY
   - And more...

5. **Monitoring**
   - Sentry for error tracking
   - Security scanning in CI
   - Dependency audits

See [SECURITY.md](./SECURITY.md) for vulnerability reporting.

## 📚 API Reference

### Authentication
All API routes require authentication via Clerk. Include session cookie or use API keys.

### Endpoints

#### `GET /api/habits`
Get all habits for authenticated user.

**Response:**
```json
[
  {
    "id": "clh123...",
    "name": "Morning Exercise",
    "description": "30 min workout",
    "streak": 7,
    "longestStreak": 15,
    "lastCompletedAt": "2024-01-15T08:00:00Z",
    "todayEntry": {
      "completed": true,
      "date": "2024-01-15"
    }
  }
]
```

#### `POST /api/habits`
Create a new habit.

**Request:**
```json
{
  "name": "Read Books",
  "description": "Read for 30 minutes"
}
```

#### `PUT /api/habits/[id]`
Update habit details.

#### `DELETE /api/habits/[id]`
Delete a habit (soft delete by default).

#### `POST /api/habits/[id]/complete`
Toggle habit completion for today.

#### `POST /api/habits/[id]/share`
Create a shareable link.

### Rate Limits
- Standard: 60 requests/minute per IP
- Authenticated: 100 requests/minute per user
- Webhooks: 1000 requests/hour with valid signature

## 🤝 Contributing

### Development Process
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards
- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Ensure all checks pass

### Commit Convention
We use conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation
- `chore:` Maintenance
- `test:` Tests
- `perf:` Performance

## 📄 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file.

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Clerk](https://clerk.dev/)
- [Prisma](https://prisma.io/)
- [Vercel](https://vercel.com/)
- [Upstash](https://upstash.com/)

---

**Questions?** Open an issue or reach out to the maintainers.