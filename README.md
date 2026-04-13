# Event Kiosk Project

Event management system with ExtremeCloudIQ integration for automatic WiFi guest access. Built with React frontend, FastAPI backend, and PostgreSQL.

## Quick Start

### Prerequisites
- Docker & Docker Compose
- ExtremeCloudIQ credentials (XIQ_USERNAME, XIQ_PASSWORD)
- SSID ID or name for WiFi integration

### Environment Setup

Create `.env` or set environment variables:

```bash
XIQ_USERNAME=your_xiq_username
XIQ_PASSWORD=your_xiq_password
XIQ_SSID_ID=12345          # or use XIQ_SSID_NAME instead
XIQ_SSID_NAME=YourSSID     # optional if XIQ_SSID_ID is set
WEBHOOK_URL=http://your-domain/webhooks/authentication
```

### Run with Docker

```bash
docker compose up -d --build
```

Access:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Database**: localhost:5432

## Admin User

Auto-seeded on backend startup:
- Email: `admin@gmail.com`
- Password: `admin`

## Features

### Automatic Event Cleanup

When an event ends, the system automatically:
1. Deletes all guests from ExtremeCloudIQ
2. Removes user group from SSID PPSK configuration
3. Deletes the user group from ExtremeCloudIQ
4. Clears the event reference in database

**Scheduling**: Uses APScheduler to trigger cleanup at exact event end_date time.

### ExtremeCloudIQ Integration

**Event Creation Flow:**
1. Creates user group with event name
2. Adds user group to SSID PPSK mode
3. Guests can join via kiosk and get WiFi credentials

**Event Deletion Flow:**
1. Removes user group from SSID PPSK group list
2. Deletes user group from XIQ
3. Removes event from database

## API Routes

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login (returns JWT)
- `GET /auth/me` - Get current user (JWT required)

### Events (JWT required)
- `GET /events` - List all events
- `GET /events/public` - List events (public)
- `POST /events` - Create event
- `PUT /events/{event_id}` - Update event
- `DELETE /events/{event_id}` - Delete event
- `GET /events/{event_id}/guests` - List event guests

### Manual Cleanup (JWT required)
- `POST /events/{event_id}/cleanup` - Cleanup specific event
- `POST /events/cleanup/all` - Cleanup all expired events

### Kiosk (Public)
- `POST /kiosk/join` - Guest joins event
  - Body: `event_id`, `name`, `email`, `accept_terms`
  - Returns: Guest confirmation

### Webhooks (Public)
- `POST /webhooks/authentication` - Receives login/logout events from XIQ
- `POST /webhooks/register` - Register webhook with XIQ

### Health
- `GET /health` - Basic health check
- `GET /health/db` - Database connection check

## Frontend Routes

- `/login` - Login page
- `/register` - Registration page
- `/kiosk` - Public guest join page
- `/` - Protected dashboard (event management)

## JWT Authentication

Include in protected endpoints:

```http
Authorization: Bearer <access_token>
```

Token from `POST /auth/login` response.

## Database

Tables:
- `users` - System users
- `events` - Event definitions
- `guests` - Event guests (one email per event)
- `webhook_subscriptions` - XIQ webhook registrations

## Development

View logs:

```bash
docker compose logs -f project1-backend-1
docker compose logs -f project1-frontend-1
docker compose logs -f kiosk_postgres
```

Stop all services:

```bash
docker compose down
```

## Notes

- Guest emails are normalized (lowercase)
- One guest email per event (existing guests return existing record)
- User groups automatically removed from SSID when events end
- Webhook authentication tracking (login/logout events)

