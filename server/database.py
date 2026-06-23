"""Database configuration and connection management"""
from sqlmodel import SQLModel, create_engine, Session
from typing import AsyncGenerator
import os
from dotenv import load_dotenv, dotenv_values
from urllib.parse import urlparse, urlunparse

try:
    import psycopg2
except Exception:
    psycopg2 = None


# Load environment variables from .env file
load_dotenv()


def _is_container_runtime() -> bool:
    """Best-effort container runtime detection."""
    return (
        os.path.exists('/.dockerenv')
        or os.getenv('KUBERNETES_SERVICE_HOST') is not None
        or os.getenv('RUNNING_IN_DOCKER', '').lower() in {'1', 'true', 'yes'}
    )


def _normalize_database_url(database_url: str) -> str:
    """Fallback Docker-only hostnames to localhost when running outside containers."""
    if not database_url:
        return database_url

    try:
        parsed = urlparse(database_url)
    except Exception:
        return database_url

    host = (parsed.hostname or '').strip().lower()
    if host not in {'postgres', 'db'}:
        return database_url

    if _is_container_runtime():
        return database_url

    fallback_host = (os.getenv('DB_HOST') or 'localhost').strip() or 'localhost'
    if fallback_host.lower() in {'postgres', 'db'}:
        fallback_host = 'localhost'

    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    local_env_values = dotenv_values(env_path) if os.path.exists(env_path) else {}

    db_user = (local_env_values.get('DB_USER') or os.getenv('DB_USER') or parsed.username or 'postgres').strip()
    db_password = local_env_values.get('DB_PASSWORD') or os.getenv('DB_PASSWORD')
    if db_password is None:
        db_password = parsed.password or 'postgres'
    db_port = (local_env_values.get('DB_PORT') or os.getenv('DB_PORT') or str(parsed.port or '5432')).strip()
    db_name = (local_env_values.get('DB_NAME') or os.getenv('DB_NAME') or parsed.path.lstrip('/') or 'grp_quotation_fresh').strip()

    netloc = parsed.netloc
    candidate_passwords = [
        db_password,
        os.getenv('DB_PASSWORD_LOCAL'),
        os.getenv('LOCAL_DB_PASSWORD'),
        parsed.password,
        'postgres123',
        'postgres',
    ]
    dedup_passwords = []
    for pwd in candidate_passwords:
        if pwd is None:
            continue
        if pwd not in dedup_passwords:
            dedup_passwords.append(pwd)

    def build_url(password: str) -> str:
        new_netloc = f"{db_user}:{password}@{fallback_host}:{db_port}"
        return urlunparse((
            parsed.scheme,
            new_netloc,
            f"/{db_name}",
            parsed.params,
            parsed.query,
            parsed.fragment,
        ))

    normalized = build_url(dedup_passwords[0] if dedup_passwords else db_password)

    if psycopg2 is not None:
        for pwd in dedup_passwords:
            try:
                conn = psycopg2.connect(
                    host=fallback_host,
                    port=int(db_port),
                    user=db_user,
                    password=pwd,
                    dbname=db_name,
                    connect_timeout=2,
                )
                conn.close()
                normalized = build_url(pwd)
                break
            except Exception:
                continue

    print(f"[database] Non-container runtime detected; using DB host '{fallback_host}' instead of '{host}'.")
    return normalized

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

DATABASE_URL = _normalize_database_url(DATABASE_URL)

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


async def get_session() -> AsyncGenerator[Session, None]:
    """Get database session without FastAPI threadpool dependency wrapping."""
    session = Session(engine, expire_on_commit=False)
    try:
        yield session
    finally:
        session.close()
