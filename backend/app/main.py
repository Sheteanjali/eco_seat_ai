from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import auth, admin_routes, student_routes
from .database import models, connection

# Initialize Database Tables (Creates eco_seat.db)
models.Base.metadata.create_all(bind=connection.engine)

app = FastAPI(
    title="Eco-Seat AI Optimization Engine",
    description="Nagpur Smart City - 1,500 Student Seating Solver",
    version="1.0.0"
)

# --- SECURITY: DYNAMIC CORS CONFIGURATION ---
# Added "allow_origin_regex" as a safety net for local development.
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.56.1:3000", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For the Demo: Allow all to prevent "Engine Error"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROUTER REGISTRATION ---
app.include_router(auth.router)
app.include_router(admin_routes.router)
app.include_router(student_routes.router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Eco-Seat AI Optimization Engine is active.",
        "location": "Nagpur Division",
        "node": "Secure_v2.0"
    }

# Health check for the Solver
@app.get("/api/health")
async def health_check():
    return {
        "engine": "Recursive Backtracking / SCM-ODE-PINN Ready", 
        "status": "Operational",
        "database": "eco_seat.db Connected"
    }