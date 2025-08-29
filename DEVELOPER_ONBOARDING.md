# HabitStory Developer Onboarding Guide 🚀

Welcome to HabitStory! This guide will get you up and running with our personalized wellness platform.

## 🎯 What You're Building

HabitStory is not another generic habit tracker. We're building a personalized wellness journey that:
- **Classifies users** into RPG-style archetypes (Monk, Warrior-Monk, etc.)
- **Delivers customized prompts** based on personality and goals
- **Provides privacy-first verification** through anonymized recordings
- **Builds communities** around shared wellness identities

## 🏃 Quick Start (15 minutes)

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/habitstory/habitstory.git
cd habitstory

# Install dependencies (we use pnpm)
pnpm install
```

### 2. Environment Setup

```bash
# Copy example environment file
cd apps/web
cp .env.example .env.local

# You'll need to add:
# - DATABASE_URL (from Neon)
# - CLERK_* keys (from Clerk Dashboard)
# - UPSTASH_* keys (from Upstash)
```

### 3. Database Setup

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# (Optional) Open Prisma Studio to explore
pnpm db:studio
```

### 4. Run Development Server

```bash
# Start the dev server
pnpm dev

# Visit http://localhost:3000
```

## 🗺️ Codebase Tour

### Key Directories

```
apps/web/src/
├── app/                      # Next.js App Router pages
│   ├── api/                 # API endpoints
│   │   ├── archetype/      # Archetype assignment
│   │   ├── prompts/        # Task scheduling
│   │   └── verify/         # Verification system
│   ├── (auth)/             # Auth pages (sign-in/up)
│   ├── dashboard/          # Main user dashboard
│   └── onboarding/         # User onboarding flow
├── components/              # React components
│   ├── ui/                 # Base UI (shadcn/ui)
│   ├── archetypes/         # Archetype-specific
│   └── verification/       # Capture widgets
├── lib/                    # Core utilities
│   ├── archetype/         # Classification engine
│   ├── scheduler/         # Prompt scheduling
│   ├── verification/      # Anonymization logic
│   └── auth/              # Auth helpers
└── hooks/                  # Custom React hooks
```

### Core Technologies

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type safety throughout
- **Prisma**: Type-safe database ORM
- **TailwindCSS v4**: Utility-first styling
- **Clerk**: Authentication and user management
- **Upstash**: Redis for caching and queues
- **PostHog**: Product analytics
- **Sentry**: Error tracking

## 🏛️ Understanding Archetypes

### The System

Users are classified into "Houses" based on:
1. **Personality assessment** (Big Five traits)
2. **Goals and interests** (wellness objectives)
3. **Behavioral preferences** (schedule, intensity)

### Current Houses

```typescript
enum House {
  MONK = "MONK",                   // Meditation focus
  WARRIOR_MONK = "WARRIOR_MONK",   // Movement + meditation
  SAGE = "SAGE",                   // Wisdom & reflection
  ARTISAN = "ARTISAN",            // Creative practices
  OPERATIVE = "OPERATIVE",         // Precision & routine
  COUNCILOR = "COUNCILOR"         // Leadership & strategy
}
```

### Classification Flow

```typescript
// Simplified archetype assignment
function assignArchetype(user: User): Assignment {
  const traits = calculateTraits(user.assessment);
  const goals = parseGoals(user.interests);
  
  const scores = houses.map(house => ({
    house,
    score: calculateFit(traits, goals, house.profile)
  }));
  
  return createAssignment(scores.sort().first());
}
```

## 🔐 Privacy-First Verification

### The Challenge

We need to verify users complete tasks without invading privacy.

### Our Solution

```typescript
// Client-side anonymization
async function processCapture(stream: MediaStream) {
  // 1. Detect faces
  const faces = await detectFaces(stream);
  
  // 2. Apply blur
  const blurred = await blurRegions(stream, faces);
  
  // 3. Transform audio
  const pitched = await pitchShift(blurred.audio);
  
  // 4. Generate hash
  const hash = await generateHash(blurred);
  
  // 5. Upload only anonymized version
  return upload(blurred, hash);
}
```

### Key Principles

1. **No raw biometrics** leave the client
2. **Irreversible transformations** only
3. **User controls** what's captured
4. **Peer review** without identification

## 🚀 Common Development Tasks

### Adding a New Archetype

1. Update the House enum:
```typescript
// lib/archetype/types.ts
enum House {
  // ... existing
  EXPLORER = "EXPLORER" // New archetype
}
```

2. Add classification rules:
```json
// config/archetypes.json
{
  "houses": [{
    "key": "EXPLORER",
    "name": "Explorer",
    "lore": "Growth through curiosity",
    "rules": [...]
  }]
}
```

