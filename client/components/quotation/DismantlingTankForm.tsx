'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

export interface DismantlingTankItem {
  tankName: string;
  length: string;
  width: string;
  height: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  hasDiscount: boolean;
  discountedTotalPrice: string;
}

interface DismantlingTankFormProps {
  tanks: DismantlingTankItem[];
  onChange: (tanks: DismantlingTankItem[]) => void;
}

const emptyTank = (): DismantlingTankItem => ({
  tankName: '',
  length: '',
  width: '',
  height: '',
  unit: 'LS',
  quantity: 1,
  unitPrice: 0,
  hasDiscount: false,
  discountedTotalPrice: '',
});

export default function DismantlingTankForm({ tanks, onChange }: DismantlingTankFormProps) {
  const addTank = () => onChange([...tanks, emptyTank()]);

  const removeTank = (idx: number) =>
    onChange(tanks.filter((_, i) => i !== idx));

  const updateTank = (idx: number, patch: Partial<DismantlingTankItem>) => {
    const updated = tanks.map((t, i) => (i === idx ? { ...t, ...patch } : t));
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {tanks.map((tank, idx) => {
        const rawTotal = (tank.quantity || 0) * (tank.unitPrice || 0);
        const displayTotal = tank.hasDiscount && tank.discountedTotalPrice
          ? parseFloat(tank.discountedTotalPrice) || 0
          : rawTotal;

        return (
          <Card key={idx} className="border border-orange-200 rounded-xl shadow-sm bg-orange-50">
            <CardHeader className="bg-orange-50 text-orange-700 border-b border-orange-200 rounded-t-xl px-4 py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  Dismantling Tank {idx + 1}
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
                <Label className="text-xs text-gray-600">Tank Name / Description</Label>
                <Input
                  value={tank.tankName}
                  onChange={e => updateTank(idx, { tankName: e.target.value })}
                  placeholder="e.g., DISMANTLING & DISPOSAL OF EXISTING GROUND TANK"
                  autoComplete="off"
                />
              </div>

              {/* Size: L, W, H */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-gray-600">Length L (m)</Label>
                  <Input
                    type="number"
                    value={tank.length}
                    onChange={e => updateTank(idx, { length: e.target.value })}
                    placeholder="5.0"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Width W (m)</Label>
                  <Input
                    type="number"
                    value={tank.width}
                    onChange={e => updateTank(idx, { width: e.target.value })}
                    placeholder="5.0"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Height H (m)</Label>
                  <Input
                    type="number"
                    value={tank.height}
                    onChange={e => updateTank(idx, { height: e.target.value })}
                    placeholder="2.5"
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
                    placeholder="LS"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={tank.quantity}
                    onChange={e => updateTank(idx, { quantity: parseFloat(e.target.value) || 1 })}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Unit Price (AED)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={tank.unitPrice || ''}
                    onChange={e => updateTank(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Discount toggle */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`dismantling-discount-${idx}`}
                    checked={tank.hasDiscount}
                    onCheckedChange={checked =>
                      updateTank(idx, { hasDiscount: checked === true })
                    }
                  />
                  <Label
                    htmlFor={`dismantling-discount-${idx}`}
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
                        updateTank(idx, { discountedTotalPrice: e.target.value })
                      }
                      placeholder="0.00"
                      autoComplete="off"
                    />
                  </div>
                )}
              </div>

              {/* Computed totals */}
              <div className="bg-orange-100 rounded-lg p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total ({tank.quantity} × AED {(tank.unitPrice || 0).toLocaleString()}):</span>
                  <span className="font-semibold">AED {rawTotal.toLocaleString()}</span>
                </div>
                {tank.hasDiscount && (
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-600">Discounted Total:</span>
                    <span className="font-bold text-orange-700">
                      AED {displayTotal.toLocaleString()}
                    </span>
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
        className="w-full border-dashed border-orange-300 text-orange-600 hover:bg-orange-50"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Dismantling Tank Type
      </Button>
    </div>
  );
}
