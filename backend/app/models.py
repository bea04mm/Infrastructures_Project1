from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    start_date: Mapped[str] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[str] = mapped_column(DateTime(timezone=True), nullable=False)
    usergroup_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)


class Guest(Base):
    __tablename__ = "guests"
    __table_args__ = (UniqueConstraint("event_id", "email", name="uq_guest_event_email"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    xiq_end_user_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True, index=True)
    joined_at: Mapped[str] = mapped_column(DateTime(timezone=True), nullable=False)