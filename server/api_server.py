from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os

import os
import sys
from datetime import datetime
from pathlib import Path
import pandas as pd
# Import the generator class
from user_input_tank_generator import TankInvoiceGenerator

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
    officePersonName: Optional[str] = ""
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
        script_dir = os.path.dirname(__file__)
        template_path = os.path.join(script_dir, template_filename)
        
        # Initialize generator
        generator = TankInvoiceGenerator(template_path=template_path)
        
        # Construct quotation number in format: {CompanyCode}/{YYMM}/{CODE}/{Number}
        company_code_map = {
            "GRP TANKS TRADING L.L.C": "GRPT",
            "GRP PIPECO TANKS TRADING L.L.C": "GRPPT",
            "COLEX TANKS TRADING L.L.C": "CLX",
        }
        company_code = company_code_map.get(request.fromCompany, "GRPT")
        
        # Extract YYMM from quotation date (format: DD/MM/YY)
        date_parts = request.quotationDate.split('/')
        yymm = f"{date_parts[2]}{date_parts[1]}" if len(date_parts) == 3 else "0000"
        
        # Read Excel files once for efficiency
        sales_df = None
        pm_df = None
        person_code = ""
        
        try:
            if request.quotationFrom == 'Sales' and request.salesPersonName:
                sales_df = pd.read_excel(os.path.join(script_dir, 'sales_person_details.xlsx'))
                person_name = request.salesPersonName.split('(')[0].strip()
                person_row = sales_df[sales_df['NAME'].str.strip() == person_name]
                if not person_row.empty:
                    person_code = str(person_row.iloc[0]['CODE']).strip()
            elif request.officePersonName:
                pm_df = pd.read_excel(os.path.join(script_dir, 'Project_manager_details.xlsx'))
                person_name = request.officePersonName.split('(')[0].strip()
                person_row = pm_df[pm_df['NAME'].str.strip() == person_name]
                if not person_row.empty:
                    person_code = str(person_row.iloc[0]['CODE']).strip()
        except Exception as e:
            print(f"⚠ Error fetching CODE from Excel: {e}")
        
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
            
            try:
                if sig_type == 's':  # UI "Sales"
                    # Reuse sales_df if already loaded, otherwise load it
                    if sales_df is None:
                        sales_df = pd.read_excel(os.path.join(script_dir, 'sales_person_details.xlsx'))
                    
                    if request.salesPersonName:
                        person_name = request.salesPersonName.split('(')[0].strip() if '(' in request.salesPersonName else request.salesPersonName.strip()
                        person_row = sales_df[sales_df['NAME'].str.strip() == person_name]
                        
                        if not person_row.empty:
                            selected_sales = person_row.iloc[0]
                            
                            # Determine email column based on template
                            if template_filename.lower().endswith("template_grp.docx"):
                                email_col = 'EMAIL-GRPTANKS'
                            elif template_filename.lower().endswith("template_pipeco.docx"):
                                email_col = 'EMAIL-PIPECO'
                            elif template_filename.lower().endswith("template_colex.docx"):
                                email_col = 'EMAIL-COLEX'
                            else:
                                email_col = 'EMAIL-GRPTANKS'
                            
                            left_name = str(selected_sales['NAME'])
                            left_title = str(selected_sales['DESIGNATION']) if 'DESIGNATION' in sales_df.columns else "Sales Executive"
                            left_mobile = str(selected_sales['MOB']) if 'MOB' in sales_df.columns else ""
                            left_email = str(selected_sales[email_col]) if email_col in sales_df.columns else ""
                            
                            # Get CODE for signature images
                            if 'CODE' in sales_df.columns:
                                code = str(selected_sales['CODE'])
                                signs_dir = os.path.join(script_dir, 'signs&seals')
                                # Look for signature image
                                for ext in ['.png', '.jpg', '.jpeg']:
                                    if not signature_image:
                                        sign_path = os.path.join(signs_dir, f"{code}_sign{ext}")
                                        if os.path.exists(sign_path):
                                            signature_image = sign_path
                    
                    # Right side: Office Person - reuse pm_df if already loaded
                    if pm_df is None:
                        pm_df = pd.read_excel(os.path.join(script_dir, 'Project_manager_details.xlsx'))
                    
                    if request.officePersonName:
                        person_name = request.officePersonName.split('(')[0].strip() if '(' in request.officePersonName else request.officePersonName.strip()
                        person_row = pm_df[pm_df['NAME'].str.strip() == person_name]
                        
                        if not person_row.empty:
                            selected_pm = person_row.iloc[0]
                        else:
                            # Use first project manager as fallback
                            selected_pm = pm_df.iloc[0] if len(pm_df) > 0 else None
                    else:
                        # Use first project manager as default
                        selected_pm = pm_df.iloc[0] if len(pm_df) > 0 else None
                    
                    if selected_pm is not None:
                        # Determine email column based on template
                        if template_filename.lower().endswith("template_grp.docx"):
                            pm_email_col = 'EMAIL-GRPTANKS'
                        elif template_filename.lower().endswith("template_pipeco.docx"):
                            pm_email_col = 'EMAIL-PIPECO'
                        elif template_filename.lower().endswith("template_colex.docx"):
                            pm_email_col = 'EMAIL-COLEX'
                        else:
                            pm_email_col = 'EMAIL-GRPTANKS'
                        
                        right_name = str(selected_pm['NAME'])
                        right_title = str(selected_pm['DESIGNATION']) if 'DESIGNATION' in pm_df.columns else "Manager - Projects"
                        right_mobile = str(selected_pm['MOB']) if 'MOB' in pm_df.columns else ""
                        right_email = str(selected_pm[pm_email_col]) if pm_email_col in pm_df.columns else ""
                    
                else:  # sig_type == 'o', UI "Office"
                    # Reuse pm_df if already loaded
                    if pm_df is None:
                        pm_df = pd.read_excel(os.path.join(script_dir, 'Project_manager_details.xlsx'))
                    
                    if request.officePersonName:
                        person_name = request.officePersonName.split('(')[0].strip() if '(' in request.officePersonName else request.officePersonName.strip()
                        person_row = pm_df[pm_df['NAME'].str.strip() == person_name]
                        
                        if not person_row.empty:
                            selected_pm = person_row.iloc[0]
                        else:
                            # Use first project manager as fallback
                            selected_pm = pm_df.iloc[0] if len(pm_df) > 0 else None
                    else:
                        # Use first project manager as default
                        selected_pm = pm_df.iloc[0] if len(pm_df) > 0 else None
                    
                    if selected_pm is not None:
                        # Determine email column
                        if template_filename.lower().endswith("template_grp.docx"):
                            pm_email_col = 'EMAIL-GRPTANKS'
                        elif template_filename.lower().endswith("template_pipeco.docx"):
                            pm_email_col = 'EMAIL-PIPECO'
                        elif template_filename.lower().endswith("template_colex.docx"):
                            pm_email_col = 'EMAIL-COLEX'
                        else:
                            pm_email_col = 'EMAIL-GRPTANKS'
                        
                        left_name = str(selected_pm['NAME'])
                        left_title = str(selected_pm['DESIGNATION']) if 'DESIGNATION' in pm_df.columns else "Manager - Projects"
                        left_mobile = str(selected_pm['MOB']) if 'MOB' in pm_df.columns else ""
                        left_email = str(selected_pm[pm_email_col]) if pm_email_col in pm_df.columns else ""
                        
                        # Get CODE for signature images
                        if 'CODE' in pm_df.columns:
                            code = str(selected_pm['CODE'])
                            signs_dir = os.path.join(script_dir, 'signs&seals')
                            # Look for signature image
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
                print(f"⚠ Error reading Excel files for signature: {e}")
                # Fallback to extracting name from provided fields
                if request.quotationFrom == 'Sales' and request.officePersonName:
                    left_name = request.officePersonName.split('(')[0].strip()
                    left_title = 'Manager - Projects'
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


