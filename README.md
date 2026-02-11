# 📄 GRP Quotation Generator

**Automated quotation document generator for GRP water tanks with PostgreSQL database**

Generate professional Word documents (`.docx`) for quotations with one click. Supports multiple company templates (GRP, PIPECO, COLEX) with automatic calculations, customizable terms, signature management, and full database storage.

Python: Run pip install -r requirements.txt in the server directory
Node.js: Run npm install in the client directory

---

## ✨ Features

- 🏢 **Multiple Company Templates** - GRP, PIPECO, COLEX
- 🧮 **Auto Calculations** - Volume, capacity, pricing, VAT
- 📐 **Tank Specifications** - Dimensions, types, partitions
- 📝 **Customizable Terms** - Toggle and edit contract sections
- ✍️ **Signature Management** - Sales and office signatories
- 📥 **Instant Export** - Generate professional Word documents
- 🌐 **Web Interface** - User-friendly form-based UI
- 🗄️ **PostgreSQL Database** - Full data persistence with 6 tables

---

## 📋 Prerequisites

### Required Software

1. **PostgreSQL** (Database)
   - Download: https://www.postgresql.org/download/windows/
   - Version: 12 or higher
   - During installation, remember your password for 'postgres' user

2. **Python** (Backend)
   - Version: 3.8 or higher
   - Download: https://www.python.org/downloads/

3. **Node.js** (Frontend)
   - Version: 18 or higher
   - Download: https://nodejs.org/

---

## 🚀 Quick Start

### **Step 1: Setup Database (First Time Only)**

After installing PostgreSQL, run:

```powershell
cd server
SETUP_DATABASE.bat
```

This will:
- ✓ Create the `grp_quotation` database
- ✓ Create all 6 tables (company_details, recipient_details, sales_details, project_manager_details, contractual_terms_specifications, quotation_webpage_input_details_save)
- ✓ Set up triggers and indexes
- ✓ Insert sample company data
- ✓ Install Python dependencies
- ✓ Test database connection

See [DATABASE_SETUP_COMPLETE.md](DATABASE_SETUP_COMPLETE.md) for details.

### **Step 2: Start Application**

**Fastest Way (1-Click):**

```powershell
# Just double-click this file:
START_HERE.bat
```

This will start everything and open your browser automatically.

**OR Manual Start:**

**Terminal 1 - Backend:**
```powershell
cd server
python api_server.py
```

**Terminal 2 - Frontend:**
```powershell
cd client
npm run dev
```

Then visit: **http://localhost:3000**

---

## 🗄️ Database Structure

The system uses 6 PostgreSQL tables:

1. **company_details** - Company information (GRP, PIPECO, COLEX)
2. **recipient_details** - Client/customer information
3. **sales_details** - Sales personnel details
4. **project_manager_details** - Project manager details
5. **contractual_terms_specifications** - Terms, conditions, warranty, scope
6. **quotation_webpage_input_details_save** - Main quotation storage (with flexible JSONB for varying tanks)

**Database Documentation:**
- 📋 [Quick Reference](server/DATABASE_QUICK_REF.md) - Commands and queries
- 📖 [Complete Structure](server/DATABASE_STRUCTURE.md) - Detailed table info
- 🎨 [Visual Guide](server/DATABASE_VISUAL_GUIDE.md) - Diagrams and flow

---

## 📖 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Get started in 5 minutes
- **[HOW_TO_RUN_LOCALLY.md](HOW_TO_RUN_LOCALLY.md)** - Detailed setup guide
- **[DATA_MAPPING.md](DATA_MAPPING.md)** - Data structure reference
- **[SETUP_AND_RUN.md](SETUP_AND_RUN.md)** - Configuration details

---

## 📂 Project Structure

