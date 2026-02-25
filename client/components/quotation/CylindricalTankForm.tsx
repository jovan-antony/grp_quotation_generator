'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AutocompleteInput } from '@/components/ui/autocomplete-input';
import { Plus, Trash2 } from 'lucide-react';
import { getApiUrl } from '@/lib/api-config';

export interface CylindricalTankItem {
  tankName: string;
  material: string;           // 'PVC' or 'GRP'
  layers: number | null;      // optional
  groundLocation: string;     // 'Above Ground' or 'Below Ground'
  orientation: string;        // 'Horizontal' or 'Vertical'
  capacity: number;           // in US Gallons
  size: string;               // auto-looked-up from API
  unit: string;
  quantity: number;
  unitPrice: number;
  hasDiscount: boolean;
  discountedTotalPrice: string;
}

interface CylindricalTankFormProps {
  tanks: CylindricalTankItem[];
  gallonType?: string;
  onChange: (tanks: CylindricalTankItem[]) => void;
}

const emptyTank = (): CylindricalTankItem => ({
  tankName: '',
  material: 'PVC',
  layers: null,
  groundLocation: 'Above Ground',
  orientation: 'Vertical',
  capacity: 0,
  size: '',
  unit: 'Nos',
  quantity: 1,
  unitPrice: 0,
  hasDiscount: false,
  discountedTotalPrice: '',
});

const MATERIAL_OPTIONS = [
  { value: 'PVC', label: 'PVC' },
  { value: 'GRP', label: 'GRP' },
];

const ORIENTATION_OPTIONS = [
  { value: 'Vertical', label: 'Vertical' },
  { value: 'Horizontal', label: 'Horizontal' },
];

const GROUND_OPTIONS = [
  { value: 'Above Ground', label: 'Above Ground' },
  { value: 'Below Ground', label: 'Below Ground' },
];

