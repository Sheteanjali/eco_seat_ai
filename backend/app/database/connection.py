from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = "sqlite:///./eco_seat.db" 

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False},
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_and_sync_db():
    """
    Ensures structural models map clean onto database schemas
    """
    try:
        from . import models 
        
        # Pushes newly compiled model fields (including column_bounds) to database files
        Base.metadata.create_all(bind=engine)
        print("🚀 [ECO-SEAT DATABASE MATRIX] - Asymmetric schemas compiled successfully!")
    except Exception as e:
        print(f"⚠️ [DATABASE BOOTSTRAP ALERT] - Schema sync interrupted: {str(e)}")

# Trigger synchronization instantly on engine boot up
init_and_sync_db()