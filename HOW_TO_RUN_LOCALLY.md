# How to Run Locally - GRP Quotation Generator

This guide will walk you through setting up and running the GRP Quotation Generator on your local machine.

## Prerequisites

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download](https://www.python.org/downloads/)
- **Git** (optional) - [Download](https://git-scm.com/)

## Project Structure

```
grp_quotation_generator/
├── client/          # Next.js frontend
│   ├── app/
│   ├── components/
│   └── package.json
└── server/          # Python FastAPI backend
    ├── api_server.py
    ├── user_input_tank_generator.py
    ├── requirements.txt
    ├── Template_GRP.docx
    ├── Template_PIPECO.docx
    ├── Template_COLEX.docx
    ├── Final_Doc/    # Generated documents will be saved here
    └── signs&seals/  # Signature and seal images
```

## Step-by-Step Setup

### 1. Backend Setup (Python FastAPI)

#### Open PowerShell in the project directory:

```powershell
cd "C:\Users\jovan\Downloads\grp_quotation_generator\server"
```

#### Create and activate a virtual environment (recommended):

```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# If you get an error about execution policy, run this first:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Install Python dependencies:

```powershell
pip install -r requirements.txt
```

#### Start the Python backend server:

```powershell
python api_server.py
```

**Expected output:**
```
INFO:     Started server process [XXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

✅ Backend is now running on **http://localhost:8000**

Keep this terminal open and running.

---

### 2. Frontend Setup (Next.js)

#### Open a NEW PowerShell window and navigate to the client directory:

```powershell
cd "C:\Users\jovan\Downloads\grp_quotation_generator\client"
```

#### Install Node.js dependencies:

```powershell
npm install
```

#### Create environment file (if needed):

Create a file named `.env.local` in the `client` directory with:

```env
FASTAPI_URL=http://localhost:8000
```

#### Start the Next.js development server:

```powershell
npm run dev
```

**Expected output:**
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - ready in X.Xs
```

✅ Frontend is now running on **http://localhost:3000**

---

## Using the Application

### Access the Application

1. Open your browser and go to: **http://localhost:3000**
2. You should see the GRP Quotation Generator interface

### Create a Quotation

1. **Fill in the form:**
   - Company selection (GRP/PIPECO/COLEX)
   - Recipient details (name, company, location, phone, email)
   - Quotation details (date, number, subject, project)
   - Tank specifications (dimensions, type, quantity, pricing)
   - Terms & conditions (select which sections to include)

2. **Click "Export Quotation"**
   - The frontend sends data to the backend
   - The Python script generates a Word document
   - The document downloads automatically to your browser

3. **Find your generated document:**
   - Downloads folder (browser downloads)
   - Or in: `server/Final_Doc/` folder

---

## Troubleshooting

### Backend Issues

#### Port 8000 already in use:
```powershell
# Kill the process using port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or change the port in api_server.py (line 269):
uvicorn.run(app, host="0.0.0.0", port=8001)  # Use 8001 instead
```

#### Python module not found:
```powershell
# Make sure virtual environment is activated
.\venv\Scripts\Activate.ps1

# Reinstall dependencies
pip install -r requirements.txt
```

#### Template files not found:
Make sure these files exist in the `server/` directory:
- `Template_GRP.docx`
- `Template_PIPECO.docx`
- `Template_COLEX.docx`

### Frontend Issues

#### Port 3000 already in use:
```powershell
# Kill the process or use a different port
npm run dev -- -p 3001
```

#### Cannot connect to backend:
Check that:
1. Backend is running on port 8000
2. `.env.local` has correct `FASTAPI_URL=http://localhost:8000`
3. No firewall blocking the connection

#### Dependencies installation failed:
```powershell
# Clear cache and reinstall
npm cache clean --force
rm -r node_modules package-lock.json
npm install
```

---

## Quick Start Scripts

### Windows (PowerShell)

Create `start_all.ps1`:

```powershell
# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; .\venv\Scripts\Activate.ps1; python api_server.py"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm run dev"

# Open browser
Start-Sleep -Seconds 5
Start-Process "http://localhost:3000"
```

Run it:
```powershell
.\start_all.ps1
```

---

## Production Deployment

### Backend (FastAPI)

For production, use a production ASGI server:

```powershell
pip install gunicorn
gunicorn api_server:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend (Next.js)

Build and start:

```powershell
npm run build
npm start
```

Or deploy to:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **AWS / Azure / GCP**

---

## Testing the API

### Health Check:

```powershell
# Browser or PowerShell
Invoke-WebRequest http://localhost:8000/health
```

Expected response: `{"status":"ok"}`

### Test Document Generation:

```powershell
# Use tools like Postman, Insomnia, or curl
curl -X POST http://localhost:8000/generate-quotation `
  -H "Content-Type: application/json" `
  -d "@test_quotation.json"
```

---

## Additional Notes

### Template Customization

- Templates are located in `server/` directory
- Edit them with Microsoft Word
- Preserve the header/footer structure

### Database (Optional)

The app uses Supabase for storing quotation history (optional):
- Set up Supabase account
- Configure in `client/lib/supabase.ts`

### File Permissions

Make sure the `server/Final_Doc/` directory has write permissions for generated documents.

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review error messages in terminal
3. Check browser console (F12) for frontend errors
4. Review FastAPI logs in backend terminal

---

## Summary - Quick Commands

```powershell
# Terminal 1 - Backend
cd server
.\venv\Scripts\Activate.ps1
python api_server.py

# Terminal 2 - Frontend
cd client
npm run dev

# Browser
# Open http://localhost:3000
```

**That's it! Your quotation generator is now running locally.** 🎉
