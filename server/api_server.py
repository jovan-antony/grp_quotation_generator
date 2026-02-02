from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import sys
from datetime import datetime
from pathlib import Path

# Import the generator class
from user_input_tank_generator import TankInvoiceGenerator

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TankOption(BaseModel):
    tankName: str
    quantity: int
    hasPartition: bool
    tankType: str
    length: str
    width: str
    height: str
    unit: str
    unitPrice: str
    needFreeBoard: Optional[bool] = False
    freeBoardSize: Optional[str] = ""


class TankData(BaseModel):
    tankNumber: int
    optionEnabled: bool
    optionNumbers: int
    options: List[TankOption]


class TermSection(BaseModel):
    action: str
    details: List[str]
    custom: List[str]


class QuotationRequest(BaseModel):
    fromCompany: str
    recipientTitle: str
    recipientName: str
    role: Optional[str] = ""
    companyName: str
    location: Optional[str] = ""
    phoneNumber: Optional[str] = ""
    email: Optional[str] = ""
    quotationDate: str
    quotationFrom: str
    salesPersonName: Optional[str] = ""
    quotationNumber: str
    revisionEnabled: bool
    revisionNumber: str
    subject: str
    projectLocation: str
    gallonType: str
    numberOfTanks: int
    showSubTotal: bool
    showVat: bool
    showGrandTotal: bool
    tanks: List[TankData]
    terms: Dict[str, TermSection]


