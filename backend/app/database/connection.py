from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Mapped explicitly to your production configuration database
DATABASE_URL = "sqlite:///./eco_seat.db" 

# 🏎️ SPEED-OPTIMIZED ENGINE: Disables thread locks for super-fast lookups
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False},
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# This is the exact function your auth.py and main.py look for
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()