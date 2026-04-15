import qrcode
import base64
import io
import pandas as pd
from datetime import datetime, time
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query, Header
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from pydantic import BaseModel
from ..database import models, connection
from ..core.solver import solve_seating 

router = APIRouter(prefix="/api/admin", tags=["Admin Hub"])

# --- SCHEMAS ---
class BrokenTableUpdate(BaseModel):
    room_no: str
    table_id: str
    is_broken: bool

class AttendanceVerification(BaseModel):
    qr_data: str # Format: "RBU|ROLL_NO|ROOM|TIME"

# --- 1. DATA INGESTION & SHIFT-AWARE AI SOLVER ---
@router.post("/upload-bulk")
async def upload_bulk_data(
    student_file: UploadFile = File(...), 
    room_file: UploadFile = File(...),
    mode: str = "Single", 
    db: Session = Depends(connection.get_db)
):
    try:
        db.query(models.StudentSeating).delete()
        db.query(models.Room).delete()
        db.commit()

        s_df = pd.read_csv(io.BytesIO(await student_file.read()))
        r_df = pd.read_csv(io.BytesIO(await room_file.read()))
        
        s_df.columns = [c.lower().strip().replace(' ', '_') for c in s_df.columns]
        r_df.columns = [c.lower().strip().replace(' ', '_') for c in r_df.columns]

        for _, r_data in r_df.iterrows():
            db.add(models.Room(
                room_no=str(r_data['room_no']),
                floor=int(r_data.get('floor', 0)),
                total_tables=int(r_data['total_tables']),
                rows=int(r_data['rows']),
                cols=int(r_data['cols']),
                broken_tables=str(r_data.get('broken_tables', ""))
            ))
        db.commit()

        assignments = solve_seating(s_df.to_dict('records'), r_df.to_dict('records'), mode=mode)
        
        new_records = []
        for student in assignments:
            roll_val = str(student.get('rollno') or student.get('roll_no'))
            room_id = str(student.get('assigned_room'))
            seat_id = str(student.get('assigned_seat'))
            curr_shift = student.get('shift', 'Morning')
            curr_time = student.get('exam_time', '09:30 AM')

            qr_content = f"RBU|{roll_val}|{room_id}|{curr_time}"
            qr = qrcode.make(qr_content)
            buf = io.BytesIO()
            qr.save(buf, format="PNG")
            qr_base64 = base64.b64encode(buf.getvalue()).decode()

            new_records.append(models.StudentSeating(
                name=student.get('nameid') or student.get('name'),
                roll_no=roll_val,
                branch=student.get('branch', 'GEN'),
                year=str(student.get('year', '1')),
                subject=student.get('course_name') or student.get('subject', 'N/A'),
                paper_group_id=student.get('paper_group_id', 'COMMON'),
                room_no=room_id,
                seat_no=seat_id,
                shift=curr_shift,
                exam_time=curr_time,
                attendance_status="Absent",
                qr_code=f"data:image/png;base64,{qr_base64}"
            ))

        db.add_all(new_records)
        db.commit()
        return {"status": "success", "count": len(assignments)}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Solver Crash: {str(e)}")

# --- 2. ROOM DIRECTORY ---
@router.get("/rooms")
async def get_all_rooms(db: Session = Depends(connection.get_db)):
    return db.query(models.Room).all()

# --- 3. DIGITAL TWIN SYNC ---
@router.patch("/room/update-infrastructure")
async def update_infrastructure(data: BrokenTableUpdate, db: Session = Depends(connection.get_db)):
    room = db.query(models.Room).filter(models.Room.room_no == data.room_no).first()
    if not room: raise HTTPException(status_code=404, detail="Room Not Found")
    
    current_broken = set(t.strip() for t in str(room.broken_tables).split(',') if t.strip())
    if data.is_broken:
        current_broken.add(data.table_id)
    else:
        current_broken.discard(data.table_id)
    
    room.broken_tables = ",".join(current_broken)
    db.commit()
    return {"status": "Synced", "broken_tables": room.broken_tables}

# --- 4. SEARCH HUB ---
@router.get("/search-hub")
async def search_hub(
    query: str = Query(None), 
    filter_type: str = Query("student"), 
    shift: str = Query("All"),
    year: str = Query("All"),
    db: Session = Depends(connection.get_db)
):
    stmt = db.query(models.StudentSeating)
    if shift != "All":
        stmt = stmt.filter(models.StudentSeating.shift == shift)
    if year != "All":
        stmt = stmt.filter(models.StudentSeating.year == year)

    if query:
        if filter_type == "student":
            stmt = stmt.filter(or_(models.StudentSeating.name.ilike(f"%{query}%"), models.StudentSeating.roll_no.ilike(f"%{query}%")))
        elif filter_type == "subject":
            stmt = stmt.filter(models.StudentSeating.subject.ilike(f"%{query}%"))
        elif filter_type == "room":
            stmt = stmt.filter(models.StudentSeating.room_no == query)
        elif filter_type == "branch":
            stmt = stmt.filter(models.StudentSeating.branch.ilike(f"%{query}%"))

    results = stmt.all()
    summary = {}
    for s in results:
        label = f"Room {s.room_no}"
        summary[label] = summary.get(label, 0) + 1

    return {"results": results, "summary": summary, "total": len(results)}

# --- 5. LIVE ANALYTICS ---
@router.get("/analytics")
async def get_analytics(db: Session = Depends(connection.get_db)):
    total = db.query(models.StudentSeating).count()
    present = db.query(models.StudentSeating).filter(models.StudentSeating.attendance_status == "Present").count()
    rooms = db.query(models.StudentSeating.room_no, func.count(models.StudentSeating.id)).group_by(models.StudentSeating.room_no).all()
    
    return {
        "totalStudents": total,
        "presentCount": present,
        "absentCount": total - present,
        "utilization": round((total / 2500) * 100, 1) if total > 0 else 0,
        "roomData": [{"name": f"Room {r[0]}", "count": r[1]} for r in rooms]
    }

# --- 6. SECURE ATTENDANCE VERIFICATION (Authorized & Temporal) ---
@router.post("/attendance/verify-scan")
async def verify_attendance(
    data: AttendanceVerification, 
    authorization: str = Header(None), 
    db: Session = Depends(connection.get_db)
):
    # Layer 1: Authorized Device Handshake
    if authorization != "RBU_ADMIN_SECURE_TOKEN_2026":
        raise HTTPException(status_code=401, detail="Unauthorized Device Detected")

    # Layer 2: Signature Validation
    parts = data.qr_data.split('|')
    if len(parts) < 2 or parts[0] != "RBU":
        raise HTTPException(status_code=400, detail="Invalid RBU QR Signature")
    
    roll_no = parts[1]
    student = db.query(models.StudentSeating).filter(models.StudentSeating.roll_no == roll_no).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student Not Registered")

    # Layer 3: Temporal Gating (Strict 30-Min Windows)
    now = datetime.now().time()
    if student.shift == "Morning":
        if not (time(9, 0) <= now <= time(9, 30)):
            raise HTTPException(status_code=403, detail="Morning Entry Closed (09:00-09:30)")
    elif student.shift == "Afternoon":
        if not (time(13, 0) <= now <= time(13, 30)):
            raise HTTPException(status_code=403, detail="Afternoon Entry Closed (13:00-13:30)")

    # Layer 4: Duplicate Entry Prevention
    if student.attendance_status == "Present":
        return {"status": "warning", "message": "Already Verified", "name": student.name}

    student.attendance_status = "Present"
    db.commit()
    return {"status": "success", "name": student.name, "seat": student.seat_no, "room": student.room_no}