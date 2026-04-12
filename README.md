# Event Kiosk Project

This project contains a React frontend, a FastAPI backend, and PostgreSQL using Docker Compose.

## Admin user seed

On backend startup, an admin user is automatically seeded if it does not exist:

- Email: `admin@gmail.com`
- Password: `admin`

## Run with Docker

From project root:

```bash
docker compose up -d --build
```

### ExtremeCloudIQ integration (event -> usergroup -> SSID PPSK)

When creating an event (`POST /events`), backend now:

1. Creates a user group with event name (`POST /usergroups`)
2. Reads current SSID groups (`GET /ssids/{id}`)
3. Replaces SSID PPSK group list with existing groups + new group (`PUT /ssids/{id}/mode/ppsk`)

Configure these backend environment variables:

- `XIQ_USERNAME`
- `XIQ_PASSWORD`
- `XIQ_SSID_ID` (preferred) or `XIQ_SSID_NAME`

## Frontend routes

Base URL (dev): `http://localhost:5173`

- `/login` - login page
- `/register` - register page
- `/kiosk` - public event kiosk page (guest join)
- `/` - protected app (scheduler/events management)

## Backend routes

Base URL: `http://localhost:8000`

### Health
- `GET /health`
- `GET /health/db`

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me` (JWT required)

### Events
- `GET /events` (JWT required)
- `GET /events/public` (public)
- `POST /events` (JWT required)
- `PUT /events/{event_id}` (JWT required)
- `DELETE /events/{event_id}` (JWT required)
- `GET /events/{event_id}/guests` (JWT required)

### Event Kiosk
- `POST /kiosk/join` (public)
  - Accepts: `event_id`, `name`, `email`, `accept_terms`
  - Associates guest to event by email (one guest email per event)

## JWT usage

For protected routes, send header:

```http
Authorization: Bearer <access_token>
```

Token is returned by `POST /auth/login`.
