# ✅ Pre-Flight Checklist

Before running the application, verify these requirements:

## 📋 Software Requirements

- [ ] **Python 3.8 or higher** installed
  - Check: Open PowerShell and run `python --version`
  - Should show: `Python 3.8.x` or higher
  
- [ ] **Node.js 18 or higher** installed
  - Check: Open PowerShell and run `node --version`
  - Should show: `v18.x.x` or higher

- [ ] **npm** (comes with Node.js)
  - Check: Run `npm --version`
  - Should show: `9.x.x` or higher

## 📁 Required Files

Check that these files exist in `server/` directory:

- [ ] `api_server.py`
- [ ] `user_input_tank_generator.py`
- [ ] `requirements.txt`
- [ ] `Template_grp.docx`
- [ ] `Template_pipeco.docx`
- [ ] `Template_colex.docx`
- [ ] `signs&seals/` folder (with signature images)

Check that these exist in `client/` directory:

- [ ] `package.json`
- [ ] `app/` folder
- [ ] `components/` folder

## 🔧 First-Time Setup

### Backend Setup:

```powershell
cd server
python -m venv venv
.\venv\Scripts\Activate
pip install -r requirements.txt
```

- [ ] Virtual environment created successfully
- [ ] All Python packages installed without errors

### Frontend Setup:

```powershell
cd client
npm install
```

- [ ] All npm packages installed successfully
- [ ] No critical errors in output

## 🚀 Running Checklist

Before starting the application:

- [ ] No other applications using port 3000
- [ ] No other applications using port 8000
- [ ] Templates exist in server folder
- [ ] You have two PowerShell windows open (or use START_ALL.bat)

## ✅ Startup Verification

After starting both servers:

### Backend (Port 8000):
- [ ] Terminal shows "Uvicorn running on http://0.0.0.0:8000"
- [ ] No error messages in terminal
- [ ] Visit http://localhost:8000/health - shows `{"status":"ok"}`

### Frontend (Port 3000):
- [ ] Terminal shows "Local: http://localhost:3000"
- [ ] No compilation errors
- [ ] Browser opens to http://localhost:3000
- [ ] Quotation form is visible and responsive

## 🧪 Test the Integration

- [ ] Fill in recipient name: "Ms. Hridya."
- [ ] Fill in company name: "M/s. Test Company"
- [ ] Fill in quotation number: "TEST/2601/01"
- [ ] Add at least one tank with details
- [ ] Click "Export Quotation"
- [ ] Document downloads automatically
- [ ] Check `server/Final_Doc/` for generated file

## 🎯 Success Criteria

✅ **Application is working correctly if:**

1. Form loads without errors
2. All input fields are editable
3. "Export Quotation" button is clickable
4. After clicking, you see:
   - "Quotation saved! Generating document..." toast
   - "Document generated successfully!" toast
   - .docx file downloads automatically
5. Generated file opens in Microsoft Word
6. Document contains all entered data formatted correctly

## 🆘 Common Issues & Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| Module not found errors | Run `pip install -r requirements.txt` again |
| Port already in use | Kill the process or use different ports |
| Template not found | Ensure .docx files are in server/ folder |
| npm install fails | Delete `node_modules/` and `package-lock.json`, run `npm install` again |
| Python version too old | Update Python to 3.8+ |
| Virtual environment won't activate | Run PowerShell as Administrator |

## 📝 Notes

- Generated documents are saved in `server/Final_Doc/`
- Each document has a unique timestamp in the filename
- Backend logs show detailed information about each request
- Frontend console (F12) shows any client-side errors

---

## ✅ All Clear?

If all checkboxes are checked, you're ready to run:

```powershell
# Option 1: Easy way
START_ALL.bat

# Option 2: Manual way (2 terminals)
# Terminal 1: cd server && START_BACKEND.bat
# Terminal 2: cd client && START_FRONTEND.bat
```

**Happy quotation generating! 🎉**
