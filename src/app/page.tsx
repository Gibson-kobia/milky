'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FastEntryBoard } from '@/components/fast-entry-board';
import { DailyDashboard } from '@/components/daily-dashboard';
import { useToast } from '@/lib/stores/ui';
import {
  formatDate,
  getDateOffsetString,
  getMonthStartString,
  getTodayString,
  isToday,
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
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!requireAuth()) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        const today = getTodayString();
        const monthStart = getMonthStartString();
        const [farmersData, deliveriesData] = await Promise.all([
          fetchFarmers(),
          fetchDeliveriesInRange(monthStart, today),
        ]);

        setFarmers(farmersData);
        setDeliveries(deliveriesData);
        setSelectedDate(today);
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
  }, [error, router]);

  const handleAddDelivery = async (
    farmerId: string,
    litres: number,
    date: string
  ) => {
    try {
      const newDelivery = await saveMilkDelivery(
        farmerId,
        litres,
        'morning',
        date
      );

      setDeliveries((prev) => [
        ...prev.filter(
          (d) =>
            !(d.farmer_id === farmerId &&
              d.date === date &&
              d.delivery_type === 'morning')
        ),
        newDelivery,
      ]);

      success(`${litres}L saved`);
    } catch (err) {
      error('Failed to save delivery');
      console.error(err);
    }
  };

  const handleUpdateDelivery = async (deliveryId: string, litres: number) => {
    try {
      const updated = await updateMilkDelivery(deliveryId, litres);
      setDeliveries((prev) =>
        prev.map((delivery) =>
          delivery.id === updated.id ? updated : delivery
        )
      );
      success(`Updated to ${litres}L`);
    } catch (err) {
      error('Failed to update delivery');
      console.error(err);
    }
  };

  const today = getTodayString();
  const monthStart = getMonthStartString();
  const previousDate = getDateOffsetString(selectedDate, -1);
  const nextDate = getDateOffsetString(selectedDate, 1);
  const canGoBack = previousDate >= monthStart;
  const canGoForward = nextDate <= today;

  const selectedDeliveries = deliveries.filter(
    (d) => d.date === selectedDate && d.delivery_type === 'morning'
  );
  const totalLitres = selectedDeliveries.reduce((sum, d) => sum + d.litres, 0);
  const farmersDelivered = new Set(
    selectedDeliveries.map((d) => d.farmer_id)
  ).size;
  const selectedPayout = totalLitres * 55;
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

  const handleDateChange = (value: string) => {
    if (value < monthStart || value > today) return;
    setSelectedDate(value);
  };

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Milky</h1>
          <p className="mt-1 max-w-xl text-sm text-gray-600">
            A calm, fast screen for daily milk recording.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => router.push('/farmers')}>
            Manage Farmers
          </Button>
          <Button variant="outline" onClick={() => router.push('/reports')}>
            Reports
          </Button>
          <Button variant="outline" onClick={() => router.push('/settings')}>
            Settings
          </Button>
        </div>
      </div>

      <Card className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Recording date
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDateChange(previousDate)}
                disabled={!canGoBack}
              >
                ← Yesterday
              </Button>
              <Input
                type="date"
                value={selectedDate}
                min={monthStart}
                max={today}
                onChange={(event) => handleDateChange(event.target.value)}
                className="max-w-[180px]"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDateChange(nextDate)}
                disabled={!canGoForward}
              >
                Tomorrow →
              </Button>
            </div>
          </div>
          <div className="rounded-3xl bg-milk-green-50 p-4 text-sm text-milk-green-900 sm:text-right">
            <p className="font-medium">
              {isToday(selectedDate) ? 'Today' : formatDate(selectedDate)}
            </p>
            <p className="mt-1 text-xs text-gray-600">
              Select a day and enter litres quickly.
            </p>
          </div>
        </div>
      </Card>

      <DailyDashboard
        dateLabel={isToday(selectedDate) ? 'Today' : formatDate(selectedDate)}
        todayLitres={totalLitres}
        todayFarmers={farmersDelivered}
        todayPayout={selectedPayout}
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
        />
      )}
    </div>
  );
}
