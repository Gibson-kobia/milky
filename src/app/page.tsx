'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FastEntryBoard } from '@/components/fast-entry-board';
import { DailyDashboard } from '@/components/daily-dashboard';
import { useToast } from '@/lib/stores/ui';
import { getTodayString, calculateDailyProfit } from '@/lib/utils';
import type { Farmer, MilkDelivery } from '@/types';
import {
  fetchFarmers,
  fetchDeliveriesByDate,
  saveMilkDelivery,
  updateMilkDelivery,
} from '@/lib/data';
import { requireAuth } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [deliveries, setDeliveries] = useState<MilkDelivery[]>([]);
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
        const [farmersData, deliveriesData] = await Promise.all([
          fetchFarmers(),
          fetchDeliveriesByDate(today),
        ]);

        setFarmers(farmersData);
        setDeliveries(deliveriesData);
      } catch (err) {
        setLoadError('Unable to load data. Please check your Supabase settings and try again.');
        error('Failed to load data');
        console.error(err);
      } finally {
        setIsLoading(false);
        setIsReady(true);
      }
    };

    loadData();
  }, [router, error]);

  const handleAddDelivery = async (farmerId: string, litres: number) => {
    try {
      const today = getTodayString();
      const newDelivery = await saveMilkDelivery(
        farmerId,
        litres,
        'morning',
        today
      );

      setDeliveries((prev) => [
        ...prev.filter(
          (d) =>
            !(d.farmer_id === farmerId && d.date === today && d.delivery_type === 'morning')
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
  const todayDeliveries = deliveries.filter((d) => d.date === today);
  const totalLitres = todayDeliveries.reduce((sum, d) => sum + d.litres, 0);
  const farmersDelivered = new Set(todayDeliveries.map((d) => d.farmer_id)).size;
  const estimatedProfit = calculateDailyProfit(totalLitres);
  const estimatedPayout = totalLitres * 55;

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
          <p className="mt-1 text-sm text-gray-600">
            Fast milk collection, farmer tracking, and daily profit estimates.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => router.push('/farmers')}>Manage Farmers</Button>
          <Button variant="outline" onClick={() => router.push('/reports')}>
            Reports
          </Button>
          <Button variant="outline" onClick={() => router.push('/settings')}>
            Settings
          </Button>
        </div>
      </div>

      <DailyDashboard
        totalLitres={totalLitres}
        totalFarmers={farmersDelivered}
        estimatedProfit={estimatedProfit}
        estimatedPayout={estimatedPayout}
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
          farmers={farmers}
          deliveries={deliveries}
          onAddDelivery={handleAddDelivery}
          onUpdateDelivery={handleUpdateDelivery}
          isLoading={isLoading}
        />
      )}

      <Card className="p-4 sm:p-6">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => router.push('/farmers')}>
            Add Farmer
          </Button>
          <Button variant="outline" onClick={() => router.push('/reports')}>
            Monthly Report
          </Button>
        </div>
      </Card>
    </div>
  );
}
