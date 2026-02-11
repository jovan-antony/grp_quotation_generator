# GRP Quotation Generator - Software Structure

## Project Overview
A web-based application for generating professional GRP water tank quotations in Word document format, with database integration for managing quotations, companies, and personnel.

---

## 📁 Root Directory Structure

```
grp_quotation_generator/
│
├── 📄 Root Documentation Files
│   ├── README.md                      # Main project documentation
│   ├── README_SETUP.md                # Initial setup guide
│   ├── QUICK_START.md                 # Quick start guide
│   ├── HOW_TO_RUN.md                  # Execution instructions
│   ├── HOW_TO_RUN_LOCALLY.md          # Local development guide
│   ├── SETUP_AND_RUN.md               # Setup and run instructions
│   ├── VISUAL_GUIDE.md                # Visual user guide
│   ├── ARCHITECTURE.md                # System architecture
│   ├── DATA_MAPPING.md                # Data structure mapping
│   ├── INTEGRATION_SUMMARY.md         # Integration documentation
│   ├── INTEGRATION_COMPLETE.md        # Integration completion status
│   ├── CHECKLIST.md                   # Development checklist
│   └── PROJECT_STRUCTURE.md           # This file
│
├── 🚀 Startup Scripts
│   ├── START_HERE.bat                 # Main launcher (starts both frontend & backend)
│   ├── START_ALL.bat                  # Alternative launcher
│   ├── start_frontend.bat             # Frontend only launcher
│   ├── start_backend.bat              # Backend only launcher
│   └── test_setup.bat                 # Test setup script
│
├── 📊 Sample Data
│   └── sample_quotations.json         # Sample quotation data for database seeding
│
├── 🌐 client/                         # Frontend - Next.js Application
│   └── [See Frontend Structure below]
│
└── 🖥️ server/                         # Backend - FastAPI Application
    └── [See Backend Structure below]
```

---

## 🌐 Frontend Structure (client/)

```
client/
│
├── 📄 Configuration Files
│   ├── package.json                   # Node.js dependencies and scripts
│   ├── package-lock.json              # Locked dependency versions
│   ├── next.config.js                 # Next.js configuration
│   ├── next-env.d.ts                  # Next.js TypeScript declarations
│   ├── tsconfig.json                  # TypeScript configuration
│   ├── tailwind.config.ts             # Tailwind CSS configuration
│   ├── postcss.config.js              # PostCSS configuration
│   ├── components.json                # shadcn/ui components config
│   ├── .env.local                     # Environment variables (not in git)
│   ├── .gitignore                     # Git ignore rules
│   ├── netlify.toml                   # Netlify deployment config
│   ├── README_QUOTATION.md            # Quotation feature documentation
│   ├── BACKEND_INTEGRATION.md         # Backend integration guide
│   └── START_FRONTEND.bat             # Frontend startup script
│
├── 📱 app/                            # Next.js App Router
│   ├── layout.tsx                     # Root layout component
│   ├── page.tsx                       # Home page (redirects to /quotation)
│   ├── globals.css                    # Global styles
│   │
│   ├── api/                           # API routes (proxy to backend)
│   │   ├── generate-quotation/
│   │   │   └── route.ts              # Generate quotation endpoint
│   │   └── preview-quotation/
│   │       └── route.ts              # Preview quotation endpoint
│   │
│   └── quotation/                     # Quotation feature page
│       └── page.tsx                   # Quotation form page
│
├── 🧩 components/                     # React Components
│   │
│   ├── quotation/                     # Quotation-specific components
│   │   ├── NewQuotationForm.tsx      # Main quotation form (with all features)
│   │   ├── QuotationRevisionForm.tsx # Revision form component
│   │   └── TankForm.tsx              # Individual tank input form
│   │
│   └── ui/                            # shadcn/ui component library
│       ├── accordion.tsx
│       ├── alert.tsx
│       ├── alert-dialog.tsx
│       ├── aspect-ratio.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── breadcrumb.tsx
│       ├── button.tsx
│       ├── calendar.tsx
│       ├── card.tsx
│       ├── carousel.tsx
│       ├── chart.tsx
│       ├── checkbox.tsx
│       ├── collapsible.tsx
│       ├── command.tsx
│       ├── context-menu.tsx
│       ├── dialog.tsx
│       ├── drawer.tsx
│       ├── dropdown-menu.tsx
│       ├── form.tsx
│       ├── hover-card.tsx
│       ├── input.tsx
│       ├── input-otp.tsx
│       ├── label.tsx
│       ├── menubar.tsx
│       ├── navigation-menu.tsx
│       ├── pagination.tsx
│       ├── popover.tsx
│       ├── progress.tsx
│       ├── radio-group.tsx
│       ├── resizable.tsx
│       ├── scroll-area.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── skeleton.tsx
│       ├── slider.tsx
│       ├── sonner.tsx
│       ├── switch.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       ├── toast.tsx
│       ├── toaster.tsx
│       ├── toggle.tsx
│       ├── toggle-group.tsx
│       └── tooltip.tsx
│
├── 🪝 hooks/                          # Custom React Hooks
│   └── use-toast.ts                   # Toast notification hook
│
├── 📚 lib/                            # Utility Libraries
│   ├── utils.ts                       # General utility functions
│   └── supabase.ts                    # Supabase client (if used)
│
├── 🗄️ supabase/                       # Database Migrations
│   └── migrations/
│       └── 20260129143429_create_quotations_schema.sql
│
├── 🖼️ public/                         # Static Assets
│   └── (images, fonts, etc.)
│
└── 📦 node_modules/                   # Node.js dependencies (not in git)
```

