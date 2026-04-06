from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import models, connection

router = APIRouter(prefix="/api/auth", tags=["Identity & Access"])

@router.post("/login")
def login(credentials: dict, db: Session = Depends(connection.get_db)):
    username = credentials.get('username', '').strip()
    password = credentials.get('password', '').strip()
    role = credentials.get('role', 'student')

    if role == "admin":
        if username == "admin" and password == "Nagpur@1289":
            return {"status": "success", "role": "admin", "token": "admin_hub_2026"}
        raise HTTPException(status_code=401, detail="Invalid Admin Credentials")

    # Dynamic Student Lookup
    student = db.query(models.StudentSeating).filter(models.StudentSeating.roll_no == username).first()
    
    if student:
        # PASSWORD = BRANCH (e.g., CSE, IT, ME)
        if password.upper() == student.branch.strip().upper(): 
            return {
                "status": "success", 
                "role": "student", 
                "username": student.name,
                "roll_no": student.roll_no
            }
        raise HTTPException(status_code=401, detail="Invalid Secret Key (Check your Branch)")
    
    raise HTTPException(status_code=404, detail="Candidate not found. Admin must run Solver first.")