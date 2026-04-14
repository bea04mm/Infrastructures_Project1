# 🚀 Event Kiosk System

**Intelligent Event Management Platform with Seamless WiFi Guest Access Provisioning**

Transform event management with automated guest access control and ExtremeCloudIQ integration. Deliver frictionless networking experiences with enterprise-grade security and real-time orchestration.

## ⚡ Key Capabilities

- **Intelligent Event Management** - Create, schedule, and manage events with precision
- **Automatic WiFi Provisioning** - Guests receive instant WiFi credentials on registration
- **ExtremeCloudIQ Integration** - Enterprise-grade network access control
- **Self-Service Kiosk** - Streamlined guest onboarding with one-click registration
- **Automatic Cleanup** - Revoke access when events end—no manual intervention needed
- **Multi-Calendar Views** - Day, Week, Month, and Timeline visualizations for comprehensive planning
- **JWT Security** - Industry-standard authentication with bcrypt password hashing

## 📋 Quick Start

### Prerequisites
- Docker & Docker Compose installed
- ExtremeCloudIQ credentials (XIQ_USERNAME, XIQ_PASSWORD)
- SSID ID or name for WiFi integration

### Environment Configuration

Create `.env` or set environment variables:

```bash
XIQ_USERNAME=your_xiq_username
XIQ_PASSWORD=your_xiq_password
XIQ_SSID_ID=12345                              # or use XIQ_SSID_NAME instead
XIQ_SSID_NAME=YourSSID                         # optional if XIQ_SSID_ID is set
WEBHOOK_URL=http://your-domain/webhooks/authentication
```

### Launch with Docker

```bash
docker compose up -d --build
```

**Access Points:**
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Database**: localhost:5432

## 👤 Default Admin Credentials

Auto-provisioned on backend startup:
- **Email**: `admin@gmail.com`
- **Password**: `admin`

## 🔄 How It Works

### Event Creation & WiFi Provisioning

When an event is created:
1. System automatically creates a user group in ExtremeCloudIQ
2. User group is added to SSID PPSK configuration for WiFi access
3. Guests can self-register via the public Kiosk page
4. Credentials are instantly provisioned and delivered

### Automatic Cleanup on Event End

When an event ends, the system autonomously:
1. ✓ Revokes all guest WiFi access from ExtremeCloudIQ
2. ✓ Removes user group from SSID configuration
3. ✓ Deletes the user group from ExtremeCloudIQ
4. ✓ Archives event in database

*Uses APScheduler for precise event-end trigger execution*

## 🛠 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite + Material-UI |
| **Backend** | FastAPI + Python 3.12 |
| **Database** | PostgreSQL |
| **Containers** | Docker & Docker Compose |
| **Security** | JWT + bcrypt + HTTPS-ready |

## 📡 API Reference

### Authentication Endpoints
```
POST   /auth/register              # Register new user
POST   /auth/login                 # Login (returns JWT token)
GET    /auth/me                    # Get current user (JWT required)
```

### Event Management (JWT Required)
```
GET    /events                     # List all events
GET    /events/public              # Public event listing
POST   /events                     # Create new event
PUT    /events/{event_id}          # Update event details
DELETE /events/{event_id}          # Delete event + cleanup
GET    /events/{event_id}/guests   # List event attendees
```

### Guest Access & Kiosk (Public)
```
POST   /kiosk/join                 # Guest self-registration
                                   # Body: event_id, name, email, accept_terms
```

### System Operations
```
POST   /events/{event_id}/cleanup   # Manual event cleanup
POST   /events/cleanup/all          # Cleanup all expired events
POST   /webhooks/authentication     # XIQ webhook receiver
POST   /webhooks/register           # XIQ webhook registration
```

### Health & Monitoring
```
GET    /health                     # System health status
GET    /health/db                  # Database connectivity check
```

## 🎯 User Roles & Routes

### Admin Dashboard (`/`)
- Create and manage events
- View event details and guest lists
- Monitor system statistics
- User management interface

### Public Kiosk (`/kiosk`)
- Self-service guest registration
- Instant WiFi credential delivery
- No authentication required
- Mobile-optimized interface

### Authentication Pages
- `/login` - User login portal
- `/register` - New user registration

## 🔐 Security Features

| Feature | Implementation |
|---------|----------------|
| **Authentication** | JWT tokens with configurable expiry |
| **Password Protection** | bcrypt hashing with salt |
| **Input Validation** | Sanitized across all endpoints |
| **Environment Secrets** | All credentials in environment variables |
| **Rate Limiting** | Ready for deployment-layer protection |
| **Role-Based Access** | Admin vs. User differentiation |

## 🗄 Database Schema

| Table | Purpose |
|-------|---------|
| `users` | System user accounts with authentication |
| `events` | Event definitions and scheduling |
| `guests` | Event attendee records and WiFi access |
| `webhook_subscriptions` | XIQ webhook integration registry |

## 📊 Development & Debugging

### View Live Logs
```bash
docker compose logs -f project1-backend-1      # Backend API
docker compose logs -f project1-frontend-1     # Frontend (Vite)
docker compose logs -f kiosk_postgres          # Database
```

### Stop All Services
```bash
docker compose down
```

### Clean Everything (Fresh Start)
```bash
docker compose down -v
docker system prune -a
```

## ✨ Important Notes

- **Guest Email Normalization** - All emails converted to lowercase for consistency
- **Single Email Per Event** - Prevents duplicate registrations
- **Automatic Access Revocation** - User groups removed from SSID when events end
- **Webhook Tracking** - Real-time login/logout event recording
- **Zero Manual Overhead** - Complete automated lifecycle management

## 🚀 Deployment Readiness

This system is production-ready with:
- ✅ Docker containerization
- ✅ Environment-based configuration
- ✅ Database persistence
- ✅ Error handling and logging
- ✅ Authentication and authorization
- ✅ Automated cleanup workflows

## 📝 License

Project developed for educational purposes.

---

**Questions?** Check the API_REFERENCE.md, DEPLOYMENT.md, or TROUBLESHOOTING.md for detailed guides.

