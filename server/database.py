"""Database configuration and connection management"""
from sqlmodel import SQLModel, create_engine, Session
from typing import Generator
import os
from dotenv import load_dotenv


# Load environment variables from .env file
load_dotenv()

# PostgreSQL connection URL
# Format: postgresql://username:password@host:port/database_name
DATABASE_URL = os.getenv("DATABASE_URL")

# If DATABASE_URL is not set, construct from individual environment variables
if not DATABASE_URL:
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "grp_quotation_fresh")
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Create engine with minimal threading to avoid Docker thread limits
engine = create_engine(
    DATABASE_URL, 
    echo=False,  # Disable logging to reduce overhead
    pool_pre_ping=True,  # Verify connections before using them
    pool_size=2,  # Reduced pool size to minimize threads
    max_overflow=3,  # Reduced overflow
    pool_timeout=30,
    pool_recycle=3600,
    connect_args={
        "connect_timeout": 10,
    }
)


def get_session() -> Generator[Session, None, None]:
    """Get database session - simplified to avoid threading issues"""
    session = Session(engine, expire_on_commit=False)
    try:
        yield session
    finally:
        session.close()
