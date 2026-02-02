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

interface NewQuotationFormProps {
  onPreviewUpdate: (html: string) => void;
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
  }>;
}

export default function NewQuotationForm({ onPreviewUpdate }: NewQuotationFormProps) {
  const [fromCompany, setFromCompany] = useState('');
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
  const [quotationNumber, setQuotationNumber] = useState('');
  const [revisionEnabled, setRevisionEnabled] = useState(false);
  const [revisionNumber, setRevisionNumber] = useState('0');
  const [subject, setSubject] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [numberOfTanks, setNumberOfTanks] = useState(1);
  const [gallonType, setGallonType] = useState('');
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
      }];
    }
    setTanks(newTanks);
  };

  // Generate live preview HTML
  const generatePreview = () => {
    // Construct quotation number
    const companyCodeMap: Record<string, string> = {
      'GRP TANKS TRADING L.L.C': 'GRPT',
      'GRP PIPECO TANKS TRADING L.L.C': 'GRPPT',
      'COLEX TANKS TRADING L.L.C': 'CLX',
    };
    const companyCode = fromCompany ? companyCodeMap[fromCompany] || '' : '';
    
    // Extract YYMM from date
    const dateObj = new Date(quotationDate);
    const yy = String(dateObj.getFullYear()).slice(-2);
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yymm = `${yy}${mm}`;
    
    // Extract sales code
    const salesCode = salesPersonName && salesPersonName.includes('(') 
      ? salesPersonName.split('(')[1].split(')')[0] 
      : (quotationFrom === 'Office' ? 'OFC' : '');
    
    const fullQuoteNumber = quotationNumber 
      ? `${companyCode}/${yymm}/${salesCode}/${quotationNumber}` 
      : '';

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
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${idx + 1}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${option.tankName || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${option.tankType || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${option.length || '-'} × ${option.width || '-'} × ${option.height || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${volumeM3} m³ (${gallons} ${gallonType === 'US Gallons' ? 'USG' : 'IMG'})</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${qty}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">AED ${unitPrice.toLocaleString()}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">AED ${total.toLocaleString()}</td>
          </tr>
        `;
      })
    ).join('');

    const vat = showVat ? subTotal * 0.05 : 0;
    const grandTotal = showGrandTotal ? subTotal + vat : subTotal;

    const previewHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 4px;">
        <div style="background: linear-gradient(to right, #2563eb, #1e40af); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 10px 0;">${fromCompany || 'Company Name'}</h2>
          <p style="margin: 0; opacity: 0.9;">QUOTATION</p>
        </div>

        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <p style="margin: 5px 0;"><strong>To:</strong> ${recipientTitle} ${recipientName || '-'}</p>
              ${role ? `<p style="margin: 5px 0;"><strong>Role:</strong> ${role}</p>` : ''}
              <p style="margin: 5px 0;"><strong>Company:</strong> ${companyName || '-'}</p>
              ${location ? `<p style="margin: 5px 0;"><strong>Location:</strong> ${location}</p>` : ''}
              ${phoneNumber && phoneNumber !== '+971' ? `<p style="margin: 5px 0;">${phoneNumber}</p>` : ''}
              ${email ? `<p style="margin: 5px 0;">${email}</p>` : ''}
            </div>
            <div style="text-align: right;">
              <p style="margin: 5px 0;"><strong>Quote No:</strong> ${fullQuoteNumber || '-'}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${quotationDate || '-'}</p>
              ${revisionEnabled ? `<p style="margin: 5px 0;"><strong>Revision:</strong> ${revisionNumber}</p>` : ''}
              ${quotationFrom === 'Sales' && salesPersonName ? `<p style="margin: 5px 0;"><strong>Sales Person:</strong> ${salesPersonName}</p>` : ''}
            </div>
          </div>
        </div>

        ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
        ${projectLocation ? `<p><strong>Project Location:</strong> ${projectLocation}</p>` : ''}

        <div style="margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #2563eb; color: white;">
                <th style="border: 1px solid #ddd; padding: 8px;">SL</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Tank Name</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Type</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Dimensions (L×W×H)</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Capacity</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Qty</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Unit Price</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${tankRows || '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #94a3b8;">No tanks added yet</td></tr>'}
            </tbody>
          </table>
        </div>

        ${showSubTotal || showVat || showGrandTotal ? `
          <div style="margin: 20px 0; text-align: right;">
            ${showSubTotal ? `<p style="margin: 5px 0;"><strong>Sub Total:</strong> AED ${subTotal.toLocaleString()}</p>` : ''}
            ${showVat ? `<p style="margin: 5px 0;"><strong>VAT (5%):</strong> AED ${vat.toLocaleString()}</p>` : ''}
            ${showGrandTotal ? `<p style="margin: 5px 0; font-size: 18px; color: #2563eb;"><strong>Grand Total:</strong> AED ${grandTotal.toLocaleString()}</p>` : ''}
          </div>
        ` : ''}

        <div style="margin-top: 30px; padding: 15px; background: #f1f5f9; border-left: 4px solid #2563eb; border-radius: 4px;">
          <p style="margin: 0; color: #64748b; font-size: 14px;">
            <em>This is a live preview. Fill in the form to see your quotation take shape!</em>
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
    gallonType, tanks, showSubTotal, showVat, showGrandTotal
  ]);

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

      // Save to database via backend API for record keeping (optional - won't block if it fails)
      try {
        const saveResponse = await fetch('http://localhost:8000/api/quotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromCompany,
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
            quotationNumber,
            revisionEnabled,
            revisionNumber,
            subject,
            projectLocation,
            gallonType: formattedGallonType,
            numberOfTanks: tanks.length,
            showSubTotal,
            showVat,
            showGrandTotal,
            tanks,
            terms: formattedTerms,
          })
        });

        if (saveResponse.ok) {
          const savedData = await saveResponse.json();
          console.log('Quotation saved to database:', savedData.id);
        }
      } catch (dbError) {
        // Database save failed, but continue with document generation
        console.warn('Failed to save to database (continuing anyway):', dbError);
      }

      // Send all data to Python backend for document generation
      const response = await fetch('/api/generate-quotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromCompany,
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
          quotationNumber,
          revisionEnabled,
          revisionNumber,
          subject,
          projectLocation,
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
        a.href = url;
        a.download = `quotation_${quotationNumber.replace(/\//g, '_')}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Document generated successfully!');
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
        'Price: The given prices are based on the supply and installation of the tank at your proposed site.',
        'Validity: The offer is valid for 30 days only.',
        'Delivery: One week from the receipt of advance payment.',
        'Payment: Cash/CDC. 40% advance along with the confirmed order and 60% upon delivery of the material at the site. (In the event of late payment, a late payment charge of 2% per month on the contract value will be applied till the outstanding payment is settled).'
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

  return (
    <div className="space-y-6 pt-4">
      <Card className="border-0 rounded-lg">
        <CardHeader className="bg-white text-black border-b-2 border-slate-200 rounded-t-lg">
          <CardTitle>Company & Recipient Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label htmlFor="fromCompany">From Company</Label>
            <AutocompleteInput
              options={[
                { value: 'GRP TANKS TRADING L.L.C', label: 'GRP TANKS TRADING L.L.C' },
                { value: 'GRP PIPECO TANKS TRADING L.L.C', label: 'GRP PIPECO TANKS TRADING L.L.C' },
                { value: 'COLEX TANKS TRADING L.L.C', label: 'COLEX TANKS TRADING L.L.C' },
              ]}
              value={fromCompany}
              onValueChange={setFromCompany}
              placeholder="Type company name..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 grid grid-cols-4 gap-2">
              <div className="col-span-1">
                <Label>Title</Label>
                <AutocompleteInput
                  options={[
                    { value: 'Mr.', label: 'Mr.' },
                    { value: 'Ms.', label: 'Ms.' },
                  ]}
                  value={recipientTitle}
                  onValueChange={setRecipientTitle}
                  placeholder="Type title..."
                />
              </div>
              <div className="col-span-3">
                <Label htmlFor="recipientName">Recipient Name</Label>
                <Input
                  id="recipientName"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Hridya."
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
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="M/s. Company Name"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const next = document.querySelector('#location');
                    if (next) (next as HTMLElement).focus();
                  }
                }}
              />
            </div>

            <div>
              <Label htmlFor="location">Location (Optional)</Label>
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

      <Card className="border-0 rounded-lg">
        <CardHeader className="bg-white text-black border-b-2 border-slate-200 rounded-t-lg">
          <CardTitle>Quotation Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quotationFrom">Quotation From</Label>
              <AutocompleteInput
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
                      }
                    }
                  }}
              />
            </div>


            {quotationFrom === 'Sales' && (
              <div>
                <Label htmlFor="salesPerson">Sales Person Name</Label>
                <AutocompleteInput
                  options={[
                    { value: 'Viwin Varghese (VM)', label: 'Viwin Varghese (VM)' },
                    { value: 'Midhun Murali (MM)', label: 'Midhun Murali (MM)' },
                    { value: 'Somiya Joy (SJ)', label: 'Somiya Joy (SJ)' },
                    { value: 'AKSHAYA SHAJI (AS)', label: 'AKSHAYA SHAJI (AS)' },
                    { value: 'Vismay Krishnan (VK)', label: 'Vismay Krishnan (VK)' },
                    { value: 'LEYON PAUL (LP)', label: 'LEYON PAUL (LP)' },
                  ]}
                  value={salesPersonName}
                  onValueChange={setSalesPersonName}
                  placeholder="Type sales person name..."
                    id="salesPerson"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const next = document.querySelector('#quotationNumber');
                        if (next) (next as HTMLElement).focus();
                      }
                    }}
                />
              </div>
            )}

            {quotationFrom === 'Office' && (
              <div>
                <Label htmlFor="officePerson">Office Person Name</Label>
                <Input
                  id="officePerson"
                  value={salesPersonName}
                  onChange={(e) => setSalesPersonName(e.target.value)}
                  placeholder="Type office person name..."
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

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                  <Checkbox
                    id="revision"
                    checked={revisionEnabled}
                    onCheckedChange={(checked) =>
                      setRevisionEnabled(checked as boolean)
                    }
                    className="accent-blue-600"
                  />
                <Label htmlFor="revision" className="cursor-pointer">
                  Enable Revision
                </Label>
              </div>
              {revisionEnabled && (
                <Input
                  type="number"
                  value={revisionNumber}
                  onChange={(e) => setRevisionNumber(e.target.value)}
                  placeholder="Rev. No"
                  className="w-24"
                />
              )}
            </div>

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
                    // End of Quotation Information section, optionally blur
                    (e.target as HTMLElement).blur();
                  }
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 rounded-lg">
        <CardHeader className="bg-white text-black border-b-2 border-slate-200 rounded-t-lg">
          <CardTitle>Tank Details</CardTitle>
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
                options={[
                  { value: 'US Gallons', label: 'US Gallons' },
                  { value: 'Imperial Gallons', label: 'Imperial Gallons' },
                ]}
                value={gallonType}
                onValueChange={setGallonType}
                placeholder="Type gallon type..."
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
      <Card className="border-0 rounded-lg">
        <CardHeader className="bg-white text-black border-b-2 border-slate-200 rounded-t-lg">
          <CardTitle>Contractual Terms & Specifications</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-6">
            {termsList.map(term => (
              <div key={term.key} className="flex flex-col gap-2 p-4 border rounded-md">
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
                          className="p-2 text-blue-600 hover:text-blue-800"
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
                          className="p-2 text-blue-600 hover:text-blue-800"
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
                        className="bg-blue-600 hover:bg-blue-700 text-white"
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

      <div className="flex justify-end">
        <Button
          onClick={handleExport}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg rounded-md"
        >
          <FileDown className="mr-2 h-5 w-5 text-white" />
          Export Quotation
        </Button>
      </div>
    </div>
  );
}
