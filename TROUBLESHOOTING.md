# Troubleshooting Guide

## General Issues

### Docker Containers Won't Start

**Symptom:** `docker compose up` fails or containers exit immediately

**Solutions:**

```bash
# 1. Check detailed error logs
docker compose logs --tail=50

# 2. Check individual service
docker compose logs -f backend

# 3. Verify .env file exists and is valid
cat .env

# 4. Clean rebuild (removes cached layers)
docker compose down
docker system prune -af
docker compose up -d --build

# 5. Check disk space
df -h

# 6. Check port availability
netstat -tulpn | grep LISTEN
```

### Port Already in Use

**Symptom:** Error like `Address already in use`

```bash
# Find which process is using the port
sudo lsof -i :8000
sudo lsof -i :5432
sudo lsof -i :5173

# Option 1: Stop that process
sudo kill -9 <PID>

# Option 2: Change port in docker-compose.yml
# Change "8000:8000" to "9000:8000" for example
```

### Out of Memory

**Symptom:** Containers OOM killed, system sluggish

```bash
# Check resource usage
docker stats

# Check available memory
free -h

# Increase Docker memory limit
# Edit Docker Desktop settings or:
# Edit /etc/docker/daemon.json
{
  "memory": "2gb"
}
```

## Database Issues

### PostgreSQL Connection Failed

**Symptom:** `ERROR: could not connect to database server`

```bash
# 1. Check if PostgreSQL container is running
docker compose ps postgres

# 2. Check logs
docker compose logs postgres

# 3. Verify credentials in .env
grep POSTGRES_ .env

# 4. Test connection from host
psql -h localhost -U kiosk_user -d event_kiosk -c "SELECT 1"

# 5. Test from backend container
docker compose exec backend python -c "
from app.database import engine
with engine.connect() as conn:
    print('Database connected successfully')
"
```

### Database Type Mismatch Error

**Symptom:** `psycopg2.errors.DatatypeMismatch: column is of type integer but expression is of type boolean`

**Solution:** This was already fixed. If it reappears:

```bash
# 1. Connect to database
docker compose exec postgres psql -U kiosk_user -d event_kiosk

# 2. Check column types
\d guests;
\d webhook_subscriptions;

# 3. If types are wrong, fix them
ALTER TABLE guests ALTER COLUMN is_connected TYPE boolean USING (is_connected::boolean);
ALTER TABLE webhook_subscriptions ALTER COLUMN is_active TYPE boolean USING (is_active::boolean);

# 4. Restart backend
docker compose restart backend
```

### Database Locked

**Symptom:** `ERROR: database is locked`

```bash
# 1. Check for long-running queries
docker compose exec postgres psql -U kiosk_user -d event_kiosk \
  -c "SELECT pid, usename, query FROM pg_stat_activity WHERE state = 'active'"

# 2. Kill specific query
SELECT pg_terminate_backend(<PID>);

# 3. Or restart PostgreSQL
docker compose restart postgres
```

### Foreign Key Constraint Violation

**Symptom:** `violates foreign key constraint` when deleting

**Example error:**
```
violates foreign key constraint "guests_event_id_fkey" on table "guests"
```

**Solution:**

```bash
# Option 1: Delete related records first
# When deleting event, first delete all guests:
DELETE FROM guests WHERE event_id = <event_id>;
DELETE FROM events WHERE id = <event_id>;

# Option 2: Use API endpoint (recommended)
# DELETE /events/{event_id} automatically deletes guests

# Option 3: Check foreign key constraints
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'guests' 
AND constraint_type = 'FOREIGN KEY';
```

### Disk Space for Database

**Symptom:** Database keeps growing, slow queries

```bash
# Check database size
docker compose exec postgres psql -U kiosk_user -d event_kiosk \
  -c "SELECT pg_size_pretty(pg_database_size('event_kiosk'))"

# Check table sizes
docker compose exec postgres psql -U kiosk_user -d event_kiosk \
  -c "
    SELECT 
      schemaname, 
      tablename, 
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
    FROM pg_tables 
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
  "

# Clean up old events
DELETE FROM events WHERE end_date < NOW() - INTERVAL '90 days' AND usergroup_id IS NULL;

# Run VACUUM to reclaim space
VACUUM ANALYZE;
```

