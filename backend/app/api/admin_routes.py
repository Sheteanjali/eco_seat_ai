# File: backend/app/api/admin_routes.py



import qrcode

import base64

import io

import json

import pandas as pd



from datetime import datetime, time



from fastapi import (

    APIRouter,

    UploadFile,

    File,

    HTTPException,

    Depends,

    Query,

    Request,

    Header,

)



from sqlalchemy.orm import Session

from sqlalchemy import func, or_



from pydantic import BaseModel



from typing import (

    Optional,

    List,

    Set,

)





# ============================================================

# PROJECT DATABASE & SOLVER MODULES

# ============================================================



from ..database import models, connection



try:

    from ..database import get_db

except ImportError:

    get_db = connection.get_db



from ..core.solver import solve_seating





# ============================================================

# ROUTERS

# ============================================================



router = APIRouter(

    prefix="/api/admin",

    tags=["Admin Hub"],

)



invigilator_router = APIRouter(

    prefix="/api/invigilator",

    tags=["Invigilator Hub"],

)





# ============================================================

# SCHEMAS

# ============================================================



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





class RoomInjectionPayload(BaseModel):

    room_no: str

    rows: int

    cols: int

    column_bounds: Optional[dict] = None





class InvigilatorGateScanRequest(BaseModel):

    roll_no: str





class InvigilatorFlagSeatRequest(BaseModel):

    room_no: str

    table_id: str







# ============================================================

# HELPER FUNCTIONS

# ============================================================



def find_first_available_seat(

    room: models.Room,

    allocated_seats: Set[str],

) -> Optional[str]:



    """

    Find the first available non-broken seat

    inside the requested room.

    """



    broken_list = [

        t.strip()

        for t in str(

            room.broken_tables or ""

        ).split(",")

        if t.strip()

    ]



    column_bounds_map = {}



    if getattr(

        room,

        "column_bounds",

        None,

    ):

        try:

            column_bounds_map = json.loads(

                room.column_bounds

            )

        except Exception:

            column_bounds_map = {}



    for col in range(

        1,

        room.cols + 1,

    ):



        col_key = str(

            col - 1

        )



        active_row_limit = (

            int(

                column_bounds_map[

                    col_key

                ]

            )

            if col_key in column_bounds_map

            else room.rows

        )



        for row in range(

            1,

            active_row_limit + 1,

        ):



            table_id = (

                f"R{row}C{col}"

            )



            if table_id in broken_list:

                continue



            if (

                room.students_per_table

                == 2

            ):



                for suffix in [

                    "_L",

                    "_R",

                ]:



                    candidate_seat = (

                        f"{table_id}{suffix}"

                    )



                    if (

                        candidate_seat

                        not in allocated_seats

                    ):

                        return candidate_seat



            else:



                if (

                    table_id

                    not in allocated_seats

                ):

                    return table_id



    return None





# ============================================================

# INVIGILATOR ENDPOINTS

# ============================================================



@invigilator_router.get("/rooms")

async def get_invigilator_rooms(

    db: Session = Depends(get_db),

):

    """

    Return ONLY rooms currently configured

    in the Room table.



    These rooms come from the latest

    Admin room upload.

    """



    rooms = (

        db.query(models.Room)

        .order_by(

            models.Room.room_no

        )

        .all()

    )



    return [

        {

            "room_no": r.room_no,

            "floor": r.floor,

            "total_tables": r.total_tables,

            "capacity": (

                r.total_tables

                * r.students_per_table

            ),

        }

        for r in rooms

    ]





@invigilator_router.get(

    "/dashboard-stream/{room_no}"

)

async def get_invigilator_dashboard_stream(

    room_no: str,

    db: Session = Depends(get_db),

):

    """

    Real-time room dashboard.

    """



    normalized_room_no = str(

        room_no

    ).strip()



    room = (

        db.query(models.Room)

        .filter(

            models.Room.room_no

            == normalized_room_no

        )

        .first()

    )



    if not room:

        raise HTTPException(

            status_code=404,

            detail=(

                f"Room {normalized_room_no} "

                "is not registered in the "

                "current examination session."

            ),

        )



    students = (

        db.query(

            models.StudentSeating

        )

        .filter(

            models.StudentSeating.room_no

            == normalized_room_no

        )

        .order_by(

            models.StudentSeating.seat_no

        )

        .all()

    )



    allocated = len(students)



    verified = sum(

        1

        for s in students

        if (

            s.attendance_status

            and "Present"

            in s.attendance_status

        )

    )



    absent = sum(

        1

        for s in students

        if s.attendance_status

        == "Absent"

    )



    broken_count = len(

        [

            t

            for t in str(

                room.broken_tables or ""

            ).split(",")

            if t.strip()

        ]

    )



    integrity_index = (

        round(

            (

                verified

                / allocated

                * 100

            ),

            1,

        )

        if allocated > 0

        else 100.0

    )



    registry = [

        {

            "id": s.id,

            "name": s.name,

            "roll_no": s.roll_no,

            "branch": s.branch,

            "year": s.year,

            "subject": s.subject,

            "seat_no": s.seat_no,

            "attendance_status": (

                s.attendance_status

            ),

            "qr_code": s.qr_code,

        }

        for s in students

    ]



    return {

        "room_no": normalized_room_no,



        "room_metrics": {

            "allocated_candidates": allocated,

            "verified_count": verified,

            "absent_count": absent,

            "broken_chairs_count": broken_count,

            "integrity_index": (

                f"{integrity_index}%"

            ),

        },



        "registry": registry,

    }





@invigilator_router.post(

    "/scan-gate/{room_no}"

)

