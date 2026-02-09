from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os

import os
import sys
from datetime import datetime, date
from pathlib import Path
import pandas as pd
# Import the generator class
from user_input_tank_generator import TankInvoiceGenerator
# Import database models and session
from models import (
    SalesDetails, ProjectManagerDetails, CompanyDetails, 
    RecipientDetails, QuotationWebpageInputDetailsSave,
    ContractualTermsSpecifications
)
from database import get_session
from sqlmodel import Session, select

app = FastAPI()

# Database setup disabled

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Auto-sync Excel files to database on startup
@app.on_event("startup")
async def startup_event():
    """Automatically sync Excel files to database when server starts"""
    print("\n" + "="*70)
    print("🔄 AUTO-SYNCING EXCEL FILES TO DATABASE")
    print("="*70)
    
    try:
        from sync_excel_to_db import (
            sync_company_details,
            sync_sales_details,
            sync_project_manager_details
        )
        
        # Run all sync functions
        results = {
            'company_details': sync_company_details(),
            'sales_details': sync_sales_details(),
            'project_manager_details': sync_project_manager_details()
        }
        
        if all(results.values()):
            print("\n✅ AUTO-SYNC COMPLETED SUCCESSFULLY")
        else:
            print("\n⚠️  AUTO-SYNC COMPLETED WITH SOME WARNINGS")
        
        print("="*70 + "\n")
        
    except Exception as e:
        print(f"\n⚠️  AUTO-SYNC ERROR: {e}")
        print("Server will continue running, but data may not be up-to-date.")
        print("="*70 + "\n")


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
    supportSystem: Optional[str] = "Internal"  # "Internal" or "External"


class TankData(BaseModel):
    tankNumber: int
    optionEnabled: bool
    optionNumbers: int
    options: List[TankOption]



class TermSection(BaseModel):
    action: str
    details: List[str]
    custom: List[str]

class AdditionalDetail(BaseModel):
    key: str
    value: str

class QuotationRequest(BaseModel):
    fromCompany: str
    companyCode: Optional[str] = ""
    companyShortName: Optional[str] = ""  # company_name from company_details.xlsx
    templatePath: Optional[str] = ""
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
    officePersonName: Optional[str] = ""
    quotationNumber: str
    revisionEnabled: bool
    revisionNumber: str
    subject: str
    projectLocation: str
    additionalDetails: Optional[List[AdditionalDetail]] = []
    gallonType: str
    numberOfTanks: int
    showSubTotal: bool
    showVat: bool
    showGrandTotal: bool
    tanks: List[TankData]
    terms: Dict[str, TermSection]