## Backend API Issues

### Backend Won't Start

**Symptom:** Backend container exits immediately

```bash
# 1. Check logs
docker compose logs -f backend

# 2. Common issues:
# - Missing environment variables
# - Import errors
# - Database not ready

# 3. Check env file
echo $DATABASE_URL

# 4. Try manual import
docker compose exec backend python -c "
from app import models
from app import main
print('Imports successful')
"

# 5. Rebuild without cache
docker compose build --no-cache backend
docker compose up -d backend
```

### API Returns 500 Error

**Symptom:** `Internal server error` when calling endpoints

```bash
# 1. Check backend logs
docker compose logs -f backend | grep ERROR

# 2. Check specific endpoint
curl -v http://localhost:8000/events

# 3. Check database connectivity
docker compose exec backend python -c "
from app.database import SessionLocal
db = SessionLocal()
db.execute('SELECT 1')
db.close()
print('Database OK')
"

# 4. Check XIQ connectivity
docker compose exec backend python -c "
from app.extremeCloudIQAPI import ExtremeCloudIQAPI
import os
try:
    api = ExtremeCloudIQAPI(os.getenv('XIQ_USERNAME'), os.getenv('XIQ_PASSWORD'))
    print('XIQ connection OK')
except Exception as e:
    print(f'XIQ error: {e}')
"
```

### Authentication Token Invalid

**Symptom:** 401 Unauthorized errors

```bash
# 1. Get new token
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'

# 2. Use token in requests
curl -H "Authorization: Bearer <token>" http://localhost:8000/events

# 3. Check token expiration in .env
grep JWT_EXPIRATION .env
# Default is 24 hours

# 4. If token problems persist, check time sync
date
docker compose exec backend date

# 5. Regenerate JWT secret (invalidates all tokens)
# Edit .env and change JWT_SECRET_KEY
# All users must login again
```

### CORS Error in Frontend

**Symptom:** `Access to XMLHttpRequest blocked by CORS policy`

```bash
# 1. Check backend CORS config
docker compose exec backend grep -n "CORSMiddleware" app/main.py

# 2. Verify frontend URL in CORS
# Should match: http://localhost:5173 in development

# 3. In docker-compose.yml, check service names match API calls

# 4. Manual test
curl -H "Origin: http://localhost:5173" http://localhost:8000/events -v
# Look for Access-Control-Allow-Origin header

# 5. If CORS still fails
# Check backend logs for detailed CORS rejection reasons
docker compose logs backend | grep -i cors
```

### Slow API Responses

**Symptom:** API calls take > 1 second

```bash
# 1. Check database performance
docker compose exec postgres psql -c "
  SELECT 
    query, 
    mean_exec_time, 
    calls 
  FROM pg_stat_statements 
  ORDER BY mean_exec_time DESC 
  LIMIT 10
"

# 2. Check slow query log
docker compose exec backend grep "SLOW QUERY" logs.txt

# 3. Monitor while running
docker stats

# 4. Check network latency to XIQ
docker compose exec backend ping api.extremecloudiq.com

# 5. Increase database pool size for production
# Edit database.py: pool_size=20, max_overflow=40
```

## Frontend Issues

### Frontend Won't Load

**Symptom:** Blank page or 404 on http://localhost:5173

```bash
# 1. Check container running
docker compose ps frontend

# 2. Check logs
docker compose logs -f frontend

# 3. Check port
docker compose exec frontend ss -tlnp

# 4. Test from container
docker compose exec frontend curl http://localhost:5173

# 5. Rebuild frontend
docker compose build --no-cache frontend
docker compose up -d frontend
```

### Cannot Connect to Backend

**Symptom:** API calls fail with connection error

```bash
# 1. Check backend is running
docker compose ps backend

# 2. Test from frontend container
docker compose exec frontend curl http://backend:8000/docs

# 3. Check network connectivity
docker compose exec frontend ping backend

# 4. Check VITE_API_URL
docker compose exec frontend env | grep VITE

# 5. Check frontend env file
cat frontend/.env || echo "No .env file"

# 6. Check vite config
cat frontend/vite.config.js | grep proxy
```