---

## 🖥️ Backend Structure (server/)

```
server/
│
├── 📄 Configuration & Entry Files
│   ├── api_server.py                  # Main FastAPI application
│   ├── requirements.txt               # Python dependencies
│   ├── .env                           # Environment variables (not in git)
│   ├── .env.example                   # Environment variables template
│   ├── start_server.bat               # Backend startup script
│   └── START_BACKEND.bat              # Alternative backend starter
│
├── 🏗️ Core Application Files
│   ├── user_input_tank_generator.py   # Word document generator class
│   ├── models.py                      # SQLModel database models
│   ├── database.py                    # Database connection/session
│   └── sync_excel_to_db.py            # Excel to database sync utility
│
├── 📄 Word Document Templates
│   ├── Template_GRP.docx              # GRP Tanks Trading template
│   ├── Template_PIPECO.docx           # GRP Pipeco template
│   └── Template_COLEX.docx            # Colex template
│
├── 📊 Excel Data Files
│   ├── company_details.xlsx           # Company information
│   ├── sales_person_details.xlsx      # Sales personnel data
│   └── Project_manager_details.xlsx   # Project manager data
│
├── 🖼️ signs&seals/                    # Signature & Seal Images
│   ├── pipeco_seal.png               # Company seals
│   ├── colex_seal.png
│   ├── grp_seal.png
│   ├── (salesperson)_sign.png        # Individual signatures
│   └── (manager)_sign.png
│
├── 📁 Final_Doc/                      # Generated Documents Output
│   └── quotation_*.docx              # Generated quotation files
│
├── 🗄️ Database File
│   └── grp_quotation.db              # SQLite database file
│
└── 🐍 __pycache__/                    # Python cache (not in git)
```

---

## 🔗 Technology Stack

### Frontend
- **Framework**: Next.js 14+ (React, TypeScript)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Fetch API
- **Build Tool**: Next.js built-in (Turbopack/Webpack)

### Backend
- **Framework**: FastAPI (Python)
- **Database**: SQLite + SQLModel ORM
- **Document Generation**: python-docx, python-docx-template
- **Excel Processing**: pandas, openpyxl
- **Data Validation**: Pydantic
- **CORS**: FastAPI CORS middleware

### Database
- **Primary**: SQLite (local development)
- **ORM**: SQLModel
- **Migrations**: Manual SQL scripts

### DevOps
- **Version Control**: Git + GitHub
- **Backend**: Local server (port 8000)
- **Frontend Dev**: Local server (port 3000)

---

## 📊 Database Schema

### Tables
1. **company_details** - Company information
2. **sales_details** - Sales personnel data
3. **project_manager_details** - Project managers
4. **recipient_details** - Client information
5. **quotation_webpage_input_details_save** - Form input storage
6. **contractual_terms_specifications** - Terms & conditions

---

## 🔄 Data Flow