async def invigilator_gate_scan(

    room_no: str,

    payload: InvigilatorGateScanRequest,

    db: Session = Depends(get_db),

):

    """

    Verify candidate entry at

    the examination room.

    """



    normalized_room_no = str(

        room_no

    ).strip()



    # Room must exist in current

    # Admin-uploaded Room table.



    room = (

        db.query(models.Room)

        .filter(

            models.Room.room_no

            == normalized_room_no

        )

        .first()

    )



    if not room:

        raise HTTPException(

            status_code=404,

            detail=(

                f"Room {normalized_room_no} "

                "is not configured in the "

                "current examination session."

            ),

        )



    student = (

        db.query(

            models.StudentSeating

        )

        .filter(

            models.StudentSeating.roll_no

            == payload.roll_no.strip()

        )

        .first()

    )



    if not student:

        raise HTTPException(

            status_code=404,

            detail=(

                "Candidate roll number "

                "not found in session system."

            ),

        )



    if (

        str(

            student.room_no

        ).strip()

        != normalized_room_no

    ):

        raise HTTPException(

            status_code=400,

            detail=(

                f"Candidate allocated to "

                f"Room {student.room_no}, "

                f"not Room "

                f"{normalized_room_no}."

            ),

        )



    student.attendance_status = (

        "Present"

    )



    db.commit()



    return {

        "status": "success",



        "message": (

            f"Verified {student.name} "

            f"({student.roll_no}) "

            f"at seat "

            f"{student.seat_no}"

        ),



        "assigned_seat": (

            student.seat_no

        ),

    }





@invigilator_router.patch(

    "/toggle-attendance"

)

async def invigilator_toggle_attendance(

    payload: AttendanceUpdate,

    db: Session = Depends(get_db),

):

    """

    Change candidate attendance status.

    """



    student = (

        db.query(

            models.StudentSeating

        )

        .filter(

            models.StudentSeating.roll_no

            == payload.roll_no

        )

        .first()

    )



    if not student:

        raise HTTPException(

            status_code=404,

            detail=(

                "Candidate record "

                "not found."

            ),

        )



    student.attendance_status = (

        payload.status

    )



    db.commit()



    return {

        "status": "success",

        "new_status": (

            student.attendance_status

        ),

    }





@invigilator_router.post(

    "/flag-broken-seat"

)

async def invigilator_flag_broken_seat(

    payload: InvigilatorFlagSeatRequest,

    db: Session = Depends(get_db),

):

    """

    Flag broken examination furniture

    and reroute impacted candidates.

    """



    normalized_room_no = str(

        payload.room_no

    ).strip()



    room = (

        db.query(models.Room)

        .filter(

            models.Room.room_no

            == normalized_room_no

        )

        .first()

    )



    if not room:

        raise HTTPException(

            status_code=404,

            detail=(

                f"Room "

                f"{normalized_room_no} "

                "missing."

            ),

        )



    target_table = (

        payload.table_id

        .strip()

        .upper()

    )



    broken_set = set(

        t.strip()

        for t in str(

            room.broken_tables

            or ""

        ).split(",")

        if t.strip()

    )



    broken_set.add(

        target_table

    )



    room.broken_tables = (

        ",".join(

            filter(

                None,

                broken_set,

            )

        )

    )



    impacted_students = (

        db.query(

            models.StudentSeating

        )

        .filter(

            models.StudentSeating.room_no

            == normalized_room_no,



            models.StudentSeating.seat_no.like(

                f"{target_table}%"

            ),

        )

        .all()

    )



    allocated_seats = {

        s.seat_no

        for s in (

            db.query(

                models.StudentSeating

            )

            .filter(

                models.StudentSeating.room_no

                == normalized_room_no

            )

            .all()

        )

    }



    rerouted_messages = []



    for student in impacted_students:



        new_seat = (

            find_first_available_seat(

                room,

                allocated_seats,

            )

        )



        if new_seat:



            student.seat_no = (

                new_seat

            )



            student.attendance_status = (

                "Pending Admin Reroute"

            )



            allocated_seats.add(

                new_seat

            )



            rerouted_messages.append(

                f"{student.name} "

                f"rerouted to "

                f"{new_seat}"

            )



        else:



            student.attendance_status = (

                "Pending Admin Reroute"

            )



            rerouted_messages.append(

                f"{student.name} "

                "flagged for room transfer "

                "(Hall full)"

            )



    db.commit()



    msg = (

        f"Table {target_table} "

        "flagged as broken."

    )



    if rerouted_messages:



        msg += (

            " Auto-Reroutes: "

            + "; ".join(

                rerouted_messages

            )

        )



    return {

        "status": "success",

        "message": msg,

    }





@invigilator_router.get(

    "/export-data"

)

async def invigilator_export_data(

    room_no: str = Query(...),

    branch: Optional[str] = Query("All"),

    year: Optional[str] = Query("All"),

    subject: Optional[str] = Query("All"),

    db: Session = Depends(get_db),

):

    """

    Export filtered invigilator room data.

    """



    query = db.query(

        models.StudentSeating

    )



    if (

        room_no

        and room_no != "All"

    ):

        query = query.filter(

            models.StudentSeating.room_no

            == room_no

        )



    if (

        branch

        and branch != "All"

    ):

        query = query.filter(

            models.StudentSeating.branch

            == branch

        )



    if (

        year

        and year != "All"

    ):

        query = query.filter(

            models.StudentSeating.year

            == year

        )



    if (

        subject

        and subject != "All"

    ):

        query = query.filter(

            models.StudentSeating.subject

            == subject

        )



    students = (

        query

        .order_by(

            models.StudentSeating.seat_no

        )

        .all()

    )



    return {

        "room_no": room_no,



        "total": len(

            students

        ),



        "students": [

            {

                "name": s.name,

                "roll_no": s.roll_no,

                "branch": s.branch,

                "year": s.year,

                "subject": s.subject,

                "room_no": s.room_no,

                "seat_no": s.seat_no,

                "attendance_status": (

                    s.attendance_status

                ),

            }

            for s in students

        ],

    }





