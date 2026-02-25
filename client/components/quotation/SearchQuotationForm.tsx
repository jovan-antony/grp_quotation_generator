'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { getApiUrl } from '@/lib/api-config';

interface SearchQuotationFormProps {
  onPreviewUpdate: (html: string) => void;
  onLoadQuotation?: (quotationData: any) => void;
  onCompanyChange?: (code: string) => void;
  isActive?: boolean;
  isPageReload?: boolean;
}

export default function SearchQuotationForm({
  onPreviewUpdate,
  onLoadQuotation,
  onCompanyChange,
  isActive = true,
  isPageReload = false,
}: SearchQuotationFormProps) {
  const [filters, setFilters] = useState({
    recipientName: false,
    companyName: false,
    date: false,
    quoteNo: false,
    generatedBy: false,
    phoneNumber: false,
    subject: false,
    email: false,
    salesPerson: false,
    officePerson: false,
    tankType: false,
    supportSystem: false,
    tankSize: false,
  });

  const [searchValues, setSearchValues] = useState({
    recipientName: '',
    companyName: '',
    dateFrom: '',
    dateTo: '',
    fromCompany: '',
    yearMonth: '',
    series: '',
    quotationNumber: '',
    generatedBy: '',
    phoneNumber: '',
    subject: '',
    email: '',
    salesPerson: '',
    officePerson: '',
    tankType: '',
    supportSystem: '',
    tankLength: '',
    tankWidth: '',
    tankHeight: '',
  });

  const [dateFilterType, setDateFilterType] = useState<'day' | 'week' | 'month'>('day');
  const [quotations, setQuotations] = useState<any[]>([]);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [leftPersonSig,  setLeftPersonSig]  = useState({ name: '', title: '', mobile: '', email: '', signatureImage: '' });
  const [rightPersonSig, setRightPersonSig] = useState({ name: '', title: '', mobile: '', email: '', signatureImage: '' });

  // Load form data from sessionStorage on component mount (only if not a page reload)
  useEffect(() => {
    // Don't restore from sessionStorage on page reload
    if (isPageReload) {
      console.log('⏭ Skipping sessionStorage restore - page reload detected');
      return;
    }
    
    const savedFormData = sessionStorage.getItem('searchQuotationFormData');
    if (savedFormData) {
      try {
        const formData = JSON.parse(savedFormData);
        
        // Restore all form state
        if (formData.filters !== undefined) setFilters(formData.filters);
        if (formData.searchValues !== undefined) setSearchValues(formData.searchValues);
        if (formData.dateFilterType !== undefined) setDateFilterType(formData.dateFilterType);
        if (formData.quotations !== undefined) setQuotations(formData.quotations);
        if (formData.selectedQuotation !== undefined) setSelectedQuotation(formData.selectedQuotation);
        
        console.log('✓ Search form data restored from session');
      } catch (error) {
        console.error('Error restoring search form data:', error);
      }
    }
  }, [isPageReload]); // Re-run if isPageReload changes

  // Save form data to sessionStorage whenever state changes (only when active)
  useEffect(() => {
    if (!isActive) return; // Only save when this tab is active
    
    const formData = {
      filters,
      searchValues,
      dateFilterType,
      quotations,
      selectedQuotation,
    };
    
    sessionStorage.setItem('searchQuotationFormData', JSON.stringify(formData));
  }, [isActive, filters, searchValues, dateFilterType, quotations, selectedQuotation]);

  const handleSearch = async () => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (filters.recipientName && searchValues.recipientName) {
        params.append('recipient_name', searchValues.recipientName);
      }
      
      if (filters.companyName && searchValues.companyName) {
        params.append('company_name', searchValues.companyName);
      }
      
      if (filters.date) {
        if (searchValues.dateFrom) {
          params.append('date_from', searchValues.dateFrom);
        }
        if (searchValues.dateTo) {
          params.append('date_to', searchValues.dateTo);
        }
      }
      
      if (filters.quoteNo) {
        // Send each component separately for independent filtering
        if (searchValues.fromCompany) {
          params.append('quote_company', searchValues.fromCompany);
        }
        if (searchValues.yearMonth) {
          params.append('quote_yearmonth', searchValues.yearMonth);
        }
        if (searchValues.series) {
          params.append('quote_series', searchValues.series);
        }
        if (searchValues.quotationNumber) {
          params.append('quote_number', searchValues.quotationNumber);
        }
      }
      
      if (filters.generatedBy && searchValues.generatedBy) {
        params.append('generated_by', searchValues.generatedBy);
      }
      
      if (filters.phoneNumber && searchValues.phoneNumber) {
        params.append('phone_number', searchValues.phoneNumber);
      }
      
      if (filters.subject && searchValues.subject) {
        params.append('subject', searchValues.subject);
      }
      
      if (filters.email && searchValues.email) {
        params.append('email', searchValues.email);
      }
      
      if (filters.salesPerson && searchValues.salesPerson) {
        params.append('sales_person', searchValues.salesPerson);
      }
      
      if (filters.officePerson && searchValues.officePerson) {
        params.append('office_person', searchValues.officePerson);
      }
      
      if (filters.tankType && searchValues.tankType) {
        params.append('tank_type', searchValues.tankType);
      }
      
      if (filters.supportSystem && searchValues.supportSystem) {
        params.append('support_system', searchValues.supportSystem);
      }
      
      if (filters.tankSize) {
        if (searchValues.tankLength) {
          params.append('tank_length', searchValues.tankLength);
        }
        if (searchValues.tankWidth) {
          params.append('tank_width', searchValues.tankWidth);
        }
        if (searchValues.tankHeight) {
          params.append('tank_height', searchValues.tankHeight);
        }
      }
      
      const response = await fetch(getApiUrl(`api/quotations?${params.toString()}`));
      
      if (!response.ok) {
        throw new Error('Failed to fetch quotations');
      }
      
      const data = await response.json();
      setQuotations(data.quotations || []);
      toast.success(`Found ${data.count || 0} quotation(s)`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to search quotations');
    }
  };

  const handleSelectQuotation = async (quotation: any) => {
    try {
      const response = await fetch(getApiUrl(`api/quotations/${quotation.id}`));
      
      if (!response.ok) {
        throw new Error('Failed to fetch quotation details');
      }
      
      const data = await response.json();
      setSelectedQuotation({ ...data.quotation, tanks: data.tanks });
      toast.success('Quotation loaded successfully');

      // Notify parent of company code for header image
      const fullQuoteNumber = data.quotation?.full_main_quote_number || '';
      const detectedCode = fullQuoteNumber.split('/')[0] || '';
      onCompanyChange?.(detectedCode);

      // Fetch company name for signature
      let fromCompanyName = '';
      try {
        const cdRes = await fetch(getApiUrl(`api/company-details?code=${detectedCode}`));
        if (cdRes.ok) { const cd = await cdRes.json(); fromCompanyName = cd.company_name || ''; }
      } catch {}

      // Fetch person details for signature
      const quotationFrom = data.quotation?.quotation_from || '';
      const salesName  = data.quotation?.sales_person_name  || '';
      const officeName = data.quotation?.office_person_name || '';

      const fetchSig = async (name: string, type: 'sales' | 'office') => {
        if (!name) return { name: '', title: '', mobile: '', email: '', signatureImage: '' };
        try {
          const res = await fetch(getApiUrl(`api/person-details?name=${encodeURIComponent(name)}&type=${type}&company=${encodeURIComponent(fromCompanyName || detectedCode)}`));
          if (res.ok) { const d = await res.json(); return { name: d.name || name, title: d.designation || '', mobile: d.mobile || '', email: d.email || '', signatureImage: d.signatureImage || '' }; }
        } catch {}
        return { name, title: '', mobile: '', email: '', signatureImage: '' };
      };

      let leftSig  = { name: '', title: '', mobile: '', email: '', signatureImage: '' };
      let rightSig = { name: '', title: '', mobile: '', email: '', signatureImage: '' };
      if (quotationFrom === 'Sales') {
        [leftSig, rightSig] = await Promise.all([fetchSig(salesName, 'sales'), fetchSig(officeName, 'office')]);
      } else if (quotationFrom === 'Office') {
        rightSig = await fetchSig(officeName, 'office');
      }
      setLeftPersonSig(leftSig);
      setRightPersonSig(rightSig);

      // Generate preview HTML for the selected quotation
      const previewHtml = generateQuotationPreview(data.quotation, data.tanks, data.terms, leftSig, rightSig, fromCompanyName);
      onPreviewUpdate(previewHtml);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load quotation details');
    }
  };

  const generateQuotationPreview = (quotation: any, tanksData: any, termsData?: any, leftSig?: {name:string;title:string;mobile:string;email:string;signatureImage?:string}, rightSig?: {name:string;title:string;mobile:string;email:string;signatureImage?:string}, fromCompanyName?: string) => {
    // ── Extract data ─────────────────────────────────────────────────────────
    const tanksArray: any[] = (tanksData?.tanks) || [];
    const gallonType: string = tanksData?.gallonType || 'US Gallons';

    // ── Date (already formatted as "DD/MM/YY" by API) ────────────────────────
    const displayDate = quotation.quotation_date || '—';

    // ── Quote number ─────────────────────────────────────────────────────────
    const fullQuoteNumber = quotation.full_main_quote_number || quotation.quotation_number || '';
    const revNum = parseInt(quotation.revision_number || '0');
    const displayQuoteNumber = (fullQuoteNumber && revNum > 0)
      ? `${fullQuoteNumber}-R${revNum}`
      : fullQuoteNumber;

    // ── Company-specific theme ──────────────────────────────────────────────
    const companyCode = (fullQuoteNumber || '').split('/')[0] || '';
    const isColex         = companyCode === 'CLX';
    const headerRowColor  = isColex ? '#A3B463' : '#5F9EA0';
    const quoteBoxTextColor = '#147BC5';
    const brandName = isColex ? 'COLEX KOREA' : 'PIPECO TANKS\u00AE\u2013MALAYSIA';

    // ── Form options ─────────────────────────────────────────────────────────
    const formOptions = quotation.formOptions || {};
    const showSubTotal  = formOptions.showSubTotal  !== false;
    const showVat       = formOptions.showVat       || false;
    const showGrandTotal= formOptions.showGrandTotal !== false;

    // ── Additional details ───────────────────────────────────────────────────
    const additionalDetails: { key: string; value: string }[] =
      quotation.additionalData?.additionalDetails || [];

    // ── Gallon settings ──────────────────────────────────────────────────────
    const isImpGallon = gallonType === 'Imperial Gallons' || gallonType === 'IMP Gallons';
    const gallonAbbr  = isImpGallon ? 'IMP GALLON' : 'USG';
    const gallonMult  = isImpGallon ? 219.969 : 264.172;

    // Handle plain values AND partition notation like "2(1+1)" → use only the part before "("
    const parseDim = (s: string) => {
      const clean = (s || '').split('(')[0].trim();
      const n = parseFloat(clean.replace(/[^0-9.]/g, ''));
      return isNaN(n) ? 0 : n;
    };

    // ── Determine common elements ────────────────────────────────────────────
    const allOpts    = tanksArray.flatMap((t: any) => t.options || []);
    const allTypes   = allOpts.map((o: any) => (o.tankType || '').trim().toUpperCase());
    const allSupport = allOpts.map((o: any) => o.supportSystem || 'Internal');
    const commonType    = allTypes.length > 0 && allTypes.every((t: string) => t === allTypes[0] && t !== '') ? allTypes[0] : null;
    const commonSupport = allSupport.length > 0 && allSupport.every((s: string) => s === allSupport[0]) ? allSupport[0] : null;

    const supportLabel = () => 'INTERNAL SS 316 AND EXTERNAL HDG SUPPORT SYSTEM';

    let commonLine1 = `GRP SECTIONAL WATER TANK - 10 YEAR WARRANTY - ${brandName}`;
    if (commonSupport) commonLine1 += ` - ${supportLabel()}`;
    const commonRowHtml = [
      `<div style="font-weight:bold;font-size:11px;line-height:1.35;">${commonLine1}</div>`,
      commonType ? `<div style="font-weight:bold;font-size:11px;line-height:1.35;">${commonType}</div>` : '',
    ].filter(Boolean).join('');

    // ── Discount flag ─────────────────────────────────────────────────────────
    const hasAnyDiscount = tanksArray.some((t: any) => (t.options || []).some((o: any) => o.hasDiscount));

    // ── Pre-calculate subtotal ───────────────────────────────────────────────
    let subTotal = 0;
    tanksArray.forEach((tank: any) =>
      (tank.options || []).forEach((opt: any) => {
        const q  = Number(opt.quantity)  || 0;
        const up = Number(opt.unitPrice) || 0;
        const hasDisc = opt.hasDiscount || false;
        const discTot = hasDisc ? (Number(opt.discountedTotalPrice) || 0) : 0;
        subTotal += hasDisc ? discTot : q * up;
      })
    );

    // ── Build tank rows ──────────────────────────────────────────────────────
    let slNo = 1;
    const cellBorder = '1px solid #000000';
    const noBorder   = 'none';

    const tankRowsHtml = tanksArray.flatMap((tank: any, tIdx: number) => {
      const opts = tank.options || [];
      const numOpts = opts.length;
      return opts.map((opt: any, oIdx: number) => {
        const qty      = Number(opt.quantity)  || 0;
        const unitPrice = Number(opt.unitPrice) || 0;
        const hasDisc  = opt.hasDiscount || false;
        const discTot  = hasDisc ? (Number(opt.discountedTotalPrice) || 0) : 0;
        const total    = hasDisc ? discTot : qty * unitPrice;

        const L = parseDim(opt.length);
        const W = parseDim(opt.width);
        const H = parseDim(opt.height);
        const volM3    = L * W * H;
        const gallons  = volM3 * gallonMult;

        const needFB   = opt.needFreeBoard || false;
        // freeBoardSize is stored in CM (as entered in TankForm "Free Board Size (CM)")
        const freeBoardCM = needFB ? (parseFloat(opt.freeBoardSize || '30') || 30) : 0;
        const fbM    = freeBoardCM / 100;
        const fbCm   = freeBoardCM;
        const netVolM3 = L * W * Math.max(0, H - fbM);
        const netGall  = netVolM3 * gallonMult;

        const isFirst  = oIdx === 0;
        const curSlNo  = isFirst ? slNo++ : slNo - 1;
        const rowBg    = tIdx % 2 === 0 ? '#ffffff' : '#f9fafb';

        const desc: string[] = [];
        const hasMultiOpts = tank.optionEnabled && numOpts > 1;
        const romans = ['I','II','III','IV','V','VI','VII','VIII'];

        if (hasMultiOpts) {
          const label = `OPTION ${romans[oIdx] || oIdx + 1}`;
          desc.push(
            commonSupport
              ? `<div style="font-weight:bold;font-size:11px;">${label}</div>`
              : `<div style="font-weight:bold;font-size:11px;">${label} \u2013 ${supportLabel()}</div>`
          );
        } else if (!commonSupport) {
          desc.push(`<div style="font-weight:bold;font-size:11px;">${supportLabel()}</div>`);
        }

        const partSuffix = opt.hasPartition ? ' (WITH PARTITION)' : '';
        const tankName   = ((opt.tankName || '') + partSuffix).trim().toUpperCase();
        if (tankName)  desc.push(`<div style="font-weight:bold;text-decoration:underline;font-size:11px;">${tankName}</div>`);

        if (!commonType && opt.tankType)
          desc.push(`<div style="font-weight:bold;font-size:11px;">TYPE&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;${opt.tankType.toUpperCase()}</div>`);

        const sizeFrags = [
          (opt.length || '').trim() ? `${(opt.length || '').trim()} M (L)` : '',
          (opt.width  || '').trim() ? `${(opt.width  || '').trim()} M (W)` : '',
          (opt.height || '').trim() ? `${(opt.height || '').trim()} M (H)` : '',
        ].filter(Boolean);
        if (sizeFrags.length)
          desc.push(`<div style="font-weight:bold;font-size:11px;">SIZE&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;${sizeFrags.join(' X ')}</div>`);

        if (volM3 > 0) {
          desc.push(`<div style="font-weight:bold;font-size:11px;">TOTAL CAPACITY&nbsp;:&nbsp;${volM3.toFixed(2)} M\u00B3 (${Math.round(gallons).toLocaleString()} ${gallonAbbr})</div>`);
          if (needFB) {
            desc.push(`<div style="font-weight:bold;font-size:11px;">NET VOLUME&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;${netVolM3.toFixed(2)} M\u00B3 (${Math.round(netGall).toLocaleString()} ${gallonAbbr})</div>`);
            desc.push(`<div style="font-weight:bold;font-size:11px;">FREE BOARD&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;${fbCm.toFixed(0)} CM (${fbM.toFixed(2)} M)</div>`);
          }
        }

        return `
          <tr style="background:${rowBg};">
            ${isFirst
              ? `<td rowspan="${numOpts}" style="border:${cellBorder};padding:5px 6px;text-align:center;vertical-align:middle;font-weight:bold;font-size:11px;font-family:Calibri,sans-serif;">${curSlNo}</td>`
              : ''}
            <td style="border:${cellBorder};padding:5px 7px;vertical-align:top;font-family:Calibri,sans-serif;">${desc.join('') || '<span style="font-size:11px;color:#aaa;">&mdash;</span>'}</td>
            <td style="border:${cellBorder};padding:5px 6px;text-align:center;vertical-align:middle;font-weight:bold;font-size:11px;font-family:Calibri,sans-serif;">${opt.unit || 'Nos'}</td>
            <td style="border:${cellBorder};padding:5px 6px;text-align:center;vertical-align:middle;font-weight:bold;font-size:11px;font-family:Calibri,sans-serif;">${qty || ''}</td>
            <td style="border:${cellBorder};padding:5px 6px;text-align:right;vertical-align:middle;font-size:11px;font-family:Calibri,sans-serif;">${unitPrice ? unitPrice.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) : ''}</td>
            <td style="border:${cellBorder};padding:5px 6px;text-align:right;vertical-align:middle;font-weight:bold;font-size:11px;font-family:Calibri,sans-serif;">${total ? total.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) : ''}</td>
          </tr>`;
      });
    }).join('');

    // ── Footer rows ──────────────────────────────────────────────────────────
    const vat        = showVat ? subTotal * 0.05 : 0;
    const grandTotal = subTotal + vat;
    let footerHtml   = '';

    const fRow = (label: string, amount: string, isGrand = false) => `
      <tr>
        <td colspan="2" style="border:${noBorder};"></td>
        <td colspan="2" style="border:${cellBorder};padding:4px 7px;font-weight:bold;font-size:11px;font-family:Calibri,sans-serif;${isGrand ? 'font-size:11.5px;' : ''}">${label}</td>
        <td style="border:${cellBorder};padding:4px 6px;text-align:center;font-weight:bold;font-size:11px;font-family:Calibri,sans-serif;">AED</td>
        <td style="border:${cellBorder};padding:4px 7px;text-align:right;font-weight:bold;font-size:11px;font-family:Calibri,sans-serif;${isGrand ? 'font-size:11.5px;' : ''}">${amount}</td>
      </tr>`;

    if (showSubTotal)   footerHtml += fRow(hasAnyDiscount ? 'DISCOUNTED SUB TOTAL:' : 'SUB TOTAL:',   subTotal.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}));
    if (showVat)        footerHtml += fRow('VAT 5%:',      vat.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}));
    if (showGrandTotal) footerHtml += fRow('GRAND TOTAL:', Math.round(grandTotal).toLocaleString('en-US'), true);

    // ── After-table sections (order matches Python generator) ──────────────────────
    const td = termsData || {};
    let afterTableHtml = '';

    // 1. NOTE (numbered list)
    if (td.note?.action) {
      const notePts = [...(td.note?.details || []), ...(td.note?.custom || [])].filter(Boolean);
      if (notePts.length) {
        afterTableHtml += `
          <div style="margin-top:14px;">
            <p style="font-weight:bold;font-size:11px;margin:0 0 3px;font-family:Calibri,sans-serif;">NOTE:</p>
            ${notePts.map((p: string, i: number) => `<p style="margin:1px 0;font-size:11px;font-weight:bold;font-family:Calibri,sans-serif;line-height:1.45;">${i + 1}. ${p}</p>`).join('')}
          </div>`;
      }
    }

    // 2. Closing paragraph
    const quotationFrom = quotation.quotation_from || '';
    if (quotationFrom) {
      afterTableHtml += `
        <p style="margin-top:14px;margin-bottom:0;font-size:11px;font-family:Calibri,sans-serif;line-height:1.5;">We hope the above offer meets your requirements and awaiting the valuable order confirmation.</p>
        <p style="margin:0;font-size:11px;font-family:Calibri,sans-serif;line-height:1.5;">If you have any questions concerning the offer, please contact the undersigned.</p>`;
    }

    // 3. Signature section
    if (quotationFrom) {
      const isSales = quotationFrom === 'Sales';
      // Fallback to quotation field names when API details haven't loaded
      const salesName  = (quotation.sales_person_name  || '').split('(')[0].trim();
      const officeName = (quotation.office_person_name || '').split('(')[0].trim();
      const mkFallback = (name: string, defaultTitle: string) =>
        ({ name, title: defaultTitle, mobile: '', email: '' });
      const rawLSig = isSales ? leftSig : rightSig;
      const rawRSig = isSales ? rightSig : null;
      const lSig = (rawLSig && rawLSig.name) ? rawLSig
        : (isSales && salesName ? mkFallback(salesName, 'Sales Executive')
          : (officeName ? mkFallback(officeName, 'Manager - Projects') : null));
      const rSig = (rawRSig && rawRSig.name) ? rawRSig
        : (isSales && officeName ? mkFallback(officeName, 'Manager - Projects') : null);

      const sigCell = (sig: {name:string;title:string;mobile:string;email:string;signatureImage?:string} | null | undefined) => {
        if (!sig || !sig.name) return '';
        return [
          sig.signatureImage ? `<img src="${sig.signatureImage}" style="height:44px;max-width:130px;object-fit:contain;display:block;margin-bottom:3px;">` : '',
          sig.name   ? `<div style="font-weight:bold;font-size:11px;font-family:Calibri,sans-serif;line-height:1.6;">${sig.name}</div>` : '',
          sig.title  ? `<div style="font-weight:bold;font-size:11px;font-family:Calibri,sans-serif;line-height:1.6;">${sig.title}</div>` : '',
          sig.mobile ? `<div style="font-weight:bold;font-size:11px;font-family:Calibri,sans-serif;line-height:1.6;">MOB: ${sig.mobile}</div>` : '',
          sig.email  ? `<div style="font-size:11px;font-family:Calibri,sans-serif;line-height:1.6;"><span style="font-weight:bold;">EMAIL: </span><a href="mailto:${sig.email}" style="color:#0000FF;text-decoration:underline;">${sig.email}</a></div>` : '',
        ].join('');
      };

      afterTableHtml += `
        <div style="margin-top:16px;">
          <p style="margin:0 0 1px;font-size:11px;font-family:Calibri,sans-serif;">Yours truly,</p>
          <p style="margin:0;font-size:11px;font-weight:bold;font-style:italic;font-family:Calibri,sans-serif;">For ${fromCompanyName || companyCode}</p>
          <div style="height:8px;"></div>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="width:62%;vertical-align:top;padding:0;">${sigCell(lSig)}</td>
              <td style="width:38%;vertical-align:top;padding:0;">${sigCell(rSig)}</td>
            </tr>
          </table>
        </div>`;
    }

    // 4-11. Terms sections in correct order with ➢ bullets
    const termsSectionsDef = [
      { key: 'materialSpecification', label: 'MATERIAL SPECIFICATION: -' },
      { key: 'warrantyExclusions',    label: 'THE WARRANTY WILL NOT BE APPLICABLE FOR THE FOLLOWING CASES:' },
      { key: 'termsConditions',       label: 'TERMS AND CONDITIONS: -' },
      { key: 'supplierScope',         label: 'SUPPLIER SCOPE: -' },
      { key: 'customerScope',         label: 'CUSTOMER SCOPE: -' },
      { key: 'scopeOfWork',           label: 'SCOPE OF WORK: -' },
      { key: 'workExcluded',          label: 'WORK EXCLUDED: -' },
      { key: 'extraNote',             label: 'NOTE:' },
    ];
    for (const t of termsSectionsDef) {
      if (!td[t.key]?.action) continue;
      const pts = [...(td[t.key]?.details || []), ...(td[t.key]?.custom || [])].filter(Boolean);
      if (!pts.length) continue;
      afterTableHtml += `
        <div style="margin-top:14px;">
          <p style="font-weight:bold;font-size:11px;margin:0 0 4px;font-family:Calibri,sans-serif;">${t.label}</p>
          ${pts.map((p: string) => `<div style="display:flex;align-items:flex-start;margin:1px 0;font-family:Calibri,sans-serif;line-height:1.45;"><span style="min-width:18px;font-size:11px;">&#10146;</span><span style="font-size:11px;font-weight:bold;">${p}</span></div>`).join('')}
        </div>`;
    }

    // 12. THANK YOU
    afterTableHtml += `<div style="height:20px;"></div><p style="text-align:center;font-weight:bold;font-size:13px;color:#002060;font-family:Calibri,sans-serif;margin:0;">THANK YOU FOR YOUR BUSINESS</p>`;

    return `
      <div style="font-family:Calibri,'Segoe UI',sans-serif;background:white;padding:4px 22px 18px;">

          <p style="text-align:center;font-weight:bold;font-style:italic;text-decoration:underline;color:#002060;font-size:16px;margin:0 0 5px;font-family:Calibri,sans-serif;">QUOTATION</p>
          <p style="font-weight:bold;font-size:12px;margin:0 0 1px;font-family:Calibri,sans-serif;">To.</p>

          <table style="width:100%;border-collapse:collapse;margin-bottom:4px;">
            <tr>
              <td style="width:62%;vertical-align:top;padding:0;font-size:12px;font-weight:bold;font-family:Calibri,sans-serif;line-height:1.5;">
                ${quotation.recipient_title && quotation.recipient_name ? `${quotation.recipient_title} ${quotation.recipient_name}<br/>` : ''}
                ${quotation.role           ? `${quotation.role}<br/>`           : ''}
                ${quotation.recipient_company ? `${quotation.recipient_company}<br/>` : ''}
                ${quotation.location       ? `${quotation.location}<br/>`       : ''}
                ${quotation.phone_number   ? quotation.phone_number             : ''}
              </td>
              <td style="width:38%;vertical-align:top;padding:0;font-size:12px;font-weight:bold;font-family:Calibri,sans-serif;line-height:1.6;">
                Date&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${displayDate}<br/>
                Page&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: 1/1<br/>
                Quote No.&nbsp;&nbsp;&nbsp;&nbsp;: ${displayQuoteNumber || '&mdash;'}
              </td>
            </tr>
          </table>

          <div style="height:5px;"></div>
          ${quotation.subject        ? `<p style="margin:0;font-size:12px;font-weight:bold;font-family:Calibri,sans-serif;line-height:1.5;">Subject&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: <u>${quotation.subject}</u></p>` : ''}
          ${quotation.project_location ? `<p style="margin:0;font-size:12px;font-weight:bold;font-family:Calibri,sans-serif;line-height:1.5;">Project&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: <u>${quotation.project_location}</u></p>` : ''}
          ${additionalDetails.filter((d: any) => d.key && d.value).map((d: any) =>
            `<p style="margin:0;font-size:12px;font-weight:bold;font-family:Calibri,sans-serif;line-height:1.5;">${d.key}&nbsp;&nbsp;: <u>${d.value}</u></p>`
          ).join('')}

          <div style="height:5px;"></div>
          <p style="margin:0;font-size:12px;font-family:Calibri,sans-serif;line-height:1.5;">Dear Sir,</p>
          <p style="margin:0;font-size:12px;font-family:Calibri,sans-serif;line-height:1.5;">With reference to your enquiry, we would like to give our competitive offer for <strong>${quotation.subject || 'supply and installation'}</strong> as follows</p>

          <div style="height:6px;"></div>

          <table style="width:100%;border-collapse:collapse;border:1px solid #000;font-family:Calibri,sans-serif;">
            <thead>
              <tr style="background-color:${headerRowColor};color:#fff;">
                <th style="border:1px solid #000;padding:5px 5px;text-align:center;font-size:11px;font-weight:bold;width:5%;vertical-align:bottom;">SL.<br/>NO.</th>
                <th style="border:1px solid #000;padding:5px 5px;text-align:center;font-size:11px;font-weight:bold;width:49%;vertical-align:bottom;">ITEM DESCRIPTION</th>
                <th style="border:1px solid #000;padding:5px 5px;text-align:center;font-size:11px;font-weight:bold;width:8%;vertical-align:bottom;">UNIT</th>
                <th style="border:1px solid #000;padding:5px 5px;text-align:center;font-size:11px;font-weight:bold;width:7%;vertical-align:bottom;">QTY</th>
                <th style="border:1px solid #000;padding:5px 5px;text-align:center;font-size:11px;font-weight:bold;width:14%;vertical-align:bottom;">UNIT PRICE<br/>(AED)</th>
                <th style="border:1px solid #000;padding:5px 5px;text-align:center;font-size:11px;font-weight:bold;width:14%;vertical-align:bottom;">${hasAnyDiscount ? 'DISCOUNTED TOTAL PRICE' : 'TOTAL PRICE'}<br/>(AED)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="6" style="border:1px solid #000;padding:5px 7px;font-family:Calibri,sans-serif;">${commonRowHtml}</td>
              </tr>
              ${tankRowsHtml || '<tr><td colspan="6" style="text-align:center;padding:20px;color:#9ca3af;font-size:11px;">No tanks found</td></tr>'}
              ${footerHtml}
            </tbody>
          </table>

          ${afterTableHtml}

      </div>
    `;
  };

  return (
    <div className="space-y-3 pt-12">
      <Card className="border border-blue-200 rounded-xl shadow-sm bg-white">
        <CardHeader className="bg-white text-blue-600 border-b border-blue-200 rounded-t-xl px-6 py-2">
          <CardTitle className="flex items-center text-base font-semibold">
            <Filter className="mr-2 h-5 w-5" />
            Search Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3 space-y-3 px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="filterRecipientName"
                checked={filters.recipientName}
                onCheckedChange={(checked) =>
                  setFilters({ ...filters, recipientName: checked as boolean })
                }
              />
              <Label htmlFor="filterRecipientName" className="cursor-pointer">
                Recipient Name
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="filterCompanyName"
                checked={filters.companyName}
                onCheckedChange={(checked) =>
                  setFilters({ ...filters, companyName: checked as boolean })
                }
              />
              <Label htmlFor="filterCompanyName" className="cursor-pointer">
                Company Name
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="filterDate"
                checked={filters.date}
                onCheckedChange={(checked) =>
                  setFilters({ ...filters, date: checked as boolean })
                }
              />
              <Label htmlFor="filterDate" className="cursor-pointer">
                Date
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="filterQuoteNo"
                checked={filters.quoteNo}
                onCheckedChange={(checked) =>
                  setFilters({ ...filters, quoteNo: checked as boolean })
                }
              />
              <Label htmlFor="filterQuoteNo" className="cursor-pointer">
                Quote No
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="filterGeneratedBy"
                checked={filters.generatedBy}
                onCheckedChange={(checked) =>
                  setFilters({ ...filters, generatedBy: checked as boolean })
                }
              />
              <Label htmlFor="filterGeneratedBy" className="cursor-pointer">
                Generated By
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="filterPhoneNumber"
                checked={filters.phoneNumber}
                onCheckedChange={(checked) =>
                  setFilters({ ...filters, phoneNumber: checked as boolean })
                }
              />
              <Label htmlFor="filterPhoneNumber" className="cursor-pointer">
                Phone Number
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="filterSubject"
                checked={filters.subject}
                onCheckedChange={(checked) =>
                  setFilters({ ...filters, subject: checked as boolean })
                }
              />
              <Label htmlFor="filterSubject" className="cursor-pointer">
                Subject
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="filterEmail"
                checked={filters.email}
                onCheckedChange={(checked) =>
                  setFilters({ ...filters, email: checked as boolean })
                }
              />
              <Label htmlFor="filterEmail" className="cursor-pointer">
                Email
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="filterSalesPerson"
                checked={filters.salesPerson}
                onCheckedChange={(checked) =>
                  setFilters({ ...filters, salesPerson: checked as boolean })
                }
              />
              <Label htmlFor="filterSalesPerson" className="cursor-pointer">
                Sales Person
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="filterOfficePerson"
                checked={filters.officePerson}
                onCheckedChange={(checked) =>
                  setFilters({ ...filters, officePerson: checked as boolean })
                }
              />
              <Label htmlFor="filterOfficePerson" className="cursor-pointer">
                Office Person
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="filterTankType"
                checked={filters.tankType}
                onCheckedChange={(checked) =>
                  setFilters({ ...filters, tankType: checked as boolean })
                }
              />
              <Label htmlFor="filterTankType" className="cursor-pointer">
                Tank Type
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="filterSupportSystem"
                checked={filters.supportSystem}
                onCheckedChange={(checked) =>
                  setFilters({ ...filters, supportSystem: checked as boolean })
                }
              />
              <Label htmlFor="filterSupportSystem" className="cursor-pointer">
                Support System
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="filterTankSize"
                checked={filters.tankSize}
                onCheckedChange={(checked) =>
                  setFilters({ ...filters, tankSize: checked as boolean })
                }
              />
              <Label htmlFor="filterTankSize" className="cursor-pointer">
                Tank Size
              </Label>
            </div>
          </div>

          <div className="space-y-4">
            {filters.recipientName && (
              <div>
                <Label htmlFor="searchRecipientName">Recipient Name</Label>
                <Input
                  id="searchRecipientName"
                  value={searchValues.recipientName}
                  onChange={(e) =>
                    setSearchValues({
                      ...searchValues,
                      recipientName: e.target.value,
                    })
                  }
                  placeholder="Enter recipient name"
                  autoComplete="off"
                />
              </div>
            )}

            {filters.companyName && (
              <div>
                <Label htmlFor="searchCompanyName">Company Name</Label>
                <Input
                  id="searchCompanyName"
                  value={searchValues.companyName}
                  onChange={(e) =>
                    setSearchValues({
                      ...searchValues,
                      companyName: e.target.value,
                    })
                  }
                  placeholder="Enter company name"
                  autoComplete="off"
                />
              </div>
            )}

            {filters.date && (
              <div className="space-y-2">
                <Label>Date Filter</Label>
                <div className="flex gap-2 mb-3">
                  <Button
                    type="button"
                    variant={dateFilterType === 'day' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setDateFilterType('day');
                      setSearchValues({ ...searchValues, dateFrom: '', dateTo: '' });
                    }}
                    className={`text-xs flex-1 ${dateFilterType === 'day' ? 'bg-blue-400 text-white hover:bg-blue-500' : 'border border-blue-400 text-blue-600 bg-white hover:bg-blue-50'}`}
                  >
                    Day
                  </Button>
                  <Button
                    type="button"
                    variant={dateFilterType === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setDateFilterType('week');
                      setSearchValues({ ...searchValues, dateFrom: '', dateTo: '' });
                    }}
                    className={`text-xs flex-1 ${dateFilterType === 'week' ? 'bg-blue-400 text-white hover:bg-blue-500' : 'border border-blue-400 text-blue-600 bg-white hover:bg-blue-50'}`}
                  >
                    Week
                  </Button>
                  <Button
                    type="button"
                    variant={dateFilterType === 'month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setDateFilterType('month');
                      setSearchValues({ ...searchValues, dateFrom: '', dateTo: '' });
                    }}
                    className={`text-xs flex-1 ${dateFilterType === 'month' ? 'bg-blue-400 text-white hover:bg-blue-500' : 'border border-blue-400 text-blue-600 bg-white hover:bg-blue-50'}`}
                  >
                    Month
                  </Button>
                </div>
                
                {dateFilterType === 'day' && (
                  <div>
                    <Label htmlFor="searchDate" className="text-xs text-gray-600">Select Date</Label>
                    <Input
                      id="searchDate"
                      type="date"
                      value={searchValues.dateFrom}
                      onChange={(e) => {
                        const selectedDate = e.target.value;
                        setSearchValues({ ...searchValues, dateFrom: selectedDate, dateTo: selectedDate });
                      }}
                      autoComplete="off"
                    />
                  </div>
                )}

                {dateFilterType === 'week' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="searchWeekFrom" className="text-xs text-gray-600">Week Start</Label>
                      <Input
                        id="searchWeekFrom"
                        type="date"
                        value={searchValues.dateFrom}
                        onChange={(e) =>
                          setSearchValues({ ...searchValues, dateFrom: e.target.value })
                        }
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <Label htmlFor="searchWeekTo" className="text-xs text-gray-600">Week End</Label>
                      <Input
                        id="searchWeekTo"
                        type="date"
                        value={searchValues.dateTo}
                        onChange={(e) =>
                          setSearchValues({ ...searchValues, dateTo: e.target.value })
                        }
                        autoComplete="off"
                      />
                    </div>
                  </div>
                )}

                {dateFilterType === 'month' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="searchMonthFrom" className="text-xs text-gray-600">Month Start</Label>
                      <Input
                        id="searchMonthFrom"
                        type="date"
                        value={searchValues.dateFrom}
                        onChange={(e) =>
                          setSearchValues({ ...searchValues, dateFrom: e.target.value })
                        }
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <Label htmlFor="searchMonthTo" className="text-xs text-gray-600">Month End</Label>
                      <Input
                        id="searchMonthTo"
                        type="date"
                        value={searchValues.dateTo}
                        onChange={(e) =>
                          setSearchValues({ ...searchValues, dateTo: e.target.value })
                        }
                        autoComplete="off"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {filters.quoteNo && (
              <div className="space-y-2">
                <Label>Quote Number Components (Each can filter independently)</Label>
                <p className="text-xs text-gray-500">Example: GRPPT/2512/MM/0324</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <Label htmlFor="fromCompanyQuoteNo" className="text-xs text-gray-600">Company Code</Label>
                    <Input
                      id="fromCompanyQuoteNo"
                      placeholder="e.g., GRPPT"
                      value={searchValues.fromCompany}
                      onChange={(e) =>
                        setSearchValues({
                          ...searchValues,
                          fromCompany: e.target.value,
                        })
                      }
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <Label htmlFor="yearMonthQuoteNo" className="text-xs text-gray-600">YY/MM</Label>
                    <Input
                      id="yearMonthQuoteNo"
                      placeholder="e.g., 2512"
                      value={searchValues.yearMonth}
                      onChange={(e) =>
                        setSearchValues({
                          ...searchValues,
                          yearMonth: e.target.value,
                        })
                      }
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <Label htmlFor="seriesQuoteNo" className="text-xs text-gray-600">Series</Label>
                    <Input
                      id="seriesQuoteNo"
                      placeholder="e.g., MM, JB"
                      value={searchValues.series}
                      onChange={(e) =>
                        setSearchValues({ ...searchValues, series: e.target.value })
                      }
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <Label htmlFor="numberQuoteNo" className="text-xs text-gray-600">Number</Label>
                    <Input
                      id="numberQuoteNo"
                      placeholder="e.g., 0324"
                      value={searchValues.quotationNumber}
                      onChange={(e) =>
                        setSearchValues({
                          ...searchValues,
                          quotationNumber: e.target.value,
                        })
                      }
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>
            )}

            {filters.generatedBy && (
              <div>
                <Label htmlFor="searchGeneratedBy">Generated By</Label>
                <Input
                  id="searchGeneratedBy"
                  value={searchValues.generatedBy}
                  onChange={(e) =>
                    setSearchValues({
                      ...searchValues,
                      generatedBy: e.target.value,
                    })
                  }
                  placeholder="Enter name"
                  autoComplete="off"
                />
              </div>
            )}

            {filters.phoneNumber && (
              <div>
                <Label htmlFor="searchPhoneNumber">Phone Number</Label>
                <Input
                  id="searchPhoneNumber"
                  value={searchValues.phoneNumber}
                  onChange={(e) =>
                    setSearchValues({
                      ...searchValues,
                      phoneNumber: e.target.value,
                    })
                  }
                  placeholder="Enter phone number"
                  autoComplete="off"
                />
              </div>
            )}

            {filters.subject && (
              <div>
                <Label htmlFor="searchSubject">Subject</Label>
                <Input
                  id="searchSubject"
                  value={searchValues.subject}
                  onChange={(e) =>
                    setSearchValues({
                      ...searchValues,
                      subject: e.target.value,
                    })
                  }
                  placeholder="Enter subject"
                  autoComplete="off"
                />
              </div>
            )}

            {filters.email && (
              <div>
                <Label htmlFor="searchEmail">Email</Label>
                <Input
                  id="searchEmail"
                  value={searchValues.email}
                  onChange={(e) =>
                    setSearchValues({
                      ...searchValues,
                      email: e.target.value,
                    })
                  }
                  placeholder="Enter email"
                  autoComplete="off"
                />
              </div>
            )}

            {filters.salesPerson && (
              <div>
                <Label htmlFor="searchSalesPerson">Sales Person Name</Label>
                <Input
                  id="searchSalesPerson"
                  value={searchValues.salesPerson}
                  onChange={(e) =>
                    setSearchValues({
                      ...searchValues,
                      salesPerson: e.target.value,
                    })
                  }
                  placeholder="Enter sales person name"
                  autoComplete="off"
                />
              </div>
            )}

            {filters.officePerson && (
              <div>
                <Label htmlFor="searchOfficePerson">Office Person Name</Label>
                <Input
                  id="searchOfficePerson"
                  value={searchValues.officePerson}
                  onChange={(e) =>
                    setSearchValues({
                      ...searchValues,
                      officePerson: e.target.value,
                    })
                  }
                  placeholder="Enter office person name"
                  autoComplete="off"
                />
              </div>
            )}

            {filters.tankType && (
              <div>
                <Label htmlFor="searchTankType">Tank Type (Insulation)</Label>
                <Input
                  id="searchTankType"
                  value={searchValues.tankType}
                  onChange={(e) =>
                    setSearchValues({
                      ...searchValues,
                      tankType: e.target.value,
                    })
                  }
                  placeholder="e.g., Insulated, Non-Insulated"
                  autoComplete="off"
                />
              </div>
            )}

            {filters.supportSystem && (
              <div>
                <Label htmlFor="searchSupportSystem">Support System</Label>
                <Input
                  id="searchSupportSystem"
                  value={searchValues.supportSystem}
                  onChange={(e) =>
                    setSearchValues({
                      ...searchValues,
                      supportSystem: e.target.value,
                    })
                  }
                  placeholder="e.g., Internal, External"
                  autoComplete="off"
                />
              </div>
            )}

            {filters.tankSize && (
              <div className="space-y-2">
                <Label>Tank Size (Meters)</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="searchTankLength" className="text-xs text-gray-600">Length (M)</Label>
                    <Input
                      id="searchTankLength"
                      type="number"
                      step="0.1"
                      value={searchValues.tankLength}
                      onChange={(e) =>
                        setSearchValues({
                          ...searchValues,
                          tankLength: e.target.value,
                        })
                      }
                      placeholder="L"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <Label htmlFor="searchTankWidth" className="text-xs text-gray-600">Width (M)</Label>
                    <Input
                      id="searchTankWidth"
                      type="number"
                      step="0.1"
                      value={searchValues.tankWidth}
                      onChange={(e) =>
                        setSearchValues({
                          ...searchValues,
                          tankWidth: e.target.value,
                        })
                      }
                      placeholder="W"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <Label htmlFor="searchTankHeight" className="text-xs text-gray-600">Height (M)</Label>
                    <Input
                      id="searchTankHeight"
                      type="number"
                      step="0.1"
                      value={searchValues.tankHeight}
                      onChange={(e) =>
                        setSearchValues({
                          ...searchValues,
                          tankHeight: e.target.value,
                        })
                      }
                      placeholder="H"
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleSearch}
            className="w-full bg-blue-400 hover:bg-blue-500 text-white rounded-lg transition-colors duration-200 shadow-sm font-medium"
          >
            <Search className="mr-2 h-4 w-4" />
            Search Quotations
          </Button>
        </CardContent>
      </Card>

      {quotations.length > 0 && (
        <Card className="border border-blue-200 rounded-xl shadow-sm bg-white">
          <CardHeader className="bg-white text-blue-600 border-b border-blue-200 rounded-t-xl px-6 py-2">
            <CardTitle className="text-base font-semibold">Search Results ({quotations.length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-3 px-6">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {quotations.map((quotation) => (
                <div
                  key={quotation.id}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    selectedQuotation?.id === quotation.id
                      ? 'border-blue-400 bg-blue-50/50'
                      : 'border-blue-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-2 text-sm cursor-pointer" onClick={() => handleSelectQuotation(quotation)}>
                      <div>
                        <span className="font-semibold">Quote No:</span>{' '}
                        {quotation.full_main_quote_number}
                      </div>
                      <div>
                        <span className="font-semibold">Recipient:</span>{' '}
                        {quotation.recipient_name}
                      </div>
                      <div>
                        <span className="font-semibold">Company:</span>{' '}
                        {quotation.recipient_company}
                      </div>
                      <div>
                        <span className="font-semibold">Date:</span>{' '}
                        {new Date(quotation.quotation_date).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-semibold">Generated By:</span>{' '}
                        {quotation.generated_by || '-'}
                      </div>
                    </div>
                    {onLoadQuotation && (
                      <Button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            // Fetch full quotation details before loading
                            const response = await fetch(getApiUrl(`api/quotations/${quotation.id}`));
                            if (!response.ok) {
                              throw new Error('Failed to fetch quotation details');
                            }
                            const data = await response.json();
                            onLoadQuotation(data);
                            toast.success('Loading quotation to Revision page...');
                          } catch (error) {
                            console.error('Error fetching quotation:', error);
                            toast.error('Failed to load quotation');
                          }
                        }}
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg px-4 py-2 text-xs shrink-0"
                      >
                        Load
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedQuotation && (
        <Card className="border border-blue-200 rounded-xl shadow-sm bg-white">
          <CardHeader className="bg-white text-blue-600 border-b border-blue-200 rounded-t-xl px-6 py-2">
            <CardTitle className="text-base font-semibold">Selected Quotation Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-3 px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <span className="font-semibold">From:</span>{' '}
                {selectedQuotation.from_company}
              </div>
              <div>
                <span className="font-semibold">To:</span>{' '}
                {selectedQuotation.recipient_title} {selectedQuotation.recipient_name}
              </div>
              <div>
                <span className="font-semibold">Company:</span>{' '}
                {selectedQuotation.recipient_company}
              </div>
              <div>
                <span className="font-semibold">Subject:</span>{' '}
                {selectedQuotation.subject}
              </div>
              <div>
                <span className="font-semibold">Revision:</span>{' '}
                {selectedQuotation.revision_number}
              </div>
              <div>
                <span className="font-semibold">Tanks:</span>{' '}
                {selectedQuotation.tanks?.length || 0}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
