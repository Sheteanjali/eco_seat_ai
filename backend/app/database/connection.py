# File: backend/app/database/connection.py

import os

from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./eco_seat.db"
)


# ============================================================
# DATABASE ENGINE
# ============================================================

connect_args = {}

if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False


engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)


# ============================================================
# SQLITE OPTIMIZATION
# ============================================================

if DATABASE_URL.startswith("sqlite"):

    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(
        dbapi_connection,
        connection_record
    ):
        cursor = dbapi_connection.cursor()

        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA foreign_keys=ON")

        cursor.close()


# ============================================================
# SQLALCHEMY SESSION
# ============================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


# ============================================================
# FASTAPI DATABASE DEPENDENCY
# ============================================================

def get_db():
    """
    Creates a database session for each FastAPI request
    and safely closes it afterwards.
    """

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ============================================================
# SQLITE SCHEMA MIGRATION
# ============================================================

def sync_sqlite_columns():
    """
    Adds columns required by the current SQLAlchemy models
    when an older SQLite database already exists.

    SQLAlchemy create_all() creates missing tables but does
    not add missing columns to existing tables.
    """

    if not DATABASE_URL.startswith("sqlite"):
        return

    inspector = inspect(engine)

    existing_tables = set(
        inspector.get_table_names()
    )

    # --------------------------------------------------------
    # ROOMS TABLE
    # --------------------------------------------------------

    if "rooms" in existing_tables:

        room_columns = {
            column["name"]
            for column in inspector.get_columns("rooms")
        }

        if "capacity" not in room_columns:

            with engine.begin() as connection:
                connection.execute(
                    text(
                        "ALTER TABLE rooms "
                        "ADD COLUMN capacity "
                        "INTEGER DEFAULT 60"
                    )
                )

            print(
                "[DATABASE MIGRATION] "
                "Added rooms.capacity column."
            )

    # --------------------------------------------------------
    # STUDENT SEATING TABLE
    # --------------------------------------------------------

    if "student_seating" in existing_tables:

        student_columns = {
            column["name"]
            for column in inspector.get_columns(
                "student_seating"
            )
        }

        if "incident_logs" not in student_columns:

            with engine.begin() as connection:
                connection.execute(
                    text(
                        "ALTER TABLE student_seating "
                        "ADD COLUMN incident_logs "
                        "TEXT DEFAULT ''"
                    )
                )

            print(
                "[DATABASE MIGRATION] "
                "Added student_seating.incident_logs "
                "column."
            )



def migrate_invigilator_assigned_room_nullable():
    """Remove the legacy NOT NULL/default-101 schema safely."""
    if not DATABASE_URL.startswith("sqlite"):
        return
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    if "invigilator_users" not in tables:
        return
    cols = inspector.get_columns("invigilator_users")
    room_col = next((c for c in cols if c["name"] == "assigned_room"), None)
    if not room_col:
        return
    default_text = str(room_col.get("default") or "").strip("'\" ")
    if room_col.get("nullable", True) and default_text != "101":
        return

    with engine.begin() as conn:
        actual_101 = None
        if "rooms" in tables:
            actual_101 = conn.execute(
                text("SELECT 1 FROM rooms WHERE room_no='101' LIMIT 1")
            ).first()

        conn.execute(text("PRAGMA foreign_keys=OFF"))
        conn.execute(text("""
            CREATE TABLE invigilator_users_new (
                id INTEGER PRIMARY KEY,
                username VARCHAR NOT NULL UNIQUE,
                email VARCHAR NOT NULL UNIQUE,
                password VARCHAR NOT NULL,
                assigned_room VARCHAR NULL,
                created_at DATETIME
            )
        """))
        room_expr = (
            "assigned_room" if actual_101
            else "CASE WHEN assigned_room='101' THEN NULL ELSE assigned_room END"
        )
        conn.execute(text(f"""
            INSERT INTO invigilator_users_new
                (id, username, email, password, assigned_room, created_at)
            SELECT id, username, email, password, {room_expr}, created_at
            FROM invigilator_users
        """))
        conn.execute(text("DROP TABLE invigilator_users"))
        conn.execute(text("ALTER TABLE invigilator_users_new RENAME TO invigilator_users"))
        conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_invigilator_users_username ON invigilator_users(username)"))
        conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_invigilator_users_email ON invigilator_users(email)"))
        conn.execute(text("PRAGMA foreign_keys=ON"))
    print("[DATABASE MIGRATION] Invigilator room is nullable; legacy fake default removed.")

