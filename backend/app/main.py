from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from .database import Base, engine, SessionLocal
from . import models

app = FastAPI(title="Captive Portal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class EventCreate(BaseModel):
    name: str
    start_date: datetime
    end_date: datetime


class EventResponse(BaseModel):
    id: int
    name: str
    start_date: datetime
    end_date: datetime

    class Config:
        from_attributes = True


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/health/db")
def health_db(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}


@app.get("/events", response_model=list[EventResponse])
def list_events(db: Session = Depends(get_db)):
    return db.query(models.Event).order_by(models.Event.start_date.asc()).all()


@app.post("/events", response_model=EventResponse)
def create_event(payload: EventCreate, db: Session = Depends(get_db)):
    event = models.Event(
        name=payload.name,
        start_date=payload.start_date,
        end_date=payload.end_date,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@app.put("/events/{event_id}", response_model=EventResponse)
def update_event(event_id: int, payload: EventCreate, db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event.name = payload.name
    event.start_date = payload.start_date
    event.end_date = payload.end_date

    db.commit()
    db.refresh(event)
    return event


@app.delete("/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    db.delete(event)
    db.commit()

    return {"message": "Event deleted successfully"}