'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FastEntryBoard } from '@/components/fast-entry-board';
import { DailyDashboard } from '@/components/daily-dashboard';
import { useToast } from '@/lib/stores/ui';
import {
  formatDateHeading,
  getDateOffsetString,
  getMonthStartString,
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

export default function HomePage() {
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
        const monthStart = getMonthStartString();
        const [farmersData, deliveriesData] = await Promise.all([
          fetchFarmers(),
          fetchDeliveriesInRange(monthStart, today),
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
    // Only run on mount - searchParams is reactive elsewhere when user navigates
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
    if (isSaving) return; // prevent duplicate global saves
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
    } catch (err) {
      error('Failed to save delivery');
      console.error(err);
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
    } catch (err) {
      error('Failed to update delivery');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const monthStart = getMonthStartString();
  const previousDate = getDateOffsetString(selectedDate, -1);
  const nextDate = getDateOffsetString(selectedDate, 1);
  const canGoBack = previousDate >= monthStart;
  const canGoForward = nextDate <= getCurrentDate();

  const updateDateInUrl = (value: string, replace = false) => {
    const url = `/?date=${value}`;
    if (replace) router.replace(url); else router.push(url);
  };

  const handleDateChange = (value: string) => {
    if (value < monthStart || value > getCurrentDate()) return;
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
    const dateYesterday = getDateOffsetString(selectedDate, -1);

    return [...farmers]
      .filter((farmer) => farmer.active)
      .sort((a, b) => {
        const aDeliveredYesterday = deliveries.some(
          (delivery) =>
            delivery.farmer_id === a.id &&
            delivery.date === dateYesterday &&
            delivery.delivery_type === 'morning'
        );
        const bDeliveredYesterday = deliveries.some(
          (delivery) =>
            delivery.farmer_id === b.id &&
            delivery.date === dateYesterday &&
            delivery.delivery_type === 'morning'
        );

        if (aDeliveredYesterday !== bDeliveredYesterday) {
          return aDeliveredYesterday ? -1 : 1;
        }

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
  }, [deliveries, farmers, selectedDate]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-milk-green-50 to-white px-4 py-12">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-lg">
          <p className="text-sm font-medium text-gray-700">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Milky</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDateChange(previousDate)}
            disabled={!canGoBack}
            aria-label="Previous day"
          >
            ←
          </Button>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Selected date</p>
            <h2 className="text-lg font-semibold text-gray-900">{formatDateHeading(selectedDate)}</h2>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDateChange(nextDate)}
            disabled={!canGoForward}
            aria-label="Next day"
          >
            →
          </Button>
        </div>
      </div>

      <DailyDashboard
        dateLabel={formatDateHeading(selectedDate)}
        todayLitres={totalLitres}
        todayFarmers={farmersDelivered}
      />

      {loadError ? (
        <Card className="p-6 text-center">
          <p className="text-red-700">{loadError}</p>
          <Button className="mt-4" onClick={() => router.refresh()}>
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
  );
}
