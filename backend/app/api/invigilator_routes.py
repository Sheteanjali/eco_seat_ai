# File: backend/app/api/invigilator_routes.py



from typing import List, Optional, Dict, Any, Set



from fastapi import (

    APIRouter,

    Depends,

    HTTPException,

    Query,

    status,

)

from pydantic import BaseModel, ConfigDict

from sqlalchemy.orm import Session



try:

    from ..database import get_db, models

except ImportError:

    from ..database.connection import get_db

    from ..database import models





router = APIRouter(

    prefix="/api/invigilator",

    tags=["Invigilator Core Deck"],

)





# ============================================================

# SCHEMAS

# ============================================================



class GateScanVerification(BaseModel):

    roll_no: str
    actor_username: Optional[str] = None





class FlagInfrastructureFault(BaseModel):

    room_no: str
    table_id: str
    actor_username: Optional[str] = None





class AttendanceToggleRequest(BaseModel):

    roll_no: str
    status: str
    room_no: Optional[str] = None
    actor_username: Optional[str] = None





class RoomSchema(BaseModel):

    room_no: str

    floor: str

    total_tables: int

    capacity: int



    model_config = ConfigDict(

        from_attributes=True

    )





class StudentRegistrySchema(BaseModel):

    id: int

    table_no: str

    seat_no: str

    name: str

    roll_no: str

    branch: str

    year: str

    subject: str

    attendance_status: str

    is_chair_broken: bool

    incident_logs: str





class RoomMetricsSchema(BaseModel):

    allocated_candidates: int

    verified_count: int

    absent_count: int

    broken_chairs_count: int

    total_seats: int

    integrity_index: str





class DashboardStreamResponse(BaseModel):

    room_no: str

    room_metrics: RoomMetricsSchema

    registry: List[StudentRegistrySchema]





class GateScanResponse(BaseModel):

    success: bool

    message: str

    student_name: str

    assigned_seat: str





class ToggleAttendanceResponse(BaseModel):

    status: str

    roll_no: str

    new_status: str





class FlagBrokenSeatResponse(BaseModel):

    status: str

    message: str

    affected_count: int





class ExportDataResponse(BaseModel):

    count: int

    total: int

    room_no: str

    students: List[Dict[str, Any]]





# ============================================================

# HELPER FUNCTIONS

# ============================================================



def normalize_room_no(room_no: str) -> str:

    """

    Normalize room number before DB comparison.



    Example:

        " 101 " -> "101"

    """



    return str(room_no or "").strip()





def calculate_room_capacity(room) -> int:

    """

    Returns configured room capacity.



    If capacity is missing/zero, calculate it from:

        total_tables * students_per_table

    """



    total_tables = int(

        getattr(room, "total_tables", 0) or 0

    )



    students_per_table = int(

        getattr(room, "students_per_table", 2) or 2

    )



    configured_capacity = int(

        getattr(room, "capacity", 0) or 0

    )



    if configured_capacity > 0:

        return configured_capacity



    return total_tables * students_per_table





def get_room_or_404(

    db: Session,

    room_no: str,

):

    """

    Fetch room structural metadata or return

    a clear 404 error.

    """



    target_room = normalize_room_no(room_no)



    if not target_room:

        raise HTTPException(

            status_code=status.HTTP_400_BAD_REQUEST,

            detail="Room number is required.",

        )



    room = (

        db.query(models.Room)

        .filter(

            models.Room.room_no == target_room

        )

        .first()

    )



    if not room:

        raise HTTPException(

            status_code=status.HTTP_404_NOT_FOUND,

            detail=(

                f"Room {target_room} structural "

                "metadata not found. Configure this "

                "room from Admin before using the "

                "Invigilator Dashboard."

            ),

        )



    return room





# ============================================================

# GET ACTIVE ROOMS

# ============================================================



@router.get(

    "/rooms",

    response_model=List[RoomSchema],

    summary="Get Active Examination Rooms",

)

async def get_all_active_rooms(

    db: Session = Depends(get_db),

):

    """

    Returns all configured examination rooms.

    """



    rooms = (

        db.query(models.Room)

        .order_by(models.Room.room_no)

        .all()

    )



    payload: List[RoomSchema] = []



    for room in rooms:



        payload.append(

            RoomSchema(

                room_no=str(room.room_no),

                floor=str(

                    getattr(room, "floor", 1) or 1

                ),

                total_tables=int(

                    getattr(

                        room,

                        "total_tables",

                        0,

                    )

                    or 0

                ),

                capacity=calculate_room_capacity(

                    room

                ),

            )

        )



    return payload





# ============================================================

# REAL-TIME INVIGILATOR DASHBOARD

# ============================================================



