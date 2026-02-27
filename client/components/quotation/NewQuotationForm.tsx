'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AutocompleteInput } from '@/components/ui/autocomplete-input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, FileDown, GripVertical } from 'lucide-react';
import TankForm from './TankForm';
import DismantlingTankForm, { DismantlingTankItem } from './DismantlingTankForm';
import CylindricalTankForm, { CylindricalTankItem } from './CylindricalTankForm';
import { toast } from 'sonner';
import { getApiUrl } from '@/lib/api-config';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface NewQuotationFormProps {
  onPreviewUpdate: (html: string) => void;
  onCompanyChange?: (code: string) => void;
  isActive?: boolean;
  isPageReload?: boolean;
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
    hasDiscount?: boolean;
    discountedTotalPrice?: string;
  }>;
}

export default function NewQuotationForm({ onPreviewUpdate, onCompanyChange, isActive = true, isPageReload = false }: NewQuotationFormProps) {
  const [fromCompany, setFromCompany] = useState('');
  // Confirm-before-action dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'save' | 'export' | null>(null);
  const [confirmQuoteNo, setConfirmQuoteNo] = useState('');
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
  const [phoneNumber, setPhoneNumber] = useState('+971 ');
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
  const [generatedBy, setGeneratedBy] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState<Array<{key: string; value: string}>>([]);
  const [numberOfTanks, setNumberOfTanks] = useState(1);
  const [gallonType, setGallonType] = useState('');
  const [dismantlingEnabled, setDismantlingEnabled] = useState(false);
  const [dismantlingTanks, setDismantlingTanks] = useState<DismantlingTankItem[]>([{
    tankName: '', length: '', width: '', height: '', unit: 'LS', quantity: 1, unitPrice: 0, hasDiscount: false, discountedTotalPrice: '',
  }]);
  const [cylindricalEnabled, setCylindricalEnabled] = useState(false);
  const [cylindricalTanks, setCylindricalTanks] = useState<CylindricalTankItem[]>([{
    tankName: '', material: 'PVC', layers: null, groundLocation: 'Above Ground', orientation: 'Vertical', capacity: 0, size: '', unit: 'Nos', quantity: 1, unitPrice: 0, hasDiscount: false, discountedTotalPrice: '',
  }]);
  const [panelEnabled, setPanelEnabled] = useState(true);
  const [personCode, setPersonCode] = useState(''); // CODE from Excel
  const [companyDomain, setCompanyDomain] = useState('');
  const [leftPersonSig,  setLeftPersonSig]  = useState({ name: '', title: '', mobile: '', email: '', signatureImage: '' });
  const [rightPersonSig, setRightPersonSig] = useState({ name: '', title: '', mobile: '', email: '', signatureImage: '' });
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

    // Preserve existing tank data
    const currentTanks = [...tanks];
    
    if (num > currentTanks.length) {
      // Add new empty tanks
      const newTanks = Array.from({ length: num - currentTanks.length }, (_, i) => ({
        tankNumber: currentTanks.length + i + 1,
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
      setTanks([...currentTanks, ...newTanks]);
    } else if (num < currentTanks.length) {
      // Remove excess tanks
      setTanks(currentTanks.slice(0, num));
    }
    // If num === currentTanks.length, do nothing (no change)
  };

  const addPanelTank = () => {
    const newTank = {
      tankNumber: tanks.length + 1,
      optionEnabled: false,
      optionNumbers: 1,
      options: [{
        tankName: '', quantity: 1, hasPartition: false, tankType: '',
        length: '', width: '', height: '', unit: '', unitPrice: '', supportSystem: 'Internal',
      }],
    };
    const updated = [...tanks, newTank];
    setTanks(updated);
    setNumberOfTanks(updated.length);
  };

  const removePanelTank = (index: number) => {
    if (tanks.length <= 1) return;
    const updated = tanks
      .filter((_, i) => i !== index)
      .map((tank, i) => ({ ...tank, tankNumber: i + 1 }));
    setTanks(updated);
    setNumberOfTanks(updated.length);
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

  // Generate live preview HTML — matches the actual Word document template exactly
  const generatePreview = () => {
    // ── Date formatting ──────────────────────────────────────────────────────
    const dateObj = new Date(quotationDate);
    const yy  = String(dateObj.getFullYear()).slice(-2);
    const mm  = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd  = String(dateObj.getDate()).padStart(2, '0');
    const yymm = `${yy}${mm}`;
    const displayDate = quotationDate ? `${dd}/${mm}/20${yy}` : '—';

    // ── Quote number ─────────────────────────────────────────────────────────
    const fullQuoteNumber = quotationNumber
      ? `${companyCode || ''}/${yymm}/${personCode || 'XX'}/${quotationNumber}`
      : '';
    const displayQuoteNumber = (fullQuoteNumber && parseInt(revisionNumber) > 0)
      ? `${fullQuoteNumber}-R${revisionNumber}`
      : fullQuoteNumber;

    // ── Company-specific theme ───────────────────────────────────────────────
    const isColex         = companyCode === 'CLX';
    const headerRowColor  = isColex ? '#A3B463' : '#5F9EA0';   // olive-green vs cadet-blue
    const quoteBoxTextColor = '#147BC5';                        // sky-blue for header box text

    // Brand name shown in the common row (mirrors Python logic)
    const brandName = companyShortName
      ? companyShortName.toUpperCase()
      : (isColex ? 'COLEX KOREA' : 'PIPECO TANKS\u00AE\u2013MALAYSIA');

    // ── Gallon settings ──────────────────────────────────────────────────────
    const isImpGallon   = gallonType === 'Imperial Gallons' || gallonType === 'IMP Gallons';
    const gallonAbbr    = isImpGallon ? 'IMP GALLON' : 'USG';
    const gallonMult    = isImpGallon ? 219.969 : 264.172;

    // ── Helper: parse dimension string to float ──────────────────────────────
    // Handle plain values AND partition notation like "2(1+1)" → use only the part before "("
    const parseDim = (s: string) => {
      const clean = (s || '').split('(')[0].trim();
      const n = parseFloat(clean.replace(/[^0-9.]/g, ''));
      return isNaN(n) ? 0 : n;
    };

    // ── Determine common elements across ALL tank options ────────────────────
    const allOpts    = panelEnabled ? tanks.flatMap(t => t.options) : [];
    const allTypes   = allOpts.map(o => (o.tankType || '').trim().toUpperCase());
    const allSupport = allOpts.map(o => o.supportSystem || 'Internal');
    const commonType    = allTypes.length > 0  && allTypes.every(t => t === allTypes[0]   && t !== '')  ? allTypes[0]   : null;
    const commonSupport = allSupport.length > 0 && allSupport.every(s => s === allSupport[0]) ? allSupport[0] : null;

    const supportLabel = () => 'INTERNAL SS 316 AND EXTERNAL HDG SUPPORT SYSTEM';

    // ── Skid computation ──────────────────────────────────────────────────────
    const computeSkid = (h: number) => {
      if (h >= 1.0 && h <= 1.5) return 'WITHOUT SKID';
      if (h >= 2.0 && h <= 3.0) return 'SKID BASE - HDG HOLLOW SECTION 50 X 50 X 3 MM (SQUARE TUBE)';
      if (h > 3.0) return 'SKID BASE - I BEAM SKID';
      return '';
    };
    const allSkids   = allOpts.map(o => computeSkid(parseDim(o.height)));
    const commonSkid = allSkids.length > 0 && allSkids[0] !== '' && allSkids.every(s => s === allSkids[0]) ? allSkids[0] : null;

    // ── Common row HTML (row 1 — spans all 6 columns) ────────────────────────
    let commonLine1 = `GRP SECTIONAL WATER TANK - 10 YEAR WARRANTY - ${brandName}`;
    if (commonSupport) commonLine1 += ` - ${supportLabel()}`;
    const commonRowHtml = panelEnabled ? [
      `<div style="font-weight:bold;font-size:11px;line-height:1.35;">${commonLine1}</div>`,
      commonType ? `<div style="font-weight:bold;font-size:11px;line-height:1.35;">${commonType}</div>` : '',
      commonSkid ? `<div style="font-weight:bold;font-size:11px;line-height:1.35;">${commonSkid}</div>` : '',
    ].filter(Boolean).join('') : '';

    // ── Discount flag ─────────────────────────────────────────────────────────
    const hasAnyDiscount =
      (panelEnabled && tanks.some(t => t.options?.some((o: any) => o.hasDiscount))) ||
      (dismantlingEnabled && dismantlingTanks.some((t: any) => t.hasDiscount)) ||
      (cylindricalEnabled && cylindricalTanks.some((t: any) => t.hasDiscount));

    // ── Pre-calculate subtotal ───────────────────────────────────────────────
    let subTotal = 0;
    if (panelEnabled) {
      tanks.forEach(tank =>
        tank.options.forEach(opt => {
          const q  = Number(opt.quantity)  || 0;
          const up = Number(opt.unitPrice) || 0;
          const hasDisc = (opt as any).hasDiscount || false;
          const discTot = hasDisc ? (Number((opt as any).discountedTotalPrice) || 0) : 0;
          subTotal += hasDisc ? discTot : q * up;
        })
      );
    }
    if (dismantlingEnabled) {
      dismantlingTanks.forEach((t: any) => {
        const q = Number(t.quantity) || 0;
        const up = Number(t.unitPrice) || 0;
        subTotal += t.hasDiscount ? (Number(t.discountedTotalPrice) || 0) : q * up;
      });
    }
    if (cylindricalEnabled) {
      cylindricalTanks.forEach((t: any) => {
        const q = Number(t.quantity) || 0;
        const up = Number(t.unitPrice) || 0;
        subTotal += t.hasDiscount ? (Number(t.discountedTotalPrice) || 0) : q * up;
      });
    }

    // ── SL.NO ordering: dismantling (1..) → cylindrical → panel ────────────
    const nbDismantling = dismantlingEnabled ? dismantlingTanks.length : 0;
    const nbCylindrical = cylindricalEnabled ? cylindricalTanks.length : 0;

    // ── Build tank rows HTML ─────────────────────────────────────────────────
    let slNo = nbDismantling + nbCylindrical + 1;
    const cellBorder = '1px solid #000000';
    const noBorder   = 'none';

    const tankRowsHtml = (!panelEnabled ? [] : tanks.flatMap((tank, tIdx) => {
      const numOpts = tank.options.length;
      return tank.options.map((opt, oIdx) => {
        const qty      = Number(opt.quantity)  || 0;
        const unitPrice = Number(opt.unitPrice) || 0;
        const hasDisc  = (opt as any).hasDiscount || false;
        const discTot  = hasDisc ? (Number((opt as any).discountedTotalPrice) || 0) : 0;
        const total    = hasDisc ? discTot : qty * unitPrice;

        const L = parseDim(opt.length);
        const W = parseDim(opt.width);
        const H = parseDim(opt.height);
        const volM3    = L * W * H;
        const gallons  = volM3 * gallonMult;

        const needFB  = opt.needFreeBoard || false;
        // freeBoardSize is stored in CM (as entered in TankForm "Free Board Size (CM)")
        const freeBoardCM = needFB ? (parseFloat(opt.freeBoardSize || '30') || 30) : 0;
        const fbM    = freeBoardCM / 100;
        const fbCm   = freeBoardCM;
        const netVolM3 = L * W * Math.max(0, H - fbM);
        const netGall  = netVolM3 * gallonMult;

        const isFirst  = oIdx === 0;
        const curSlNo  = isFirst ? slNo++ : slNo - 1;
        const rowBg    = tIdx % 2 === 0 ? '#ffffff' : '#f9fafb';

        // Build description lines
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

        const rowSkid = computeSkid(H);
        if (rowSkid && rowSkid !== commonSkid)
          desc.push(`<div style="font-weight:bold;font-size:11px;">${rowSkid}</div>`);

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
    })).join('');

    // ── Build dismantling rows HTML ──────────────────────────────────────────
    let dismantlingRowsHtml = '';
    if (dismantlingEnabled && dismantlingTanks.length > 0) {
      dismantlingRowsHtml += `<tr><td colspan="6" style="border:${cellBorder};padding:4px 7px;font-size:11px;font-family:Calibri,sans-serif;">&nbsp;</td></tr>`;
      dismantlingTanks.forEach((tank: any, i: number) => {
        const qty = Number(tank.quantity) || 0;
        const up  = Number(tank.unitPrice) || 0;
        const total = tank.hasDiscount ? (Number(tank.discountedTotalPrice) || 0) : qty * up;
        const dd: string[] = [];
        const tn = (tank.tankName || '').trim().toUpperCase();
        if (tn) dd.push(`<div style="font-weight:bold;text-decoration:underline;font-size:11px;">${tn}</div>`);
        const sf = [
          tank.length ? `${tank.length} M (L)` : '',
          tank.width  ? `${tank.width} M (W)`  : '',
          tank.height ? `${tank.height} M (H)` : '',
        ].filter(Boolean);
        if (sf.length) dd.push(`<div style="font-weight:bold;font-size:11px;">SIZE&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;${sf.join(' X ')}</div>`);
        dismantlingRowsHtml += `
          <tr>
            <td style="border:${cellBorder};padding:5px 6px;text-align:center;vertical-align:middle;font-weight:bold;font-size:11px;font-family:Calibri,sans-serif;">${i + 1}</td>
            <td style="border:${cellBorder};padding:5px 7px;vertical-align:top;font-family:Calibri,sans-serif;">${dd.join('') || '<span style="font-size:11px;color:#aaa;">&mdash;</span>'}</td>
            <td style="border:${cellBorder};padding:5px 6px;text-align:center;vertical-align:middle;font-weight:bold;font-size:11px;font-family:Calibri,sans-serif;">${tank.unit || ''}</td>
            <td style="border:${cellBorder};padding:5px 6px;text-align:center;vertical-align:middle;font-weight:bold;font-size:11px;font-family:Calibri,sans-serif;">${qty || ''}</td>
            <td style="border:${cellBorder};padding:5px 6px;text-align:right;vertical-align:middle;font-size:11px;font-family:Calibri,sans-serif;">${up ? up.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) : ''}</td>
            <td style="border:${cellBorder};padding:5px 6px;text-align:right;vertical-align:middle;font-weight:bold;font-size:11px;font-family:Calibri,sans-serif;">${total ? total.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) : ''}</td>
          </tr>`;
      });
    }

    // ── Build cylindrical rows HTML ──────────────────────────────────────────
    let cylindricalRowsHtml = '';
    if (cylindricalEnabled && cylindricalTanks.length > 0) {
      cylindricalTanks.forEach((tank: any, i: number) => {
        const hdrName = (tank.tankName || '').trim().toUpperCase();
        cylindricalRowsHtml += `<tr><td colspan="6" style="border:${cellBorder};padding:4px 7px;font-weight:bold;font-size:11px;font-family:Calibri,sans-serif;">${hdrName || '&nbsp;'}</td></tr>`;
        const qty = Number(tank.quantity) || 0;
        const up  = Number(tank.unitPrice) || 0;
        const total = tank.hasDiscount ? (Number(tank.discountedTotalPrice) || 0) : qty * up;
        const material    = (tank.material || 'PVC').toUpperCase();
        const orientation = (tank.orientation || 'Vertical').toUpperCase();
        const layers      = tank.layers;
        const isAbove     = (tank.groundLocation || 'Above Ground').toLowerCase() !== 'below ground';
        const aboveText   = isAbove
          ? (layers ? `ABOVE GROUND-${layers} LAYER` : 'ABOVE GROUND')
          : (layers ? `BELOW GROUND-${layers} LAYER` : 'BELOW GROUND');
        const capacity    = Number(tank.capacity) || 0;
        const size        = tank.size || 'N/A';
        const typeStr     = `${material} \u2013 ${orientation}`;
        const descLines   = [
          `<div style="font-weight:bold;text-decoration:underline;font-size:11px;">${aboveText}</div>`,
          `<div style="font-weight:bold;font-size:11px;">TYPE&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;${typeStr}</div>`,
          `<div style="font-weight:bold;font-size:11px;">WARRANTY&nbsp;:&nbsp;${material === 'GRP' ? '1' : '3'} YEAR</div>`,
          capacity ? `<div style="font-weight:bold;font-size:11px;">CAPACITY&nbsp;&nbsp;:&nbsp;${capacity} ${gallonAbbr}</div>` : '',
          `<div style="font-weight:bold;font-size:11px;">SIZE&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;${size}</div>`,
        ].filter(Boolean).join('');
        cylindricalRowsHtml += `
          <tr>
            <td style="border:${cellBorder};padding:5px 6px;text-align:center;vertical-align:middle;font-weight:bold;font-size:11px;font-family:Calibri,sans-serif;">${nbDismantling + i + 1}</td>
            <td style="border:${cellBorder};padding:5px 7px;vertical-align:top;font-family:Calibri,sans-serif;">${descLines}</td>
            <td style="border:${cellBorder};padding:5px 6px;text-align:center;vertical-align:middle;font-weight:bold;font-size:11px;font-family:Calibri,sans-serif;">${tank.unit || 'Nos'}</td>
            <td style="border:${cellBorder};padding:5px 6px;text-align:center;vertical-align:middle;font-weight:bold;font-size:11px;font-family:Calibri,sans-serif;">${qty || ''}</td>
            <td style="border:${cellBorder};padding:5px 6px;text-align:right;vertical-align:middle;font-size:11px;font-family:Calibri,sans-serif;">${up ? up.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) : ''}</td>
            <td style="border:${cellBorder};padding:5px 6px;text-align:right;vertical-align:middle;font-weight:bold;font-size:11px;font-family:Calibri,sans-serif;">${total ? total.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) : ''}</td>
          </tr>`;
      });
    }

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

    if (showSubTotal)  footerHtml += fRow(hasAnyDiscount ? 'DISCOUNTED SUB TOTAL:' : 'SUB TOTAL:',   subTotal.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}));
    if (showVat)       footerHtml += fRow('VAT 5%:',      vat.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}));
    if (showGrandTotal) footerHtml += fRow('GRAND TOTAL:', grandTotal.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}), true);

    // ── After-table sections (order matches Python generator) ──────────────────────
    let afterTableHtml = '';

    // 1. NOTE section (numbered list)
    if (terms.note?.action) {
      const notePts = [...(terms.note?.details || []), ...(terms.note?.custom || [])].filter(Boolean);
      if (notePts.length) {
        afterTableHtml += `
          <div style="margin-top:14px;">
            <p style="font-weight:bold;font-size:11px;margin:0 0 3px;font-family:Calibri,sans-serif;">NOTE:</p>
            ${notePts.map((p, i) => `<p style="margin:1px 0;font-size:11px;font-weight:bold;font-family:Calibri,sans-serif;line-height:1.45;">${i + 1}. ${p}</p>`).join('')}
          </div>`;
      }
    }

    // 2. Closing paragraph (always shown when quotationFrom is set)
    if (quotationFrom) {
      afterTableHtml += `
        <p style="margin-top:14px;margin-bottom:0;font-size:11px;font-family:Calibri,sans-serif;line-height:1.5;">We hope the above offer meets your requirements and awaiting the valuable order confirmation.</p>
        <p style="margin:0;font-size:11px;font-family:Calibri,sans-serif;line-height:1.5;">If you have any questions concerning the offer, please contact the undersigned.</p>`;
    }

    // 3. Signature section
    if (quotationFrom) {
      const isSales = quotationFrom === 'Sales';
      // Fallback to form-field name when API details haven't loaded yet
      const mkFallback = (name: string, defaultTitle: string) =>
        ({ name: name.split('(')[0].trim(), title: defaultTitle, mobile: '', email: '' });
      const rawLeft  = isSales ? leftPersonSig  : rightPersonSig;
      const rawRight = isSales ? rightPersonSig : null;
      const leftSig  = rawLeft.name  ? rawLeft  : (isSales ? mkFallback(salesPersonName, 'Sales Executive') : mkFallback(officePersonName, 'Manager - Projects'));
      const rightSig = rawRight && rawRight.name ? rawRight : (isSales && officePersonName ? mkFallback(officePersonName, 'Manager - Projects') : null);

      const sigCell = (sig: {name:string;title:string;mobile:string;email:string;signatureImage?:string} | null) => {
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
          <p style="margin:0;font-size:11px;font-weight:bold;font-style:italic;font-family:Calibri,sans-serif;">For ${fromCompany}</p>
          <div style="height:8px;"></div>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="width:62%;vertical-align:top;padding:0;">${sigCell(leftSig)}</td>
              <td style="width:38%;vertical-align:top;padding:0;">${sigCell(rightSig)}</td>
            </tr>
          </table>
        </div>`;
    }

    // 4-11. Terms sections (correct order, &#10146; = ➢ bullets)
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
      if (!terms[t.key]?.action) continue;
      const pts = [...(terms[t.key]?.details || []), ...(terms[t.key]?.custom || [])].filter(Boolean);
      if (!pts.length) continue;
      afterTableHtml += `
        <div style="margin-top:14px;">
          <p style="font-weight:bold;font-size:11px;margin:0 0 4px;font-family:Calibri,sans-serif;">${t.label}</p>
          ${pts.map(p => `<div style="display:flex;align-items:flex-start;margin:1px 0;font-family:Calibri,sans-serif;line-height:1.45;"><span style="min-width:18px;font-size:11px;">&#10146;</span><span style="font-size:11px;font-weight:bold;">${p}</span></div>`).join('')}
        </div>`;
    }

    // 12. THANK YOU
    afterTableHtml += `<div style="height:20px;"></div><p style="text-align:center;font-weight:bold;font-size:13px;color:#002060;font-family:Calibri,sans-serif;margin:0;">THANK YOU FOR YOUR BUSINESS</p>`;

    // ── Final HTML (simulates the A4 Word page) ──────────────────────────────
    const previewHtml = `
      <div style="font-family:Calibri,'Segoe UI',sans-serif;background:white;padding:4px 22px 18px;">

          <!-- QUOTATION title -->
          <p style="text-align:center;font-weight:bold;font-style:italic;text-decoration:underline;color:#002060;font-size:16px;margin:0 0 5px;font-family:Calibri,sans-serif;">QUOTATION</p>

          <!-- To. -->
          <p style="font-weight:bold;font-size:12px;margin:0 0 1px;font-family:Calibri,sans-serif;">To.</p>

          <!-- Recipient info (left) + Date/Quote (right) -->
          <table style="width:100%;border-collapse:collapse;margin-bottom:4px;">
            <tr>
              <td style="width:62%;vertical-align:top;padding:0;font-size:12px;font-weight:bold;font-family:Calibri,sans-serif;line-height:1.5;">
                ${recipientTitle && recipientName ? `${recipientTitle} ${recipientName}<br/>` : ''}
                ${role          ? `${role}<br/>`          : ''}
                ${companyName   ? `${companyName}<br/>`   : ''}
                ${location      ? `${location}<br/>`      : ''}
                ${phoneNumber && phoneNumber !== '+971 ' ? phoneNumber : ''}
              </td>
              <td style="width:38%;vertical-align:top;padding:0;font-size:12px;font-weight:bold;font-family:Calibri,sans-serif;line-height:1.6;">
                Date&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${displayDate}<br/>
                Page&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: 1/1<br/>
                Quote No.&nbsp;&nbsp;&nbsp;&nbsp;: ${displayQuoteNumber || '&mdash;'}
              </td>
            </tr>
          </table>

          <div style="height:5px;"></div>

          <!-- Subject / Project / Additional Details -->
          ${subject        ? `<p style="margin:0;font-size:12px;font-weight:bold;font-family:Calibri,sans-serif;line-height:1.5;">Subject&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: <u>${subject}</u></p>`        : ''}
          ${projectLocation? `<p style="margin:0;font-size:12px;font-weight:bold;font-family:Calibri,sans-serif;line-height:1.5;">Project&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: <u>${projectLocation}</u></p>` : ''}
          ${additionalDetails.filter(d => d.key && d.value).map(d =>
            `<p style="margin:0;font-size:12px;font-weight:bold;font-family:Calibri,sans-serif;line-height:1.5;">${d.key}&nbsp;&nbsp;: <u>${d.value}</u></p>`
          ).join('')}

          <div style="height:5px;"></div>

          <!-- Dear Sir / Intro -->
          <p style="margin:0;font-size:12px;font-family:Calibri,sans-serif;line-height:1.5;">Dear Sir,</p>
          <p style="margin:0;font-size:12px;font-family:Calibri,sans-serif;line-height:1.5;">With reference to your enquiry, we would like to give our competitive offer for <strong>${subject || 'supply and installation'}</strong> as follows</p>

          <div style="height:6px;"></div>

          <!-- ── Main Invoice Table ── -->
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
              ${dismantlingRowsHtml}
              ${cylindricalRowsHtml}
              ${commonRowHtml ? `<tr><td colspan="6" style="border:1px solid #000;padding:5px 7px;font-family:Calibri,sans-serif;">${commonRowHtml}</td></tr>` : ''}
              ${tankRowsHtml}
              ${!tankRowsHtml && !dismantlingRowsHtml && !cylindricalRowsHtml ? `<tr><td colspan="6" style="border:1px solid #000;padding:14px;text-align:center;color:#9ca3af;font-size:12px;">No tanks added yet</td></tr>` : ''}
              ${footerHtml}
            </tbody>
          </table>

          ${afterTableHtml}

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
    additionalDetails, gallonType, tanks, showSubTotal, showVat, showGrandTotal, personCode, officePersonName, companyCode,
    leftPersonSig, rightPersonSig, dismantlingEnabled, dismantlingTanks, cylindricalEnabled, cylindricalTanks, panelEnabled
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ]); // `terms` intentionally omitted (declared later in scope; closure captures latest value)

  // Fetch person details when sales person changes
  useEffect(() => {
    if (quotationFrom === 'Sales' && salesPersonName) {
      fetchPersonDetails(salesPersonName, 'sales', setLeftPersonSig);
    } else if (quotationFrom !== 'Sales') {
      setLeftPersonSig({ name: '', title: '', mobile: '', email: '', signatureImage: '' });
    }
  }, [salesPersonName, quotationFrom, fromCompany]);

  // Fetch person details when office person changes
  useEffect(() => {
    if (quotationFrom === 'Sales' && officePersonName) {
      fetchPersonDetails(officePersonName, 'office', setRightPersonSig);
    } else if (quotationFrom === 'Office' && officePersonName) {
      fetchPersonDetails(officePersonName, 'office', setRightPersonSig);
    } else {
      setRightPersonSig({ name: '', title: '', mobile: '', email: '', signatureImage: '' });
    }
  }, [officePersonName, quotationFrom, fromCompany]);

  // Fetch recipient details from recipient_details table
  const fetchRecipientDetails = async (recipientFullName: string) => {
    if (!recipientFullName) {
      console.log('⚠️ No recipient name provided to fetch');
      return;
    }
    
    try {
      console.log(`🔍 Fetching recipient details for: "${recipientFullName}"`);
      const url = getApiUrl(`api/recipient-details?name=${encodeURIComponent(recipientFullName)}`);
      console.log(`📡 API URL: ${url}`);
      
      const response = await fetch(url);
      console.log(`📥 Response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Received recipient details:`, data);
        
        // Auto-fill all recipient fields
        console.log('📝 Auto-filling fields...');
        if (data.recipientTitle) setRecipientTitle(data.recipientTitle);
        setRecipientName(data.recipientName || '');
        setRole(data.role || '');
        setCompanyName(data.companyName || '');
        setLocation(data.location || '');
        setPhoneNumber(data.phoneNumber || '+971 ');
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
      const response = await fetch(getApiUrl(`api/company-details?name=${encodeURIComponent(companyFullName)}`));
      if (response.ok) {
        const data = await response.json();
        console.log(`Received company details:`, data);
        setCompanyCode(data.code || '');
        setCompanyShortName(data.company_name || '');
        setTemplatePath(data.template_path || '');
        setCompanyDomain(data.company_domain || '');
      } else {
        console.error('Failed to fetch company details:', response.status);
        setCompanyCode('');
        setCompanyShortName('');
        setTemplatePath('');
        setCompanyDomain('');
      }
    } catch (error) {
      console.error('Error fetching company details:', error);
      setCompanyCode('');
      setCompanyShortName('');
      setTemplatePath('');
      setCompanyDomain('');
    }
  };

  // Fetch full person signature details (name, designation, mobile, email, signatureImage)
  const fetchPersonDetails = async (personName: string, personType: 'sales' | 'office', setter: (v: {name:string;title:string;mobile:string;email:string;signatureImage:string}) => void) => {
    if (!personName) { setter({ name: '', title: '', mobile: '', email: '', signatureImage: '' }); return; }
    try {
      const url = getApiUrl(`api/person-details?name=${encodeURIComponent(personName)}&type=${personType}&company=${encodeURIComponent(fromCompany)}`);
      const res = await fetch(url);
      if (res.ok) {
        const d = await res.json();
        setter({ name: d.name || personName, title: d.designation || '', mobile: d.mobile || '', email: d.email || '', signatureImage: d.signatureImage || '' });
      } else {
        setter({ name: personName, title: personType === 'sales' ? 'Sales Executive' : 'Manager - Projects', mobile: '', email: '', signatureImage: '' });
      }
    } catch { setter({ name: personName, title: '', mobile: '', email: '', signatureImage: '' }); }
  };

  // Fetch CODE from Excel based on person name and type
  const fetchPersonCode = async (personName: string, personType: 'sales' | 'office') => {
    if (!personName) {
      setPersonCode('');
      return;
    }
    
    try {
      console.log(`Fetching CODE for: ${personName} (${personType})`);
      const response = await fetch(getApiUrl(`api/person-code?name=${encodeURIComponent(personName)}&type=${personType}`));
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
      const response = await fetch(getApiUrl('api/person-names/office'));
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
      const response = await fetch(getApiUrl('api/recipients'));
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
      const response = await fetch(getApiUrl('api/company-names'));
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
        const response = await fetch(getApiUrl('api/companies'));
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
        const response = await fetch(getApiUrl('api/recipients'));
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
        const response = await fetch(getApiUrl('api/company-names'));
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

  // Log when company code updates and notify parent
  useEffect(() => {
    console.log(`📝 Company Code updated: "${companyCode}"`);
    onCompanyChange?.(companyCode);
  }, [companyCode]);

  // Fetch sales person names when quotationFrom changes to 'Sales'
  useEffect(() => {
    const fetchSalesPersons = async () => {
      try {
        const response = await fetch(getApiUrl('api/person-names/sales'));
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

  // Show confirmation dialog before save/export
  const triggerConfirm = (action: 'save' | 'export') => {
    const d = new Date(quotationDate);
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yymm = `${yy}${mm}`;
    const code = personCode || 'XX';
    let qn = companyCode && quotationNumber
      ? `${companyCode}/${yymm}/${code}/${quotationNumber}`
      : (quotationNumber || '—');
    if (parseInt(revisionNumber) > 0) qn += `-R${revisionNumber}`;
    setConfirmQuoteNo(qn);
    setPendingAction(action);
    setShowConfirmDialog(true);
  };

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
      if (!quotationNumber) {
        toast.error('Please enter quotation number');
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

      // Convert gallon type to Python format (USG or IMP GALLON)
      const formattedGallonType = gallonType === 'US Gallons' ? 'USG' : gallonType === 'Imperial Gallons' ? 'IMP GALLON' : gallonType;

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
      
      let fullQuoteNumber = `${companyCode}/${yymm}/${codeForQuote}/${quotationNumber}`;
      if (revisionEnabled && parseInt(revisionNumber) > 0) {
        fullQuoteNumber = `${companyCode}/${yymm}/${codeForQuote}/${quotationNumber}-R${revisionNumber}`;
      }

      // Save to database
      console.log(`💾 Saving quotation - Number: ${quotationNumber}, Revision: ${revisionNumber}`);
      console.log(`👤 QuotationFrom: ${quotationFrom}, SalesPerson: ${salesPersonName}, OfficePerson: ${officePersonName}, GeneratedBy: ${generatedBy}`);
      const saveResponse = await fetch(getApiUrl('api/save-quotation'), {
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
          salesPersonName: quotationFrom === 'Sales' ? salesPersonName : '',
          officePersonName: quotationFrom === 'Office' || quotationFrom === 'Sales' ? officePersonName : '',
          subject,
          projectLocation,
          generatedBy,
          tanksData: {
            numberOfTanks: panelEnabled ? tanks.length : 0,
            gallonType: formattedGallonType,
            tanks: panelEnabled ? tanks : [],
            panelEnabled,
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
        // Clear sessionStorage after successful save
        sessionStorage.removeItem('newQuotationFormData');
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
      if (!quotationNumber) {
        toast.error('Please enter quotation number');
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

      // Convert gallon type to Python format (USG or IMP GALLON)
      const formattedGallonType = gallonType === 'US Gallons' ? 'USG' : gallonType === 'Imperial Gallons' ? 'IMP GALLON' : gallonType;

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
      
      let fullQuoteNumber = `${companyCode}/${yymm}/${codeForQuote}/${quotationNumber}`;
      if (revisionEnabled && parseInt(revisionNumber) > 0) {
        fullQuoteNumber = `${companyCode}/${yymm}/${codeForQuote}/${quotationNumber}-R${revisionNumber}`;
      }

      // Send all data to Python backend for document generation
      console.log(`👤 Export - QuotationFrom: ${quotationFrom}, SalesPerson: ${salesPersonName}, OfficePerson: ${officePersonName}, GeneratedBy: ${generatedBy}`);
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
          salesPersonName: quotationFrom === 'Sales' ? salesPersonName : '',
          officePersonName: quotationFrom === 'Office' || quotationFrom === 'Sales' ? officePersonName : '',
          quotationNumber,
          revisionEnabled,
          revisionNumber,
          subject,
          projectLocation,
          generatedBy,
          additionalDetails,
          gallonType: formattedGallonType,
          numberOfTanks: panelEnabled ? tanks.length : 0,
          showSubTotal,
          showVat,
          showGrandTotal,
          tanks: panelEnabled ? tanks : [],
          dismantlingTanks: dismantlingEnabled ? dismantlingTanks : [],
          cylindricalTanks: cylindricalEnabled ? cylindricalTanks : [],
          terms: formattedTerms,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const filename = result.filename || `${fullQuoteNumber.replace(/\//g, '_').replace(/-R/g, '_R')}.docx`;
        const filepath = result.filepath || `${companyCode}/${filename}`;
        const absolutePath = result.absolute_filepath || '';
        
        // Show system path if available, otherwise show relative path
        const displayPath = absolutePath || filepath;
        toast.success(`Quotation saved successfully!\nFile: ${displayPath}`);

        // Save to database after successful document generation
        try {
          const finalDocPath = filepath;
          
          console.log(`💾 Saving quotation after export - Number: ${quotationNumber}, Revision: ${revisionNumber}`);
          console.log(`👤 Post-export save - QuotationFrom: ${quotationFrom}, SalesPerson: ${salesPersonName}, OfficePerson: ${officePersonName}, GeneratedBy: ${generatedBy}`);
          const saveResponse = await fetch(getApiUrl('api/save-quotation'), {
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
              salesPersonName: quotationFrom === 'Sales' ? salesPersonName : '',
              officePersonName: quotationFrom === 'Office' || quotationFrom === 'Sales' ? officePersonName : '',
              subject,
              projectLocation,
              generatedBy,
              tanksData: {
                numberOfTanks: panelEnabled ? tanks.length : 0,
                gallonType: formattedGallonType,
                tanks: panelEnabled ? tanks : [],
                panelEnabled,
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
            // Clear sessionStorage after successful export and save
            sessionStorage.removeItem('newQuotationFormData');
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
        'DURING MAINTENANCE OF THE PARTITION TANK, THE WATER LEVELS IN EACH COMPARTMENT SHOULD BE REDUCED EQUALLY.\n     THE MAXIMUM ALLOWABLE WATER HEIGHT IN EACH COMPARTMENT IS UPTO 1 MTR HEIGHT',
        'THE ABOVE TANK ONLY SUITABLE FOR STORING PORTABLE/ DRINKING WATER EXCEPT CHEMICAL /SOLID/TSE WATER.',
        'THE OFFER IS VALID FOR 30 DAYS FROM THE QUOTATION DATE.',
        'THE WARRANTY WILL BE APPLICABLE ONLY UPON RECEIVING FULL PAYMENT.',
        'AS PER THE FEDERAL TAX AUTHORITY, 5% VAT IS APPLICABLE FOR THE TOTAL AMOUNT.'
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

  // Re-run preview when terms change (declared here to avoid TDZ error at earlier useEffect)
  useEffect(() => {
    generatePreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terms]);

  // Setup drag and drop sensors for points within sections
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end for points within a section
  const handlePointDragEnd = (termKey: string) => (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTerms((prev) => {
        const term = prev[termKey];
        // Combine details and custom into single array for reordering
        const allPoints = [...term.details, ...term.custom];
        const oldIndex = allPoints.findIndex((_, idx) => `${termKey}-${idx}` === active.id);
        const newIndex = allPoints.findIndex((_, idx) => `${termKey}-${idx}` === over.id);
        
        const reordered = arrayMove(allPoints, oldIndex, newIndex);
        
        // Split back into details and custom
        // Keep original details count to maintain which are "default" vs "custom"
        return {
          ...prev,
          [termKey]: {
            ...term,
            details: reordered.slice(0, term.details.length),
            custom: reordered.slice(term.details.length),
          },
        };
      });
    }
  };

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

  // Sortable Point Item Component (for individual points within a section)
  function SortablePoint({ 
    id, 
    point, 
    termKey, 
    index, 
    isFromDetails 
  }: { 
    id: string; 
    point: string; 
    termKey: string; 
    index: number; 
    isFromDetails: boolean;
  }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div ref={setNodeRef} style={style} className="flex gap-2 items-center">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4 text-gray-400 hover:text-gray-600" />
        </div>
        <Input
          value={point}
          onChange={e => {
            if (isFromDetails) {
              handleEditDetail(termKey, index, e.target.value);
            } else {
              handleEditCustom(termKey, index - terms[termKey].details.length, e.target.value);
            }
          }}
          className="flex-1"
          autoComplete="off"
          onKeyDown={e => {
            if (e.key === 'Enter') {
              const next = (e.target as HTMLElement).parentElement?.parentElement?.nextElementSibling?.querySelector('input');
              if (next) (next as HTMLElement).focus();
            }
          }}
        />
        <button
          type="button"
          onClick={() => {
            if (isFromDetails) {
              handleRemoveDetail(termKey, index);
            } else {
              handleRemoveCustom(termKey, index - terms[termKey].details.length);
            }
          }}
          className="p-2 text-blue-600 hover:text-blue-700"
          aria-label="Delete point"
        >
          <Trash2 className="w-4 h-4 text-blue-600" />
        </button>
      </div>
    );
  }

  // Load form data from sessionStorage on component mount (only if not a page reload)
  useEffect(() => {
    // Don't restore from sessionStorage on page reload
    if (isPageReload) {
      console.log('⏭ Skipping sessionStorage restore - page reload detected');
      return;
    }
    
    const savedFormData = sessionStorage.getItem('newQuotationFormData');
    if (savedFormData) {
      try {
        const formData = JSON.parse(savedFormData);
        
        // Restore all form state
        if (formData.fromCompany !== undefined) setFromCompany(formData.fromCompany);
        if (formData.companyCode !== undefined) setCompanyCode(formData.companyCode);
        if (formData.companyShortName !== undefined) setCompanyShortName(formData.companyShortName);
        if (formData.templatePath !== undefined) setTemplatePath(formData.templatePath);
        if (formData.showSubTotal !== undefined) setShowSubTotal(formData.showSubTotal);
        if (formData.showVat !== undefined) setShowVat(formData.showVat);
        if (formData.showGrandTotal !== undefined) setShowGrandTotal(formData.showGrandTotal);
        if (formData.recipientTitle !== undefined) setRecipientTitle(formData.recipientTitle);
        if (formData.recipientName !== undefined) setRecipientName(formData.recipientName);
        if (formData.role !== undefined) setRole(formData.role);
        if (formData.companyName !== undefined) setCompanyName(formData.companyName);
        if (formData.location !== undefined) setLocation(formData.location);
        if (formData.phoneNumber !== undefined) setPhoneNumber(formData.phoneNumber);
        if (formData.email !== undefined) setEmail(formData.email);
        if (formData.quotationDate !== undefined) setQuotationDate(formData.quotationDate);
        if (formData.quotationFrom !== undefined) setQuotationFrom(formData.quotationFrom);
        if (formData.salesPersonName !== undefined) setSalesPersonName(formData.salesPersonName);
        if (formData.officePersonName !== undefined) setOfficePersonName(formData.officePersonName);
        if (formData.quotationNumber !== undefined) setQuotationNumber(formData.quotationNumber);
        if (formData.revisionEnabled !== undefined) setRevisionEnabled(formData.revisionEnabled);
        if (formData.revisionNumber !== undefined) setRevisionNumber(formData.revisionNumber);
        if (formData.subject !== undefined) setSubject(formData.subject);
        if (formData.projectLocation !== undefined) setProjectLocation(formData.projectLocation);
        if (formData.generatedBy !== undefined) setGeneratedBy(formData.generatedBy);
        if (formData.additionalDetails !== undefined) setAdditionalDetails(formData.additionalDetails);
        if (formData.numberOfTanks !== undefined) setNumberOfTanks(formData.numberOfTanks);
        if (formData.gallonType !== undefined) setGallonType(formData.gallonType);
        if (formData.personCode !== undefined) setPersonCode(formData.personCode);
        if (formData.tanks !== undefined) setTanks(formData.tanks);
        if (formData.dismantlingEnabled !== undefined) setDismantlingEnabled(formData.dismantlingEnabled);
        if (formData.dismantlingTanks !== undefined) setDismantlingTanks(formData.dismantlingTanks);
        if (formData.cylindricalEnabled !== undefined) setCylindricalEnabled(formData.cylindricalEnabled);
        if (formData.cylindricalTanks !== undefined) setCylindricalTanks(formData.cylindricalTanks);
        if (formData.panelEnabled !== undefined) setPanelEnabled(formData.panelEnabled);
        if (formData.terms !== undefined) setTerms(formData.terms);
        
        console.log('✓ Form data restored from session');
      } catch (error) {
        console.error('Error restoring form data:', error);
      }
    }
  }, [isPageReload]); // Re-run if isPageReload changes

  // Save form data to sessionStorage whenever state changes (only when active)
  useEffect(() => {
    if (!isActive) return; // Only save when this tab is active
    
    const formData = {
      fromCompany,
      companyCode,
      companyShortName,
      templatePath,
      showSubTotal,
      showVat,
      showGrandTotal,
      recipientTitle,
      recipientName,
      role,
      companyName,
      location,
      phoneNumber,
      email,
      quotationDate,
      quotationFrom,
      salesPersonName,
      officePersonName,
      quotationNumber,
      revisionEnabled,
      revisionNumber,
      subject,
      projectLocation,
      generatedBy,
      additionalDetails,
      numberOfTanks,
      gallonType,
      personCode,
      tanks,
      dismantlingEnabled,
      dismantlingTanks,
      cylindricalEnabled,
      cylindricalTanks,
      panelEnabled,
      terms,
    };
    
    sessionStorage.setItem('newQuotationFormData', JSON.stringify(formData));
  }, [
    isActive,
    fromCompany, companyCode, companyShortName, templatePath,
    showSubTotal, showVat, showGrandTotal,
    recipientTitle, recipientName, role, companyName, location, phoneNumber, email,
    quotationDate, quotationFrom, salesPersonName, officePersonName,
    quotationNumber, revisionEnabled, revisionNumber,
    subject, projectLocation, generatedBy,
    additionalDetails, numberOfTanks, gallonType, personCode,
    tanks, dismantlingEnabled, dismantlingTanks, cylindricalEnabled, cylindricalTanks, panelEnabled, terms,
  ]);

  return (
    <div className="space-y-3 pt-12">
      <Card className="border border-blue-200 rounded-xl shadow-sm bg-white">
        <CardHeader className="bg-white text-blue-600 border-b border-blue-200 rounded-t-xl px-6 py-2">
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
                autoComplete="off"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-3 space-y-3 px-6">
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
                autoComplete="off"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const next = document.querySelector('#companyName');
                    if (next) (next as HTMLElement).focus();
                  }
                }}
              />
            </div>

            <div>
              <Label htmlFor="companyName">To Company Name (Optional)</Label>
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
                autoComplete="off"
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
                autoComplete="off"
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
                autoComplete="off"
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
                autoComplete="off"
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
        <CardHeader className="bg-white text-blue-600 border-b border-blue-200 rounded-t-xl px-6 py-2">
          <CardTitle className="text-base font-semibold">Quotation Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-3 space-y-3 px-6">
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
                maxLength={12}
                autoComplete="off"
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
              <Label htmlFor="generatedBy">Generated By</Label>
              <Input
                id="generatedBy"
                value={generatedBy}
                onChange={(e) => setGeneratedBy(e.target.value)}
                placeholder="Enter your name"
                autoComplete="off"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const next = document.querySelector('#quantity-1-0');
                    if (next) (next as HTMLElement).focus();
                  }
                }}
              />
            </div>

            {/* Display Options */}
            <div className="md:col-span-2">
              <div>
                <Label htmlFor="gallonType">Gallon Type (Optional)</Label>
                <AutocompleteInput
                  id="gallonType"
                  options={[
                    { value: 'US Gallons', label: 'US Gallons' },
                    { value: 'Imperial Gallons', label: 'Imperial Gallons' },
                  ]}
                  value={gallonType}
                  onValueChange={setGallonType}
                  placeholder="Type gallon type..."
                />
              </div>
              <div className="flex flex-row flex-wrap gap-6 mt-3">
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

            <div className="md:col-span-2">
              <Label htmlFor="subject">Subject</Label>
              <AutocompleteInput
                id="subject"
                options={[
                  { value: 'Supply and Installation of GRP Panel Water Tank', label: 'Supply and Installation of GRP Panel Water Tank' },
                  { value: 'Supply & Installation of Anti Vortex Plate', label: 'Supply & Installation of Anti Vortex Plate' },
                  { value: 'Supply of GRP Cylindrical - Horizontal Water Tank', label: 'Supply of GRP Cylindrical - Horizontal Water Tank' },
                  { value: 'Supply Of GRP Cylindrical - Vertical Water Tank', label: 'Supply Of GRP Cylindrical - Vertical Water Tank' },
                  { value: 'Supply of GRP Cylindrical - Horizontal Tank /Supply Of Grp Cylindrical - Vertical Tank', label: 'Supply of GRP Cylindrical - Horizontal Tank /Supply Of Grp Cylindrical - Vertical Tank' },
                  { value: 'Dismantling & Disposal of Existing Tank/Supply and Installation of GRP Panel Water Tank with Material Offloading and shifting for the new tank', label: 'Dismantling & Disposal of Existing Tank/Supply and Installation of GRP Panel Water Tank with Material Offloading and shifting for the new tank' },
                  { value: 'Dismantling & Disposal of Existing Tank/Supply and Installation of GRP Panel Water Tank with Related works', label: 'Dismantling & Disposal of Existing Tank/Supply and Installation of GRP Panel Water Tank with Related works' },
                  { value: 'Dismantling &Reinstallation of Tank Using Existing Panels & New Accessories', label: 'Dismantling &Reinstallation of Tank Using Existing Panels & New Accessories' },
                  { value: 'Dismantling and shifting of Existing Tank', label: 'Dismantling and shifting of Existing Tank' },
                  { value: 'Dismantling of Existing Tank/ Supply & Installation and material offloading & shifting of New GRP Panel Water  Tank with Existing Foundation Levelling, Plastering & Painting', label: 'Dismantling of Existing Tank/ Supply & Installation and material offloading & shifting of New GRP Panel Water  Tank with Existing Foundation Levelling, Plastering & Painting' },
                  { value: 'Supply and Installation of GRP Panel Water Tank /Foundation /Civil Work', label: 'Supply and Installation of GRP Panel Water Tank /Foundation /Civil Work' },
                  { value: 'Foundation / Civil Work & Supply and Installation of GRP Panel Water Tank with Related Works', label: 'Foundation / Civil Work & Supply and Installation of GRP Panel Water Tank with Related Works' },
                  { value: 'Installation Charge for Temporary Tank Plumbing Work with Related Work / Supply and Installation of  GRP Panel Water Tank.', label: 'Installation Charge for Temporary Tank Plumbing Work with Related Work / Supply and Installation of  GRP Panel Water Tank.' },
                  { value: 'Installation of Water Tank with Necessary Accessories.', label: 'Installation of Water Tank with Necessary Accessories.' },
                  { value: 'Maintenance Work for the Existing Tank.', label: 'Maintenance Work for the Existing Tank.' },
                  { value: 'Maintenance Work for The Existing Tank./ Dismantling & Disposal of Existing Tank/Supply and Installation of GRP Panel Water Tank', label: 'Maintenance Work for The Existing Tank./ Dismantling & Disposal of Existing Tank/Supply and Installation of GRP Panel Water Tank' },
                  { value: 'Supply of PVC Cylindrical - Horizontal Water Tank / Supply of GRP Cylindrical – Horizontal Water Tank', label: 'Supply of PVC Cylindrical - Horizontal Water Tank / Supply of GRP Cylindrical – Horizontal Water Tank' },
                  { value: 'Supply of PVC - Vertical Water Tank', label: 'Supply of PVC - Vertical Water Tank' },
                  { value: 'Reinstallation Of Existing Tank with Only Gaskets.', label: 'Reinstallation Of Existing Tank with Only Gaskets.' },
                  { value: 'Supply and Installation of GRP Panel Water Tank/Supply of PVC - Vertical Water Tank.', label: 'Supply and Installation of GRP Panel Water Tank/Supply of PVC - Vertical Water Tank.' },
                  { value: 'Supply and Installation of GRP Panel Water Tank with Material Offloading and shifting', label: 'Supply and Installation of GRP Panel Water Tank with Material Offloading and shifting' },
                  { value: 'Supply of Accessories Only', label: 'Supply of Accessories Only' },
                  { value: 'Supply Of FRP Rectangular Water Tank', label: 'Supply Of FRP Rectangular Water Tank' },
                  { value: 'Supply of Panels & Accessories Only.', label: 'Supply of Panels & Accessories Only.' },
                  { value: 'ANTI VORTEX PLATE', label: 'ANTI VORTEX PLATE' },
                  { value: 'Dismantling &Reinstallation of Tank Using Existing Panels & Accessories', label: 'Dismantling &Reinstallation of Tank Using Existing Panels & Accessories' },
                  { value: 'Dismantling of Existing Tank and  Reinstallation of tank using existing panels with necessary accessories', label: 'Dismantling of Existing Tank and  Reinstallation of tank using existing panels with necessary accessories' },
                  { value: 'Dismantling of Existing Tank', label: 'Dismantling of Existing Tank' },
                  { value: 'Existing Tank Removal and Reinstallation of tank using existing panels with new accessories', label: 'Existing Tank Removal and Reinstallation of tank using existing panels with new accessories' },
                  { value: 'EXTERNAL BODY ANGLE + FOUNTATION CIVIL WORK', label: 'EXTERNAL BODY ANGLE + FOUNTATION CIVIL WORK' },
                  { value: 'EXTERNAL BODY ANGLE SUPPORT', label: 'EXTERNAL BODY ANGLE SUPPORT' },
                  { value: 'EXTERNAL BODY SYSTEM', label: 'EXTERNAL BODY SYSTEM' },
                  { value: 'EXTERNAL REINFORCEMENT SYSTEM', label: 'EXTERNAL REINFORCEMENT SYSTEM' },
                  { value: 'GRP HORIZONTAL ABOVE GROUND', label: 'GRP HORIZONTAL ABOVE GROUND' },
                  { value: 'GRP HORIZONTAL WATER TANK UNDERGROUND', label: 'GRP HORIZONTAL WATER TANK UNDERGROUND' },
                  { value: 'INTERNAL & EXTERNAL REINFORCEMENT', label: 'INTERNAL & EXTERNAL REINFORCEMENT' },
                  { value: 'MAINTENANCE WORK FOR EXISTING TANK', label: 'MAINTENANCE WORK FOR EXISTING TANK' },
                  { value: 'Maintenance Work of Existing tank', label: 'Maintenance Work of Existing tank' },
                  { value: 'PVC VERTICAL 3 LAYER', label: 'PVC VERTICAL 3 LAYER' },
                  { value: 'PVC VERTICAL 4 LAYER', label: 'PVC VERTICAL 4 LAYER' },
                  { value: 'PVC VERTICAL', label: 'PVC VERTICAL' },
                  { value: 'STEEL STAND HEADING', label: 'STEEL STAND HEADING' },
                  { value: 'Supply and Installation of GRP Panel Water Tank Foundation Civil Work', label: 'Supply and Installation of GRP Panel Water Tank Foundation Civil Work' },
                  { value: 'Supply and Installation of GRP Panel Water Tank with Material Offloading', label: 'Supply and Installation of GRP Panel Water Tank with Material Offloading' },
                  { value: 'Supply of GRP Cylindrical Horizontal Water Tank EX WARE HOUSE', label: 'Supply of GRP Cylindrical Horizontal Water Tank EX WARE HOUSE' },
                  { value: 'SUPPLY OF PANEL & ACCESSORIES ONLY', label: 'SUPPLY OF PANEL & ACCESSORIES ONLY' },
                  { value: 'SUPPLY OF PANELS & ACCESSORIES ONLY', label: 'SUPPLY OF PANELS & ACCESSORIES ONLY' },
                  { value: 'SUPPLY OF PANELS AND ACCESSORIES ONLY', label: 'SUPPLY OF PANELS AND ACCESSORIES ONLY' },
                  { value: 'SUPPLY OF PANELS ONLY', label: 'SUPPLY OF PANELS ONLY' }
                ]}
                value={subject}
                onValueChange={(value) => setSubject(value)}
                placeholder="Type to search subjects..."
                showOnFocus={false}
                minLength={1}
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
                autoComplete="off"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const next = document.querySelector('#generatedBy');
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
                        autoComplete="off"
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
                        autoComplete="off"
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

      <Card className="border border-orange-200 rounded-xl shadow-sm bg-white">
        <CardHeader className="bg-white text-orange-600 border-b border-orange-200 rounded-t-xl px-6 py-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="dismantlingEnabled"
              checked={dismantlingEnabled}
              onCheckedChange={checked => setDismantlingEnabled(checked === true)}
              className="accent-orange-500"
            />
            <CardTitle className="text-base font-semibold">
              <Label htmlFor="dismantlingEnabled" className="cursor-pointer text-orange-700">
                Dismantling &amp; Disposal of Existing Tanks
              </Label>
            </CardTitle>
          </div>
        </CardHeader>
        {dismantlingEnabled && (
          <CardContent className="pt-6 px-6 pb-6">
            <DismantlingTankForm
              tanks={dismantlingTanks}
              onChange={setDismantlingTanks}
            />
          </CardContent>
        )}
      </Card>

      <Card className="border border-teal-200 rounded-xl shadow-sm bg-white">
        <CardHeader className="bg-white text-teal-600 border-b border-teal-200 rounded-t-xl px-6 py-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="cylindricalEnabled"
              checked={cylindricalEnabled}
              onCheckedChange={checked => setCylindricalEnabled(checked === true)}
              className="accent-teal-500"
            />
            <CardTitle className="text-base font-semibold">
              <Label htmlFor="cylindricalEnabled" className="cursor-pointer text-teal-700">
                Cylindrical Tanks (PVC / GRP)
              </Label>
            </CardTitle>
          </div>
        </CardHeader>
        {cylindricalEnabled && (
          <CardContent className="pt-6 px-6 pb-6">
            <CylindricalTankForm
              tanks={cylindricalTanks}
              gallonType={gallonType}
              onChange={setCylindricalTanks}
            />
          </CardContent>
        )}
      </Card>

      <Card className="border border-blue-200 rounded-xl shadow-sm bg-white">
        <CardHeader className="bg-white text-blue-600 border-b border-blue-200 rounded-t-xl px-6 py-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="panelEnabled"
              checked={panelEnabled}
              onCheckedChange={checked => setPanelEnabled(checked === true)}
              className="accent-blue-500"
            />
            <CardTitle className="text-base font-semibold">
              <Label htmlFor="panelEnabled" className="cursor-pointer text-blue-700">
                Panel Tank Details
              </Label>
            </CardTitle>
          </div>
        </CardHeader>
        {panelEnabled && (
          <CardContent className="pt-4 px-6 pb-6">
            <div className="space-y-4">
              {tanks.map((tank, index) => (
                <div key={index} className="border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h3 className="text-base font-semibold text-blue-700">Tank {index + 1}</h3>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`option-${index + 1}`}
                          checked={tank.optionEnabled}
                          onCheckedChange={(checked) =>
                            updateTank(index, { ...tank, optionEnabled: checked as boolean })
                          }
                          className="accent-blue-500"
                        />
                        <Label htmlFor={`option-${index + 1}`} className="cursor-pointer text-sm font-medium text-gray-700">
                          Enable Option Numbers
                        </Label>
                        {tank.optionEnabled && (
                          <Input
                            type="number"
                            min="1"
                            value={tank.optionNumbers}
                            onChange={(e) => {
                              const newCount = parseInt(e.target.value) || 1;
                              const newOptions = Array.from({ length: newCount }, (_, i) =>
                                tank.options[i] || {
                                  tankName: '', quantity: 1, hasPartition: false, tankType: '',
                                  length: '', width: '', height: '', unit: '', unitPrice: '',
                                  supportSystem: 'Internal', hasDiscount: false, discountedTotalPrice: '',
                                }
                              );
                              updateTank(index, { ...tank, optionNumbers: newCount, options: newOptions });
                            }}
                            className="w-16 border-blue-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 rounded text-sm bg-white"
                            placeholder="No."
                            autoComplete="off"
                          />
                        )}
                      </div>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePanelTank(index)}
                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                  </div>
                  <hr className="border-blue-200 my-3" />
                  <TankForm
                    tankNumber={index + 1}
                    data={tank}
                    onChange={(data) => updateTank(index, data)}
                  />
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPanelTank}
              className="w-full border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Panel Tank
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Contractual Terms & Specifications Section */}
      <Card className="border border-blue-200 rounded-xl shadow-sm bg-white">
        <CardHeader className="bg-white text-blue-600 border-b border-blue-200 rounded-t-xl px-6 py-2">
          <CardTitle className="text-base font-semibold">Contractual Terms & Specifications</CardTitle>
          <p className="text-sm text-gray-500 mt-1">Drag the grip icon to reorder points within each section</p>
        </CardHeader>
        <CardContent className="pt-3 space-y-3 px-6">
          <div className="space-y-6">
            {termsList.map(term => {
              const allPoints = [...terms[term.key].details, ...terms[term.key].custom];
              const pointIds = allPoints.map((_, idx) => `${term.key}-${idx}`);
              
              return (
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
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handlePointDragEnd(term.key)}
                      >
                        <SortableContext
                          items={pointIds}
                          strategy={verticalListSortingStrategy}
                        >
                          {allPoints.map((point, idx) => (
                            <SortablePoint
                              key={`${term.key}-${idx}`}
                              id={`${term.key}-${idx}`}
                              point={point}
                              termKey={term.key}
                              index={idx}
                              isFromDetails={idx < terms[term.key].details.length}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
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
                          autoComplete="off"
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
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
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          onClick={() => triggerConfirm('save')}
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
          onClick={() => triggerConfirm('export')}
          className="bg-blue-400 hover:bg-blue-500 text-white px-8 py-4 text-base rounded-xl transition-colors duration-200 shadow-sm font-medium"
        >
          <FileDown className="mr-2 h-5 w-5 text-white" />
          Export Quotation
        </Button>
      </div>

      {/* ── Confirm before Save / Export dialog ───────────────────────────── */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 relative">
            {/* X close */}
            <button
              onClick={() => { setShowConfirmDialog(false); setPendingAction(null); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                pendingAction === 'save' ? 'bg-green-100' : 'bg-sky-100'
              }`}>
                <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
                  pendingAction === 'save' ? 'bg-green-400' : 'bg-sky-400'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              {pendingAction === 'save' ? 'Confirm Save Quotation?' : 'Confirm Export Quotation?'}
            </h2>

            {/* Body */}
            <p className="text-sm text-gray-500 text-center mb-4 leading-relaxed">
              Please verify the quote number is correct before proceeding.
              This will {pendingAction === 'save' ? 'save the quotation to the database.' : 'generate and export the quotation document.'}
            </p>

            {/* Quote number */}
            <div className="mb-6 p-4 bg-sky-50 border border-sky-100 rounded-xl text-center">
              <p className="text-xs font-medium text-sky-400 uppercase tracking-widest mb-1">Quote Number</p>
              <p className="text-2xl font-extrabold text-sky-700 break-all tracking-wide">{confirmQuoteNo}</p>
              {generatedBy && (
                <p className="mt-2 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  Generated by: <span className="text-gray-700">{generatedBy}</span>
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowConfirmDialog(false); setPendingAction(null); }}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  if (pendingAction === 'save') handleSave();
                  else if (pendingAction === 'export') handleExport();
                  setPendingAction(null);
                }}
                className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors ${
                  pendingAction === 'save'
                    ? 'bg-green-400 hover:bg-green-500'
                    : 'bg-sky-400 hover:bg-sky-500'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
