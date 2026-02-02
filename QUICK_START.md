# 🚀 Quick Start Guide - GRP Quotation Generator

## ⚡ Fastest Way to Run (1-Click Start)

### **Just double-click: `START_HERE.bat`**

This will:
1. ✅ Install all dependencies automatically
2. ✅ Start the backend server (Python FastAPI)
3. ✅ Start the frontend server (Next.js)
4. ✅ Open your browser to http://localhost:3000

**That's it! You're ready to create quotations.**

---

## 📋 Prerequisites

Before running, make sure you have installed:

1. **Python 3.8+** → [Download here](https://www.python.org/downloads/)
   - During installation, check ✅ "Add Python to PATH"
   
2. **Node.js 18+** → [Download here](https://nodejs.org/)
   - This includes npm (Node Package Manager)

To verify installations, open PowerShell and run:

```powershell
python --version
node --version
npm --version
```

---

## 🎯 Usage

### Creating a Quotation

1. **Open the app**: http://localhost:3000

2. **Fill in the form**:
   - **Company**: Select GRP, PIPECO, or COLEX
   - **Recipient Info**: Name, company, location, contact details
   - **Quotation Details**: Quote number, date, subject, project
   - **Add Tanks**: Click "Add Tank" to add each tank with specifications
   - **Terms & Conditions**: Select which sections to include

3. **Click "Export Quotation"** button

4. **Download**: The Word document will automatically download

5. **Find your document**:
   - In your browser's Downloads folder
   - Or in: `server\Final_Doc\` folder

---

## 🛠️ Manual Start (If batch file doesn't work)

### Option 1: Using Provided Scripts

**Start Backend:**
```
Double-click: start_backend.bat
```

**Start Frontend:**
```
Double-click: start_frontend.bat
```

### Option 2: Manual Commands

**Terminal 1 - Backend:**
```powershell
cd server
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python api_server.py
```

**Terminal 2 - Frontend:**
```powershell
cd client
npm install
npm run dev
```

Then open: http://localhost:3000

---

## 🔧 Troubleshooting

### "Python not found"
- Install Python from python.org
- Make sure "Add to PATH" was checked during installation
- Restart your terminal/PowerShell

### "npm not found"
- Install Node.js from nodejs.org
- Restart your terminal/PowerShell

### "Port already in use"
```powershell
# Kill processes on ports 3000 and 8000
netstat -ano | findstr :3000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Backend won't start
```powershell
cd server
.\venv\Scripts\Activate.ps1
pip install --upgrade -r requirements.txt
```

### Frontend won't start
```powershell
cd client
rm -r node_modules package-lock.json
npm install
```

### "Cannot connect to backend"
1. Make sure backend is running (Terminal 1 should show "Uvicorn running on http://0.0.0.0:8000")
2. Check `client\.env.local` has: `FASTAPI_URL=http://localhost:8000`

---

## 📁 Project Structure

```
grp_quotation_generator/
│
├── START_HERE.bat          ← Double-click this to start everything
├── start_backend.bat       ← Start backend only
├── start_frontend.bat      ← Start frontend only
│
├── server/                 ← Python backend
│   ├── api_server.py      ← FastAPI server
│   ├── user_input_tank_generator.py  ← Document generator
│   ├── requirements.txt   ← Python dependencies
│   ├── Template_GRP.docx  ← Templates
│   ├── Template_PIPECO.docx
│   ├── Template_COLEX.docx
│   └── Final_Doc/         ← Generated documents saved here
│
└── client/                ← Next.js frontend
    ├── app/              ← Pages and routes
    ├── components/       ← UI components
    ├── package.json      ← Node dependencies
    └── .env.local        ← Backend URL configuration
```

---

## 🌐 Accessing the Application

Once both servers are running:

- **Frontend (UI)**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Health Check**: http://localhost:8000/health
- **API Docs**: http://localhost:8000/docs

---

## 🚪 Stopping the Servers

**Option 1**: Close the terminal windows
**Option 2**: Press `CTRL + C` in each terminal
**Option 3**: Click the X button on terminal windows

---

## 💡 Tips

1. **Template Customization**: Edit template files in `server/` directory with Microsoft Word

2. **Backup**: Generated quotations are saved in `server/Final_Doc/`

3. **Testing**: Use the health check endpoint to verify backend: http://localhost:8000/health

---

## ✅ Quick Checklist

Before starting:
- [ ] Python installed
- [ ] Node.js installed
- [ ] Template files exist in `server/` folder

To start:
- [ ] Double-click `START_HERE.bat`
- [ ] Wait for browser to open
- [ ] Fill in quotation form
- [ ] Click Export
- [ ] Document downloads successfully

---

## 🎉 You're All Set!

**Happy Quoting! 🚀**

For detailed troubleshooting, see `HOW_TO_RUN_LOCALLY.md`

---

*Last Updated: January 2026*

- See `SETUP_AND_RUN.md` for detailed setup instructions
- See `DATA_MAPPING.md` for data format specifications
- Check Python terminal for backend errors
- Check browser console (F12) for frontend errors