@router.get(

    "/dashboard-stream/{room_no}",

    response_model=DashboardStreamResponse,

    summary="Get Realtime Room Telemetry Matrix",

)

async def get_room_stream_matrix(

    room_no: str,

    db: Session = Depends(get_db),

):

    """

    Returns room information, student registry and

    attendance metrics for one examination room.

    """



    target_room = normalize_room_no(room_no)



    room_meta = get_room_or_404(

        db,

        target_room,

    )



    students_in_room = (

        db.query(models.StudentSeating)

        .filter(

            models.StudentSeating.room_no

            == target_room

        )

        .all()

    )



    total_allocated = len(

        students_in_room

    )



    verified_present = sum(

        1

        for student in students_in_room

        if "Present"

        in (

            student.attendance_status

            or ""

        )

    )



    pending_reroutes = sum(

        1

        for student in students_in_room

        if (

            student.attendance_status

            == "Pending Admin Reroute"

        )

    )



    max_physical_capacity = (

        calculate_room_capacity(

            room_meta

        )

    )



    registry_payload = []



    for student in students_in_room:



        seat_str = str(

            student.seat_no or ""

        )



        if "_" in seat_str:

            table_label = (

                seat_str.split("_")[0]

            )

        else:

            table_label = seat_str



        attendance = (

            student.attendance_status

            or "Absent"

        )



        registry_payload.append(

            StudentRegistrySchema(

                id=int(

                    getattr(

                        student,

                        "id",

                        0,

                    )

                    or 0

                ),

                table_no=table_label,

                seat_no=seat_str,

                name=str(

                    student.name or ""

                ),

                roll_no=str(

                    student.roll_no or ""

                ),

                branch=str(

                    getattr(

                        student,

                        "branch",

                        "GEN",

                    )

                    or "GEN"

                )

                .strip()

                .upper(),

                year=str(

                    getattr(

                        student,

                        "year",

                        "N/A",

                    )

                    or "N/A"

                ),

                subject=str(

                    getattr(

                        student,

                        "subject",

                        "N/A",

                    )

                    or "N/A"

                ),

                attendance_status=attendance,

                is_chair_broken=(

                    attendance

                    == "Pending Admin Reroute"

                ),

                incident_logs=str(

                    getattr(

                        student,

                        "incident_logs",

                        "",

                    )

                    or ""

                ),

            )

        )



    registry_payload.sort(

        key=lambda item: (

            item.table_no,

            item.roll_no,

        )

    )



    if total_allocated > 0:



        integrity_value = round(

            (

                verified_present

                / total_allocated

            )

            * 100,

            1,

        )



        integrity_pct = (

            f"{integrity_value}%"

        )



    else:

        integrity_pct = "0%"



    return DashboardStreamResponse(

        room_no=target_room,

        room_metrics=RoomMetricsSchema(

            allocated_candidates=(

                total_allocated

            ),

            verified_count=(

                verified_present

            ),

            absent_count=max(

                0,

                total_allocated

                - verified_present

                - pending_reroutes,

            ),

            broken_chairs_count=(

                pending_reroutes

            ),

            total_seats=(

                max_physical_capacity

            ),

            integrity_index=(

                integrity_pct

            ),

        ),

        registry=registry_payload,

    )





# ============================================================

# CHECKPOINT / QR GATE SCAN

# ============================================================



@router.post(

    "/scan-gate/{room_no}",

    response_model=GateScanResponse,

    summary="Process Checkpoint Gate Scan",

)

async def process_checkpoint_gate_scan(

    room_no: str,

    payload: GateScanVerification,

    db: Session = Depends(get_db),

):

    """

    Validate a candidate against the assigned room

    and mark the candidate Present.

    """



    target_room = normalize_room_no(

        room_no

    )



    # Room must exist

    get_room_or_404(

        db,

        target_room,

    )



    target_roll = (

        payload.roll_no

        .strip()

        .upper()

    )



    if not target_roll:

        raise HTTPException(

            status_code=status.HTTP_400_BAD_REQUEST,

            detail="Candidate roll number is required.",

        )



    student = (

        db.query(models.StudentSeating)

        .filter(

            models.StudentSeating.roll_no

            == target_roll

        )

        .first()

    )



    if not student:

        raise HTTPException(

            status_code=status.HTTP_404_NOT_FOUND,

            detail=(

                "Identity Token Refused: "

                f"Candidate {target_roll} "

                "not found in master database."

            ),

        )



    student_room = normalize_room_no(

        student.room_no

    )



    if student_room != target_room:



        raise HTTPException(

            status_code=status.HTTP_400_BAD_REQUEST,

            detail=(

                "Access Denied: Candidate "

                f"{target_roll} is assigned "

                f"to Room {student_room}, "

                f"not Room {target_room}."

            ),

        )



    if (

        student.attendance_status

        == "Pending Admin Reroute"

    ):



        raise HTTPException(

            status_code=status.HTTP_400_BAD_REQUEST,

            detail=(

                "Access Denied: Assigned seat "

                "coordinate is marked broken. "

                "Awaiting Admin reroute."

            ),

        )



    student.attendance_status = "Present"

    db.add(models.ActionLog(
        actor_role="invigilator",
        actor_username=(payload.actor_username or "invigilator").strip(),
        action_type="candidate_verified",
        room_no=target_room,
        roll_no=str(student.roll_no),
        message=f"Candidate {student.roll_no} verified and marked Present at Seat {student.seat_no}.",
    ))

    try:



        db.commit()

        db.refresh(student)



        return GateScanResponse(

            success=True,

            message=(

                "Handshake verified. "

                f"{student.name} "

                f"({student.roll_no}) "

                "registered Present at "

                f"Seat {student.seat_no}."

            ),

            student_name=str(

                student.name

            ),

            assigned_seat=str(

                student.seat_no

            ),

        )



    except Exception as exc:



        db.rollback()



        raise HTTPException(

            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,

            detail=(

                "Database update failed "

                "during scan verification."

            ),

        ) from exc





