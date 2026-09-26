# File: backend/app/main.py

from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load backend/.env for local development
load_dotenv(Path(__file__).resolve().parents[1] / ".env")


try:
    from .api import (
        auth,
        admin_routes,
        student_routes,
        invigilator_routes,
    )
    from .database import models, connection

except ImportError:
    from api import (
        auth,
        admin_routes,
        student_routes,
        invigilator_routes,
    )
    from database import models, connection


# ---------------------------------------------------------
# Application Lifespan
# ---------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Verify/create database schema.
    # No default records are inserted here.
    models.Base.metadata.create_all(
        bind=connection.engine
    )

    print("🚀 [ECO-SEAT DATABASE] Schema synchronized successfully!")

    yield


# ---------------------------------------------------------
# FastAPI Application
# ---------------------------------------------------------

app = FastAPI(
    title="Eco-Seat AI Optimization Engine",
    description="Nagpur Smart City - RBU Edition v2.0",
    version="2.0.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------
# CORS Configuration
# ---------------------------------------------------------

ALLOWED_ORIGINS = [
    # Local Vite development
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",

    # Local React development
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",

    # Production Vercel frontend
    "https://eco-seat-ai-tau.vercel.app",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Authentication Routes
# ---------------------------------------------------------

app.include_router(
    auth.router,
    prefix="/api/auth",
    tags=["Authentication"],
)


# ---------------------------------------------------------
# Admin Routes
# ---------------------------------------------------------

# admin_routes.router already contains prefix="/api/admin"
app.include_router(
    admin_routes.router,
    tags=["Admin"],
)


# ---------------------------------------------------------
# Student Routes
# ---------------------------------------------------------

# student_routes.router already contains its API prefix
app.include_router(
    student_routes.router,
    tags=["Student Portal"],
)


# ---------------------------------------------------------
# Invigilator Routes
# ---------------------------------------------------------

# invigilator_routes.router already contains its API prefix
app.include_router(
    invigilator_routes.router,
    tags=["Invigilator Core Deck"],
)


# ---------------------------------------------------------
# Root Endpoint
# ---------------------------------------------------------

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
            "Infrastructure Self-Healing",
            "Dynamic Identity & MFA Authentication",
        ],
    }


# ---------------------------------------------------------
# Health Check
# ---------------------------------------------------------

@app.get("/api/health")
async def health_check():
    return {
        "status": "Operational",
        "database": "Connected",
        "solver_ready": True,
    }


# ---------------------------------------------------------
# Local Development
# ---------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8765,
        reload=True,
    )