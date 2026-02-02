"""SQLModel database models for quotation system"""
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime


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
