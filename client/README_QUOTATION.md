# GRP TANKS Quotation Generator

A professional quotation management system built with Next.js, Supabase, and FastAPI integration.

## Features

- **New Quotation Creation**: Create detailed quotations with multiple tank configurations
- **Quotation Revision**: Search and revise existing quotations
- **Live Preview**: Real-time HTML preview of quotations
- **Database Storage**: Persistent storage using Supabase
- **PDF Export**: Generate PDF quotations via FastAPI backend

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
FASTAPI_URL=http://localhost:8000
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## Database Schema

The application uses two main tables:

### quotations
- Stores quotation header information (company details, recipient info, etc.)

### quotation_tanks
- Stores individual tank specifications linked to quotations

## FastAPI Backend Integration

The frontend expects a FastAPI backend with the following endpoints:

### POST /generate-quotation
**Request:**
```json
{
  "quotation_id": "uuid"
}
```
**Response:** PDF file

### POST /preview-quotation
**Request:**
```json
{
  "quotation_data": { /* quotation details */ }
}
```
**Response:**
```json
{
  "html": "<html>...</html>"
}
```

## Features Breakdown

### New Quotation Tab

1. **Company & Recipient Details**
   - From Company (3 GRP TANKS entities)
   - Recipient information (title, name, role, company, location)
   - Contact details (phone, email)

2. **Quotation Information**
   - Quotation date and number
   - Source (Sales/Office)
   - Sales person selection
   - Revision tracking
   - Subject and project location

3. **Tank Details**
   - Multiple tank types support
   - Gallon type selection (US/Imperial)
   - Per tank configuration:
     - Option numbers
     - Partition support
     - Tank type (5 insulation options)
     - Dimensions (L, W, H in meters)
     - Unit and pricing

### Quotation Revision Tab

1. **Advanced Search**
   - Filter by recipient name
   - Filter by company name
   - Filter by date
   - Filter by quote number components

2. **Revision Management**
   - View existing quotation details
   - Update revision number
   - Export revised quotation

## Design Features

- **Poppins Font**: Professional typography throughout
- **Blue Gradient Theme**: Clean blue color scheme matching the reference design
- **Responsive Layout**: Split-screen design with form and live preview
- **Toast Notifications**: User feedback for all operations
- **Form Validation**: Proper input validation and error handling

## Color Scheme

- Primary: Blue (#2563EB to #3B82F6)
- Background: Light slate gradient
- Buttons: Blue gradient with hover effects
- Cards: White with subtle shadows
- Borders: Slate gray for professional look

## Tech Stack

- **Frontend**: Next.js 13+ (App Router)
- **UI Components**: shadcn/ui with Radix UI
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Backend**: FastAPI (Python)
- **Fonts**: Poppins (Google Fonts)
- **Icons**: Lucide React

## File Structure

```
app/
  ├── quotation/
  │   └── page.tsx           # Main quotation page
  ├── api/
  │   ├── generate-quotation/
  │   │   └── route.ts       # PDF generation endpoint
  │   └── preview-quotation/
  │       └── route.ts       # Preview HTML endpoint
components/
  └── quotation/
      ├── NewQuotationForm.tsx      # New quotation form
      ├── QuotationRevisionForm.tsx # Revision search & form
      └── TankForm.tsx              # Tank specification component
lib/
  └── supabase.ts            # Supabase client configuration
```

## Usage

### Creating a New Quotation

1. Navigate to the "New Quotation" tab
2. Fill in company and recipient details
3. Add quotation information
4. Configure tank specifications
5. Click "Export Quotation" to save and generate PDF

### Revising a Quotation

1. Navigate to the "Quotation Revision" tab
2. Enable desired search filters
3. Enter search criteria
4. Click "Search Quotations"
5. Select a quotation from results
6. Enter new revision number
7. Click "Export Quotation Revision"

## Support

For issues or questions, please contact the development team.
