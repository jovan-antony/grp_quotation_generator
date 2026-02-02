# 🎯 Visual Quick Start Guide

## 🚀 START HERE - 3 Simple Steps

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Step 1: Double-click this file                        │
│  ┌─────────────────────────┐                           │
│  │   START_HERE.bat        │  ← In project root        │
│  └─────────────────────────┘                           │
│                                                         │
│  Step 2: Wait for browser to open (auto)               │
│  ┌─────────────────────────┐                           │
│  │ http://localhost:3000   │                           │
│  └─────────────────────────┘                           │
│                                                         │
│  Step 3: Fill form and click Export                    │
│  ┌─────────────────────────┐                           │
│  │ [Export Quotation] 📥   │                           │
│  └─────────────────────────┘                           │
│                                                         │
│  ✅ Done! Document downloads automatically             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🖥️ What You'll See

### Terminal Windows (2 will open)

```
┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐
│ Backend - FastAPI                    │  │ Frontend - Next.js                   │
├──────────────────────────────────────┤  ├──────────────────────────────────────┤
│                                      │  │                                      │
│ INFO: Uvicorn running on             │  │ ▲ Next.js 14.x.x                     │
│       http://0.0.0.0:8000            │  │ - Local:   http://localhost:3000     │
│                                      │  │                                      │
│ Press CTRL+C to quit                 │  │ ✓ Ready in 2.1s                      │
│                                      │  │                                      │
│ ✅ Keep this window open             │  │ ✅ Keep this window open             │
│                                      │  │                                      │
└──────────────────────────────────────┘  └──────────────────────────────────────┘
```

### Browser Window (opens automatically)

```
┌────────────────────────────────────────────────────────────────────────┐
│ http://localhost:3000                                           [x]    │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  GRP Quotation Generator                                              │
│                                                                        │
│  Company Selection                                                     │
│  ┌───────────────────────────────┐                                    │
│  │ GRP TANKS TRADING L.L.C  ▼   │                                    │
│  └───────────────────────────────┘                                    │
│                                                                        │
│  Recipient Details                                                     │
│  Name:    [________________]                                          │
│  Company: [________________]                                          │
│  Location:[________________]                                          │
│                                                                        │
│  Tank Specifications                                                   │
│  Length: [____] Width: [____] Height: [____]                          │
│                                                                        │
│  ┌───────────────────────┐                                            │
│  │ Export Quotation  📥  │  ← Click this!                            │
│  └───────────────────────┘                                            │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Visualization

```
┌─────────────┐
│   USER      │  1. Fills form with quotation details
│  (Browser)  │
└──────┬──────┘
       │
       │ 2. Clicks "Export Quotation"
       ▼
┌─────────────────┐
│   NEXT.JS       │  3. Sends form data as JSON
│   Frontend      │
│  (Port 3000)    │
└──────┬──────────┘
       │
       │ 4. HTTP POST /api/generate-quotation
       ▼
┌─────────────────┐
│   FASTAPI       │  5. Receives data
│   Backend       │  6. Transforms data
│  (Port 8000)    │  7. Processes tanks
└──────┬──────────┘     - Parses dimensions
       │                - Calculates volumes
       │                - Determines skid types
       │                - Calculates totals
       ▼
┌─────────────────────┐
│  TANK INVOICE       │  8. Loads template (GRP/PIPECO/COLEX)
│  GENERATOR          │  9. Creates document structure
│  (Python Script)    │  10. Fills in all data
└──────┬──────────────┘  11. Formats tables
       │                 12. Adds sections
       │                 13. Saves to disk
       ▼
┌─────────────────────┐
│  quotation_XXX.docx │  14. File created
│  (Word Document)    │
└──────┬──────────────┘
       │
       │ 15. File sent back through API
       ▼
┌─────────────────┐
│   BROWSER       │  16. Auto-downloads file
│   Downloads     │
└─────────────────┘

✅ COMPLETE! Document ready to open in Microsoft Word
```

---

## 📂 File Structure

```
grp_quotation_generator/
│
├── 🚀 START_HERE.bat           ← DOUBLE-CLICK THIS!
│
├── 📖 Documentation
│   ├── QUICK_START.md          ← Read this first
│   ├── HOW_TO_RUN_LOCALLY.md   ← Detailed setup
│   ├── ARCHITECTURE.md         ← System design
│   ├── INTEGRATION_SUMMARY.md  ← What's implemented
│   └── README.md               ← Project overview
│
├── 🖥️ server/                  ← Python Backend
│   ├── api_server.py          ← FastAPI endpoints
│   ├── user_input_tank_generator.py  ← Document generator
│   ├── requirements.txt       ← Python dependencies
│   ├── Template_GRP.docx      ← Templates
│   ├── Template_PIPECO.docx
│   ├── Template_COLEX.docx
│   └── Final_Doc/             ← 📄 Generated documents here!
│
└── 🌐 client/                  ← Next.js Frontend
    ├── app/                   ← Pages & routes
    ├── components/            ← UI components
    ├── package.json           ← Node dependencies
    └── .env.local             ← Configuration
