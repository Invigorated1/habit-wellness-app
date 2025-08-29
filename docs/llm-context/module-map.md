# HabitStory Module Map

## Core Modules

### `/lib/archetype/`
**Purpose**: Personality-based user classification system
- `classifier.ts` - Classification algorithm
- `config.json` - House and Class definitions
- `types.ts` - TypeScript interfaces

### `/lib/auth/`
**Purpose**: Authentication and authorization
- `permissions.ts` - Role-based access control

### `/lib/scheduler/`
**Purpose**: Task generation and scheduling
- `task-scheduler.ts` - Creates daily TaskInstances

### `/lib/notifications/`
**Purpose**: Smart notification system
- `smart-engine.ts` - Orchestrates notifications
- `templates.ts` - Message templates
- `types.ts` - Notification types

### `/lib/rewards/`
**Purpose**: Variable reward system
- `variable-rewards.ts` - Intermittent reinforcement engine

### `/lib/communities/`
**Purpose**: House cohort management
- `house-cohorts.ts` - 12-person group logic

### `/lib/progress/`
**Purpose**: Progress tracking and visualization
- `skill-tree.ts` - Skill progression system

### `/lib/streaks/`
**Purpose**: Streak management
- `graceful-streaks.ts` - Forgiving streak system

### `/lib/monitoring/`
**Purpose**: System monitoring
- `sli.ts` - Service level indicators
- `cost-tracker.ts` - Cost monitoring

## Component Structure

### `/components/ui/`
Reusable UI primitives (buttons, cards, forms)

### `/components/onboarding/`
Multi-step onboarding flow components

### `/components/notifications/`
Notification center and preferences

### `/components/rewards/`
Reward reveal animations

### `/components/progress/`
Skill tree and journey visualizations

### `/components/community/`
House cohort interface

### `/components/theme/`
Theme provider and switcher

## API Routes

### `/app/api/habits/`
CRUD operations for habits

### `/app/api/users/`
User profile management

### `/app/api/webhooks/`
Clerk user sync

### `/app/api/onboarding/`
Onboarding submission and archetype assignment

### `/app/api/monitoring/`
SLI metrics and cost tracking

### `/app/api/cron/`
Scheduled tasks (daily task generation)

## Page Routes

### `/app/page.tsx`
Landing page

### `/app/dashboard/`
Main user dashboard

### `/app/onboarding/`
Onboarding flow pages

### `/app/house/`
House community hub

### `/app/progress/`
Progress visualization

### `/app/theme-demo/`
Theme showcase

## State Management

### `/stores/onboarding.ts`
Zustand store for onboarding flow state

## Database Models (Prisma)

### Core Models
- User
- Profile
- Assignment (House/Class)
- TaskTemplate
- TaskInstance
- VerificationSubmission

### Supporting Models
- TraitScore
- Goal
- BillingPlan

## External Dependencies

### Authentication
- `@clerk/nextjs`

### Database
- `@prisma/client`
- `@neon/serverless`

### Caching
- `@upstash/redis`
- `@upstash/ratelimit`

### Analytics
- `posthog-js`
- `@sentry/nextjs`

### UI Components
- `@radix-ui/*`
- `framer-motion`
- `lucide-react`