@app.post("/generate-quotation")
async def generate_quotation(request: QuotationRequest, session: Session = Depends(get_session)):
    try:
        # Debug: Log terms data received from frontend
        print(f"\n{'='*60}")
        print(f"GENERATE QUOTATION - TERMS DEBUG")
        print(f"{'='*60}")
        if hasattr(request, 'terms') and request.terms:
            for term_key, term_value in request.terms.items():
                print(f"  {term_key}:")
                print(f"    action: {term_value.action}")
                print(f"    details count: {len(term_value.details)}")
                print(f"    custom count: {len(term_value.custom)}")
                if term_value.custom:
                    print(f"    custom entries:")
                    for idx, entry in enumerate(term_value.custom, 1):
                        print(f"      {idx}. {entry}")
        print(f"{'='*60}\n")
        
        # Use template path from request if provided, otherwise use default mapping
        if request.templatePath:
            template_filename = request.templatePath
            # Add .docx extension if not present
            if not template_filename.endswith('.docx'):
                template_filename = template_filename + '.docx'
        else:
            # Fallback to old mapping
            template_map = {
                "GRP TANKS TRADING L.L.C": "template_grp.docx",
                "GRP PIPECO TANKS TRADING L.L.C": "template_pipeco.docx",
                "COLEX TANKS TRADING L.L.C": "template_colex.docx",
            }
            template_filename = template_map.get(request.fromCompany, "template_grp.docx")
        
        script_dir = os.path.dirname(__file__)
        template_path = os.path.join(script_dir, template_filename)
        
        # Verify template file exists
        if not os.path.exists(template_path):
            print(f"⚠ Template file not found: {template_path}")
            print(f"Template filename requested: {template_filename}")
            print(f"Script directory: {script_dir}")
            raise HTTPException(status_code=404, detail=f"Template file not found: {template_filename}")
        
        print(f"✓ Using template: {template_path}")
        
        # Initialize generator
        generator = TankInvoiceGenerator(template_path=template_path)
        
        # Use company code from request if provided, otherwise use default mapping
        if request.companyCode:
            company_code = request.companyCode
        else:
            # Fallback to old mapping
            company_code_map = {
                "GRP TANKS TRADING L.L.C": "GRPT",
                "GRP PIPECO TANKS TRADING L.L.C": "GRPPT",
                "COLEX TANKS TRADING L.L.C": "CLX",
            }
            company_code = company_code_map.get(request.fromCompany, "GRPT")
        
        # Extract YYMM from quotation date (format: DD/MM/YY)
        date_parts = request.quotationDate.split('/')
        yymm = f"{date_parts[2]}{date_parts[1]}" if len(date_parts) == 3 else "0000"
        
        # Get person code from database
        person_code = ""
        
        try:
            if request.quotationFrom == 'Sales' and request.salesPersonName:
                person_name = request.salesPersonName.split('(')[0].strip()
                statement = select(SalesDetails).where(SalesDetails.sales_person_name == person_name)
                result = session.exec(statement).first()
                if result:
                    person_code = result.code
            elif request.officePersonName:
                person_name = request.officePersonName.split('(')[0].strip()
                statement = select(ProjectManagerDetails).where(ProjectManagerDetails.manager_name == person_name)
                result = session.exec(statement).first()
                if result:
                    person_code = result.code
        except Exception as e:
            print(f"⚠ Error fetching CODE from database: {e}")
        
        person_code = person_code or "XX"
        constructed_quote_number = f"{company_code}/{yymm}/{person_code}/{request.quotationNumber}"
        
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
        generator.additional_details = [(detail.key, detail.value) for detail in request.additionalDetails] if request.additionalDetails else []
        generator.gallon_type = request.gallonType
        
        # Set company full name from frontend (for "Yours truly" and NOTE sections)
        generator.company_full_name = request.fromCompany
        # Set company short name from frontend (for tank description)
        generator.company_short_name = request.companyShortName if request.companyShortName else None
        
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
                # Parse dimensions with validation
                def parse_dimension(dim_str, field_name="dimension"):
                    dim_str = str(dim_str).strip().replace(" ", "")
                    if not dim_str or dim_str == 'None' or dim_str == '':
                        raise ValueError(f"Missing {field_name}. Please fill in all tank dimensions (length, width, height).")
                    if "(" in dim_str:
                        return float(dim_str.split("(")[0])
                    return float(dim_str)
                
                # Validate and parse dimensions
                try:
                    length = parse_dimension(option.length, "length")
                    width = parse_dimension(option.width, "width")
                    height = parse_dimension(option.height, "height")
                except ValueError as e:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Tank {tank_data.tankNumber}, Option {option_idx + 1}: {str(e)}"
                    )
                
                # Validate tank name
                if not option.tankName or not option.tankName.strip():
                    raise HTTPException(
                        status_code=400,
                        detail=f"Tank {tank_data.tankNumber}, Option {option_idx + 1}: Tank name is required."
                    )
                
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
                    "option_roman": to_roman(option_idx + 1),
                    "support_system": option.supportSystem if hasattr(option, 'supportSystem') and option.supportSystem else "Internal"
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
            print(f"  Terms & Conditions - Total entries: {len(terms_list)}")
            print(f"    Default entries: {len(terms_data.details)}")
            print(f"    Custom entries: {len(terms_data.custom)}")
            if terms_data.custom:
                print(f"    Custom entries content: {terms_data.custom}")
            
            generator.section_content['terms'] = {}
            for idx, term in enumerate(terms_list):
                if ':' in term:
                    key, value = term.split(':', 1)
                    key_clean = key.strip()
                    value_clean = value.strip()
                    generator.section_content['terms'][key_clean] = value_clean
                    print(f"      Added term: '{key_clean}' = '{value_clean[:50]}...'")
                else:
                    print(f"    WARNING: Term #{idx+1} skipped (no colon): {term[:50]}")
            
            print(f"    Final terms dict has {len(generator.section_content['terms'])} entries")
        
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
        
        # Set signature info based on sales person or office person
        if generator.sections['signature']:
            sig_type = 's' if request.quotationFrom == 'Sales' else 'o'
            
            left_name = ""
            left_title = ""
            left_mobile = ""
            left_email = ""
            right_name = ""
            right_title = ""
            right_mobile = ""
            right_email = ""
            signature_image = ""
            
            # Helper function to construct email based on template
            def construct_email(email_name, template_filename):
                if not email_name:
                    return ""
                # Determine domain based on template
                if template_filename.lower().endswith("template_grp.docx"):
                    domain = "grptanks.com"
                elif template_filename.lower().endswith("template_pipeco.docx"):
                    domain = "grppipeco.com"
                elif template_filename.lower().endswith("template_colex.docx"):
                    domain = "colextanks.com"
                else:
                    domain = "grptanks.com"
                return f"{email_name}@{domain}"
            
            try:
                if sig_type == 's':  # UI "Sales"
                    # Get sales person details from database
                    if request.salesPersonName:
                        person_name = request.salesPersonName.split('(')[0].strip() if '(' in request.salesPersonName else request.salesPersonName.strip()
                        statement = select(SalesDetails).where(SalesDetails.sales_person_name == person_name)
                        selected_sales = session.exec(statement).first()
                        
                        if selected_sales:
                            left_name = selected_sales.sales_person_name
                            left_title = selected_sales.designation or "Sales Executive"
                            left_mobile = selected_sales.phone_number or ""
                            left_email = construct_email(selected_sales.email_name, template_filename)
                            
                            # Get signature image
                            code = selected_sales.code
                            signs_dir = os.path.join(script_dir, 'signs&seals')
                            for ext in ['.png', '.jpg', '.jpeg']:
                                if not signature_image:
                                    sign_path = os.path.join(signs_dir, f"{code}_sign{ext}")
                                    if os.path.exists(sign_path):
                                        signature_image = sign_path
                    
                    # Right side: Office Person (Project Manager)
                    if request.officePersonName:
                        person_name = request.officePersonName.split('(')[0].strip() if '(' in request.officePersonName else request.officePersonName.strip()
                        statement = select(ProjectManagerDetails).where(ProjectManagerDetails.manager_name == person_name)
                        selected_pm = session.exec(statement).first()
                    else:
                        # Use first project manager as default
                        statement = select(ProjectManagerDetails)
                        selected_pm = session.exec(statement).first()
                    
                    if selected_pm:
                        right_name = selected_pm.manager_name
                        right_title = selected_pm.designation or "Manager - Projects"
                        right_mobile = selected_pm.phone_number or ""
                        right_email = construct_email(selected_pm.email_name, template_filename)
                    
                else:  # sig_type == 'o', UI "Office"
                    # Get project manager details from database
                    if request.officePersonName:
                        person_name = request.officePersonName.split('(')[0].strip() if '(' in request.officePersonName else request.officePersonName.strip()
                        statement = select(ProjectManagerDetails).where(ProjectManagerDetails.manager_name == person_name)
                        selected_pm = session.exec(statement).first()
                    else:
                        # Use first project manager as default
                        statement = select(ProjectManagerDetails)
                        selected_pm = session.exec(statement).first()
                    
                    if selected_pm:
                        left_name = selected_pm.manager_name
                        left_title = selected_pm.designation or "Manager - Projects"
                        left_mobile = selected_pm.phone_number or ""
                        left_email = construct_email(selected_pm.email_name, template_filename)
                        
                        # Get signature image
                        code = selected_pm.code
                        signs_dir = os.path.join(script_dir, 'signs&seals')
                        for ext in ['.png', '.jpg', '.jpeg']:
                            if not signature_image:
                                sign_path = os.path.join(signs_dir, f"{code}_sign{ext}")
                                if os.path.exists(sign_path):
                                    signature_image = sign_path
                    
                    # No right signatory for office
                    right_name = ""
                    right_title = ""
                    right_mobile = ""
                    right_email = ""
                    
            except Exception as e:
                print(f"⚠ Error reading database for signature: {e}")
                # Fallback to extracting name from provided fields
                if request.quotationFrom == 'Sales' and request.salesPersonName:
                    left_name = request.salesPersonName.split('(')[0].strip()
                    left_title = 'Sales Executive'
                elif request.quotationFrom == 'Office' and request.officePersonName:
                    left_name = request.officePersonName.split('(')[0].strip()
                    left_title = 'Manager - Projects'
            
            generator.section_content['signature'] = {
                'left_name': left_name,
                'left_title': left_title,
                'left_mobile': left_mobile,
                'left_email': left_email,
                'right_name': right_name,
                'right_title': right_title,
                'right_mobile': right_mobile,
                'right_email': right_email,
                'signature_image': signature_image
            }
        
        # Closing paragraph content
        if generator.sections['closing']:
            generator.section_content['closing'] = (
                "We hope the above offer meets your requirements and awaiting the valuable order confirmation.\n"
                "If you have any questions concerning the offer, please contact the undersigned."
            )
        
        # DEBUG: Check section_content right before document generation
        print(f"\n{'='*60}")
        print(f"FINAL CHECK BEFORE DOCUMENT GENERATION")
        print(f"{'='*60}")
        if 'terms' in generator.section_content:
            print(f"  terms section exists: {len(generator.section_content['terms'])} entries")
            for key, val in generator.section_content['terms'].items():
                print(f"    - {key}: {val[:40]}...")
        else:
            print(f"  ⚠️  NO TERMS in section_content!")
        print(f"{'='*60}\n")
        
        # Generate the document
        generator.create_invoice_table()
        
        # Save the document
        output_filename = f"quotation_{constructed_quote_number.replace('/', '_')}.docx"
        output_dir = os.path.join(script_dir, "Final_Doc")
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, output_filename)
        
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


