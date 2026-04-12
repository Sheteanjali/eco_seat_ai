from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from .connection import Base

class StudentSeating(Base):
    """
    Core Database Model for AI-Driven Seating & Audit Trails.
    Enhanced for Dual-Shift Allocation & Automated Attendance Monitoring.
    """
    __tablename__ = "student_seating"

    id = Column(Integer, primary_key=True, index=True)
    
    # Candidate Identity
    name = Column(String)
    roll_no = Column(String, unique=True, index=True)
    branch = Column(String)
    
    # Constraint Mapping & Paper Details
    subject = Column(String)
    subject_code = Column(String, index=True) 
    
    # Infrastructure Logic (Digital Twin Mapping)
    room_no = Column(String, index=True)
    seat_no = Column(String)
    
    # --- 🕒 NEW: SHIFT & TIME-SLOT MANAGEMENT ---
    # Stores "Morning" (9:00 AM) or "Afternoon" (1:30 PM)
    shift = Column(String, default="Morning", index=True)
    
    # --- 🔐 NEW: SMART ATTENDANCE & SECURITY ---
    # Tracks: "Pending", "Present", or "Absent" (Auto-marked 'Absent' after 09:10 AM)
    attendance_status = Column(String, default="Pending")
    entry_time = Column(DateTime(timezone=True), nullable=True)
    
    # Security & Verification
    qr_code = Column(Text) 

    # Audit & Compliance Logs
    allocated_at = Column(DateTime(timezone=True), server_default=func.now())