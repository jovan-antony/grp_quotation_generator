# System Architecture & Data Flow

## Overview

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│   Browser   │────────▶│   Next.js    │────────▶│   FastAPI       │
│  (User UI)  │         │   Frontend   │         │   Python API    │
└─────────────┘         └──────────────┘         └─────────────────┘
                              │                           │
                              │                           ▼
                              │                  ┌─────────────────┐
                              │                  │  Tank Invoice   │
                              │                  │   Generator     │
                              │                  └─────────────────┘
                              │                           │
                              │                           ▼
                              │                  ┌─────────────────┐
                              │                  │  python-docx    │
                              │                  │  (Word Gen)     │
                              │                  └─────────────────┘
                              │                           │
                              │◀──────────────────────────┘
                              ▼
                      ┌──────────────┐
                      │  .docx File  │
                      │  Downloaded  │
                      └──────────────┘
```

## Detailed Flow

### 1. User Interaction (Frontend)

**Component**: `client/components/quotation/NewQuotationForm.tsx`

User fills form with:
- Company selection (GRP/PIPECO/COLEX)
- Recipient information
- Quotation details
- Tank specifications (dimensions, type, quantity, price)
- Terms & conditions toggles

### 2. Export Button Click

**Action**: `handleExport()` function triggers

```typescript
// client/components/quotation/NewQuotationForm.tsx
const handleExport = async () => {
  // 1. Save to database (Supabase - optional)
  // 2. Send data to API
  const response = await fetch('/api/generate-quotation', {
    method: 'POST',
    body: JSON.stringify(formData)
  });
  
  // 3. Download file
  const blob = await response.blob();
  // Auto-download starts
}
```

### 3. Next.js API Route

**File**: `client/app/api/generate-quotation/route.ts`

```typescript
export async function POST(request: NextRequest) {
  // 1. Receive data from frontend
  const body = await request.json();
  
  // 2. Forward to Python backend
  const response = await fetch('http://localhost:8000/generate-quotation', {
    method: 'POST',
    body: JSON.stringify(body)
  });
  
  // 3. Return file to frontend
  return new NextResponse(docxBlob);
}
```

### 4. FastAPI Backend

**File**: `server/api_server.py`

```python
@app.post("/generate-quotation")
async def generate_quotation(request: QuotationRequest):
    # 1. Parse request data
    # 2. Transform to generator format
    # 3. Initialize document generator
    generator = TankInvoiceGenerator(template_path)
    
    # 4. Set all data
    generator.recipient_name = request.recipientName
    generator.tanks = [...transformed_tanks]
    generator.sections = {...}
    
    # 5. Generate document
    generator.create_invoice_table()
    
    # 6. Save file
    generator.save(output_path)
    
    # 7. Return file
    return FileResponse(output_path)
```

### 5. Document Generator

**File**: `server/user_input_tank_generator.py`

```python
class TankInvoiceGenerator:
    def create_invoice_table(self):
        # 1. Load template
        self.doc = Document(template_path)
        
        # 2. Add header to all pages
        self._add_header_to_all_pages()
        
        # 3. Create quotation header
        self._create_quotation_header()
        
        # 4. Create main table
        self.table = self.doc.add_table(...)
        self._create_header()
        self._fill_common_row()
        
        # 5. Add tank rows
        for tank in self.tanks:
            self._fill_tank_row(row_idx, tank)
        
        # 6. Add footer (subtotal, VAT, grand total)
        self._create_footer(footer_start)
        
        # 7. Add additional sections
        self._add_additional_sections()
        # - NOTE
        # - Closing paragraph
        # - Signature
        # - Material specs
        # - Warranty
        # - Terms & conditions
        # - Supplier scope
        # - Customer scope