@app.get("/api/companies")
async def get_companies(session: Session = Depends(get_session)):
    """
    Get all company names from company_details table in database
    Returns list of full company names
    """
    try:
        # Query all companies from database
        statement = select(CompanyDetails)
        companies = session.exec(statement).all()
        
        # Extract full_name from each company
        company_names = [company.full_name for company in companies]
        
        return {"companies": company_names}
        
    except Exception as e:
        print(f"Error reading company names from database: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error reading company names from database: {str(e)}")


@app.get("/api/company-details")
async def get_company_details(name: str, session: Session = Depends(get_session)):
    """
    Get company details from company_details table in database based on full_name
    Returns: code, template_path, seal_path, company_domain
    """
    try:
        # Query company by full_name from database
        statement = select(CompanyDetails).where(CompanyDetails.full_name == name.strip())
        company = session.exec(statement).first()
        
        if not company:
            # Get all companies for debugging
            all_companies = session.exec(select(CompanyDetails)).all()
            available_companies = [c.full_name for c in all_companies]
            print(f"⚠ Company not found: '{name}'")
            print(f"Available companies: {available_companies}")
            raise HTTPException(status_code=404, detail=f"Company not found: {name}")
        
        # Get company details
        details = {
            "code": company.code,
            "company_name": company.company_name,
            "template_path": company.template_path or "",
            "seal_path": company.seal_path or "",
            "company_domain": company.company_domain or ""
        }
        
        return details
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error reading company details: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error reading company details: {str(e)}")