# ============================================================
# CLEAN LEGACY DEFAULT INVIGILATOR ROOM
# ============================================================

def clean_legacy_invigilator_room():
    """
    Removes the OLD hardcoded assigned_room='101'
    from existing invigilator records when Room 101
    does not actually exist in room metadata.

    This function:
    - does NOT create Room 101
    - does NOT assign another fake room
    - does NOT modify valid room assignments
    - does NOT delete invigilator accounts

    It only clears the legacy 101 assignment left by
    older versions of the application.
    """

    from . import models

    db = SessionLocal()

    try:

        # Check whether 101 is actually a configured room.
        actual_room_101 = (
            db.query(models.Room)
            .filter(
                models.Room.room_no == "101"
            )
            .first()
        )

        # If Room 101 genuinely exists, it is valid data.
        # Do not modify any assignments.
        if actual_room_101:
            return

        legacy_invigilators = (
            db.query(models.InvigilatorUser)
            .filter(
                models.InvigilatorUser.assigned_room
                == "101"
            )
            .all()
        )

        if not legacy_invigilators:
            return

        for invigilator in legacy_invigilators:
            invigilator.assigned_room = None

        db.commit()

        print(
            "[DATABASE CLEANUP] "
            f"Removed legacy room 101 assignment from "
            f"{len(legacy_invigilators)} "
            "invigilator account(s)."
        )

    except Exception as exc:

        db.rollback()

        print(
            "[DATABASE INVIGILATOR CLEANUP ERROR] "
            f"{str(exc)}"
        )

        raise

    finally:
        db.close()


# ============================================================
# REPAIR EXISTING ROOM METADATA
# ============================================================

def repair_room_metadata():
    """
    Repairs incomplete room metadata already stored
    in the database.

    It does NOT create fake rooms.
    Only existing rooms are repaired.
    """

    from . import models

    db = SessionLocal()

    try:

        rooms = db.query(models.Room).all()

        changed = False

        for room in rooms:

            # Existing structural behavior preserved.
            if room.floor is None:
                room.floor = 1
                changed = True

            if not room.rows:
                room.rows = 5
                changed = True

            if not room.cols:
                room.cols = 6
                changed = True

            if not room.total_tables:
                room.total_tables = (
                    int(room.rows) * int(room.cols)
                )
                changed = True

            if not room.students_per_table:
                room.students_per_table = 2
                changed = True

            expected_capacity = (
                int(room.total_tables)
                * int(room.students_per_table)
            )

            if not room.capacity:
                room.capacity = expected_capacity
                changed = True

            if room.broken_tables is None:
                room.broken_tables = ""
                changed = True

            if room.column_bounds is None:
                room.column_bounds = ""
                changed = True

        if changed:
            db.commit()

            print(
                "[DATABASE SYNC] "
                "Existing room metadata repaired."
            )

    except Exception as exc:

        db.rollback()

        print(
            "[DATABASE ROOM REPAIR ERROR] "
            f"{str(exc)}"
        )

        raise

    finally:
        db.close()


# ============================================================
# DATABASE INITIALIZATION
# ============================================================

def init_and_sync_db():
    """
    Initializes missing database tables and synchronizes
    an older SQLite database with the current models.
    """

    try:

        # Import here to avoid circular imports.
        from . import models

        # Step 1:
        # Create tables that do not exist.
        Base.metadata.create_all(
            bind=engine
        )

        # Step 2:
        # Add newly introduced columns.
        sync_sqlite_columns()

        # Step 3: migrate legacy invigilator schema.
        migrate_invigilator_assigned_room_nullable()

        # Step 4:
        # Remove only the old fake/default Room 101
        # assignment from existing invigilator accounts.
        clean_legacy_invigilator_room()

        # Step 4:
        # Repair incomplete metadata of existing rooms.
        repair_room_metadata()

        print(
            "🚀 [ECO-SEAT DATABASE] "
            "Schema synchronized successfully!"
        )

    except Exception as exc:

        print(
            "⚠️ [DATABASE BOOTSTRAP ALERT] "
            f"Schema synchronization failed: "
            f"{str(exc)}"
        )


# ============================================================
# INITIALIZE DATABASE ON APPLICATION START
# ============================================================

init_and_sync_db()