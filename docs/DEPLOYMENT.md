# Deployment Guide

This guide covers deploying the Habit Tracker application to production.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Web App Deployment (Vercel)](#web-app-deployment-vercel)
4. [Database Setup](#database-setup)
5. [Mobile App Deployment](#mobile-app-deployment)
6. [Environment Configuration](#environment-configuration)
7. [Post-Deployment](#post-deployment)
8. [Monitoring & Maintenance](#monitoring--maintenance)

## Overview

The Habit Tracker uses:
- **Vercel** for web hosting
- **Neon/Supabase** for PostgreSQL
- **Upstash** for Redis & QStash
- **Expo EAS** for mobile builds
- **Clerk** for authentication
- **Sentry** for error tracking
- **PostHog** for analytics

## Prerequisites

Before deploying, ensure you have:

1. Accounts created:
   - [ ] Vercel account
   - [ ] Database provider (Neon/Supabase)
   - [ ] Clerk application
   - [ ] Upstash account
   - [ ] Sentry project
   - [ ] PostHog project
   - [ ] Expo account

2. Tools installed:
   - [ ] Vercel CLI: `npm i -g vercel`
   - [ ] Expo CLI: `npm i -g expo-cli`
   - [ ] EAS CLI: `npm i -g eas-cli`

## Web App Deployment (Vercel)

### Option 1: GitHub Integration (Recommended)

1. **Connect Repository**
   ```bash
   # Push your code to GitHub
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Select `apps/web` as root directory
   - Framework preset: Next.js

3. **Configure Build Settings**
   ```
   Build Command: cd ../.. && pnpm build --filter=web
   Output Directory: apps/web/.next
   Install Command: pnpm install --frozen-lockfile
   ```

### Option 2: CLI Deployment

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Deploy**
   ```bash
   cd apps/web
   vercel --prod
   ```

3. **Follow Prompts**
   - Set up and deploy: Yes
   - Which scope: Your team/personal
   - Link to existing project: No (first time)
   - Project name: habit-tracker
   - Directory: ./

### Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```env
# Required
NODE_ENV=production
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...
CRON_SECRET=<generate-strong-secret>

# Recommended
UPSTASH_REDIS_URL=...
UPSTASH_REDIS_TOKEN=...
QSTASH_TOKEN=...
DATABASE_PROXY_URL=... # Prisma Accelerate

# Optional
SENTRY_DSN=...
SENTRY_AUTH_TOKEN=...
NEXT_PUBLIC_POSTHOG_KEY=...
NEXT_PUBLIC_POSTHOG_HOST=...
```

## Database Setup

### Option 1: Neon (Recommended)

1. **Create Database**
   - Go to [neon.tech](https://neon.tech)
   - Create new project
   - Copy connection string

2. **Configure Pooling**
   - Enable connection pooling
   - Set pool size: 25
   - Use pooled connection string

3. **Run Migrations**
   ```bash
   # Set DATABASE_URL locally
   export DATABASE_URL="postgresql://..."
   
   # Run migrations
   cd apps/web
   pnpm prisma migrate deploy
   ```

### Option 2: Supabase

1. **Create Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Go to Settings → Database

2. **Connection String**
   - Use "Connection Pooling" tab
   - Mode: Transaction
   - Copy connection string

3. **Apply Schema**
   ```bash
   pnpm prisma db push
   ```

### Database Indexes

Ensure these indexes exist for performance:

```sql
-- Already in schema
CREATE INDEX habits_userId_isActive_idx ON habits(userId, isActive);
CREATE INDEX habits_createdAt_idx ON habits(createdAt DESC);
CREATE INDEX habits_streak_idx ON habits(streak DESC);
CREATE INDEX habit_entries_date_idx ON habit_entries(date DESC);
CREATE INDEX habit_entries_habitId_date_idx ON habit_entries(habitId, date DESC);
```

## Mobile App Deployment

### Configure EAS

1. **Login to Expo**
   ```bash
   eas login
   ```

2. **Configure Project**
   ```bash
   cd apps/mobile
   eas build:configure
   ```

3. **Update app.json**
   ```json
   {
     "expo": {
       "owner": "your-expo-username",
       "slug": "habit-tracker",
       "version": "1.0.0",
       "ios": {
         "bundleIdentifier": "com.yourcompany.habittracker"
       },
       "android": {
         "package": "com.yourcompany.habittracker"
       }
     }
   }
   ```

### Build for Stores

1. **iOS Build**
   ```bash
   eas build --platform ios --profile production
   ```

2. **Android Build**
   ```bash
   eas build --platform android --profile production
   ```

3. **Submit to Stores**
   ```bash
   # iOS App Store
   eas submit --platform ios
   
   # Google Play Store
   eas submit --platform android
   ```

### Over-the-Air Updates

```bash
# Publish update
eas update --branch production --message "Bug fixes"
```

## Environment Configuration

### Production Checklist

1. **Security**
   - [ ] Strong `CRON_SECRET` (min 32 chars)
   - [ ] `ALLOWED_ORIGINS` configured
   - [ ] HTTPS enforced
   - [ ] Security headers active

2. **Performance**
   - [ ] Database connection pooling
   - [ ] Redis configured
   - [ ] CDN enabled
   - [ ] Image optimization

3. **Monitoring**
   - [ ] Sentry DSN configured
   - [ ] Error alerting enabled
   - [ ] Uptime monitoring
   - [ ] Performance budgets

### Environment-Specific Settings

```typescript
// apps/web/src/config/env.ts
export const config = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Feature flags
  features: {
    analytics: process.env.NEXT_PUBLIC_POSTHOG_KEY ? true : false,
    sentry: process.env.SENTRY_DSN ? true : false,
    rateLimit: process.env.UPSTASH_REDIS_URL ? true : false,
  },
  
  // API configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://habit-tracker.com',
    timeout: 30000,
  },
};
```

## Post-Deployment

### 1. Verify Deployment

```bash
# Check health endpoint
curl https://your-domain.com/api/health

# Expected response
{
  "status": "healthy",
  "version": "1.0.0"
}
```

### 2. Set Up Cron Jobs

Vercel automatically detects `vercel.json` cron configuration:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-streaks",
      "schedule": "30 0 * * *"
    }
  ]
}
```

### 3. Configure Webhooks

1. **Clerk Webhooks**
   - Go to Clerk Dashboard → Webhooks
   - Add endpoint: `https://your-domain.com/api/webhooks/clerk`
   - Select events: user.created, user.updated

2. **Verify Webhook**
   ```bash
   # Clerk will send a test webhook
   # Check logs in Vercel dashboard
   ```

### 4. DNS Configuration

If using custom domain:

1. **Add Domain in Vercel**
   - Go to Settings → Domains
   - Add your domain
   - Follow DNS instructions

2. **SSL Certificate**
   - Automatic via Let's Encrypt
   - Force HTTPS in settings

### 5. Set Up Monitoring

1. **Sentry Alerts**
   ```
   - Error rate > 1%
   - New error types
   - Performance degradation
   ```

2. **Uptime Monitoring**
   - Use Vercel Analytics
   - Or external service (UptimeRobot, Pingdom)

3. **Custom Alerts**
   ```typescript
   // In your code
   if (errorRate > threshold) {
     await notificationService.alertOps({
       severity: 'high',
       message: 'Error rate spike detected'
     });
   }
   ```

## Monitoring & Maintenance

### Daily Checks

1. **Error Rates**
   - Check Sentry dashboard
   - Review error trends

2. **Performance**
   - Vercel Analytics
   - Core Web Vitals

3. **Database**
   - Connection pool usage
   - Query performance

### Weekly Tasks

1. **Dependency Updates**
   ```bash
   # Check for updates
   pnpm outdated
   
   # Update safely
   pnpm update --interactive
   ```

2. **Security Scan**
   ```bash
   pnpm audit
   ```

3. **Backup Verification**
   - Test database restore
   - Verify backup integrity

### Monthly Tasks

1. **Performance Audit**
   - Run Lighthouse
   - Check bundle size
   - Review slow queries

2. **Cost Review**
   - Vercel usage
   - Database costs
   - Third-party services

3. **Security Review**
   - Rotate secrets
   - Review access logs
   - Update dependencies

### Rollback Procedure

If issues arise:

1. **Instant Rollback (Vercel)**
   ```bash
   # List deployments
   vercel ls
   
   # Rollback to previous
   vercel rollback [deployment-url]
   ```

2. **Database Rollback**
   ```bash
   # If migrations fail
   pnpm prisma migrate resolve --rolled-back
   ```

3. **Feature Flags**
   ```typescript
   // Disable problematic features
   if (config.features.newFeature && !incident) {
     // Feature code
   }
   ```

### Scaling Considerations

When traffic grows:

1. **Database**
   - Enable read replicas
   - Implement caching layer
   - Optimize queries

2. **API**
   - Increase rate limits
   - Add API caching
   - Consider GraphQL

3. **Frontend**
   - Enable ISR
   - Optimize images
   - Code splitting

### Disaster Recovery

1. **Backup Strategy**
   - Daily automated backups
   - Geographic redundancy
   - Test restore process

2. **Incident Response**
   - Follow [incident runbook](./runbooks/incident-response.md)
   - Notify stakeholders
   - Post-mortem process

---

For emergency support, contact the on-call engineer via PagerDuty or check the [incident response guide](./runbooks/incident-response.md).