"""SQLModel database models for quotation system"""
from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy import JSON
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from decimal import Decimal


class Quotation(SQLModel, table=True):
    """Quotation main table"""
    __tablename__ = "quotations"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    from_company: str
    recipient_title: str
    recipient_name: str
    recipient_role: Optional[str] = None
    recipient_company: str
    recipient_location: str
    recipient_phone: Optional[str] = None
    recipient_email: Optional[str] = None
    quotation_date: str
    quotation_from: str
    sales_person_name: Optional[str] = None
    sales_person_code: Optional[str] = None
    quotation_number: str = Field(index=True)
    revision_number: int = Field(default=0)
    subject: str
    project_location: str
    gallon_type: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationship
    tanks: List["QuotationTank"] = Relationship(back_populates="quotation")


class QuotationTank(SQLModel, table=True):
    """Quotation tanks table"""
    __tablename__ = "quotation_tanks"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    quotation_id: int = Field(foreign_key="quotations.id")
    tank_number: int
    tank_name: str
    quantity: int
    has_partition: bool = Field(default=False)
    tank_type: str
    length: str
    width: str
    height: str
    unit: str
    unit_price: str
    need_freeboard: bool = Field(default=False)
    freeboard_size: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationship
    quotation: Optional[Quotation] = Relationship(back_populates="tanks")


class SalesDetails(SQLModel, table=True):
    """Sales person details table"""
    __tablename__ = "sales_details"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    sales_person_name: str
    code: str = Field(unique=True)
    sign_path: Optional[str] = None
    designation: Optional[str] = None
    phone_number: Optional[str] = None
    email_name: Optional[str] = None
    created_time: datetime = Field(default_factory=datetime.utcnow)
    last_updated_time: datetime = Field(default_factory=datetime.utcnow)


class ProjectManagerDetails(SQLModel, table=True):
    """Project manager details table"""
    __tablename__ = "project_manager_details"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    manager_name: str
    code: str = Field(unique=True)
    sign_path: Optional[str] = None
    designation: Optional[str] = None
    phone_number: Optional[str] = None
    email_name: Optional[str] = None
    created_time: datetime = Field(default_factory=datetime.utcnow)
    last_updated_time: datetime = Field(default_factory=datetime.utcnow)


class CompanyDetails(SQLModel, table=True):
    """Company details table"""
    __tablename__ = "company_details"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    company_name: str
    full_name: str
    code: str = Field(unique=True)
    seal_path: Optional[str] = None
    template_path: Optional[str] = None
    company_domain: Optional[str] = None
    company_storage_path: Optional[str] = None
    created_time: datetime = Field(default_factory=datetime.utcnow)
    last_updated_time: datetime = Field(default_factory=datetime.utcnow)


class RecipientDetails(SQLModel, table=True):
    """Recipient details table"""
    __tablename__ = "recipient_details"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    recipient_name: str
    role_of_recipient: Optional[str] = None
    to_company_name: Optional[str] = None
    to_company_location: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    created_time: datetime = Field(default_factory=datetime.utcnow)
    last_updated_time: datetime = Field(default_factory=datetime.utcnow)


class QuotationWebpageInputDetailsSave(SQLModel, table=True):
    """Main quotation webpage input details save table"""
    __tablename__ = "quotation_webpage_input_details_save"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    quotation_number: str
    full_main_quote_number: str = Field(unique=True, index=True)
    final_doc_file_path: Optional[str] = None
    company_id: int = Field(foreign_key="company_details.id")
    recipient_id: int = Field(foreign_key="recipient_details.id")
    sales_person_id: int = Field(foreign_key="sales_details.id")
    project_manager_id: Optional[int] = Field(default=None, foreign_key="project_manager_details.id")
    quotation_date: date
    subject: Optional[str] = None
    project_location: Optional[str] = None
    tanks_data: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    form_options: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    additional_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    subtotal: Optional[Decimal] = None
    discount_percentage: Optional[Decimal] = Field(default=Decimal("0"))
    discount_amount: Optional[Decimal] = Field(default=Decimal("0"))
    tax_percentage: Optional[Decimal] = Field(default=Decimal("0"))
    tax_amount: Optional[Decimal] = Field(default=Decimal("0"))
    total_amount: Optional[Decimal] = None
    status: str = Field(default="draft")
    revision_number: int = Field(default=0)
    revision: Optional[str] = None
    generated_by: Optional[str] = None
    created_time: datetime = Field(default_factory=datetime.utcnow)
    last_updated_time: datetime = Field(default_factory=datetime.utcnow)


class ContractualTermsSpecifications(SQLModel, table=True):
    """Contractual terms and specifications table"""
    __tablename__ = "contractual_terms_specifications"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    full_main_quote_number: str = Field(unique=True, index=True)
    note: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    material_specifications: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    warranty_conditions: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    terms_and_conditions: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    supplier_scope: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    customer_scope: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    note_second: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    scope_of_work: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    work_excluded: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    created_time: datetime = Field(default_factory=datetime.utcnow)
    last_updated_time: datetime = Field(default_factory=datetime.utcnow)