# ============================================================
# INVIGILATOR ACCOUNT MANAGEMENT + ADMIN ALERTS
# ============================================================


@router.get("/action-alerts")
async def get_action_alerts(
    limit: int = Query(30, ge=1, le=200),
    db: Session = Depends(get_db),
):
    logs = db.query(models.ActionLog).order_by(
        models.ActionLog.created_at.desc(), models.ActionLog.id.desc()
    ).limit(limit).all()
    return {"results": [
        {
            "id": item.id,
            "actor_role": item.actor_role,
            "actor_username": item.actor_username,
            "action_type": item.action_type,
            "room_no": item.room_no,
            "roll_no": item.roll_no,
            "message": item.message,
            "created_at": item.created_at.isoformat() if item.created_at else None,
        }
        for item in logs
    ]}


# ============================================================
# STUDENT ROOM LAYOUT
# ============================================================

@router.get("/room-layout/{room_no}")
async def get_student_room_layout(
    room_no: str,
    db: Session = Depends(get_db),
):
    """Return the current database-driven seating layout for one room."""
    normalized_room_no = str(room_no).strip()

    room = db.query(models.Room).filter(
        models.Room.room_no == normalized_room_no
    ).first()

    if not room:
        raise HTTPException(
            status_code=404,
            detail=f"Room {normalized_room_no} is not configured in the current examination session.",
        )

    students = (
        db.query(models.StudentSeating)
        .filter(models.StudentSeating.room_no == normalized_room_no)
        .order_by(models.StudentSeating.seat_no)
        .all()
    )

    return [
        {
            "id": student.id,
            "name": student.name,
            "roll_no": student.roll_no,
            "branch": student.branch,
            "year": student.year,
            "subject": student.subject,
            "paper_group_id": student.paper_group_id,
            "room_no": student.room_no,
            "seat_no": student.seat_no,
            "attendance_status": student.attendance_status or "Absent",
        }
        for student in students
    ]


# ============================================================

# 1. ATTENDANCE & VERIFY LOGIC

# ============================================================



@router.post(

    "/attendance/verify-scan"

)

async def verify_scan(

    req: VerifyScanRequest,

    db: Session = Depends(get_db),

    authorization: str = Header(None),

):



    if (

        authorization

        != "RBU_ADMIN_SECURE_TOKEN_2026"

    ):

        raise HTTPException(

            status_code=401,

            detail=(

                "Unauthorized Terminal Access"

            ),

        )



    qr_raw = (

        req.qr_data.strip()

    )



    if not qr_raw:



        raise HTTPException(

            status_code=400,

            detail="Empty QR Content",

        )



    roll_no = (

        qr_raw.split("|")[1]

        if "|" in qr_raw

        else qr_raw

    )



    student = (

        db.query(

            models.StudentSeating

        )

        .filter(

            models.StudentSeating.roll_no

            == roll_no

        )

        .first()

    )



    if not student:



        raise HTTPException(

            status_code=404,

            detail=(

                "Student Identity Not Found"

            ),

        )



    student.attendance_status = (

        "Present"

    )



    db.commit()



    return {

        "success": True,

        "name": student.name,

        "roll_no": student.roll_no,

        "room": student.room_no,

        "seat": student.seat_no,

        "message": (

            "Authorized Entry Recorded"

        ),

    }





@router.patch(

    "/mark-attendance"

)

async def mark_attendance(

    data: AttendanceUpdate,

    db: Session = Depends(get_db),

):



    student = (

        db.query(

            models.StudentSeating

        )

        .filter(

            models.StudentSeating.roll_no

            == data.roll_no

        )

        .first()

    )



    if not student:



        raise HTTPException(

            status_code=404,

            detail="Student not found",

        )



    student.attendance_status = (

        data.status

    )



    db.commit()



    return {

        "status": "success",

        "new_status": (

            student.attendance_status

        ),

    }





# ============================================================

# 2. FAULT-TOLERANT RESOLVER ENGINE

# ============================================================



@router.post(

    "/resolve-broken-seat"

)

async def admin_resolve_broken_seat(

    payload: ResolveBrokenSeatRequest,

    db: Session = Depends(get_db),

):



    student = (

        db.query(

            models.StudentSeating

        )

        .filter(

            models.StudentSeating.id

            == payload.student_id

        )

        .first()

    )



    if not student:



        raise HTTPException(

            status_code=404,

            detail=(

                "Student index record mismatch."

            ),

        )



    target_room = str(

        payload.target_new_room

    ).strip()



    room_meta = (

        db.query(models.Room)

        .filter(

            models.Room.room_no

            == target_room

        )

        .first()

    )



    if not room_meta:



        raise HTTPException(

            status_code=404,

            detail=(

                f"Target Room "

                f"{target_room} "

                "matrix missing."

            ),

        )



    max_capacity = (

        room_meta.total_tables

        * room_meta.students_per_table

    )



    currently_allocated = (

        db.query(

            models.StudentSeating

        )

        .filter(

            models.StudentSeating.room_no

            == target_room

        )

        .all()

    )



    if (

        len(currently_allocated)

        >= max_capacity

    ):



        raise HTTPException(

            status_code=400,

            detail=(

                f"Target Room "

                f"{target_room} "

                "is at absolute "

                "density limit."

            ),

        )



    allocated_seats = [

        s.seat_no

        for s in currently_allocated

    ]



    all_possible_seats = []



    column_bounds_map = {}



    if getattr(

        room_meta,

        "column_bounds",

        None,

    ):

        try:

            column_bounds_map = (

                json.loads(

                    room_meta.column_bounds

                )

            )

        except Exception:

            column_bounds_map = {}



    for col in range(

        1,

        room_meta.cols + 1,

    ):



        col_key = str(

            col - 1

        )



        active_row_limit = (

            int(

                column_bounds_map[

                    col_key

                ]

            )

            if col_key in column_bounds_map

            else room_meta.rows

        )



        for row in range(

            1,

            active_row_limit + 1,

        ):



            if (

                room_meta.students_per_table

                == 2

            ):



                all_possible_seats.append(

                    f"R{row}C{col}_L"

                )



                all_possible_seats.append(

                    f"R{row}C{col}_R"

                )



            else:



                all_possible_seats.append(

                    f"R{row}C{col}"

                )



    broken_list = [

        t.strip()

        for t in str(

            room_meta.broken_tables

            or ""

        ).split(",")

        if t.strip()

    ]



    available_slots = [

        seat

        for seat in all_possible_seats

        if (

            seat not in allocated_seats

            and seat not in broken_list

        )

    ]



    if not available_slots:



        raise HTTPException(

            status_code=500,

            detail=(

                "No isolated coordinates "

                "available inside target "

                "room arrays."

            ),

        )



    student.room_no = (

        target_room

    )



    student.seat_no = (

        available_slots[0]

    )



    student.attendance_status = (

        "Present (Admin Swapped)"

    )



    db.commit()



    return {

        "status": "success",

        "moved_student": (

            student.name

        ),

        "new_room": (

            student.room_no

        ),

        "new_seat": (

            student.seat_no

        ),

    }





