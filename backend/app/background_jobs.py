import os
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from . import models
from .database import SessionLocal
from .extremeCloudIQAPI import ExtremeCloudIQAPI


def schedule_event_cleanup(scheduler, event_id: int, end_datetime: datetime):
    """
    Schedule cleanup for a specific event at its end time.
    
    Args:
        scheduler: APScheduler scheduler instance
        event_id: ID of the event to clean up
        end_datetime: DateTime when the event ends
    """
    job_id = f"cleanup_event_{event_id}"
    
    try:
        # Remove existing job if it exists
        try:
            scheduler.remove_job(job_id)
        except:
            pass
        
        # Schedule cleanup to run at the event's end time
        def cleanup_job():
            db = SessionLocal()
            try:
                cleanup_expired_events_manual(db, event_id)
            finally:
                db.close()
        
        scheduler.add_job(
            cleanup_job,
            'date',
            run_date=end_datetime,
            id=job_id,
            name=f'Cleanup event {event_id}',
            replace_existing=True
        )
        
        print(f"[SCHEDULER] Scheduled cleanup for event {event_id} at {end_datetime}")
        return True
    except Exception as e:
        print(f"[SCHEDULER] Failed to schedule cleanup for event {event_id}: {str(e)}")
        return False


def unschedule_event_cleanup(scheduler, event_id: int):
    """
    Remove scheduled cleanup for a specific event.
    
    Args:
        scheduler: APScheduler scheduler instance
        event_id: ID of the event
    """
    job_id = f"cleanup_event_{event_id}"
    
    try:
        scheduler.remove_job(job_id)
        print(f"[SCHEDULER] Removed cleanup schedule for event {event_id}")
        return True
    except:
        return False


def cleanup_expired_events(db: Session):
    """
    Background job to clean up guests and user groups from extremeCloudIQ
    for events that have ended.
    
    This function:
    1. Finds all events where end_date has passed
    2. Deletes all guests from extremeCloudIQ for those events
    3. Deletes the user group from extremeCloudIQ
    4. Clears the usergroup_id from the database
    """
    print("[BACKGROUND JOB] Starting cleanup of expired events")
    
    xiq_username = os.getenv("XIQ_USERNAME")
    xiq_password = os.getenv("XIQ_PASSWORD")
    ssid_id = os.getenv("XIQ_SSID_ID")
    ssid_name = os.getenv("XIQ_SSID_NAME")

    if not xiq_username or not xiq_password:
        print("[BACKGROUND JOB] ExtremeCloudIQ credentials not configured, skipping cleanup")
        return
    
    try:
        # Find all events that have ended
        current_time = datetime.now(timezone.utc)
        expired_events = db.query(models.Event).filter(
            models.Event.end_date <= current_time
        ).all()
        
        if not expired_events:
            print("[BACKGROUND JOB] No expired events found")
            return
        
        print(f"[BACKGROUND JOB] Found {len(expired_events)} expired events to clean up")
        
        api = ExtremeCloudIQAPI(xiq_username, xiq_password)
        api.login()
        
        if not api.access_token:
            print("[BACKGROUND JOB] Failed to authenticate with ExtremeCloudIQ")
            return
        
        # If SSID ID is not set, try to get it by name
        if not ssid_id and ssid_name:
            ssid_id = api.get_ssid_id_by_name(ssid_name)
        
        # Process each expired event
        for event in expired_events:
            print(f"[BACKGROUND JOB] Processing expired event: {event.name} (ID: {event.id})")
            
            # Get all guests for this event
            guests = db.query(models.Guest).filter(
                models.Guest.event_id == event.id
            ).all()
            
            print(f"[BACKGROUND JOB] Found {len(guests)} guests for event {event.name}")
            
            # Delete each guest from extremeCloudIQ
            deleted_count = 0
            failed_count = 0
            
            for guest in guests:
                if guest.xiq_end_user_id:
                    if api.delete_end_user(guest.xiq_end_user_id):
                        deleted_count += 1
                    else:
                        failed_count += 1
            
            print(f"[BACKGROUND JOB] Deleted {deleted_count} guests from extremeCloudIQ for event {event.name}")
            if failed_count > 0:
                print(f"[BACKGROUND JOB] Failed to delete {failed_count} guests for event {event.name}")
            
            # Remove the user group from the SSID if it exists
            if event.usergroup_id and ssid_id:
                current_group_ids = api.get_ssid_user_group_ids(ssid_id)
                if current_group_ids and event.usergroup_id in current_group_ids:
                    updated_group_ids = [gid for gid in current_group_ids if gid != event.usergroup_id]
                    if api.configure_ppsk_mode(ssid_id, updated_group_ids):
                        print(f"[BACKGROUND JOB] Removed user group {event.usergroup_id} from SSID")
                    else:
                        print(f"[BACKGROUND JOB] Failed to remove user group {event.usergroup_id} from SSID")
            
            # Delete the user group from extremeCloudIQ if it exists
            if event.usergroup_id:
                if api.delete_user_group(event.usergroup_id):
                    print(f"[BACKGROUND JOB] Deleted user group {event.usergroup_id} for event {event.name}")
                else:
                    print(f"[BACKGROUND JOB] Failed to delete user group {event.usergroup_id} for event {event.name}")
                
                # Clear the usergroup_id from the database
                event.usergroup_id = None
        
        api.logout()
        db.commit()
        
        print("[BACKGROUND JOB] Completed cleanup of expired events")
        
    except Exception as e:
        print(f"[BACKGROUND JOB] Error during cleanup: {str(e)}")
        db.rollback()


