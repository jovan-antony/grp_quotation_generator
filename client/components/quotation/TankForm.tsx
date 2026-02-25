'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AutocompleteInput } from '@/components/ui/autocomplete-input';
import { Checkbox } from '@/components/ui/checkbox';
import { Info } from 'lucide-react';

interface TankFormProps {
  tankNumber: number;
  data: {
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
  };
  onChange: (data: any) => void;
}

export default function TankForm({ tankNumber, data, onChange }: TankFormProps) {
  const visibleOptions = (data.optionEnabled ? data.options : [data.options?.[0]]).filter(Boolean);

  return (
    <div className="space-y-3">
      {/* Options */}
      {visibleOptions.map((option, idx) => (
        <div key={idx} className={visibleOptions.length > 1 ? "border border-blue-100 rounded-lg p-4 space-y-3" : "space-y-3"}>
          {/* Option heading — only shown when multiple options are active */}
          {data.optionEnabled && (
            <div className="flex items-center gap-2 pb-1 border-b border-blue-100">
              <span className="text-sm font-semibold text-blue-600">Option {idx + 1} - Tank {tankNumber}</span>
            </div>
          )}

          {/* Free Board */}
          <div className="flex flex-wrap items-center gap-3">
            <Checkbox
              id={`freeboard-${tankNumber}-${idx}`}
              checked={option.needFreeBoard || false}
              onCheckedChange={(checked) => {
                const newOptions = [...data.options];
                newOptions[idx] = { ...option, needFreeBoard: checked as boolean };
                if (!checked) newOptions[idx].freeBoardSize = '';
                onChange({ ...data, options: newOptions });
              }}
              className="accent-blue-500"
            />
            <Label htmlFor={`freeboard-${tankNumber}-${idx}`} className="cursor-pointer text-sm text-gray-700">
              Need Free Board?
            </Label>
            {option.needFreeBoard && (
              <div className="flex items-center gap-2">
                <Label htmlFor={`freeboard-size-${tankNumber}-${idx}`} className="text-xs text-gray-500 whitespace-nowrap">Size (CM)</Label>
                <Input
                  id={`freeboard-size-${tankNumber}-${idx}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={option.freeBoardSize || ''}
                  onChange={e => {
                    const newOptions = [...data.options];
                    newOptions[idx] = { ...option, freeBoardSize: e.target.value };
                    onChange({ ...data, options: newOptions });
                  }}
                  placeholder="e.g., 5.5"
                  className="border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-black w-28"
                  inputMode="decimal"
                  autoComplete="off"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      document.querySelector<HTMLElement>(`#quantity-${tankNumber}-${idx}`)?.focus();
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Quantity + Tank Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`quantity-${tankNumber}-${idx}`} className="text-sm font-medium text-gray-700">Quantity</Label>
              <Input
                id={`quantity-${tankNumber}-${idx}`}
                type="number"
                min={1}
                step={1}
                value={option.quantity}
                onChange={e => {
                  const val = parseInt(e.target.value, 10);
                  const newOptions = [...data.options];
                  newOptions[idx] = { ...option, quantity: isNaN(val) || val < 1 ? 1 : val };
                  onChange({ ...data, options: newOptions });
                }}
                placeholder="1"
                inputMode="numeric"
                className="border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-black"
                autoComplete="off"
                onKeyDown={e => {
                  if (e.key === 'Enter') document.querySelector<HTMLElement>(`#tankName-${tankNumber}-${idx}`)?.focus();
                }}
              />
            </div>
            <div>
              <Label htmlFor={`tankName-${tankNumber}-${idx}`} className="text-sm font-medium text-gray-700">Tank Name <span className="text-gray-400 font-normal">(Optional)</span></Label>
              <Input
                id={`tankName-${tankNumber}-${idx}`}
                value={option.tankName}
                onChange={e => {
                  const newOptions = [...data.options];
                  newOptions[idx] = { ...option, tankName: e.target.value };
                  onChange({ ...data, options: newOptions });
                }}
                placeholder="e.g., ROOF WATER TANK"
                className="border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-black"
                autoComplete="off"
                onKeyDown={e => {
                  if (e.key === 'Enter') document.querySelector<HTMLElement>(`#tankType-${tankNumber}-${idx}`)?.focus();
                }}
              />
            </div>
          </div>

          {/* Partition + Support System — same row */}
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`partition-${tankNumber}-${idx}`}
                checked={option.hasPartition}
                onCheckedChange={(checked) => {
                  const newOptions = [...data.options];
                  newOptions[idx] = { ...option, hasPartition: checked as boolean };
                  onChange({ ...data, options: newOptions });
                }}
                className="accent-blue-500"
              />
              <Label htmlFor={`partition-${tankNumber}-${idx}`} className="cursor-pointer text-sm text-gray-700">
                Partition of Tank
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Support:</span>
              <button
                type="button"
                onClick={() => {
                  const newOptions = [...data.options];
                  newOptions[idx] = { ...option, supportSystem: 'Internal' };
                  onChange({ ...data, options: newOptions });
                }}
                className={`px-3 py-1 text-sm rounded-md border-2 font-medium transition-all ${
                  (option.supportSystem || 'Internal') === 'Internal'
                    ? 'border-blue-400 bg-blue-400 text-white'
                    : 'border-blue-200 bg-white text-blue-600 hover:border-blue-300'
                }`}
              >
                Internal
              </button>
              <button
                type="button"
                onClick={() => {
                  const newOptions = [...data.options];
                  newOptions[idx] = { ...option, supportSystem: 'External' };
                  onChange({ ...data, options: newOptions });
                }}
                className={`px-3 py-1 text-sm rounded-md border-2 font-medium transition-all ${
                  option.supportSystem === 'External'
                    ? 'border-blue-400 bg-blue-400 text-white'
                    : 'border-blue-200 bg-white text-blue-600 hover:border-blue-300'
                }`}
              >
                External
              </button>
            </div>
          </div>

          {/* Type of Tank */}
          <div>
            <Label htmlFor={`tankType-${tankNumber}-${idx}`} className="text-sm font-medium text-gray-700">Type of Tank</Label>
            <AutocompleteInput
              id={`tankType-${tankNumber}-${idx}`}
              options={[
                { value: 'HOT PRESSED â€“ NON INSULATED', label: 'HOT PRESSED â€“ NON INSULATED' },
                { value: 'HOT PRESSED â€“ 5 SIDE INSULATED (BOTTOM & MANHOLE NON â€“ INSULATED)', label: 'HOT PRESSED â€“ 5 SIDE INSULATED (BOTTOM & MANHOLE NON â€“ INSULATED)' },
                { value: 'HOT PRESSED â€“ 6 SIDE INSULATED (MANHOLE NON â€“ INSULATED)', label: 'HOT PRESSED â€“ 6 SIDE INSULATED (MANHOLE NON â€“ INSULATED)' },
                { value: 'HOT PRESSED â€“ 6 SIDE INSULATED (BOTTOM & MANHOLE INSULATED)', label: 'HOT PRESSED â€“ 6 SIDE INSULATED (BOTTOM & MANHOLE INSULATED)' },
              ]}
              value={option.tankType}
              onValueChange={(value) => {
                const newOptions = [...data.options];
                newOptions[idx] = { ...option, tankType: value };
                onChange({ ...data, options: newOptions });
              }}
              placeholder="Select or type tank type..."
              className="border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-black"
              onKeyDown={e => {
                if (e.key === 'Enter') document.querySelector<HTMLElement>(`#length-${tankNumber}-${idx}`)?.focus();
              }}
            />
          </div>

          {/* Size */}
          <div>
            <Label className="text-sm font-medium text-gray-700">Size of Tank <span className="text-gray-400 font-normal">(in Meters)</span></Label>
            {option.hasPartition && (
              <div className="flex items-start gap-2 mt-1 mb-2 text-xs text-gray-500 bg-blue-50 rounded-md px-3 py-2">
                <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-blue-400" />
                <span>For partitioned tanks enter dimensions with partition notation, e.g., 2(1+1)</span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-3 mt-1">
              <div>
                <Label htmlFor={`length-${tankNumber}-${idx}`} className="text-xs text-gray-500">Length (L)</Label>
                <Input
                  id={`length-${tankNumber}-${idx}`}
                  value={option.length}
                  onChange={(e) => {
                    const newOptions = [...data.options];
                    newOptions[idx] = { ...option, length: e.target.value };
                    onChange({ ...data, options: newOptions });
                  }}
                  placeholder={option.hasPartition ? "2(1+1)" : "e.g., 5"}
                  className="border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-black"
                  autoComplete="off"
                  onKeyDown={e => {
                    if (e.key === 'Enter') document.querySelector<HTMLElement>(`#width-${tankNumber}-${idx}`)?.focus();
                  }}
                />
              </div>
              <div>
                <Label htmlFor={`width-${tankNumber}-${idx}`} className="text-xs text-gray-500">Width (W)</Label>
                <Input
                  id={`width-${tankNumber}-${idx}`}
                  value={option.width}
                  onChange={(e) => {
                    const newOptions = [...data.options];
                    newOptions[idx] = { ...option, width: e.target.value };
                    onChange({ ...data, options: newOptions });
                  }}
                  placeholder={option.hasPartition ? "2(1+1)" : "e.g., 5"}
                  className="border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-black"
                  autoComplete="off"
                  onKeyDown={e => {
                    if (e.key === 'Enter') document.querySelector<HTMLElement>(`#height-${tankNumber}-${idx}`)?.focus();
                  }}
                />
              </div>
              <div>
                <Label htmlFor={`height-${tankNumber}-${idx}`} className="text-xs text-gray-500">Height (H)</Label>
                <Input
                  id={`height-${tankNumber}-${idx}`}
                  value={option.height}
                  onChange={(e) => {
                    const newOptions = [...data.options];
                    newOptions[idx] = { ...option, height: e.target.value };
                    onChange({ ...data, options: newOptions });
                  }}
                  placeholder="e.g., 2.5"
                  className="border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-black"
                  autoComplete="off"
                  onKeyDown={e => {
                    if (e.key === 'Enter') document.querySelector<HTMLElement>(`#unit-${tankNumber}-${idx}`)?.focus();
                  }}
                />
              </div>
            </div>
          </div>

          {/* Unit + Unit Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`unit-${tankNumber}-${idx}`} className="text-sm font-medium text-gray-700">Unit</Label>
              <AutocompleteInput
                id={`unit-${tankNumber}-${idx}`}
                options={[
                  { value: 'Nos', label: 'Nos' },
                  { value: 'L', label: 'L' },
                  { value: 'ROLL', label: 'ROLL' },
                ]}
                value={option.unit}
                onValueChange={(value) => {
                  const newOptions = [...data.options];
                  newOptions[idx] = { ...option, unit: value };
                  onChange({ ...data, options: newOptions });
                }}
                placeholder="e.g., Nos"
                className="border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-black"
                onKeyDown={e => {
                  if (e.key === 'Enter') document.querySelector<HTMLElement>(`#unitPrice-${tankNumber}-${idx}`)?.focus();
                }}
              />
            </div>
            <div>
              <Label htmlFor={`unitPrice-${tankNumber}-${idx}`} className="text-sm font-medium text-gray-700">Unit Price <span className="text-gray-400 font-normal">(AED)</span></Label>
              <Input
                id={`unitPrice-${tankNumber}-${idx}`}
                type="number"
                step="0.01"
                value={option.unitPrice}
                onChange={(e) => {
                  const newOptions = [...data.options];
                  newOptions[idx] = { ...option, unitPrice: e.target.value };
                  onChange({ ...data, options: newOptions });
                }}
                placeholder="0.00"
                className="border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-black"
                autoComplete="off"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const next = document.querySelector<HTMLElement>(`#discount-${tankNumber}-${idx}`);
                    if (next) next.focus(); else (e.target as HTMLElement).blur();
                  }
                }}
              />
            </div>
          </div>

          {/* Discount */}
          <div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`discount-${tankNumber}-${idx}`}
                checked={option.hasDiscount || false}
                onCheckedChange={(checked) => {
                  const newOptions = [...data.options];
                  newOptions[idx] = { ...option, hasDiscount: checked as boolean };
                  if (!checked) newOptions[idx].discountedTotalPrice = '';
                  onChange({ ...data, options: newOptions });
                }}
                className="accent-blue-500"
              />
              <Label htmlFor={`discount-${tankNumber}-${idx}`} className="cursor-pointer text-sm text-gray-700">
                Apply Discount
              </Label>
            </div>
            {option.hasDiscount && (
              <div className="mt-2">
                <Label htmlFor={`discountedTotalPrice-${tankNumber}-${idx}`} className="text-sm font-medium text-gray-700">Discounted Total Price <span className="text-gray-400 font-normal">(AED)</span></Label>
                <Input
                  id={`discountedTotalPrice-${tankNumber}-${idx}`}
                  type="number"
                  step="0.01"
                  value={option.discountedTotalPrice || ''}
                  onChange={(e) => {
                    const newOptions = [...data.options];
                    newOptions[idx] = { ...option, discountedTotalPrice: e.target.value };
                    onChange({ ...data, options: newOptions });
                  }}
                  placeholder="0.00"
                  className="border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-black"
                  onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLElement).blur(); }}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
