# Migration Guide: Habit Tracker → HabitStory

This guide explains how to migrate from the generic habit tracker to the new HabitStory archetype-based system.

## 🎯 Conceptual Changes

### Before: Generic Habit Tracker
- Simple habit list (Meditation, Exercise, Reading)
- One-size-fits-all approach
- Basic streak tracking
- No personalization

### After: HabitStory Archetypes
- Personality-based classification (Monk, Warrior-Monk, etc.)
- Customized prompts per archetype
- Intelligent scheduling
- Privacy-first verification
- Community features

## 🗄️ Database Migration

### 1. Update User Model

```sql
-- Add new fields to users table
ALTER TABLE users 
ADD COLUMN role VARCHAR(50) DEFAULT 'user',
ADD COLUMN onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN archetype_assigned_at TIMESTAMP;
```

### 2. Create New Tables

```sql
-- Personality profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  timezone VARCHAR(50),
  dnd_windows JSONB,
  verification_mode VARCHAR(20) DEFAULT 'NONE'
);

-- Trait scores from assessments
CREATE TABLE trait_scores (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  trait VARCHAR(50),
  score FLOAT,
  source VARCHAR(100)
);

-- Archetype assignments
CREATE TABLE assignments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  house VARCHAR(50),
  class VARCHAR(50),
  subclass VARCHAR(50),
  confidence FLOAT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Task templates (replacing hardcoded habits)
CREATE TABLE task_templates (
  id UUID PRIMARY KEY,
  key VARCHAR(100) UNIQUE,
  title VARCHAR(200),
  description TEXT,
  modality VARCHAR(50),
  min_duration INTEGER,
  max_duration INTEGER,
  house_tags TEXT[],
  personalization JSONB
);

-- Task instances (replacing habit entries)
CREATE TABLE task_instances (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  template_id UUID REFERENCES task_templates(id),
  scheduled_at TIMESTAMP,
  duration_sec INTEGER,
  params JSONB,
  status VARCHAR(20) DEFAULT 'SCHEDULED',
  completed_at TIMESTAMP
);

-- Verification submissions
CREATE TABLE verification_submissions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  task_instance_id UUID REFERENCES task_instances(id),
  mode VARCHAR(20),
  media_url TEXT,
  metrics JSONB,
  hash_chain TEXT,
  reviewed_at TIMESTAMP,
  verdict VARCHAR(20)
);
```

### 3. Migrate Existing Data

```typescript
// Migration script
async function migrateHabits() {
  // 1. Create default templates
  const templates = await createDefaultTemplates();
  
  // 2. Assign all users to starter archetype
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    // Create profile
    await prisma.profile.create({
      data: {
        userId: user.id,
        timezone: 'America/New_York', // Default
      }
    });
    
    // Assign starter archetype (Explorer)
    await prisma.assignment.create({
      data: {
        userId: user.id,
        house: 'EXPLORER',
        class: 'BEGINNER',
        confidence: 0.5,
      }
    });
    
    // Convert habits to task instances
    const habits = await prisma.habit.findMany({
      where: { userId: user.id }
    });
    
    for (const habit of habits) {
      const template = templates.find(t => 
        t.title.toLowerCase().includes(habit.name.toLowerCase())
      );
      
      if (template) {
        // Create historical task instances
        const entries = await prisma.habitEntry.findMany({
          where: { habitId: habit.id }
        });
        
        for (const entry of entries) {
          await prisma.taskInstance.create({
            data: {
              userId: user.id,
              templateId: template.id,
              scheduledAt: entry.date,
              status: entry.completed ? 'COMPLETED' : 'SKIPPED',
              completedAt: entry.completed ? entry.date : null,
              durationSec: 600, // Default 10 min
              params: {}
            }
          });
        }
      }
    }
  }
}
```

## 🎨 UI Migration

### Update Dashboard

Before:
```tsx
// Simple habit list
<div>
  {habits.map(habit => (
    <HabitCard key={habit.id} habit={habit} />
  ))}
</div>
```

After:
```tsx
// Archetype-aware dashboard
<div>
  <ArchetypeHeader user={user} assignment={assignment} />
  <TaskPrompts tasks={todayTasks} archetype={assignment.house} />
  <ProgressTracking streaks={streaks} house={assignment.house} />
  <CommunityFeed house={assignment.house} />
</div>
```

### New Components Needed

1. **Onboarding Flow**
   - Personality assessment
   - Goal selection
   - Schedule preferences
   - Archetype reveal

2. **Archetype Components**
   - House cards
   - Class badges
   - Lore displays
   - Progress trackers

3. **Verification System**
   - Capture widget
   - Anonymization indicator
   - Upload progress
   - Review interface

## 🔧 API Migration

### Update Endpoints

Old:
```
GET  /api/habits
POST /api/habits
PUT  /api/habits/:id
```

New:
```
# Archetype system
POST /api/onboarding/submit
GET  /api/archetype/current
POST /api/archetype/recompute

# Task system
GET  /api/prompts/today
POST /api/task/:id/start
POST /api/task/:id/complete

# Verification
POST /api/verify/:taskId
GET  /api/verify/history

# Community
GET  /api/house/feed
GET  /api/house/challenges
```

### Authentication Updates

Add role-based permissions:
```typescript
// Before: Simple auth check
if (!user) throw new UnauthorizedError();

// After: Role and archetype aware
if (!user) throw new UnauthorizedError();
if (user.role !== 'premium' && feature === 'verification') {
  throw new ForbiddenError('Verification requires premium');
}
```

## 🚀 Deployment Steps

### Phase 1: Database Preparation
1. Run migration scripts in staging
2. Verify data integrity
3. Create backups
4. Test rollback procedures

### Phase 2: Code Deployment
1. Deploy new API with feature flags
2. Keep old endpoints active
3. Deploy new UI behind flag
4. Test with subset of users

### Phase 3: User Migration
1. Show onboarding to existing users
2. Offer archetype assessment
3. Migrate habits to tasks
4. Enable new features gradually

### Phase 4: Cleanup
1. Remove old API endpoints
2. Archive old tables
3. Update documentation
4. Remove feature flags

## 📊 Success Metrics

Monitor during migration:
- User retention rate
- Archetype assignment completion
- Task completion rates vs old habits
- Verification adoption
- User feedback scores

## 🆘 Rollback Plan

If issues arise:
1. Disable new UI via feature flag
2. Route to old API endpoints
3. Keep data in sync
4. Fix issues in staging
5. Re-attempt migration

## 🔑 Key Considerations

1. **Data Privacy**: Ensure personality assessments are encrypted
2. **User Choice**: Allow opting out of new system initially
3. **Progressive Enhancement**: New features shouldn't break core functionality
4. **Communication**: Clear in-app messaging about changes
5. **Support**: Dedicated help for migration questions

## 📅 Timeline

- Week 1: Database migration and testing
- Week 2: API deployment with flags
- Week 3: Gradual UI rollout (10% → 50% → 100%)
- Week 4: Monitor and optimize
- Week 5: Clean up old code

## 🎉 Benefits for Users

Communicate these improvements:
- "Discover your wellness archetype"
- "Personalized practices just for you"
- "Join your House community"
- "Track progress with privacy"
- "Unlock your potential"

---

Remember: This migration transforms a simple tracker into a personalized wellness journey. Take time to ensure users understand and embrace their new archetype identity!