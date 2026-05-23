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

  const handleKeyPress = (e: React.KeyboardEvent, farmerId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(farmerId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Milk Entry</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search farmer..."
            className="pl-10 py-2 text-sm"
          />
        </div>
      </div>

      {/* Farmer List */}
      <Card className="overflow-hidden">
        {/* Header Row - Desktop only */}
        <div className="hidden border-b border-gray-100 bg-gray-50 px-4 py-3 sm:grid sm:grid-cols-[1.5fr_1fr_1fr] sm:gap-4 sm:sticky sm:top-0 sm:z-10">
          <span className="label-operational">Farmer</span>
          <span className="label-operational">Litres</span>
          <span className="label-operational text-right">Status</span>
        </div>

        {filteredFarmers.length === 0 ? (
          <div className="px-4 py-8 text-center sm:px-6">
            <p className="text-sm text-gray-500">No farmers match your search.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredFarmers.map((farmer, index) => {
              const delivery = selectedDeliveryForFarmer(farmer.id);
              const currentEntry = entries[farmer.id] ?? (delivery ? delivery.litres : 0);
              const isSubmitting = submitting[farmer.id];
              const isSaved = !!delivery;

              return (
                <div
                  key={farmer.id}
                  className={`px-4 py-3.5 sm:py-4 sm:grid sm:grid-cols-[1.5fr_1fr_1fr] sm:gap-4 sm:items-center transition-colors duration-150 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  {/* Farmer Name - Clickable for Modal */}
                  <button
                    onClick={() => setModalOpenFor(farmer.id)}
                    className="text-left mb-3 sm:mb-0 hover:text-milk-green-600 transition-colors"
                  >
                    <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                      {farmer.name}
                    </p>
                  </button>

                  {/* Mobile: Label + Input Stack */}
                  <div className="sm:hidden space-y-2 mb-3">
                    <label className="label-operational">Litres</label>
                    <Input
                      ref={(el) => {
                        if (el) inputRefs.current[farmer.id] = el;
                      }}
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="Enter litres"
                      value={currentEntry ?? ''}
                      onChange={(e) => handleInputChange(farmer.id, e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, farmer.id)}
                      className="w-full py-2 text-base"
                      disabled={isSubmitting || isSaved}
                    />
                  </div>

                  {/* Desktop: Input + Save Button Row */}
                  <div className="hidden sm:flex items-center gap-2">
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
                      className="h-9 flex-1 text-center text-sm py-2"
                      disabled={isSubmitting || isSaved}
                    />
                  </div>

                  {/* Status / Save Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    {isSaved ? (
                      <div className="flex items-center gap-1.5 text-sm text-milk-green-700">
                        <div className="flex items-center justify-center h-5 w-5 rounded bg-milk-green-50">
                          <Check className="h-3.5 w-3.5 text-milk-green-600" />
                        </div>
                        <span className="font-medium hidden sm:inline">Saved</span>
                      </div>
                    ) : hasRecentDelivery(farmer.id) ? (
                      <Badge variant="error" className="text-xs sm:text-sm">Missing</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs sm:text-sm text-gray-600">Pending</Badge>
                    )}

                    {!isSaved && (
                      <Button
                        size="sm"
                        onClick={() => handleSubmit(farmer.id)}
                        disabled={isSubmitting || isLoading || !currentEntry || currentEntry <= 0}
                        className="sm:hidden"
                      >
                        {isSubmitting ? '...' : 'Save'}
                      </Button>
                    )}

                    {!isSaved && (
                      <Button
                        size="sm"
                        onClick={() => handleSubmit(farmer.id)}
                        disabled={isSubmitting || isLoading || !currentEntry || currentEntry <= 0}
                        className="hidden sm:inline-flex"
                      >
                        {isSubmitting ? 'Saving...' : 'Save'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Farmer Modal */}
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
  );
}