def cleanup_expired_events_manual(db: Session, event_id: int = None):
    """
    Manual trigger for event cleanup. Can clean up all expired events
    or a specific event.
    
    Args:
        db: Database session
        event_id: Optional event ID to clean up only that event
    """
    print(f"[BACKGROUND JOB] Manual cleanup triggered for event_id={event_id}")
    
    xiq_username = os.getenv("XIQ_USERNAME")
    xiq_password = os.getenv("XIQ_PASSWORD")
    ssid_id = os.getenv("XIQ_SSID_ID")
    ssid_name = os.getenv("XIQ_SSID_NAME")
    
    if not xiq_username or not xiq_password:
        print("[BACKGROUND JOB] ExtremeCloudIQ credentials not configured")
        return False
    
    try:
        # Get events to clean up
        if event_id:
            events = db.query(models.Event).filter(models.Event.id == event_id).all()
        else:
            current_time = datetime.now(timezone.utc)
            events = db.query(models.Event).filter(
                models.Event.end_date <= current_time
            ).all()
        
        if not events:
            print("[BACKGROUND JOB] No events found for cleanup")
            return False
        
        api = ExtremeCloudIQAPI(xiq_username, xiq_password)
        api.login()
        
        if not api.access_token:
            print("[BACKGROUND JOB] Failed to authenticate with ExtremeCloudIQ")
            return False
        
        # If SSID ID is not set, try to get it by name
        if not ssid_id and ssid_name:
            ssid_id = api.get_ssid_id_by_name(ssid_name)
        
        # Process each event
        for event in events:
            print(f"[BACKGROUND JOB] Manually cleaning up event: {event.name} (ID: {event.id})")
            
            # Get all guests for this event
            guests = db.query(models.Guest).filter(
                models.Guest.event_id == event.id
            ).all()
            
            # Delete each guest from extremeCloudIQ
            for guest in guests:
                if guest.xiq_end_user_id:
                    api.delete_end_user(guest.xiq_end_user_id)
            
            # Remove the user group from the SSID if it exists
            if event.usergroup_id and ssid_id:
                current_group_ids = api.get_ssid_user_group_ids(ssid_id)
                if current_group_ids and event.usergroup_id in current_group_ids:
                    updated_group_ids = [gid for gid in current_group_ids if gid != event.usergroup_id]
                    if api.configure_ppsk_mode(ssid_id, updated_group_ids):
                        print(f"[BACKGROUND JOB] Removed user group {event.usergroup_id} from SSID")
                    else:
                        print(f"[BACKGROUND JOB] Failed to remove user group {event.usergroup_id} from SSID")
            
            # Delete the user group from extremeCloudIQ if it exists
            if event.usergroup_id:
                if api.delete_user_group(event.usergroup_id):
                    print(f"[BACKGROUND JOB] Deleted user group {event.usergroup_id}")
                else:
                    print(f"[BACKGROUND JOB] Failed to delete user group {event.usergroup_id}")
                
                event.usergroup_id = None
        
        api.logout()
        db.commit()
        
        print(f"[BACKGROUND JOB] Manual cleanup completed for {len(events)} event(s)")
        return True
        
    except Exception as e:
        print(f"[BACKGROUND JOB] Error during manual cleanup: {str(e)}")
        db.rollback()
        return False
        db.rollback()
        return False
