# API Documentation

Complete API reference for the Habit Tracker application.

## Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

## Authentication

All API endpoints require authentication using Clerk. Include the session cookie or Bearer token in requests.

```bash
# Cookie authentication (browser)
Cookie: __session=...

# Bearer token (programmatic access)
Authorization: Bearer <token>
```

## Rate Limiting

- **Anonymous**: 60 requests/minute per IP
- **Authenticated**: 100 requests/minute per user
- **API Key**: 1000 requests/hour

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 2024-01-01T00:00:00Z
Retry-After: 60
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {} // Optional additional information
}
```

Common HTTP status codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not authorized)
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Endpoints

### Habits

#### List Habits

```http
GET /api/habits
```

Get all habits for the authenticated user.

**Query Parameters:**
- `active` (boolean) - Filter by active status
- `sort` (string) - Sort by: `createdAt`, `name`, `streak`
- `order` (string) - Order: `asc`, `desc`

**Response:**
```json
[
  {
    "id": "clh1234567890",
    "name": "Morning Exercise",
    "description": "30-minute workout",
    "streak": 15,
    "longestStreak": 30,
    "lastCompletedAt": "2024-01-15T08:00:00Z",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T08:00:00Z",
    "todayEntry": {
      "id": "entry123",
      "date": "2024-01-15",
      "completed": true,
      "notes": "Great session!"
    },
    "completedCount": 45
  }
]
```

#### Create Habit

```http
POST /api/habits
```

Create a new habit.

**Request Body:**
```json
{
  "name": "Read Books",
  "description": "Read for 30 minutes daily"
}
```

**Validation:**
- `name` - Required, 1-100 characters
- `description` - Optional, max 500 characters

**Response:**
```json
{
  "id": "clh1234567891",
  "name": "Read Books",
  "description": "Read for 30 minutes daily",
  "streak": 0,
  "longestStreak": 0,
  "lastCompletedAt": null,
  "isActive": true,
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z",
  "todayEntry": null,
  "completedCount": 0
}
```

#### Get Habit

```http
GET /api/habits/{id}
```

Get a specific habit by ID.

**Response:**
```json
{
  "id": "clh1234567890",
  "name": "Morning Exercise",
  "description": "30-minute workout",
  "streak": 15,
  "longestStreak": 30,
  "lastCompletedAt": "2024-01-15T08:00:00Z",
  "isActive": true,
  "entries": [
    {
      "id": "entry123",
      "date": "2024-01-15",
      "completed": true,
      "notes": "Great session!"
    }
  ]
}
```

#### Update Habit

```http
PUT /api/habits/{id}
```

Update habit details.

**Request Body:**
```json
{
  "name": "Evening Exercise",
  "description": "Updated description",
  "isActive": true
}
```

**Response:** Updated habit object

#### Delete Habit

```http
DELETE /api/habits/{id}
```

Delete a habit and all associated entries.

**Response:**
```json
{
  "success": true
}
```

#### Toggle Habit Completion

```http
POST /api/habits/{id}/complete
```

Toggle habit completion for today.

**Request Body:**
```json
{
  "notes": "Optional completion notes"
}
```

**Response:**
```json
{
  "entry": {
    "id": "entry124",
    "date": "2024-01-15",
    "completed": true,
    "notes": "Optional completion notes"
  },
  "habit": {
    "id": "clh1234567890",
    "streak": 16,
    "longestStreak": 30,
    "lastCompletedAt": "2024-01-15T20:00:00Z"
  }
}
```

### Habit Sharing

#### Share Habit

```http
POST /api/habits/{habitId}/share
```

Create a shareable link for a habit.

**Request Body:**
```json
{
  "shareType": "progress",
  "message": "Check out my progress!",
  "isPublic": true,
  "expiresIn": 7
}
```

**Share Types:**
- `progress` - Share current progress
- `milestone` - Share achievement milestone
- `challenge` - Create a challenge

**Response:**
```json
{
  "shareUrl": "https://app.com/share/abc123",
  "shareId": "share123",
  "expiresAt": "2024-01-22T10:00:00Z"
}
```

#### Get Shared Habit

```http
GET /api/share/{shareId}
```

Get publicly shared habit data.

**Response:**
```json
{
  "habit": {
    "name": "Morning Exercise",
    "description": "30-minute workout",
    "streak": 15,
    "longestStreak": 30
  },
  "message": "Check out my progress!",
  "sharedBy": "John Doe",
  "sharedAt": "2024-01-15T10:00:00Z"
}
```

### Notifications

#### Register Push Token

```http
POST /api/notifications/register
```

Register a device for push notifications.

**Request Body:**
```json
{
  "token": "ExponentPushToken[...]",
  "deviceType": "ios",
  "deviceName": "iPhone 12"
}
```

**Response:**
```json
{
  "success": true,
  "subscriptionId": "sub123"
}
```

#### Unregister Push Token

```http
DELETE /api/notifications/register
```

Remove push notification registration.

**Request Body:**
```json
{
  "token": "ExponentPushToken[...]"
}
```

#### Get Notifications

```http
GET /api/notifications
```

Get user's notifications.

**Query Parameters:**
- `unread` (boolean) - Filter unread only
- `type` (string) - Filter by type
- `limit` (number) - Max results (default: 20)
- `offset` (number) - Pagination offset

**Response:**
```json
{
  "notifications": [
    {
      "id": "notif123",
      "type": "streak_milestone",
      "title": "15-Day Streak!",
      "body": "You've maintained your exercise habit for 15 days!",
      "data": {
        "habitId": "clh1234567890",
        "milestone": 15
      },
      "read": false,
      "createdAt": "2024-01-15T08:00:00Z"
    }
  ],
  "total": 42,
  "unreadCount": 5
}
```

#### Mark Notification as Read

```http
PUT /api/notifications/{id}/read
```

Mark a notification as read.

**Response:**
```json
{
  "success": true
}
```

### Analytics

#### Track Event

```http
POST /api/analytics/events
```

Track analytics events.

**Request Body:**
```json
{
  "event": "habit.completed",
  "properties": {
    "habitId": "clh1234567890",
    "streak": 15,
    "time": "morning"
  }
}
```

**Response:**
```json
{
  "success": true,
  "eventId": "evt123"
}
```

#### Get Stats

```http
GET /api/habits/stats
```

Get aggregated habit statistics.

**Query Parameters:**
- `period` (string) - Time period: `week`, `month`, `year`
- `habitId` (string) - Filter by specific habit

**Response:**
```json
{
  "period": "week",
  "completionRate": 0.857,
  "totalCompleted": 42,
  "totalMissed": 7,
  "currentStreaks": [
    {
      "habitId": "clh1234567890",
      "name": "Morning Exercise",
      "streak": 15
    }
  ],
  "longestStreak": {
    "habitId": "clh1234567890",
    "name": "Morning Exercise",
    "days": 30
  }
}
```

### Jobs (Internal)

#### Process Job

```http
POST /api/jobs/process
```

Process background jobs (QStash webhook).

**Headers:**
```
Authorization: Bearer <CRON_SECRET>
Upstash-Signature: <signature>
```

**Request Body:**
```json
{
  "type": "daily-streak-update",
  "userId": "user123"
}
```

### Health Check

#### Health Status

```http
GET /api/health
```

Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00Z",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "redis": "connected",
    "jobs": "active"
  }
}
```

