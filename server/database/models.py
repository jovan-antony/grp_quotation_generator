"""
SQLAlchemy ORM Models for GRP Quotation Generator
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DECIMAL, Date, TIMESTAMP, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import JSONB, INET
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.config import Base

class Company(Base):
    __tablename__ = 'companies'
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    full_name = Column(String(500))
    address = Column(Text)
    phone = Column(String(50))
    email = Column(String(100))
    trn_number = Column(String(50))
    logo_path = Column(String(255))
    template_path = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    users = relationship("User", back_populates="company")
    quotations = relationship("Quotation", back_populates="company")

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    code = Column(String(10), unique=True, nullable=False)
    email = Column(String(100))
    mobile = Column(String(50))
    designation = Column(String(100))
    role = Column(String(50))
    company_id = Column(Integer, ForeignKey('companies.id'))
    signature_path = Column(String(255))
    email_grptanks = Column(String(100))
    email_pipeco = Column(String(100))
    email_colex = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="users")
    quotations_as_sales = relationship("Quotation", foreign_keys="Quotation.sales_person_id", back_populates="sales_person")
    quotations_as_office = relationship("Quotation", foreign_keys="Quotation.office_person_id", back_populates="office_person")

class Customer(Base):
    __tablename__ = 'customers'
    
    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(500), nullable=False)
    contact_person = Column(String(255))
    title = Column(String(100))
    role = Column(String(100))
    phone = Column(String(50))
    email = Column(String(100))
    location = Column(Text)
    address = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    quotations = relationship("Quotation", back_populates="customer")

class Quotation(Base):
    __tablename__ = 'quotations'
    
    id = Column(Integer, primary_key=True, index=True)
    quote_number = Column(String(50), unique=True, nullable=False, index=True)
    revision_number = Column(Integer, default=0)
    
    # Foreign Keys
    company_id = Column(Integer, ForeignKey('companies.id'))
    sales_person_id = Column(Integer, ForeignKey('users.id'))
    office_person_id = Column(Integer, ForeignKey('users.id'))
    customer_id = Column(Integer, ForeignKey('customers.id'))
    
    quotation_from = Column(String(50))
    
    # Customer Info
    recipient_name = Column(String(255))
    recipient_title = Column(String(100))
    recipient_role = Column(String(100))
    to_company_name = Column(String(500))
    to_location = Column(Text)
    to_phone = Column(String(50))
    to_email = Column(String(100))
    
    # Quotation Details
    quotation_date = Column(Date, nullable=False)
    subject = Column(Text)
    project_location = Column(Text)
    gallon_type = Column(String(20), default='USG')
    
    # Financial
    sub_total = Column(DECIMAL(15, 2), default=0)
    discount_percentage = Column(DECIMAL(5, 2), default=0)
    discount_amount = Column(DECIMAL(15, 2), default=0)
    vat_percentage = Column(DECIMAL(5, 2), default=5)
    vat_amount = Column(DECIMAL(15, 2), default=0)
    grand_total = Column(DECIMAL(15, 2), default=0)
    
    # Display Options
    show_sub_total = Column(Boolean, default=True)
    show_vat = Column(Boolean, default=True)
    show_grand_total = Column(Boolean, default=True)
    
    # Metadata
    status = Column(String(50), default='Draft')
    document_path = Column(String(500))
    notes = Column(Text)
    created_by = Column(Integer, ForeignKey('users.id'))
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="quotations")
    sales_person = relationship("User", foreign_keys=[sales_person_id], back_populates="quotations_as_sales")
    office_person = relationship("User", foreign_keys=[office_person_id], back_populates="quotations_as_office")
    customer = relationship("Customer", back_populates="quotations")
    tanks = relationship("QuotationTank", back_populates="quotation", cascade="all, delete-orphan")
    sections = relationship("QuotationSection", back_populates="quotation", cascade="all, delete-orphan")
    documents = relationship("GeneratedDocument", back_populates="quotation", cascade="all, delete-orphan")
    history = relationship("QuotationHistory", back_populates="quotation", cascade="all, delete-orphan")

class QuotationTank(Base):
    __tablename__ = 'quotation_tanks'
    
    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey('quotations.id', ondelete='CASCADE'), nullable=False)
    
    sl_no = Column(Integer, nullable=False)
    option_number = Column(Integer, default=1)
    option_total = Column(Integer, default=1)
    
    tank_name = Column(String(255), nullable=False)
    tank_type = Column(String(100))
    quantity = Column(Integer, nullable=False, default=1)
    has_partition = Column(Boolean, default=False)
    
    length = Column(String(50), nullable=False)
    width = Column(String(50), nullable=False)
    height = Column(String(50), nullable=False)
    unit = Column(String(10), default='M')
    
    total_capacity = Column(DECIMAL(15, 2))
    capacity_unit = Column(String(20), default='M³')
    usg_capacity = Column(DECIMAL(15, 2))
    img_capacity = Column(DECIMAL(15, 2))
    
    need_free_board = Column(Boolean, default=False)
    free_board_size = Column(String(50))
    net_volume = Column(DECIMAL(15, 2))
    
    unit_price = Column(String(50), nullable=False)
    total_price = Column(DECIMAL(15, 2), nullable=False)
    
    display_order = Column(Integer)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    quotation = relationship("Quotation", back_populates="tanks")

class QuotationSection(Base):
    __tablename__ = 'quotation_sections'
    
    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey('quotations.id', ondelete='CASCADE'), nullable=False)
    section_key = Column(String(50), nullable=False)
    is_enabled = Column(Boolean, default=True)
    content = Column(JSONB)
    display_order = Column(Integer)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    quotation = relationship("Quotation", back_populates="sections")

class GeneratedDocument(Base):
    __tablename__ = 'generated_documents'
    
    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey('quotations.id', ondelete='CASCADE'))
    document_type = Column(String(50), default='Quotation')
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)
    mime_type = Column(String(100), default='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    version = Column(Integer, default=1)
    generated_by = Column(Integer, ForeignKey('users.id'))
    generated_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    quotation = relationship("Quotation", back_populates="documents")

class QuotationHistory(Base):
    __tablename__ = 'quotation_history'
    
    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey('quotations.id', ondelete='CASCADE'))
    action = Column(String(50))
    changed_by = Column(Integer, ForeignKey('users.id'))
    changes = Column(JSONB)
    notes = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    quotation = relationship("Quotation", back_populates="history")
