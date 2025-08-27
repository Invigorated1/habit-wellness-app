# Habits API Documentation

## Authentication
All endpoints require authentication via Clerk. The middleware automatically protects these routes.

## Endpoints

### List All Habits
```
GET /api/habits
```

**Response:**
```json
[
  {
    "id": "clxxx...",
    "name": "Meditation",
    "description": "Daily meditation practice",
    "streak": 5,
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

### Create a Habit
```
POST /api/habits
```

**Request Body:**
```json
{
  "name": "Exercise",
  "description": "Daily workout routine" // optional
}
```

**Response:** 201 Created
```json
{
  "id": "clxxx...",
  "name": "Exercise",
  "description": "Daily workout routine",
  "streak": 0,
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

### Get a Single Habit
```
GET /api/habits/:id
```

**Response:**
```json
{
  "id": "clxxx...",
  "name": "Meditation",
  "description": "Daily meditation practice",
  "streak": 5,
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z",
  "entries": [
    {
      "id": "clyyy...",
      "date": "2025-01-01T00:00:00.000Z",
      "completed": true,
      "notes": "Felt great today"
    }
  ]
}
```

### Update a Habit
```
PATCH /api/habits/:id
```

**Request Body (all fields optional):**
```json
{
  "name": "Morning Meditation",
  "description": "Updated description",
  "isActive": false,
  "streak": 10
}
```

**Response:**
```json
{
  "id": "clxxx...",
  "name": "Morning Meditation",
  "description": "Updated description",
  "streak": 10,
  "isActive": false,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-02T00:00:00.000Z"
}
```

### Delete a Habit
```
DELETE /api/habits/:id
```

**Response:** 200 OK
```json
{
  "message": "Habit deleted successfully"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Name is required and must be a non-empty string"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "error": "Habit not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to [action] habit"
}
```

## Testing with cURL

### Create a habit
```bash
curl -X POST http://localhost:3000/api/habits \
  -H "Content-Type: application/json" \
  -d '{"name": "Read Books", "description": "Read for 30 minutes daily"}'
```

### List habits
```bash
curl http://localhost:3000/api/habits
```

### Update a habit
```bash
curl -X PATCH http://localhost:3000/api/habits/YOUR_HABIT_ID \
  -H "Content-Type: application/json" \
  -d '{"name": "Read Technical Books"}'
```

### Delete a habit
```bash
curl -X DELETE http://localhost:3000/api/habits/YOUR_HABIT_ID
```

## Notes

- All habits are user-scoped (users can only see/modify their own habits)
- Deleting a habit also deletes all associated entries (cascade delete)
- The `streak` field can be manually updated via PATCH, but will be automatically calculated in future updates
- The `isActive` field allows soft-disabling habits without deletion