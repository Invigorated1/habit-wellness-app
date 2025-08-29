# HabitStory Data Schemas

## Database Schema (Prisma)

### User Model
```prisma
model User {
  id            String   @id @default(cuid())
  clerkId       String   @unique
  email         String   @unique
  name          String?
  role          String   @default("user")
  createdAt     DateTime @default(now())
  
  // Relations
  profile       Profile?
  habits        Habit[]
  entries       HabitEntry[]
  assignments   Assignment[]
  taskInstances TaskInstance[]
}
```

### Profile Model
```prisma
model Profile {
  id             String   @id @default(cuid())
  userId         String   @unique
  timezone       String   @default("UTC")
  preferredTimes Json?    // {morning?, midday?, evening?}
  dndWindows     Json?    // [{start, end}]
  intensity      String   @default("balanced")
  
  // Relations
  user           User     @relation(fields: [userId], references: [id])
  traitScores    TraitScore[]
  goals          Goal[]
}
```

### Assignment Model
```prisma
model Assignment {
  id         String   @id @default(cuid())
  userId     String
  house      String   // MONK, WARRIOR_MONK, etc.
  class      String   // Silent Monk, Active Warrior-Monk, etc.
  subclass   String?
  confidence Float
  rationale  String?
  active     Boolean  @default(true)
  
  // Relations
  user       User     @relation(fields: [userId], references: [id])
}
```

### TaskTemplate Model
```prisma
model TaskTemplate {
  id           String   @id @default(cuid())
  house        String
  class        String?
  name         String
  description  String
  modality     String   // MEDITATION, BREATH, etc.
  duration     Int      // minutes
  instructions Json
  config       Json?
  
  // Relations
  instances    TaskInstance[]
}
```

### TaskInstance Model
```prisma
model TaskInstance {
  id            String    @id @default(cuid())
  userId        String
  templateId    String
  scheduledFor  DateTime
  status        String    @default("pending")
  completedAt   DateTime?
  
  // Relations
  user          User      @relation(fields: [userId], references: [id])
  template      TaskTemplate @relation(fields: [templateId], references: [id])
  verifications VerificationSubmission[]
}
```

## API Request/Response Schemas

### Create Habit Request
```typescript
{
  name: string         // Required, 1-100 chars
  description?: string // Optional, max 500 chars
  frequency: 'daily' | 'weekly' | 'custom'
  targetDays?: number[]
  reminderTime?: string // HH:MM format
}
```

### Habit Response
```typescript
{
  id: string
  name: string
  description: string | null
  frequency: string
  targetDays: number[] | null
  reminderTime: string | null
  streak: number
  lastCompletedAt: string | null
  createdAt: string
  updatedAt: string
}
```

### Onboarding Submission
```typescript
{
  traitScores: {
    openness: number      // 0-100
    conscientiousness: number
    extraversion: number
    agreeableness: number
    neuroticism: number
  }
  goals: {
    goalId: string
    priority: number     // 1-5
  }[]
  preferences: {
    intensity: 'gentle' | 'balanced' | 'intense'
    timeCommitment: 5 | 10 | 20 | 30
    socialPreference: 'solo' | 'optional' | 'social'
  }
  schedule: {
    timezone: string
    morningWindow?: { start: string, end: string }
    middayWindow?: { start: string, end: string }
    eveningWindow?: { start: string, end: string }
    dndWindows: { start: string, end: string }[]
  }
}
```

### Archetype Assignment Response
```typescript
{
  house: string        // e.g., "MONK"
  class: string        // e.g., "Silent Monk"
  confidence: number   // 0-1
  rationale: string
  traits: {
    primary: string[]
    secondary: string[]
  }
}
```

## State Management Schemas

### Onboarding Store State
```typescript
{
  currentStep: string
  completedSteps: string[]
  personalityAnswers: Record<string, number>
  selectedGoals: Array<{
    goalId: string
    priority: number
  }>
  schedulePreferences: {
    morningEnabled: boolean
    morningStart: string
    morningEnd: string
    // ... similar for midday/evening
  }
  intensity: string
  timeCommitment: number
  socialPreference: string
  timezone: string
  dndWindows: Array<{ start: string, end: string }>
  assignedHouse: string | null
  assignedClass: string | null
  archetypeResult: ArchetypeResult | null
}
```

## Notification Schemas

### Smart Notification
```typescript
{
  id: string
  type: NotificationType
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  channel: 'PUSH' | 'EMAIL' | 'IN_APP' | 'SMS'
  content: {
    title: string
    body: string
    actionUrl?: string
    imageUrl?: string
    data?: Record<string, any>
  }
  scheduledFor: Date
  expiresAt?: Date
  context: {
    reason: string
    userState: Partial<UserContext>
    triggers: string[]
  }
}
```

## Reward Schemas

### Variable Reward
```typescript
{
  id: string
  type: 'BONUS_XP' | 'RARE_BADGE' | 'HOUSE_GIFT' | etc.
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'
  value: any         // Type-specific payload
  title: string
  description: string
  asciiArt?: string
  expiresAt?: Date
}
```

## Progress Schemas

### Skill Node
```typescript
{
  id: string
  name: string
  description: string
  icon: string       // ASCII character/emoji
  tier: number       // 0-4
  requiredXP: number
  prerequisites: string[]
  benefits: string[]
  unlocked: boolean
  progress: number   // 0-100
  house?: string     // House-specific nodes
}
```

### User Progress
```typescript
{
  userId: string
  totalXP: number
  level: number
  unlockedNodes: string[]
  nodeProgress: Record<string, number>
  currentPath: string[]
}
```