```

---

## 🎨 Form Fields Guide

### Required Fields

```
┌────────────────────────────────────────┐
│ Company Selection                      │
│ ┌────────────────────────────────────┐ │
│ │ GRP TANKS TRADING L.L.C      ▼    │ │  ← Select company
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ Recipient Details                      │
│ Title:    [Mr./Ms. ▼]                  │  ← Select title
│ Name:     [John Doe_________]          │  ← Enter name
│ Company:  [ABC Company______]          │  ← Enter company
│ Location: [Dubai, UAE_______]          │  ← Enter location
│ Phone:    [+971 50 XXX XXXX]          │  ← Enter phone
│ Email:    [email@example.com]         │  ← Optional
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ Quotation Details                      │
│ Date:     [31/01/26_________]          │  ← Auto-filled
│ Quote No: [GRPPT/2502/XX/XXX]         │  ← Enter quote number
│ Subject:  [Supply and Install]        │  ← Enter subject
│ Project:  [Location_________]          │  ← Enter project
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ Tank Specifications                    │
│ Tank Name:    [Tank A_______]          │
│ Partition:    [✓] With / [ ] Without  │
│ Type:         [HOT PRESSED ▼]          │
│ Dimensions:                            │
│   Length (M): [2.0__]                  │
│   Width (M):  [2.0__]                  │
│   Height (M): [2.0__]                  │
│ Unit:         [No___]                  │
│ Quantity:     [1____]                  │
│ Unit Price:   [15000]                  │
│ ┌──────────────────────────┐           │
│ │ Add Another Tank         │           │
│ └──────────────────────────┘           │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ Terms & Conditions                     │
│ ☑ NOTE                                 │
│ ☑ Material Specification               │
│ ☑ Warranty                             │
│ ☑ Terms and Conditions                 │
│ ☑ Supplier Scope                       │
│ ☑ Customer Scope                       │
└────────────────────────────────────────┘
```

### Auto-Calculated Fields

```
These are calculated automatically:

✓ Volume (M³)     = Length × Width × Height
✓ Capacity (Gal)  = Volume × 264.172 (USG) or 219.969 (IMG)
✓ Free Board      = 0.3 M (fixed)
✓ Net Volume      = Length × Width × (Height - 0.3)
✓ Skid Type       = Based on height
✓ Total Price     = Quantity × Unit Price
✓ Sub Total       = Sum of all tank totals
✓ VAT (5%)        = Sub Total × 0.05
✓ Grand Total     = Sub Total + VAT
```

---

## ⚡ Generation Time

```
┌────────────────────────────────────────┐
│ Click Export                           │
│         ↓                              │
│ Processing... (2-5 seconds)            │
│         ↓                              │
│ ┌────────────────────────────┐         │
│ │ ✅ Download Complete       │         │
│ │ quotation_XXX.docx         │         │
│ └────────────────────────────┘         │
└────────────────────────────────────────┘
```

---

## 🎯 Success Indicators

### ✅ Everything Working

```
Backend Terminal:
✓ INFO: Uvicorn running on http://0.0.0.0:8000

Frontend Terminal:
✓ Ready on http://localhost:3000

Browser:
✓ Form loads without errors
✓ All fields visible and working

After Export:
✓ Document downloads automatically
✓ File opens in Microsoft Word
✓ All data appears correctly
✓ Formatting looks professional
```

### ❌ Something Wrong?

```
Check these:
1. Both terminals still running?
2. No error messages in red?
3. Browser console clear? (F12 → Console)
4. Templates exist in server/ folder?
5. Internet connection OK? (for npm install)
```

---

## 🆘 Quick Troubleshooting

```
┌───────────────────────────────────────────────────────┐
│ Problem             │ Solution                        │
├───────────────────────────────────────────────────────┤
│ "Python not found"  │ Install Python from python.org  │
│                     │ Check "Add to PATH" ✓           │
├───────────────────────────────────────────────────────┤
│ "npm not found"     │ Install Node.js from nodejs.org │
├───────────────────────────────────────────────────────┤
│ "Port in use"       │ Close existing apps on          │
│                     │ ports 3000 or 8000              │
├───────────────────────────────────────────────────────┤
│ Form won't load     │ Check frontend terminal for     │
│                     │ errors, run: npm install        │
├───────────────────────────────────────────────────────┤
│ Export fails        │ Check backend terminal for      │
│                     │ errors, verify all fields filled│
├───────────────────────────────────────────────────────┤
│ Document blank      │ Check templates exist in        │
│                     │ server/ folder                  │
└───────────────────────────────────────────────────────┘
```

---

## 🎓 Learn More

```
For detailed information, read these files:

📄 QUICK_START.md
   → Getting started in 5 minutes
   → Troubleshooting guide
   → Common issues

📄 HOW_TO_RUN_LOCALLY.md
   → Detailed setup instructions
   → Manual start procedures
   → Advanced configuration

📄 ARCHITECTURE.md
   → System design
   → Data flow diagrams
   → API documentation

📄 INTEGRATION_SUMMARY.md
   → What was implemented
   → Feature list
   → Testing guide
```

---

## 💡 Pro Tips

```
1. Keep both terminal windows open while using the app

2. Don't close terminals - just minimize them

3. Generated documents are saved in:
   - Your browser's Downloads folder
   - server/Final_Doc/ folder

4. To stop the app:
   - Close both terminal windows
   OR
   - Press CTRL+C in each terminal

5. To restart:
   - Double-click START_HERE.bat again

6. Check health:
   - Visit http://localhost:8000/health
   - Should show: {"status":"ok"}
```

---

## 🎉 You're Ready!

```
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   Double-click START_HERE.bat to begin!          ║
║                                                   ║
║   Then visit: http://localhost:3000              ║
║                                                   ║
║   Fill the form → Click Export → Done! 🎯        ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

---

*Visual Quick Start Guide - January 2026*