@app.post("/generate-quotation")
async def generate_quotation(request: QuotationRequest):
    try:
        # Determine template path based on company
        template_map = {
            "GRP TANKS TRADING L.L.C": "Template_GRP.docx",
            "GRP PIPECO TANKS TRADING L.L.C": "Template_PIPECO.docx",
            "COLEX TANKS TRADING L.L.C": "Template_COLEX.docx",
        }
        template_filename = template_map.get(request.fromCompany, "Template.docx")
        template_path = os.path.join(os.path.dirname(__file__), template_filename)
        
        # Initialize generator
        generator = TankInvoiceGenerator(template_path=template_path)
        
        # Construct quotation number in format: {CompanyCode}/{YYMM}/{SalesCode}/{Number}
        company_code_map = {
            "GRP TANKS TRADING L.L.C": "GRPT",
            "GRP PIPECO TANKS TRADING L.L.C": "GRPPT",
            "COLEX TANKS TRADING L.L.C": "CLX",
        }
        company_code = company_code_map.get(request.fromCompany, "GRPT")
        
        # Extract YYMM from quotation date (format: DD/MM/YY)
        date_parts = request.quotationDate.split('/')
        if len(date_parts) == 3:
            yy = date_parts[2]  # Last 2 digits of year
            mm = date_parts[1]  # Month
            yymm = f"{yy}{mm}"
        else:
            yymm = "0000"
        
        # Extract sales person code from name (e.g., "Viwin Varghese (VM)" -> "VM")
        sales_code = ""
        if request.salesPersonName and '(' in request.salesPersonName:
            sales_code = request.salesPersonName.split('(')[1].split(')')[0]
        else:
            sales_code = "OFC"  # Default for Office quotations
        
        # Construct full quotation number
        constructed_quote_number = f"{company_code}/{yymm}/{sales_code}/{request.quotationNumber}"
        
        # Set header data
        # Add role to recipient name with hyphen if role is provided
        recipient_name_with_role = request.recipientName
        if request.role and request.role.strip():
            recipient_name_with_role = f"{request.recipientName} - {request.role}"
        generator.recipient_name = recipient_name_with_role
        
        # Add M/S. prefix to company name
        company_name_with_prefix = f"M/S. {request.companyName}"
        generator.recipient_company = company_name_with_prefix
        generator.recipient_location = request.location or ""
        generator.recipient_phone = request.phoneNumber
        generator.recipient_email = request.email
        generator.quote_date = request.quotationDate
        generator.quote_number = constructed_quote_number
        generator.subject = request.subject
        generator.project = request.projectLocation
        generator.gallon_type = request.gallonType
        
        # Process tanks data - convert from UI format to generator format
        generator.tanks = []
        sl_no = 1
        
        # Roman numeral conversion helper
        def to_roman(num):
            val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
            syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I']
            roman_num = ''
            i = 0
            while num > 0:
                for _ in range(num // val[i]):
                    roman_num += syms[i]
                    num -= val[i]
                i += 1
            return roman_num
        
        for tank_data in request.tanks:
            num_options = len(tank_data.options)
            for option_idx, option in enumerate(tank_data.options):
                # Parse dimensions
                def parse_dimension(dim_str):
                    dim_str = str(dim_str).replace(" ", "")
                    if "(" in dim_str:
                        return float(dim_str.split("(")[0])
                    return float(dim_str)
                
                length = parse_dimension(option.length)
                width = parse_dimension(option.width)
                height = float(option.height)
                
                # Calculate volume
                volume_m3 = length * width * height
                
                # Calculate gallons
                if request.gallonType == "USG":
                    gallons = volume_m3 * 264.172
                else:
                    gallons = volume_m3 * 219.969
                
                # Handle free board - user inputs in cm, convert to meters
                free_board_m = 0.3  # Default 30cm
                need_free_board = option.needFreeBoard if option.needFreeBoard else False
                if need_free_board and option.freeBoardSize:
                    try:
                        free_board_cm = float(option.freeBoardSize)
                        free_board_m = free_board_cm / 100.0  # Convert cm to meters
                    except ValueError:
                        free_board_m = 0.3  # Default if conversion fails
                
                # Calculate net volume based on free board
                net_volume_m3 = length * width * (height - free_board_m)
                
                # Determine skid based on height
                if 2.0 <= height <= 3.0:
                    skid = "SKID BASE - HDG HOLLOW SECTION 50 X 50 X 3 MM (SQUARE TUBE)"
                elif 1.0 <= height < 1.5:
                    skid = "WITHOUT SKID"
                elif height > 3.0:
                    skid = "SKID BASE - I BEAM SKID"
                else:
                    skid = ""
                
                tank = {
                    "sl_no": sl_no,
                    "name": option.tankName,
                    "partition": option.hasPartition,
                    "type": option.tankType,
                    "length": length,
                    "length_display": option.length,
                    "width": width,
                    "width_display": option.width,
                    "height": height,
                    "volume_m3": volume_m3,
                    "gallons": gallons,
                    "free_board": free_board_m,
                    "need_free_board": need_free_board,
                    "net_volume_m3": net_volume_m3,
                    "net_height": height - free_board_m,
                    "skid": skid,
                    "unit": option.unit,
                    "qty": float(option.quantity),
                    "unit_price": float(option.unitPrice) if option.unitPrice else 0.0,
                    "total_price": float(option.quantity) * (float(option.unitPrice) if option.unitPrice else 0.0),
                    "option_number": option_idx + 1,
                    "option_total": num_options,
                    "option_roman": to_roman(option_idx + 1)
                }
                generator.tanks.append(tank)
            
            # Increment sl_no only after all options of this tank
            sl_no += 1
        
        # Calculate total pages (estimate based on tanks)
        tanks_per_page = 3
        generator.total_pages = max(1, (len(generator.tanks) + tanks_per_page - 1) // tanks_per_page)
        generator.quote_page = f"1/{generator.total_pages}"
        
        # Check if ladder is needed
        generator.needs_ladder = any(float(tank.get('height', 0)) > 2.0 for tank in generator.tanks)
        
        # Set flags for showing totals
        generator.show_sub_total = request.showSubTotal
        generator.show_vat = request.showVat
        generator.show_grand_total = request.showGrandTotal
        
        # Set sections configuration based on terms
        generator.sections = {
            'note': request.terms['note'].action == 'yes' if 'note' in request.terms else False,
            'closing': True,  # Default closing paragraph
            'signature': request.quotationFrom == 'Sales' or request.quotationFrom == 'Office',
            'material_spec': request.terms['materialSpecification'].action == 'yes' if 'materialSpecification' in request.terms else False,
            'warranty': request.terms['warrantyExclusions'].action == 'yes' if 'warrantyExclusions' in request.terms else False,
            'terms': request.terms['termsConditions'].action == 'yes' if 'termsConditions' in request.terms else False,
            'extra_note': request.terms['extraNote'].action == 'yes' if 'extraNote' in request.terms else True,  # Default to True
            'supplier_scope': request.terms['supplierScope'].action == 'yes' if 'supplierScope' in request.terms else False,
            'customer_scope': request.terms['customerScope'].action == 'yes' if 'customerScope' in request.terms else False,
            'final_note': False,  # Can be enabled if needed
            'thank_you': True,
        }
        
        # Set section content
        generator.section_content = {}
        
        # NOTE section
        if generator.sections['note']:
            note_data = request.terms['note']
            generator.section_content['note'] = note_data.details + note_data.custom
        
        # MATERIAL SPECIFICATION
        if generator.sections['material_spec']:
            mat_spec_data = request.terms['materialSpecification']
            generator.section_content['material_spec'] = mat_spec_data.details + mat_spec_data.custom
        
        # WARRANTY
        if generator.sections['warranty']:
            warranty_data = request.terms['warrantyExclusions']
            generator.section_content['warranty'] = warranty_data.details + warranty_data.custom
        
        # TERMS AND CONDITIONS
        if generator.sections['terms']:
            terms_data = request.terms['termsConditions']
            # For terms, we need to format as dict
            terms_list = terms_data.details + terms_data.custom
            generator.section_content['terms'] = {}
            for term in terms_list:
                if ':' in term:
                    key, value = term.split(':', 1)
                    generator.section_content['terms'][key.strip()] = value.strip()
        
        # EXTRA NOTE
        if generator.sections['extra_note']:
            if 'extraNote' in request.terms:
                extra_note_data = request.terms['extraNote']
                generator.section_content['extra_note'] = extra_note_data.details + extra_note_data.custom
            else:
                # Use default extra note content
                company_name = generator._get_company_name()
                generator.section_content['extra_note'] = [
                    "Any deviations from this quotation to suit the site's condition will have additional cost implications.",
                    "If the work is indefinitely delayed beyond 30 days after the delivery of materials due to the issues caused by the customer or site condition, the Company will not be liable for any damage to the supplied materials.",
                    "The submission of all related documents, including the warranty certificate, will be done upon receiving the final payment.",
                    "Any additional test / lab charges incurred from third parties / external agencies are under the scope of the contractor / client.",
                    f"Until receiving the final settlement from the client, {company_name} has reserved the right to use the supplied materials at the site.",
                    "The testing and commissioning should be completed within a period of 15 to 30 days from the installation completion date by the Contractor/Client.",
                    "For the net volume, a minimum of 30 cm freeboard area is to be calculated from the total height of the tank."
                ]
        
        # SUPPLIER SCOPE
        if generator.sections['supplier_scope']:
            supplier_data = request.terms['supplierScope']
            generator.section_content['supplier_scope'] = supplier_data.details + supplier_data.custom
        
        # CUSTOMER SCOPE
        if generator.sections['customer_scope']:
            customer_data = request.terms['customerScope']
            generator.section_content['customer_scope'] = customer_data.details + customer_data.custom
        
        # Set signature info based on sales person
        if generator.sections['signature']:
            generator.section_content['signature'] = {
                'left_name': request.salesPersonName.split('(')[0].strip() if request.salesPersonName else '',
                'left_title': 'Sales Executive' if request.quotationFrom == 'Sales' else 'Manager - Projects',
                'left_mobile': '',
                'left_email': '',
                'right_name': '',
                'right_title': '',
                'right_mobile': '',
                'right_email': '',
                'signature_image': '',
                'seal_image': '',
            }
        
        # Closing paragraph content
        if generator.sections['closing']:
            generator.section_content['closing'] = (
                "We hope the above offer meets your requirements and awaiting the valuable order confirmation.\n"
                "If you have any questions concerning the offer, please contact the undersigned."
            )
        
        # Generate the document
        generator.create_invoice_table()
        
        # Save the document
        output_filename = f"quotation_{constructed_quote_number.replace('/', '_')}.docx"
        output_path = os.path.join(os.path.dirname(__file__), "Final_Doc", output_filename)
        
        # Create Final_Doc directory if it doesn't exist
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        generator.save(output_path)
        
        # Return the file
        if os.path.exists(output_path):
            return FileResponse(
                output_path,
                media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                filename=output_filename
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to generate document")
        
    except Exception as e:
        print(f"Error generating quotation: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating quotation: {str(e)}")


@app.get("/health")
async def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
