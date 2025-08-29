# Contributing to HabitStory

Thank you for your interest in contributing to HabitStory! We're building a platform that helps people develop lasting wellness habits through personalized archetypes.

## 🎯 Our Mission

Create a wellness platform that:
- Respects user privacy above all
- Personalizes experiences based on personality
- Builds sustainable habits, not quick fixes
- Fosters supportive communities

## 🚀 Getting Started

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/habitstory.git
   cd habitstory
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up your environment**
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   # Add your development keys
   ```

4. **Run the development server**
   ```bash
   cd apps/web
   pnpm dev
   ```

## 🌿 Development Workflow

### 1. Pick an Issue

- Look for issues labeled `good-first-issue` or `help-wanted`
- Comment on the issue to claim it
- Ask questions if anything is unclear

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 3. Make Your Changes

Follow our coding standards:
- Write TypeScript with explicit types
- Include tests for new features
- Update documentation as needed
- Consider privacy implications

### 4. Test Your Changes

```bash
# Run all tests
pnpm test

# Run specific tests
pnpm test archetype

# Check types
pnpm typecheck

# Lint code
pnpm lint
```

### 5. Submit a Pull Request

- Write a clear PR description
- Reference the issue being solved
- Include screenshots for UI changes
- Ensure all checks pass

## 📝 Code Style Guide

### TypeScript

```typescript
// ✅ Good: Explicit types
interface UserProfile {
  id: string;
  archetype: House;
  goals: Goal[];
}

// ❌ Bad: Implicit any
const processUser = (user) => {
  // ...
}
```

### React Components

```tsx
// ✅ Good: Typed props with interface
interface ArchetypeCardProps {
  house: House;
  onSelect: (house: House) => void;
}

export function ArchetypeCard({ house, onSelect }: ArchetypeCardProps) {
  // Component logic
}

// ❌ Bad: Inline prop types
export function ArchetypeCard({ house, onSelect }: { house: any, onSelect: Function }) {
  // ...
}
```

### API Routes

```typescript
// ✅ Good: Consistent error handling
export const GET = withErrorHandler(async (request) => {
  const user = await authenticate(request);
  const data = await fetchUserData(user.id);
  return successResponse(data);
});

// ❌ Bad: Inconsistent responses
export async function GET(request) {
  try {
    return NextResponse.json(data);
  } catch (e) {
    return new Response('Error', { status: 500 });
  }
}
```

## 🏛️ Archetype Guidelines

When working on archetype features:

1. **Respect the lore** - Each archetype has a personality
2. **Keep it balanced** - No archetype should be "better"
3. **Privacy first** - Personality data is sensitive
4. **Test assignments** - Ensure consistent classification

## 🔒 Privacy Standards

### Never Do This

```typescript
// ❌ Bad: Storing raw biometric data
const video = await capture.getVideoTracks();
await saveToDatabase(video);

// ❌ Bad: Logging sensitive info
logger.info('User traits:', user.personalityScores);
```

### Always Do This

```typescript
// ✅ Good: Client-side anonymization
const anonymized = await processClientSide(capture);
await uploadAnonymized(anonymized);

// ✅ Good: Minimal logging
logger.info('Archetype assigned', { userId: user.id, house: assignment.house });
```

## 🧪 Testing Requirements

### Unit Tests

Test business logic in isolation:

```typescript
describe('Archetype Assignment', () => {
  it('assigns Monk to high openness + calm goal', () => {
    const result = assignArchetype({
      traits: { openness: 0.8 },
      goals: ['calm', 'focus']
    });
    
    expect(result.house).toBe('MONK');
  });
});
```

### Integration Tests

Test API endpoints:

```typescript
describe('POST /api/archetype/assign', () => {
  it('creates assignment for authenticated user', async () => {
    const response = await request
      .post('/api/archetype/assign')
      .set('Authorization', `Bearer ${token}`)
      .send({ assessment: mockAssessment });
      
    expect(response.status).toBe(200);
    expect(response.body.data.house).toBeDefined();
  });
});
```

### E2E Tests

Test critical user journeys:

```typescript
test('complete onboarding flow', async ({ page }) => {
  await page.goto('/onboarding');
  await page.fill('[name="goals"]', 'focus,calm');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

## 📚 Documentation

### Code Comments

```typescript
/**
 * Assigns a user to an archetype based on personality and goals.
 * 
 * @param assessment - Completed personality assessment
 * @param goals - User's wellness goals
 * @returns Assignment with house and confidence score
 * @throws {InvalidAssessmentError} If assessment is incomplete
 */
export async function assignArchetype(
  assessment: Assessment,
  goals: Goal[]
): Promise<Assignment> {
  // Implementation
}
```

### README Updates

Update documentation when you:
- Add new features
- Change API interfaces
- Modify setup steps
- Add dependencies

## 🎨 UI/UX Guidelines

### Accessibility

- All interactive elements need keyboard support
- Include ARIA labels for screen readers
- Test with accessibility tools
- Maintain WCAG 2.1 AA compliance

### Responsive Design

- Mobile-first approach
- Test on various screen sizes
- Consider touch interactions
- Optimize for performance

## 🚢 Deployment

### Pre-deployment Checklist

- [ ] All tests passing
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Privacy controls working
- [ ] Documentation updated

### Feature Flags

New features should be behind flags:

```typescript
if (featureFlags.newArchetype) {
  // New feature code
}
```

## 🤝 Community

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Provide constructive feedback
- Focus on user wellness

### Getting Help

- Join our Discord: [link]
- Check existing issues
- Ask in PR comments
- Tag @maintainers for complex questions

## 🎉 Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- Monthly community updates
- Special archetype badges (coming soon!)

## 📋 Pull Request Template

```markdown
## Description
Brief description of changes

## Related Issue
Fixes #(issue number)

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Refactoring
- [ ] Documentation

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Privacy Impact
- [ ] No privacy impact
- [ ] Privacy considered and addressed

## Screenshots
(if applicable)
```

Thank you for contributing to HabitStory! Together, we're building a platform that truly helps people develop lasting wellness habits while respecting their privacy.

Questions? Reach out to the maintainers or ask in the issues. We're here to help! 🙏