import qrcode
import base64
import io
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import models, connection
# AI Solver logic utilizing CSP and Recursive Search
from ..core.solver import solve_seating  

router = APIRouter(prefix="/api/admin", tags=["Admin Hub"])

@router.post("/upload-bulk")
async def upload_bulk_data(
    student_file: UploadFile = File(...), 
    room_file: UploadFile = File(...),
    db: Session = Depends(connection.get_db)
):
    try:
        # 1. Reset Database: Ensures a fresh start for the 1,500 candidate grid
        db.query(models.StudentSeating).delete()
        db.commit()

        # 2. Data Ingest & Normalization
        # Using await for file reads to handle async stream
        student_bytes = await student_file.read()
        room_bytes = await room_file.read()
        
        students_df = pd.read_csv(io.BytesIO(student_bytes))
        rooms_df = pd.read_csv(io.BytesIO(room_bytes))
        
        # Standardize: Lowercase headers and remove hidden whitespace
        students_df.columns = [c.lower().strip() for c in students_df.columns]
        rooms_df.columns = [c.lower().strip() for c in rooms_df.columns]

        # Fix KeyError: Check for 'course_code' and fallback to 'subject' if needed
        if 'course_code' not in students_df.columns:
            if 'subject' in students_df.columns:
                students_df.rename(columns={'subject': 'course_code'}, inplace=True)
            else:
                raise HTTPException(status_code=400, detail="Student CSV must contain 'course_code' or 'subject'.")

        students_list = students_df.to_dict('records')
        
        # 3. Infrastructure Grid (Digital Twin Mapping)
        room_grid = []
        for _, room in rooms_df.iterrows():
            r_id = str(room['room_no'])
            # Support both 'total_capacity' and 'capacity' headers
            cap_col = 'total_capacity' if 'total_capacity' in rooms_df.columns else 'capacity'
            cap = int(room[cap_col])
            
            for i in range(cap):
                # USE A TUPLE: This fixes the "Unhashable dict" 500 Error
                room_grid.append((r_id, (i // 5, i % 5)))

        # 4. AI Engine: Triggering Recursive Search
        # assignments = {(room_no, (r, c)): student_dict}
        assignments = solve_seating(students_list, room_grid)

        if not assignments:
            raise HTTPException(status_code=400, detail="Constraints could not be satisfied with current room layout.")

        # 5. Output Generation & QR Verification Slips
        seating_plan = []
        for seat_tuple, student in assignments.items():
            room_id, (r, c) = seat_tuple
            roll_no = str(student['roll_no'])
            seat_label = f"R{r}C{c}"

            # Generate Unique Scanner Data
            qr_data = f"NGP-SECURE|{roll_no}|{room_id}|{seat_label}"
            qr = qrcode.QRCode(version=1, box_size=10, border=2)
            qr.add_data(qr_data)
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            qr_base64 = base64.b64encode(buf.getvalue()).decode()

            # Create Database Record matching models.StudentSeating
            new_record = models.StudentSeating(
                name=student['name'],
                roll_no=roll_no,
                branch=student['branch'],
                subject=str(student['course_code']), 
                room_no=room_id,
                seat_no=seat_label,
                qr_code=f"data:image/png;base64,{qr_base64}"
            )
            seating_plan.append(new_record)

        db.add_all(seating_plan)
        db.commit()
        
        return {"status": "success", "message": f"Conflict-free plan for {len(seating_plan)} students generated."}

    except Exception as e:
        db.rollback()
        # Return the actual error message to help us debug the 500 error
        raise HTTPException(status_code=500, detail=f"AI Engine Error: {str(e)}")

@router.get("/all-seating")
async def get_all_seating(db: Session = Depends(connection.get_db)):
    """Fetches the digital manifest for printable layouts."""
    try:
        students = db.query(models.StudentSeating).order_by(
            models.StudentSeating.room_no, 
            models.StudentSeating.seat_no
        ).all()
        return [
            {
                "room_no": s.room_no,
                "seat_no": s.seat_no,
                "roll_no": s.roll_no,
                "name": s.name,
                "branch": s.branch,
                "subject": s.subject,
                "qr_code": s.qr_code
            } for s in students
        ]
    except Exception:
        return []

@router.get("/analytics")
async def get_analytics(db: Session = Depends(connection.get_db)):
    """Real-time adaptation metrics for the Nagpur Admin Hub."""
    total_students = db.query(models.StudentSeating).count()
    rooms = db.query(models.StudentSeating.room_no, func.count(models.StudentSeating.id)).group_by(models.StudentSeating.room_no).all()
    branch_counts = db.query(models.StudentSeating.branch, func.count(models.StudentSeating.id)).group_by(models.StudentSeating.branch).all()

    return {
        "totalStudents": total_students,
        "totalRooms": len(rooms),
        "utilization": round((total_students / 1500) * 100, 1) if total_students > 0 else 0,
        "roomData": [{"name": f"Room {r[0]}", "count": r[1]} for r in rooms],
        "branchData": [{"name": str(b[0]), "value": b[1]} for b in branch_counts]
    }