### Styles Not Loading

**Symptom:** Page loads but no CSS styling

```bash
# 1. Check build output
docker compose logs frontend | grep CSS

# 2. Verify CSS imports in jsx
docker compose exec frontend grep -r "import.*css" src/

# 3. Check CSS file exists
docker compose exec frontend ls -la app/

# 4. Check Vite bundling
docker compose build --no-cache frontend
```

### Components Not Rendering

**Symptom:** React components blank or showing errors

```bash
# 1. Check browser console for JS errors
# Open http://localhost:5173 and press F12

# 2. Check frontend logs
docker compose logs frontend

# 3. Check component imports
docker compose exec frontend grep -l "export default" app/components/*.jsx

# 4. Test one component
docker compose logs -f frontend | grep React

# 5. Rebuild and clear cache
docker compose exec frontend rm -rf node_modules/.vite
docker compose restart frontend
```

## ExtremeCloudIQ Integration Issues

### Cannot Authenticate with XIQ

**Symptom:** `Authentication failed` errors in logs

```bash
# 1. Check credentials
grep XIQ .env

# 2. Test XIQ API manually
docker compose exec backend python -c "
import os
from app.extremeCloudIQAPI import ExtremeCloudIQAPI

try:
    api = ExtremeCloudIQAPI(
        os.getenv('XIQ_USERNAME'),
        os.getenv('XIQ_PASSWORD')
    )
    # If no error, auth works
    print('XIQ authentication successful')
except Exception as e:
    print(f'Error: {e}')
"

# 3. Check network connectivity to XIQ
docker compose exec backend ping api.extremecloudiq.com

# 4. Check firewall rules
sudo ufw status

# 5. Try with explicit XIQ host
# Edit .env: XIQ_HOST=api.extremecloudiq.com
```

### Cannot Get SSID

**Symptom:** `SSID not found` or `Get SSID failed` errors

```bash
# 1. Check SSID configuration
grep XIQ_SSID .env

# 2. Using SSID name (slower)
# Verify exact name matches in XIQ

# 3. Using SSID ID (recommended)
# Get ID from XIQ dashboard
# Put in .env: XIQ_SSID_ID=123456789

# 4. Test retrieval
docker compose exec backend python -c "
import os
from app.extremeCloudIQAPI import ExtremeCloudIQAPI

api = ExtremeCloudIQAPI(...)
ssid = api.get_ssid(os.getenv('XIQ_SSID_ID') or os.getenv('XIQ_SSID_NAME'))
print(f'SSID: {ssid}')
"

# 5. Check XIQ API availability
docker compose exec backend curl https://api.extremecloudiq.com/healthcheck
```

### Guest Creation Fails

**Symptom:** `Create end user failed` errors

```bash
# 1. Check XIQ limit not reached
# ExtremeCloudIQ has user creation limits

# 2. Verify guest data
# Requirements: email, first_name, last_name

# 3. Test manual creation
curl -X POST http://localhost:8000/events/1/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "phone": "1234567890"
  }'

# 4. Check backend logs
docker compose logs -f backend | grep "Create end user"

# 5. Check email is unique in XIQ
# Duplicate emails will fail
```

### Cleanup Jobs Not Running

**Symptom:** Events not cleaned up at scheduled time

```bash
# 1. Check scheduler status
docker compose logs -f backend | grep SCHEDULER

# 2. Check job was scheduled
docker compose logs backend | grep "Scheduled cleanup"

# 3. Check job executed
docker compose logs backend | grep "BACKGROUND JOB"

# 4. Check event end_date
curl http://localhost:8000/events \
  -H "Authorization: Bearer <token>" | grep end_date

# 5. Manually trigger cleanup
curl -X POST http://localhost:8000/events/1/cleanup \
  -H "Authorization: Bearer <token>"

# 6. Check system time
date

# 7. Backend must still be running at end_date time
# Jobs don't persist if backend restarts
```

## Webhook Issues

### Webhook Not Receiving Events

**Symptom:** No calls to your webhook URL

