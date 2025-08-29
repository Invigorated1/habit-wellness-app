# HabitStory - Technical Project Overview

## Executive Summary

HabitStory is a personalized wellness platform that uses personality-based archetypes to deliver customized meditation, movement, and mindfulness practices. The platform combines RPG-style user classification with privacy-first accountability mechanisms.

## Core Innovation

### The Archetype System

Instead of generic habit tracking, HabitStory classifies users into wellness archetypes based on:
- Personality traits (Big Five/HEXACO assessments)
- Personal goals and interests
- Behavioral preferences

This creates six primary "Houses":
1. **Monk** - Focus on meditation and inner calm
2. **Warrior-Monk** - Balance of physical and mental discipline
3. **Sage** - Wisdom through reflection and study
4. **Artisan** - Creative and expressive practices
5. **Operative** - Precision and systematic approaches
6. **Councilor** - Leadership and strategic thinking

Each house has subclasses that further personalize the experience.

## Technical Architecture

### Stack Overview

```
Frontend:      Next.js 15 (App Router) + React 19 + TailwindCSS v4
Backend:       Next.js API Routes + Prisma + PostgreSQL
Auth:          Clerk (OAuth + Email)
Caching:       Upstash Redis
Queues:        Upstash Queue + Vercel Cron
Analytics:     PostHog
Monitoring:    Sentry + Custom SLIs
UI Library:    shadcn/ui
```

### Key Technical Features

#### 1. Privacy-First Verification System
- **Client-side anonymization** before any upload
- Face detection and blurring using WebGL
- Voice pitch shifting and anonymization
- Optional pose-only capture (keypoints extraction)
- Hash-chain verification for integrity

#### 2. Intelligent Scheduling Engine
- Cron-based task generation 24h in advance
- User timezone and preference aware
- Smart notification retry with backoff
- Snooze and reschedule within guardrails

#### 3. Archetype Classification Engine
- Rule-based system with weighted scoring
- JSON-configurable for A/B testing
- Weekly micro-reassessments
- Confidence scoring and rationale tracking

#### 4. Real-time Prompt Personalization
- Template-based content system
- Archetype-specific variations
- Progressive difficulty scaling
- Context-aware timing adjustments

## Data Model Highlights

### Core Entities

```prisma
User -> Profile -> TraitScores
     -> Assignment (House/Class/Subclass)
     -> TaskInstances -> VerificationSubmissions
     -> Goals
     -> BillingPlan
```

### Key Design Decisions

1. **Separation of Templates vs Instances**
   - Templates are reusable blueprints
   - Instances are user-specific occurrences
   - Enables easy content updates without migration

2. **Config as Data**
   - Archetype rules in JSON
   - Feature flags for progressive rollout
   - A/B testing without deployments

3. **Privacy by Design**
   - Verification modes enum in schema
   - Separate media storage with TTL
   - Audit trails for all access

## Security & Privacy

### Data Protection
- End-to-end encryption for sensitive data
- Client-side processing for biometrics
- Ephemeral storage for verification media
- GDPR-compliant data export/deletion

### Access Control
- Role-based permissions (User/Admin/Reviewer)
- Resource-level authorization
- Rate limiting on all endpoints
- Audit logging for compliance

## Performance Optimizations

### Caching Strategy
- Redis for hot data (user profiles, active tasks)
- 5-minute TTL for prompt lists
- Cache invalidation on updates
- Fallback to database on cache miss

### Database Optimizations
- Connection pooling with PgBouncer
- Indexed queries for common access patterns
- Soft deletes for data recovery
- Read replicas for analytics

### Frontend Performance
- Static generation for marketing pages
- Dynamic imports for heavy components
- Image optimization with Next.js
- Progressive enhancement for capture features

## Monetization Architecture

### Subscription Tiers

```typescript
enum BillingTier {
  FREE = "FREE",           // Core features
  PRO = "PRO",            // Verification + Analytics
  PRO_PLUS = "PRO_PLUS"   // All features + Stakes
}
```

### Payment Integration
- Stripe for subscription management
- Webhook handling for plan changes
- Grace periods for failed payments
- Usage-based limits enforcement

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- Redis for shared state
- Queue-based job processing
- CDN for static assets

### Data Partitioning
- User data sharded by ID
- Time-series data partitioned by month
- Separate analytics database
- Archived data in cold storage

## Development Workflow

### AI-Accelerated Development
- Cursor AI for rapid prototyping
- Component generation from specs
- Test generation for coverage
- Documentation from code

### Quality Assurance
- Automated testing (Unit/Integration/E2E)
- Accessibility compliance (WCAG 2.1 AA)
- Performance budgets enforced
- Security scanning in CI/CD

## Deployment Strategy

### Progressive Rollout
1. **Phase 0**: Core archetypes + prompting
2. **Phase 1**: Anonymized verification
3. **Phase 2**: Community features
4. **Phase 3**: Advanced analytics

### Infrastructure
- Vercel for hosting (Edge Functions)
- Neon for PostgreSQL (Serverless)
- Upstash for Redis (Edge-compatible)
- Cloudflare R2 for media storage

## Success Metrics

### Technical KPIs
- API latency P95 < 200ms
- Uptime > 99.9%
- Error rate < 0.1%
- Cache hit ratio > 80%

### Business KPIs
- D1 activation ≥ 60%
- W1 retention ≥ 35%
- Verification adoption ≥ 25% (Pro)
- 7-day streak ≥ 20% of actives

## Risk Mitigation

### Technical Risks
- **Anonymization failure**: Fallback to server-side
- **Classification accuracy**: Manual override option
- **Scale bottlenecks**: Queue-based architecture

### Business Risks
- **Low archetype resonance**: A/B test variations
- **Verification friction**: Progressive disclosure
- **Retention drops**: Engagement campaigns

## Future Roadmap

### Near Term (3 months)
- Wearable device integration
- AI-powered prompt generation
- Voice-guided sessions
- Multi-language support

### Medium Term (6 months)
- Archetype evolution system
- Corporate wellness programs
- Therapist collaboration tools
- Advanced biometric analysis

### Long Term (12 months)
- Global challenge system
- Wellness marketplace
- API for third-party apps
- White-label solution

---

This platform represents a paradigm shift from generic habit tracking to personalized wellness journeys, leveraging modern web technologies and AI to create scalable, engaging experiences.