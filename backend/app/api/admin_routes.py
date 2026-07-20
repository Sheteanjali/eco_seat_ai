import qrcode
import base64
import io
import json
import pandas as pd
from datetime import datetime, time
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query, Request, Header
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from pydantic import BaseModel
from typing import Optional

# Project Database & Solver Modules
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

class ResolveBrokenSeatRequest(BaseModel):
    student_id: int
    target_new_room: str

# Request body parser supporting real-time runtime room injections
class RoomInjectionPayload(BaseModel):
    room_no: str
    rows: int
    cols: int
    column_bounds: Optional[dict] = None

# -------------------- 1. ATTENDANCE & VERIFY LOGIC --------------------

@router.post("/attendance/verify-scan")
async def verify_scan(
    req: VerifyScanRequest, 
    db: Session = Depends(connection.get_db),
    authorization: str = Header(None)
):
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


# -------------------- 2. FAULT-TOLERANT RESOLVER ENGINE --------------------

@router.post("/resolve-broken-seat")
async def admin_resolve_broken_seat(payload: ResolveBrokenSeatRequest, db: Session = Depends(connection.get_db)):
    student = db.query(models.StudentSeating).filter(models.StudentSeating.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student index record mismatch.")

    room_meta = db.query(models.Room).filter(models.Room.room_no == payload.target_new_room).first()
    if not room_meta:
        raise HTTPException(status_code=404, detail=f"Target Room {payload.target_new_room} matrix missing.")

    max_capacity = room_meta.total_tables * room_meta.students_per_table
    currently_allocated = db.query(models.StudentSeating).filter(models.StudentSeating.room_no == payload.target_new_room).all()

    if len(currently_allocated) >= max_capacity:
        raise HTTPException(status_code=400, detail=f"Target Room {payload.target_new_room} is at absolute density limit.")

    allocated_seats = [s.seat_no for s in currently_allocated]
    
    all_possible_seats = []
    
    column_bounds_map = {}
    if getattr(room_meta, "column_bounds", None):
        try:
            column_bounds_map = json.loads(room_meta.column_bounds)
        except Exception:
            column_bounds_map = {}

    for col in range(1, room_meta.cols + 1):
        col_key = str(col - 1)
        active_row_limit = int(column_bounds_map[col_key]) if col_key in column_bounds_map else room_meta.rows
        
        for row in range(1, active_row_limit + 1):
            if room_meta.students_per_table == 2:
                all_possible_seats.append(f"R{row}C{col}_L")
                all_possible_seats.append(f"R{row}C{col}_R")
            else:
                all_possible_seats.append(f"R{row}C{col}")
    
    broken_list = [t.strip() for t in str(room_meta.broken_tables).split(',') if t.strip()]
    available_slots = [s for s in all_possible_seats if s not in allocated_seats and s not in broken_list]

    if not available_slots:
        raise HTTPException(status_code=500, detail="No isolated coordinates available inside target room arrays.")

    student.room_no = payload.target_new_room
    student.seat_no = available_slots[0]
    student.attendance_status = "Present (Admin Swapped)"
    
    db.commit()
    return {
        "status": "success",
        "moved_student": student.name,
        "new_room": student.room_no,
        "new_seat": student.seat_no
    }


# -------------------- 3. DATA INGESTION & AI SOLVER --------------------

@router.post("/upload-bulk")
async def upload_bulk_data(
    student_file: UploadFile = File(...), 
    room_file: UploadFile = File(...),
    mode: str = Query("Single"), 
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

        if 'branch' in s_df.columns:
            s_df = s_df.sort_values(by=['branch']).reset_index(drop=True)

        is_double_mode = "double" in str(mode).lower() or "two" in str(mode).lower() or "2" in str(mode).lower()
        per_bench_count = 2 if is_double_mode else 1

        print(f"📡 [AI SOLVER INGESTION] - Ingesting configurations. Mode: {mode} (Multiply Count: {per_bench_count})")

        for _, r_data in r_df.iterrows():
            try:
                parsed_rows = int(float(str(r_data['rows']).strip()))
                parsed_cols = int(float(str(r_data['cols']).strip()))
            except Exception:
                parsed_rows = 15
                parsed_cols = 5

            calculated_tables = parsed_rows * parsed_cols
            
            db.add(models.Room(
                room_no=str(r_data['room_no']).strip(),
                floor=int(float(str(r_data.get('floor', 1)).strip() or 1)),
                total_tables=calculated_tables,
                rows=parsed_rows,
                cols=parsed_cols,
                broken_tables=str(r_data.get('broken_tables', "")).strip(),
                students_per_table=per_bench_count,
                column_bounds=""
            ))
        db.commit()

        records_list = []
        for row in s_df.to_dict('records'):
            records_list.append({
                "name": str(row.get('name', row.get('nameid', 'Unknown'))).strip(),
                "roll_no": str(row.get('roll_no', row.get('rollno', '000'))).strip(),
                "branch": str(row.get('branch', 'GEN')).strip().upper(),
                "year": str(row.get('year', '1')).strip(),
                "subject": str(row.get('subject', 'General Exam')).strip(),
                "course_id": str(row.get('course_id', row.get('subject', 'GEN_ID'))).strip(),
                "paper_group_id": str(row.get('paper_group_id', row.get('subject', 'GEN_GRP'))).strip()
            })

        return await run_solver_logic(db, "Double" if is_double_mode else "Single", is_first_upload=True, raw_student_data=records_list)

    except Exception as e:
        db.rollback()
        print(f"❌ [BULK PROCESSING CRASHED]: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Data Ingestion Fault: {str(e)}")


# -------------------- 4. SUDDEN ROOM INJECTION ENDPOINT --------------------

@router.post("/inject-room-node")
async def admin_inject_room_node(payload: RoomInjectionPayload, db: Session = Depends(connection.get_db)):
    room = db.query(models.Room).filter(models.Room.room_no == payload.room_no).first()
    
    bounds_json_str = json.dumps(payload.column_bounds) if payload.column_bounds else ""
    calculated_tables = payload.rows * payload.cols

    if room:
        room.rows = payload.rows
        room.cols = payload.cols
        room.total_tables = calculated_tables
        room.column_bounds = bounds_json_str
        msg = f"Room Module {payload.room_no} asymmetric grid overrides successfully deployed."
    else:
        room = models.Room(
            room_no=payload.room_no,
            floor=1,
            total_tables=calculated_tables,
            rows=payload.rows,
            cols=payload.cols,
            broken_tables="",
            students_per_table=2, 
            column_bounds=bounds_json_str
        )
        db.add(room)
        msg = f"New Room Vector {payload.room_no} securely injected into current database schemas."

    try:
        db.commit()
        return {"status": "success", "message": msg}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Dynamic Injection Core Fault: {str(e)}")


# -------------------- 5. REGENERATE & SOLVER ENGINE --------------------

@router.post("/regenerate-plan")
async def regenerate_plan(req: RegenerateRequest, db: Session = Depends(connection.get_db)):
    try:
        return await run_solver_logic(db, req.mode)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Regeneration Failed: {str(e)}")

async def run_solver_logic(db: Session, mode: str, is_first_upload=False, raw_student_data=None):
    current_rooms = db.query(models.Room).all()
    rooms_list = []
    
    for r in current_rooms:
        col_bounds_parsed = None
        if getattr(r, "column_bounds", None):
            try: col_bounds_parsed = json.loads(r.column_bounds)
            except Exception: col_bounds_parsed = None

        rooms_list.append({
            "room_no": r.room_no,
            "rows": r.rows,
            "cols": r.cols,
            "broken_tables": r.broken_tables,
            "students_per_table": r.students_per_table,
            "column_bounds": col_bounds_parsed 
        })

    student_records = []
    if is_first_upload and raw_student_data:
        student_records = raw_student_data
    else:
        existing = db.query(models.StudentSeating).order_by(models.StudentSeating.branch).all()
        for s in existing:
            student_records.append({
                "name": s.name,
                "roll_no": s.roll_no,
                "branch": s.branch,
                "year": s.year,
                "subject": s.subject,
                "course_id": s.subject,
                "paper_group_id": s.paper_group_id
            })

    if not student_records:
        raise HTTPException(400, "No student registry found.")

    try:
        assignments = solve_seating(student_records, rooms_list, mode=mode)
    except Exception as solver_err:
        print(f"❌ [CRITICAL MATRIX SOLVER ENGINE EXCEPTION]: {str(solver_err)}")
        raise HTTPException(status_code=500, detail=f"Solver Constraint Error: {str(solver_err)}")
    
    db.query(models.StudentSeating).delete()
    db.commit()

    new_records = []
    for s in assignments:
        qr_content = f"RBU|{s['roll_no']}|{s['assigned_room']}|{s.get('assigned_seat')}"
        qr = qrcode.make(qr_content)
        buf = io.BytesIO()
        qr.save(buf, format="PNG")
        qr_base64 = base64.b64encode(buf.getvalue()).decode()

        # 👑 STSTRICT FIELD MAPPING FIX: Ensuring absolute data alignment
        new_records.append(models.StudentSeating(
            name=str(s.get('name', 'Unknown')),
            roll_no=str(s.get('roll_no', '000')),
            branch=str(s.get('branch', 'GEN')),
            year=str(s.get('year', '1')),
            subject=str(s.get('subject', 'General Exam')),
            paper_group_id=str(s.get('paper_group_id', s.get('subject', 'GEN_GRP'))),
            room_no=str(s.get('assigned_room', 'N/A')),
            seat_no=str(s.get('assigned_seat', 'N/A')),
            shift=str(s.get('shift', 'Morning')),
            exam_time=str(s.get('exam_time', '09:30 AM')),
            attendance_status="Absent", 
            qr_code=f"data:image/png;base64,{qr_base64}"
        ))

    try:
        db.add_all(new_records)
        db.commit()
        return {"status": "success", "count": len(assignments)}
    except Exception as db_commit_err:
        db.rollback()
        print(f"❌ [DATABASE COMMIT ERROR] - Field structure overflow: {str(db_commit_err)}")
        raise HTTPException(status_code=500, detail=f"SQL Compilation Mismatch Node: {str(db_commit_err)}")


# -------------------- 6. ANALYTICS & INFRASTRUCTURE --------------------

@router.get("/analytics")
async def get_analytics(db: Session = Depends(connection.get_db)):
    total = db.query(models.StudentSeating).count()
    present = db.query(models.StudentSeating).filter(models.StudentSeating.attendance_status == "Present").count()
    rooms = db.query(models.Room).all()
    
    room_stats = []
    for r in rooms:
        students_in_room = db.query(models.StudentSeating).filter(models.StudentSeating.room_no == r.room_no).all()
        
        column_bounds_dict = {}
        if getattr(r, "column_bounds", None):
            try: column_bounds_dict = json.loads(r.column_bounds)
            except Exception: column_bounds_dict = {}

        room_stats.append({
            "name": f"Room {r.room_no}",
            "room_no": r.room_no,
            "count": len(students_in_room),
            "capacity": r.total_tables,
            "students_per_bench": r.students_per_table,
            "broken": len([t for t in r.broken_tables.split(',') if t.strip()]),
            "broken_tables": r.broken_tables,
            "rows": r.rows,
            "cols": r.cols,
            "column_bounds": column_bounds_dict, 
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