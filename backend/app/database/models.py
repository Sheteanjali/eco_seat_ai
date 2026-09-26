# File: backend/app/database/models.py

import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from .connection import Base


class AdminUser(Base):
    __tablename__ = "admin_users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class InvigilatorUser(Base):
    __tablename__ = "invigilator_users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)

    # Compatibility-only field for existing SQLite databases.
    # The app no longer uses it to restrict an invigilator to one room.
    assigned_room = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True, index=True)
    room_no = Column(String, unique=True, index=True, nullable=False)
    floor = Column(Integer, default=1)
    rows = Column(Integer, default=5)
    cols = Column(Integer, default=6)
    total_tables = Column(Integer, default=30)
    capacity = Column(Integer, default=60)
    broken_tables = Column(String, default="")
    students_per_table = Column(Integer, default=2)
    column_bounds = Column(String, nullable=True, default="")


class StudentSeating(Base):
    __tablename__ = "student_seating"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    roll_no = Column(String, unique=True, index=True, nullable=False)
    branch = Column(String)
    year = Column(String)
    subject = Column(String)
    paper_group_id = Column(String)
    room_no = Column(String, index=True)
    seat_no = Column(String)
    shift = Column(String)
    exam_time = Column(String)
    attendance_status = Column(String, default="Absent")
    qr_code = Column(Text)
    incident_logs = Column(Text, default="")


class ActionLog(Base):
    __tablename__ = "action_logs"
    id = Column(Integer, primary_key=True, index=True)
    actor_role = Column(String, nullable=False, default="system")
    actor_username = Column(String, nullable=True)
    action_type = Column(String, nullable=False, index=True)
    room_no = Column(String, nullable=True, index=True)
    roll_no = Column(String, nullable=True, index=True)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
