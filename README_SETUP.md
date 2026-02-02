# 🚀 GRP Quotation Generator - Quick Start Guide

## Prerequisites

Before you begin, ensure you have installed:

- **Python 3.8+** - [Download here](https://www.python.org/downloads/)
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Git** (optional) - For cloning the repository

## 📁 Project Structure

```
grp_quotation_generator/
├── client/                 # Next.js frontend
│   ├── app/
│   ├── components/
│   └── package.json
├── server/                 # Python FastAPI backend
│   ├── api_server.py       # FastAPI server
│   ├── user_input_tank_generator.py  # Document generator
│   ├── requirements.txt    # Python dependencies
│   ├── Template_grp.docx   # GRP template
│   ├── Template_pipeco.docx # Pipeco template
│   ├── Template_colex.docx  # Colex template
│   ├── signs&seals/        # Signature images
│   └── Final_Doc/          # Generated documents output
└── README_SETUP.md         # This file
```

## 🔧 Installation Steps

### Step 1: Install Python Backend

Open PowerShell in the project root directory:

```powershell
# Navigate to server directory
cd server

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate

# Install Python dependencies
pip install -r requirements.txt
```

### Step 2: Install Next.js Frontend

Open a NEW PowerShell window:

```powershell
# Navigate to client directory
cd client

# Install Node dependencies
npm install
```

## ▶️ Running the Application

You need to run BOTH the backend and frontend servers.

### Terminal 1: Start Python FastAPI Backend

```powershell
# Navigate to server directory
cd server

# Activate virtual environment (if not already activated)
.\venv\Scripts\Activate

# Start FastAPI server
python api_server.py
```

You should see:
```
============================================================
Starting GRP Quotation Generator API Server
============================================================
Server will be available at: http://localhost:8000
API Documentation: http://localhost:8000/docs
============================================================

INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### Terminal 2: Start Next.js Frontend

```powershell
# Navigate to client directory
cd client

# Start Next.js development server
npm run dev
```

You should see:
```
> client@0.1.0 dev
> next dev

   ▲ Next.js 14.x.x
   - Local:        http://localhost:3000
   - Ready in Xms
```

## 🌐 Access the Application

1. **Frontend UI**: Open your browser and go to `http://localhost:3000`
2. **API Documentation**: Visit `http://localhost:8000/docs` to see FastAPI interactive docs
3. **Health Check**: Test backend at `http://localhost:8000/health`

## 📝 How to Use

1. **Fill in the form** on the frontend with quotation details:
   - Company & Recipient Details
   - Quotation Information
   - Tank Details (add multiple tanks/options)
   - Contractual Terms & Specifications

2. **Click "Export Quotation"** button
   - The frontend sends data to Next.js API route
   - Next.js forwards to Python FastAPI backend
   - Python generates the Word document
   - Document automatically downloads to your browser

3. **Find generated files** in `server/Final_Doc/` directory

## 🛑 Stopping the Servers

- Press `CTRL + C` in each terminal window
- Deactivate Python virtual environment: `deactivate`

## 🔍 Troubleshooting

### Backend Won't Start

**Issue**: `ModuleNotFoundError: No module named 'fastapi'`

**Solution**:
```powershell
cd server
.\venv\Scripts\Activate
pip install -r requirements.txt
```

### Frontend Won't Start

**Issue**: `Error: Cannot find module 'next'`

**Solution**:
```powershell
cd client
npm install
```

### Template Not Found

**Issue**: `Template not found: Template_grp.docx`

**Solution**: Ensure template files exist in the `server/` directory:
- `Template_grp.docx`
- `Template_pipeco.docx`
- `Template_colex.docx`

### Connection Refused

**Issue**: `Failed to fetch from http://localhost:8000`

**Solution**: Make sure Python backend is running first before starting frontend

### Port Already in Use

**Issue**: `Error: Port 3000 is already in use`

**Solution**:
```powershell
# For frontend - use a different port
npm run dev -- -p 3001

# For backend - edit api_server.py and change port 8000 to something else
```

## 📊 API Endpoint

**POST** `/generate-quotation`

Sends quotation data and receives a `.docx` file.

**Request Body**:
```json
{
  "fromCompany": "GRP TANKS TRADING L.L.C",
  "recipientName": "Ms. Hridya.",
  "companyName": "M/s. Multiflags Contracting",
  "quotationNumber": "GRPPT/2502/VV/2582",
  "tanks": [...],
  "terms": {...}
}
```

**Response**: Word document (.docx file)

## 🔐 Environment Variables

Create `.env.local` in `client/` directory (optional):

```env
FASTAPI_URL=http://localhost:8000
```

## 📞 Support

If you encounter issues:

1. Check both terminals for error messages
2. Verify all dependencies are installed
3. Ensure templates exist in server directory
4. Check firewall isn't blocking ports 3000 or 8000

## ✅ Quick Checklist

- [ ] Python 3.8+ installed
- [ ] Node.js 18+ installed
- [ ] Python dependencies installed (`pip install -r requirements.txt`)
- [ ] Node dependencies installed (`npm install`)
- [ ] Template files present in `server/` directory
- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Browser opened to `http://localhost:3000`

---

**You're all set!** 🎉 The application should now work in 1 click after filling the form.
