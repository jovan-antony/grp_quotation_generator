'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    }>;
  };
  onChange: (data: any) => void;
}

export default function TankForm({ tankNumber, data, onChange }: TankFormProps) {
  return (
    <form className="max-w-2xl mx-auto py-6 bg-white">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-black mb-1">Tank {tankNumber} Details</h2>
        <hr className="border-gray-200 mb-6" />
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Checkbox
            id={`option-${tankNumber}`}
            checked={data.optionEnabled}
            onCheckedChange={(checked) =>
              onChange({ ...data, optionEnabled: checked as boolean })
            }
            className="accent-gray-600"
          />
          <Label htmlFor={`option-${tankNumber}`} className="cursor-pointer font-medium text-base text-black">
            Enable Option Numbers
          </Label>
          {data.optionEnabled && (
            <Input
              type="number"
              min="1"
              value={data.optionNumbers}
              onChange={(e) => {
                const newCount = parseInt(e.target.value) || 1;
                const newOptions = Array.from({ length: newCount }, (_, i) =>
                  data.options[i] || {
                    tankName: '',
                    quantity: 1,
                    hasPartition: false,
                    tankType: '',
                    length: '',
                    width: '',
                    height: '',
                    unit: '',
                    unitPrice: '',
                  }
                );
                onChange({ ...data, optionNumbers: newCount, options: newOptions });
              }}
              className="w-20 border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 rounded"
              placeholder="No."
            />
          )}
        </div>
      </div>
      {((data.optionEnabled ? data.options : [data.options?.[0]]) || []).filter(Boolean).map((option, idx) => (
        <div key={idx} className="mb-10 bg-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-black">Option {data.optionEnabled ? idx + 1 : 1} - Tank {tankNumber}</h3>
          </div>
          <hr className="border-gray-200 mb-5" />
          <div className="flex items-center space-x-3 mb-3">
            <Checkbox
              id={`freeboard-${tankNumber}-${idx}`}
              checked={option.needFreeBoard || false}
              onCheckedChange={(checked) => {
                const newOptions = [...data.options];
                newOptions[idx] = { ...option, needFreeBoard: checked as boolean };
                if (!checked) newOptions[idx].freeBoardSize = '';
                onChange({ ...data, options: newOptions });
              }}
              className="accent-gray-600"
            />
            <Label htmlFor={`freeboard-${tankNumber}-${idx}`} className="cursor-pointer text-black">
              Need Free Board?
            </Label>
            {option.needFreeBoard && (
              <div className="flex items-center space-x-2">
                <Label htmlFor={`freeboard-size-${tankNumber}-${idx}`} className="text-xs text-black">Free Board Size (CM)</Label>
                <Input
                  id={`freeboard-size-${tankNumber}-${idx}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={option.freeBoardSize || ''}
                  onChange={e => {
                    const val = e.target.value;
                    const newOptions = [...data.options];
                    newOptions[idx] = { ...option, freeBoardSize: val };
                    onChange({ ...data, options: newOptions });
                  }}
                  placeholder="e.g., 5.5"
                  className="border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 bg-white text-black w-28"
                  inputMode="decimal"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const next = document.querySelector(`#quantity-${tankNumber}-${idx}`);
                      if (next) (next as HTMLElement).focus();
                    }
                  }}
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            <div>
              <Label htmlFor={`quantity-${tankNumber}-${idx}`} className="font-medium text-black">Quantity</Label>
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
                placeholder="Enter quantity"
                pattern="^[1-9][0-9]*$"
                inputMode="numeric"
                className="border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 bg-white text-black"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const next = document.querySelector(`#tankName-${tankNumber}-${idx}`);
                    if (next) (next as HTMLElement).focus();
                  }
                }}
              />
            </div>
            <div>
              <Label htmlFor={`tankName-${tankNumber}-${idx}`} className="font-medium text-black">Tank Name</Label>
              <Input
                id={`tankName-${tankNumber}-${idx}`}
                value={option.tankName}
                onChange={e => {
                  const newOptions = [...data.options];
                  newOptions[idx] = { ...option, tankName: e.target.value };
                  onChange({ ...data, options: newOptions });
                }}
                placeholder="Enter tank name"
                className="border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 bg-white text-black"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const next = document.querySelector(`#tankType-${tankNumber}-${idx}`);
                    if (next) (next as HTMLElement).focus();
                  }
                }}
              />
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-2 mb-3">
            <Checkbox
              id={`partition-${tankNumber}-${idx}`}
              checked={option.hasPartition}
              onCheckedChange={(checked) => {
                const newOptions = [...data.options];
                newOptions[idx] = { ...option, hasPartition: checked as boolean };
                onChange({ ...data, options: newOptions });
              }}
              className="accent-gray-600"
            />
            <Label htmlFor={`partition-${tankNumber}-${idx}`} className="cursor-pointer text-black">
              Partition of Tank
            </Label>
          </div>
          <div className="mb-3">
            <Label htmlFor={`tankType-${tankNumber}-${idx}`} className="font-medium text-black">Type of Tank</Label>
            <AutocompleteInput
              id={`tankType-${tankNumber}-${idx}`}
              options={[
                { value: 'HOT PRESSED – NON INSULATED', label: 'HOT PRESSED – NON INSULATED' },
                { value: 'HOT PRESSED – 5 SIDE INSULATED (BOTTOM & MANHOLE NON – INSULATED)', label: 'HOT PRESSED – 5 SIDE INSULATED (BOTTOM & MANHOLE NON – INSULATED)' },
                { value: 'HOT PRESSED – 5 SIDE INSULATED (BOTTOM NON – INSULATED & MANHOLE INSULATED)', label: 'HOT PRESSED – 5 SIDE INSULATED (BOTTOM NON – INSULATED & MANHOLE INSULATED)' },
                { value: 'HOT PRESSED – 6 SIDE INSULATED (BOTTOM INSULATED & MANHOLE NON – INSULATED)', label: 'HOT PRESSED – 6 SIDE INSULATED (BOTTOM INSULATED & MANHOLE NON – INSULATED)' },
                { value: 'HOT PRESSED – 6 SIDE INSULATED (BOTTOM & MANHOLE INSULATED)', label: 'HOT PRESSED – 6 SIDE INSULATED (BOTTOM & MANHOLE INSULATED)' },
              ]}
              value={option.tankType}
              onValueChange={(value) => {
                const newOptions = [...data.options];
                newOptions[idx] = { ...option, tankType: value };
                onChange({ ...data, options: newOptions });
              }}
              placeholder="Type tank type..."
              className="border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 bg-white text-black"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const next = document.querySelector(`#length-${tankNumber}-${idx}`);
                  if (next) (next as HTMLElement).focus();
                }
              }}
            />
          </div>
          <div className="mb-3">
            <Label className="font-medium text-black">Size of Tank (in Meters)</Label>
            {option.hasPartition && (
              <div className="flex items-start space-x-2 mb-2 text-xs text-gray-700 bg-white p-2">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-black" />
                <span>
                  For partitioned tank, enter dimensions with partition notation, e.g.,
                  2(1+1) for length or width
                </span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor={`length-${tankNumber}-${idx}`} className="text-xs text-black">Length (L)</Label>
                <Input
                  id={`length-${tankNumber}-${idx}`}
                  value={option.length}
                  onChange={(e) => {
                    const newOptions = [...data.options];
                    newOptions[idx] = { ...option, length: e.target.value };
                    onChange({ ...data, options: newOptions });
                  }}
                  placeholder={option.hasPartition ? "e.g., 2(1+1)" : "e.g., 2.5"}
                  className="border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 bg-white text-black"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const next = document.querySelector(`#width-${tankNumber}-${idx}`);
                      if (next) (next as HTMLElement).focus();
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor={`width-${tankNumber}-${idx}`} className="text-xs text-black">Width (W)</Label>
                <Input
                  id={`width-${tankNumber}-${idx}`}
                  value={option.width}
                  onChange={(e) => {
                    const newOptions = [...data.options];
                    newOptions[idx] = { ...option, width: e.target.value };
                    onChange({ ...data, options: newOptions });
                  }}
                  placeholder={option.hasPartition ? "e.g., 2(1+1)" : "e.g., 2.5"}
                  className="border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 bg-white text-black"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const next = document.querySelector(`#height-${tankNumber}-${idx}`);
                      if (next) (next as HTMLElement).focus();
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor={`height-${tankNumber}-${idx}`} className="text-xs text-black">Height (H)</Label>
                <Input
                  id={`height-${tankNumber}-${idx}`}
                  value={option.height}
                  onChange={(e) => {
                    const newOptions = [...data.options];
                    newOptions[idx] = { ...option, height: e.target.value };
                    onChange({ ...data, options: newOptions });
                  }}
                  placeholder="e.g., 1.5"
                  className="border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 bg-white text-black"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const next = document.querySelector(`#unit-${tankNumber}-${idx}`);
                      if (next) (next as HTMLElement).focus();
                    }
                  }}
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`unit-${tankNumber}-${idx}`} className="font-medium text-black">Unit</Label>
              <AutocompleteInput
                id={`unit-${tankNumber}-${idx}`}
                options={[
                  { value: 'Nos', label: 'Nos' },
                  { value: 'L', label: 'L' },
                ]}
                value={option.unit}
                onValueChange={(value) => {
                  const newOptions = [...data.options];
                  newOptions[idx] = { ...option, unit: value };
                  onChange({ ...data, options: newOptions });
                }}
                placeholder="Type unit..."
                className="border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 bg-white text-black"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const next = document.querySelector(`#unitPrice-${tankNumber}-${idx}`);
                    if (next) (next as HTMLElement).focus();
                  }
                }}
              />
            </div>
            <div>
              <Label htmlFor={`unitPrice-${tankNumber}-${idx}`} className="font-medium text-black">Unit Price (AED)</Label>
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
                placeholder="Enter price"
                className="border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 bg-white text-black"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    // End of tank option inputs, optionally focus next logical field or blur
                    (e.target as HTMLElement).blur();
                  }
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </form>
  );
}
