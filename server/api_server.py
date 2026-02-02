from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import sys
from datetime import datetime
from pathlib import Path
from sqlmodel import Session, select

# Import the generator class
from user_input_tank_generator import TankInvoiceGenerator
from database import create_db_and_tables, get_session, engine
from models import Quotation, QuotationTank

app = FastAPI()

# Create database tables on startup
@app.on_event("startup")
def on_startup():
    create_db_and_tables()

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
            "COLEX TANKS TRADING L.L.C": "COL",
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
        for tank_data in request.tanks:
            for option in tank_data.options:
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
                    "total_price": float(option.quantity) * (float(option.unitPrice) if option.unitPrice else 0.0)
                }
                generator.tanks.append(tank)
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
            'supplier_scope': request.terms['supplierScope'].action == 'yes' if 'supplierScope' in request.terms else False,
            'customer_scope': request.terms['customerScope'].action == 'yes' if 'customerScope' in request.terms else False,
            'final_note': False,  # Can be enabled if needed
            'thank_you': False,
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
            import pandas as pd
            
            # Map frontend values to backend signature type
            # User's requirement: Sales → 'o' (office in Python), Office → 's' (sales in Python)
            sig_type = 'o' if request.quotationFrom == 'Sales' else 's'
            
            left_name = ""
            left_title = ""
            left_mobile = ""
            left_email = ""
            right_name = ""
            right_title = ""
            right_mobile = ""
            right_email = ""
            signature_image = ""
            seal_image = ""
            
            try:
                if sig_type == 's':
                    # Frontend "Office" → Backend reads from sales_person_details.xlsx
                    sales_df = pd.read_excel('sales_person_details.xlsx')
                    
                    # Find the person by name in salesPersonName field
                    if request.salesPersonName:
                        person_name = request.salesPersonName.split('(')[0].strip() if '(' in request.salesPersonName else request.salesPersonName.strip()
                        person_row = sales_df[sales_df['NAME'].str.strip() == person_name]
                        
                        if not person_row.empty:
                            selected_row = person_row.iloc[0]
                            
                            # Determine email column based on template
                            if template_filename.lower().endswith("template_grp.docx"):
                                email_col = 'EMAIL-GRPTANKS'
                            elif template_filename.lower().endswith("template_pipeco.docx"):
                                email_col = 'EMAIL-PIPECO'
                            elif template_filename.lower().endswith("template_colex.docx"):
                                email_col = 'EMAIL-COLEX'
                            else:
                                email_col = 'EMAIL-GRPTANKS'
                            
                            left_name = str(selected_row['NAME'])
                            left_title = str(selected_row['DESIGNATION']) if 'DESIGNATION' in sales_df.columns else "Sales Executive"
                            left_mobile = str(selected_row['MOB']) if 'MOB' in sales_df.columns else ""
                            left_email = str(selected_row[email_col]) if email_col in sales_df.columns else ""
                            
                            # Get CODE for signature images
                            if 'CODE' in sales_df.columns:
                                code = str(selected_row['CODE'])
                                # Look for signature image
                                for ext in ['.png', '.jpg', '.jpeg']:
                                    sign_path = f"signs&seals/{code}_sign{ext}"
                                    if os.path.exists(sign_path):
                                        signature_image = sign_path
                                        break
                                # Look for seal image
                                for ext in ['.png', '.jpg', '.jpeg']:
                                    seal_path = f"signs&seals/{code}_seal{ext}"
                                    if os.path.exists(seal_path):
                                        seal_image = seal_path
                                        break
                    
                    # Right signatory from Project_manager_details.xlsx
                    pm_df = pd.read_excel('Project_manager_details.xlsx')
                    if len(pm_df) > 0:
                        selected_pm = pm_df.iloc[0]  # Use first project manager
                        
                        # Determine email column for project manager
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
                    
                else:  # sig_type == 'o'
                    # Frontend "Sales" → Backend reads from Project_manager_details.xlsx
                    pm_df = pd.read_excel('Project_manager_details.xlsx')
                    
                    # Find the person by name in salesPersonName field
                    if request.salesPersonName:
                        person_name = request.salesPersonName.split('(')[0].strip() if '(' in request.salesPersonName else request.salesPersonName.strip()
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
                            # Look for signature image
                            for ext in ['.png', '.jpg', '.jpeg']:
                                sign_path = f"signs&seals/{code}_sign{ext}"
                                if os.path.exists(sign_path):
                                    signature_image = sign_path
                                    break
                            # Look for seal image
                            for ext in ['.png', '.jpg', '.jpeg']:
                                seal_path = f"signs&seals/{code}_seal{ext}"
                                if os.path.exists(seal_path):
                                    seal_image = seal_path
                                    break
                    
                    # No right signatory for office
                    right_name = ""
                    right_title = ""
                    right_mobile = ""
                    right_email = ""
                    
            except Exception as e:
                print(f"⚠ Error reading Excel files for signature: {e}")
                # Fallback to extracting name from salesPersonName
                if request.salesPersonName:
                    left_name = request.salesPersonName.split('(')[0].strip()
                    left_title = 'Sales Executive' if request.quotationFrom == 'Sales' else 'Manager - Projects'
            
            generator.section_content['signature'] = {
                'left_name': left_name,
                'left_title': left_title,
                'left_mobile': left_mobile,
                'left_email': left_email,
                'right_name': right_name,
                'right_title': right_title,
                'right_mobile': right_mobile,
                'right_email': right_email,
                'signature_image': signature_image,
                'seal_image': seal_image,
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


# ==================== QUOTATION DATABASE ENDPOINTS ====================

@app.post("/api/quotations")
async def create_quotation(
    request: QuotationRequest,
    session: Session = Depends(get_session)
):
    """Save quotation data to database"""
    try:
        # Create quotation record
        quotation = Quotation(
            from_company=request.fromCompany,
            recipient_title=request.recipientTitle,
            recipient_name=request.recipientName,
            recipient_role=request.role or "",
            recipient_company=request.companyName,
            recipient_location=request.location or "",
            recipient_phone=request.phoneNumber or "",
            recipient_email=request.email or "",
            quotation_date=request.quotationDate,
            quotation_from=request.quotationFrom,
            sales_person_name=request.salesPersonName or "",
            sales_person_code=request.salesPersonName.split('(')[1].split(')')[0] if request.salesPersonName and '(' in request.salesPersonName else "",
            quotation_number=request.quotationNumber,
            revision_number=int(request.revisionNumber) if request.revisionEnabled and request.revisionNumber else 0,
            subject=request.subject,
            project_location=request.projectLocation,
            gallon_type=request.gallonType
        )
        
        session.add(quotation)
        session.commit()
        session.refresh(quotation)
        
        # Save tanks data
        for tank_data in request.tanks:
            for option in tank_data.options:
                tank = QuotationTank(
                    quotation_id=quotation.id,
                    tank_number=tank_data.tankNumber,
                    tank_name=option.tankName,
                    quantity=option.quantity,
                    has_partition=option.hasPartition,
                    tank_type=option.tankType,
                    length=option.length,
                    width=option.width,
                    height=option.height,
                    unit=option.unit,
                    unit_price=option.unitPrice,
                    need_freeboard=option.needFreeBoard if option.needFreeBoard else False,
                    freeboard_size=option.freeBoardSize if option.freeBoardSize else None
                )
                session.add(tank)
        
        session.commit()
        
        return {"id": quotation.id, "message": "Quotation saved successfully"}
    
    except Exception as e:
        print(f"Error saving quotation: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error saving quotation: {str(e)}")


@app.get("/api/quotations")
async def get_quotations(
    recipient_name: Optional[str] = None,
    company_name: Optional[str] = None,
    date: Optional[str] = None,
    quotation_number: Optional[str] = None,
    session: Session = Depends(get_session)
):
    """Search and retrieve quotations with filters"""
    try:
        # Build query
        statement = select(Quotation)
        
        # Apply filters
        if recipient_name:
            statement = statement.where(Quotation.recipient_name.contains(recipient_name))
        
        if company_name:
            statement = statement.where(Quotation.recipient_company.contains(company_name))
        
        if date:
            statement = statement.where(Quotation.quotation_date == date)
        
        if quotation_number:
            statement = statement.where(Quotation.quotation_number.contains(quotation_number))
        
        # Execute query with ordering
        statement = statement.order_by(Quotation.created_at.desc())
        results = session.exec(statement).all()
        
        # Convert to dict
        quotations = []
        for q in results:
            quotations.append({
                "id": q.id,
                "from_company": q.from_company,
                "recipient_title": q.recipient_title,
                "recipient_name": q.recipient_name,
                "recipient_role": q.recipient_role,
                "recipient_company": q.recipient_company,
                "recipient_location": q.recipient_location,
                "recipient_phone": q.recipient_phone,
                "recipient_email": q.recipient_email,
                "quotation_date": q.quotation_date,
                "quotation_from": q.quotation_from,
                "sales_person_name": q.sales_person_name,
                "sales_person_code": q.sales_person_code,
                "quotation_number": q.quotation_number,
                "revision_number": q.revision_number,
                "subject": q.subject,
                "project_location": q.project_location,
                "gallon_type": q.gallon_type,
                "created_at": q.created_at.isoformat(),
                "updated_at": q.updated_at.isoformat()
            })
        
        return {"quotations": quotations, "count": len(quotations)}
    
    except Exception as e:
        print(f"Error fetching quotations: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching quotations: {str(e)}")


@app.get("/api/quotations/{quotation_id}")
async def get_quotation_by_id(
    quotation_id: int,
    session: Session = Depends(get_session)
):
    """Get a specific quotation with its tanks"""
    try:
        # Get quotation
        quotation = session.get(Quotation, quotation_id)
        if not quotation:
            raise HTTPException(status_code=404, detail="Quotation not found")
        
        # Get tanks
        statement = select(QuotationTank).where(QuotationTank.quotation_id == quotation_id)
        tanks = session.exec(statement).all()
        
        # Format response
        return {
            "quotation": {
                "id": quotation.id,
                "from_company": quotation.from_company,
                "recipient_title": quotation.recipient_title,
                "recipient_name": quotation.recipient_name,
                "recipient_role": quotation.recipient_role,
                "recipient_company": quotation.recipient_company,
                "recipient_location": quotation.recipient_location,
                "recipient_phone": quotation.recipient_phone,
                "recipient_email": quotation.recipient_email,
                "quotation_date": quotation.quotation_date,
                "quotation_from": quotation.quotation_from,
                "sales_person_name": quotation.sales_person_name,
                "sales_person_code": quotation.sales_person_code,
                "quotation_number": quotation.quotation_number,
                "revision_number": quotation.revision_number,
                "subject": quotation.subject,
                "project_location": quotation.project_location,
                "gallon_type": quotation.gallon_type,
                "created_at": quotation.created_at.isoformat(),
                "updated_at": quotation.updated_at.isoformat()
            },
            "tanks": [
                {
                    "id": tank.id,
                    "tank_number": tank.tank_number,
                    "tank_name": tank.tank_name,
                    "quantity": tank.quantity,
                    "has_partition": tank.has_partition,
                    "tank_type": tank.tank_type,
                    "length": tank.length,
                    "width": tank.width,
                    "height": tank.height,
                    "unit": tank.unit,
                    "unit_price": tank.unit_price,
                    "need_freeboard": tank.need_freeboard,
                    "freeboard_size": tank.freeboard_size
                }
                for tank in tanks
            ]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching quotation: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching quotation: {str(e)}")


@app.put("/api/quotations/{quotation_id}")
async def update_quotation_revision(
    quotation_id: int,
    revision_number: int,
    session: Session = Depends(get_session)
):
    """Update quotation revision number"""
    try:
        quotation = session.get(Quotation, quotation_id)
        if not quotation:
            raise HTTPException(status_code=404, detail="Quotation not found")
        
        quotation.revision_number = revision_number
        quotation.updated_at = datetime.utcnow()
        session.add(quotation)
        session.commit()
        session.refresh(quotation)
        
        return {
            "id": quotation.id,
            "quotation_number": quotation.quotation_number,
            "revision_number": quotation.revision_number,
            "message": "Revision updated successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating quotation: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error updating quotation: {str(e)}")


# ==================== END QUOTATION DATABASE ENDPOINTS ====================


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
