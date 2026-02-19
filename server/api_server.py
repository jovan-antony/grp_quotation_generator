from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import tempfile

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

try:
    from network_storage import NetworkStorage
    NETWORK_STORAGE_AVAILABLE = True
except Exception as network_import_error:
    NetworkStorage = None
    NETWORK_STORAGE_AVAILABLE = False
    print(f"⚠ Network storage support disabled: {network_import_error}")

app = FastAPI()


def resolve_docker_mount_path(network_path: str, company_code: str) -> Optional[str]:
    """Map UNC/network storage path to local Docker mount path when available."""
    configured_mounts = {
        "GRPT": os.getenv("GRPT_STORAGE_MOUNT", "/mnt/grp_quotations"),
        "GRPPT": os.getenv("GRPPT_STORAGE_MOUNT", "/mnt/grp_pipeco_quotations"),
        "CLX": os.getenv("CLX_STORAGE_MOUNT", "/mnt/colex_quotations"),
    }

    share_to_mount = {
        "grp-quotations": configured_mounts["GRPT"],
        "grp-pipeco-quotations": configured_mounts["GRPPT"],
        "colex-quotations": configured_mounts["CLX"],
    }

    path = str(network_path or "").replace('\\', '/').strip()
    if not path.startswith('//'):
        return None

    unc_parts = [part for part in path.lstrip('/').split('/') if part]
    if len(unc_parts) < 2:
        return None

    share_name = unc_parts[1].lower()
    trailing_parts = unc_parts[2:]

    mount_base = share_to_mount.get(share_name)
    if not mount_base:
        mount_base = configured_mounts.get(company_code)

    if not mount_base:
        return None

    mount_path = os.path.join(mount_base, *trailing_parts) if trailing_parts else mount_base
    return mount_path

# Database setup disabled

# Enable CORS - Allow all origins for Docker deployment
# Explicit configuration for company server deployment
cors_origins_env = os.getenv("CORS_ORIGINS", "")
if cors_origins_env.strip():
    configured_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
else:
    configured_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.0.10:3000",
        "https://192.168.0.10:3000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=configured_origins if configured_origins else ["*"],
    allow_origin_regex=r".*",
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# STARTUP EVENT DISABLED - Was causing container startup issues
# Excel sync can be triggered manually via POST /api/sync-excel endpoint
# 
# @app.on_event("startup")
# async def startup_event():
#     """Automatically sync Excel files to database when server starts"""
#     pass


