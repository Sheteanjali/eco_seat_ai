from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..database import models, connection

router = APIRouter(prefix="/api/student", tags=["Student Portal"])

@router.get("/seat/{roll_no}")
async def get_student_seat(roll_no: str, db: Session = Depends(connection.get_db)):
    """
    Fetches comprehensive seating, syllabus, and live attendance info.
    This is the data source for the Student's Digital Entry Pass.
    """
    seat = db.query(models.StudentSeating).filter(models.StudentSeating.roll_no == roll_no).first()
    
    if not seat:
        raise HTTPException(
            status_code=404, 
            detail="Seating information not available. Please check if the allocation is generated."
        )
    
    return {
        "personal_info": {
            "name": seat.name,
            "roll_no": seat.roll_no,
            "branch": seat.branch,
            "email": getattr(seat, 'email', 'N/A')
        },
        "exam_details": {
            "subject": seat.subject,
            "subject_code": seat.subject_code,
            "paper_group_id": seat.paper_group_id, # Reflects the Shared Syllabus Logic
            "shift": seat.shift
        },
        "allocation": {
            "room_no": seat.room_no,
            "seat_no": seat.seat_no,
            "qr_code": seat.qr_code # Used by Admin to scan at the door
        },
        "live_status": {
            "attendance": seat.attendance_status, # "Absent" until Admin scans QR
            "entry_time": seat.entry_time if seat.attendance_status == "Present" else None
        }
    }

@router.get("/verify-pass/{roll_no}")
async def verify_pass_validity(roll_no: str, db: Session = Depends(connection.get_db)):
    """
    Quick check to see if the student's pass is active and attendance is marked.
    """
    status = db.query(models.StudentSeating.attendance_status).filter(
        models.StudentSeating.roll_no == roll_no
    ).scalar()
    
    return {"roll_no": roll_no, "is_verified": status == "Present"}