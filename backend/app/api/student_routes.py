# backend/app/api/student_routes.py
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

# Dynamic Database Dependency Fallback
try:
    from ..database import get_db, models
except ImportError:
    from ..database.connection import get_db
    from ..database import models

router = APIRouter(prefix="/api/student", tags=["Student Portal"])


# ------------------------------------------------------------------------
# PYDANTIC RESPONSE SCHEMAS
# ------------------------------------------------------------------------
class PersonalInfoSchema(BaseModel):
    name: str
    roll_no: str
    branch: str
    email: Optional[str] = "N/A"


class ExamDetailsSchema(BaseModel):
    subject: str
    subject_code: Optional[str] = "N/A"
    paper_group_id: Optional[str] = "A"
    shift: Optional[str] = "Morning"


class AllocationSchema(BaseModel):
    room_no: str
    seat_no: str
    qr_code: Optional[str] = None


class LiveStatusSchema(BaseModel):
    attendance: str
    entry_time: Optional[str] = None


class StudentPassResponse(BaseModel):
    personal_info: PersonalInfoSchema
    exam_details: ExamDetailsSchema
    allocation: AllocationSchema
    live_status: LiveStatusSchema

    model_config = ConfigDict(from_attributes=True)


class PassVerificationResponse(BaseModel):
    roll_no: str
    is_verified: bool
    attendance_status: str


# ------------------------------------------------------------------------
# ROUTE HANDLERS
# ------------------------------------------------------------------------
@router.get(
    "/seat/{roll_no}",
    response_model=StudentPassResponse,
    summary="Get Student Digital Entry Pass",
    status_code=status.HTTP_200_OK
)
async def get_student_seat(
    roll_no: str, 
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Fetches comprehensive seating, syllabus, and live attendance info.
    Serves as the primary data payload for the Student's Digital Entry Pass.
    """
    normalized_roll = roll_no.strip().upper()
    
    seat = db.query(models.StudentSeating).filter(
        models.StudentSeating.roll_no == normalized_roll
    ).first()
    
    if not seat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Seating information not available for roll number '{normalized_roll}'. Check if allocation has been published."
        )
    
    # Safe attribute parsing for optional table columns
    attendance = getattr(seat, 'attendance_status', 'Absent') or 'Absent'
    entry_time = getattr(seat, 'entry_time', None) if "present" in str(attendance).lower() else None
    
    return {
        "personal_info": {
            "name": getattr(seat, 'name', 'Candidate'),
            "roll_no": seat.roll_no,
            "branch": getattr(seat, 'branch', 'GEN'),
            "email": getattr(seat, 'email', 'N/A')
        },
        "exam_details": {
            "subject": getattr(seat, 'subject', 'General Exam'),
            "subject_code": getattr(seat, 'subject_code', 'N/A'),
            "paper_group_id": getattr(seat, 'paper_group_id', 'A'),
            "shift": getattr(seat, 'shift', 'Morning')
        },
        "allocation": {
            "room_no": str(getattr(seat, 'room_no', 'N/A')),
            "seat_no": str(getattr(seat, 'seat_no', 'N/A')),
            "qr_code": getattr(seat, 'qr_code', f"ECOPASS-{seat.roll_no}")
        },
        "live_status": {
            "attendance": attendance,
            "entry_time": str(entry_time) if entry_time else None
        }
    }


@router.get(
    "/verify-pass/{roll_no}",
    response_model=PassVerificationResponse,
    summary="Verify Pass Validity & Scan Status",
    status_code=status.HTTP_200_OK
)
async def verify_pass_validity(
    roll_no: str, 
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Quick status check to confirm if the student's entry pass is active and verified at the venue gate.
    """
    normalized_roll = roll_no.strip().upper()
    
    status_result = db.query(models.StudentSeating.attendance_status).filter(
        models.StudentSeating.roll_no == normalized_roll
    ).first()
    
    if not status_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No registration pass found for roll number '{normalized_roll}'."
        )

    attendance_val = status_result[0] if status_result[0] else "Absent"
    is_verified = "present" in str(attendance_val).strip().lower()

    return {
        "roll_no": normalized_roll,
        "is_verified": is_verified,
        "attendance_status": attendance_val
    }

@router.get("/dashboard-stats/{roll_no}")
async def dashboard_stats(roll_no: str, db: Session = Depends(get_db)):
    student = db.query(models.StudentSeating).filter(models.StudentSeating.roll_no == roll_no.strip().upper()).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"roll_no": student.roll_no, "attendance_status": student.attendance_status or "Absent", "room_no": student.room_no, "seat_no": student.seat_no}