export default function CylindricalTankForm({
  tanks,
  gallonType = 'US Gallons',
  onChange,
}: CylindricalTankFormProps) {

  const addTank = () => onChange([...tanks, emptyTank()]);

  const removeTank = (idx: number) =>
    onChange(tanks.filter((_, i) => i !== idx));

  // Fix: pass the already-updated array to lookupSize so it never reads stale state
  const lookupSize = async (
    latestTanks: CylindricalTankItem[],
    idx: number,
    material: string,
    orientation: string,
    capacity: number
  ) => {
    if (!capacity || capacity <= 0) return;
    try {
      const params = new URLSearchParams({
        material,
        orientation,
        capacity: String(capacity),
      });
      const response = await fetch(getApiUrl(`api/cylindrical-tank-size?${params}`));
      if (response.ok) {
        const data = await response.json();
        onChange(
          latestTanks.map((t, i) =>
            i === idx ? { ...t, size: data.size || 'SIZE N/A' } : t
          )
        );
      }
    } catch {
      // Silently fail – user can still edit manually
    }
  };

  const updateTank = (
    idx: number,
    patch: Partial<CylindricalTankItem>,
    triggerLookup = false
  ) => {
    const updated = tanks.map((t, i) => (i === idx ? { ...t, ...patch } : t));
    onChange(updated);
    if (triggerLookup) {
      const merged = { ...tanks[idx], ...patch };
      lookupSize(updated, idx, merged.material, merged.orientation, merged.capacity);
    }
  };

  return (
    <div className="space-y-4">
      {tanks.map((tank, idx) => {
        const rawTotal = (tank.quantity || 0) * (tank.unitPrice || 0);
        const displayTotal =
          tank.hasDiscount && tank.discountedTotalPrice
            ? parseFloat(tank.discountedTotalPrice) || 0
            : rawTotal;

        return (
          <Card key={idx} className="border border-teal-200 rounded-xl shadow-sm bg-teal-50">
            <CardHeader className="bg-teal-50 text-teal-700 border-b border-teal-200 rounded-t-xl px-4 py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  Cylindrical Tank {idx + 1}
                </CardTitle>
                {tanks.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTank(idx)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4 px-4 pb-4">
              {/* Tank Name */}
              <div>
                <Label className="text-xs text-gray-600">Tank Name / Heading</Label>
                <Input
                  value={tank.tankName}
                  onChange={e => updateTank(idx, { tankName: e.target.value })}
                  placeholder="e.g., PVC – VERTICAL WATER TANK"
                  autoComplete="off"
                />
              </div>

              {/* Material + Orientation + Ground Location + Layers */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-600">Material</Label>
                  <AutocompleteInput
                    options={MATERIAL_OPTIONS}
                    value={tank.material}
                    onValueChange={val =>
                      updateTank(idx, { material: val }, true)
                    }
                    placeholder="PVC / GRP"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Orientation</Label>
                  <AutocompleteInput
                    options={ORIENTATION_OPTIONS}
                    value={tank.orientation}
                    onValueChange={val =>
                      updateTank(idx, { orientation: val }, true)
                    }
                    placeholder="Vertical / Horizontal"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Ground Location (Optional)</Label>
                  <AutocompleteInput
                    options={GROUND_OPTIONS}
                    value={tank.groundLocation}
                    onValueChange={val =>
                      updateTank(idx, { groundLocation: val })
                    }
                    placeholder="Above / Below Ground"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">No. of Layers (Optional)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={tank.layers ?? ''}
                    onChange={e => {
                      const raw = e.target.value;
                      updateTank(idx, { layers: raw === '' ? null : (parseInt(raw) || null) });
                    }}
                    placeholder="e.g. 3"
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Capacity + auto-looked-up Size */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-600">
                    Capacity ({gallonType === 'Imperial Gallons' ? 'IMP GAL' : 'US Gallons'})
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={tank.capacity || ''}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      updateTank(idx, { capacity: val }, true);
                    }}
                    placeholder="2500"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">
                    Size (auto-calculated)
                  </Label>
                  <Input
                    value={tank.size}
                    onChange={e => updateTank(idx, { size: e.target.value })}
                    placeholder="2.230 DIA X 2.60 MTR (H)"
                    className="bg-white"
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Unit, Qty, Unit Price */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-gray-600">Unit</Label>
                  <Input
                    value={tank.unit}
                    onChange={e => updateTank(idx, { unit: e.target.value })}
                    placeholder="Nos"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={tank.quantity}
                    onChange={e =>
                      updateTank(idx, { quantity: parseFloat(e.target.value) || 1 })
                    }
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Unit Price (AED)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={tank.unitPrice || ''}
                    onChange={e =>
                      updateTank(idx, { unitPrice: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0.00"
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Discount */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`cyl-discount-${idx}`}
                    checked={tank.hasDiscount}
                    onCheckedChange={checked =>
                      updateTank(idx, { hasDiscount: checked === true })
                    }
                  />
                  <Label
                    htmlFor={`cyl-discount-${idx}`}
                    className="text-xs text-gray-600 cursor-pointer"
                  >
                    Has Discount
                  </Label>
                </div>

                {tank.hasDiscount && (
                  <div>
                    <Label className="text-xs text-gray-600">
                      Discounted Total Price (AED)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={tank.discountedTotalPrice}
                      onChange={e =>
                        updateTank(idx, {
                          discountedTotalPrice: e.target.value,
                        })
                      }
                      placeholder="0.00"
                      autoComplete="off"
                    />
                  </div>
                )}
              </div>

              {/* Totals summary */}
              <div className="bg-teal-100 rounded-lg p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Total ({tank.quantity} × AED {(tank.unitPrice || 0).toLocaleString()}):
                  </span>
                  <span className="font-semibold">AED {rawTotal.toLocaleString()}</span>
                </div>
                {tank.hasDiscount && (
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-600">Discounted Total:</span>
                    <span className="font-bold text-teal-700">
                      AED {displayTotal.toLocaleString()}
                    </span>
                  </div>
                )}
                {tank.groundLocation && (
                  <div className="mt-2 text-teal-800 font-medium text-xs">
                    📍 {tank.groundLocation}
                    {tank.layers ? ` – ${tank.layers} Layer` : ''}
                  </div>
                )}
                {tank.size && tank.size !== 'SIZE N/A' && (
                  <div className="mt-1 text-teal-800 font-medium text-xs">
                    📐 Size: {tank.size}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addTank}
        className="w-full border-dashed border-teal-300 text-teal-600 hover:bg-teal-50"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Cylindrical Tank Type
      </Button>
    </div>
  );
}
