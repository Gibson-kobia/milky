'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FastEntryBoard } from '@/components/fast-entry-board';
import { DailyDashboard } from '@/components/daily-dashboard';
import { useToast } from '@/lib/stores/ui';
import {
  formatDateHeading,
  getAdjacentDateWithRecords,
  getCurrentDate,
} from '@/lib/utils';
import type { Farmer, MilkDelivery } from '@/types';
import {
  fetchDeliveriesInRange,
  fetchFarmers,
  saveMilkDelivery,
  updateMilkDelivery,
} from '@/lib/data';
import { requireAuth } from '@/lib/auth';

export function HomeContent() {
  const router = useRouter();
  const { success, error } = useToast();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [deliveries, setDeliveries] = useState<MilkDelivery[]>([]);
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<string>(getCurrentDate);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!requireAuth()) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        const today = getCurrentDate();
        const [farmersData, deliveriesData] = await Promise.all([
          fetchFarmers(),
          fetchDeliveriesInRange('1900-01-01', today),
        ]);

        setFarmers(farmersData);
        setDeliveries(deliveriesData);

        const paramDate = searchParams?.get('date');
        if (paramDate) {
          setSelectedDate(paramDate);
        } else {
          setSelectedDate(today);
          router.replace(`/?date=${today}`);
        }
      } catch (err) {
        setLoadError(
          'Unable to load data. Please check your Supabase settings and try again.'
        );
        error('Failed to load data');
        console.error(err);
      } finally {
        setIsLoading(false);
        setIsReady(true);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, searchParams]);

  useEffect(() => {
    const param = searchParams?.get('date');
    if (param && param !== selectedDate) {
      setSelectedDate(param);
    }
  }, [searchParams, selectedDate]);

  const handleAddDelivery = async (
    farmerId: string,
    litres: number,
    date: string
  ) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const newDelivery = await saveMilkDelivery(
        farmerId,
        litres,
        'morning',
        date
      );
      startTransition(() => {
        setDeliveries((prev) => [
          ...prev.filter(
            (d) =>
              !(d.farmer_id === farmerId &&
                d.date === date &&
                d.delivery_type === 'morning')
          ),
          newDelivery,
        ]);
      });
      success(`${litres}L saved`);
    } catch {
      error('Failed to save delivery');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateDelivery = async (deliveryId: string, litres: number) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const updated = await updateMilkDelivery(deliveryId, litres);
      startTransition(() => {
        setDeliveries((prev) =>
          prev.map((delivery) =>
            delivery.id === updated.id ? updated : delivery
          )
        );
      });
      success(`Updated to ${litres}L`);
    } catch {
      error('Failed to update delivery');
    } finally {
      setIsSaving(false);
    }
  };

  const recordDates = useMemo(
    () => Array.from(new Set(deliveries.map((delivery) => delivery.date))).sort(),
    [deliveries]
  );
  const previousDate = getAdjacentDateWithRecords(selectedDate, 'previous', recordDates);
  const nextDate = getAdjacentDateWithRecords(selectedDate, 'next', recordDates);
  const canGoBack = previousDate !== selectedDate;
  const canGoForward = nextDate !== selectedDate;

  const updateDateInUrl = (value: string, replace = false) => {
    const url = `/?date=${value}`;
    if (replace) router.replace(url);
    else router.push(url);
  };

  const handleDateChange = (value: string) => {
    if (value > getCurrentDate()) return;
    setSelectedDate(value);
    updateDateInUrl(value);
  };

  const selectedDeliveries = deliveries.filter(
    (d) => d.date === selectedDate && d.delivery_type === 'morning'
  );

  const totalLitres = selectedDeliveries.reduce((sum, d) => sum + d.litres, 0);
  
  const farmersDelivered = new Set(
    selectedDeliveries.map((d) => d.farmer_id)
  ).size;

  const sortedFarmers = useMemo(() => {
    return [...farmers]
      .filter((farmer) => farmer.active)
      .sort((a, b) => {
        const aFrequency = deliveries.filter(
          (delivery) =>
            delivery.farmer_id === a.id &&
            delivery.delivery_type === 'morning'
        ).length;
        const bFrequency = deliveries.filter(
          (delivery) =>
            delivery.farmer_id === b.id &&
            delivery.delivery_type === 'morning'
        ).length;

        if (aFrequency !== bFrequency) {
          return bFrequency - aFrequency;
        }

        return a.name.localeCompare(b.name);
      });
  }, [deliveries, farmers]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-gray-700">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="space-y-6 pb-24">
        {/* Date Navigation Bar */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="label-operational">Selected Date</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-950">
              {formatDateHeading(selectedDate)}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDateChange(previousDate)}
              disabled={!canGoBack}
              className="h-10 w-10 p-0"
              aria-label="Previous day"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDateChange(nextDate)}
              disabled={!canGoForward}
              className="h-10 w-10 p-0"
              aria-label="Next day"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Daily Metrics */}
        <DailyDashboard
          dateLabel={formatDateHeading(selectedDate)}
          todayLitres={totalLitres}
          todayFarmers={farmersDelivered}
        />

        {/* Error State */}
        {loadError ? (
          <Card className="border-red-200 bg-red-50 p-6">
            <p className="text-sm text-red-700 font-medium">{loadError}</p>
            <Button
              size="sm"
              className="mt-4"
              onClick={() => router.refresh()}
            >
              Retry
            </Button>
          </Card>
        ) : (
          <FastEntryBoard
            farmers={sortedFarmers}
            deliveries={deliveries}
            selectedDate={selectedDate}
            onAddDelivery={handleAddDelivery}
            onUpdateDelivery={handleUpdateDelivery}
            isLoading={isLoading}
            isSaving={isSaving}
            isPending={isPending}
          />
        )}
      </div>
    </div>
  );
}
