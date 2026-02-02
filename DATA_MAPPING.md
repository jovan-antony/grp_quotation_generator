# Frontend to Python Data Mapping

This document describes how frontend data is formatted to match the Python script's expected input format.

## API Integration Flow

When "Export Quotation" is clicked:

1. **Frontend** (NewQuotationForm.tsx) → Formats data according to Python requirements
2. **Next.js API Route** (/api/generate-quotation/route.ts) → Forwards data to Python backend
3. **Python FastAPI** (api_server.py) → Receives data and calls TankInvoiceGenerator
4. **Python Script** (user_input_tank_generator.py) → Generates Word document
5. **Response** → .docx file sent back through Next.js to browser for download

## Quotation Header Fields

| Python Variable | Frontend Source | Formatting Applied |
|----------------|----------------|-------------------|
| `recipient_name` | `recipientTitle` + `recipientName` | Combined as "Ms. Hridya." |
| `recipient_company` | `companyName` | Direct (e.g., "M/s. Multiflags Contracting") |
| `recipient_location` | `location` | Direct (e.g., "Ajman, UAE") |
| `recipient_phone` | `phoneNumber` | Prefixed with "Phone: " |
| `recipient_email` | `email` | Prefixed with "Email: " (optional) |
| `quote_date` | `quotationDate` | Converted from YYYY-MM-DD to DD/MM/YY |
| `quote_number` | `quotationNumber` | Direct (e.g., "GRPPT/2502/VV/2582") |
| `subject` | `subject` | Direct (e.g., "Supply and Installation of GRP Panel Water Tank") |
| `project` | `projectLocation` | Direct (e.g., "Ajman.") |
| `gallon_type` | `gallonType` | Converted: "US Gallons" → "USG", "Imperial Gallons" → "IMG" |

## Additional Frontend Fields (Not in Python)

These fields are collected in the frontend but are not used by the Python script directly:
- `fromCompany` - Which company is sending the quotation
- `role` - Recipient's role (optional)
- `quotationFrom` - Sales or Office
- `salesPersonName` - Name of sales person (if from Sales)
- `revisionEnabled` / `revisionNumber` - Revision tracking
- `showSubTotal`, `showVat`, `showGrandTotal` - Display options

## Tank Data Fields

The frontend collects tank data with the following fields that will need mapping:
- `tankName` - Name/description of the tank
- `quantity` - Number of tanks
- `hasPartition` - Whether tank has partition
- `tankType` - Type of tank (insulation options)
- `length` - Length in meters (supports partition notation like "2(1+1)")
- `width` - Width in meters (supports partition notation)
- `height` - Height in meters
- `unit` - Unit of measurement (Nos, L)
- `unitPrice` - Price per unit in AED
- `needFreeBoard` - Whether freeboard is needed
- `freeBoardSize` - Freeboard size in CM

## Contractual Terms & Specifications

The frontend collects configuration for:
- NOTE
- MATERIAL SPECIFICATION
- WARRANTY EXCLUSIONS
- TERMS AND CONDITIONS
- SUPPLIER SCOPE
- CUSTOMER SCOPE
- SCOPE OF WORK
- WORK EXCLUDED

Each section has:
- `action` - "yes" or "no" to include/exclude
- `details` - Array of detail points (editable)
- `custom` - Array of custom added points

## Date Format Conversion

**Frontend Format:** YYYY-MM-DD (HTML date input standard)
**Python Format:** DD/MM/YY

**Conversion Logic:**
```javascript
const dateObj = new Date(quotationDate);
const day = String(dateObj.getDate()).padStart(2, '0');
const month = String(dateObj.getMonth() + 1).padStart(2, '0');
const year = String(dateObj.getFullYear()).slice(-2);
const formattedDate = `${day}/${month}/${year}`;
```

## Gallon Type Conversion

**Frontend Options:**
- "US Gallons"
- "Imperial Gallons"

**Python Expected:**
- "USG"
- "IMG"

**Conversion Logic:**
```javascript
const formattedGallonType = gallonType === 'US Gallons' ? 'USG' : 
                            gallonType === 'Imperial Gallons' ? 'IMG' : 
                            gallonType;
```

## Phone & Email Formatting

**Frontend:** Raw values (e.g., "+ 971 50 312 8233")
**Python Expected:** Prefixed values

**Conversion Logic:**
```javascript
const formattedPhone = phoneNumber ? `Phone: ${phoneNumber}` : '';
const formattedEmail = email ? `Email: ${email}` : '';
```

## Input Placeholders

Updated placeholders guide users to enter data in the correct format:
- Recipient Name: "Hridya."
- Company Name: "M/s. Company Name"
- Location: "Ajman, UAE"
- Phone: "+ 971 50 312 8233"
- Quotation Number: "GRPPT/2502/VV/2582"
- Subject: "Supply and Installation of GRP Panel Water Tank"
- Project Location: "Ajman."