3. Create UI components:
```tsx
// components/archetypes/ExplorerCard.tsx
export function ExplorerCard() {
  // Archetype-specific UI
}
```

### Creating a New Task Type

1. Define the template:
```typescript
// In database seed or admin panel
const breathworkTemplate = {
  key: "breath_wim_hof",
  title: "Wim Hof Breathing",
  modality: "BREATH",
  duration: 600, // 10 minutes
  instructions: "..."
};
```

2. Add scheduling logic:
```typescript
// lib/scheduler/rules.ts
if (user.archetype === "WARRIOR_MONK") {
  tasks.push(scheduleTask("breath_wim_hof", "morning"));
}
```

### Implementing a New Verification Mode

1. Add to enum:
```prisma
enum VerificationMode {
  NONE
  ANONYMIZED
  PEER_STAFF
  AI_VALIDATED // New mode
}
```

2. Implement processor:
```typescript
// lib/verification/processors/ai.ts
export async function processAIValidation(
  capture: Capture
): Promise<ValidationResult> {
  // AI validation logic
}
```

## 🧪 Testing

### Running Tests

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Accessibility audit
pnpm test:a11y
```

### Key Test Areas

1. **Archetype Assignment**: Deterministic classification
2. **Scheduling**: Correct prompt timing
3. **Verification**: Privacy preservation
4. **API**: Authentication and authorization

### Writing Tests

```typescript
// Example: Testing archetype assignment
describe('Archetype Assignment', () => {
  it('assigns Monk to high openness + calm goal', () => {
    const user = createUser({
      traits: { openness: 0.8 },
      goals: ['calm', 'focus']
    });
    
    const assignment = assignArchetype(user);
    
    expect(assignment.house).toBe('MONK');
    expect(assignment.confidence).toBeGreaterThan(0.7);
  });
});
```

## 📊 Monitoring & Analytics

### Key Metrics

```typescript
// Track important events
track('archetype_assigned', {
  house: assignment.house,
  confidence: assignment.confidence
});

track('task_completed', {
  template: task.template,
  duration: task.duration,
  verified: !!task.verification
});
```

### Performance Monitoring

- API latency targets: <200ms P95
- Database query monitoring via Prisma
- Client-side performance via Web Vitals

## 🚢 Deployment

### Local Preview

```bash
# Build and preview production build
pnpm build
pnpm start
```

### Staging Deployment

```bash
# Automatic via PR
git push origin feature/your-feature

# Creates preview deployment on Vercel
```

### Production Deployment

```bash
# Merge to main triggers production deploy
git checkout main
git merge feature/your-feature
git push origin main
```

## 🆘 Getting Help

### Resources

1. **Technical Spec**: `/docs/SPEC.md`
2. **API Docs**: `http://localhost:3000/api-docs`
3. **Architecture**: `/docs/ARCHITECTURE.md`
4. **Slack**: #habitstory-dev

### Common Issues

**Database Connection Failed**
```bash
# Check DATABASE_URL is set
# Ensure Neon instance is running
# Try: pnpm db:push
```

**Clerk Auth Not Working**
```bash
# Verify NEXT_PUBLIC_CLERK_* keys
# Check Clerk dashboard for domain config
```

**Verification Upload Failed**
```bash
# Check Upstash/R2 credentials
# Verify CORS settings
# Test with smaller file
```

## 🎯 Your First Contribution

### Suggested Starter Tasks

1. **Add a new meditation template** (Easy)
   - Create template in config
   - Add to scheduler rules
   - Test with your archetype

2. **Improve archetype quiz UX** (Medium)
   - Add animations
   - Improve question flow
   - Add progress indicator

3. **Create archetype badge component** (Medium)
   - Design badge for each house
   - Add to profile page
   - Make shareable

### Contribution Workflow

1. Pick an issue labeled `good-first-issue`
2. Create feature branch: `feature/issue-description`
3. Make changes with tests
4. Submit PR with description
5. Address review feedback
6. Celebrate when merged! 🎉

## 🚀 Advanced Topics

### AI-Accelerated Development

We use Cursor AI for rapid development:

```bash
# Example: Generate a new component
# Prompt: "Create a meditation timer component with pause/resume"

# Example: Add a feature
# Prompt: "Add streak freeze feature for Pro users"
```

### Performance Optimization

- Use `React.memo` for expensive components
- Implement virtual scrolling for long lists
- Lazy load verification components
- Cache archetype calculations

### Security Considerations

- All user inputs are validated with Zod
- API routes check authentication
- Verification uploads use signed URLs
- PII is encrypted at rest

---

Welcome to the team! We're building something special here - a wellness platform that truly understands and adapts to each user. Your contributions will help thousands find their path to better habits.

Questions? Reach out in #habitstory-dev or ping @team-leads 🙏