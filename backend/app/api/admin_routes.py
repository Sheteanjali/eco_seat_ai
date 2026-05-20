import qrcode
import base64
import io
import pandas as pd
from datetime import datetime, time
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query, Request, Header
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from pydantic import BaseModel
from ..database import models, connection
from ..core.solver import solve_seating 

router = APIRouter(prefix="/api/admin", tags=["Admin Hub"])

# -------------------- SCHEMAS --------------------

class BrokenTableUpdate(BaseModel):
    room_no: str
    table_id: str
    is_broken: bool

class RegenerateRequest(BaseModel):
    mode: str = "Double"

class AttendanceUpdate(BaseModel):
    roll_no: str
    status: str 

class VerifyScanRequest(BaseModel):
    qr_data: str

# 👑 NEW SCHEMA: Request body configuration parser for isolated seat swapping
class ResolveBrokenSeatRequest(BaseModel):
    student_id: int
    target_new_room: str

# -------------------- 1. ATTENDANCE & VERIFY LOGIC --------------------

@router.post("/attendance/verify-scan")
async def verify_scan(
    req: VerifyScanRequest, 
    db: Session = Depends(connection.get_db),
    authorization: str = Header(None)
):
    """
    Handles identity verification from VerifyScan.js
    """
    if authorization != "RBU_ADMIN_SECURE_TOKEN_2026":
        raise HTTPException(status_code=401, detail="Unauthorized Terminal Access")

    qr_raw = req.qr_data.strip()
    if not qr_raw:
        raise HTTPException(status_code=400, detail="Empty QR Content")

    roll_no = qr_raw.split("|")[1] if "|" in qr_raw else qr_raw

    student = db.query(models.StudentSeating).filter(models.StudentSeating.roll_no == roll_no).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student Identity Not Found")

    student.attendance_status = "Present"
    db.commit()

    return {
        "success": True,
        "name": student.name,
        "roll_no": student.roll_no,
        "room": student.room_no,
        "seat": student.seat_no,
        "message": "Authorized Entry Recorded"
    }

@router.patch("/mark-attendance")
async def mark_attendance(data: AttendanceUpdate, db: Session = Depends(connection.get_db)):
    student = db.query(models.StudentSeating).filter(models.StudentSeating.roll_no == data.roll_no).first()
    if not student: raise HTTPException(404, "Student not found")
    
    student.attendance_status = data.status
    db.commit()
    return {"status": "success", "new_status": student.attendance_status}


# -------------------- 👑 2. FAULT-TOLERANT RESOLVER ENGINE --------------------

