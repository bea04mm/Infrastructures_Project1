# Deployment Guide

## Prerequisites

- Docker Engine 24.0+
- Docker Compose 2.0+
- Git
- 2GB minimum RAM available
- Ports available: 80 (Nginx reverse proxy), 5432 (PostgreSQL internal only)

## Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd project1
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Backend Configuration
BACKEND_PORT=8000
FRONTEND_URL=http://localhost:5173

# Backend Database Configuration
DATABASE_URL=postgresql+psycopg2://postgres:postgres@db:5432/event_kiosk

# JWT Configuration
SECRET_KEY=your-super-secret-jwt-key-change-this-in-production

# ExtremeCloudIQ Configuration
XIQ_USERNAME=your_xiq_username
XIQ_PASSWORD=your_xiq_password

# SSID Configuration (choose one)
XIQ_SSID_ID=123456789
# OR
XIQ_SSID_NAME=YourSSIDName

# Webhook Configuration
WEBHOOK_URL=https://your-public-domain.com/webhooks/authentication
```

### 3. Important Notes on Environment Variables

**Production Considerations:**
- Change `SECRET_KEY` to a strong, random value
- Never expose XIQ credentials in version control
- Never commit `.env` file to version control
- Never share `SECRET_KEY` publicly

**Database URL Format:**
- Connection string is in `DATABASE_URL` variable
- Format: `postgresql+psycopg2://user:password@host:port/database`
- If connecting from outside Docker: use `localhost`
- If connecting inside Docker: use `db` (service name)

**XIQ Configuration:**
- Either provide `XIQ_SSID_ID` OR `XIQ_SSID_NAME` (not both required, but at least one)
- ID-based lookup is faster than name-based lookup
- Verify credentials work with XIQ API before deployment

**Webhook Configuration:**
- `WEBHOOK_URL` must be publicly accessible from ExtremeCloudIQ servers
- Use HTTPS in production
- For ngrok tunnel testing: use your public ngrok URL

## Local Development

### Start Services

```bash
# Build and start all containers
docker compose up -d --build

# Verify all services are running
docker compose ps
```

**Expected Output:**
```
NAME                    COMMAND                  SERVICE   STATUS      PORTS
nginx_reverse_proxy     nginx -g daemon off...   nginx     Up          0.0.0.0:80->80/tcp
project1-frontend-1     npm run dev              frontend  Up          
project1-backend-1      uvicorn app.main:app...  backend   Up          
kiosk_postgres          postgres                 db        Up (healthy) 0.0.0.0:5432->5432/tcp
```

**Service Architecture:**
- **nginx**: Reverse proxy on port 80 (public)
- **frontend**: React dev server on port 5173 (internal, accessed via nginx)
- **backend**: FastAPI on port 8000 (internal, accessed via nginx)
- **db**: PostgreSQL on port 5432 (internal, requires authentication)

### Access Services

**Via Nginx (recommended in docker compose):**
- **Frontend**: http://localhost
- **Backend API**: http://localhost/api/
- **API Documentation**: http://localhost/api/docs

**Direct Access (development only):**
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: localhost:5432

### Database Connection

From local machine:
```
psql -h localhost -U postgres -d event_kiosk
```

Connection string format:
```
postgresql://postgres:postgres@localhost:5432/event_kiosk
```

Default credentials:
- **Username**: postgres
- **Password**: postgres
- **Database**: event_kiosk
- **Port**: 5432

### Seed Admin User

Admin user is automatically created on first start:
- **Email**: admin@gmail.com
- **Password**: admin

To reset:
```bash
docker compose exec -it backend python -c "
from app.database import engine, SessionLocal
from app.models import Base, User
import bcrypt

# Drop and recreate tables
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

# Create admin user
db = SessionLocal()
admin = User(
    email='admin@example.com',
    full_name='Admin User',
    password_hash=bcrypt.hashpw(b'admin123', bcrypt.gensalt()).decode()
)
db.add(admin)
db.commit()
db.close()
print('Admin user created')
"
```

### View Logs

**All Services:**
```bash
docker compose logs -f
```

**Specific Service:**
```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx
docker compose logs -f db
```

**Real-time Backend Logs:**
```bash
docker compose logs -f backend | grep "\[BACKGROUND JOB\]\|\[SCHEDULER\]\|\[ERROR\]"
```

### Stop Services

```bash
# Stop all containers (keep images and volumes)
docker compose stop

# Stop and remove containers
docker compose down

# Stop, remove containers, and delete volumes (database will be erased!)
docker compose down -v
```

## Production Deployment

### 1. Server Setup

Assuming Ubuntu 22.04 LTS:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker compose --version
```

### 2. Deploy Application

```bash
# Clone repository
cd /opt
sudo git clone <repository-url> project1
cd project1

# Create environment file with production values
sudo nano .env
# Fill with production credentials
```

### 3. SSL/TLS Configuration

For production, the nginx reverse proxy in docker-compose.yml handles routing.
To add HTTPS, modify nginx.conf:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Frontend - root path
    location / {
        proxy_pass http://frontend:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Webhooks
    location /webhooks/ {
        proxy_pass http://backend:8000/webhooks/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### 4. Database Backup

**Automatic Backup:**

```bash
#!/bin/bash
# backup_db.sh