# ============================================================

# MANUAL ATTENDANCE UPDATE

# ============================================================



@router.patch(

    "/toggle-attendance",

    response_model=ToggleAttendanceResponse,

    summary="Toggle Candidate Attendance",

)

async def toggle_student_attendance(

    payload: AttendanceToggleRequest,

    db: Session = Depends(get_db),

):

    """

    Manually update one candidate's attendance.

    """



    target_roll = (

        payload.roll_no

        .strip()

        .upper()

    )



    if not target_roll:



        raise HTTPException(

            status_code=status.HTTP_400_BAD_REQUEST,

            detail="Candidate roll number is required.",

        )



    requested_status = (

        payload.status

        .strip()

    )



    if not requested_status:



        raise HTTPException(

            status_code=status.HTTP_400_BAD_REQUEST,

            detail="Attendance status is required.",

        )



    student = (

        db.query(models.StudentSeating)

        .filter(

            models.StudentSeating.roll_no

            == target_roll

        )

        .first()

    )



    if not student:



        raise HTTPException(

            status_code=status.HTTP_404_NOT_FOUND,

            detail=(

                f"Candidate {target_roll} "

                "not found in seating database."

            ),

        )



    if payload.room_no and normalize_room_no(student.room_no) != normalize_room_no(payload.room_no):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Candidate is not allocated to this invigilator room.",
        )

    student.attendance_status = requested_status

    db.add(models.ActionLog(
        actor_role="invigilator",
        actor_username=(payload.actor_username or "invigilator").strip(),
        action_type="attendance_updated",
        room_no=normalize_room_no(student.room_no),
        roll_no=str(student.roll_no),
        message=f"Attendance for {student.roll_no} changed to {requested_status}.",
    ))

    try:



        db.commit()

        db.refresh(student)



        return ToggleAttendanceResponse(

            status="success",

            roll_no=str(

                student.roll_no

            ),

            new_status=str(

                student.attendance_status

            ),

        )



    except Exception as exc:



        db.rollback()



        raise HTTPException(

            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,

            detail=(

                "Failed to update attendance "

                "status in database."

            ),

        ) from exc





# ============================================================

# BROKEN TABLE / SEAT MANAGEMENT

# ============================================================



