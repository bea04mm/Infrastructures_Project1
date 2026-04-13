import os
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from jose import JWTError, jwt
from passlib.hash import pbkdf2_sha256
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler

from .database import Base, engine, SessionLocal
from . import models
from .extremeCloudIQAPI import ExtremeCloudIQAPI
from .background_jobs import cleanup_expired_events, schedule_event_cleanup, unschedule_event_cleanup

app = FastAPI(title="Event Kiosk API")

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
ADMIN_EMAIL = "admin@gmail.com"
ADMIN_PASSWORD = "admin"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def ensure_user_schema():
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("users")}
    if "password_hash" not in columns:
        with engine.begin() as connection:
            connection.execute(
                text(
                    "ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT ''"
                )
            )


Base.metadata.create_all(bind=engine)
ensure_user_schema()


def ensure_events_schema():
    inspector = inspect(engine)
    if "events" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("events")}
    if "usergroup_id" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE events ADD COLUMN usergroup_id BIGINT"))


ensure_events_schema()


def ensure_guests_schema():
    inspector = inspect(engine)
    if "guests" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("guests")}
    if "xiq_end_user_id" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE guests ADD COLUMN xiq_end_user_id BIGINT"))
    
    if "is_connected" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE guests ADD COLUMN is_connected INTEGER NOT NULL DEFAULT 0"))
    
    if "last_activity_at" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE guests ADD COLUMN last_activity_at TIMESTAMP"))


ensure_guests_schema()


def ensure_webhook_subscriptions_schema():
    inspector = inspect(engine)
    if "webhook_subscriptions" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("webhook_subscriptions")}
    # All columns are created initially, nothing to migrate


ensure_webhook_subscriptions_schema()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def sync_event_usergroup_to_ssid(event_name: str):
    xiq_username = os.getenv("XIQ_USERNAME")
    xiq_password = os.getenv("XIQ_PASSWORD")
    ssid_id = os.getenv("XIQ_SSID_ID")
    ssid_name = os.getenv("XIQ_SSID_NAME")

    if not xiq_username or not xiq_password:
        raise HTTPException(
            status_code=500,
            detail="ExtremeCloudIQ credentials are not configured (XIQ_USERNAME/XIQ_PASSWORD).",
        )

    api = ExtremeCloudIQAPI(xiq_username, xiq_password)
    api.login()
    if not api.access_token:
        raise HTTPException(status_code=502, detail="Failed to authenticate with ExtremeCloudIQ.")

    if not ssid_id:
        if not ssid_name:
            raise HTTPException(
                status_code=500,
                detail="Configure XIQ_SSID_ID or XIQ_SSID_NAME to map event groups to SSID.",
            )
        ssid_id = api.get_ssid_id_by_name(ssid_name)

    if not ssid_id:
        raise HTTPException(status_code=404, detail="Configured SSID not found in ExtremeCloudIQ.")

    group_id = api.get_user_group_id_by_name(event_name)
    if not group_id:
        group_id = api.create_user_group(event_name, f"User group for event {event_name}")
    if not group_id:
        raise HTTPException(status_code=502, detail="Failed to create ExtremeCloudIQ user group.")

    existing_group_ids = api.get_ssid_user_group_ids(ssid_id)
    if existing_group_ids is None:
        raise HTTPException(status_code=502, detail="Failed to read current SSID user groups.")

    all_group_ids = list(dict.fromkeys(existing_group_ids + [group_id]))
    success = api.configure_ppsk_mode(ssid_id, all_group_ids)
    if not success:
        raise HTTPException(status_code=502, detail="Failed to update SSID PPSK user groups.")

    api.logout()
    return group_id


class EventCreate(BaseModel):
    name: str
    start_date: datetime
    end_date: datetime


class EventResponse(BaseModel):
    id: int
    name: str
    start_date: datetime
    end_date: datetime
    usergroup_id: int | None = None

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class KioskJoinRequest(BaseModel):
    event_id: int
    name: str
    email: str
    accept_terms: bool


class GuestResponse(BaseModel):
    id: int
    event_id: int
    name: str
    email: str
    joined_at: datetime
    is_connected: bool = False
    last_activity_at: datetime | None = None

    class Config:
        from_attributes = True


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pbkdf2_sha256.verify(plain_password, password_hash)


def hash_password(password: str) -> str:
    return pbkdf2_sha256.hash(password)


