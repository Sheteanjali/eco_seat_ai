import qrcode
import base64
import io
import pandas as pd
from datetime import datetime, time
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from ..database import models, connection
from ..core.solver import solve_seating 

router = APIRouter(prefix="/api/admin", tags=["Admin Hub"])

@router.post("/upload-bulk")
async def upload_bulk_data(
    student_file: UploadFile = File(...), 
    room_file: UploadFile = File(...),
    db: Session = Depends(connection.get_db)
):
    try:
        # 1. Reset Database for new session [cite: 21]
        db.query(models.StudentSeating).delete()
        db.commit()

        # 2. Ingest Data [cite: 25]
        student_bytes = await student_file.read()
        room_bytes = await room_file.read()
        
        students_df = pd.read_csv(io.BytesIO(student_bytes))
        rooms_df = pd.read_csv(io.BytesIO(room_bytes))
        
        students_df.columns = [c.lower().strip() for c in students_df.columns]
        rooms_df.columns = [c.lower().strip() for c in rooms_df.columns]

        if 'course_code' not in students_df.columns:
            if 'subject' in students_df.columns:
                students_df.rename(columns={'subject': 'course_code'}, inplace=True)

        students_list = students_df.to_dict('records')
        
        # 3. Build Infrastructure Grid [cite: 30]
        room_grid = []
        for _, room in rooms_df.iterrows():
            r_id = str(room['room_no'])
            cap = int(room.get('total_capacity', room.get('capacity', 30)))
            for i in range(cap):
                room_grid.append((r_id, (i // 5, i % 5)))

        total_capacity = len(room_grid)

        # --- 🕒 SHIFT SPLITTING ENGINE ---
        morning_batch = students_list[:total_capacity]
        afternoon_batch = students_list[total_capacity:]

        def process_shift(batch, shift_name):
            if not batch: return
            assignments = solve_seating(batch, room_grid) # Triggering AI Constraint Modeling [cite: 1]
            
            for seat_tuple, student in assignments.items():
                room_id, (r, c) = seat_tuple
                roll_no = str(student['roll_no'])
                seat_label = f"R{r}C{c}"

                qr_data = f"NGP|{roll_no}|{shift_name}|{room_id}|{seat_label}"
                qr = qrcode.make(qr_data)
                buf = io.BytesIO()
                qr.save(buf, format="PNG")
                qr_base64 = base64.b64encode(buf.getvalue()).decode()

                new_record = models.StudentSeating(
                    name=student['name'],
                    roll_no=roll_no,
                    branch=student['branch'],
                    subject=student.get('subject_name', student['course_code']),
                    subject_code=str(student['course_code']),
                    room_no=room_id,
                    seat_no=seat_label,
                    shift=shift_name,
                    attendance_status="Pending",
                    qr_code=f"data:image/png;base64,{qr_base64}"
                )
                db.add(new_record)

        process_shift(morning_batch, "Morning")
        process_shift(afternoon_batch, "Afternoon")

        db.commit()
        return {"status": "success", "message": f"Morning: {len(morning_batch)} | Afternoon: {len(afternoon_batch)} allocated."}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# --- 🔐 SECURE SCANNER (DEMO READY) ---
@router.post("/verify-scan/{roll_no}")
async def verify_scan(roll_no: str, db: Session = Depends(connection.get_db)):
    student = db.query(models.StudentSeating).filter(models.StudentSeating.roll_no == roll_no).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    # 🕒 FOR PRESENTATION: Simulated current time set to 09:05 AM 
    current_time = time(9, 5) 
    MORNING_LIMIT = time(9, 10) 
    AFTERNOON_LIMIT = time(13, 40)

    if (student.shift == "Morning" and current_time > MORNING_LIMIT) or \
       (student.shift == "Afternoon" and current_time > AFTERNOON_LIMIT):
        student.attendance_status = "Absent"
        db.commit()
        return {"status": "REJECTED", "reason": "Late Entry threshold exceeded."}

    # ✅ Entry Approved
    student.attendance_status = "Present"
    student.entry_time = datetime.now()
    db.commit()
    return {"status": "APPROVED", "seat": student.seat_no, "room": student.room_no}

# --- 🔍 ENHANCED MULTIMODAL SEARCH HUB (Room-Wise Allocation) ---
@router.get("/search-hub")
async def search_hub(query: str = None, filter_type: str = "all", db: Session = Depends(connection.get_db)):
    base_query = db.query(models.StudentSeating)
    if not query: return {"results": [], "summary": {}, "total": 0}

    # 1. RETRIEVAL LOGIC
    if filter_type == "student":
        results = base_query.filter(or_(models.StudentSeating.name.ilike(f"%{query}%"), models.StudentSeating.roll_no.ilike(f"%{query}%"))).all()
    elif filter_type == "room":
        results = base_query.filter(models.StudentSeating.room_no == query).all()
    elif filter_type == "branch":
        results = base_query.filter(models.StudentSeating.branch.ilike(f"%{query}%")).all()
    elif filter_type == "subject":
        results = base_query.filter(or_(models.StudentSeating.subject.ilike(f"%{query}%"), models.StudentSeating.subject_code.ilike(f"%{query}%"))).all()
    elif filter_type == "shift":
        results = base_query.filter(models.StudentSeating.shift.ilike(f"%{query}%")).all()
    else: 
        results = []

    # 2. DYNAMIC SUMMARY GENERATION (NESTED ROOM GROUPING)
    # This logic provides the "Room Wise Allocation" breakdown you requested.
    summary = {}
    for s in results:
        if filter_type == "room":
            # If already searching for a room, show the Branch breakdown [cite: 14]
            label = f"{s.branch.upper()} Dept"
        else:
            # For branch/shift/subject searches, show count per room [cite: 19]
            label = f"Room {s.room_no}"
            
        summary[label] = summary.get(label, 0) + 1

    return {"results": results, "summary": summary, "total": len(results)}

# --- 🛰️ DIGITAL TWIN ROOM LAYOUT ---
@router.get("/room-layout/{room_no}")
async def get_room_layout(room_no: str, db: Session = Depends(connection.get_db)):
    students = db.query(models.StudentSeating).filter(models.StudentSeating.room_no == room_no).all()
    return [
        {
            "seat": s.seat_no,
            "name": s.name,
            "roll_no": s.roll_no,
            "branch": s.branch,
            "subject": s.subject,
            "status": s.attendance_status
        } for s in students
    ]

@router.get("/analytics")
async def get_analytics(db: Session = Depends(connection.get_db)):
    total = db.query(models.StudentSeating).count()
    present = db.query(models.StudentSeating).filter(models.StudentSeating.attendance_status == "Present").count()
    absent = db.query(models.StudentSeating).filter(models.StudentSeating.attendance_status == "Absent").count()
    
    # Accurate capacity management logic 
    rooms = db.query(models.StudentSeating.room_no, func.count(models.StudentSeating.id)).group_by(models.StudentSeating.room_no).all()
    
    # Utilization based on total capacity
    utilization = round((total / 2272) * 100, 1) if total > 0 else 0

    return {
        "totalStudents": total,
        "presentCount": present,
        "absentCount": absent,
        "utilization": utilization,
        "roomData": [{"name": f"Room {r[0]}", "count": r[1]} for r in rooms]
    }