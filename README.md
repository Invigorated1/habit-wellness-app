# Habit Wellness App

A modern full-stack habit tracking application built with Next.js 15, featuring user authentication, database persistence, and a clean dashboard interface.

## 🎯 Current Status: Sprint-0 Complete

**Infrastructure Foundation:** ✅ Complete
- ✅ Next.js 15 with App Router & Turbopack
- ✅ Clerk Authentication (EU) with Google & Email
- ✅ Neon Postgres Database
- ✅ Prisma ORM with schema & migrations  
- ✅ TailwindCSS v4 styling
- ✅ SWR data fetching
- ✅ API routes (`/api/habits`)
- ✅ Auth pages (`/sign-in`, `/sign-up`)
- ✅ Dashboard with live data

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm
- Neon Postgres database
- Clerk account

### Environment Setup

1. **Clone and install:**
```bash
git clone <repository-url>
cd habit-wellness-app
pnpm install
```

2. **Configure environment variables:**
```bash
cp apps/web/.env.example apps/web/.env
```

Edit `apps/web/.env` with your values:

```env
# Database
DATABASE_URL="postgresql://username:password@ep-xyz.us-east-2.aws.neon.tech/habit_wellness_app?sslmode=require"

# Clerk Authentication  
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
```

3. **Generate Prisma client:**
```bash
cd apps/web
pnpm exec prisma generate
```

4. **Run migrations (when available):**
```bash
pnpm exec prisma db push
```

5. **Start development server:**
```bash
pnpm dev
```

Visit:
- **App**: http://localhost:3000
- **Sign In**: http://localhost:3000/sign-in  
- **Dashboard**: http://localhost:3000/dashboard
- **API**: http://localhost:3000/api/habits

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 19, TailwindCSS v4
- **Backend**: Next.js API Routes  
- **Database**: Neon Postgres + Prisma ORM
- **Auth**: Clerk (EU region)
- **Data Fetching**: SWR
- **Build**: Turbopack
- **Monorepo**: Turbo

### Database Schema
```prisma
model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  email     String   @unique
  name      String?
  habits    Habit[]
}

model Habit {
  id          String   @id @default(cuid())
  name        String
  description String?
  streak      Int      @default(0)
  isActive    Boolean  @default(true)
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  entries     HabitEntry[]
}

model HabitEntry {
  id          String   @id @default(cuid())
  date        DateTime @default(now())
  completed   Boolean  @default(false)
  notes       String?
  habitId     String
  habit       Habit    @relation(fields: [habitId], references: [id])
}
```

### Project Structure
```
habit-wellness-app/
├── apps/
│   └── web/                 # Next.js application
│       ├── app/
│       │   ├── api/habits/  # Habits API endpoint
│       │   ├── dashboard/   # Dashboard page  
│       │   ├── sign-in/     # Authentication pages
│       │   ├── sign-up/
│       │   └── providers/   # Clerk provider
│       └── prisma/          # Database schema
└── packages/                # Shared packages (future)
```

## 🔮 Roadmap

### Sprint-1 (Next)
- [ ] Upstash Redis integration
- [ ] Vercel Cron jobs for streak updates  
- [ ] PostHog analytics
- [ ] Sentry error monitoring
- [ ] GitHub Actions CI/CD

### Future Sprints
- [ ] Habit creation/editing UI
- [ ] Streak tracking & notifications
- [ ] Progress charts & analytics
- [ ] Social features & sharing
- [ ] Mobile app (React Native)

## 🧪 API Reference

### GET /api/habits
Returns array of habits for authenticated user.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Meditation", 
    "description": "Daily meditation practice",
    "streak": 5,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

### POST /api/habits  
Create a new habit.

**Body:**
```json
{
  "name": "Exercise",
  "description": "Daily workout routine"
}
```

## 🤝 Contributing

This project follows a "foundation-first" development approach:
1. Infrastructure before features
2. No broken code pushed to main
3. Comprehensive testing before feature releases

---

**Status**: Sprint-0 infrastructure complete, ready for feature development.