## Webhooks

### Clerk Webhooks

```http
POST /api/webhooks/clerk
```

Handle Clerk authentication events.

**Headers:**
```
svix-id: <msg_id>
svix-timestamp: <timestamp>
svix-signature: <signature>
```

**Events Handled:**
- `user.created`
- `user.updated`
- `user.deleted`

## WebSocket Events (Future)

Planning to add real-time updates:

```javascript
// Subscribe to habit updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'habits.user123'
}));

// Receive updates
ws.on('message', (data) => {
  const { type, payload } = JSON.parse(data);
  // type: 'habit.updated', 'streak.broken', etc.
});
```

## SDK Usage Examples

### JavaScript/TypeScript

```typescript
import { HabitTrackerAPI } from '@habit-tracker/sdk';

const api = new HabitTrackerAPI({
  baseURL: 'https://api.habit-tracker.com',
  apiKey: 'your-api-key'
});

// List habits
const habits = await api.habits.list({ active: true });

// Create habit
const newHabit = await api.habits.create({
  name: 'Meditation',
  description: '10 minutes daily'
});

// Toggle completion
await api.habits.complete(habitId);
```

### cURL Examples

```bash
# List habits
curl -H "Authorization: Bearer $TOKEN" \
  https://api.habit-tracker.com/api/habits

# Create habit
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Meditation"}' \
  https://api.habit-tracker.com/api/habits

# Toggle completion
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  https://api.habit-tracker.com/api/habits/clh123/complete
```

---

For more examples and SDK documentation, visit our [GitHub repository](https://github.com/your-org/habit-tracker).