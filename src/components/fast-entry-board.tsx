'use client';

import { useMemo, useRef, useState } from 'react';
import { Search, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDateOffsetString, normalizeDateString, validateMilkQuantity } from '@/lib/utils';
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

function logFilterDebug(
  deliveries: MilkDelivery[],
  selectedDate: string,
  lastKeyRef: React.MutableRefObject<string>
) {
  const debugRows: Array<{
    deliveryDate: string;
    deliveryDateType: string;
    normalizedDeliveryDate: string;
    selectedDate: string;
    normalizedSelectedDate: string;
    deliveryType: string;
    comparisonResult: boolean;
  }> = [];

  for (const delivery of deliveries) {
    const deliveryDate = String(delivery.date ?? '');
    if (!deliveryDate.startsWith('2026-07-27') || debugRows.length >= 10) {
      continue;
    }

    debugRows.push({
      deliveryDate,
      deliveryDateType: typeof delivery.date,
      normalizedDeliveryDate: deliveryDate,
      selectedDate,
      normalizedSelectedDate: selectedDate,
      deliveryType: delivery.delivery_type,
      comparisonResult: deliveryDate === selectedDate && delivery.delivery_type === 'morning',
    });
  }

  const signature = JSON.stringify({ selectedDate, rows: debugRows });
  if (lastKeyRef.current === signature) {
    return;
  }

  lastKeyRef.current = signature;
  console.groupCollapsed('Delivery pipeline :: FILTER_DEBUG');
  if (debugRows.length === 0) {
    console.log('No matching 2026-07-27 deliveries found.');
  } else {
    const output = debugRows
      .map(
        (row) =>
          [
            '----------',
            `Delivery date:\n${row.deliveryDate}`,
            `typeof delivery.date: ${row.deliveryDateType}`,
            `normalizedDeliveryDate: ${row.normalizedDeliveryDate}`,
            `selectedDate: ${row.selectedDate}`,
            `normalizedSelectedDate: ${row.normalizedSelectedDate}`,
            `delivery.delivery_type: ${row.deliveryType}`,
            `comparison result: ${String(row.comparisonResult)}`,
          ].join('\n')
      )
      .join('\n');
    console.log(output);
  }
  console.groupEnd();
}