def seed_admin_user():
    db = SessionLocal()
    try:
        admin_user = db.query(models.User).filter(models.User.email == ADMIN_EMAIL).first()
        if admin_user:
            return

        user = models.User(
            full_name="Admin",
            email=ADMIN_EMAIL,
            password_hash=hash_password(ADMIN_PASSWORD),
        )
        db.add(user)
        db.commit()
    finally:
        db.close()


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    credentials_exception = HTTPException(status_code=401, detail="Could not validate token")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError as exc:
        raise credentials_exception from exc

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception

    return user


seed_admin_user()


# Initialize background job scheduler
def init_scheduler():
    """Initialize the background job scheduler"""
    scheduler = BackgroundScheduler()
    
    if not scheduler.running:
        scheduler.start()
        print("[STARTUP] Background job scheduler initialized")
    
    return scheduler


scheduler = init_scheduler()


@app.on_event("shutdown")
def shutdown_event():
    """Stop the scheduler on shutdown"""
    if scheduler.running:
        scheduler.shutdown()
        print("[SHUTDOWN] Background job scheduler stopped")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/health/db")
def health_db(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}


@app.post("/auth/register", response_model=UserResponse, status_code=201)
def register_user(payload: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        full_name=payload.full_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/auth/login", response_model=TokenResponse)
def login_user(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token({"sub": str(user.id), "email": user.email})
    return TokenResponse(access_token=access_token)


@app.get("/auth/me", response_model=UserResponse)
def read_current_user(current_user=Depends(get_current_user)):
    return current_user


@app.get("/events", response_model=list[EventResponse])
def list_events(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return db.query(models.Event).order_by(models.Event.start_date.asc()).all()


@app.get("/events/public", response_model=list[EventResponse])
def list_public_events(db: Session = Depends(get_db)):
    return db.query(models.Event).order_by(models.Event.start_date.asc()).all()


@app.post("/kiosk/join")
def join_network(payload: KioskJoinRequest, db: Session = Depends(get_db)):
    if not payload.accept_terms:
        raise HTTPException(status_code=400, detail="You must accept terms and conditions")

    event = db.query(models.Event).filter(models.Event.id == payload.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    normalized_email = payload.email.strip().lower()
    print(f"[DEBUG] User {normalized_email} attempting to join event {payload.event_id}")
    
    existing_guest = (
        db.query(models.Guest)
        .filter(models.Guest.event_id == payload.event_id)
        .filter(models.Guest.email == normalized_email)
        .first()
    )

    if existing_guest:
        print(f"[DEBUG] User already registered as guest for this event, returning existing record")
        return {
            "message": "Guest already joined for this event",
            "event": event.name,
            "name": existing_guest.name,
            "email": existing_guest.email,
        }

    if not event.usergroup_id:
        raise HTTPException(status_code=400, detail="Event is not linked to an ExtremeCloudIQ user group")

    xiq_username = os.getenv("XIQ_USERNAME")
    xiq_password = os.getenv("XIQ_PASSWORD")
    if not xiq_username or not xiq_password:
        raise HTTPException(
            status_code=500,
            detail="ExtremeCloudIQ credentials are not configured (XIQ_USERNAME/XIQ_PASSWORD).",
        )

    api = ExtremeCloudIQAPI(xiq_username, xiq_password)
    api.login()
    if not api.access_token:
        raise HTTPException(status_code=502, detail="Failed to authenticate with ExtremeCloudIQ.")

    end_user_id = None
    try:
        end_user_id = api.create_end_user(
            user_group_id=event.usergroup_id,
            name=payload.name.strip(),
            email_address=normalized_email,
        )

        if not end_user_id:
            # User already exists, try to associate them with the new usergroup
            existing_end_user = api.get_end_user_by_username(normalized_email)
            if existing_end_user:
                end_user_id = existing_end_user.get("id")
                existing_group_id = existing_end_user.get("user_group_id")
                
                # If user is in a different group, delete and recreate in the new group
                if str(existing_group_id) != str(event.usergroup_id):
                    if api.delete_end_user(end_user_id):
                        # Recreate the user in the new group
                        end_user_id = api.create_end_user(
                            user_group_id=event.usergroup_id,
                            name=existing_end_user.get("name"),
                            email_address=normalized_email,
                        )
                        if end_user_id:
                            print(f"User {normalized_email} moved from group {existing_group_id} to group {event.usergroup_id}")
                        else:
                            print(f"[ERROR] Failed to recreate user in new usergroup for {normalized_email}")
                            raise HTTPException(status_code=502, detail="Failed to recreate user in new usergroup.")
                    else:
                        print(f"[ERROR] Failed to delete user from old group for {normalized_email}")
                        raise HTTPException(status_code=502, detail="Failed to remove user from old usergroup.")
                else:
                    print(f"User {normalized_email} already in group {event.usergroup_id}")

        if not end_user_id:
            print(f"[ERROR] Failed to create or get end user ID for {normalized_email}")
            raise HTTPException(status_code=502, detail="Failed to create or associate end user in ExtremeCloudIQ.")

        # Now that we have a valid end_user_id in XIQ, create guest record in local DB
        guest = models.Guest(
            event_id=payload.event_id,
            name=payload.name.strip(),
            email=normalized_email,
            xiq_end_user_id=end_user_id,
            joined_at=datetime.now(timezone.utc),
        )
        db.add(guest)
        db.commit()
        print(f"[SUCCESS] User {normalized_email} created in both XIQ (ID: {end_user_id}) and local DB")

        return {
            "message": "Access request received",
            "event": event.name,
            "name": guest.name,
            "email": guest.email,
        }

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print(f"[ERROR] Exception during join_network for {normalized_email}: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
    finally:
        api.logout()


@app.get("/events/{event_id}/guests", response_model=list[GuestResponse])
def list_event_guests(
    event_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    return (
        db.query(models.Guest)
        .filter(models.Guest.event_id == event_id)
        .order_by(models.Guest.joined_at.desc())
        .all()
    )


@app.post("/events", response_model=EventResponse)
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    usergroup_id = sync_event_usergroup_to_ssid(payload.name)

    event = models.Event(
        name=payload.name,
        start_date=payload.start_date,
        end_date=payload.end_date,
        usergroup_id=usergroup_id,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    
    # Schedule cleanup job for when the event ends
    schedule_event_cleanup(scheduler, event.id, event.end_date)
    
    return event


@app.put("/events/{event_id}", response_model=EventResponse)
def update_event(
    event_id: int,
    payload: EventCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event.name = payload.name
    event.start_date = payload.start_date
    event.end_date = payload.end_date

    db.commit()
    db.refresh(event)
    
    # Reschedule cleanup job with the new end time
    schedule_event_cleanup(scheduler, event.id, event.end_date)
    
    return event


@app.delete("/events/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Remove scheduled cleanup job if it exists
    unschedule_event_cleanup(scheduler, event_id)
    
    # Delete all guests associated with this event first (due to foreign key constraint)
    db.query(models.Guest).filter(models.Guest.event_id == event_id).delete()
    
    # Delete the event from the database
    db.delete(event)
    db.commit()
    
    # Now clean up XIQ resources (remove from SSID, then delete group)
    xiq_username = os.getenv("XIQ_USERNAME")
    xiq_password = os.getenv("XIQ_PASSWORD")
    ssid_id = os.getenv("XIQ_SSID_ID")
    ssid_name = os.getenv("XIQ_SSID_NAME")
    
    if xiq_username and xiq_password and event.usergroup_id:
        try:
            api = ExtremeCloudIQAPI(xiq_username, xiq_password)
            api.login()
            if api.access_token:
                # If SSID ID is not set, try to get it by name
                if not ssid_id and ssid_name:
                    ssid_id = api.get_ssid_id_by_name(ssid_name)
                
                # Remove the user group from the SSID first
                if ssid_id:
                    current_group_ids = api.get_ssid_user_group_ids(ssid_id)
                    if current_group_ids and event.usergroup_id in current_group_ids:
                        updated_group_ids = [gid for gid in current_group_ids if gid != event.usergroup_id]
                        if api.configure_ppsk_mode(ssid_id, updated_group_ids):
                            print(f"[DELETE EVENT] Removed user group {event.usergroup_id} from SSID {ssid_id}")
                        else:
                            print(f"[DELETE EVENT] Failed to remove user group {event.usergroup_id} from SSID")
                
                # Delete the user group from XIQ
                if api.delete_user_group(event.usergroup_id):
                    print(f"[DELETE EVENT] Successfully deleted user group {event.usergroup_id} from XIQ")
                else:
                    print(f"[DELETE EVENT] Failed to delete user group {event.usergroup_id} from XIQ")
                api.logout()
        except Exception as e:
            print(f"[DELETE EVENT] Error cleaning up XIQ resources: {str(e)}")

    return {"message": "Event deleted successfully"}


@app.post("/events/{event_id}/cleanup")
def cleanup_event_guests(
    event_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Manually trigger cleanup of guests and user group for a specific event.
    Deletes all guests from extremeCloudIQ and removes the user group.
    """
    from .background_jobs import cleanup_expired_events_manual
    
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    success = cleanup_expired_events_manual(db, event_id)
    
    if success:
        return {"message": f"Cleanup completed for event {event.name}", "event_id": event_id}
    else:
        raise HTTPException(status_code=500, detail="Cleanup failed for the event")


@app.post("/events/cleanup/all")
def cleanup_all_expired_events(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Manually trigger cleanup of all expired events.
    Deletes all guests from extremeCloudIQ for expired events and removes their user groups.
    """
    from .background_jobs import cleanup_expired_events
    
    try:
        cleanup_expired_events(db)
        return {"message": "Cleanup of all expired events completed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")


class WebhookAuthenticationPayload(BaseModel):
    ownerId: int | None = None
    userId: int | None = None
    timeStamp: int | None = None
    code: int | None = None
    category: int | None = None
    description: str | None = None
    userName: str | None = None


@app.post("/webhooks/authentication")
def handle_authentication_webhook(payload: list[WebhookAuthenticationPayload], db: Session = Depends(get_db)):
    """
    Webhook endpoint to receive authentication events from ExtremeCloudIQ.
    Code 10001 = Login, Code 10002 = Logout
    """
    for event in payload:
        if not event.userName:
            continue
        
        normalized_email = event.userName.strip().lower()
        
        # Find the guest by email
        guest = db.query(models.Guest).filter(models.Guest.email == normalized_email).first()
        if not guest:
            print(f"[WEBHOOK] No guest found for email: {normalized_email}")
            continue
        
        # Code 10001 = Login, Code 10002 = Logout
        if event.code == 10001:
            guest.is_connected = True
        elif event.code == 10002:
            guest.is_connected = False
        
        guest.last_activity_at = datetime.fromtimestamp(event.timeStamp / 1000, tz=timezone.utc) if event.timeStamp else datetime.now(timezone.utc)
        db.commit()
        print(f"[WEBHOOK] Updated guest {normalized_email}: connected={guest.is_connected}")
    
    return {"status": "received"}


@app.post("/webhooks/register")
def register_webhook(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Register the authentication webhook with ExtremeCloudIQ.
    This should be called when the dashboard is first loaded.
    """
    xiq_username = os.getenv("XIQ_USERNAME")
    xiq_password = os.getenv("XIQ_PASSWORD")
    webhook_url = os.getenv("WEBHOOK_URL", "http://localhost:8000/webhooks/authentication")
    
    if not xiq_username or not xiq_password:
        raise HTTPException(
            status_code=500,
            detail="ExtremeCloudIQ credentials are not configured"
        )
    
    # Check if webhook is already registered
    existing_subscription = db.query(models.WebhookSubscription).filter(
        models.WebhookSubscription.message_type == "AUTHENTICATION_LOG_ALL",
        models.WebhookSubscription.is_active == True
    ).first()
    
    if existing_subscription:
        print(f"[WEBHOOK] Webhook already registered with ID: {existing_subscription.xiq_subscription_id}")
        return {
            "status": "already_registered",
            "subscription_id": existing_subscription.xiq_subscription_id
        }
    
    # Create new webhook subscription
    api = ExtremeCloudIQAPI(xiq_username, xiq_password)
    api.login()
    
    if not api.access_token:
        raise HTTPException(status_code=502, detail="Failed to authenticate with ExtremeCloudIQ")
    
    subscription_id = api.create_webhook_subscription(webhook_url)
    api.logout()
    
    if not subscription_id:
        raise HTTPException(status_code=502, detail="Failed to create webhook subscription")
    
    # Store subscription in database
    webhook_sub = models.WebhookSubscription(
        xiq_subscription_id=str(subscription_id),
        message_type="AUTHENTICATION_LOG_ALL",
        webhook_url=webhook_url,
        created_at=datetime.now(timezone.utc),
        is_active=True
    )
    db.add(webhook_sub)
    db.commit()
    db.refresh(webhook_sub)
    
    return {
        "status": "registered",
        "subscription_id": subscription_id
    }