# ============================================================

# 3. DATA INGESTION & AI SOLVER

# ============================================================



@router.post(

    "/upload-bulk"

)

async def upload_bulk_data(

    student_file: UploadFile = File(...),

    room_file: UploadFile = File(...),

    mode: str = Query("Single"),

    db: Session = Depends(get_db),

):



    try:



        # ====================================================

        # READ ADMIN UPLOADS FIRST

        # ====================================================



        s_bytes = (

            await student_file.read()

        )



        r_bytes = (

            await room_file.read()

        )



        try:



            s_df = pd.read_csv(

                io.BytesIO(

                    s_bytes

                )

            )



            r_df = pd.read_csv(

                io.BytesIO(

                    r_bytes

                )

            )



        except Exception as file_error:



            raise HTTPException(

                status_code=400,

                detail=(

                    "Unable to read uploaded "

                    "CSV files: "

                    f"{str(file_error)}"

                ),

            )



        # ====================================================

        # NORMALIZE COLUMN NAMES

        # ====================================================



        s_df.columns = [

            str(c)

            .lower()

            .strip()

            .replace(

                " ",

                "_",

            )

            for c in s_df.columns

        ]



        r_df.columns = [

            str(c)

            .lower()

            .strip()

            .replace(

                " ",

                "_",

            )

            for c in r_df.columns

        ]



        s_df = s_df.fillna(

            "N/A"

        )



        r_df = r_df.fillna(

            ""

        )



        # ====================================================

        # VALIDATE UPLOADS

        # ====================================================



        if s_df.empty:



            raise HTTPException(

                status_code=400,

                detail=(

                    "Student file contains "

                    "no records."

                ),

            )



        if r_df.empty:



            raise HTTPException(

                status_code=400,

                detail=(

                    "Room file contains "

                    "no rooms."

                ),

            )



        required_room_columns = {

            "room_no",

            "rows",

            "cols",

        }



        missing_columns = (

            required_room_columns

            - set(

                r_df.columns

            )

        )



        if missing_columns:



            raise HTTPException(

                status_code=400,

                detail=(

                    "Room file is missing "

                    "required column(s): "

                    + ", ".join(

                        sorted(

                            missing_columns

                        )

                    )

                ),

            )



        # ====================================================

        # SEATING MODE

        # ====================================================



        mode_value = str(

            mode

        ).strip().lower()



        is_double_mode = (

            "double" in mode_value

            or "two" in mode_value

            or mode_value == "2"

        )



        per_bench_count = (

            2

            if is_double_mode

            else 1

        )



        solver_mode = (

            "Double"

            if is_double_mode

            else "Single"

        )



        print(

            "📡 [ADMIN UPLOAD] "

            f"Mode: {solver_mode} | "

            "Students/Table: "

            f"{per_bench_count}"

        )



        # ====================================================

        # PREPARE EXACT ADMIN-UPLOADED ROOMS

        # ====================================================



        uploaded_rooms = []



        uploaded_room_numbers = (

            set()

        )



        for index, r_data in (

            r_df.iterrows()

        ):



            room_no = str(

                r_data.get(

                    "room_no",

                    "",

                )

            ).strip()



            if not room_no:



                raise HTTPException(

                    status_code=400,

                    detail=(

                        "Room number is missing "

                        f"at room-file row "

                        f"{index + 2}."

                    ),

                )



            if (

                room_no

                in uploaded_room_numbers

            ):



                raise HTTPException(

                    status_code=400,

                    detail=(

                        f"Duplicate room "

                        f"'{room_no}' found "

                        "in uploaded room file."

                    ),

                )



            uploaded_room_numbers.add(

                room_no

            )



            # -----------------------------------------------

            # ROWS

            # -----------------------------------------------



            try:



                parsed_rows = int(

                    float(

                        str(

                            r_data.get(

                                "rows",

                                "",

                            )

                        ).strip()

                    )

                )



            except (

                TypeError,

                ValueError,

            ):



                raise HTTPException(

                    status_code=400,

                    detail=(

                        f"Invalid rows value "

                        f"for Room {room_no}."

                    ),

                )



            # -----------------------------------------------

            # COLUMNS

            # -----------------------------------------------



            try:



                parsed_cols = int(

                    float(

                        str(

                            r_data.get(

                                "cols",

                                "",

                            )

                        ).strip()

                    )

                )



            except (

                TypeError,

                ValueError,

            ):



                raise HTTPException(

                    status_code=400,

                    detail=(

                        f"Invalid cols value "

                        f"for Room {room_no}."

                    ),

                )



            if parsed_rows <= 0:



                raise HTTPException(

                    status_code=400,

                    detail=(

                        "Rows must be greater "

                        f"than 0 for Room "

                        f"{room_no}."

                    ),

                )



            if parsed_cols <= 0:



                raise HTTPException(

                    status_code=400,

                    detail=(

                        "Columns must be greater "

                        f"than 0 for Room "

                        f"{room_no}."

                    ),

                )



            # -----------------------------------------------

            # FLOOR

            # -----------------------------------------------



            floor_raw = str(

                r_data.get(

                    "floor",

                    "",

                )

            ).strip()



            if floor_raw:



                try:



                    floor_value = int(

                        float(

                            floor_raw

                        )

                    )



                except (

                    TypeError,

                    ValueError,

                ):



                    raise HTTPException(

                        status_code=400,

                        detail=(

                            "Invalid floor value "

                            f"for Room {room_no}."

                        ),

                    )



            else:



                floor_value = 1



            # -----------------------------------------------

            # BROKEN TABLES

            # -----------------------------------------------



            broken_tables = str(

                r_data.get(

                    "broken_tables",

                    "",

                )

            ).strip()



            # -----------------------------------------------

            # COLUMN BOUNDS

            # -----------------------------------------------



            column_bounds = ""



            if (

                "column_bounds"

                in r_df.columns

            ):



                raw_bounds = str(

                    r_data.get(

                        "column_bounds",

                        "",

                    )

                ).strip()



                if raw_bounds:



                    try:



                        parsed_bounds = (

                            json.loads(

                                raw_bounds

                            )

                        )



                        column_bounds = (

                            json.dumps(

                                parsed_bounds

                            )

                        )



                    except Exception:



                        raise HTTPException(

                            status_code=400,

                            detail=(

                                "Invalid "

                                "column_bounds JSON "

                                f"for Room "

                                f"{room_no}."

                            ),

                        )



            calculated_tables = (

                parsed_rows

                * parsed_cols

            )



            uploaded_rooms.append(

                {

                    "room_no": (

                        room_no

                    ),

                    "floor": (

                        floor_value

                    ),

                    "rows": (

                        parsed_rows

                    ),

                    "cols": (

                        parsed_cols

                    ),

                    "total_tables": (

                        calculated_tables

                    ),

                    "broken_tables": (

                        broken_tables

                    ),

                    "students_per_table": (

                        per_bench_count

                    ),

                    "column_bounds": (

                        column_bounds

                    ),

                }

            )



        # ====================================================

        # PREPARE STUDENT RECORDS

        # ====================================================



        if (

            "branch"

            in s_df.columns

        ):



            s_df = (

                s_df

                .sort_values(

                    by=[

                        "branch"

                    ]

                )

                .reset_index(

                    drop=True

                )

            )



        records_list = []



        for row in s_df.to_dict(

            "records"

        ):



            records_list.append(

                {

                    "name": str(

                        row.get(

                            "name",

                            row.get(

                                "nameid",

                                "Unknown",

                            ),

                        )

                    ).strip(),



                    "roll_no": str(

                        row.get(

                            "roll_no",

                            row.get(

                                "rollno",

                                "",

                            ),

                        )

                    ).strip(),



                    "branch": str(

                        row.get(

                            "branch",

                            "GEN",

                        )

                    )

                    .strip()

                    .upper(),



                    "year": str(

                        row.get(

                            "year",

                            "1",

                        )

                    ).strip(),



                    "subject": str(

                        row.get(

                            "subject",

                            "General Exam",

                        )

                    ).strip(),



                    "course_id": str(

                        row.get(

                            "course_id",

                            row.get(

                                "subject",

                                "GEN_ID",

                            ),

                        )

                    ).strip(),



                    "paper_group_id": str(

                        row.get(

                            "paper_group_id",

                            row.get(

                                "subject",

                                "GEN_GRP",

                            ),

                        )

                    ).strip(),

                }

            )



        if not records_list:



            raise HTTPException(

                status_code=400,

                detail=(

                    "No valid student "

                    "records found."

                ),

            )



        # ====================================================

        # VALIDATION PASSED

        # CLEAR PREVIOUS SESSION

        # ====================================================



        db.query(

            models.StudentSeating

        ).delete(

            synchronize_session=False

        )



        db.query(

            models.Room

        ).delete(

            synchronize_session=False

        )



        db.flush()



        # ====================================================

        # REGISTER ONLY ADMIN-UPLOADED ROOMS

        # ====================================================



        for room_data in (

            uploaded_rooms

        ):



            new_room = models.Room(



                room_no=(

                    room_data[

                        "room_no"

                    ]

                ),



                floor=(

                    room_data[

                        "floor"

                    ]

                ),



                total_tables=(

                    room_data[

                        "total_tables"

                    ]

                ),



                rows=(

                    room_data[

                        "rows"

                    ]

                ),



                cols=(

                    room_data[

                        "cols"

                    ]

                ),



                broken_tables=(

                    room_data[

                        "broken_tables"

                    ]

                ),



                students_per_table=(

                    room_data[

                        "students_per_table"

                    ]

                ),



                column_bounds=(

                    room_data[

                        "column_bounds"

                    ]

                ),

            )



            db.add(

                new_room

            )



        # Makes uploaded rooms immediately

        # visible to run_solver_logic().

        db.flush()



        print(

            "✅ [ADMIN UPLOAD] "

            "Registered rooms:",

            sorted(

                uploaded_room_numbers

            ),

        )



        # ====================================================

        # GENERATE SEATING PLAN

        # ====================================================



        result = (

            await run_solver_logic(

                db,

                solver_mode,

                is_first_upload=True,

                raw_student_data=(

                    records_list

                ),

            )

        )



        return {

            "status": "success",



            "message": (

                "Room data uploaded and "

                "seating plan generated "

                "successfully."

            ),



            "room_count": len(

                uploaded_room_numbers

            ),



            "uploaded_rooms": (

                sorted(

                    uploaded_room_numbers

                )

            ),



            "seating_result": (

                result

            ),

        }



    except HTTPException:



        db.rollback()

        raise



    except Exception as e:



        db.rollback()



        print(

            "❌ [BULK PROCESSING CRASHED]:",

            str(e),

        )



        raise HTTPException(

            status_code=500,

            detail=(

                "Data Ingestion Fault: "

                f"{str(e)}"

            ),

        )

