from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from ..database import models, connection

router = APIRouter(prefix="/api/invigilator", tags=["Invigilator Core Control Subsystem"])

# --- 📋 DATA INGESTION PARSERS (Pydantic Models) ---
class ScanAttendanceRequest(BaseModel):
    roll_no: str

class FlagBrokenRequest(BaseModel):
    student_id: int
    room_no: str


# 📡 NODE 1: Get complete room statistics and candidates list assigned to invigilator
@router.get("/dashboard-stream/{room_no}")
def get_room_integrity_stream(room_no: str, db: Session = Depends(connection.get_db)):
    print(f"📡 [INTEGRITY GATEWAY] - Invigilator fetching realtime metrics for Room: {room_no}")
    
    students = db.query(models.StudentSeating).filter(models.StudentSeating.room_no == room_no).all()
    room_meta = db.query(models.Room).filter(models.Room.room_no == room_no).first()

    # Fallback configuration parameter optimization mapping for empty DB presentation
    total_seats = (room_meta.total_tables * room_meta.students_per_table) if room_meta else 40
    floor_no = room_meta.floor if room_meta else 1

    total_candidates = len(students)
    verified_present = len([s for s in students if s.attendance_status in ["Verified", "Present", "Present (Admin Swapped)"]])
    flagged_absent = total_candidates - verified_present
    broken_chairs_count = len([s for s in students if getattr(s, 'is_chair_broken', False) == True])

    return {
        "room_metrics": {
            "room_no": room_no,
            "floor": floor_no,
            "total_seats": total_seats,
            "allocated_candidates": total_candidates,
            "verified_count": verified_present,
            "absent_count": flagged_absent,
            "broken_chairs_count": broken_chairs_count,
            "integrity_index": f"{int((verified_present/total_candidates)*100)}%" if total_candidates > 0 else "100%"
        },
        "registry": [
            {
                "id": s.id,
                "name": s.name,
                "roll_no": s.roll_no,
                "branch": s.branch,
                "seat_no": s.seat_no,
                "attendance_status": s.attendance_status,
                "paper_group_id": s.paper_group_id,
                "is_chair_broken": getattr(s, 'is_chair_broken', False),
                "incident_logs": getattr(s, 'incident_logs', "")
            } for s in students
        ]
    }


# 🔐 NODE 2: Direct Manual Override Verification (If student QR camera fails)
@router.patch("/override-attendance/{student_id}")
def manual_attendance_override(student_id: int, data: dict, db: Session = Depends(connection.get_db)):
    target_status = data.get("status", "Verified")
    student = db.query(models.StudentSeating).filter(models.StudentSeating.id == student_id).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Candidate lookup failed in memory block.")
        
    student.attendance_status = target_status
    db.commit()
    print(f"🔓 [INTEGRITY OVERRIDE] - Candidate {student.roll_no} status forced to: {target_status}")
    return {"status": "success", "message": f"Identity status updated to {target_status}."}


# 🔍 NODE 3: GATE SCANNER ENDPOINT (Marks Present when student enters room)
@router.post("/scan-gate/{room_no}")
def verify_entrance_scan(room_no: str, payload: ScanAttendanceRequest, db: Session = Depends(connection.get_db)):
    student = db.query(models.StudentSeating).filter(
        models.StudentSeating.roll_no == payload.roll_no.strip().upper(),
        models.StudentSeating.room_no == room_no
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Identity Mismatch: Candidate not allocated to this classroom node.")
    
    if getattr(student, 'is_chair_broken', False):
        raise HTTPException(status_code=423, detail="Infrastructure Failure: Assigned seat coordinate is structurally broken. Standby for Admin Reroute.")

    student.attendance_status = "Present"
    db.commit()
    print(f"🔍 [GATE SCANNED] - Candidate {student.roll_no} marked PRESENT via entry gate interface.")
    return {"status": "success", "message": f"Verified: {student.name} marked Present.", "student_name": student.name}


# ⚠️ NODE 4: FLAG BROKEN CHAIR (Locks Node & Pushes Alert To Admin Terminal)
@router.post("/flag-broken-seat")
def flag_compromised_seat(payload: FlagBrokenRequest, db: Session = Depends(connection.get_db)):
    student = db.query(models.StudentSeating).filter(models.StudentSeating.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Candidate index mapping lookup failed.")

    # Mutating structural integrity states safely
    student.is_chair_broken = True
    student.attendance_status = "Pending Admin Reroute"
    
    # Writing audit trail notification log string for System Admin to review
    student.incident_logs = f"CRITICAL: Seat {student.seat_no} confirmed broken in Room {payload.room_no}. Identity hold deployed. Awaiting explicit administrative relocation swap."
    
    db.commit()
    print(f"🚨 [INFRASTRUCTURE ALERT] - Anomaly flagged by Invigilator on Room {payload.room_no} Seat {student.seat_no}.")
    return {"status": "flagged", "message": "Fault pipeline broadcast successfully loaded for Admin Terminal review."}