BACKUP_DIR="/backups/event-kiosk"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/event_kiosk_$TIMESTAMP.sql.gz"

mkdir -p $BACKUP_DIR

docker compose exec -T db pg_dump \
  -U postgres \
  -d event_kiosk | gzip > $BACKUP_FILE

# Keep only last 7 backups
find $BACKUP_DIR -name "event_kiosk_*.sql.gz" -mtime +7 -delete

echo "Backup created: $BACKUP_FILE"
```

Schedule with crontab:
```bash
# Daily backup at 2 AM
0 2 * * * /opt/project1/backup_db.sh
```

**Restore Backup:**

```bash
# List available backups
ls -la /backups/event-kiosk/

# Restore from backup
gunzip -c /backups/event-kiosk/event_kiosk_20260410_140000.sql.gz | \
docker compose exec -T db psql -U postgres -d event_kiosk
```

### 5. Health Monitoring

**Status Check Endpoint:**

```bash
# Backend health (via nginx)
curl http://localhost/api/docs

# Frontend accessible (via nginx)
curl -I http://localhost

# Database connection
docker compose exec db pg_isready -U postgres
```

**Monitoring with systemd:**

Create `/etc/systemd/system/docker-compose-project1.service`:

```ini
[Unit]
Description=Event Kiosk Docker Compose
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
WorkingDirectory=/opt/project1
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable docker-compose-project1.service
sudo systemctl start docker-compose-project1.service
```

### 6. Log Rotation

Create `/etc/logrotate.d/docker-compose-project1`:

```
/var/lib/docker/containers/*/*.log {
    max-age  7
    rotate   5
    size     10M
    compress
    delaycompress
    copytruncate
}
```

### 7. Scaling Considerations

**Multiple Backend Instances:**

Modify `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      replicas: 3  # Run 3 backend instances
```

Load balance with nginx.

**Database Connection Pooling:**

In production backend code, increase connection pool:

```python
# In database.py
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=40,
    pool_pre_ping=True
)
```

## Kubernetes Deployment

For large-scale deployments, use Kubernetes:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: event-kiosk-config
data:
  DATABASE_URL: "postgresql://kiosk_user:password@postgres:5432/event_kiosk"
  XIQ_USERNAME: "your_username"
  XIQ_PASSWORD: "your_password"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: project1-backend:latest
        envFrom:
        - configMapRef:
            name: event-kiosk-config
        ports:
        - containerPort: 8000
        livenessProbe:
          httpGet:
            path: /docs
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
```

## Troubleshooting

### Port Already in Use

```bash
# Find what's using the port
sudo lsof -i :8000

# Kill the process
sudo kill -9 <PID>

# Or change port in docker-compose.yml
```

### Database Connection Error

```bash
# Check PostgreSQL is healthy
docker compose ps postgres

# Check logs
docker compose logs postgres

# Test connection
docker compose exec postgres psql -U kiosk_user -d event_kiosk -c "SELECT 1"
```

### Backend Not Starting

```bash
# Check logs
docker compose logs backend

# Rebuild image
docker compose down
docker rmi project1-backend --force
docker compose up -d --build

# Check for permission issues
docker compose exec backend ls -la
```

### Frontend Cannot Connect to Backend

```bash
# Check backend is running
curl http://localhost:8000/docs

# Check CORS configuration if needed
# Verify BACKEND_URL in frontend environment

# Check network connectivity
docker compose exec frontend curl http://backend:8000/docs
```

## Security Checklist

- [ ] Change default admin password
- [ ] Set strong JWT secret
- [ ] Use HTTPS in production
- [ ] Enable firewall (ufw on Ubuntu)
- [ ] Restrict database access to backend only
- [ ] Regular security updates: `docker pull`, `apt upgrade`
- [ ] Backup database regularly
- [ ] Monitor logs for suspicious activity
- [ ] Use secrets management (Vault, AWS Secrets Manager)
- [ ] Enable audit logging
- [ ] Rate limiting on API endpoints
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (using ORM)
- [ ] XSS prevention (React/Vue escape by default)
- [ ] CSRF protection tokens

## Maintenance

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose down
docker compose up -d --build

# Run migrations if needed
docker compose exec backend alembic upgrade head
```

### Monitor Performance

```bash
# Container resource usage
docker stats

# Database size
docker compose exec postgres \
  psql -U kiosk_user -d event_kiosk \
  -c "SELECT pg_size_pretty(pg_database_size('event_kiosk'))"

# Slow queries (if enabled)
docker compose exec postgres \
  psql -U kiosk_user -d event_kiosk \
  -c "SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10"
```

## Support & Documentation

- API Documentation: http://yourdomain.com/docs
- Backend README: See BACKENDENDME.md
- Background Jobs: See BACKGROUND_JOBS.md
- API Reference: See API_REFERENCE.md
- Webhook Setup: See WEBHOOK_SETUP.md