function logBoardStage(
  stage: string,
  rows: MilkDelivery[],
  selectedDate: string,
  farmerNames: string[],
  lastKeyRef: React.MutableRefObject<string>
) {
  const deliveryDates = rows.slice(0, 3).map((row) => row.date);
  const names = farmerNames.slice(0, 3);
  const signature = JSON.stringify({ stage, rowCount: rows.length, selectedDate, deliveryDates, names });

  if (lastKeyRef.current === signature) {
    return;
  }

  lastKeyRef.current = signature;
  console.groupCollapsed(`Delivery pipeline :: ${stage}`);
  console.log(`Stage: ${stage}`);
  console.log(`Row count: ${rows.length}`);
  console.log(`Selected date: ${selectedDate}`);
  console.log(`First 3 delivery dates: ${deliveryDates.join(', ') || 'none'}`);
  console.log(`First 3 farmer names: ${names.join(', ') || 'none'}`);
  console.groupEnd();
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
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const inputRefs = useRef<Record<string, HTMLInputElement>>({});
  const boardLogKeyRef = useRef('');

  const activeFarmers = farmers.filter((f) => f.active);
  const pendingFlag = isPending ?? false;
  const normalizedSelectedDate = normalizeDateString(selectedDate);
  logBoardStage('BEFORE_DATE_FILTER', deliveries, selectedDate, activeFarmers.map((farmer) => farmer.name), boardLogKeyRef);
  logFilterDebug(deliveries, selectedDate, boardLogKeyRef);
  const displayedDeliveries = deliveries.filter((delivery) => {
    const rawDate = delivery.date;
    const normalizedDate = normalizeDateString(rawDate);
    const matches =
      normalizedDate === normalizedSelectedDate && delivery.delivery_type === 'morning';

    return matches;
  });
  logBoardStage('AFTER_DATE_FILTER', displayedDeliveries, selectedDate, activeFarmers.map((farmer) => farmer.name), boardLogKeyRef);
  const missingFarmers = activeFarmers.filter((farmer) =>
    !displayedDeliveries.some((delivery) => delivery.farmer_id === farmer.id)
  );
  void missingFarmers;

  const selectedDeliveryForFarmer = (farmerId: string) =>
    displayedDeliveries.find((d) => d.farmer_id === farmerId);

  const hasRecentDelivery = (farmerId: string) => {
    const sevenDaysAgo = getDateOffsetString(normalizedSelectedDate, -7);
    return deliveries.some(
      (d) =>
        d.farmer_id === farmerId &&
        d.delivery_type === 'morning' &&
        normalizeDateString(d.date) >= sevenDaysAgo &&
        normalizeDateString(d.date) < normalizedSelectedDate
    );
  };

  const filteredFarmers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return activeFarmers.filter((farmer) =>
      farmer.name.toLowerCase().includes(query)
    );
  }, [activeFarmers, search]);

  logBoardStage('BEFORE_RENDER', displayedDeliveries, selectedDate, activeFarmers.map((farmer) => farmer.name), boardLogKeyRef);

  const handleInputChange = (farmerId: string, value: string) => {
    const numValue = parseFloat(value);
    // Allow any non-negative numeric input during typing (no validation)
    // Validation happens only at save time
    if (value === '') {
      setEntries((prev) => {
        const next = { ...prev };
        delete next[farmerId];
        return next;
      });
      return;
    }

    if (!Number.isNaN(numValue) && numValue >= 0) {
      setEntries((prev) => ({
        ...prev,
        [farmerId]: numValue,
      }));
    }
  };

  const toggleEdit = (farmerId: string, loadValue = false) => {
    setEditing((prev) => ({ ...prev, [farmerId]: !prev[farmerId] }));
    if (loadValue) {
      const delivery = selectedDeliveryForFarmer(farmerId);
      if (delivery) setEntries((prev) => ({ ...prev, [farmerId]: delivery.litres }));
    }
  };

  const formatEditTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  const setModalOpenFor = (farmerId: string | null) => {
    setModalFarmerId(farmerId);
  };

  const handleSubmit = async (farmerId: string) => {
    const litres = entries[farmerId];
    const farmer = filteredFarmers.find((f) => f.id === farmerId);
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
      // exit editing mode after save
      setEditing((prev) => ({ ...prev, [farmerId]: false }));

      const nextIndex = filteredFarmers.findIndex((f) => f.id === farmerId) + 1;
      if (nextIndex < filteredFarmers.length) {
        setTimeout(() => {
          inputRefs.current[filteredFarmers[nextIndex].id]?.focus();
        }, 50);
      }
    } catch (error) {
      console.error('[Milk Save Failed]', {
        farmer: farmer?.name ?? farmerId,
        date: selectedDate,
        litres,
        error,
      });
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
const currentEntry = entries[farmer.id] ?? (delivery ? delivery.litres : undefined);
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
                        step="any"
                      min="0"
                      inputMode="decimal"
                      placeholder="Enter litres"
                      value={currentEntry ?? ''}
                      onChange={(e) => handleInputChange(farmer.id, e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, farmer.id)}
                      className="w-full py-2 text-base"
                      disabled={isSubmitting || (isSaved && !editing[farmer.id])}
                    />
                  </div>

                  {/* Desktop: Input Row */}
                  <div className="hidden sm:flex items-center gap-2">
                    <Input
                      ref={(el) => {
                        if (el) inputRefs.current[farmer.id] = el;
                      }}
                      type="number"
                        step="any"
                      min="0"
                      inputMode="decimal"
                      placeholder="0"
                      value={currentEntry ?? ''}
                      onChange={(e) => handleInputChange(farmer.id, e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, farmer.id)}
                      className="h-9 flex-1 text-center text-sm py-2"
                      disabled={isSubmitting || (isSaved && !editing[farmer.id])}
                    />
                  </div>

                  {/* Status / Save Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    {isSaved ? (
                      <div className="flex items-center gap-1.5 text-sm text-milk-green-700">
                        <Check className="h-4 w-4 text-milk-green-600" />
                        <span className="text-xs text-gray-600">
                          {selectedDeliveryForFarmer(farmer.id)?.updated_at ? `Saved ${formatEditTime(selectedDeliveryForFarmer(farmer.id)!.updated_at)}` : 'Saved'}
                        </span>
                      </div>
                    ) : hasRecentDelivery(farmer.id) ? (
                      <Badge variant="error" className="text-xs sm:text-sm">Missing</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs sm:text-sm text-gray-600">Pending</Badge>
                    )}

                    {isSaved && !editing[farmer.id] ? (
                      <Button size="sm" onClick={() => { toggleEdit(farmer.id, true); }}>
                        Edit
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleSubmit(farmer.id)}
                          disabled={isSubmitting || isLoading || currentEntry === undefined || currentEntry <= 0}
                          className="sm:hidden"
                        >
                          {isSubmitting ? '...' : 'Save'}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSubmit(farmer.id)}
                          disabled={isSubmitting || isLoading || currentEntry === undefined || currentEntry <= 0}
                          className="hidden sm:inline-flex"
                        >
                          {isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                        {editing[farmer.id] && (
                          <Button size="sm" variant="outline" onClick={() => setEditing((p) => ({ ...p, [farmer.id]: false }))}>
                            Cancel
                          </Button>
                        )}
                      </>
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
