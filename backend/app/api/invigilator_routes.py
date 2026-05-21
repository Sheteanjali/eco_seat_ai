from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

# Project Database Imports
from ..database import models, connection

router = APIRouter(prefix="/api/invigilator", tags=["Invigilator Core Deck"])

# -------------------- SCHEMAS --------------------

class GateScanVerification(BaseModel):
    roll_no: str

class FlagInfrastructureFault(BaseModel):
    room_no: str
    table_id: str

# -------------------- ENDPOINTS --------------------

@router.get("/dashboard-stream/{room_no}")
async def get_room_stream_matrix(
    room_no: str, 
    db: Session = Depends(connection.get_db)
):
    """
    Fetches real-time student allocations and dynamic capacity telemetry 
    metrics for the specified examination hall node.
    """
    room_meta = db.query(models.Room).filter(models.Room.room_no == room_no).first()
    if not room_meta:
        # Fallback dictionary metadata signature to prevent frontend compilation crash
        return {
            "room_metrics": {
                "allocated_candidates": 0,
                "verified_count": 0,
                "absent_count": 0,
                "broken_chairs_count": 0,
                "total_seats": 75,
                "integrity_index": "0%"
            },
            "registry": []
        }

    # Fetch active student variables allocated to this room code
    students_in_room = db.query(models.StudentSeating).filter(
        models.StudentSeating.room_no == room_no
    ).all()

    # Compute operational telemetry counter blocks
    total_allocated = len(students_in_room)
    verified_present = len([s for s in students_in_room if s.attendance_status == "Present"])
    pending_reroutes = len([s for s in students_in_room if s.attendance_status == "Pending Admin Reroute"])
    
    # Structural capacity multiplication boundaries matching frontend single vs double parameters
    max_physical_capacity = room_meta.total_tables * room_meta.students_per_table
    
    # Explicit mapping schema to parse records safely inside the frontend interactive map layout grid
    registry_payload = []
    for s in students_in_room:
        # Determine unique table index from seat string tokens dynamically (e.g., "R2C3_L" -> "T" base)
        seat_str = str(s.seat_no)
        table_label = seat_str.split("_")[0] if "_" in seat_str else seat_str
        
        registry_payload.append({
            "id": s.id,
            "table_no": table_label,
            "seat_no": s.seat_no,
            "name": s.name,
            "roll_no": s.roll_no,
            "branch": str(s.branch).strip().upper(),
            "attendance_status": s.attendance_status,
            "is_chair_broken": s.attendance_status == "Pending Admin Reroute",
            "incident_logs": getattr(s, "incident_logs", "")
        })

    # Sort registry based on exact structural table tracking indices to align left/right pairs sequentially
    registry_payload.sort(key=lambda x: x["table_no"])

    return {
        "room_metrics": {
            "allocated_candidates": total_allocated,
            "verified_count": verified_present,
            "absent_count": max(0, total_allocated - verified_present - pending_reroutes),
            "broken_chairs_count": pending_reroutes,
            "total_seats": max_physical_capacity,
            "integrity_index": f"{round((verified_present / total_allocated) * 100, 1)}%" if total_allocated > 0 else "0%"
        },
        "registry": registry_payload
    }


@router.post("/scan-gate/{room_no}")
async def process_checkpoint_gate_scan(
    room_no: str,
    payload: GateScanVerification,
    db: Session = Depends(connection.get_db)
):
    """
    Executes an explicit identity validation loop at the entry checkpoint gate.
    Marks student present only if security parameters match.
    """
    target_roll = payload.roll_no.strip().upper()
    
    # Lookup query validation inside shared seating data frames
    student = db.query(models.StudentSeating).filter(
        models.StudentSeating.roll_no == target_roll,
        models.StudentSeating.room_no == room_no
    ).first()

    if not student:
        raise HTTPException(
            status_code=404, 
            detail=f"Identity Token Refused: Candidate {target_roll} not mapped inside Room {room_no} environment registry."
        )

    # Infrastructure status validation check before allowing access lock out
    if student.attendance_status == "Pending Admin Reroute":
        raise HTTPException(
            status_code=400,
            detail="Access Denied: Assigned workspace coordinate is damaged. Awaiting Admin structural allocation override."
        )

    # Complete the verification state check out
    student.attendance_status = "Present"
    try:
        db.commit()
        return {
            "success": True,
            "message": f"Handshake verified. {student.name} ({student.branch}) registered Present at Seat {student.seat_no}.",
            "student_name": student.name,
            "assigned_seat": student.seat_no
        }
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database write interruption. Check network tunnel nodes.")


@router.post("/flag-broken-seat")
async def invigilator_flag_broken_seat(
    payload: FlagInfrastructureFault,
    db: Session = Depends(connection.get_db)
):
    """
    🚨 ASYNCHRONOUS NOTIFICATION SUBSYSTEM:
    Flags a physical bench coordinate as broken. Automatically locks out 
    and cascades alert signals for all candidates sharing that exact table node workspace.
    """
    target_room = payload.room_no.strip()
    target_table = payload.table_id.strip() # Extracting coordinate layout string tokens (e.g. "R1C2")

    # 1. Update the database 'Room' model broken metadata strings to alert the AI Solver loop
    room = db.query(models.Room).filter(models.Room.room_no == target_room).first()
    if not room:
        raise HTTPException(status_code=404, detail=f"Room {target_room} structural metadata grid missing.")

    broken_set = set(t.strip() for t in str(room.broken_tables).split(',') if t.strip())
    broken_set.add(target_table)
    room.broken_tables = ",".join(filter(None, broken_set))

    # 2. Mutate state parameters for all students seated at this shared table index node
    # Uses SQL Wildcard pattern matching ('R1C2%') to securely trap both Left (_L) and Right (_R) candidate indices
    affected_candidates = db.query(models.StudentSeating).filter(
        models.StudentSeating.room_no == target_room,
        models.StudentSeating.seat_no.like(f"{target_table}%")
    ).all()

    if not affected_candidates:
        # If table is empty at execution time, commit infrastructure update and return safely
        db.commit()
        return {
            "status": "success",
            "message": f"Empty workspace {target_table} in Room {target_room} marked broken. Admin solver updated.",
            "affected_count": 0
        }

    # Lock student objects inside 'Pending Admin Reroute' loop state
    for student in affected_candidates:
        student.attendance_status = "Pending Admin Reroute"
        student.incident_logs = f"CRITICAL: Workspace table coordinate node {target_table} reported broken inside Room {target_room} boundary matrix."

    try:
        db.commit()
        print(f"🚨 [REAL-TIME INFRA FAULT] - Dispatched {len(affected_candidates)} candidate nodes from table {target_table} into Admin dispatch log buffers.")
        return {
            "status": "success",
            "message": f"Infrastructure failure locked. {len(affected_candidates)} student variables pushed to Admin dashboard terminal alerts queue.",
            "affected_count": len(affected_candidates)
        }
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Transactional state commit failed. Rollback deployed.")