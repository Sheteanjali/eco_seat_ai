from sqlalchemy import Column, Integer, String, Text, DateTime
from .connection import Base
import datetime

class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True)
    room_no = Column(String, unique=True)
    floor = Column(Integer)
    rows = Column(Integer)
    cols = Column(Integer)
    total_tables = Column(Integer)
    broken_tables = Column(String, default="") 
    # ✅ FIX: Adding this column so admin_routes can save density settings
    students_per_table = Column(Integer, default=1) 

class StudentSeating(Base):
    __tablename__ = "student_seating"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    roll_no = Column(String, unique=True)
    branch = Column(String)
    year = Column(String) 
    subject = Column(String)
    paper_group_id = Column(String)
    room_no = Column(String)
    seat_no = Column(String)
    shift = Column(String) 
    exam_time = Column(String) 
    attendance_status = Column(String, default="Absent")
    qr_code = Column(Text)