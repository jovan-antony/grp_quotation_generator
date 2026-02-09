'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AutocompleteInput } from '@/components/ui/autocomplete-input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, FileDown } from 'lucide-react';
import TankForm from './TankForm';
import { toast } from 'sonner';

interface QuotationRevisionFormProps {
  onPreviewUpdate: (html: string) => void;
  loadQuotationData?: any;
}

interface TankData {
  tankNumber: number;
  optionEnabled: boolean;
  optionNumbers: number;
  options: Array<{
    tankName: string;
    quantity: number;
    hasPartition: boolean;
    tankType: string;
    length: string;
    width: string;
    height: string;
    unit: string;
    unitPrice: string;
    needFreeBoard?: boolean;
    freeBoardSize?: string;
    supportSystem?: string;
  }>;
}

export default function QuotationRevisionForm({ onPreviewUpdate, loadQuotationData }: QuotationRevisionFormProps) {
  const [fromCompany, setFromCompany] = useState('');
  const [companyCode, setCompanyCode] = useState(''); // CODE from company_details.xlsx
  const [companyShortName, setCompanyShortName] = useState(''); // company_name (brand name) from company_details.xlsx
  const [templatePath, setTemplatePath] = useState(''); // template_path from company_details.xlsx
  const [companyOptions, setCompanyOptions] = useState<Array<{value: string; label: string}>>([]);
  const [recipientOptions, setRecipientOptions] = useState<Array<{
    value: string;
    label: string;
    metadata?: {
      role?: string;
      company?: string;
      location?: string;
      phone?: string;
      email?: string;
    }
  }>>([]);
  const [companyNameOptions, setCompanyNameOptions] = useState<Array<{value: string; label: string}>>([]);
  const [showSubTotal, setShowSubTotal] = useState(true);
  const [showVat, setShowVat] = useState(true);
  const [showGrandTotal, setShowGrandTotal] = useState(true);
  const [recipientTitle, setRecipientTitle] = useState('Mr.');
  const [recipientName, setRecipientName] = useState('');
  const [role, setRole] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+971');
  const [email, setEmail] = useState('');
  const [quotationDate, setQuotationDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [quotationFrom, setQuotationFrom] = useState('');
  const [salesPersonName, setSalesPersonName] = useState('');
  const [officePersonName, setOfficePersonName] = useState('');
  const [quotationNumber, setQuotationNumber] = useState('');
  const [revisionEnabled, setRevisionEnabled] = useState(false);
  const [revisionNumber, setRevisionNumber] = useState('0');
  const [subject, setSubject] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState<Array<{key: string; value: string}>>([]);
  const [numberOfTanks, setNumberOfTanks] = useState(1);
  const [gallonType, setGallonType] = useState('');
  const [personCode, setPersonCode] = useState(''); // CODE from Excel
  const [salesPersonOptions, setSalesPersonOptions] = useState<Array<{value: string; label: string}>>([]);
  const [officePersonOptions, setOfficePersonOptions] = useState<Array<{value: string; label: string}>>([]);
  const [tanks, setTanks] = useState<TankData[]>([
    {
      tankNumber: 1,
      optionEnabled: false,
      optionNumbers: 1,
      options: [
        {
          tankName: '',
          quantity: 1,
          hasPartition: false,
          tankType: '',
          length: '',
          width: '',
          height: '',
          unit: '',
          unitPrice: '',
          supportSystem: 'Internal',
        },
      ],
    },
  ]);

  const handleNumberOfTanksChange = (value: string) => {
    const num = parseInt(value) || 1;
    setNumberOfTanks(num);

    const newTanks = Array.from({ length: num }, (_, i) => ({
      tankNumber: i + 1,
      optionEnabled: false,
      optionNumbers: 1,
      options: [
        {
          tankName: '',
          quantity: 1,
          hasPartition: false,
          tankType: '',
          length: '',
          width: '',
          height: '',
          unit: '',
          unitPrice: '',
          supportSystem: 'Internal',
        },
      ],
    }));
    setTanks(newTanks);
  };

  const updateTank = (index: number, data: Partial<TankData>) => {
    const newTanks = [...tanks];
    // Always ensure options is an array
    if (data.options && Array.isArray(data.options)) {
      newTanks[index] = { ...newTanks[index], ...data, options: data.options };
    } else {
      newTanks[index] = { ...newTanks[index], ...data };
    }
    // If optionEnabled is toggled off, keep only the first option
    if (!newTanks[index].optionEnabled) {
      newTanks[index].optionNumbers = 1;
      newTanks[index].options = [newTanks[index].options?.[0] || {
        tankName: '',
        quantity: 1,
        hasPartition: false,
        tankType: '',
        length: '',
        width: '',
        height: '',
        unit: '',
        unitPrice: '',
        supportSystem: 'Internal',
      }];
    }
    setTanks(newTanks);
  };

  // Generate live preview HTML
  const generatePreview = () => {
    // Extract YYMM from date
    const dateObj = new Date(quotationDate);
    const yy = String(dateObj.getFullYear()).slice(-2);
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yymm = `${yy}${mm}`;
    
    // Build quotation number: {CompanyCode}/{YYMM}/{PersonCode}/{Number}
    const fullQuoteNumber = quotationNumber 
      ? `${companyCode || ''}/${yymm}/${personCode || 'XX'}/${quotationNumber}` 
      : '';
    
    // Add revision suffix if revision > 0 (always show revision in quote number)
    const displayQuoteNumber = (fullQuoteNumber && parseInt(revisionNumber) > 0)
      ? `${fullQuoteNumber}-R${revisionNumber}`
      : fullQuoteNumber;

    // Calculate tank totals
    let subTotal = 0;
    const tankRows = tanks.flatMap(tank => 
      tank.options.map((option, idx) => {
        const qty = Number(option.quantity) || 0;
        const unitPrice = Number(option.unitPrice) || 0;
        const total = qty * unitPrice;
        subTotal += total;

        // Parse dimensions
        const parseDim = (dim: string) => {
          const cleaned = dim.replace(/\s/g, '');
          if (cleaned.includes('(')) return cleaned.split('(')[0];
          return cleaned;
        };

        const length = parseDim(option.length || '0');
        const width = parseDim(option.width || '0');
        const height = option.height || '0';
        
        // Calculate volume
        const volumeM3 = (Number(length) * Number(width) * Number(height)).toFixed(2);
        
        // Calculate gallons
        const gallons = gallonType === 'US Gallons' 
          ? (Number(volumeM3) * 264.172).toFixed(0)
          : (Number(volumeM3) * 219.969).toFixed(0);

        return `
          <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'}; border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 10px; color: #374151; font-size: 12px; border-right: 1px solid #f3f4f6;">${idx + 1}</td>
            <td style="padding: 12px 10px; color: #374151; font-size: 12px; font-weight: 500; border-right: 1px solid #f3f4f6;">${option.tankName || '-'}</td>
            <td style="padding: 12px 10px; color: #6b7280; font-size: 12px; border-right: 1px solid #f3f4f6;">${option.tankType || '-'}</td>
            <td style="padding: 12px 10px; color: #374151; font-size: 12px; border-right: 1px solid #f3f4f6;">${option.length || '-'} × ${option.width || '-'} × ${option.height || '-'}</td>
            <td style="padding: 12px 10px; color: #374151; font-size: 12px; border-right: 1px solid #f3f4f6;">${volumeM3} m³ (${gallons} ${gallonType === 'US Gallons' ? 'USG' : 'IMG'})</td>
            <td style="padding: 12px 10px; text-align: center; color: #374151; font-size: 12px; font-weight: 600; border-right: 1px solid #f3f4f6;">${qty}</td>
            <td style="padding: 12px 10px; text-align: right; color: #374151; font-size: 12px; border-right: 1px solid #f3f4f6;">AED ${unitPrice.toLocaleString()}</td>
            <td style="padding: 12px 10px; text-align: right; color: #111827; font-size: 12px; font-weight: 600;">AED ${total.toLocaleString()}</td>
          </tr>
        `;
      })
    ).join('');

    const vat = showVat ? subTotal * 0.05 : 0;
    const grandTotal = showGrandTotal ? subTotal + vat : subTotal;

    const previewHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 4px;">
        <div style="background: linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%); color: white; padding: 24px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(96, 165, 250, 0.15);">
          <h2 style="margin: 0 0 8px 0; font-weight: 600; font-size: 20px; letter-spacing: 0.3px;">${fromCompany || 'Company Name'}</h2>
          <p style="margin: 0; opacity: 0.95; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">QUOTATION</p>
        </div>

        <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="color: #374151;">
              <p style="margin: 6px 0; font-size: 13px;"><strong style="color: #111827;">To:</strong> ${recipientTitle} ${recipientName || '-'}</p>
              ${role ? `<p style="margin: 6px 0; font-size: 13px;"><strong style="color: #111827;">Role:</strong> ${role}</p>` : ''}
              <p style="margin: 6px 0; font-size: 13px;"><strong style="color: #111827;">Company:</strong> ${companyName || '-'}</p>
              ${location ? `<p style="margin: 6px 0; font-size: 13px;"><strong style="color: #111827;">Location:</strong> ${location}</p>` : ''}
              ${phoneNumber && phoneNumber !== '+971' ? `<p style="margin: 6px 0; font-size: 13px; color: #6b7280;">${phoneNumber}</p>` : ''}
              ${email ? `<p style="margin: 6px 0; font-size: 13px; color: #6b7280;">${email}</p>` : ''}
            </div>
            <div style="text-align: right; color: #374151;">
              <p style="margin: 6px 0; font-size: 13px;"><strong style="color: #111827;">Quote No:</strong> ${displayQuoteNumber || '-'}</p>
              <p style="margin: 6px 0; font-size: 13px;"><strong style="color: #111827;">Date:</strong> ${quotationDate || '-'}</p>
              ${revisionEnabled ? `<p style="margin: 6px 0; font-size: 13px;"><strong style="color: #111827;">Revision:</strong> ${revisionNumber}</p>` : ''}
              ${quotationFrom === 'Sales' && salesPersonName ? `<p style="margin: 6px 0; font-size: 13px;"><strong style="color: #111827;">Sales Person:</strong> ${salesPersonName}</p>` : ''}
            </div>
          </div>
        </div>

  ${subject ? `<p style="margin-bottom: 12px; color: #374151; font-size: 13px;"><strong style="color: #111827;">Subject:</strong> ${subject}</p>` : ''}
  ${projectLocation ? `<p style="margin-bottom: 12px; color: #374151; font-size: 13px;"><strong style="color: #111827;">Project Location:</strong> ${projectLocation}</p>` : ''}
  ${additionalDetails.map(detail => detail.key && detail.value ? `<p style=\"margin-bottom: 12px; color: #374151; font-size: 13px;\"><strong style=\"color: #111827;\">${detail.key}:</strong> ${detail.value}</p>` : '').join('')}

        <div style="margin: 20px 0; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%); color: white;">
                <th style="padding: 12px 10px; font-weight: 600; text-align: left; border-right: 1px solid rgba(255,255,255,0.1);">SL</th>
                <th style="padding: 12px 10px; font-weight: 600; text-align: left; border-right: 1px solid rgba(255,255,255,0.1);">Tank Name</th>
                <th style="padding: 12px 10px; font-weight: 600; text-align: left; border-right: 1px solid rgba(255,255,255,0.1);">Type</th>
                <th style="padding: 12px 10px; font-weight: 600; text-align: left; border-right: 1px solid rgba(255,255,255,0.1);">Dimensions (L×W×H)</th>
                <th style="padding: 12px 10px; font-weight: 600; text-align: left; border-right: 1px solid rgba(255,255,255,0.1);">Capacity</th>
                <th style="padding: 12px 10px; font-weight: 600; text-align: center; border-right: 1px solid rgba(255,255,255,0.1);">Qty</th>
                <th style="padding: 12px 10px; font-weight: 600; text-align: right; border-right: 1px solid rgba(255,255,255,0.1);">Unit Price</th>
                <th style="padding: 12px 10px; font-weight: 600; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${tankRows || '<tr><td colspan="8" style="text-align: center; padding: 30px; color: #9ca3af; background: #ffffff;">No tanks added yet</td></tr>'}
            </tbody>
          </table>
        </div>

        ${showSubTotal || showVat || showGrandTotal ? `
          <div style="margin: 20px 0; text-align: right; padding: 16px; background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
            ${showSubTotal ? `<p style="margin: 8px 0; color: #374151; font-size: 14px;"><strong style="color: #111827;">Sub Total:</strong> <span style="color: #111827;">AED ${subTotal.toLocaleString()}</span></p>` : ''}
            ${showVat ? `<p style="margin: 8px 0; color: #374151; font-size: 14px;"><strong style="color: #111827;">VAT (5%):</strong> <span style="color: #111827;">AED ${vat.toLocaleString()}</span></p>` : ''}
            ${showGrandTotal ? `<p style="margin: 12px 0 4px 0; font-size: 18px; font-weight: 600;"><strong style="color: #111827;">Grand Total:</strong> <span style="color: #4b5563;">AED ${grandTotal.toLocaleString()}</span></p>` : ''}
          </div>
        ` : ''}

        <div style="margin-top: 24px; padding: 16px; background: #f9fafb; border-left: 4px solid #6b7280; border-radius: 8px;">
          <p style="margin: 0; color: #9ca3af; font-size: 13px; font-style: italic;">
            This is a live preview. Fill in the form to see your quotation take shape!
          </p>
        </div>
      </div>
    `;

    onPreviewUpdate(previewHtml);
  };

  // Update preview whenever any field changes
  useEffect(() => {
    generatePreview();
  }, [
    fromCompany, recipientTitle, recipientName, role, companyName, location,
    phoneNumber, email, quotationDate, quotationFrom, salesPersonName,
    quotationNumber, revisionEnabled, revisionNumber, subject, projectLocation,
    additionalDetails, gallonType, tanks, showSubTotal, showVat, showGrandTotal, personCode, officePersonName, companyCode
  ]);

  // Fetch recipient details from recipient_details table
  const fetchRecipientDetails = async (recipientFullName: string) => {
    if (!recipientFullName) {
      console.log('⚠️ No recipient name provided to fetch');
      return;
    }
    
    try {
      console.log(`🔍 Fetching recipient details for: "${recipientFullName}"`);
      const url = `http://localhost:8000/api/recipient-details?name=${encodeURIComponent(recipientFullName)}`;
      console.log(`📡 API URL: ${url}`);
      
      const response = await fetch(url);
      console.log(`📥 Response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Received recipient details:`, data);
        
        // Auto-fill all recipient fields
        console.log('📝 Auto-filling fields...');
        setRecipientName(data.recipientName || '');
        setRole(data.role || '');
        setCompanyName(data.companyName || '');
        setLocation(data.location || '');
        setPhoneNumber(data.phoneNumber || '+971');
        setEmail(data.email || '');
        console.log('✅ All fields auto-filled successfully!');
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch recipient details:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Error fetching recipient details:', error);
    }
  };

  // Fetch company details from company_details.xlsx
  const fetchCompanyDetails = async (companyFullName: string) => {
    if (!companyFullName) {
      setCompanyCode('');
      setCompanyShortName('');
      setTemplatePath('');
      return;
    }
    
    try {
      console.log(`Fetching company details for: ${companyFullName}`);
      const response = await fetch(`http://localhost:8000/api/company-details?name=${encodeURIComponent(companyFullName)}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`Received company details:`, data);
        setCompanyCode(data.code || '');
        setCompanyShortName(data.company_name || '');
        setTemplatePath(data.template_path || '');
      } else {
        console.error('Failed to fetch company details:', response.status);
        setCompanyCode('');
        setCompanyShortName('');
        setTemplatePath('');
      }
    } catch (error) {
      console.error('Error fetching company details:', error);
      setCompanyCode('');
      setCompanyShortName('');
      setTemplatePath('');
    }
  };

  // Fetch CODE from Excel based on person name and type
  const fetchPersonCode = async (personName: string, personType: 'sales' | 'office') => {
    if (!personName) {
      setPersonCode('');
      return;
    }
    
    try {
      console.log(`Fetching CODE for: ${personName} (${personType})`);
      const response = await fetch(`http://localhost:8000/api/person-code?name=${encodeURIComponent(personName)}&type=${personType}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`Received CODE: ${data.code}`);
        setPersonCode(data.code || 'XX');
      } else {
        console.error('Failed to fetch CODE:', response.status);
        setPersonCode('XX');
      }
    } catch (error) {
      console.error('Error fetching person CODE:', error);
      setPersonCode('XX');
    }
  };

  // Fetch office person names (shared function)
  const fetchOfficePersons = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/person-names/office');
      if (response.ok) {
        const data = await response.json();
        setOfficePersonOptions(
          data.names.map((name: string) => ({ value: name, label: name }))
        );
      }
    } catch (error) {
      console.error('Error fetching office person names:', error);
    }
  };

  // Fetch recipient list
  const fetchRecipients = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/recipients');
      if (response.ok) {
        const data = await response.json();
        setRecipientOptions(
          data.recipients.map((recipient: any) => ({
            value: recipient.name,
            label: recipient.name,
            metadata: {
              role: recipient.role,
              company: recipient.company,
              location: recipient.location,
              phone: recipient.phone,
              email: recipient.email
            }
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching recipients:', error);
    }
  };

  const fetchCompanyNames = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/company-names');
      if (response.ok) {
        const data = await response.json();
        setCompanyNameOptions(
          data.company_names.map((name: string) => ({ value: name, label: name }))
        );
      }
    } catch (error) {
      console.error('Error fetching company names:', error);
    }
  };

  // Fetch company and recipient lists on component mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/companies');
        if (response.ok) {
          const data = await response.json();
          setCompanyOptions(
            data.companies.map((name: string) => ({ value: name, label: name }))
          );
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };

    const fetchRecipientsInitial = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/recipients');
        if (response.ok) {
          const data = await response.json();
          setRecipientOptions(
            data.recipients.map((recipient: any) => ({
              value: recipient.name,
              label: recipient.name,
              metadata: {
                role: recipient.role,
                company: recipient.company,
                location: recipient.location,
                phone: recipient.phone,
                email: recipient.email
              }
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching recipients:', error);
      }
    };

    const fetchCompanyNamesInitial = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/company-names');
        if (response.ok) {
          const data = await response.json();
          setCompanyNameOptions(
            data.company_names.map((name: string) => ({ value: name, label: name }))
          );
        }
      } catch (error) {
        console.error('Error fetching company names:', error);
      }
    };

    fetchCompanies();
    fetchRecipientsInitial();
    fetchCompanyNamesInitial();
  }, []);

  // Fetch company details when fromCompany changes
  useEffect(() => {
    if (fromCompany) {
      fetchCompanyDetails(fromCompany);
    }
  }, [fromCompany]);

  // Log when company code updates
  useEffect(() => {
    console.log(`📝 Company Code updated: "${companyCode}"`);
  }, [companyCode]);

  // Fetch sales person names when quotationFrom changes to 'Sales'
  useEffect(() => {
    const fetchSalesPersons = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/person-names/sales');
        if (response.ok) {
          const data = await response.json();
          setSalesPersonOptions(
            data.names.map((name: string) => ({ value: name, label: name }))
          );
        }
      } catch (error) {
        console.error('Error fetching sales person names:', error);
      }
    };

    if (quotationFrom === 'Sales') {
      fetchSalesPersons();
      // Also fetch office persons for the second field
      fetchOfficePersons();
    }
    // Reset personCode when quotation type changes
    setPersonCode('');
  }, [quotationFrom]);

  // Fetch office person names when quotationFrom changes to 'Office' or 'Sales'
  useEffect(() => {
    if (quotationFrom === 'Office' || quotationFrom === 'Sales') {
      fetchOfficePersons();
    }
  }, [quotationFrom]);

  // Fetch CODE when salesPersonName changes (for Sales quotations)
  useEffect(() => {
    if (quotationFrom === 'Sales' && salesPersonName) {
      fetchPersonCode(salesPersonName, 'sales');
    }
  }, [salesPersonName, quotationFrom]);

  // Fetch CODE when officePersonName changes (for Office quotations)
  useEffect(() => {
    if (quotationFrom === 'Office' && officePersonName) {
      fetchPersonCode(officePersonName, 'office');
    }
  }, [officePersonName, quotationFrom]);

  // Load quotation data from Search (when Load button is clicked)
  useEffect(() => {
    if (!loadQuotationData) return;

    console.log('Loading quotation data:', loadQuotationData);

    // API returns data with 'quotation' object for full details from /api/quotations/{id}
    // or direct quotation data from search results
    const quotationData = loadQuotationData.quotation || loadQuotationData;

    // Set form fields from loaded data
    setFromCompany(quotationData.from_company || quotationData.fromCompany || '');
    setRecipientTitle(quotationData.recipient_title || quotationData.recipientTitle || 'Mr.');
    setRecipientName(quotationData.recipient_name || quotationData.recipientName || '');
    setRole(quotationData.role || '');
    setCompanyName(quotationData.recipient_company || quotationData.companyName || '');
    setLocation(quotationData.location || '');
    setPhoneNumber(quotationData.phone_number || quotationData.phoneNumber || '+971');
    setEmail(quotationData.email || '');
    
    // Format date - API returns DD/MM/YY format, convert to YYYY-MM-DD
    if (quotationData.quotation_date || quotationData.quotationDate) {
      const dateStr = quotationData.quotation_date || quotationData.quotationDate;
      let formattedDate = '';
      
      // Check if it's DD/MM/YY format from API
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          formattedDate = `${year}-${month}-${day}`;
        }
      } else {
        // Already in ISO format
        formattedDate = dateStr.split('T')[0];
      }
      
      setQuotationDate(formattedDate);
    }
    
    setQuotationFrom(quotationData.quotation_from || quotationData.quotationFrom || '');
    setSalesPersonName(quotationData.sales_person_name || quotationData.salesPersonName || '');
    setOfficePersonName(quotationData.office_person_name || quotationData.officePersonName || '');
    setQuotationNumber(quotationData.quotation_number || quotationData.quotationNumber || '');
    setRevisionNumber(String(quotationData.revision_number ?? quotationData.revisionNumber ?? 0));
    setSubject(quotationData.subject || '');
    setProjectLocation(quotationData.project_location || quotationData.projectLocation || '');
    
    // Load tanks data
    if (loadQuotationData.tanks || quotationData.tanksData) {
      const tanksArray = loadQuotationData.tanks?.tanks || quotationData.tanksData?.tanks || [];
      const gallonTypeFromData = loadQuotationData.tanks?.gallonType || quotationData.tanksData?.gallonType || '';
      
      setGallonType(gallonTypeFromData);
      setNumberOfTanks(tanksArray.length);
      setTanks(tanksArray);
    }
    
    // Load form options
    if (quotationData.formOptions) {
      setShowSubTotal(quotationData.formOptions.showSubTotal ?? true);
      setShowVat(quotationData.formOptions.showVat ?? true);
      setShowGrandTotal(quotationData.formOptions.showGrandTotal ?? true);
    }
    
    // Load terms - API returns terms directly
    if (loadQuotationData.terms) {
      const apiTerms = loadQuotationData.terms;
      const formattedTerms: Record<string, any> = {};
      
      // Convert API terms to form format
      Object.keys(apiTerms).forEach(key => {
        formattedTerms[key] = {
          action: true,
          details: Array.isArray(apiTerms[key]) ? apiTerms[key] : [apiTerms[key]],
          custom: []
        };
      });
      
      setTerms(prev => ({ ...prev, ...formattedTerms }));
    }
    
    // Load additional details
    if (quotationData.additionalData?.additionalDetails) {
      setAdditionalDetails(quotationData.additionalData.additionalDetails);
    }
    
    toast.success('Quotation loaded successfully!');
  }, [loadQuotationData]);

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!fromCompany) {
        toast.error('Please select a company');
        return;
      }
      if (!recipientName) {
        toast.error('Please enter recipient name');
        return;
      }
      if (!companyName) {
        toast.error('Please enter company name');
        return;
      }
      if (!quotationNumber) {
        toast.error('Please enter quotation number');
        return;
      }
      if (!gallonType) {
        toast.error('Please select gallon type');
        return;
      }

      toast.success('Saving quotation...');

      // Format data for database
      const formattedRecipientName = `${recipientTitle} ${recipientName}`;
      const formattedPhone = phoneNumber ? `Phone: ${phoneNumber}` : '';
      const formattedEmail = email ? `Email: ${email}` : '';

      // Convert date from YYYY-MM-DD to DD/MM/YY
      const dateObj = new Date(quotationDate);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = String(dateObj.getFullYear()).slice(-2);
      const formattedDate = `${day}/${month}/${year}`;

      // Convert gallon type to Python format (USG or IMG)
      const formattedGallonType = gallonType === 'US Gallons' ? 'USG' : gallonType === 'Imperial Gallons' ? 'IMG' : gallonType;

      // Convert terms.action boolean to 'yes'/'no' string for backend
      const formattedTerms = Object.fromEntries(
        Object.entries(terms).map(([key, value]) => ({
          [key]: {
            ...value,
            action: value.action ? 'yes' : 'no',
          }
        })).flatMap(obj => Object.entries(obj))
      );

      // Construct full quote number
      const yy = String(dateObj.getFullYear()).slice(-2);
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const yymm = `${yy}${mm}`;
      const codeForQuote = personCode || 'XX';
      
      let fullQuoteNumber = `${companyCode}/${yymm}/${codeForQuote}/${quotationNumber}`;
      if (revisionEnabled && parseInt(revisionNumber) > 0) {
        fullQuoteNumber = `${companyCode}/${yymm}/${codeForQuote}/${quotationNumber}-R${revisionNumber}`;
      }

      // Save to database
      console.log(`💾 Saving quotation - Number: ${quotationNumber}, Revision: ${revisionNumber}`);
      const saveResponse = await fetch('http://localhost:8000/api/save-quotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotationNumber,
          fullQuoteNumber,
          finalDocFilePath: null, // No document generated yet
          fromCompany,
          recipientTitle,
          recipientName,
          role,
          companyName,
          location,
          phoneNumber,
          email,
          quotationDate: formattedDate,
          quotationFrom,
          salesPersonName,
          officePersonName,
          subject,
          projectLocation,
          tanksData: {
            numberOfTanks: tanks.length,
            gallonType: formattedGallonType,
            tanks: tanks
          },
          formOptions: {
            showSubTotal,
            showVat,
            showGrandTotal
          },
          additionalData: {
            additionalDetails
          },
          terms: formattedTerms,
          revisionNumber: parseInt(revisionNumber) || 0,
          status: 'draft'
        })
      });

      if (saveResponse.ok) {
        const savedData = await saveResponse.json();
        console.log('✓ Quotation saved to database:', savedData.fullQuoteNumber);
        toast.success('Quotation saved to database successfully!');
        // Refresh recipient list to include newly added recipient
        fetchRecipients();
      } else {
        const errorData = await saveResponse.json();
        throw new Error(errorData.error || 'Failed to save quotation');
      }
    } catch (error) {
      console.error('Save Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save quotation. Please check if the server is running.';
      toast.error(errorMessage);
    }
  };

  const handleExport = async () => {
    try {
      // Validate required fields
      if (!fromCompany) {
        toast.error('Please select a company');
        return;
      }
      if (!recipientName) {
        toast.error('Please enter recipient name');
        return;
      }
      if (!companyName) {
        toast.error('Please enter company name');
        return;
      }
      if (!quotationNumber) {
        toast.error('Please enter quotation number');
        return;
      }
      if (!gallonType) {
        toast.error('Please select gallon type');
        return;
      }

      toast.success('Generating document...');


      // Format data for Python backend
      const formattedRecipientName = `${recipientTitle} ${recipientName}`;
      const formattedPhone = phoneNumber ? `Phone: ${phoneNumber}` : '';
      const formattedEmail = email ? `Email: ${email}` : '';

      // Convert date from YYYY-MM-DD to DD/MM/YY
      const dateObj = new Date(quotationDate);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = String(dateObj.getFullYear()).slice(-2);
      const formattedDate = `${day}/${month}/${year}`;

      // Convert gallon type to Python format (USG or IMG)
      const formattedGallonType = gallonType === 'US Gallons' ? 'USG' : gallonType === 'Imperial Gallons' ? 'IMG' : gallonType;

      // Convert terms.action boolean to 'yes'/'no' string for backend
      const formattedTerms = Object.fromEntries(
        Object.entries(terms).map(([key, value]) => ({
          [key]: {
            ...value,
            action: value.action ? 'yes' : 'no',
          }
        })).flatMap(obj => Object.entries(obj))
      );
      
      // Debug: Log terms data being sent
      console.log('=== TERMS DATA BEING SENT ===');
      console.log('termsConditions:', formattedTerms.termsConditions);
      if (formattedTerms.termsConditions) {
        console.log('  Details:', formattedTerms.termsConditions.details);
        console.log('  Custom:', formattedTerms.termsConditions.custom);
      }
      console.log('============================');

      // Construct full quote number using companyCode from state (already fetched from database)
      const yy = String(dateObj.getFullYear()).slice(-2);
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const yymm = `${yy}${mm}`;
      const codeForQuote = personCode || 'XX';
      
      // Include revision in full quote number if revision is enabled and > 0
      let fullQuoteNumber = `${companyCode}/${yymm}/${codeForQuote}/${quotationNumber}`;
      if (revisionEnabled && parseInt(revisionNumber) > 0) {
        fullQuoteNumber = `${companyCode}/${yymm}/${codeForQuote}/${quotationNumber}-R${revisionNumber}`;
      }

      // Send all data to Python backend for document generation
      const response = await fetch('/api/generate-quotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromCompany,
          companyCode,
          companyShortName,
          templatePath,
          recipientTitle,
          recipientName: formattedRecipientName,
          role,
          companyName,
          location,
          phoneNumber: formattedPhone,
          email: formattedEmail,
          quotationDate: formattedDate,
          quotationFrom,
          salesPersonName,
          officePersonName,
          quotationNumber,
          revisionEnabled,
          revisionNumber,
          subject,
          projectLocation,
          additionalDetails,
          gallonType: formattedGallonType,
          numberOfTanks,
          showSubTotal,
          showVat,
          showGrandTotal,
          tanks,
          terms: formattedTerms,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        const downloadFilename = `quotation_${fullQuoteNumber.replace(/\//g, '_')}.docx`;
        a.href = url;
        a.download = downloadFilename;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Document generated successfully!');

        // Save to database after successful document generation
        try {
          const finalDocPath = `Final_Doc/${fullQuoteNumber.replace(/\//g, '-')}.docx`;
          
          console.log(`💾 Saving quotation - Number: ${quotationNumber}, Revision: ${revisionNumber}`);
          const saveResponse = await fetch('http://localhost:8000/api/save-quotation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quotationNumber,
              fullQuoteNumber,
              finalDocFilePath: finalDocPath,
              fromCompany,
              recipientTitle,
              recipientName,
              role,
              companyName,
              location,
              phoneNumber,
              email,
              quotationDate: formattedDate,
              quotationFrom,
              salesPersonName,
              officePersonName,
              subject,
              projectLocation,
              tanksData: {
                numberOfTanks: tanks.length,
                gallonType: formattedGallonType,
                tanks: tanks
              },
              formOptions: {
                showSubTotal,
                showVat,
                showGrandTotal
              },
              additionalData: {
                additionalDetails
              },
              terms: formattedTerms,
              revisionNumber: parseInt(revisionNumber) || 0,
              status: 'draft'
            })
          });

          if (saveResponse.ok) {
            const savedData = await saveResponse.json();
            console.log('✓ Quotation saved to database:', savedData.fullQuoteNumber);
            toast.success('Quotation saved to database!');
            // Refresh recipient list to include newly added recipient
            fetchRecipients();
          } else {
            console.warn('Failed to save quotation to database');
          }
        } catch (dbError) {
          console.warn('Failed to save to database:', dbError);
        }
      } else {
        let errorMessage = 'Failed to generate document';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        console.error('API Error:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Export Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate quotation. Please check if both servers are running.';
      toast.error(errorMessage);
    }
  };

  // Contractual Terms & Specifications options
  const termsList = [
    {
      key: 'note',
      label: 'NOTE',
      default: 'yes',
      details: [
        'DURING MAINTENANCE OF THE PARTITION TANK, THE WATER LEVELS IN EACH COMPARTMENT SHOULD BE REDUCED EQUALLY.',
        'THE MAXIMUM ALLOWABLE WATER HEIGHT IN EACH COMPARTMENT IS UPTO 1 MTR HEIGHT',
        'THE ABOVE TANK ONLY SUITABLE FOR STORING PORTABLE/ DRINKING WATER EXCEPT CHEMICAL /SOLID/TSE WATER.',
        'THE OFFER IS VALID FOR 30 DAYS FROM THE QUOTATION DATE.',
        'THE WARRANTY WILL BE APPLICABLE ONLY UPON RECEIVING FULL PAYMENT.'
      ]
    },
    {
      key: 'materialSpecification',
      label: 'MATERIAL SPECIFICATION',
      default: 'yes',
      details: [
        'WRAS Approved Product.',
        'Sealant Tape – Non-Toxic PVC Foam Type.',
        'Roof Panel Vertical Support (Internal) – PVC Pipe.',
        'All Internal Metallic parts in continuous contact with water are Stainless Steel 316/A4 grade and External HDG Support Accessories with HDG Bolt/Nut/Washers.',
        'Manhole: 750mm Dia. with sealed cover and Lock. – 1 No.',
        'For 1 Mtr. height tank, Wall flat – 1 No. & Drain flat – 1 No.',
        'Clear Tube type level Indicator (Without Marking) for 2 Mtr. height tank and above only.',
        'HDG Steel Skid with HDG Bolt / Nut / Washer for 2 Mtr. height tank and above only.',
        'Internal Ladder (GRP) and External Ladder (HDG) for 2 Mtr. height tank and above only.',
        'Air Vent, Inlet, Outlet, Overflow and Drain – 1 No. each with PVC flange (FL/PL) connections up to 3”.',
        'Manufacturer Warranty: 10 Year from the date of installation / testing and commission.'
      ]
    },
    {
      key: 'warrantyExclusions',
      label: 'THE WARRANTY WILL NOT BE APPLICABLE FOR THE FOLLOWING CASES:',
      default: 'yes',
      details: [
        'Any damage / loss caused directly or indirectly by natural calamities or any other force majeure conditions beyond the control of the supplier.',
        'Any damage occurs due to storing any chemicals, solids, or any other substances. (The proposed tank is specifically designed and intended only for potable / drinking water storage).',
        'Any defects or damage occur on the foundation that affect the tank.',
        'Any unauthorized modification or repairs made on the tank by parties other than the manufacturer representatives.'
      ]
    },
    {
      key: 'termsConditions',
      label: 'TERMS AND CONDITIONS',
      default: 'yes',
      details: [
        'Price          : The given prices are based on the supply and installation of the tank at your proposed site.',
        'Validity       : The offer is valid for 30 days only.',
        'Delivery       : One week from the receipt of advance payment.',
        'Payment        : Cash/CDC. 40% advance along with the confirmed order and 60% upon delivery of the material at the site. (In the event of late payment, a late payment charge of 2% per month on the contract value will be applied till the outstanding payment is settled).'
      ]
    },
    {
      key: 'supplierScope',
      label: 'SUPPLIER SCOPE',
      default: 'yes',
      details: [
        'Dismantling of existing tank.',
        'Material offloading, safe storage, and shifting near the foundation',
        'Crain/Boom Loader/other facilities for offloading.',
        'Supply, installation & supervision for T & C of the tank at the site.',
        'Other plumbing works / Float Valves/ Valves / Float Switches.',
        'Basic Hand Toolbox.',
        'Surveyors Equipment’s for base skid levelling.',
        'Power Tools – Welding/Grinder/Drill/Tighter Machine /Cables.',
        'Flanges as mentioned in the offer.'
      ]
    },
    {
      key: 'customerScope',
      label: 'CUSTOMER SCOPE',
      default: 'yes',
      details: [
        'Material offloading, safe storage, and shifting near the foundation.  (If the offloading and lifting team is not ready upon our vehicle’s arrival, the delivery may be rescheduled, and a maximum charge of AED 1000 will be applied to the customer for rescheduling).',
        'Crain/Boom Loader/other facilities for offloading.',
        'Other plumbing works / Float Valves/ Valves / Float Switches.',
        'Scaffolding as per the site condition.',
        'Flanges other than specified.',
        'Water Thermos & Rest Rooms to be provided by the Contractor/Client.',
        'Electricity/Generator for installation and water for testing.',
        'Accommodation for the technical staff should be provided by the client/contractor.',
        'Grouting, if required for levelling the tank foundation. (After completing the skid work for clearing the space between the base skid and plinth). After the grouting process, a minimum of 3 days will be required to schedule the installation.',
        'In case of any leakage detected after filling the tank, it shall be drained out (if required) and bear any related expenses for refilling the tank for retesting after the rectification.',
        'Any obligations, including entry permits, labour passes and risk liability insurance policy charges etc.'
      ]
    },
    {
      key: 'extraNote',
      label: 'NOTE',
      default: 'yes',
      details: [
        "Any deviations from this quotation to suit the site's condition will have additional cost implications.",
        "If the work is indefinitely delayed beyond 30 days after the delivery of materials due to the issues caused by the customer or site condition, the Company will not be liable for any damage to the supplied materials.",
        "The submission of all related documents, including the warranty certificate, will be done upon receiving the final payment.",
        "Any additional test / lab charges incurred from third parties / external agencies are under the scope of the contractor / client.",
        "Until receiving the final settlement from the client, GRP PIPECO TANKS TRADING L.L.C has reserved the right to use the supplied materials at the site.",
        "The testing and commissioning should be completed within a period of 15 to 30 days from the installation completion date by the Contractor/Client.",
        "For the net volume, a minimum of 30 cm freeboard area is to be calculated from the total height of the tank."
      ]
    },
    {
      key: 'scopeOfWork',
      label: 'SCOPE OF WORK',
      default: 'no',
      details: []
    },
    {
      key: 'workExcluded',
      label: 'WORK EXCLUDED',
      default: 'no',
      details: []
    }
  ];

  const [terms, setTerms] = useState<Record<string, {
    action: boolean;
    details: string[];
    custom: string[];
    newPoint?: string;
  }>>(
    Object.fromEntries(termsList.map(term => [term.key, {
      action: term.default === 'yes',
      details: term.details,
      custom: [],
    }]))
  );

  // Update company name in extraNote when fromCompany changes
  useEffect(() => {
    if (fromCompany && terms['extraNote']) {
      const updatedDetails = terms['extraNote'].details.map((detail, idx) => {
        // Update the 5th point (index 4) which contains the company name
        if (idx === 4 && detail.includes('has reserved the right to use the supplied materials at the site')) {
          return `Until receiving the final settlement from the client, ${fromCompany} has reserved the right to use the supplied materials at the site.`;
        }
        return detail;
      });
      
      setTerms(prev => ({
        ...prev,
        extraNote: {
          ...prev['extraNote'],
          details: updatedDetails,
        },
      }));
    }
  }, [fromCompany]);

  // Remove a detail point
  const handleRemoveDetail = (key: string, idx: number) => {
    setTerms(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        details: prev[key].details.filter((_, i) => i !== idx),
      },
    }));
  };

  // Change checkbox state for each section
  const handleTermActionChange = (key: string, action: boolean) => {
    setTerms(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        action,
      },
    }));
  };

  // Edit a detail point
  const handleEditDetail = (key: string, idx: number, value: string) => {
    setTerms(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        details: prev[key].details.map((d, i) => i === idx ? value : d),
      },
    }));
  };

  // Add a custom point
  const handleAddCustom = (key: string, value: string) => {
    setTerms(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        custom: [...prev[key].custom, value],
      },
    }));
  };

  // Edit a custom point
  const handleEditCustom = (key: string, idx: number, value: string) => {
    setTerms(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        custom: prev[key].custom.map((d, i) => i === idx ? value : d),
      },
    }));
  };

  // Remove a custom point
  const handleRemoveCustom = (key: string, idx: number) => {
    setTerms(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        custom: prev[key].custom.filter((_, i) => i !== idx),
      },
    }));
  };

  // Load existing quotation
  const [loadQuoteNumber, setLoadQuoteNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadQuotation = async () => {
    if (!loadQuoteNumber.trim()) {
      toast.error('Please enter a quote number');
      return;
    }

    // Parse quotation_number or quotation_number-revision format
    // "0324" or "0324-0" loads revision 0
    // "0324-1" loads revision 1, etc.
    const parts = loadQuoteNumber.split('-');
    const quotationNum = parts[0].trim();
    let revisionNum = '0'; // Default to revision 0
    
    if (parts.length === 2) {
      revisionNum = parts[1].trim();
    }

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/quotation?quote_number=${encodeURIComponent(quotationNum)}&revision=${encodeURIComponent(revisionNum)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Quotation not found');
        } else {
          toast.error('Failed to load quotation');
        }
        return;
      }

      const data = await response.json();
      
      // Populate form fields
      setFromCompany(data.fromCompany);
      setRecipientTitle(data.recipientTitle);
      setRecipientName(data.recipientName);
      setRole(data.role);
      setCompanyName(data.companyName);
      setLocation(data.location);
      setPhoneNumber(data.phoneNumber);
      setEmail(data.email);
      
      // Convert date from DD/MM/YY to YYYY-MM-DD
      const dateParts = data.quotationDate.split('/');
      if (dateParts.length === 3) {
        const [day, month, year] = dateParts;
        const fullYear = `20${year}`;
        setQuotationDate(`${fullYear}-${month}-${day}`);
      }
      
      setQuotationFrom(data.quotationFrom);
      setSalesPersonName(data.salesPersonName);
      setOfficePersonName(data.officePersonName);
      setQuotationNumber(data.quotationNumber);
      
      // Set the loaded revision number
      console.log(`📊 Loaded quotation - Current revision: ${data.revisionNumber}`);
      setRevisionNumber(data.revisionNumber.toString());
      
      setSubject(data.subject);
      setProjectLocation(data.projectLocation);
      
      // Load tanks data
      if (data.tanksData && data.tanksData.tanks) {
        setTanks(data.tanksData.tanks);
        setNumberOfTanks(data.tanksData.tanks.length);
      }
      
      // Load gallon type
      if (data.tanksData && data.tanksData.gallonType) {
        const gallonMap: Record<string, string> = {
          'USG': 'US Gallons',
          'IMG': 'Imperial Gallons'
        };
        setGallonType(gallonMap[data.tanksData.gallonType] || data.tanksData.gallonType);
      }
      
      // Load form options
      if (data.formOptions) {
        setShowSubTotal(data.formOptions.showSubTotal !== false);
        setShowVat(data.formOptions.showVat !== false);
        setShowGrandTotal(data.formOptions.showGrandTotal !== false);
      }
      
      // Load additional details
      if (data.additionalData && data.additionalData.additionalDetails) {
        setAdditionalDetails(data.additionalData.additionalDetails);
      }
      
      // Load contractual terms & specifications
      if (data.terms) {
        setTerms(prev => {
          const newTerms = { ...prev };
          
          // Update each term section if it exists in loaded data
          Object.keys(data.terms).forEach(key => {
            if (newTerms[key]) {
              newTerms[key] = {
                ...newTerms[key],
                ...data.terms[key]
              };
            }
          });
          
          return newTerms;
        });
      }
      
      toast.success('Quotation loaded successfully!');
    } catch (error) {
      console.error('Error loading quotation:', error);
      toast.error('Failed to load quotation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-10 pt-12">
      {/* Load Existing Quotation */}
      <Card className="border border-green-200 rounded-xl shadow-sm bg-green-50">
        <CardHeader className="bg-green-100 text-green-700 border-b border-green-200 rounded-t-xl px-6 py-3">
          <CardTitle className="text-base font-semibold">Load Existing Quotation</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 px-6 pb-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                id="loadQuoteNumber"
                value={loadQuoteNumber}
                onChange={(e) => setLoadQuoteNumber(e.target.value)}
                placeholder="Enter quotation (e.g., 0324 or 0324-0 or 0324-1)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleLoadQuotation();
                  }
                }}
                disabled={isLoading}
              />
            </div>
            <Button 
              onClick={handleLoadQuotation} 
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Loading...' : 'Load'}
            </Button>
          </div>
          <p className="text-xs text-green-600 mt-2">
            Enter quotation number (e.g., 0324) or with revision (e.g., 0324-1)
          </p>
        </CardContent>
      </Card>

      <Card className="border border-blue-200 rounded-xl shadow-sm bg-white">
        <CardHeader className="bg-white text-blue-600 border-b border-blue-200 rounded-t-xl px-6 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Company & Recipient Details</CardTitle>
            <div className="flex items-center space-x-2">
              <Label htmlFor="revisionNumber" className="text-sm font-medium text-blue-700">Revision:</Label>
              <Input
                id="revisionNumber"
                type="number"
                min="0"
                value={revisionNumber}
                onChange={(e) => setRevisionNumber(e.target.value)}
                className="w-20 h-8 text-center"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4 px-6">
          <div>
            <Label htmlFor="fromCompany">From Company</Label>
            <AutocompleteInput
              id="fromCompany"
              options={companyOptions}
              value={fromCompany}
              onValueChange={setFromCompany}
              placeholder="Type company name..."
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const next = document.querySelector('#recipientTitle');
                  if (next) (next as HTMLElement).focus();
                }
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 grid grid-cols-4 gap-2">
              <div className="col-span-1">
                <Label>Title</Label>
                <AutocompleteInput
                  id="recipientTitle"
                  options={[
                    { value: 'Mr.', label: 'Mr.' },
                    { value: 'Ms.', label: 'Ms.' },
                  ]}
                  value={recipientTitle}
                  onValueChange={setRecipientTitle}
                  placeholder="Type title..."
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const next = document.querySelector('#recipientName');
                      if (next) (next as HTMLElement).focus();
                    }
                  }}
                />
              </div>
              <div className="col-span-3">
                <Label htmlFor="recipientName">Recipient Name</Label>
                <AutocompleteInput
                  id="recipientName"
                  value={recipientName}
                  onValueChange={(value) => {
                    console.log(`📝 Recipient name changed to: "${value}"`);
                    setRecipientName(value);
                    // Check if this value exists in recipient options (user selected from dropdown)
                    const isExistingRecipient = recipientOptions.some(opt => opt.value === value);
                    console.log(`Is existing recipient: ${isExistingRecipient}`);
                    if (isExistingRecipient) {
                      console.log(`🔄 Fetching details for: ${value}`);
                      fetchRecipientDetails(value);
                    }
                  }}
                  options={recipientOptions}
                  placeholder="Enter or select recipient name"
                  showOnFocus={false}  // Only show dropdown after typing starts
                  maxResults={10}  // Show maximum 10 recipients in dropdown
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const next = document.querySelector('#role');
                      if (next) (next as HTMLElement).focus();
                    }
                  }}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="role">Role of Recipient (Optional)</Label>
              <Input
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Enter role (optional)"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const next = document.querySelector('#companyName');
                    if (next) (next as HTMLElement).focus();
                  }
                }}
              />
            </div>

            <div>
              <Label htmlFor="companyName"> To Company Name</Label>
              <AutocompleteInput
                id="companyName"
                value={companyName}
                onValueChange={setCompanyName}
                options={companyNameOptions}
                placeholder="M/s. Company Name"
                showOnFocus={false}
                minLength={2}
                maxResults={10}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const next = document.querySelector('#location');
                    if (next) (next as HTMLElement).focus();
                  }
                }}
              />
            </div>

            <div>
              <Label htmlFor="location">Company Location (Optional)</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ajman, UAE"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const next = document.querySelector('#phoneNumber');
                    if (next) (next as HTMLElement).focus();
                  }
                }}
              />
            </div>

            <div>
              <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
              <Input
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+ 971 50 312 8233"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const next = document.querySelector('#email');
                    if (next) (next as HTMLElement).focus();
                  }
                }}
              />
            </div>

            <div>
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const next = document.querySelector('#quotationDate');
                    if (next) (next as HTMLElement).focus();
                  }
                }}
              />
            </div>

            <div>
              <Label htmlFor="quotationDate">Quotation Date</Label>
              <Input
                id="quotationDate"
                type="date"
                value={quotationDate}
                onChange={(e) => setQuotationDate(e.target.value)}
                className="[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert-[40%] [&::-webkit-calendar-picker-indicator]:sepia-[100%] [&::-webkit-calendar-picker-indicator]:saturate-[3000%] [&::-webkit-calendar-picker-indicator]:hue-rotate-[180deg] [&::-webkit-calendar-picker-indicator]:brightness-[95%]"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const next = document.querySelector('#quotationFrom');
                    if (next) (next as HTMLElement).focus();
                  }
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-blue-200 rounded-xl shadow-sm bg-white">
        <CardHeader className="bg-white text-blue-600 border-b border-blue-200 rounded-t-xl px-6 py-4">
          <CardTitle className="text-base font-semibold">Quotation Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4 px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quotationFrom">Quotation From</Label>
              <AutocompleteInput
                id="quotationFrom"
                options={[
                  { value: 'Sales', label: 'Sales' },
                  { value: 'Office', label: 'Office' },
                ]}
                value={quotationFrom}
                onValueChange={setQuotationFrom}
                placeholder="Type source..."
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (quotationFrom === 'Sales') {
                      const next = document.querySelector('#salesPerson');
                      if (next) (next as HTMLElement).focus();
                    } else if (quotationFrom === 'Office') {
                      const next = document.querySelector('#officePerson');
                      if (next) (next as HTMLElement).focus();
                    } else {
                      const next = document.querySelector('#quotationNumber');
                      if (next) (next as HTMLElement).focus();
                    }
                  }
                }}
              />
            </div>


            {quotationFrom === 'Sales' && (
              <>
                <div>
                  <Label htmlFor="salesPerson">Sales Person Name</Label>
                  <AutocompleteInput
                    options={salesPersonOptions}
                    value={salesPersonName}
                    onValueChange={setSalesPersonName}
                    placeholder="Type sales person name..."
                    id="salesPerson"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const next = document.querySelector('#officePersonSales');
                        if (next) (next as HTMLElement).focus();
                      }
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="officePersonSales">Office Person Name</Label>
                  <AutocompleteInput
                    options={officePersonOptions}
                    value={officePersonName}
                    onValueChange={setOfficePersonName}
                    placeholder="Type office person name..."
                    id="officePersonSales"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const next = document.querySelector('#quotationNumber');
                        if (next) (next as HTMLElement).focus();
                      }
                    }}
                  />
                </div>
              </>
            )}

            {quotationFrom === 'Office' && (
              <div>
                <Label htmlFor="officePerson">Office Person Name</Label>
                <AutocompleteInput
                  options={officePersonOptions}
                  value={officePersonName}
                  onValueChange={setOfficePersonName}
                  placeholder="Type office person name..."
                  id="officePerson"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const next = document.querySelector('#quotationNumber');
                      if (next) (next as HTMLElement).focus();
                    }
                  }}
                />
              </div>
            )}

            <div>
              <Label htmlFor="quotationNumber">Quotation Number</Label>
              <Input
                id="quotationNumber"
                value={quotationNumber}
                onChange={(e) => setQuotationNumber(e.target.value)}
                placeholder=""
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const next = document.querySelector('#subject');
                    if (next) (next as HTMLElement).focus();
                  }
                }}
              />
            </div>

            {revisionEnabled && (
              <div>
                <Label htmlFor="revisionNumber">Revision Number</Label>
                <Input
                  id="revisionNumber"
                  type="number"
                  value={revisionNumber}
                  onChange={(e) => setRevisionNumber(e.target.value)}
                  placeholder="Rev. No"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const next = document.querySelector('#subject');
                      if (next) (next as HTMLElement).focus();
                    }
                  }}
                />
              </div>
            )}

            <div className="md:col-span-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Supply and Installation of GRP Panel Water Tank"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const next = document.querySelector('#projectLocation');
                    if (next) (next as HTMLElement).focus();
                  }
                }}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="projectLocation">Project Location</Label>
              <Input
                id="projectLocation"
                value={projectLocation}
                onChange={(e) => setProjectLocation(e.target.value)}
                placeholder="Ajman."
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const next = document.querySelector('#numberOfTanks');
                    if (next) (next as HTMLElement).focus();
                  }
                }}
              />
            </div>

            {/* Additional Details Section */}
            <div className="md:col-span-2">
              <Label className="mb-2 block">Additional Details (Optional)</Label>
              <div className="space-y-2">
                {additionalDetails.map((detail, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2">
                    <div className="col-span-4">
                      <Input
                        placeholder="e.g., Client"
                        value={detail.key}
                        onChange={(e) => {
                          const newDetails = [...additionalDetails];
                          newDetails[idx].key = e.target.value;
                          setAdditionalDetails(newDetails);
                        }}
                      />
                    </div>
                    <div className="col-span-7">
                      <Input
                        placeholder="e.g., Rohit"
                        value={detail.value}
                        onChange={(e) => {
                          const newDetails = [...additionalDetails];
                          newDetails[idx].value = e.target.value;
                          setAdditionalDetails(newDetails);
                        }}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setAdditionalDetails(additionalDetails.filter((_, i) => i !== idx));
                        }}
                        className="h-10 w-10"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAdditionalDetails([...additionalDetails, { key: '', value: '' }]);
                  }}
                  className="w-full border-dashed"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Additional Detail
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-blue-200 rounded-xl shadow-sm bg-white">
        <CardHeader className="bg-white text-blue-600 border-b border-blue-200 rounded-t-xl px-6 py-4">
          <CardTitle className="text-base font-semibold">Tank Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numberOfTanks">Number of Types of Tanks</Label>
              <Input
                id="numberOfTanks"
                type="number"
                min="1"
                value={numberOfTanks}
                onChange={(e) => handleNumberOfTanksChange(e.target.value)}
                placeholder="Enter number of tanks"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const next = document.querySelector('#gallonType');
                    if (next) (next as HTMLElement).focus();
                  }
                }}
              />
              <div className="flex flex-row gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <Checkbox id="showSubTotal" checked={showSubTotal} onCheckedChange={(checked) => setShowSubTotal(checked === true)} className="accent-blue-600" />
                  <Label htmlFor="showSubTotal" className="text-black cursor-pointer whitespace-nowrap">Show Sub Total</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="showVat" checked={showVat} onCheckedChange={(checked) => setShowVat(checked === true)} className="accent-blue-600" />
                  <Label htmlFor="showVat" className="text-black cursor-pointer whitespace-nowrap">Show VAT 5%</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="showGrandTotal" checked={showGrandTotal} onCheckedChange={(checked) => setShowGrandTotal(checked === true)} className="accent-blue-600" />
                  <Label htmlFor="showGrandTotal" className="text-black cursor-pointer whitespace-nowrap">Show Grand Total</Label>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="gallonType">Gallon Type</Label>
              <AutocompleteInput
                id="gallonType"
                options={[
                  { value: 'US Gallons', label: 'US Gallons' },
                  { value: 'Imperial Gallons', label: 'Imperial Gallons' },
                ]}
                value={gallonType}
                onValueChange={setGallonType}
                placeholder="Type gallon type..."
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    // Focus first tank's first option's quantity input
                    const next = document.querySelector('#quantity-1-0');
                    if (next) (next as HTMLElement).focus();
                  }
                }}
              />
            </div>
          </div>

          <div className="space-y-4 mt-6">
            {tanks.map((tank, index) => (
              <TankForm
                key={index}
                tankNumber={tank.tankNumber}
                data={tank}
                onChange={(data) => updateTank(index, data)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contractual Terms & Specifications Section */}
      <Card className="border border-blue-200 rounded-xl shadow-sm bg-white">
        <CardHeader className="bg-white text-blue-600 border-b border-blue-200 rounded-t-xl px-6 py-4">
          <CardTitle className="text-base font-semibold">Contractual Terms & Specifications</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4 px-6">
          <div className="space-y-6">
            {termsList.map(term => (
              <div key={term.key} className="flex flex-col gap-2 p-4 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Checkbox
                    id={term.key}
                    checked={terms[term.key].action}
                    onCheckedChange={(checked) => handleTermActionChange(term.key, checked as boolean)}
                  />
                  <Label htmlFor={term.key} className="font-semibold text-black cursor-pointer">{term.label}</Label>
                </div>
                {terms[term.key].action && (
                  <div className="space-y-2">
                    {/* Existing details, editable */}
                    {terms[term.key].details.map((detail, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input
                          value={detail}
                          onChange={e => handleEditDetail(term.key, idx, e.target.value)}
                          className="flex-1"
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              // Try to focus next detail input or custom input
                              const next = (e.target as HTMLElement).parentElement?.nextElementSibling?.querySelector('input');
                              if (next) (next as HTMLElement).focus();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveDetail(term.key, idx)}
                          className="p-2 text-blue-600 hover:text-blue-700"
                          aria-label="Delete point"
                        >
                          <Trash2 className="w-4 h-4 text-blue-600" />
                        </button>
                      </div>
                    ))}
                    {/* Custom added points */}
                    {terms[term.key].custom.map((custom, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input
                          value={custom}
                          onChange={e => handleEditCustom(term.key, idx, e.target.value)}
                          className="flex-1"
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              // Try to focus next custom input or new point input
                              const next = (e.target as HTMLElement).parentElement?.nextElementSibling?.querySelector('input');
                              if (next) (next as HTMLElement).focus();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveCustom(term.key, idx)}
                          className="p-2 text-blue-600 hover:text-blue-700"
                          aria-label="Delete custom point"
                        >
                          <Trash2 className="w-4 h-4 text-blue-600" />
                        </button>
                      </div>
                    ))}
                    {/* Add new point */}
                    <div className="flex gap-2 items-center mt-2">
                      <Input
                        placeholder={`Add new point to ${term.label}`}
                        value={terms[term.key].newPoint || ''}
                        onChange={e => setTerms(prev => ({
                          ...prev,
                          [term.key]: {
                            ...prev[term.key],
                            newPoint: e.target.value,
                          }
                        }))}
                        className="flex-1"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            // Optionally blur or focus next section
                            (e.target as HTMLElement).blur();
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        className="bg-blue-400 hover:bg-blue-500 text-white rounded-lg transition-colors duration-200 shadow-sm"
                        onClick={() => {
                          const newPoint = terms[term.key].newPoint;
                          if (newPoint && newPoint.trim() !== '') {
                            handleAddCustom(term.key, newPoint);
                            setTerms(prev => ({
                              ...prev,
                              [term.key]: {
                                ...prev[term.key],
                                newPoint: '',
                              }
                            }));
                          }
                        }}
                      >
                        <span className="flex items-center gap-1">
                          <Plus className="w-4 h-4 text-white" /> Add
                        </span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          onClick={handleSave}
          className="bg-green-400 hover:bg-green-500 text-white px-8 py-4 text-base rounded-xl transition-colors duration-200 shadow-sm font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          Save Quotation
        </Button>
        <Button
          onClick={handleExport}
          className="bg-blue-400 hover:bg-blue-500 text-white px-8 py-4 text-base rounded-xl transition-colors duration-200 shadow-sm font-medium"
        >
          <FileDown className="mr-2 h-5 w-5 text-white" />
          Export Quotation
        </Button>
      </div>
    </div>
  );
}