@app.get("/api/recipients")
async def get_recipients(session: Session = Depends(get_session)):
    """
    Get all recipients with full details from recipient_details table in database
    Returns list of recipients with name, role, company, location, phone, email
    """
    try:
        # Query all recipients from database
        statement = select(RecipientDetails)
        recipients = session.exec(statement).all()
        
        # Build recipient list with all details
        recipient_list = []
        for recipient in recipients:
            if recipient.recipient_name:  # Only include if name exists
                recipient_list.append({
                    "name": recipient.recipient_name,
                    "role": recipient.role_of_recipient or "",
                    "company": recipient.to_company_name or "",
                    "location": recipient.to_company_location or "",
                    "phone": recipient.phone_number or "",
                    "email": recipient.email or ""
                })
        
        # Sort alphabetically by name
        recipient_list.sort(key=lambda x: x["name"])
        
        return {"recipients": recipient_list}
        
    except Exception as e:
        print(f"Error reading recipients from database: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error reading recipients from database: {str(e)}")


@app.get("/api/company-names")
async def get_company_names(session: Session = Depends(get_session)):
    """
    Get all unique company names from recipient_details table in database
    Returns list of unique company names from to_company_name column
    """
    try:
        # Query all recipients from database
        statement = select(RecipientDetails)
        recipients = session.exec(statement).all()
        
        # Extract unique company names
        company_names = list(set([recipient.to_company_name for recipient in recipients if recipient.to_company_name]))
        company_names.sort()  # Sort alphabetically
        
        return {"company_names": company_names}
        
    except Exception as e:
        print(f"Error reading company names from database: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error reading company names from database: {str(e)}")


