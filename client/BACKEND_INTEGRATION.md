# Backend Integration Guide

This document outlines the FastAPI backend requirements for the GRP TANKS Quotation Generator.

## Required FastAPI Endpoints

### 1. Generate Quotation PDF

**Endpoint:** `POST /generate-quotation`

**Request Body:**
```python
{
    "quotation_id": "uuid-string"  # UUID from Supabase database
}
```

**Response:**
- Content-Type: `application/pdf`
- Binary PDF file

**Implementation Notes:**
- Fetch quotation data from Supabase using the quotation_id
- Fetch associated tank data from quotation_tanks table
- Use the existing `user_input_tank_generator.py` logic
- Generate PDF document
- Return PDF as binary response

**Example Python Implementation:**
```python
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
import os

@app.post("/generate-quotation")
async def generate_quotation(data: dict):
    quotation_id = data.get("quotation_id")

    # Fetch data from Supabase
    quotation = await fetch_quotation(quotation_id)
    tanks = await fetch_quotation_tanks(quotation_id)

    # Generate PDF using your existing logic
    pdf_path = generate_pdf_quotation(quotation, tanks)

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"quotation_{quotation['quotation_number']}.pdf"
    )
```

---

### 2. Generate Preview HTML

**Endpoint:** `POST /preview-quotation`

**Request Body:**
```python
{
    "quotation": {
        "from_company": "string",
        "recipient_title": "string",
        "recipient_name": "string",
        "recipient_role": "string",
        "recipient_company": "string",
        "recipient_location": "string",
        "recipient_phone": "string",
        "recipient_email": "string",
        "quotation_date": "YYYY-MM-DD",
        "quotation_from": "string",
        "sales_person_name": "string",
        "quotation_number": "string",
        "revision_number": 0,
        "subject": "string",
        "project_location": "string",
        "gallon_type": "string"
    },
    "tanks": [
        {
            "tank_number": 1,
            "has_partition": false,
            "tank_type": "string",
            "length": "string",
            "width": "string",
            "height": "string",
            "unit": "string",
            "unit_price": 0.0
        }
    ]
}
```

**Response:**
```python
{
    "html": "<html>...</html>"  # Full HTML preview of quotation
}
```

**Implementation Notes:**
- Generate HTML preview without saving to database
- Use the same template as PDF generation
- Return formatted HTML string
- This preview is displayed in real-time in the frontend

**Example Python Implementation:**
```python
@app.post("/preview-quotation")
async def preview_quotation(data: dict):
    quotation = data.get("quotation")
    tanks = data.get("tanks", [])

    # Generate HTML using your template
    html_content = generate_html_preview(quotation, tanks)

    return {"html": html_content}
```

---

## Database Connection

Your FastAPI backend should connect to the same Supabase database:

```python
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
```

## Database Queries

### Fetch Quotation by ID
```python
async def fetch_quotation(quotation_id: str):
    response = supabase.table("quotations").select("*").eq("id", quotation_id).single().execute()
    return response.data
```

### Fetch Quotation Tanks
```python
async def fetch_quotation_tanks(quotation_id: str):
    response = supabase.table("quotation_tanks").select("*").eq("quotation_id", quotation_id).order("tank_number").execute()
    return response.data
```

---

## Environment Variables

Create a `.env` file for your FastAPI backend:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
PORT=8000
```

---

## CORS Configuration

Enable CORS for your frontend:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your Next.js URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Running the Backend

```bash
# Install dependencies
pip install fastapi uvicorn supabase

# Run server
uvicorn main:app --reload --port 8000
```

---

## Integration with user_input_tank_generator.py

Your existing `user_input_tank_generator.py` should be adapted to:

1. Accept data from API instead of user input
2. Fetch data from Supabase instead of prompting user
3. Generate both PDF and HTML outputs
4. Return file paths or content to API endpoints

### Example Adapter Function

```python
def generate_quotation_from_db(quotation_id: str):
    """
    Adapts existing generator to work with database data
    """
    # Fetch data
    quotation = fetch_quotation(quotation_id)
    tanks = fetch_quotation_tanks(quotation_id)

    # Transform data to match existing generator format
    generator_input = transform_to_generator_format(quotation, tanks)

    # Call existing generator
    pdf_path = user_input_tank_generator(generator_input)

    return pdf_path
```

---

## Testing the Endpoints

### Test Generate Quotation
```bash
curl -X POST http://localhost:8000/generate-quotation \
  -H "Content-Type: application/json" \
  -d '{"quotation_id": "your-uuid-here"}' \
  --output quotation.pdf
```

### Test Preview Quotation
```bash
curl -X POST http://localhost:8000/preview-quotation \
  -H "Content-Type: application/json" \
  -d @preview_request.json
```

---

## Error Handling

Implement proper error handling:

```python
from fastapi import HTTPException

@app.post("/generate-quotation")
async def generate_quotation(data: dict):
    try:
        quotation_id = data.get("quotation_id")
        if not quotation_id:
            raise HTTPException(status_code=400, detail="quotation_id is required")

        # Your logic here

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## Deployment Considerations

1. **Security**: Use service role key securely on backend only
2. **File Storage**: Clean up generated PDFs after sending
3. **Performance**: Consider caching for frequently accessed quotations
4. **Monitoring**: Add logging for all API calls
5. **Rate Limiting**: Implement rate limiting to prevent abuse

---

## Next Steps

1. Set up FastAPI project structure
2. Install required dependencies
3. Configure Supabase connection
4. Adapt existing generator to work with API
5. Implement both endpoints
6. Test integration with frontend
7. Deploy backend and update FASTAPI_URL in frontend

For any questions, refer to the main README_QUOTATION.md file.