@router.post(
    "/flag-broken-seat",
    response_model=FlagBrokenSeatResponse,
    summary="Flag Broken Seat and Reassign Inside Same Room",
)
async def invigilator_flag_broken_seat(
    payload: FlagInfrastructureFault,
    db: Session = Depends(get_db),
):
    """Mark a table broken. Affected candidates are moved to the
    first empty, non-broken seat in the SAME assigned room."""
    target_room = normalize_room_no(payload.room_no)
    target_table = payload.table_id.strip().upper()
    if not target_table:
        raise HTTPException(status_code=400, detail="Table ID is required.")

    room = get_room_or_404(db, target_room)
    broken_set = {
        x.strip().upper()
        for x in str(getattr(room, "broken_tables", "") or "").split(",")
        if x.strip()
    }
    broken_set.add(target_table)
    room.broken_tables = ",".join(sorted(broken_set))

    students = db.query(models.StudentSeating).filter(
        models.StudentSeating.room_no == target_room
    ).all()
    affected = [
        s for s in students
        if str(s.seat_no or "").upper().startswith(target_table)
    ]
    occupied = {
        str(s.seat_no).upper()
        for s in students
        if s not in affected and s.seat_no
    }

    rows_count = int(getattr(room, "rows", 0) or 0)
    cols_count = int(getattr(room, "cols", 0) or 0)
    students_per_table = int(getattr(room, "students_per_table", 2) or 2)
    available = []

    for row_index in range(1, rows_count + 1):
        for column_index in range(1, cols_count + 1):
            table = f"R{row_index}C{column_index}"
            if table in broken_set:
                continue
            seats = [f"{table}_L", f"{table}_R"] if students_per_table == 2 else [table]
            for seat in seats:
                if seat.upper() not in occupied:
                    available.append(seat)

    moved, pending = [], []
    for student in affected:
        old_seat = str(student.seat_no or "")
        if available:
            new_seat = available.pop(0)
            student.seat_no = new_seat
            student.incident_logs = (
                f"Invigilator moved candidate from broken seat {old_seat} "
                f"to available seat {new_seat} in Room {target_room}."
            )
            moved.append(f"{student.roll_no}: {old_seat} -> {new_seat}")
            db.add(models.ActionLog(
                actor_role="invigilator",
                actor_username=(payload.actor_username or "invigilator").strip(),
                action_type="seat_reassigned",
                room_no=target_room,
                roll_no=str(student.roll_no),
                message=f"{student.roll_no} moved from {old_seat} to {new_seat} after {target_table} was reported broken.",
            ))
        else:
            student.incident_logs = (
                f"Broken seat {old_seat} reported in Room {target_room}; "
                "no empty valid seat is currently available."
            )
            pending.append(str(student.roll_no))

    db.add(models.ActionLog(
        actor_role="invigilator",
        actor_username=(payload.actor_username or "invigilator").strip(),
        action_type="broken_seat_reported",
        room_no=target_room,
        message=f"{target_table} marked broken. {len(moved)} candidate(s) reassigned; {len(pending)} pending.",
    ))

    try:
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to save broken-seat update.") from exc

    detail = f"{target_table} marked broken."
    if moved:
        detail += " Reassigned: " + "; ".join(moved) + "."
    if pending:
        detail += " No empty seat for: " + ", ".join(pending) + "."

    return FlagBrokenSeatResponse(
        status="success",
        message=detail,
        affected_count=len(affected),
    )


# ============================================================

# EXPORT ROOM DATA

# ============================================================



@router.get(

    "/export-data",

    response_model=ExportDataResponse,

    summary="Get Filtered Seating Export Registry",

)

async def get_export_registry_data(

    room_no: Optional[str] = Query(None),

    branch: Optional[str] = Query(None),

    year: Optional[str] = Query(None),

    subject: Optional[str] = Query(None),

    db: Session = Depends(get_db),

):

    """

    Returns filtered seating data for export.

    """



    query = db.query(

        models.StudentSeating

    )



    normalized_room = (

        normalize_room_no(room_no)

        if room_no

        else None

    )



    if (

        normalized_room

        and normalized_room != "All"

    ):

        query = query.filter(

            models.StudentSeating.room_no

            == normalized_room

        )



    if (

        branch

        and branch != "All"

    ):



        query = query.filter(

            models.StudentSeating.branch.ilike(

                branch.strip()

            )

        )



    if (

        year

        and year != "All"

    ):



        query = query.filter(

            models.StudentSeating.year

            == str(year).strip()

        )



    if (

        subject

        and subject != "All"

    ):



        query = query.filter(

            models.StudentSeating.subject.ilike(

                subject.strip()

            )

        )



    results = query.all()



    students_payload = []



    for student in results:



        students_payload.append(

            {

                "roll_no": str(

                    student.roll_no or ""

                ),

                "name": str(

                    student.name or ""

                ),

                "branch": str(

                    getattr(

                        student,

                        "branch",

                        "GEN",

                    )

                    or "GEN"

                )

                .strip()

                .upper(),

                "year": str(

                    getattr(

                        student,

                        "year",

                        "N/A",

                    )

                    or "N/A"

                ),

                "subject": str(

                    getattr(

                        student,

                        "subject",

                        "N/A",

                    )

                    or "N/A"

                ),

                "room_no": str(

                    student.room_no or ""

                ),

                "seat_no": str(

                    student.seat_no or ""

                ),

                "shift": str(

                    getattr(

                        student,

                        "shift",

                        "Morning",

                    )

                    or "Morning"

                ),

                "attendance_status": str(

                    student.attendance_status

                    or "Absent"

                ),

                "incident_logs": str(

                    getattr(

                        student,

                        "incident_logs",

                        "",

                    )

                    or ""

                ),

            }

        )



    return ExportDataResponse(

        count=len(results),

        total=len(results),

        room_no=(

            normalized_room

            if normalized_room

            else "All"

        ),

        students=students_payload,

    )