@app.get("/api/recipient-details")
async def get_recipient_details(name: str, session: Session = Depends(get_session)):
    """
    Get recipient details from recipient_details table in database based on recipient_name
    Returns: role, company name, location, phone, email
    """
    try:
        # Query recipient by name from database
        statement = select(RecipientDetails).where(RecipientDetails.recipient_name == name.strip())
        recipient = session.exec(statement).first()
        
        if not recipient:
            print(f"⚠ Recipient not found: '{name}'")
            # Get all recipients for debugging
            all_recipients = session.exec(select(RecipientDetails)).all()
            available_recipients = [r.recipient_name for r in all_recipients]
            print(f"Available recipients: {available_recipients}")
            raise HTTPException(status_code=404, detail=f"Recipient not found: {name}")
        
        # Get recipient details
        details = {
            "recipientName": recipient.recipient_name,
            "role": recipient.role_of_recipient or "",
            "companyName": recipient.to_company_name or "",
            "location": recipient.to_company_location or "",
            "phoneNumber": recipient.phone_number or "",
            "email": recipient.email or ""
        }
        
        return details
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error reading recipient details: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error reading recipient details: {str(e)}")


# Pydantic models for request/response
class SaveQuotationRequest(BaseModel):
    quotationNumber: str
    fullQuoteNumber: str
    finalDocFilePath: Optional[str] = None
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
    officePersonName: Optional[str] = ""
    subject: str
    projectLocation: str
    tanksData: Dict[str, Any]
    formOptions: Optional[Dict[str, Any]] = None
    additionalData: Optional[Dict[str, Any]] = None
    terms: Optional[Dict[str, Any]] = None
    revisionNumber: int = 0
    status: str = "draft"