@app.get("/")
async def root():
    """Root endpoint to verify server is running"""
    return {"status": "running", "message": "GRP Quotation Generator API"}


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
    hasDiscount: Optional[bool] = False
    discountedTotalPrice: Optional[str] = ""


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
    revisionNumber: int = 0
    subject: str
    projectLocation: str
    generatedBy: Optional[str] = ""
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
        # Load environment variables
        from dotenv import load_dotenv
        script_dir = os.path.dirname(__file__)
        env_file = os.path.join(script_dir, '.env')
        if os.path.exists(env_file):
            load_dotenv(dotenv_path=env_file, override=True)
        
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
                "GRP TANKS TRADING L.L.C": "grp_template.docx",
                "GRP PIPECO TANKS TRADING L.L.C": "pipeco_template.docx",
                "COLEX TANKS TRADING L.L.C": "colex_template.docx",
            }
            template_filename = template_map.get(request.fromCompany, "grp_template.docx")
        
        # Get DATA_PATH from .env and construct template path
        from sync_excel_to_db import get_data_path
        data_path = get_data_path()
        template_path = os.path.join(data_path, "template", template_filename)
        
        # Verify template file exists
        if not os.path.exists(template_path):
            print(f"⚠ Template file not found: {template_path}")
            print(f"Template filename requested: {template_filename}")
            print(f"DATA_PATH: {data_path}")
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
        
        # Add revision suffix if revision number is greater than 0
        if request.revisionNumber > 0:
            constructed_quote_number = f"{constructed_quote_number}-R{request.revisionNumber}"
        
        # Set header data
        # Add role to recipient name with hyphen if role is provided
        recipient_name_with_role = request.recipientName
        if request.role and request.role.strip():
            recipient_name_with_role = f"{request.recipientName} - {request.role}"
        generator.recipient_name = recipient_name_with_role
        
        # Add M/S. prefix to company name
        company_name_with_prefix = f"M/s. {request.companyName}"
        generator.recipient_company = company_name_with_prefix
        generator.recipient_location = request.location or ""
        # Add PHONE: and EMAIL: prefixes with uppercase
        generator.recipient_phone = f"{request.phoneNumber}" if request.phoneNumber and request.phoneNumber.strip() else ""
        generator.recipient_email = f"{request.email}" if request.email and request.email.strip() else ""
        generator.quote_date = request.quotationDate
        generator.quote_number = constructed_quote_number
        generator.subject = request.subject
        generator.project = request.projectLocation
        # Include additional details even with empty/null values (use empty strings for null)
        generator.additional_details = [
            (detail.key or "", detail.value or "") 
            for detail in request.additionalDetails
        ] if request.additionalDetails else []
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
                # Parse dimensions - Allow null/empty values
                def parse_dimension(dim_str, field_name="dimension"):
                    """Parse dimension string, return None if empty/null"""
                    if not dim_str or str(dim_str).strip() == '' or str(dim_str).strip() == 'None':
                        return None
                    dim_str = str(dim_str).strip().replace(" ", "")
                    if "(" in dim_str:
                        return float(dim_str.split("(")[0])
                    try:
                        return float(dim_str)
                    except ValueError:
                        return None
                
                # Parse dimensions (can be None)
                length = parse_dimension(option.length, "length")
                width = parse_dimension(option.width, "width")
                height = parse_dimension(option.height, "height")
                
                # Tank name is optional - no validation needed
                
                # Calculate volume (only if all dimensions are provided)
                volume_m3 = 0.0
                gallons = 0.0
                if length and width and height:
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
                
                # Calculate net volume based on free board (only if dimensions exist)
                net_volume_m3 = 0.0
                if length and width and height:
                    net_volume_m3 = length * width * (height - free_board_m)
                
                # Determine skid based on height (only if height exists)
                skid = ""
                if height:
                    if 2.0 <= height <= 3.0:
                        skid = "SKID BASE - HDG HOLLOW SECTION 50 X 50 X 3 MM (SQUARE TUBE)"
                    elif 1.0 <= height < 1.5:
                        skid = "WITHOUT SKID"
                    elif height > 3.0:
                        skid = "SKID BASE - I BEAM SKID"
                
                # Calculate total price - use discounted price if discount is enabled
                has_discount = option.hasDiscount if hasattr(option, 'hasDiscount') and option.hasDiscount else False
                unit_price = float(option.unitPrice) if option.unitPrice else 0.0
                quantity = float(option.quantity) if option.quantity else 0.0
                
                if has_discount and option.discountedTotalPrice:
                    total_price = float(option.discountedTotalPrice)
                else:
                    total_price = quantity * unit_price
                
                tank = {
                    "sl_no": sl_no,
                    "name": option.tankName or "",
                    "partition": option.hasPartition,
                    "type": option.tankType or "",
                    "length": length if length else 0.0,
                    "length_display": option.length or "",
                    "width": width if width else 0.0,
                    "width_display": option.width or "",
                    "height": height if height else 0.0,
                    "volume_m3": volume_m3,
                    "gallons": gallons,
                    "free_board": free_board_m,
                    "need_free_board": need_free_board,
                    "net_volume_m3": net_volume_m3,
                    "net_height": (height - free_board_m) if height else 0.0,
                    "skid": skid,
                    "unit": option.unit or "",
                    "qty": quantity,
                    "unit_price": unit_price,
                    "total_price": total_price,
                    "option_number": option_idx + 1,
                    "option_total": num_options,
                    "option_roman": to_roman(option_idx + 1),
                    "support_system": option.supportSystem if hasattr(option, 'supportSystem') and option.supportSystem else "Internal",
                    "has_discount": has_discount
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
        
        # Check if any tank has discount enabled
        generator.has_discount = any(tank.get('has_discount', False) for tank in generator.tanks)
        
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
            # For terms, we need to format as dict for key-value terms
            # and keep a list for plain custom terms without colons
            terms_list = terms_data.details + terms_data.custom
            print(f"  Terms & Conditions - Total entries: {len(terms_list)}")
            print(f"    Default entries: {len(terms_data.details)}")
            print(f"    Custom entries: {len(terms_data.custom)}")
            if terms_data.custom:
                print(f"    Custom entries content: {terms_data.custom}")
            
            generator.section_content['terms'] = {}
            generator.section_content['terms_plain'] = []  # For custom terms without colons
            
            for idx, term in enumerate(terms_list):
                if ':' in term:
                    key, value = term.split(':', 1)
                    key_clean = key.strip()
                    value_clean = value.strip()
                    generator.section_content['terms'][key_clean] = value_clean
                    print(f"      Added formatted term: '{key_clean}' = '{value_clean[:50]}...'")
                else:
                    # Add plain custom terms to separate list
                    generator.section_content['terms_plain'].append(term.strip())
                    print(f"      Added plain term: {term[:50]}")
            
            print(f"    Final terms dict has {len(generator.section_content['terms'])} formatted entries")
            print(f"    Final terms_plain list has {len(generator.section_content['terms_plain'])} plain entries")
        
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
            
            # Get company domain from database
            company_domain = ""
            try:
                statement = select(CompanyDetails).where(CompanyDetails.full_name == request.fromCompany)
                company_result = session.exec(statement).first()
                if company_result and company_result.company_domain:
                    company_domain = company_result.company_domain
                else:
                    # Fallback to default domain
                    company_domain = "grptanks.com"
            except Exception as e:
                print(f"⚠ Error fetching company domain: {e}")
                company_domain = "grptanks.com"
            
            # Helper function to construct email using company domain
            def construct_email(email_name, domain):
                if not email_name or not domain:
                    return ""
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
                            left_email = construct_email(selected_sales.email_name, company_domain)
                            
                            # Get signature image from DATA_PATH/signs&seals
                            code = selected_sales.code
                            signs_dir = os.path.join(data_path, 'signs&seals')
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
                        right_email = construct_email(selected_pm.email_name, company_domain)
                    
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
                        left_email = construct_email(selected_pm.email_name, company_domain)
                        
                        # Get signature image from DATA_PATH/signs&seals
                        code = selected_pm.code
                        signs_dir = os.path.join(data_path, 'signs&seals')
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
        
        # Save the document to company-specific path from database
        # Format: GRPPT_2602_MM_4186.docx or GRPPT_2602_MM_4186-R1.docx
        output_filename = f"{constructed_quote_number.replace('/', '_')}.docx"
        
        # Get company-specific output directory from database
        try:
            statement = select(CompanyDetails).where(CompanyDetails.code == company_code)
            company_details = session.exec(statement).first()
            if company_details and company_details.company_storage_path:
                output_dir = company_details.company_storage_path
            else:
                # Fallback to Final_Doc/{company_code} if not in database
                script_dir = os.path.dirname(__file__)
                output_dir = os.path.join(script_dir, "Final_Doc", company_code)
        except Exception as e:
            print(f"⚠ Error fetching company storage path from database: {e}")
            # Fallback to Final_Doc/{company_code}
            script_dir = os.path.dirname(__file__)
            output_dir = os.path.join(script_dir, "Final_Doc", company_code)

        # Normalize storage path from DB (handles malformed network paths like 192.168.0.10\\share\\folder)
        raw_output_dir = str(output_dir).strip()
        normalized_output_dir = raw_output_dir.replace('\\', '/')
        normalized_parts = [part.strip() for part in normalized_output_dir.split('/') if part.strip()]
        normalized_output_dir = '/'.join(normalized_parts)

        if normalized_output_dir and not normalized_output_dir.startswith('/'):
            first_segment = normalized_output_dir.split('/')[0]
            looks_like_network_host = '.' in first_segment or first_segment.lower() == 'localhost'
            if looks_like_network_host:
                normalized_output_dir = f"//{normalized_output_dir}"

        if normalized_output_dir:
            output_dir = normalized_output_dir

        mount_output_dir = resolve_docker_mount_path(output_dir, company_code)
        if mount_output_dir:
            # Check if the mount base directory exists (not the full subdirectory path)
            # For example, check /mnt/colex_quotations exists, not /mnt/colex_quotations/CLX-QUOTATIONS-GENERATOR
            configured_mounts = {
                "GRPT": os.getenv("GRPT_STORAGE_MOUNT", "/mnt/grp_quotations"),
                "GRPPT": os.getenv("GRPPT_STORAGE_MOUNT", "/mnt/grp_pipeco_quotations"),
                "CLX": os.getenv("CLX_STORAGE_MOUNT", "/mnt/colex_quotations"),
            }
            mount_base = configured_mounts.get(company_code)
            if mount_base and os.path.isdir(mount_base):
                print(f"📦 Using Docker-mounted path instead of SMB UNC: {mount_output_dir}")
                output_dir = mount_output_dir
            else:
                print(f"⚠ Mount base '{mount_base}' not found, will attempt SMB or fallback")

        print(f"📂 Storage path resolved: raw='{raw_output_dir}' -> normalized='{output_dir}'")
        
        # Check if this is a network path
        is_network_path = output_dir.startswith('//') or output_dir.startswith('\\\\')
        
        if not is_network_path:
            # Only create local directories
            os.makedirs(output_dir, exist_ok=True)
        
        output_path = os.path.join(output_dir, output_filename)
        
        # Delete existing file if it exists
        if is_network_path:
            # Check and delete from network share
            if NETWORK_STORAGE_AVAILABLE:
                try:
                    smb_username = os.getenv('SMB_USERNAME')
                    smb_password = os.getenv('SMB_PASSWORD')
                    
                    if smb_username and smb_password:
                        storage = NetworkStorage(smb_username, smb_password)
                        network_full_path = f"{output_dir}/{output_filename}".replace('\\', '/')
                        
                        if storage.file_exists(network_full_path):
                            print(f"⚠ File '{output_filename}' already exists on network share - replacing...")
                            if storage.delete_file(network_full_path):
                                print(f"✓ Successfully deleted existing file from network share")
                            else:
                                print(f"⚠ Could not delete existing file from network share")
                except Exception as e:
                    print(f"⚠ Error checking/deleting network file: {e}")
        elif os.path.exists(output_path):
            try:
                print(f"⚠ File '{output_filename}' already exists - replacing with new version...")
                os.remove(output_path)
                print(f"✓ Successfully deleted existing file")
            except PermissionError:
                error_msg = (
                    f"Cannot replace '{output_filename}' because it is currently open. "
                    f"Please close the file in Word or any other application and try again."
                )
                print(f"❌ {error_msg}")
                raise HTTPException(status_code=409, detail=error_msg)
            except Exception as e:
                error_msg = f"Could not delete existing file: {str(e)}"
                print(f"❌ {error_msg}")
                raise HTTPException(status_code=500, detail=error_msg)
        
        print(f"📁 Saving document...")
        print(f"   Output directory: {output_dir}")
        print(f"   Output filename: {output_filename}")
        print(f"   Full path: {output_path}")
        
        # Check if this is a network path (starts with // or \\)
        is_network_path = output_dir.startswith('//') or output_dir.startswith('\\\\')
        
        if is_network_path:
            # Save to network share using SMB
            print(f"🌐 Detected network path, using SMB/CIFS protocol")
            
            if not NETWORK_STORAGE_AVAILABLE:
                raise HTTPException(
                    status_code=500, 
                    detail="Network storage not available. Please install pysmb: pip install pysmb"
                )
            
            # Get SMB credentials from environment
            smb_username = os.getenv('SMB_USERNAME')
            smb_password = os.getenv('SMB_PASSWORD')
            
            if not smb_username or not smb_password:
                raise HTTPException(
                    status_code=500,
                    detail="SMB credentials not configured. Set SMB_USERNAME and SMB_PASSWORD environment variables."
                )
            
            # Save to temporary local file first
            temp_dir = tempfile.gettempdir()
            temp_file_path = os.path.join(temp_dir, output_filename)
            
            print(f"   Saving to temporary file: {temp_file_path}")
            saved_path = generator.save(temp_file_path)
            
            if not os.path.exists(saved_path):
                raise HTTPException(status_code=500, detail="Failed to generate document locally")
            
            # Upload to network share
            try:
                storage = NetworkStorage(smb_username, smb_password)
                network_full_path = f"{output_dir}/{output_filename}".replace('\\', '/')
                
                print(f"   Uploading to network share: {network_full_path}")
                success = storage.save_file(saved_path, network_full_path, create_dirs=True)
                
                if not success:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Failed to upload file to network share: {network_full_path}"
                    )
                
                # Clean up temp file
                os.remove(saved_path)
                print(f"   Cleaned up temporary file")
                
                actual_path = network_full_path
                print(f"✓ Document successfully saved to network share: {actual_path}")
                
            except Exception as e:
                # Clean up temp file on error
                if os.path.exists(saved_path):
                    os.remove(saved_path)

                mount_fallback = resolve_docker_mount_path(output_dir, company_code)
                print(f"🔄 SMB failed with error: {str(e)}")
                print(f"   Attempting Docker mount fallback...")
                print(f"   Mount fallback path: {mount_fallback}")
                
                if mount_fallback:
                    try:
                        # If mount_fallback is a directory path, use it; if it's a file path, use its directory
                        fallback_dir = os.path.dirname(mount_fallback) if os.path.splitext(mount_fallback)[1] else mount_fallback
                        print(f"   Fallback directory: {fallback_dir}")
                        print(f"   Creating directory if needed...")
                        os.makedirs(fallback_dir, exist_ok=True)
                        print(f"   ✓ Directory exists/created")
                        
                        fallback_full_path = os.path.join(fallback_dir, output_filename)
                        print(f"   Saving to: {fallback_full_path}")
                        local_saved = generator.save(fallback_full_path)
                        print(f"   Generator returned: {local_saved}")
                        
                        # Verify file was actually created
                        if os.path.exists(local_saved):
                            actual_path = local_saved
                            file_size = os.path.getsize(local_saved)
                            print(f"✓ SMB failed, saved via Docker mount fallback: {actual_path} ({file_size} bytes)")
                        elif os.path.exists(fallback_full_path):
                            actual_path = fallback_full_path
                            file_size = os.path.getsize(fallback_full_path)
                            print(f"✓ SMB failed, saved via Docker mount fallback: {actual_path} ({file_size} bytes)")
                        else:
                            raise Exception(f"File not found after save at {local_saved} or {fallback_full_path}")
                        
                        return {
                            "success": True,
                            "filename": output_filename,
                            "filepath": f"{company_code}/{output_filename}",
                            "absolute_filepath": actual_path,
                            "message": "Quotation generated successfully (saved via mount fallback)"
                        }
                    except Exception as fallback_error:
                        print(f"⚠ Mount fallback also failed:")
                        print(f"   Error: {fallback_error}")
                        import traceback
                        traceback.print_exc()

                raise HTTPException(
                    status_code=500,
                    detail=(
                        f"Error uploading to network share: {str(e)}. "
                        f"SMB access denied likely due to share permissions/credentials. "
                        f"Update company_storage_path to Docker mount paths (/mnt/...) or fix SMB user permissions."
                    )
                )
        else:
            # Save to local filesystem (including Docker mounts)
            print(f"💾 Saving to local/mounted filesystem...")
            print(f"   Directory: {output_dir}")
            
            # Verify directory exists or can be created
            try:
                if not os.path.exists(output_dir):
                    print(f"   Directory doesn't exist, creating: {output_dir}")
                    os.makedirs(output_dir, exist_ok=True)
                    print(f"   ✓ Directory created")
                else:
                    print(f"   ✓ Directory exists")
                    
                # Check if directory is writable
                if not os.access(output_dir, os.W_OK):
                    raise PermissionError(f"Directory is not writable: {output_dir}")
                    
            except Exception as dir_error:
                print(f"❌ Error with output directory: {dir_error}")
                raise HTTPException(
                    status_code=500, 
                    detail=f"Cannot create or access output directory: {output_dir}. Error: {str(dir_error)}"
                )
            
            saved_path = generator.save(output_path)
            
            print(f"✓ Generator.save() returned: {saved_path}")
            print(f"   Checking if file exists at: {saved_path}")
            
            # Check both the returned path and the requested path
            if os.path.exists(saved_path):
                actual_path = saved_path
                file_size = os.path.getsize(saved_path)
                print(f"✓ Document successfully saved at: {actual_path} ({file_size} bytes)")
            elif os.path.exists(output_path):
                actual_path = output_path
                file_size = os.path.getsize(output_path)
                print(f"✓ Document successfully saved at: {actual_path} ({file_size} bytes)")
            else:
                print(f"❌ File not found at either location!")
                print(f"   Expected: {output_path}")
                print(f"   Returned: {saved_path}")
                print(f"   Directory contents:")
                try:
                    if os.path.exists(output_dir):
                        files = os.listdir(output_dir)
                        for f in files[:10]:  # Show first 10 files
                            print(f"     - {f}")
                except Exception as list_error:
                    print(f"   Could not list directory: {list_error}")
                raise HTTPException(status_code=500, detail="Failed to generate document - file not found after save")
        
        # Return JSON with file details instead of the file itself
        return {
            "success": True,
            "filename": output_filename,
            "filepath": f"{company_code}/{output_filename}",
            "absolute_filepath": actual_path,
            "message": "Quotation generated successfully"
        }
        
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
class UpdateRevisionRequest(BaseModel):
    revision_number: int

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
    generatedBy: Optional[str] = ""
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
        print(f"Quotation Number: {request.quotationNumber}")
        print(f"Revision Number: {request.revisionNumber}")
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
        
        # Check if quotation already exists by composite key (company_id, quotation_number, revision_number)
        # This matches the unique constraint "unique_quote_per_company"
        print(f"Checking for existing quotation: company_id={company.id}, quote_number={request.quotationNumber}, revision={request.revisionNumber}")
        statement = select(QuotationWebpageInputDetailsSave).where(
            QuotationWebpageInputDetailsSave.company_id == company.id,
            QuotationWebpageInputDetailsSave.quotation_number == request.quotationNumber,
            QuotationWebpageInputDetailsSave.revision_number == request.revisionNumber
        )
        existing_quotation = session.exec(statement).first()
        
        if existing_quotation:
            print(f"⚠ Found existing quotation (ID: {existing_quotation.id}), updating with new data...")
            # Update existing quotation
            existing_quotation.full_main_quote_number = request.fullQuoteNumber
            existing_quotation.quotation_number = request.quotationNumber
            existing_quotation.final_doc_file_path = request.finalDocFilePath
            existing_quotation.company_id = company.id
            existing_quotation.recipient_id = recipient.id
            existing_quotation.sales_person_id = sales_person_id
            existing_quotation.project_manager_id = project_manager_id
            existing_quotation.quotation_date = quotation_date
            existing_quotation.subject = request.subject
            existing_quotation.project_location = request.projectLocation
            existing_quotation.generated_by = request.generatedBy
            existing_quotation.tanks_data = request.tanksData
            existing_quotation.form_options = request.formOptions or {}
            existing_quotation.additional_data = request.additionalData or {}
            existing_quotation.revision_number = request.revisionNumber
            existing_quotation.status = request.status
            existing_quotation.last_updated_time = datetime.utcnow()
            
            print(f"✓ Updated existing quotation: {request.fullQuoteNumber} (revision: {request.revisionNumber})")
        else:
            print(f"No existing quotation found, creating new: {request.fullQuoteNumber} (revision: {request.revisionNumber})")
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
                generated_by=request.generatedBy,
                tanks_data=request.tanksData,
                form_options=request.formOptions or {},
                additional_data=request.additionalData or {},
                revision_number=request.revisionNumber,
                status=request.status
            )
            session.add(quotation)
            print(f"✓ Created new quotation: {request.fullQuoteNumber} (quotation_number: {quotation.quotation_number}, revision_number: {quotation.revision_number})")
        
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
async def get_quotation(quote_number: str, revision: str = "0", session: Session = Depends(get_session)):
    """
    Retrieve quotation form data by quotation number and revision
    Query parameters: 
    - quote_number: quotation number (e.g., "3024")
    - revision: revision number (default "0")
    """
    try:
        print(f"\n{'='*60}")
        print(f"RETRIEVING QUOTATION FROM DATABASE")
        print(f"{'='*60}")
        print(f"Quotation Number: {quote_number}")
        print(f"Revision: {revision}")
        
        # Convert revision to integer
        try:
            revision_int = int(revision)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid revision number: {revision}")
        
        # Query quotation with all related data using quotation_number AND revision_number
        statement = select(QuotationWebpageInputDetailsSave).where(
            QuotationWebpageInputDetailsSave.quotation_number == quote_number,
            QuotationWebpageInputDetailsSave.revision_number == revision_int
        )
        quotation = session.exec(statement).first()
        
        if not quotation:
            raise HTTPException(status_code=404, detail=f"Quotation not found: {quote_number}-{revision}")
        
        # Get related data
        company = session.get(CompanyDetails, quotation.company_id)
        recipient = session.get(RecipientDetails, quotation.recipient_id)
        sales_person = session.get(SalesDetails, quotation.sales_person_id)
        project_manager = None
        if quotation.project_manager_id:
            project_manager = session.get(ProjectManagerDetails, quotation.project_manager_id)
        
        print(f"✓ Found company: {company.full_name if company else 'None'} (ID: {quotation.company_id})")
        
        # Get contractual terms using the full_main_quote_number from the found quotation
        statement_terms = select(ContractualTermsSpecifications).where(
            ContractualTermsSpecifications.full_main_quote_number == quotation.full_main_quote_number
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


@app.get("/api/quotations")
async def search_quotations(
    recipient_name: Optional[str] = None,
    company_name: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    quote_company: Optional[str] = None,
    quote_yearmonth: Optional[str] = None,
    quote_series: Optional[str] = None,
    quote_number: Optional[str] = None,
    generated_by: Optional[str] = None,
    session: Session = Depends(get_session)
):
    """
    Search quotations based on filters
    Query parameters:
    - recipient_name: Filter by recipient name (partial match)
    - company_name: Filter by company name (partial match)
    - date_from: Filter by start date (YYYY-MM-DD format)
    - date_to: Filter by end date (YYYY-MM-DD format)
    - quote_company: Filter by company code in quote number (e.g., GRPPT, PIPECO)
    - quote_yearmonth: Filter by year/month in quote number (e.g., 2512)
    - quote_series: Filter by series in quote number (e.g., MM, JB)
    - quote_number: Filter by quotation number (e.g., 0324)
    - generated_by: Filter by generated by name (partial match)
    """
    try:
        print(f"\n{'='*60}")
        print(f"SEARCHING QUOTATIONS")
        print(f"{'='*60}")
        print(f"Filters: recipient_name={recipient_name}, company_name={company_name}")
        print(f"  date_from={date_from}, date_to={date_to}")
        print(f"  quote_company={quote_company}, quote_yearmonth={quote_yearmonth}, quote_series={quote_series}, quote_number={quote_number}")
        print(f"  generated_by={generated_by}")
        
        # Build query
        statement = select(QuotationWebpageInputDetailsSave)
        
        # Apply filters - we'll filter after fetching to avoid complex joins
        quotations = session.exec(statement).all()
        
        # Filter in Python for simplicity
        filtered_quotations = []
        for quotation in quotations:
            # Get recipient for filtering
            recipient = session.get(RecipientDetails, quotation.recipient_id) if quotation.recipient_id else None
            
            # Apply filters
            if recipient_name and recipient:
                if recipient_name.lower() not in recipient.recipient_name.lower():
                    continue
            elif recipient_name:
                continue
            
            if company_name and recipient:
                if company_name.lower() not in (recipient.to_company_name or "").lower():
                    continue
            elif company_name:
                continue
            
            # Generated By filtering
            if generated_by:
                if generated_by.lower() not in (quotation.generated_by or "").lower():
                    continue
            
            # Date range filtering
            if date_from or date_to:
                from datetime import datetime
                try:
                    if date_from:
                        from_date = datetime.strptime(date_from, "%Y-%m-%d").date()
                        if quotation.quotation_date < from_date:
                            continue
                    if date_to:
                        to_date = datetime.strptime(date_to, "%Y-%m-%d").date()
                        if quotation.quotation_date > to_date:
                            continue
                except ValueError:
                    raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
            
            # Quote number component filtering - each component filters independently
            # full_main_quote_number format: GRPPT/2512/MM/0324 or GRPPT/2512/MM/0324-R1
            if quote_company or quote_yearmonth or quote_series or quote_number:
                full_quote = quotation.full_main_quote_number or ""
                
                # Split by / to get components
                quote_parts = full_quote.split('/')
                
                # Check each component independently
                if quote_company:
                    # First component is company code
                    if len(quote_parts) < 1 or quote_company.upper() not in quote_parts[0].upper():
                        continue
                
                if quote_yearmonth:
                    # Second component is year/month
                    if len(quote_parts) < 2 or quote_yearmonth not in quote_parts[1]:
                        continue
                
                if quote_series:
                    # Third component is series (person code)
                    if len(quote_parts) < 3 or quote_series.upper() not in quote_parts[2].upper():
                        continue
                
                if quote_number:
                    # Fourth component is the number (may have -R suffix)
                    if len(quote_parts) < 4:
                        continue
                    # Remove revision suffix if present
                    number_part = quote_parts[3].split('-')[0]
                    if quote_number not in number_part:
                        continue
            
            filtered_quotations.append(quotation)
        
        # Build response
        result = []
        for quotation in filtered_quotations:
            # Get related data
            recipient = session.get(RecipientDetails, quotation.recipient_id)
            company = session.get(CompanyDetails, quotation.company_id)
            
            result.append({
                "id": quotation.id,
                "quotation_number": quotation.quotation_number,
                "full_main_quote_number": quotation.full_main_quote_number,
                "revision_number": quotation.revision_number,
                "recipient_name": recipient.recipient_name if recipient else "",
                "recipient_company": recipient.to_company_name if recipient else "",
                "quotation_date": quotation.quotation_date.isoformat(),
                "subject": quotation.subject,
                "from_company": company.full_name if company else "",
                "generated_by": quotation.generated_by or "",
                "status": quotation.status
            })
        
        print(f"✓ Found {len(result)} quotation(s)")
        print(f"{'='*60}\n")
        
        return {"quotations": result, "count": len(result)}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"⚠ Error searching quotations: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error searching quotations: {str(e)}")


