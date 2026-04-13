# Background Jobs & Event Cleanup

## Overview

The Event Kiosk application uses APScheduler to automatically clean up expired events and their associated ExtremeCloudIQ resources.

## How It Works

### Automatic Cleanup (Event-Driven)

When you create or update an event, the system automatically schedules a cleanup job:

1. **Event Created/Updated**: A cleanup job is scheduled for the exact `end_date` time
2. **Event Ends**: At the scheduled time, the background job executes
3. **Cleanup Process**:
   - Delete all guests from ExtremeCloudIQ
   - Remove user group from SSID PPSK configuration
   - Delete user group from ExtremeCloudIQ
   - Clear `usergroup_id` from the database

### Job Scheduling

- **Trigger Type**: `date` (one-time at specific datetime)
- **Job ID Format**: `cleanup_event_{event_id}`
- **Execution**: Runs at exact event `end_date` time (UTC)

### Scheduler Lifecycle

- **Startup**: Scheduler initialized when backend starts
- **Shutdown**: Scheduler gracefully stops when backend stops
- **In-Memory**: Jobs stored in memory (not persisted to database)

## Manual Cleanup

If you need to manually trigger cleanup:

### Clean Specific Event

```bash
curl -X POST http://localhost:8000/events/{event_id}/cleanup \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

Response:
```json
{
  "message": "Cleanup completed for event Event Name",
  "event_id": 1
}
```

### Clean All Expired Events

```bash
curl -X POST http://localhost:8000/events/cleanup/all \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

Response:
```json
{
  "message": "Cleanup of all expired events completed successfully"
}
```

## Cleanup Process Details

### Step 1: Delete Guests from XIQ
- Queries all guests for the event
- Calls `delete_end_user()` for each guest via XIQ API
- Logs success/failure for each deletion

### Step 2: Remove User Group from SSID
- Retrieves current SSID's user group list
- Removes event's user group from the list
- Updates SSID PPSK mode with new list via `configure_ppsk_mode()`

**Why this step?** 
- The user group must be removed from SSID before deletion
- SSID cannot reference non-existent groups

### Step 3: Delete User Group from XIQ
- Calls `delete_user_group()` via XIQ API
- User group is completely removed from ExtremeCloudIQ

### Step 4: Update Database
- Sets `event.usergroup_id = None`
- Commits transaction

## Event Lifecycle Example

```
1. POST /events → Event created with end_date = "2026-04-13 18:00:00 UTC"
   ↓
2. Cleanup job scheduled for 2026-04-13 18:00:00 UTC
   ↓
3. Clock reaches 18:00:00 UTC
   ↓
4. Cleanup job automatically executes:
   - Deletes guests from XIQ
   - Removes group from SSID
   - Deletes user group
   - Updates database
   ↓
5. Event marked as cleaned (usergroup_id = NULL)
```

## Logs

Background job activity is logged with `[BACKGROUND JOB]` prefix:

```
[SCHEDULER] Scheduled cleanup for event 1 at 2026-04-13 18:00:00+00:00
[BACKGROUND JOB] Manual cleanup triggered for event_id=1
[BACKGROUND JOB] Manually cleaning up event: Conference (ID: 1)
[BACKGROUND JOB] Found 45 guests for event Conference
[BACKGROUND JOB] Deleted 45 guests from extremeCloudIQ for event Conference
[BACKGROUND JOB] Removed user group 123456 from SSID
[BACKGROUND JOB] Deleted user group 123456
[BACKGROUND JOB] Manual cleanup completed for 1 event(s)
```

## Configuration

No additional configuration needed. The scheduler uses:

- **ProcessPoolExecutor**: Default thread pool for executing jobs
- **Store**: Memory-only (non-persistent)
- **Coalescing**: Enabled (missed jobs execute once on recovery)

### Environment Variables

Optional (built into system):
- `XIQ_USERNAME` - For cleanup operations
- `XIQ_PASSWORD` - For cleanup operations
- `XIQ_SSID_ID` or `XIQ_SSID_NAME` - To identify which SSID to update

## Error Handling

The cleanup process includes error handling:

- **Failed XIQ Authentication**: Logs error and stops
- **Failed Guest Deletion**: Logs but continues with remaining guests
- **Failed SSID Update**: Logs error but continues to delete group
- **Failed Group Deletion**: Logs error
- **Database Errors**: Rolls back transaction

All errors are logged for debugging.

## Performance

- **Per-Event**: ~1 second per 10-20 guests (XIQ API calls)
- **Concurrency**: Supports multiple simultaneous job executions
- **Memory**: Minimal (in-memory scheduler)

## Troubleshooting

### Cleanup Not Executing

1. Check backend logs for `[SCHEDULER]` messages
2. Verify event `end_date` is in the future/reached
3. Confirm backend is running continuously

### Failed Cleanup

1. Check logs for `[BACKGROUND JOB] Error` messages
2. Verify XIQ credentials are correct
3. Verify XIQ SSID ID exists
4. Check XIQ API connectivity

### Immediate Cleanup

If you need cleanup now (don't want to wait):

```bash
curl -X POST http://localhost:8000/events/{event_id}/cleanup \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

## Future Enhancements

Possible improvements:
- Database persistence for job scheduling (survive restarts)
- Time-zone aware scheduling
- Configurable cleanup behavior (keep group, partial cleanup, etc.)
- Automatic cleanup retries on failure