@app.post("/api/save-quotation")
async def save_quotation(request: SaveQuotationRequest, session: Session = Depends(get_session)):
    """
    Save quotation form data to database
    """
    try:
        print(f"\n{'='*60}")
        print(f"SAVING QUOTATION TO DATABASE")
        print(f"{'='*60}")
        print(f"Full Quote Number: {request.fullQuoteNumber}")
        print(f"From Company: {request.fromCompany}")
        
        # Get company from database by full_name (not hardcoded)
        statement = select(CompanyDetails).where(CompanyDetails.full_name == request.fromCompany)
        company = session.exec(statement).first()
        if not company:
            print(f"⚠ Company not found in database: {request.fromCompany}")
            # Try to list all available companies for debugging
            all_companies = session.exec(select(CompanyDetails)).all()
            available = [c.full_name for c in all_companies]
            print(f"Available companies: {available}")
            raise HTTPException(status_code=404, detail=f"Company not found: {request.fromCompany}")
        
        print(f"✓ Found company: {company.full_name} (ID: {company.id}, Code: {company.code})")
        
        # Create or update recipient
        statement = select(RecipientDetails).where(
            RecipientDetails.recipient_name == request.recipientName,
            RecipientDetails.to_company_name == request.companyName
        )
        recipient = session.exec(statement).first()
        
        if recipient:
            # Update existing recipient
            recipient.role_of_recipient = request.role
            recipient.to_company_location = request.location
            recipient.phone_number = request.phoneNumber
            recipient.email = request.email
            recipient.last_updated_time = datetime.utcnow()
        else:
            # Create new recipient
            recipient = RecipientDetails(
                recipient_name=request.recipientName,
                role_of_recipient=request.role,
                to_company_name=request.companyName,
                to_company_location=request.location,
                phone_number=request.phoneNumber,
                email=request.email
            )
            session.add(recipient)
        
        session.flush()  # Get recipient ID
        
        # Get sales person or project manager
        sales_person_id = None
        project_manager_id = None
        
        if request.quotationFrom == 'Sales' and request.salesPersonName:
            person_name = request.salesPersonName.split('(')[0].strip()
            statement = select(SalesDetails).where(SalesDetails.sales_person_name == person_name)
            sales_person = session.exec(statement).first()
            if sales_person:
                sales_person_id = sales_person.id
        
        if request.officePersonName:
            person_name = request.officePersonName.split('(')[0].strip()
            statement = select(ProjectManagerDetails).where(ProjectManagerDetails.manager_name == person_name)
            pm = session.exec(statement).first()
            if pm:
                project_manager_id = pm.id
        
        # Use first sales person as default if not found
        if not sales_person_id:
            statement = select(SalesDetails)
            first_sales = session.exec(statement).first()
            if first_sales:
                sales_person_id = first_sales.id
        
        if not sales_person_id:
            raise HTTPException(status_code=404, detail="No sales person found in database")
        
        # Parse date
        try:
            date_parts = request.quotationDate.split('/')
            if len(date_parts) == 3:
                quotation_date = date(int(f"20{date_parts[2]}"), int(date_parts[1]), int(date_parts[0]))
            else:
                quotation_date = date.fromisoformat(request.quotationDate)
        except:
            quotation_date = date.today()
        
        # Check if quotation already exists (for updates)
        statement = select(QuotationWebpageInputDetailsSave).where(
            QuotationWebpageInputDetailsSave.full_main_quote_number == request.fullQuoteNumber
        )
        existing_quotation = session.exec(statement).first()
        
        if existing_quotation:
            # Update existing quotation
            existing_quotation.quotation_number = request.quotationNumber
            existing_quotation.final_doc_file_path = request.finalDocFilePath
            existing_quotation.company_id = company.id
            existing_quotation.recipient_id = recipient.id
            existing_quotation.sales_person_id = sales_person_id
            existing_quotation.project_manager_id = project_manager_id
            existing_quotation.quotation_date = quotation_date
            existing_quotation.subject = request.subject
            existing_quotation.project_location = request.projectLocation
            existing_quotation.tanks_data = request.tanksData
            existing_quotation.form_options = request.formOptions or {}
            existing_quotation.additional_data = request.additionalData or {}
            existing_quotation.revision_number = request.revisionNumber
            existing_quotation.status = request.status
            existing_quotation.last_updated_time = datetime.utcnow()
            
            print(f"✓ Updated existing quotation: {request.fullQuoteNumber}")
        else:
            # Create new quotation
            quotation = QuotationWebpageInputDetailsSave(
                quotation_number=request.quotationNumber,
                full_main_quote_number=request.fullQuoteNumber,
                final_doc_file_path=request.finalDocFilePath,
                company_id=company.id,
                recipient_id=recipient.id,
                sales_person_id=sales_person_id,
                project_manager_id=project_manager_id,
                quotation_date=quotation_date,
                subject=request.subject,
                project_location=request.projectLocation,
                tanks_data=request.tanksData,
                form_options=request.formOptions or {},
                additional_data=request.additionalData or {},
                revision_number=request.revisionNumber,
                status=request.status
            )
            session.add(quotation)
            print(f"✓ Created new quotation: {request.fullQuoteNumber}")
        
        # Save contractual terms & specifications
        if request.terms:
            # Check if terms already exist
            statement = select(ContractualTermsSpecifications).where(
                ContractualTermsSpecifications.full_main_quote_number == request.fullQuoteNumber
            )
            existing_terms = session.exec(statement).first()
            
            # Map frontend terms to database columns
            terms_mapping = {
                'note': 'note',
                'materialSpecification': 'material_specifications',
                'warrantyExclusions': 'warranty_conditions',  # Frontend uses warrantyExclusions
                'termsConditions': 'terms_and_conditions',    # Frontend uses termsConditions
                'supplierScope': 'supplier_scope',
                'customerScope': 'customer_scope',
                'extraNote': 'note_second',
                'scopeOfWork': 'scope_of_work',
                'workExcluded': 'work_excluded'
            }
            
            if existing_terms:
                # Update existing terms
                for frontend_key, db_column in terms_mapping.items():
                    if frontend_key in request.terms:
                        setattr(existing_terms, db_column, request.terms[frontend_key])
                existing_terms.last_updated_time = datetime.utcnow()
                print(f"✓ Updated contractual terms for: {request.fullQuoteNumber}")
            else:
                # Create new terms
                terms_data = {}
                for frontend_key, db_column in terms_mapping.items():
                    if frontend_key in request.terms:
                        terms_data[db_column] = request.terms[frontend_key]
                
                contractual_terms = ContractualTermsSpecifications(
                    full_main_quote_number=request.fullQuoteNumber,
                    **terms_data
                )
                session.add(contractual_terms)
                print(f"✓ Created contractual terms for: {request.fullQuoteNumber}")
        
        session.commit()
        
        print(f"{'='*60}\n")
        
        return {
            "success": True,
            "message": "Quotation saved successfully",
            "fullQuoteNumber": request.fullQuoteNumber
        }
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        print(f"⚠ Error saving quotation: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error saving quotation: {str(e)}")