# ============================================================

# 4. SUDDEN ROOM INJECTION ENDPOINT

# ============================================================



@router.post("/inject-room-node")

async def admin_inject_room_node(

    payload: RoomInjectionPayload,

    db: Session = Depends(get_db),

):

    """

    Create or update a room manually.



    Room number always comes from the Admin request.

    No examination room number is hardcoded.

    """



    normalized_room_no = str(

        payload.room_no

    ).strip()



    if not normalized_room_no:

        raise HTTPException(

            status_code=400,

            detail="Room number is required.",

        )



    if payload.rows <= 0:

        raise HTTPException(

            status_code=400,

            detail=(

                "Room rows must be "

                "greater than zero."

            ),

        )



    if payload.cols <= 0:

        raise HTTPException(

            status_code=400,

            detail=(

                "Room columns must be "

                "greater than zero."

            ),

        )



    room = (

        db.query(models.Room)

        .filter(

            models.Room.room_no

            == normalized_room_no

        )

        .first()

    )



    bounds_json_str = (

        json.dumps(

            payload.column_bounds

        )

        if payload.column_bounds

        else ""

    )



    calculated_tables = (

        payload.rows

        * payload.cols

    )



    if room:



        room.rows = (

            payload.rows

        )



        room.cols = (

            payload.cols

        )



        room.total_tables = (

            calculated_tables

        )



        room.column_bounds = (

            bounds_json_str

        )



        msg = (

            f"Room {normalized_room_no} "

            "configuration updated "

            "successfully."

        )



    else:



        # Manual room creation is still supported

        # through this explicit Admin endpoint.

        #

        # No room ID is fabricated here.

        # The room number is exactly what Admin sent.



        room = models.Room(

            room_no=(

                normalized_room_no

            ),

            floor=1,

            total_tables=(

                calculated_tables

            ),

            rows=payload.rows,

            cols=payload.cols,

            broken_tables="",

            students_per_table=2,

            column_bounds=(

                bounds_json_str

            ),

        )



        db.add(room)



        msg = (

            f"Room {normalized_room_no} "

            "created successfully."

        )



    try:



        db.commit()

        db.refresh(room)



        return {

            "status": "success",

            "message": msg,

            "room": {

                "room_no": (

                    room.room_no

                ),

                "floor": (

                    room.floor

                ),

                "rows": (

                    room.rows

                ),

                "cols": (

                    room.cols

                ),

                "total_tables": (

                    room.total_tables

                ),

                "students_per_table": (

                    room.students_per_table

                ),

            },

        }



    except Exception as e:



        db.rollback()



        raise HTTPException(

            status_code=500,

            detail=(

                "Dynamic Injection Core Fault: "

                f"{str(e)}"

            ),

        )





