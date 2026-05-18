from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import uvicorn

# Project Imports
from .api import auth, admin_routes, student_routes
from .database import models, connection

# Initialize Database Tables (Automatic Table Creation)
models.Base.metadata.create_all(bind=connection.engine)

app = FastAPI(
    title="Eco-Seat AI Optimization Engine",
    description="Nagpur Smart City - RBU Edition v2.0",
    version="2.0.0"
)

# --- CORS CONFIGURATION (Frontend Connection Fix) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- SCHEMAS --------------------

class BrokenTableUpdate(BaseModel):
    room_no: str
    table_id: str  
    is_broken: bool

# -------------------- REAL-TIME INFRASTRUCTURE ENDPOINTS --------------------

@app.patch("/api/admin/room/update-infrastructure")
async def update_room_infrastructure(
    data: BrokenTableUpdate,
    db: Session = Depends(connection.get_db)
):
    """
    Admin marks table as broken on the Digital Twin map.
    This updates the database so the AI Solver skips these seats.
    """
    # 1. Database se wo specific room dhundo
    room = db.query(models.Room).filter(models.Room.room_no == data.room_no).first()
    
    if not room:
        raise HTTPException(status_code=404, detail=f"Room {data.room_no} not found.")

    # 2. Current broken tables string ko set mein convert karo (e.g., "T1,T2" -> {'T1', 'T2'})
    current_broken = set(t.strip() for t in str(room.broken_tables).split(',') if t.strip())

    # 3. Logic: Agar chair broken hai toh set mein add karo, warna nikalo
    if data.is_broken:
        current_broken.add(data.table_id)
    else:
        current_broken.discard(data.table_id)

    # 4. Wapas comma-separated string banakar save karo
    room.broken_tables = ",".join(filter(None, current_broken))
    
    try:
        db.commit()
        db.refresh(room)
        return {
            "status": "success",
            "message": f"Table {data.table_id} in {data.room_no} sync completed.",
            "db_state": room.broken_tables
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database Sync Failed.")


# -------------------- ROUTERS --------------------
# Saare functionality folders ko link kar raha hai
app.include_router(auth.router)
app.include_router(admin_routes.router)
app.include_router(student_routes.router)


# -------------------- SYSTEM HEALTH --------------------

@app.get("/")
async def root():
    return {
        "status": "online",
        "engine": "Eco-Seat AI Core",
        "university": "Ramdeobaba University, Nagpur",
        "active_modules": [
            "Recursive Backtracking Solver",
            "Digital Twin Synchronization",
            "QR-Attendance Node",
            "Infrastructure Self-Healing"
        ]
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "Operational",
        "database": "Connected",
        "solver_ready": True
    }

# -------------------- RUNNER --------------------
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)