@app.get("/api/quotation")
async def get_quotation(quote_number: str, session: Session = Depends(get_session)):
    """
    Retrieve quotation form data by full quote number
    Query parameter: quote_number (full quote number like GRPT/2602/VV/0001)
    """
    try:
        print(f"\n{'='*60}")
        print(f"RETRIEVING QUOTATION FROM DATABASE")
        print(f"{'='*60}")
        print(f"Full Quote Number: {quote_number}")
        
        # Query quotation with all related data
        statement = select(QuotationWebpageInputDetailsSave).where(
            QuotationWebpageInputDetailsSave.full_main_quote_number == quote_number
        )
        quotation = session.exec(statement).first()
        
        if not quotation:
            raise HTTPException(status_code=404, detail=f"Quotation not found: {quote_number}")
        
        # Get related data
        company = session.get(CompanyDetails, quotation.company_id)
        recipient = session.get(RecipientDetails, quotation.recipient_id)
        sales_person = session.get(SalesDetails, quotation.sales_person_id)
        project_manager = None
        if quotation.project_manager_id:
            project_manager = session.get(ProjectManagerDetails, quotation.project_manager_id)
        
        print(f"✓ Found company: {company.full_name if company else 'None'} (ID: {quotation.company_id})")
        
        # Get contractual terms
        statement_terms = select(ContractualTermsSpecifications).where(
            ContractualTermsSpecifications.full_main_quote_number == quote_number
        )
        contractual_terms = session.exec(statement_terms).first()
        
        # Map database columns to frontend terms
        terms_data = {}
        if contractual_terms:
            db_to_frontend_mapping = {
                'note': 'note',
                'material_specifications': 'materialSpecification',
                'warranty_conditions': 'warrantyExclusions',  # Frontend uses warrantyExclusions
                'terms_and_conditions': 'termsConditions',    # Frontend uses termsConditions
                'supplier_scope': 'supplierScope',
                'customer_scope': 'customerScope',
                'note_second': 'extraNote',
                'scope_of_work': 'scopeOfWork',
                'work_excluded': 'workExcluded'
            }
            
            for db_column, frontend_key in db_to_frontend_mapping.items():
                db_value = getattr(contractual_terms, db_column, None)
                if db_value:
                    terms_data[frontend_key] = db_value
        
        # Build response
        response = {
            "quotationNumber": quotation.quotation_number,
            "fullQuoteNumber": quotation.full_main_quote_number,
            "finalDocFilePath": quotation.final_doc_file_path,
            "fromCompany": company.full_name if company else "",
            "recipientTitle": "Mr.",  # Default, can be enhanced
            "recipientName": recipient.recipient_name if recipient else "",
            "role": recipient.role_of_recipient if recipient else "",
            "companyName": recipient.to_company_name if recipient else "",
            "location": recipient.to_company_location if recipient else "",
            "phoneNumber": recipient.phone_number if recipient else "",
            "email": recipient.email if recipient else "",
            "quotationDate": quotation.quotation_date.strftime("%d/%m/%y"),
            "quotationFrom": "Sales" if sales_person else "Office",
            "salesPersonName": sales_person.sales_person_name if sales_person else "",
            "officePersonName": project_manager.manager_name if project_manager else "",
            "subject": quotation.subject,
            "projectLocation": quotation.project_location,
            "tanksData": quotation.tanks_data,
            "formOptions": quotation.form_options or {},
            "additionalData": quotation.additional_data or {},
            "terms": terms_data,
            "revisionNumber": quotation.revision_number,
            "status": quotation.status,
            "createdTime": quotation.created_time.isoformat(),
            "lastUpdatedTime": quotation.last_updated_time.isoformat()
        }
        
        print(f"✓ Retrieved quotation successfully")
        print(f"{'='*60}\n")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"⚠ Error retrieving quotation: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error retrieving quotation: {str(e)}")


