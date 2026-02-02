# 📄 GRP Quotation Generator

**Automated quotation document generator for GRP water tanks**

Generate professional Word documents (`.docx`) for quotations with one click. Supports multiple company templates (GRP, PIPECO, COLEX) with automatic calculations, customizable terms, and signature management.

---

## ✨ Features

- 🏢 **Multiple Company Templates** - GRP, PIPECO, COLEX
- 🧮 **Auto Calculations** - Volume, capacity, pricing, VAT
- 📐 **Tank Specifications** - Dimensions, types, partitions
- 📝 **Customizable Terms** - Toggle and edit contract sections
- ✍️ **Signature Management** - Sales and office signatories
- 📥 **Instant Export** - Generate professional Word documents
- 🌐 **Web Interface** - User-friendly form-based UI

---

## 🚀 Quick Start

### **Fastest Way (1-Click)**

```powershell
# Just double-click this file:
START_HERE.bat
```

This will start everything and open your browser automatically.

### **Manual Start**

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

## 📋 Prerequisites

- **Python 3.8+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)

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

Templates are located in `server/` directory:
- `Template_GRP.docx`
- `Template_PIPECO.docx`
- `Template_COLEX.docx`

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

Generated documents are saved in:
- `server/Final_Doc/` folder
- Your browser's Downloads folder

Filename format: `quotation_GRPPT_2502_VV_2582.docx`

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
