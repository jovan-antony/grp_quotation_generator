FROM python:3.11-slim

# Set environment to reduce thread usage during build
ENV PIP_NO_COLOR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .

# Install packages one at a time to reduce concurrent thread usage
# This is more reliable on systems with threading limitations
RUN pip install --no-cache-dir fastapi==0.104.1 && \
    pip install --no-cache-dir uvicorn==0.24.0 && \
    pip install --no-cache-dir python-docx==1.1.0 && \
    pip install --no-cache-dir pydantic==2.5.0 && \
    pip install --no-cache-dir openpyxl && \
    pip install --no-cache-dir pandas && \
    pip install --no-cache-dir sqlmodel==0.0.14 && \
    pip install --no-cache-dir psycopg2-binary==2.9.9 && \
    pip install --no-cache-dir sqlalchemy==2.0.23 && \
    pip install --no-cache-dir python-dotenv==1.0.0

COPY . .

EXPOSE 8000

# Use single worker to minimize threading issues in Docker
# Added --log-level for better debugging
CMD ["uvicorn", "api_server:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--log-level", "info", "--access-log"]
