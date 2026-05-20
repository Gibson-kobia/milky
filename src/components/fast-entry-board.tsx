'use client';

import { useState, useRef } from 'react';
import { Plus, Minus, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getTodayString, validateMilkQuantity } from '@/lib/utils';
import type { Farmer, MilkDelivery } from '@/types';

interface FastEntryBoardProps {
  farmers: Farmer[];
  deliveries: MilkDelivery[];
  onAddDelivery: (farmerId: string, litres: number) => Promise<void>;
  onUpdateDelivery: (deliveryId: string, litres: number) => Promise<void>;
  isLoading?: boolean;
}

export function FastEntryBoard({
  farmers,
  deliveries,
  onAddDelivery,
  onUpdateDelivery,
  isLoading = false,
}: FastEntryBoardProps) {
  const [entries, setEntries] = useState<Record<string, number>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement>>({});

  const today = getTodayString();
  const activeFarmers = farmers.filter((f) => f.active);

  // Get today's delivery for each farmer
  const getTodayDelivery = (farmerId: string) => {
    return deliveries.find(
      (d) => d.farmer_id === farmerId && d.date === today && d.delivery_type === 'morning'
    );
  };

  // Get yesterday's total for reference
  const getYesterdayTotal = (farmerId: string) => {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    return deliveries
      .filter((d) => d.farmer_id === farmerId && d.date === yesterdayStr)
      .reduce((sum, d) => sum + d.litres, 0);
  };

  const handleInputChange = (farmerId: string, value: string) => {
    // Parse the input
    const numValue = parseFloat(value);
    if (value === '' || (numValue >= 0 && validateMilkQuantity(numValue))) {
      setEntries((prev) => ({
        ...prev,
        [farmerId]: numValue,
      }));
    }
  };

  const handleQuickAdd = (farmerId: string, amount: number) => {
    const current = entries[farmerId] || 0;
    const newValue = current + amount;
    if (newValue >= 0 && validateMilkQuantity(newValue)) {
      setEntries((prev) => ({
        ...prev,
        [farmerId]: newValue,
      }));
    }
  };

  const handleSubmit = async (farmerId: string) => {
    const litres = entries[farmerId];
    if (!litres || litres <= 0 || !validateMilkQuantity(litres)) {
      return;
    }

    setSubmitting((prev) => ({ ...prev, [farmerId]: true }));
    try {
      const existing = getTodayDelivery(farmerId);
      if (existing) {
        await onUpdateDelivery(existing.id, litres);
      } else {
        await onAddDelivery(farmerId, litres);
      }
      setEntries((prev) => {
        const newEntries = { ...prev };
        delete newEntries[farmerId];
        return newEntries;
      });
      setEditingId(null);

      // Move to next farmer
      const nextIndex = activeFarmers.findIndex((f) => f.id === farmerId) + 1;
      if (nextIndex < activeFarmers.length) {
        setTimeout(() => {
          inputRefs.current[activeFarmers[nextIndex].id]?.focus();
        }, 50);
      }
    } finally {
      setSubmitting((prev) => ({ ...prev, [farmerId]: false }));
    }
  };

  const handleKeyPress = (
    e: React.KeyboardEvent,
    farmerId: string
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(farmerId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-milk-green-50 p-4 text-sm text-milk-green-800">
        <p className="font-medium">Fast Morning Entry</p>
        <p className="mt-1 text-xs opacity-75">
          Enter litres for each farmer. Valid: whole or .5 increments (1, 1.5, 2, etc.)
        </p>
      </div>

      <div className="space-y-2">
        {activeFarmers.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-gray-600">No active farmers found</p>
          </Card>
        ) : (
          activeFarmers.map((farmer) => {
            const todayDelivery = getTodayDelivery(farmer.id);
            const yesterdayTotal = getYesterdayTotal(farmer.id);
            const currentEntry = entries[farmer.id];
            const isSubmitting = submitting[farmer.id];
            const hasEntry = currentEntry !== undefined && currentEntry > 0;

            return (
              <div
                key={farmer.id}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-all hover:shadow-soft sm:p-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-gray-900 truncate">
                        {farmer.name}
                      </p>
                      <p className="text-xs text-gray-600 sm:text-sm">
                        Yesterday: {yesterdayTotal}L
                      </p>
                    </div>
                    {todayDelivery && (
                      <Badge variant="success" className="w-fit">
                        Entered: {todayDelivery.litres}L
                      </Badge>
                    )}
                  </div>
                </div>

                {editingId === farmer.id || todayDelivery ? (
                  <div className="flex items-center gap-2">
                    {todayDelivery && !editingId && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(farmer.id)}
                          className="gap-1"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                      </>
                    )}
                    {editingId === farmer.id && (
                      <>
                        <div className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white">
                          <button
                            onClick={() => handleQuickAdd(farmer.id, -0.5)}
                            className="px-2 py-1 hover:bg-gray-100"
                          >
                            <Minus className="h-4 w-4 text-gray-600" />
                          </button>
                          <Input
                            ref={(el) => {
                              if (el) inputRefs.current[farmer.id] = el;
                            }}
                            type="number"
                            step="0.5"
                            min="0"
                            placeholder="0"
                            value={currentEntry ?? ''}
                            onChange={(e) =>
                              handleInputChange(farmer.id, e.target.value)
                            }
                            onKeyPress={(e) => handleKeyPress(e, farmer.id)}
                            className="h-8 w-16 border-0 px-2 text-center focus:ring-0"
                            autoFocus
                            disabled={isSubmitting}
                          />
                          <button
                            onClick={() => handleQuickAdd(farmer.id, 0.5)}
                            className="px-2 py-1 hover:bg-gray-100"
                          >
                            <Plus className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleSubmit(farmer.id)}
                          disabled={!hasEntry || isSubmitting || isLoading}
                          className="gap-1"
                        >
                          {isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setEditingId(farmer.id)}
                    className="gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add</span>
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
