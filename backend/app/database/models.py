from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from .connection import Base

class StudentSeating(Base):
    """
    Core Database Model for AI-Driven Seating & Audit Trails[cite: 18, 20].
    """
    __tablename__ = "student_seating"

    id = Column(Integer, primary_key=True, index=True)
    
    # Candidate Identity [cite: 4]
    name = Column(String)
    roll_no = Column(String, unique=True, index=True)
    branch = Column(String)
    
    # Constraint Mapping Data [cite: 12]
    # 'subject' stores the Course Code used by the CSP Solver to prevent academic clustering[cite: 15].
    subject = Column(String)
    
    # Infrastructure Logic (Digital Twin Mapping) [cite: 30]
    room_no = Column(String)
    seat_no = Column(String)
    
    # Security & Verification [cite: 10]
    # Stores the Base64 Unique Scanner generated for QR-Integrated access[cite: 10, 33].
    qr_code = Column(Text) 

    # Audit & Compliance Logs [cite: 19, 51]
    # Automatically tracks allocation time for administrative efficiency reports[cite: 35].
    allocated_at = Column(DateTime(timezone=True), server_default=func.now())