@app.get("/api/person-names/{person_type}")
async def get_person_names(person_type: str):
    """
    Get person names from Excel files based on person type.
    person_type can be 'sales' or 'office'
    """
    try:
        if person_type == "sales":
            file_path = os.path.join(os.path.dirname(__file__), "sales_person_details.xlsx")
        elif person_type == "office":
            file_path = os.path.join(os.path.dirname(__file__), "Project_manager_details.xlsx")
        else:
            raise HTTPException(status_code=400, detail="Invalid person type. Use 'sales' or 'office'")
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
        
        # Read Excel file
        df = pd.read_excel(file_path)
        
        # Check if NAME column exists
        if 'NAME' not in df.columns:
            raise HTTPException(status_code=500, detail="NAME column not found in Excel file")
        
        # Get names and remove any NaN values
        names = df['NAME'].dropna().tolist()
        
        return {"names": names}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error reading person names: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error reading person names: {str(e)}")


@app.get("/api/person-code")
async def get_person_code(name: str, type: str):
    """
    Get CODE from Excel file based on person name and type.
    type can be 'sales' or 'office'
    name should be the person's name
    """
    try:
        print(f"\n{'='*60}")
        print(f"FETCHING CODE")
        print(f"{'='*60}")
        print(f"Name: {name}")
        print(f"Type: {type}")
        
        if type == "sales":
            file_path = os.path.join(os.path.dirname(__file__), "sales_person_details.xlsx")
        elif type == "office":
            file_path = os.path.join(os.path.dirname(__file__), "Project_manager_details.xlsx")
        else:
            raise HTTPException(status_code=400, detail="Invalid type. Use 'sales' or 'office'")
        
        if not os.path.exists(file_path):
            print(f"⚠ File not found: {file_path}")
            raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
        
        # Read Excel file
        df = pd.read_excel(file_path)
        print(f"Excel columns: {df.columns.tolist()}")
        
        # Check if required columns exist
        if 'NAME' not in df.columns or 'CODE' not in df.columns:
            print(f"⚠ Missing columns. Available: {df.columns.tolist()}")
            raise HTTPException(status_code=500, detail="NAME or CODE column not found in Excel file")
        
        # Extract name without (CODE) suffix if present
        clean_name = name.split('(')[0].strip()
        print(f"Clean name: '{clean_name}'")
        
        # Show all names in Excel for debugging
        print(f"Names in Excel: {df['NAME'].tolist()}")
        
        # Find the person by name
        person_row = df[df['NAME'].str.strip() == clean_name]
        
        if person_row.empty:
            print(f"⚠ Person not found: '{clean_name}'")
            print(f"Available names: {df['NAME'].str.strip().tolist()}")
            return {"code": "XX"}  # Default code
        
        # Get CODE
        code = str(person_row.iloc[0]['CODE']).strip()
        print(f"✓ Found CODE: {code}")
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
