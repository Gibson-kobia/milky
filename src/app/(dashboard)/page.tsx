'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FastEntryBoard } from '@/components/fast-entry-board';
import { DailyDashboard } from '@/components/daily-dashboard';
import { Card } from '@/components/ui/card';
import { useToast } from '@/lib/stores/ui';
import { getTodayString, calculateDailyProfit } from '@/lib/utils';
import type { Farmer, MilkDelivery } from '@/types';
import {
  fetchFarmers,
  fetchDeliveriesByDate,
  saveMilkDelivery,
  updateMilkDelivery,
} from '@/lib/data';

export default function DashboardPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [deliveries, setDeliveries] = useState<MilkDelivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
        error('Failed to load dashboard data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [error]);

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
            !(
              d.farmer_id === farmerId &&
              d.date === today &&
              d.delivery_type === 'morning'
            )
        ),
        newDelivery,
      ]);

      success(`${litres}L queued for syncing`);
    } catch (err) {
      error('Failed to add delivery');
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
  const farmersDelivered = new Set(todayDeliveries.map((d) => d.farmer_id))
    .size;
  const estimatedProfit = calculateDailyProfit(totalLitres);
  const estimatedPayout = totalLitres * 55;

  if (!isLoading && farmers.length === 0) {
    return (
      <div className="space-y-6 pb-12">
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-milk-green-600 text-white">
            <Plus className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">No Farmers Yet</h1>
          <p className="mt-2 text-sm text-gray-600">
            Your database is empty. Add the first farmer to begin collecting milk and tracking payments.
          </p>
          <Button onClick={() => router.push('/farmers')} className="mt-6">
            Add First Farmer
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <DailyDashboard
        totalLitres={totalLitres}
        totalFarmers={farmersDelivered}
        estimatedProfit={estimatedProfit}
        estimatedPayout={estimatedPayout}
      />

      <FastEntryBoard
        farmers={farmers}
        deliveries={deliveries}
        onAddDelivery={handleAddDelivery}
        onUpdateDelivery={handleUpdateDelivery}
        isLoading={isLoading}
      />

      <Card className="p-4 sm:p-6">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Farmer
          </Button>
          <Button variant="outline" className="gap-2">
            View Farmers
          </Button>
          <Button variant="outline" className="gap-2">
            Monthly Report
          </Button>
        </div>
      </Card>
    </div>
  );
}
