@echo off
echo Starting GRP Quotation Generator Python API Server...
echo.
echo Installing dependencies...
pip install -r requirements.txt
echo.
echo Starting FastAPI server on http://localhost:8000
echo.
python -m uvicorn api_server:app --reload --host 0.0.0.0 --port 8000
