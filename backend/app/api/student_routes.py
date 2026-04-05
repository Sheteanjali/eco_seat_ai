from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..database import models, connection

router = APIRouter(prefix="/api/student", tags=["Student Portal"])

@router.get("/seat/{roll_no}")
async def get_student_seat(roll_no: str, db: Session = Depends(connection.get_db)):
    """
    Fetches personal seating info for a student using their Roll Number.
    """
    seat = db.query(models.StudentSeating).filter(models.StudentSeating.roll_no == roll_no).first()
    
    if not seat:
        raise HTTPException(status_code=404, detail="Seating info not found for this Roll Number.")
    
    return {
        "name": seat.name,
        "roll_no": seat.roll_no,
        "branch": seat.branch,
        "room_no": seat.room_no,
        "seat_no": seat.seat_no,
        "subject": seat.subject,
        "qr_code": seat.qr_code
    }