```
┌─────────────────┐
│  USER BROWSER   │
│  (Port 3000)    │
└────────┬────────┘
         │
         ├─ Form Input
         │
         ▼
┌─────────────────┐
│  NEXT.JS        │
│  Frontend       │
└────────┬────────┘
         │
         ├─ HTTP POST
         │
         ▼
┌─────────────────┐
│  FASTAPI        │
│  Backend        │
│  (Port 8000)    │
└────────┬────────┘
         │
         ├─────────────┬─────────────┐
         │             │             │
         ▼             ▼             ▼
    ┌────────┐   ┌─────────┐   ┌──────────┐
    │ SQLite │   │  Excel  │   │ Template │
    │   DB   │   │  Files  │   │  .docx   │
    └────────┘   └─────────┘   └──────────┘
         │
         ├─ Data Processing
         │
         ▼
┌──────────────────────┐
│ Word Document (.docx)│
│ Generated Quotation  │
└──────────────────────┘
         │
         ├─ Download
         │
         ▼
┌─────────────────┐
│  USER BROWSER   │
│  (Downloads)    │
└─────────────────┘
```

---

## 🚀 Key Features

### Implemented Features
1. ✅ Dynamic form with real-time validation
2. ✅ Multiple tank support with options
3. ✅ Excel data integration (companies, sales, managers)
4. ✅ Database storage for all data
5. ✅ Automatic quote number generation
6. ✅ Dynamic dropdown population
7. ✅ Terms & conditions customization
8. ✅ Signature section automation
9. ✅ Footer seal image placement
10. ✅ Enter key navigation
11. ✅ Discount calculation support
12. ✅ Free board customization
13. ✅ Support system selection (internal/external)
14. ✅ Revision number support
15. ✅ PDF-like formatting in Word

### Future Enhancements (Planned)
- [ ] PostgreSQL migration for production
- [ ] Quotation status tracking (draft/sent/approved/rejected)
- [ ] Advanced filtering and search
- [ ] Edit and regenerate existing quotations
- [ ] User authentication and roles
- [ ] Email quotation directly
- [ ] Multi-language support
- [ ] PDF export option
- [ ] Dashboard with analytics
- [ ] Quotation comparison tool

---

## 📝 File Naming Conventions

### Generated Documents
- Format: `quotation_{QUOTE_NUMBER}_{TIMESTAMP}.docx`
- Example: `quotation_GRPPT_2602_MM_4185_20260203_143022.docx`

### Code Files
- TypeScript/React: PascalCase (e.g., `NewQuotationForm.tsx`)
- Python: snake_case (e.g., `user_input_tank_generator.py`)
- Config files: lowercase with dots (e.g., `next.config.js`)
- Batch files: UPPERCASE (e.g., `START_HERE.bat`)
- Markdown: UPPERCASE (e.g., `README.md`)

---

## 🔐 Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (.env)
```
DATA_PATH=C:\Users\...\server
DATABASE_URL=sqlite:///./grp_quotation.db
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

---

## 📦 Dependencies Summary

### Frontend (package.json)
- next: ^14.x.x
- react: ^18.x.x
- typescript: ^5.x.x
- tailwindcss: ^3.x.x
- shadcn/ui components
- react-hook-form
- zod validation

### Backend (requirements.txt)
- fastapi
- uvicorn
- sqlmodel
- pandas
- python-docx
- openpyxl
- python-dotenv
- pydantic

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Form validation (all fields)
- [ ] Tank calculations (volume, gallons)
- [ ] Quote number generation
- [ ] Document generation
- [ ] Excel data sync
- [ ] Database CRUD operations
- [ ] API endpoints
- [ ] Frontend-backend integration

---

## 📞 Support & Maintenance

### Key Files for Troubleshooting
1. `api_server.py` - Backend API logic
2. `user_input_tank_generator.py` - Document generation
3. `NewQuotationForm.tsx` - Frontend form logic
4. `sync_excel_to_db.py` - Data synchronization
5. `models.py` - Database schema

### Common Issues
- Port conflicts: Check ports 3000 & 8000
- Database: Check `grp_quotation.db` file permissions
- Templates: Verify `.docx` files exist in server/
- Excel: Ensure `.xlsx` files are not open in Excel

---

**Last Updated**: February 11, 2026
**Version**: 1.0.0
**Maintainer**: Joyal Antony
