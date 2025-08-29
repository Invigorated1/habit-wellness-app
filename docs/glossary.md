# HabitStory Glossary

## Core Concepts

### Archetype
A personality-based classification system that determines a user's wellness journey. Each user is assigned to a House and Class based on their assessment results.

### House
The primary archetype category (6 total):
- **MONK**: Focus on meditation and mindfulness
- **WARRIOR_MONK**: Balance of physical and mental training  
- **SAGE**: Knowledge and reflection-based practices
- **ARTISAN**: Creative and expressive practices
- **OPERATIVE**: Precision and efficiency focused
- **COUNCILOR**: Community and connection oriented

### Class
A specialization within a House that further refines the user's path. Examples: "Silent Sage" or "Active Warrior-Monk".

### Cohort
A group of 12 users from the same House who support each other. Based on Dunbar's number for close relationships.

### Task Instance
A specific practice session assigned to a user, generated from Task Templates based on their archetype.

### Streak
Consecutive days of completing at least one practice. Enhanced with freeze tokens and grace periods.

### XP (Experience Points)
Points earned through practice completion, used to unlock skills and track progress.

## Technical Terms

### API Route
Next.js server-side endpoints that handle HTTP requests (located in `/app/api/`).

### App Router
Next.js 15's routing system using the `/app` directory structure.

### Middleware
Code that runs before requests reach API routes, used for authentication and rate limiting.

### ORM (Object-Relational Mapping)
Prisma's way of interacting with the database using TypeScript objects instead of SQL.

### SSR (Server-Side Rendering)
Pages rendered on the server before sending to client, improving SEO and initial load.

### Zustand
Lightweight state management library used for client-side state (e.g., onboarding flow).

## Business Logic Terms

### Quick Win
A 2-minute introductory practice immediately after onboarding to demonstrate value.

### Variable Reward
Randomized rewards (XP multipliers, badges, etc.) using intermittent reinforcement psychology.

### Smart Notification
Context-aware notifications that consider user's schedule, streak status, and preferences.

### Skill Tree
Visual representation of unlockable abilities and practices, organized by progression tiers.

### Journey Map
Timeline visualization of a user's progress, milestones, and achievements.

### Freeze Token
Allows users to maintain their streak even if they miss a day, reducing anxiety.

### Grace Period
24-hour window after midnight where users can still complete yesterday's practice.

## Data Models

### User
Core user account linked to Clerk authentication.

### Profile
Extended user data including timezone, preferences, and archetype assignment.

### Assignment
Links a user to their House and Class with confidence scores.

### TaskTemplate
Blueprint for creating task instances, defined per archetype.

### VerificationSubmission
Record of a user completing a task with optional media proof.

### TraitScore
Personality assessment results across Big Five dimensions.

## UI/UX Terms

### Theme
Visual style options: Terminal (Green/White) or Notebook, using CSS variables.

### ASCII Art
Text-based visual elements used throughout the app for unique aesthetic.

### Onboarding Flow
Multi-step process: personality assessment → goals → schedule → archetype reveal.

### Notification Center
In-app notification display with filtering and management options.

### Reward Reveal
Animated modal showing earned variable rewards with confetti effects.

## Engagement Mechanics

### SDT (Self-Determination Theory)
Psychological framework focusing on Autonomy, Competence, and Relatedness.

### Intermittent Reinforcement
Variable reward scheduling that maintains engagement through unpredictability.

### Nudge
Gentle reminder or prompt to encourage desired behavior.

### Milestone
Significant achievement points (7-day streak, level ups, etc.).

### House Event
Community-wide activities like synchronized practice sessions.

## Development Terms

### Monorepo
Single repository containing multiple projects (apps/packages) managed by Turborepo.

### Feature Branch
Git branch for developing new features before merging to main.

### Sprint-0
Initial setup phase establishing basic infrastructure.

### ADR (Architecture Decision Record)
Document explaining significant technical decisions.

### CI/CD
Continuous Integration/Continuous Deployment automated pipeline.

### SLI/SLO
Service Level Indicators/Objectives for monitoring system health.

## External Services

### Clerk
Authentication service providing user management and sign-in.

### Neon
Serverless PostgreSQL database service.

### Upstash
Serverless Redis for caching and rate limiting.

### Vercel
Hosting platform optimized for Next.js applications.

### Sentry
Error tracking and performance monitoring service.

### PostHog
Product analytics for understanding user behavior.