@app.get("/api/person-names/{person_type}")
async def get_person_names(person_type: str, session: Session = Depends(get_session)):
    """
    Get person names from database based on person type.
    person_type can be 'sales' or 'office'
    """
    try:
        if person_type == "sales":
            # Query sales_details table
            statement = select(SalesDetails)
            results = session.exec(statement).all()
            names = [person.sales_person_name for person in results]
        elif person_type == "office":
            # Query project_manager_details table
            statement = select(ProjectManagerDetails)
            results = session.exec(statement).all()
            names = [person.manager_name for person in results]
        else:
            raise HTTPException(status_code=400, detail="Invalid person type. Use 'sales' or 'office'")
        
        return {"names": names}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error reading person names: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error reading person names: {str(e)}")


@app.get("/api/person-code")
async def get_person_code(name: str, type: str, session: Session = Depends(get_session)):
    """
    Get CODE from database based on person name and type.
    type can be 'sales' or 'office'
    name should be the person's name
    """
    try:
        print(f"\n{'='*60}")
        print(f"FETCHING CODE FROM DATABASE")
        print(f"{'='*60}")
        print(f"Name: {name}")
        print(f"Type: {type}")
        
        # Extract name without (CODE) suffix if present
        clean_name = name.split('(')[0].strip()
        print(f"Clean name: '{clean_name}'")
        
        code = "XX"  # Default code
        
        if type == "sales":
            # Query sales_details table
            statement = select(SalesDetails).where(SalesDetails.sales_person_name == clean_name)
            result = session.exec(statement).first()
            if result:
                code = result.code
                print(f"✓ Found sales person CODE: {code}")
            else:
                print(f"⚠ Sales person not found: '{clean_name}'")
                
        elif type == "office":
            # Query project_manager_details table
            statement = select(ProjectManagerDetails).where(ProjectManagerDetails.manager_name == clean_name)
            result = session.exec(statement).first()
            if result:
                code = result.code
                print(f"✓ Found project manager CODE: {code}")
            else:
                print(f"⚠ Project manager not found: '{clean_name}'")
        else:
            raise HTTPException(status_code=400, detail="Invalid type. Use 'sales' or 'office'")
        
        print(f"{'='*60}\n")
        return {"code": code}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"⚠ Error reading person CODE: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error reading person CODE: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