# ============================================================

# 5. REGENERATE & SOLVER ENGINE

# ============================================================



@router.post("/regenerate-plan")

async def regenerate_plan(

    req: RegenerateRequest,

    db: Session = Depends(get_db),

):

    """

    Regenerate seating using the rooms

    currently configured in the database.

    """



    try:



        return await run_solver_logic(

            db,

            req.mode,

        )



    except HTTPException:

        raise



    except Exception as e:



        raise HTTPException(

            status_code=500,

            detail=(

                "Regeneration Failed: "

                f"{str(e)}"

            ),

        )





async def run_solver_logic(

    db: Session,

    mode: str,

    is_first_upload=False,

    raw_student_data=None,

):

    """

    Build solver input dynamically from

    the CURRENT Room table.



    Therefore, after Admin bulk upload,

    only those uploaded rooms are supplied

    to the seating solver.

    """



    # ========================================================

    # CURRENT ROOMS

    # ========================================================



    current_rooms = (

        db.query(models.Room)

        .order_by(

            models.Room.room_no

        )

        .all()

    )



    if not current_rooms:



        raise HTTPException(

            status_code=400,

            detail=(

                "No examination rooms "

                "are configured."

            ),

        )



    rooms_list = []



    for r in current_rooms:



        col_bounds_parsed = None



        if getattr(

            r,

            "column_bounds",

            None,

        ):



            try:



                col_bounds_parsed = (

                    json.loads(

                        r.column_bounds

                    )

                )



            except Exception:



                col_bounds_parsed = (

                    None

                )



        rooms_list.append(

            {

                "room_no": (

                    r.room_no

                ),



                "rows": (

                    r.rows

                ),



                "cols": (

                    r.cols

                ),



                "broken_tables": (

                    r.broken_tables

                ),



                "students_per_table": (

                    r.students_per_table

                ),



                "column_bounds": (

                    col_bounds_parsed

                ),

            }

        )



    # ========================================================

    # STUDENT DATA

    # ========================================================



    student_records = []



    if (

        is_first_upload

        and raw_student_data

    ):



        student_records = (

            raw_student_data

        )



    else:



        existing = (

            db.query(

                models.StudentSeating

            )

            .order_by(

                models.StudentSeating.branch

            )

            .all()

        )



        for s in existing:



            student_records.append(

                {

                    "name": (

                        s.name

                    ),



                    "roll_no": (

                        s.roll_no

                    ),



                    "branch": (

                        s.branch

                    ),



                    "year": (

                        s.year

                    ),



                    "subject": (

                        s.subject

                    ),



                    "course_id": (

                        s.subject

                    ),



                    "paper_group_id": (

                        s.paper_group_id

                    ),

                }

            )



    if not student_records:



        raise HTTPException(

            status_code=400,

            detail=(

                "No student registry found."

            ),

        )



    # ========================================================

    # RUN SOLVER

    # ========================================================



    try:



        assignments = solve_seating(

            student_records,

            rooms_list,

            mode=mode,

        )



    except Exception as solver_err:



        print(

            "❌ [CRITICAL MATRIX SOLVER "

            "ENGINE EXCEPTION]:",

            str(solver_err),

        )



        raise HTTPException(

            status_code=500,

            detail=(

                "Solver Constraint Error: "

                f"{str(solver_err)}"

            ),

        )



    if assignments is None:



        raise HTTPException(

            status_code=500,

            detail=(

                "Solver returned no "

                "assignment result."

            ),

        )



    # ========================================================

    # REMOVE OLD SEATING ASSIGNMENTS

    # ========================================================



    try:



        db.query(

            models.StudentSeating

        ).delete(

            synchronize_session=False

        )



        db.flush()



    except Exception as delete_error:



        db.rollback()



        raise HTTPException(

            status_code=500,

            detail=(

                "Unable to clear previous "

                "seating allocation: "

                f"{str(delete_error)}"

            ),

        )



    # ========================================================

    # CREATE NEW SEATING RECORDS

    # ========================================================



    new_records = []



    for s in assignments:



        assigned_room = str(

            s.get(

                "assigned_room",

                "",

            )

        ).strip()



        assigned_seat = str(

            s.get(

                "assigned_seat",

                "",

            )

        ).strip()



        # ----------------------------------------------------

        # Never silently store N/A room.

        # Solver must assign a real current room.

        # ----------------------------------------------------



        if not assigned_room:



            db.rollback()



            raise HTTPException(

                status_code=500,

                detail=(

                    "Solver generated a student "

                    "without an assigned room."

                ),

            )



        valid_room = next(

            (

                room

                for room in current_rooms

                if str(

                    room.room_no

                ).strip()

                == assigned_room

            ),

            None,

        )



        if not valid_room:



            db.rollback()



            raise HTTPException(

                status_code=500,

                detail=(

                    f"Solver returned Room "

                    f"{assigned_room}, but that "

                    "room is not part of the "

                    "current Admin room dataset."

                ),

            )



        if not assigned_seat:



            db.rollback()



            raise HTTPException(

                status_code=500,

                detail=(

                    f"Solver generated no seat "

                    f"for student "

                    f"{s.get('roll_no', '')}."

                ),

            )



        # ====================================================

        # QR CONTENT

        # ====================================================



        qr_content = (

            f"RBU|"

            f"{s.get('roll_no')}|"

            f"{assigned_room}|"

            f"{assigned_seat}"

        )



        qr = qrcode.make(

            qr_content

        )



        buf = io.BytesIO()



        qr.save(

            buf,

            format="PNG",

        )



        qr_base64 = (

            base64.b64encode(

                buf.getvalue()

            ).decode()

        )



        # ====================================================

        # DATABASE RECORD

        # ====================================================



        new_records.append(

            models.StudentSeating(



                name=str(

                    s.get(

                        "name",

                        "Unknown",

                    )

                ),



                roll_no=str(

                    s.get(

                        "roll_no",

                        "",

                    )

                ),



                branch=str(

                    s.get(

                        "branch",

                        "GEN",

                    )

                ),



                year=str(

                    s.get(

                        "year",

                        "1",

                    )

                ),



                subject=str(

                    s.get(

                        "subject",

                        "General Exam",

                    )

                ),



                paper_group_id=str(

                    s.get(

                        "paper_group_id",

                        s.get(

                            "subject",

                            "GEN_GRP",

                        ),

                    )

                ),



                room_no=(

                    assigned_room

                ),



                seat_no=(

                    assigned_seat

                ),



                shift=str(

                    s.get(

                        "shift",

                        "Morning",

                    )

                ),



                exam_time=str(

                    s.get(

                        "exam_time",

                        "09:30 AM",

                    )

                ),



                attendance_status=(

                    "Absent"

                ),



                qr_code=(

                    "data:image/png;base64,"

                    f"{qr_base64}"

                ),

            )

        )



    # ========================================================

    # SAVE NEW SEATING

    # ========================================================



    try:



        db.add_all(

            new_records

        )



        db.commit()



        return {

            "status": "success",



            "count": len(

                assignments

            ),



            "room_count": len(

                current_rooms

            ),



            "rooms_used": [

                str(

                    room.room_no

                )

                for room

                in current_rooms

            ],

        }



    except Exception as db_commit_err:



        db.rollback()



        print(

            "❌ [DATABASE COMMIT ERROR]:",

            str(

                db_commit_err

            ),

        )



        raise HTTPException(

            status_code=500,

            detail=(

                "SQL Compilation "

                "Mismatch Node: "

                f"{str(db_commit_err)}"

            ),

        )





