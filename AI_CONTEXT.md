# HabitStory AI Development Context

## Project Overview

HabitStory is a personalized wellness platform that classifies users into RPG-style archetypes (Monk, Warrior-Monk, Sage, etc.) and delivers customized meditation, movement, and mindfulness practices. The platform features privacy-first verification through client-side anonymization.

## Current State

- **Phase**: Post-MVP, scaling features
- **Stack**: Next.js 15, TypeScript, Prisma, PostgreSQL, Clerk Auth, Redis
- **Key Features**: Archetype system, scheduled prompts, verification, analytics

## Core Concepts

### Archetypes (Houses)
- MONK: Meditation and inner calm focus
- WARRIOR_MONK: Physical and mental discipline
- SAGE: Wisdom through reflection
- ARTISAN: Creative practices
- OPERATIVE: Systematic approaches
- COUNCILOR: Strategic thinking

### Verification System
- Client-side face blurring and voice anonymization
- Optional pose-only capture
- Peer review for accountability
- Privacy-first design

## Code Patterns

### API Routes Pattern
```typescript
export const GET = withErrorHandler(async (request: Request) => {
  const user = await getOrCreateUser();
  const data = await fetchData(user.id);
  return successResponse(data);
});
```

### Archetype Assignment Pattern
```typescript
const traits = await calculateTraits(assessment);
const assignment = await assignArchetype(traits, goals);
await invalidateCache(`user:${userId}:archetype`);
```

### Verification Flow Pattern
```typescript
const anonymized = await clientAnonymizer.process(capture);
const hash = generateHash(anonymized);
const url = await getSignedUploadUrl();
await upload(url, anonymized, hash);
```

## Database Schema

Key models:
- User -> Profile -> TraitScores
- User -> Assignment (archetype)
- User -> TaskInstances -> VerificationSubmissions
- TaskTemplate -> TaskInstances

## Common Tasks

### Add New Archetype
1. Update House enum in `lib/archetype/types.ts`
2. Add rules to `config/archetypes.json`
3. Create UI components in `components/archetypes/`
4. Update classification engine

### Add Task Template
1. Create template in seed data
2. Add to scheduler rules
3. Create any custom UI needed
4. Test with target archetypes

### Implement New Feature
1. Start with the data model (Prisma)
2. Create API endpoint
3. Add business logic to lib/
4. Build UI components
5. Add tests
6. Update documentation

## Testing Approach

- Unit tests for business logic
- Integration tests for API routes
- E2E tests for critical user flows
- Accessibility tests for all new UI

## Performance Considerations

- Cache user profiles (5 min TTL)
- Cache archetype assignments (1 hour)
- Use database indexes for common queries
- Lazy load heavy components

## Security Requirements

- All endpoints require authentication
- Input validation with Zod schemas
- Rate limiting on all routes
- Audit logs for sensitive operations

## Current Priorities

1. Improve archetype classification accuracy
2. Enhance verification UX
3. Build community features
4. Optimize prompt delivery
5. Add more task templates

## AI Assistant Guidelines

When generating code:
1. Follow existing patterns
2. Include proper error handling
3. Add TypeScript types
4. Consider privacy implications
5. Write tests for new features
6. Update relevant documentation

## Quick Commands

```bash
# Development
pnpm dev                 # Start dev server
pnpm db:studio          # Explore database
pnpm test              # Run tests

# Database
pnpm db:push           # Update schema
pnpm db:generate       # Generate client
pnpm migrate:up        # Run migrations

# Analysis
pnpm typecheck         # Check types
pnpm lint             # Lint code
pnpm test:a11y        # Accessibility audit
```

## Architecture Decisions

1. **Monolithic by choice**: Faster iteration, shared code
2. **Privacy-first**: Process biometrics client-side only
3. **Config as data**: Archetypes rules in JSON for A/B testing
4. **Edge-first**: Leverage Vercel Edge for global performance
5. **Progressive enhancement**: Core features work without JS

## Integration Points

- Clerk: Authentication and user management
- Upstash: Redis caching and job queues
- PostHog: Product analytics
- Sentry: Error tracking
- Stripe: Subscription billing
- R2/S3: Anonymized media storage

## Known Issues

1. Verification upload can timeout on slow connections
2. Archetype reassignment needs UX improvement
3. Mobile PWA needs offline support
4. Some animations janky on low-end devices

## Future Roadmap

- [ ] AI-powered prompt generation
- [ ] Voice-guided meditation sessions
- [ ] Wearable device integration
- [ ] Multi-language support
- [ ] Corporate wellness features
- [ ] Archetype evolution system

---

Remember: We're building a wellness platform that respects user privacy while providing personalized, effective guidance. Every decision should balance personalization with privacy.