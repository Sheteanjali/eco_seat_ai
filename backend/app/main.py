from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import uvicorn

# Project Imports
# 👑 FIXED: Integrated invigilator_routes mapping inside the api module extraction node
from .api import auth, admin_routes, student_routes, invigilator_routes 
from .database import models, connection

# Initialize Database Tables (Automatic Table Creation)
models.Base.metadata.create_all(bind=connection.engine)

app = FastAPI(
    title="Eco-Seat AI Optimization Engine",
    description="Nagpur Smart City - RBU Edition v2.0",
    version="2.0.0"
)

# --- CORS CONFIGURATION (Frontend Connection Fix) ---
# 👑 FIXED: Enforcing clear origin arrays to prevent network drop triggers
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- ROUTERS --------------------
# Saare functionality folders ko link kar raha hai
app.include_router(auth.router)
app.include_router(admin_routes.router)
app.include_router(student_routes.router)

# 👑 THE FINAL CYBER MATRIX PATCH: Added invigilator workspace boundaries route mapping
app.include_router(invigilator_routes.router) 


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