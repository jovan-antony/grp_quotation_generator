FROM python:3.11-slim

# Aggressive threading prevention for build and runtime
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_COLOR=1 \
    PIP_NO_PYTHON_VERSION_WARNING=1 \
    PIP_ROOT_USER_ACTION=ignore

WORKDIR /app

COPY requirements.txt .

# Install pip packages with all threading features disabled
# Use simple pip commands without progress bars or compile steps
RUN python -m pip install --no-compile --progress-bar=off fastapi==0.104.1 ; \
    python -m pip install --no-compile --progress-bar=off uvicorn==0.24.0 ; \
    python -m pip install --no-compile --progress-bar=off python-docx==1.1.0 ; \
    python -m pip install --no-compile --progress-bar=off pydantic==2.5.0 ; \
    python -m pip install --no-compile --progress-bar=off openpyxl ; \
    python -m pip install --no-compile --progress-bar=off pandas ; \
    python -m pip install --no-compile --progress-bar=off sqlmodel==0.0.14 ; \
    python -m pip install --no-compile --progress-bar=off psycopg2-binary==2.9.9 ; \
    python -m pip install --no-compile --progress-bar=off sqlalchemy==2.0.23 ; \
    python -m pip install --no-compile --progress-bar=off python-dotenv==1.0.0

COPY . .

EXPOSE 8000

# Use single worker to minimize threading issues in Docker
CMD ["uvicorn", "api_server:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--log-level", "info", "--access-log"]
