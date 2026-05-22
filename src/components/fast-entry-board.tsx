'use client';

import { useMemo, useRef, useState } from 'react';
import { Search, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDateOffsetString, validateMilkQuantity } from '@/lib/utils';
import type { Farmer, MilkDelivery } from '@/types';
import FarmerProfileModal from './farmer-profile-modal';

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
  isSaving: _isSaving = false,
  isPending = false,
}: FastEntryBoardProps) {
  const [entries, setEntries] = useState<Record<string, number>>({});
  const [modalFarmerId, setModalFarmerId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const inputRefs = useRef<Record<string, HTMLInputElement>>({});

  const activeFarmers = farmers.filter((f) => f.active);
  const pendingFlag = isPending ?? false;

  const selectedDeliveryForFarmer = (farmerId: string) =>
    deliveries.find(
      (d) =>
        d.farmer_id === farmerId &&
        d.date === selectedDate &&
        d.delivery_type === 'morning'
    );

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


  const setModalOpenFor = (farmerId: string | null) => {
    setModalFarmerId(farmerId);
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
      // editing state removed; no-op

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
            <p className="text-sm font-semibold text-gray-900">Fast Entry</p>
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
        <div className="hidden grid-cols-[2fr_1fr_0.8fr] gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs uppercase tracking-wide text-gray-500 sm:grid sticky top-0 z-10">
          <span>Farmer</span>
          <span>Litres</span>
          <span className="text-right">Action</span>
        </div>
        {filteredFarmers.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-gray-600">No farmers match your search.</p>
          </Card>
        ) : (
          <div className="space-y-2 px-0 py-2 sm:px-4">
              {filteredFarmers.map((farmer) => {
              const delivery = selectedDeliveryForFarmer(farmer.id);
              const currentEntry = entries[farmer.id] ?? (delivery ? delivery.litres : 0);
              const isSubmitting = submitting[farmer.id];
              const isSaved = !!delivery;

              return (
                <div
                  key={farmer.id}
                  className="grid grid-cols-1 gap-3 border-b border-gray-200 px-4 py-3 last:border-b-0 sm:grid-cols-[2fr_1fr_0.9fr] sm:items-center"
                >
                  <div className="min-w-0">
                    <button onClick={() => setModalOpenFor(farmer.id)} className="text-left w-full">
                      <p className="font-medium text-gray-900 truncate">{farmer.name}</p>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      ref={(el) => {
                        if (el) inputRefs.current[farmer.id] = el;
                      }}
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="0"
                      value={currentEntry ?? ''}
                      onChange={(e) => handleInputChange(farmer.id, e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, farmer.id)}
                      className="h-9 w-24 border-0 px-2 text-center text-sm focus:ring-0"
                      disabled={isSubmitting || isSaved}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSubmit(farmer.id)}
                      disabled={isSubmitting || isSaved || isLoading}
                    >
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                  </div>

                  <div className="text-right">
                    {isSaved ? (
                      <span className="inline-flex items-center gap-1 text-sm text-milk-green-700">
                        <Check className="h-4 w-4 text-milk-green-600" /> Saved
                      </span>
                    ) : hasRecentDelivery(farmer.id) ? (
                      <Badge variant="error" className="w-fit">Missing</Badge>
                    ) : (
                      <Badge variant="outline" className="w-fit text-gray-600">Pending</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {modalFarmerId && (
          <FarmerProfileModal
            farmerId={modalFarmerId}
            open={!!modalFarmerId}
            onOpenChange={(open) => {
              if (!open) setModalOpenFor(null);
            }}
            selectedDate={selectedDate}
          />
        )}
      </div>
    </div>
  );
}
