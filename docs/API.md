# API Documentation

## Overview

The AI-Powered Code Review Assistant provides a RESTful API for interacting with the service.

## Base URL

```
http://localhost:3000
```

## Endpoints

### Health Check

Check the health status of the service.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-05-13T09:00:00.000Z",
  "version": "1.0.0"
}
```

### Service Status

Get detailed service status and metrics.

**Endpoint:** `GET /status`

**Response:**
```json
{
  "service": "AI Code Review Assistant",
  "status": "running",
  "uptime": 3600,
  "metrics": {
    "totalReviews": 150,
    "activeReviews": 3
  }
}
```

### GitHub Webhook

Receive GitHub webhook events for pull requests.

**Endpoint:** `POST /webhook`

**Headers:**
- `X-GitHub-Event`: Event type (e.g., "pull_request")
- `X-Hub-Signature-256`: HMAC signature for verification

**Request Body:**
```json
{
  "action": "opened",
  "pull_request": {
    "id": 123,
    "number": 45,
    "title": "Add new feature",
    "head": {
      "sha": "abc123"
    }
  }
}
```

**Response:**
```json
{
  "received": true,
  "reviewId": "rev_123456"
}
```

## Authentication

API requests require authentication using GitHub tokens or API keys.

**Header:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

## Rate Limiting

- 100 requests per 15 minutes per IP address
- Rate limit headers included in responses

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request",
  "message": "Missing required field: pull_request"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## Webhook Events

### Supported Events

- `pull_request.opened`
- `pull_request.synchronize`
- `pull_request.reopened`

### Event Processing

1. Webhook received and verified
2. Code changes extracted
3. Analysis performed (security, quality, performance)
4. AI-powered insights generated
5. Comments posted to PR

## Examples

### cURL Example

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: pull_request" \
  -d @webhook-payload.json
```

### JavaScript Example

```javascript
const response = await fetch('http://localhost:3000/webhook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-GitHub-Event': 'pull_request'
  },
  body: JSON.stringify(webhookPayload)
});
```

## Support

For issues or questions, please open an issue on GitHub.