```
grp_quotation_generator/
├── START_HERE.bat           # 1-click starter
├── server/                  # Python FastAPI backend
│   ├── api_server.py       # API endpoints
│   ├── user_input_tank_generator.py  # Document generator
│   └── Final_Doc/          # Generated documents
└── client/                  # Next.js frontend
    ├── app/                # Pages & routes
    └── components/         # UI components
```

---

## 🎯 Usage

1. **Start the application** (use START_HERE.bat)
2. **Open browser** to http://localhost:3000
3. **Fill in the form**:
   - Company selection
   - Recipient details
   - Tank specifications
   - Terms & conditions
4. **Click "Export Quotation"**
5. **Download** the generated Word document

---

## 🔧 Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **python-docx** - Word document generation
- **Uvicorn** - ASGI server

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components

---

## 📊 API Endpoints

- `POST /generate-quotation` - Generate quotation document
- `GET /health` - Health check

**API Documentation**: http://localhost:8000/docs (when backend is running)

---

## 🔐 Environment Variables

### Server Configuration

Create `server/.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grp_quotation_fresh
DB_USER=postgres
DB_PASSWORD=your_password

# Document Storage (Optional - defaults to server/Final_Doc)
# Set to absolute path for production: C:/Documents/Quotations or /mnt/shared/quotations
FINAL_DOC_PATH=Final_Doc
```

**📁 Document Storage**: The `FINAL_DOC_PATH` can be configured to any location on your system or network.  
See **[DOCUMENT_STORAGE_CONFIG.md](DOCUMENT_STORAGE_CONFIG.md)** for detailed configuration guide.

### Client Configuration

Create `client/.env.local`:

```env
FASTAPI_URL=http://localhost:8000
```

---

## 🛠️ Development

### Backend
```powershell
cd server
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python api_server.py
```

### Frontend
```powershell
cd client
npm install
npm run dev
```

---

## 📝 Template Customization

Templates are located in `server/DATA/template/` directory:
- `grp_template.docx`
- `pipeco_template.docx`
- `colex_template.docx`

Edit with Microsoft Word to customize headers, footers, and branding.

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port already in use | Kill process or change port |
| Module not found | Run `pip install -r requirements.txt` |
| Frontend won't load | Run `npm install` in client folder |
| Document generation fails | Check template files exist |

See [HOW_TO_RUN_LOCALLY.md](HOW_TO_RUN_LOCALLY.md) for detailed troubleshooting.

---

## 📦 Output

Generated documents are saved on the server in company-specific folders:
- **Default Location**: `server/Final_Doc/{COMPANY_CODE}/`
- **Configurable**: Set `FINAL_DOC_PATH` in `.env` to save anywhere on your system
- Example paths:
  - `server/Final_Doc/GRPPT/GRPPT_2502_VV_2582.docx` (default)
  - `C:/CompanyDocs/GRPT/GRPT_2502_SJ_1001.docx` (custom Windows path)
  - `/mnt/shared/quotations/CLX/CLX_2502_AS_3001.docx` (custom Linux path)

Filename format: 
- New quotation: `GRPPT_2502_VV_2582.docx`
- Revision: `GRPPT_2502_VV_2582_R1.docx`

**Note**: Files are saved on the server only (no auto-download to browser).

**Folder Structure**:
```
{FINAL_DOC_PATH}/
  ├── GRPPT/    # GRP PIPECO quotations
  ├── GRPT/     # GRP TANKS quotations
  └── CLX/      # COLEX quotations
```

Company folders are automatically created on server startup based on company data.

**Configuration**: See [DOCUMENT_STORAGE_CONFIG.md](DOCUMENT_STORAGE_CONFIG.md) for detailed setup guide.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

[Your License Here]

---

## 🙏 Acknowledgments

Built for GRP water tank quotation management.

---

## 📞 Support

For issues or questions:
- Check the documentation in the project root
- Review error messages in terminal
- Check browser console (F12) for frontend errors

---

**Happy Quoting! 🎉**

*Version 1.0 - January 2026*