# ============================================================

# 6. ANALYTICS & INFRASTRUCTURE

# ============================================================



@router.get("/analytics")

async def get_analytics(

    db: Session = Depends(get_db),

):

    """

    Administrative analytics based on the

    current seating plan and current rooms.

    """



    total = (

        db.query(

            models.StudentSeating

        )

        .count()

    )



    present = (

        db.query(

            models.StudentSeating

        )

        .filter(

            models.StudentSeating.attendance_status

            == "Present"

        )

        .count()

    )



    rooms = (

        db.query(models.Room)

        .order_by(

            models.Room.room_no

        )

        .all()

    )



    total_capacity = sum(

        (

            r.total_tables

            * r.students_per_table

        )

        for r in rooms

    )



    utilization = (

        round(

            (

                total

                / total_capacity

            )

            * 100,

            1,

        )

        if total_capacity > 0

        else 0.0

    )



    room_stats = []



    for r in rooms:



        students_in_room = (

            db.query(

                models.StudentSeating

            )

            .filter(

                models.StudentSeating.room_no

                == r.room_no

            )

            .all()

        )



        column_bounds_dict = {}



        if getattr(

            r,

            "column_bounds",

            None,

        ):



            try:



                column_bounds_dict = (

                    json.loads(

                        r.column_bounds

                    )

                )



            except Exception:



                column_bounds_dict = {}



        broken_tables = [

            t.strip()

            for t in str(

                r.broken_tables

                or ""

            ).split(",")

            if t.strip()

        ]



        room_stats.append(

            {

                "name": (

                    f"Room {r.room_no}"

                ),



                "room_no": (

                    r.room_no

                ),



                "count": len(

                    students_in_room

                ),



                "capacity": (

                    r.total_tables

                    * r.students_per_table

                ),



                "students_per_bench": (

                    r.students_per_table

                ),



                "broken": len(

                    broken_tables

                ),



                "broken_tables": (

                    r.broken_tables

                    or ""

                ),



                "rows": (

                    r.rows

                ),



                "cols": (

                    r.cols

                ),



                "column_bounds": (

                    column_bounds_dict

                ),



                "students": [

                    {

                        "name": (

                            s.name

                        ),

                        "seat": (

                            s.seat_no

                        ),

                        "status": (

                            s.attendance_status

                        ),

                    }

                    for s

                    in students_in_room

                ],

            }

        )



    return {

        "totalStudents": (

            total

        ),



        "presentCount": (

            present

        ),



        "utilization": (

            utilization

        ),



        "roomData": (

            room_stats

        ),

    }





