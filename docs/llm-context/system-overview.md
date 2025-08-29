# HabitStory System Overview

## Purpose
HabitStory is a wellness habit tracking application that uses personality-based archetypes to create personalized practice journeys. It gamifies habit formation through RPG mechanics.

## Core Value Proposition
Transform daily wellness practices into an engaging RPG experience where users discover their archetype, join a house community, and progress through skill trees.

## Key Features

### 1. Archetype System
- Personality assessment determines House (6 types) and Class
- Each archetype has unique practices and progression paths
- Examples: MONK (meditation focus), WARRIOR_MONK (physical+mental)

### 2. Smart Task Scheduling
- AI generates daily tasks based on archetype and preferences
- Respects user's schedule and do-not-disturb windows
- Adapts difficulty based on progress

### 3. Engagement Mechanics
- Variable rewards (random XP multipliers, rare badges)
- Smart notifications (context-aware reminders)
- House cohorts (12-person support groups)
- Visual progress (skill trees, journey maps)

### 4. Graceful Streaks
- Freeze tokens prevent streak loss
- 24-hour grace period
- Comeback bonuses for returning users
- Partial credit for short sessions

## Technical Implementation

### Stack
- Frontend: Next.js 15, React 19, TailwindCSS
- Backend: Next.js API Routes, Prisma, PostgreSQL
- Auth: Clerk
- Caching: Upstash Redis
- Monitoring: Sentry, PostHog

### Architecture Pattern
- Monorepo structure with Turborepo
- Feature-based organization in `/lib`
- Component library in `/components`
- API routes in `/app/api`

### Key Integrations
- Clerk for authentication
- Neon for serverless PostgreSQL
- Upstash for Redis caching
- Vercel for hosting
- GitHub Actions for CI/CD

## Development Approach
AI-accelerated development with emphasis on rapid iteration and user engagement psychology.