@router.post("/resolve-broken-seat")
async def admin_resolve_broken_seat(payload: ResolveBrokenSeatRequest, db: Session = Depends(connection.get_db)):
    """
    Finds an open layout slot inside the target room selected by Admin,
    moves ONLY the affected student, without altering any other database allocations.
    """
    # 🔍 Fetch student node flag registry details
    student = db.query(models.StudentSeating).filter(models.StudentSeating.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student index record mismatch.")

    # 🔎 Fetch room structural parameters boundaries
    room_meta = db.query(models.Room).filter(models.Room.room_no == payload.target_new_room).first()
    if not room_meta:
        raise HTTPException(status_code=404, detail=f"Target Room {payload.target_new_room} matrix missing.")

    # 📏 Max seats constraint matching check
    max_capacity = room_meta.total_tables * room_meta.students_per_table
    currently_allocated = db.query(models.StudentSeating).filter(models.StudentSeating.room_no == payload.target_new_room).all()

    if len(currently_allocated) >= max_capacity:
        raise HTTPException(status_code=400, detail=f"Target Room {payload.target_new_room} is at absolute density limit.")

    # 🛠️ Extract all available layout indices safely
    allocated_seats = [s.seat_no for s in currently_allocated]
    all_possible_seats = [
        f"S-{row}-{col}" 
        for row in range(1, room_meta.rows + 1) 
        for col in range(1, room_meta.cols + 1)
    ]
    
    # Exclude broken tables configuration if mapped by admin inside data frame
    broken_list = [t.strip() for t in str(room_meta.broken_tables).split(',') if t.strip()]
    available_slots = [s for s in all_possible_seats if s not in allocated_seats and s not in broken_list]

    if not available_slots:
        raise HTTPException(status_code=500, detail="No isolated coordinates available inside target room arrays.")

    old_room = student.room_no
    old_seat = student.seat_no
    target_new_seat = available_slots[0] # Picking the first constraint matching slot index

    # 🔄 Atomic swap operation boundary lock
    student.room_no = payload.target_new_room
    student.seat_no = target_new_seat
    student.attendance_status = "Present (Admin Swapped)"
    student.incident_logs = f"RESOLVED: Shifted from Room {old_room} [Seat {old_seat}] due to broken chair report."
    
    db.commit()
    print(f"👑 [ADMIN RESOLVE TRANS] - Shifted Candidate {student.roll_no} safely -> Room {payload.target_new_room} at {target_new_seat}")
    
    return {
        "status": "success",
        "message": f"Candidate successfully mapped to alternative room slots without cascading shifts.",
        "moved_student": student.name,
        "new_room": student.room_no,
        "new_seat": student.seat_no
    }


# -------------------- 3. DATA INGESTION & AI SOLVER --------------------

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
        s_df = s_df.fillna("N/A")
        r_df = r_df.fillna("")

        for _, r_data in r_df.iterrows():
            db.add(models.Room(
                room_no=str(r_data['room_no']),
                floor=int(r_data.get('floor', 0)),
                total_tables=int(r_data.get('capacity', r_data.get('total_tables', 0))),
                rows=int(r_data['rows']),
                cols=int(r_data['cols']),
                broken_tables=str(r_data.get('broken_tables', "")),
                students_per_table=1 
            ))
        db.commit()

        return await run_solver_logic(db, mode, is_first_upload=True, raw_student_data=s_df.to_dict('records'))

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# -------------------- 4. REGENERATE & SOLVER ENGINE --------------------

@router.post("/regenerate-plan")
async def regenerate_plan(req: RegenerateRequest, db: Session = Depends(connection.get_db)):
    try:
        return await run_solver_logic(db, req.mode)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Regeneration Failed: {str(e)}")

async def run_solver_logic(db: Session, mode: str, is_first_upload=False, raw_student_data=None):
    current_rooms = db.query(models.Room).all()
    rooms_list = [{
        "room_no": r.room_no,
        "rows": r.rows,
        "cols": r.cols,
        "broken_tables": r.broken_tables
    } for r in current_rooms]

    student_records = []
    if is_first_upload and raw_student_data:
        for row in raw_student_data:
            student_records.append({
                "name": row.get('name', row.get('nameid', 'Unknown')),
                "roll_no": str(row.get('roll_no', row.get('rollno', '000'))),
                "branch": row.get('branch', 'GEN'),
                "year": str(row.get('year', '1')),
                "subject": row.get('subject', 'N/A'),
                "paper_group_id": row.get('subject', 'N/A')
            })
    else:
        existing = db.query(models.StudentSeating).all()
        for s in existing:
            student_records.append({
                "name": s.name,
                "roll_no": s.roll_no,
                "branch": s.branch,
                "year": s.year,
                "subject": s.subject,
                "paper_group_id": s.subject
            })

    if not student_records:
        raise HTTPException(400, "No student registry found.")

    assignments = solve_seating(student_records, rooms_list, mode=mode)
    
    db.query(models.StudentSeating).delete()
    db.commit()

    new_records = []
    for s in assignments:
        qr_content = f"RBU|{s['roll_no']}|{s['assigned_room']}|{s.get('assigned_seat')}"
        qr = qrcode.make(qr_content)
        buf = io.BytesIO()
        qr.save(buf, format="PNG")
        qr_base64 = base64.b64encode(buf.getvalue()).decode()

        new_records.append(models.StudentSeating(
            name=s['name'],
            roll_no=s['roll_no'],
            branch=s.get('branch', 'GEN'),
            year=str(s.get('year', '1')),
            subject=s['subject'],
            room_no=s['assigned_room'],
            seat_no=str(s.get('assigned_seat')),
            shift=s.get('shift', 'Morning'),
            exam_time=s.get('exam_time', '09:30 AM'),
            attendance_status="Absent", 
            qr_code=f"data:image/png;base64,{qr_base64}"
        ))

    db.add_all(new_records)
    db.commit()
    return {"status": "success", "count": len(assignments)}


# -------------------- 5. ANALYTICS & INFRASTRUCTURE --------------------

@router.get("/analytics")
async def get_analytics(db: Session = Depends(connection.get_db)):
    total = db.query(models.StudentSeating).count()
    present = db.query(models.StudentSeating).filter(models.StudentSeating.attendance_status == "Present").count()
    rooms = db.query(models.Room).all()
    
    room_stats = []
    for r in rooms:
        students_in_room = db.query(models.StudentSeating).filter(models.StudentSeating.room_no == r.room_no).all()
        room_stats.append({
            "name": f"Room {r.room_no}",
            "room_no": r.room_no,
            "count": len(students_in_room),
            "broken": len([t for t in r.broken_tables.split(',') if t.strip()]),
            "broken_tables": r.broken_tables,
            "rows": r.rows,
            "cols": r.cols,
            "students": [{"name": s.name, "seat": s.seat_no, "status": s.attendance_status} for s in students_in_room]
        })

    return {
        "totalStudents": total,
        "presentCount": present,
        "utilization": round((total / 2500) * 100, 1) if total > 0 else 0,
        "roomData": room_stats
    }

@router.patch("/room/update-infrastructure")
async def update_infra(data: BrokenTableUpdate, db: Session = Depends(connection.get_db)):
    room = db.query(models.Room).filter(models.Room.room_no == data.room_no).first()
    if not room: raise HTTPException(404, "Room Not Found")
    
    broken_set = set(t.strip() for t in str(room.broken_tables).split(',') if t.strip())
    if data.is_broken: broken_set.add(data.table_id)
    else: broken_set.discard(data.table_id)
    
    room.broken_tables = ",".join(filter(None, broken_set))
    db.commit()
    return {"status": "success", "broken_tables": room.broken_tables}

@router.get("/search-hub")
async def search_hub(
    query: str = Query(None), 
    filter_type: str = Query("student"), 
    db: Session = Depends(connection.get_db)
):
    stmt = db.query(models.StudentSeating)
    if query:
        if filter_type == "student":
            stmt = stmt.filter(or_(models.StudentSeating.name.ilike(f"%{query}%"), models.StudentSeating.roll_no.ilike(f"%{query}%")))
    
    results = stmt.all()
    return {"results": results, "total": len(results)}