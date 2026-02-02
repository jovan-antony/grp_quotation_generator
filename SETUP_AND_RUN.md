# GRP Quotation Generator - Setup & Run Guide

This guide explains how to run the complete application with frontend (Next.js) and backend (Python FastAPI).

## Architecture

- **Frontend**: Next.js (React) - User interface for entering quotation details
- **Backend**: FastAPI (Python) - Executes the document generation script
- **Document Generation**: Python-docx - Creates Word documents from templates

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Python** (v3.8 or higher)
3. **pip** (Python package manager)

## Setup Instructions

### 1. Backend Setup (Python)

Open a terminal in the `server` folder:

```bash
cd server
```

#### Install Python Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `python-docx` - Document generation
- `pydantic` - Data validation

#### Start the Python API Server

**Option 1: Using the batch file (Windows)**
```bash
start_server.bat
```

**Option 2: Manual start**
```bash
python -m uvicorn api_server:app --reload --host 0.0.0.0 --port 8000
```

The API server will start on: `http://localhost:8000`

You can verify it's running by visiting: `http://localhost:8000/health`

### 2. Frontend Setup (Next.js)

Open another terminal in the `client` folder:

```bash
cd client
```

#### Install Node Dependencies

```bash
npm install
```

#### Configure Environment Variables

Create a `.env.local` file in the `client` folder:

```env
FASTAPI_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Start the Frontend Development Server

```bash
npm run dev
```

The frontend will start on: `http://localhost:3000`

## Usage

1. **Start both servers** (backend first, then frontend)
2. **Open browser** to `http://localhost:3000`
3. **Fill in the quotation form**:
   - Company & Recipient Details
   - Quotation Information
   - Tank Details
   - Contractual Terms & Specifications
4. **Click "Export Quotation"**
5. **Document automatically generates** and downloads as `.docx` file

## How It Works

```
┌─────────────┐      ┌──────────────┐      ┌────────────────┐
│   Browser   │─────▶│  Next.js API │─────▶│  Python API    │
│  (UI Form)  │      │   (route.ts) │      │  (FastAPI)     │
└─────────────┘      └──────────────┘      └────────────────┘
       │                                             │
       │                                             ▼
       │                                    ┌────────────────┐
       │                                    │  Python Script │
       │                                    │  (user_input_  │
       │                                    │  tank_gen...)  │
       │                                    └────────────────┘
       │                                             │
       │                                             ▼
       │                                    ┌────────────────┐
       └────────────────────────────────────│  .docx File    │
                (Download)                  └────────────────┘
```

### Data Flow:

1. User fills form in browser
2. Frontend formats data (date format, gallon type conversion, etc.)
3. Data sent to `/api/generate-quotation` (Next.js API route)
4. Next.js forwards data to Python FastAPI backend
5. FastAPI calls `TankInvoiceGenerator` class
6. Python script generates Word document using template
7. Document returned through Next.js to browser
8. Browser automatically downloads the `.docx` file

## Data Formatting

The frontend automatically formats data to match Python requirements:

- **Recipient Name**: Combines title + name ("Ms. Hridya.")
- **Phone**: Adds "Phone: " prefix
- **Email**: Adds "Email: " prefix
- **Date**: Converts YYYY-MM-DD → DD/MM/YY
- **Gallon Type**: Converts "US Gallons" → "USG", "Imperial Gallons" → "IMG"

See `DATA_MAPPING.md` for complete field mapping.

## Template Files

Place your Word templates in the `server` folder:
- `Template_GRP.docx` - For GRP TANKS TRADING L.L.C
- `Template_PIPECO.docx` - For GRP PIPECO TANKS TRADING L.L.C
- `Template_COLEX.docx` - For COLEX TANKS TRADING L.L.C

## Signature & Seal Images

Place signature and seal images in `server/signs&seals/` folder:
- Format: `{CODE}_sign.png` and `{CODE}_seal.png`
- Example: `VM_sign.png`, `VM_seal.png` for Viwin Varghese (VM)

## Output Files

Generated documents are saved in: `server/Final_Doc/`

## Troubleshooting

### Backend won't start
- Check Python is installed: `python --version`
- Install dependencies: `pip install -r requirements.txt`
- Check port 8000 is not in use

### Frontend won't start
- Check Node.js is installed: `node --version`
- Install dependencies: `npm install`
- Check `.env.local` file exists with correct values

### Document generation fails
- Verify template files exist in `server` folder
- Check Python console for error messages
- Verify all required fields are filled in the form

### "Failed to generate quotation" error
- Make sure Python backend is running on port 8000
- Check browser console for error details
- Verify FASTAPI_URL in `.env.local` is correct

## Development Notes

- Python backend runs with `--reload` flag (auto-restarts on code changes)
- Next.js runs in development mode (hot-reload enabled)
- Supabase is used for storing quotation records (optional)
- Generated documents are Word (.docx) format, not PDF

## Production Deployment

For production:
1. Remove `--reload` flag from Python server
2. Build Next.js: `npm run build && npm start`
3. Set `FASTAPI_URL` to production Python API URL
4. Consider using a process manager (PM2 for Node, systemd/supervisor for Python)
