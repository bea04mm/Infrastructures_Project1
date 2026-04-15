# API Reference Guide

## Base URL

**Development:**
```
http://localhost:8000
```

**Production (via Nginx):**
```
http://localhost/api
```

## Authentication

All endpoints (except `/auth/register` and `/auth/login`) require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <JWT_TOKEN>
```

**Token Expiration:** 24 hours

**Token Storage:** localStorage (frontend) as `accessToken`

## Events Endpoints

### List All Events

```http
GET /events
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Conference 2026",
    "description": "Annual company conference",
    "start_date": "2026-04-13 09:00:00+00:00",
    "end_date": "2026-04-13 18:00:00+00:00",
    "location": "Main Hall",
    "max_guests": 100,
    "usergroup_id": 123456,
    "owner_id": 1,
    "created_at": "2026-04-10 14:30:00+00:00"
  }
]
```

### Create Event

```http
POST /events
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "Conference 2026",
  "description": "Annual company conference",
  "start_date": "2026-04-13 09:00:00",
  "end_date": "2026-04-13 18:00:00",
  "location": "Main Hall",
  "max_guests": 100
}
```

**Response:** 201 Created
```json
{
  "id": 1,
  "name": "Conference 2026",
  "description": "Annual company conference",
  "start_date": "2026-04-13 09:00:00+00:00",
  "end_date": "2026-04-13 18:00:00+00:00",
  "location": "Main Hall",
  "max_guests": 100,
  "usergroup_id": 123456,
  "owner_id": 1,
  "created_at": "2026-04-10 14:30:00+00:00"
}
```

**AutomationProcess:**
- Creates user group in ExtremeCloudIQ
- Configures PPSK mode with the new user group
- Schedules background cleanup job for `end_date`

### Get Event by ID

```http
GET /events/{event_id}
Authorization: Bearer <JWT_TOKEN>
```

**Response:** 200 OK
```json
{
  "id": 1,
  "name": "Conference 2026",
  ...
}
```

### Update Event

```http
PUT /events/{event_id}
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "Conference 2026 Updated",
  "max_guests": 150,
  "end_date": "2026-04-13 20:00:00"
}
```

**Response:** 200 OK
- All fields are optional
- `end_date` changes reschedule the cleanup job
- Returns updated event

### Delete Event

```http
DELETE /events/{event_id}
Authorization: Bearer <JWT_TOKEN>
```

**Response:** 200 OK
```json
{
  "message": "Event deleted successfully"
}
```

**Cleanup Process:**
1. Deletes all guests from database
2. Deletes all guests from ExtremeCloudIQ
3. Removes user group from SSID
4. Deletes user group from ExtremeCloudIQ
5. Deletes event from database

### Cleanup Event Manually

```http
POST /events/{event_id}/cleanup
Authorization: Bearer <JWT_TOKEN>
```

**Response:** 200 OK
```json
{
  "message": "Cleanup completed for event Conference 2026",
  "event_id": 1
}
```

**Note:** Same as automatic cleanup but triggered manually

### Cleanup All Expired Events

```http
POST /events/cleanup/all
Authorization: Bearer <JWT_TOKEN>
```

**Response:** 200 OK
```json
{
  "message": "Cleanup of all expired events completed successfully"
}
```

## Guests Endpoints

### List Guests for Event

```http
GET /events/{event_id}/guests
Authorization: Bearer <JWT_TOKEN>
```

**Response:** 200 OK
```json
[
  {
    "id": 1,
    "event_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "is_connected": false,
    "created_at": "2026-04-10 14:35:00+00:00",
    "extreme_end_user_id": "XIQ_USER_123"
  }
]
```

### Register Guest

```http
POST /events/{event_id}/register
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "1234567890"
}
```

**Response:** 201 Created
- Requires no authentication (public endpoint)
- Creates user in ExtremeCloudIQ
- Stores in database with event association
- User is part of the event's PPSK user group

### Get Guest Details

```http
GET /events/{event_id}/guests/{guest_id}
Authorization: Bearer <JWT_TOKEN>
```

**Response:** 200 OK
```json
{
  "id": 1,
  "event_id": 1,
  "first_name": "John",
  ...
}
```

### Delete Guest

```http
DELETE /events/{event_id}/guests/{guest_id}
Authorization: Bearer <JWT_TOKEN>
```

**Response:** 200 OK
```json
{
  "message": "Guest deleted successfully"
}
```

**Process:**
- Deletes guest from database
- Deletes end user from ExtremeCloudIQ
- Removes from event's PPSK user group

## Authentication Endpoints

### Register User

```http
POST /register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password_123",
  "full_name": "John Doe"
}
```

**Response:** 201 Created
```json
{
  "user_id": 1,
  "email": "user@example.com",
  "full_name": "John Doe"
}
```

**Validation:**
- Email must be unique
- Password must be at least 8 characters

### Login

```http
POST /login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password_123"
}
```

**Response:** 200 OK
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

## Webhook Endpoints

### Subscribe to Webhook

```http
POST /webhook/subscribe/{event_id}
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "webhook_url": "https://your-app.com/webhook",
  "auth_token": "secret_token_123"
}
```

**Response:** 201 Created
```json
{
  "id": 1,
  "event_id": 1,
  "webhook_url": "https://your-app.com/webhook",
  "is_active": true,
  "created_at": "2026-04-10 14:35:00+00:00"
}
```

### List Webhooks for Event

```http
GET /events/{event_id}/webhooks
Authorization: Bearer <JWT_TOKEN>
```

**Response:** 200 OK
```json
[
  {
    "id": 1,
    "event_id": 1,
    "webhook_url": "https://your-app.com/webhook",
    "is_active": true,
    "created_at": "2026-04-10 14:35:00+00:00"
  }
]
```

### Delete Webhook

```http
DELETE /webhook/subscriptions/{subscription_id}
Authorization: Bearer <JWT_TOKEN>
```

**Response:** 200 OK
```json
{
  "message": "Webhook subscription deleted successfully"
}
```

### Webhook Payload - Guest Login

```json
{
  "event_id": 1,
  "guest_id": 1,
  "guest_name": "John Doe",
  "guest_email": "john@example.com",
  "status": "guest_login",
  "timestamp": "2026-04-13 10:30:00+00:00"
}
```

**Authentication:**
Include your `auth_token` in the `Authorization` header:
```
Authorization: Bearer <auth_token>
```

### Webhook Payload - Guest Logout

```json
{
  "event_id": 1,
  "guest_id": 1,
  "guest_name": "John Doe",
  "guest_email": "john@example.com",
  "status": "guest_logout",
  "timestamp": "2026-04-13 17:45:00+00:00"
}
```

## Error Responses

### 400 Bad Request

```json
{
  "detail": "Invalid input data"
}
```

### 401 Unauthorized

```json
{
  "detail": "Not authenticated"
}
```

### 403 Forbidden

```json
{
  "detail": "Not enough permissions"
}
```

### 404 Not Found

```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "detail": "Internal server error"
}
```

## Rate Limiting

Currently no rate limiting. Future versions may implement:
- 100 requests per minute per IP
- 1000 requests per hour per user

## Pagination

List endpoints support pagination (future):
- Query: `?skip=0&limit=50`
- Default: 50 items per page

## Sorting

List endpoints support sorting (future):
- Query: `?sort_by=created_at&order=desc`

## Filtering

List endpoints support filtering (future):
- Query: `?status=active&owner_id=1`

## Examples

### Complete Event Lifecycle

```bash
# 1. Login
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "organizer@example.com",
    "password": "secure_pass"
  }'
# Returns: access_token

# 2. Create Event
curl -X POST http://localhost:8000/events \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Conference",
    "start_date": "2026-05-10 09:00:00",
    "end_date": "2026-05-10 17:00:00",
    "max_guests": 200
  }'
# Returns: event_id = 1

# 3. Register Guest (public, no auth needed)
curl -X POST http://localhost:8000/events/1/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com",
    "phone": "9876543210"
  }'

# 4. List Event's Guests
curl -X GET http://localhost:8000/events/1/guests \
  -H "Authorization: Bearer <token>"

# 5. Delete Event (automatic cleanup)
curl -X DELETE http://localhost:8000/events/1 \
  -H "Authorization: Bearer <token>"
```

## Development

**Local Testing:**
```bash
# Get all endpoints
curl -X GET http://localhost:8000/docs

# Get OpenAPI schema
curl -X GET http://localhost:8000/openapi.json
```