@app.get("/api/quotations/{quotation_id}")
async def get_quotation_by_id(quotation_id: int, session: Session = Depends(get_session)):
    """
    Get full quotation details by ID
    """
    try:
        print(f"\n{'='*60}")
        print(f"RETRIEVING QUOTATION BY ID")
        print(f"{'='*60}")
        print(f"Quotation ID: {quotation_id}")
        
        # Get quotation
        quotation = session.get(QuotationWebpageInputDetailsSave, quotation_id)
        
        if not quotation:
            raise HTTPException(status_code=404, detail=f"Quotation not found with ID: {quotation_id}")
        
        # Get related data
        company = session.get(CompanyDetails, quotation.company_id)
        recipient = session.get(RecipientDetails, quotation.recipient_id)
        sales_person = session.get(SalesDetails, quotation.sales_person_id)
        project_manager = None
        if quotation.project_manager_id:
            project_manager = session.get(ProjectManagerDetails, quotation.project_manager_id)
        
        # Get contractual terms
        statement_terms = select(ContractualTermsSpecifications).where(
            ContractualTermsSpecifications.full_main_quote_number == quotation.full_main_quote_number
        )
        contractual_terms = session.exec(statement_terms).first()
        
        # Map database columns to frontend terms
        terms_data = {}
        if contractual_terms:
            db_to_frontend_mapping = {
                'note': 'note',
                'material_specifications': 'materialSpecification',
                'warranty_conditions': 'warrantyExclusions',
                'terms_and_conditions': 'termsConditions',
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
            "quotation": {
                "id": quotation.id,
                "quotation_number": quotation.quotation_number,
                "full_main_quote_number": quotation.full_main_quote_number,
                "revision_number": quotation.revision_number,
                "from_company": company.full_name if company else "",
                "recipient_title": "Mr.",
                "recipient_name": recipient.recipient_name if recipient else "",
                "role": recipient.role_of_recipient if recipient else "",
                "recipient_company": recipient.to_company_name if recipient else "",
                "location": recipient.to_company_location if recipient else "",
                "phone_number": recipient.phone_number if recipient else "",
                "email": recipient.email if recipient else "",
                "quotation_date": quotation.quotation_date.strftime("%d/%m/%y"),
                "quotation_from": "Sales" if sales_person else "Office",
                "sales_person_name": sales_person.sales_person_name if sales_person else "",
                "office_person_name": project_manager.manager_name if project_manager else "",
                "subject": quotation.subject,
                "project_location": quotation.project_location,
                "generated_by": quotation.generated_by or "",
                "status": quotation.status
            },
            "tanks": quotation.tanks_data,
            "terms": terms_data
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
        raise HTTPException(status_code=500, detail=f"Error retrieving quotation by ID: {str(e)}")


@app.put("/api/quotations/{quotation_id}")
async def update_quotation_revision(quotation_id: int, request: UpdateRevisionRequest, session: Session = Depends(get_session)):
    """
    Update the revision number of a quotation
    Note: This creates a new quotation entry with the new revision number
    """
    try:
        print(f"\n{'='*60}")
        print(f"UPDATING QUOTATION REVISION")
        print(f"{'='*60}")
        print(f"Quotation ID: {quotation_id}")
        print(f"New Revision Number: {request.revision_number}")
        
        # Get the original quotation
        original_quotation = session.get(QuotationWebpageInputDetailsSave, quotation_id)
        
        if not original_quotation:
            raise HTTPException(status_code=404, detail=f"Quotation not found with ID: {quotation_id}")
        
        # Check if a quotation with this quotation_number and revision_number already exists
        statement = select(QuotationWebpageInputDetailsSave).where(
            QuotationWebpageInputDetailsSave.quotation_number == original_quotation.quotation_number,
            QuotationWebpageInputDetailsSave.revision_number == request.revision_number
        )
        existing = session.exec(statement).first()
        
        if existing and existing.id != quotation_id:
            raise HTTPException(status_code=400, detail=f"Quotation with revision {request.revision_number} already exists")
        
        # Create new quotation entry with updated revision
        new_quotation = QuotationWebpageInputDetailsSave(
            quotation_number=original_quotation.quotation_number,
            revision_number=request.revision_number,
            full_main_quote_number=f"{original_quotation.quotation_number}-R{request.revision_number}" if request.revision_number > 0 else original_quotation.quotation_number,
            final_doc_file_path=None,  # Will be updated when document is generated
            company_id=original_quotation.company_id,
            recipient_id=original_quotation.recipient_id,
            quotation_date=original_quotation.quotation_date,
            sales_person_id=original_quotation.sales_person_id,
            project_manager_id=original_quotation.project_manager_id,
            subject=original_quotation.subject,
            project_location=original_quotation.project_location,
            tanks_data=original_quotation.tanks_data,
            form_options=original_quotation.form_options,
            additional_data=original_quotation.additional_data,
            status=original_quotation.status
        )
        
        session.add(new_quotation)
        session.commit()
        session.refresh(new_quotation)
        
        print(f"✓ Created new quotation with revision {request.revision_number}")
        print(f"  New ID: {new_quotation.id}")
        print(f"{'='*60}\n")
        
        return {
            "id": new_quotation.id,
            "quotation_number": new_quotation.quotation_number,
            "revision_number": new_quotation.revision_number,
            "full_main_quote_number": new_quotation.full_main_quote_number
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"⚠ Error updating quotation revision: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error updating quotation revision: {str(e)}")


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