```

### 6. File Return & Download

```
FastAPI → Next.js API → Browser → Auto Download
```

## Data Transformation

### Frontend Format → Backend Format

**UI sends:**
```json
{
  "tanks": [
    {
      "tankNumber": 1,
      "options": [
        {
          "tankName": "Tank A",
          "quantity": 2,
          "length": "2(1+1)",
          "width": "2",
          "height": "2",
          "tankType": "HOT PRESSED – NON - INSULATED",
          "hasPartition": true,
          "unit": "No",
          "unitPrice": "15000"
        }
      ]
    }
  ]
}
```

**Backend processes to:**
```python
generator.tanks = [
    {
        "sl_no": 1,
        "name": "Tank A",
        "partition": True,
        "type": "HOT PRESSED – NON - INSULATED",
        "length": 2.0,  # Parsed from "2(1+1)"
        "length_display": "2(1+1)",
        "width": 2.0,
        "width_display": "2",
        "height": 2.0,
        "volume_m3": 8.0,  # Calculated: 2*2*2
        "gallons": 2113.376,  # Calculated: 8*264.172 (USG)
        "free_board": 0.3,
        "net_height": 1.7,
        "skid": "SKID BASE - HDG HOLLOW SECTION...",
        "unit": "No",
        "qty": 2,
        "unit_price": 15000.0,
        "total_price": 30000.0  # qty * unit_price
    }
]
```

## File Structure

```
Generated Document Structure:
┌─────────────────────────────────────┐
│  PAGE 1 (First Page Header)        │
│  - Template logo/branding           │
│  - NO quote box (removed)           │
├─────────────────────────────────────┤
│  QUOTATION HEADER                   │
│  - To: Recipient info               │
│  - Date, Page, Quote No             │
│  - Subject, Project                 │
│  - Dear Sir,                        │
├─────────────────────────────────────┤
│  MAIN TABLE                         │
│  ┌─────────────────────────────┐   │
│  │ SL NO │ DESCRIPTION │ ... │ │   │
│  ├─────────────────────────────┤   │
│  │ Common info row (merged)    │   │
│  ├─────────────────────────────┤   │
│  │ Tank 1 details              │   │
│  │ Tank 2 details              │   │
│  ├─────────────────────────────┤   │
│  │ SUB TOTAL:        AED XXXX  │   │
│  │ VAT 5%:           AED XXXX  │   │
│  │ GRAND TOTAL:      AED XXXX  │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  PAGE 2+ (Continuation Header)     │
│  ┌─────────────────────────────┐   │
│  │ QUOTE NO │ DATE │ PAGE NO    │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  ADDITIONAL SECTIONS                │
│  - NOTE                             │
│  - Closing paragraph                │
│  - Yours truly, Signature           │
│  - Material Specification           │
│  - Warranty                         │
│  - Terms & Conditions               │
│  - Supplier Scope                   │
│  - Customer Scope                   │
└─────────────────────────────────────┘
```

## API Endpoints

### POST /generate-quotation

**Request Body:**
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

**Response:**
- Content-Type: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- File download

### GET /health

**Response:**
```json
{
  "status": "ok"
}
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **HTTP Client**: Fetch API

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.8+
- **Document Generation**: python-docx
- **Server**: Uvicorn (ASGI)

### Development
- **Package Manager (Frontend)**: npm
- **Package Manager (Backend)**: pip
- **Environment**: .env.local

## Deployment Considerations

### Frontend (Next.js)
- Can be deployed to: Vercel, Netlify, AWS Amplify
- Build command: `npm run build`
- Output: Static/SSR

### Backend (FastAPI)
- Can be deployed to: AWS, Azure, GCP, Heroku, DigitalOcean
- Production server: Gunicorn + Uvicorn workers
- Container: Docker (recommended)

### Full Stack
- Frontend calls Backend via API
- CORS configured for allowed origins
- File storage: Local filesystem or cloud (S3, Azure Blob)

## Security Notes

1. **CORS**: Configured for localhost development
2. **File Access**: Backend has read/write to Final_Doc folder
3. **Template Security**: Templates stored on server, not user-accessible
4. **Input Validation**: Pydantic models validate all inputs
5. **File Upload**: Not enabled (templates are server-side)

## Performance

- **Generation Time**: ~2-5 seconds per document
- **Concurrent Requests**: Handled by FastAPI async
- **File Size**: Typical output 50-200 KB
- **Memory**: Minimal, documents generated on-demand

## Future Enhancements

- [ ] PDF export option
- [ ] Email delivery
- [ ] Template management UI
- [ ] Quotation history viewer
- [ ] Batch generation
- [ ] Preview before download
- [ ] Multi-language support
- [ ] Role-based access control

---

*Last Updated: January 2026*
