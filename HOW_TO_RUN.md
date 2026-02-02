# 🎯 HOW TO RUN LOCALLY - SUPER SIMPLE GUIDE

## Option 1: Using Batch Scripts (EASIEST) ⭐

### Windows Users:

1. **Double-click** `START_ALL.bat` in the project root folder
   - This will automatically start BOTH backend and frontend
   - Two terminal windows will open

2. **Wait** for both servers to start (about 10-30 seconds)
   - Backend: Shows "Uvicorn running on http://0.0.0.0:8000"
   - Frontend: Shows "Local: http://localhost:3000"

3. **Open browser** to `http://localhost:3000`

4. **Done!** Fill the form and click "Export Quotation"

---

## Option 2: Manual Start (2 Terminals)

### Terminal 1 - Start Backend (Python):

```powershell
cd server
python -m venv venv
.\venv\Scripts\Activate
pip install -r requirements.txt
python api_server.py
```

**Wait for**: `INFO: Uvicorn running on http://0.0.0.0:8000`

### Terminal 2 - Start Frontend (Node.js):

```powershell
cd client
npm install
npm run dev
```

**Wait for**: `Local: http://localhost:3000`

### Open Browser:

Go to `http://localhost:3000`

---

## What You Should See:

### Backend Terminal:
```
============================================================
Starting GRP Quotation Generator API Server
============================================================
Server will be available at: http://localhost:8000
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Frontend Terminal:
```
> client@0.1.0 dev
> next dev

   ▲ Next.js 14.x.x
   - Local:        http://localhost:3000
   - Ready in 1234ms
```

### Browser:
- You'll see the quotation form
- Fill it out
- Click "Export Quotation"
- Document downloads automatically!

---

## Troubleshooting Quick Fixes:

### ❌ "ModuleNotFoundError: No module named 'fastapi'"
**Fix:**
```powershell
cd server
.\venv\Scripts\Activate
pip install -r requirements.txt
```

### ❌ "Cannot find module 'next'"
**Fix:**
```powershell
cd client
npm install
```

### ❌ "Port 8000 is already in use"
**Fix:** Close any other programs using port 8000, or kill the process:
```powershell
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F
```

### ❌ "Template not found"
**Fix:** Make sure these files exist in `server/` folder:
- `Template_grp.docx`
- `Template_pipeco.docx`
- `Template_colex.docx`

---

## Stopping the Application:

- Press `CTRL + C` in both terminal windows
- Or just close the terminal windows

---

## File Output Location:

Generated quotations are saved in:
```
server/Final_Doc/Quotation_XXXXX_20260131_143022.docx
```

---

## 🎉 That's It!

The application is now running. When you click "Export Quotation":

1. ✅ Frontend collects data
2. ✅ Sends to Next.js API
3. ✅ Forwards to Python FastAPI
4. ✅ Python generates Word document
5. ✅ Document downloads automatically

**Everything works in 1 CLICK!** 🚀
