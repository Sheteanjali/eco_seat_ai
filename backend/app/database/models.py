from sqlalchemy import Column, Integer, String, Text, DateTime
from .connection import Base
import datetime

class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True)
    room_no = Column(String, unique=True)
    floor = Column(Integer)  # <--- ADD THIS LINE TO FIX THE 500 ERROR
    rows = Column(Integer)
    cols = Column(Integer)
    total_tables = Column(Integer)
    broken_tables = Column(String, default="") 

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