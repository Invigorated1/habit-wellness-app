# HabitStory API Surface

## Authentication
All API routes require authentication via Clerk. Include the session cookie or Authorization header.

## Habit Management

### GET /api/habits
Fetch user's habits with pagination.

**Query Parameters:**
- `page` (number): Page number, default 1
- `limit` (number): Items per page, default 10

**Response:**
```json
{
  "habits": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### POST /api/habits
Create a new habit.

**Request Body:**
```json
{
  "name": "Morning Meditation",
  "description": "10 minutes of mindfulness",
  "frequency": "daily",
  "reminderTime": "07:00"
}
```

### GET /api/habits/:id
Get a specific habit.

### PUT /api/habits/:id
Update a habit.

### DELETE /api/habits/:id
Delete a habit.

### POST /api/habits/:id/complete
Mark habit as completed for today.

## User Management

### GET /api/users/me
Get current user profile with archetype assignment.

### PUT /api/users/me
Update user profile.

### POST /api/users/sync
Webhook endpoint for Clerk user sync.

## Onboarding

### POST /api/onboarding/submit
Submit onboarding data and receive archetype assignment.

**Request Body:**
```json
{
  "traitScores": {
    "openness": 75,
    "conscientiousness": 82,
    "extraversion": 45,
    "agreeableness": 68,
    "neuroticism": 30
  },
  "goals": [
    { "goalId": "stress_management", "priority": 1 },
    { "goalId": "better_sleep", "priority": 2 }
  ],
  "preferences": {
    "intensity": "balanced",
    "timeCommitment": 15,
    "socialPreference": "optional"
  },
  "schedule": {
    "timezone": "America/New_York",
    "morningWindow": { "start": "06:00", "end": "09:00" },
    "eveningWindow": { "start": "20:00", "end": "22:00" },
    "dndWindows": [{ "start": "22:00", "end": "06:00" }]
  }
}
```

**Response:**
```json
{
  "data": {
    "house": "MONK",
    "class": "Silent Monk",
    "confidence": 0.87,
    "rationale": "High conscientiousness and preference for solo practice...",
    "userId": "user_123"
  }
}
```

## Task Management

### GET /api/tasks/today
Get today's scheduled tasks.

### POST /api/tasks/:id/complete
Mark a task as completed with optional verification.

**Request Body:**
```json
{
  "duration": 600,
  "notes": "Felt very centered",
  "mediaUrl": "optional_media_url"
}
```

## Community

### GET /api/cohorts/mine
Get user's assigned cohort.

### GET /api/cohorts/:id/feed
Get cohort activity feed.

### POST /api/cohorts/:id/messages
Post a message to cohort.

## Progress

### GET /api/progress/overview
Get user's progress overview including XP, level, and streaks.

### GET /api/progress/skill-tree
Get user's skill tree with unlocked nodes.

### POST /api/progress/skills/:nodeId/unlock
Unlock a skill node if requirements are met.

## Rewards

### GET /api/rewards/pending
Get pending rewards to claim.

### POST /api/rewards/:id/claim
Claim a specific reward.

## Notifications

### GET /api/notifications
Get in-app notifications.

### PUT /api/notifications/:id/read
Mark notification as read.

### PUT /api/notifications/preferences
Update notification preferences.

## Monitoring

### GET /api/monitoring/sli
Get service level indicators (admin only).

### GET /api/monitoring/costs
Get cost tracking data (admin only).

## Scheduled Jobs (Cron)

### POST /api/cron/schedule-tasks
Generate daily tasks for all users (triggered by Vercel Cron).

### POST /api/cron/send-notifications
Process and send scheduled notifications.

## Rate Limits

- Standard endpoints: 100 requests per minute
- Create/Update operations: 20 requests per minute
- Onboarding submission: 5 requests per hour

## Error Responses

All errors follow this format:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Name is required",
    "details": {
      "field": "name",
      "requirement": "1-100 characters"
    }
  }
}
```

Common error codes:
- `VALIDATION_ERROR`: Invalid input
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Not authenticated
- `FORBIDDEN`: Not authorized
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error