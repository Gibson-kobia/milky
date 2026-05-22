'use client';

import { useMemo, useRef, useState } from 'react';
import { Plus, Minus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDateOffsetString, validateMilkQuantity } from '@/lib/utils';
import type { Farmer, MilkDelivery } from '@/types';

interface FastEntryBoardProps {
  farmers: Farmer[];
  deliveries: MilkDelivery[];
  selectedDate: string;
  onAddDelivery: (farmerId: string, litres: number, date: string) => Promise<void>;
  onUpdateDelivery: (deliveryId: string, litres: number) => Promise<void>;
  isLoading?: boolean;
  isSaving?: boolean;
  isPending?: boolean;
}

export function FastEntryBoard({
  farmers,
  deliveries,
  selectedDate,
  onAddDelivery,
  onUpdateDelivery,
  isLoading = false,
  isSaving = false,
  isPending = false,
}: FastEntryBoardProps) {
  const [entries, setEntries] = useState<Record<string, number>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const inputRefs = useRef<Record<string, HTMLInputElement>>({});

  const activeFarmers = farmers.filter((f) => f.active);
  const savingFlag = isSaving ?? false;
  const pendingFlag = isPending ?? false;

  const selectedDeliveryForFarmer = (farmerId: string) =>
    deliveries.find(
      (d) =>
        d.farmer_id === farmerId &&
        d.date === selectedDate &&
        d.delivery_type === 'morning'
    );

  const previousDate = getDateOffsetString(selectedDate, -1);
  const previousDayTotal = (farmerId: string) =>
    deliveries
      .filter(
        (d) =>
          d.farmer_id === farmerId &&
          d.date === previousDate &&
          d.delivery_type === 'morning'
      )
      .reduce((sum, d) => sum + d.litres, 0);

  const hasRecentDelivery = (farmerId: string) => {
    const sevenDaysAgo = getDateOffsetString(selectedDate, -7);
    return deliveries.some(
      (d) =>
        d.farmer_id === farmerId &&
        d.delivery_type === 'morning' &&
        d.date >= sevenDaysAgo &&
        d.date < selectedDate
    );
  };

  const filteredFarmers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return activeFarmers.filter((farmer) =>
      farmer.name.toLowerCase().includes(query)
    );
  }, [activeFarmers, search]);

  const handleInputChange = (farmerId: string, value: string) => {
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

  const beginEdit = (farmerId: string, initialValue?: number) => {
    setEditingId(farmerId);
    if (initialValue !== undefined) {
      setEntries((prev) => ({
        ...prev,
        [farmerId]: initialValue,
      }));
    }
  };

  const handleSubmit = async (farmerId: string) => {
    const litres = entries[farmerId];
    if (
      submitting[farmerId] ||
      pendingFlag ||
      !litres ||
      litres <= 0 ||
      !validateMilkQuantity(litres)
    ) {
      return;
    }

    setSubmitting((prev) => ({ ...prev, [farmerId]: true }));
    try {
      const existing = selectedDeliveryForFarmer(farmerId);
      if (existing) {
        await onUpdateDelivery(existing.id, litres);
      } else {
        await onAddDelivery(farmerId, litres, selectedDate);
      }

      setEntries((prev) => {
        const next = { ...prev };
        delete next[farmerId];
        return next;
      });
      setEditingId(null);

      const nextIndex = filteredFarmers.findIndex((f) => f.id === farmerId) + 1;
      if (nextIndex < filteredFarmers.length) {
        setTimeout(() => {
          inputRefs.current[filteredFarmers[nextIndex].id]?.focus();
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
      <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Fast Entry Board</p>
            <p className="mt-1 text-xs text-gray-600">
              Enter or update litres for the selected day. All active farmers are listed.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search farmer"
              className="h-9 w-52 bg-transparent px-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[2fr_1fr_1fr_0.8fr] gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs uppercase tracking-wide text-gray-500 sm:grid sticky top-0 z-10">
          <span>Farmer</span>
          <span>Yesterday</span>
          <span>Today</span>
          <span className="text-right">Status</span>
        </div>
        {filteredFarmers.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-gray-600">No farmers match your search.</p>
          </Card>
        ) : (
          <div className="space-y-2 px-0 py-2 sm:px-4">
            {filteredFarmers.map((farmer) => {
              const delivery = selectedDeliveryForFarmer(farmer.id);
              const yesterdayTotal = previousDayTotal(farmer.id);
              const currentEntry = entries[farmer.id];
              const isSubmitting = submitting[farmer.id];
              const hasEntry = currentEntry !== undefined && currentEntry > 0;
              const isMissing = !delivery && hasRecentDelivery(farmer.id);

              return (
                <div
                  key={farmer.id}
                  className="grid grid-cols-1 gap-3 border-b border-gray-200 px-4 py-3 last:border-b-0 sm:grid-cols-[2fr_1fr_1fr_0.9fr] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{farmer.name}</p>
                    <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                      {delivery ? `Recorded: ${delivery.litres}L` : 'No entry yet'}
                    </p>
                  </div>

                  <div className="text-sm text-gray-700">
                    {yesterdayTotal}L
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={delivery ? 'secondary' : 'outline'}
                      onClick={() => beginEdit(farmer.id, delivery?.litres)}
                      className="min-w-[72px]"
                    >
                      {delivery ? 'Edit' : 'Add'}
                    </Button>
                    {editingId === farmer.id && (
                      <div className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1">
                        <button
                          onClick={() => handleQuickAdd(farmer.id, -0.5)}
                          className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100"
                          disabled={submitting[farmer.id] || savingFlag || pendingFlag}
                        >
                          <Minus className="h-4 w-4" />
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
                          className="h-9 w-20 border-0 px-2 text-center text-sm focus:ring-0"
                          autoFocus
                          disabled={submitting[farmer.id] || savingFlag || pendingFlag}
                        />
                        <button
                          onClick={() => handleQuickAdd(farmer.id, 0.5)}
                          className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100"
                          disabled={submitting[farmer.id] || savingFlag || pendingFlag}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-start gap-2 text-right text-sm sm:items-end">
                    {delivery ? (
                      <Badge variant="secondary" className="w-fit">
                        Saved
                      </Badge>
                    ) : isMissing ? (
                      <Badge variant="error" className="w-fit">
                        Missing
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="w-fit text-gray-600">
                        Pending
                      </Badge>
                    )}
                    {editingId === farmer.id && (
                      <Button
                        size="sm"
                        onClick={() => handleSubmit(farmer.id)}
                        disabled={!hasEntry || isSubmitting || isLoading || pendingFlag}
                      >
                        {isSubmitting || pendingFlag ? 'Saving...' : 'Save'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
