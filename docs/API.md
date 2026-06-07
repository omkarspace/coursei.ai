# Coursei.ai API Documentation

## Base URL

```
https://coursei.ai/api
```

## Endpoints

### Health Check

```http
GET /api/health
```

Returns system health status including database connectivity.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2026-06-01T12:00:00.000Z",
  "uptime": 12345.678,
  "checks": {
    "database": {
      "status": "healthy",
      "latency": 15
    }
  },
  "version": "0.1.0"
}
```

---

### Search Courses

```http
GET /api/search?q=typescript&limit=10
```

Semantic search for courses using Upstash Vector (falls back to text search).

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| q | string | required | Search query |
| limit | number | 10 | Max results |

**Response:**

```json
{
  "results": [
    {
      "courseId": "course_123456",
      "name": "Introduction to TypeScript",
      "category": "Programming",
      "level": "Beginner",
      "score": 0.92
    }
  ],
  "source": "vector"
}
```

---

### Course Generation Status

```http
GET /api/course/:courseId/status
```

Check the status of an AI course generation.

**Response:**

```json
{
  "status": "generating_chapters",
  "progress": 60,
  "currentStep": "Chapter 5 of 8",
  "generationError": null
}
```

---

## Authentication

Most endpoints require authentication via Clerk. Include the session token in requests:

```http
Authorization: Bearer <session_token>
```

## Rate Limiting

- Public API: 100 requests per minute
- Authenticated API: 1000 requests per minute

## Error Responses

```json
{
  "error": "Error message"
}
```

Common HTTP status codes:

- `200` - Success
- `400` - Bad request
- `401` - Unauthorized
- `404` - Not found
- `500` - Internal server error