@router.patch(

    "/room/update-infrastructure"

)

async def update_infra(

    data: BrokenTableUpdate,

    db: Session = Depends(get_db),

):



    normalized_room_no = str(

        data.room_no

    ).strip()



    room = (

        db.query(models.Room)

        .filter(

            models.Room.room_no

            == normalized_room_no

        )

        .first()

    )



    if not room:



        raise HTTPException(

            status_code=404,

            detail="Room Not Found",

        )



    broken_set = set(

        t.strip()

        for t in str(

            room.broken_tables

            or ""

        ).split(",")

        if t.strip()

    )



    table_id = str(

        data.table_id

    ).strip().upper()



    if data.is_broken:



        broken_set.add(

            table_id

        )



    else:



        broken_set.discard(

            table_id

        )



    room.broken_tables = (

        ",".join(

            sorted(

                filter(

                    None,

                    broken_set,

                )

            )

        )

    )



    db.commit()



    return {

        "status": "success",

        "room_no": (

            normalized_room_no

        ),

        "broken_tables": (

            room.broken_tables

        ),

    }

# ============================================================
# ADMIN SEARCH HUB
# ============================================================

@router.get("/search-hub")
async def search_hub(
    filter_type: str = Query("student"),
    query: str = Query(""),
    db: Session = Depends(get_db),
):
    """
    Central Admin search endpoint used by Analytics.js and Rooms.js.

    filter_type=student with an empty query returns the complete
    current StudentSeating registry. It does not modify allocations.
    """
    normalized_type = str(filter_type or "student").strip().lower()
    keyword = str(query or "").strip()

    if normalized_type not in {"student", "students"}:
        raise HTTPException(
            status_code=400,
            detail="Unsupported filter_type. Use 'student'.",
        )

    student_query = db.query(models.StudentSeating)

    if keyword:
        like_value = f"%{keyword}%"
        searchable_columns = []

        for field_name in (
            "name",
            "roll_no",
            "branch",
            "year",
            "subject",
            "room_no",
            "seat_no",
            "shift",
            "attendance_status",
        ):
            column = getattr(
                models.StudentSeating,
                field_name,
                None,
            )
            if column is not None:
                searchable_columns.append(
                    column.ilike(like_value)
                )

        if searchable_columns:
            student_query = student_query.filter(
                or_(*searchable_columns)
            )

    order_columns = []
    for field_name in (
        "room_no",
        "seat_no",
        "roll_no",
    ):
        column = getattr(
            models.StudentSeating,
            field_name,
            None,
        )
        if column is not None:
            order_columns.append(column)

    if order_columns:
        student_query = student_query.order_by(
            *order_columns
        )

    students = student_query.all()

    def field(student, name, default=None):
        value = getattr(student, name, default)
        return default if value is None else value

    results = [
        {
            "id": field(student, "id"),
            "name": field(student, "name", ""),
            "roll_no": field(student, "roll_no", ""),
            "branch": field(student, "branch", ""),
            "year": field(student, "year", ""),
            "subject": field(student, "subject", ""),
            "room_no": field(student, "room_no", ""),
            "seat_no": field(student, "seat_no", ""),
            "shift": field(student, "shift", ""),
            "attendance_status": field(
                student,
                "attendance_status",
                "",
            ),
            "qr_code": field(student, "qr_code", ""),
        }
        for student in students
    ]

    return {
        "filter_type": "student",
        "query": keyword,
        "count": len(results),
        "results": results,
    }