```bash
# 1. Check webhook registered
curl http://localhost:8000/events/1/webhooks \
  -H "Authorization: Bearer <token>"

# 2. Check webhook logs
docker compose logs backend | grep webhook

# 3. Test webhook endpoint manually
curl -X POST https://your-webhook-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer secret_token_123" \
  -d '{
    "event_id": 1,
    "guest_id": 1,
    "status": "guest_login"
  }'

# 4. Check webhook auth token
# Matches what was registered?

# 5. Monitor webhook retries
docker compose logs backend | grep "Webhook.*retry"

# 6. Check network connectivity
docker compose exec backend curl -v https://your-webhook-url
```

## Performance Issues

### High CPU Usage

**Symptom:** 100% CPU even with few users

```bash
# 1. Find culprit
docker stats

# 2. Check running processes
docker compose exec backend ps aux

# 3. Look for infinite loops or busy-wait
docker compose logs -f backend

# 4. Monitor XIQ API calls
# XIQ API is slow, polling causes CPU spike

# 5. Check database slow queries
docker compose exec postgres \
  psql -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 5"

# 6. Reduce background job frequency
# Edit background_jobs.py check interval
```

### High Memory Usage

**Symptom:** `docker stats` shows memory > 1GB

```bash
# 1. Check memory leaks
docker compose exec backend python -m tracemalloc

# 2. Check for memory accumulation in logs
# Especially webhook retries and XIQ calls

# 3. Restart service to free memory
docker compose restart backend

# 4. Set memory limits in docker-compose.yml
services:
  backend:
    mem_limit: 512m

# 5. Check database connection pool
# pool_size too large?
```

### Slow Database Queries

```bash
# 1. Enable slow query log (if not already)
docker compose exec postgres psql -U kiosk_user -d event_kiosk \
  -c "ALTER SYSTEM SET log_min_duration_statement = 100"

# 2. Reload config
docker compose exec postgres psql -U kiosk_user \
  -c "SELECT pg_reload_conf()"

# 3. Run slow queries
docker compose logs postgres | grep "duration:"

# 4. Analyze query plan
EXPLAIN ANALYZE SELECT * FROM guests WHERE event_id = 1;

# 5. Add indexes if needed
CREATE INDEX idx_guests_event_id ON guests(event_id);
```

## Advanced Debugging

### Enable Debug Logging

```bash
# 1. Check current log level
docker compose exec backend grep -i "log" app/main.py

# 2. Add debug logging
# Edit app/main.py
import logging
logging.basicConfig(level=logging.DEBUG)

# 3. Rebuild and test
docker compose build backend
docker compose up -d backend
docker compose logs -f backend | grep DEBUG
```

### Database Inspection

```bash
# List all tables
docker compose exec postgres psql -U kiosk_user -d event_kiosk \
  -c "\dt"

# Check table structure
docker compose exec postgres psql -U kiosk_user -d event_kiosk \
  -c "\d events"

# Export data for analysis
docker compose exec postgres pg_dump -U kiosk_user -d event_kiosk > backup.sql
```

### Container Introspection

```bash
# Enter container shell
docker compose exec backend /bin/bash

# Inside container, check:
# - Environment variables: env
# - Network: netstat -tlnp
# - Files: ls -la
# - Python path: python -c "import sys; print(sys.path)"
```

## Still Having Issues?

1. **Check logs carefully**: Most errors are in logs
2. **Verify environment**: All variables set correctly?
3. **Test components individually**: Database OK? XIQ OK? Frontend OK?
4. **Check documentation**: See README.md, DEPLOYMENT.md, API_REFERENCE.md
5. **Recreate containers**: Sometimes helps with weird issues
6. **Clear cache**: Docker system prune -af (be careful!)
7. **Update all services**: docker pull all images
8. **Check for conflicts**: Running old version in another terminal?

## Getting Help

Provide these when reporting issues:

1. Error message (exact, from logs)
2. Docker compose logs: `docker compose logs --tail=50 2>&1`
3. System info: `docker info`, `docker  --version`
4. Environment: What values in .env?
5. Steps to reproduce: How do I recreate the issue?
6. Expected vs. actual behavior
