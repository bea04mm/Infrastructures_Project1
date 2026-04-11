# Captive Portal Project

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

## Frontend routes

Base URL (dev): `http://localhost:5173`

- `/login` - login page
- `/register` - register page
- `/portal` - public captive portal page (guest join)
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

### Captive Portal
- `POST /portal/join` (public)
  - Accepts: `event_id`, `name`, `email`, `accept_terms`
  - Associates guest to event by email (one guest email per event)

## JWT usage

For protected routes, send header:

```http
Authorization: Bearer <access_token>
```

Token is returned by `POST /auth/login`.
