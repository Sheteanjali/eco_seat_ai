from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import models, connection

router = APIRouter(prefix="/api/auth", tags=["Identity & Access"])

@router.post("/login")
def login(credentials: dict, db: Session = Depends(connection.get_db)):
    """
    Nagpur Smart City - Dynamic Authentication.
    Validates Admin via Hub Key and Students via CSV-Linked Data.
    """
    username = credentials.get('username', '').strip()
    password = credentials.get('password', '').strip()
    role = credentials.get('role', 'student')

    # --- 1. ADMIN HUB ACCESS ---
    if role == "admin":
        if username == "admin" and password == "Nagpur@1289":
            return {
                "status": "success",
                "role": "admin",
                "username": "Hub Administrator",
                "token": "admin_secure_access_2026"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Admin Access Denied: Invalid Hub Credentials"
            )

    # --- 2. DYNAMIC STUDENT ACCESS (Data-Linked) ---
    # The system looks up the student in the database populated by YOUR CSV
    student = db.query(models.StudentSeating).filter(
        models.StudentSeating.roll_no == username
    ).first()
    
    if student:
        # DYNAMIC LOGIC: The 'Secret Key' is now the student's 'Branch' from the CSV
        # Example: If Roll No is 101 and Branch is 'CSE', the password is 'CSE'
        if password.upper() == student.branch.upper(): 
            return {
                "status": "success", 
                "role": "student", 
                "username": student.name,
                "roll_no": student.roll_no,
                "token": f"candidate_access_{student.roll_no}"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Invalid Secret Key. Access Denied for this Candidate."
            )
    
    # Error if the Admin hasn't run the Solver yet or Roll No is wrong
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND, 
        detail="Candidate Identity not found. Ensure AI Solver has run the Manifest."
    )