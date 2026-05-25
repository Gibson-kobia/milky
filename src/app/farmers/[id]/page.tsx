'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchDeliveriesForFarmer, fetchFarmerById, fetchLedgerEntriesInRange } from '@/lib/data';
import { requireAuth } from '@/lib/auth';
import {
  formatCurrency,
  formatDate,
  formatLitres,
  getMonthStartString,
  getTodayString,
} from '@/lib/utils';
import type { Farmer, LedgerEntry, MilkDelivery } from '@/types';

export default function FarmerDetailPage(props: any) {
  const { id } = props.params;
  const router = useRouter();
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [deliveries, setDeliveries] = useState<MilkDelivery[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!requireAuth()) {
      router.push('/login');
      return;
    }

    const loadFarmer = async () => {
      const today = getTodayString();
      const monthStart = getMonthStartString();

      const [farmerRecord, farmerDeliveries, ledgerData] = await Promise.all([
        fetchFarmerById(id),
        fetchDeliveriesForFarmer(id, monthStart, today),
        fetchLedgerEntriesInRange(monthStart, today),
      ]);

      setFarmer(farmerRecord);
      setDeliveries(farmerDeliveries);
      setLedgerEntries(
        ledgerData.filter((entry) => entry.farmer_id === id)
      );
      setIsReady(true);
    };

    loadFarmer();
  }, [id, router]);

  const monthlyLitres = useMemo(
    () => deliveries.reduce((sum, delivery) => sum + delivery.litres, 0),
    [deliveries]
  );

  const monthlyPayout = monthlyLitres * 55;
  const monthlyProfit = monthlyLitres * 15;
  const monthlyAdvances = useMemo(
    () =>
      ledgerEntries
        .filter(
          (entry) =>
            entry.entry_type === 'advance_cash' ||
            entry.entry_type === 'advance_goods'
        )
        .reduce((sum, entry) => sum + entry.amount_kes, 0),
    [ledgerEntries]
  );

  const monthlyFinalPayout = monthlyPayout - monthlyAdvances;

  const recentDeliveries = useMemo(
    () => [...deliveries].slice(-7).reverse(),
    [deliveries]
  );

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-milk-green-50 to-white px-4 py-12">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-lg">
          <p className="text-sm font-medium text-gray-700">Loading farmer…</p>
        </div>
      </div>
    );
  }

  if (!farmer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-milk-green-50 to-white px-4 py-12">
        <Card className="p-8 text-center">
          <p className="text-gray-700">Farmer not found.</p>
          <Button className="mt-4" onClick={() => router.push('/farmers')}>
            Back to farmers
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{farmer.name}</h1>
          <p className="mt-1 text-sm text-gray-600">{farmer.phone}</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/farmers')}>
          Back
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.8fr_1fr]">
        <Card className="space-y-4 p-6">
          <div>
            <p className="text-sm font-semibold text-gray-700">Farmer details</p>
            <p className="mt-2 text-gray-900">{farmer.notes || 'No notes available.'}</p>
            <p className="mt-3 text-sm text-gray-600">
              Evening delivery: {farmer.evening_delivery_enabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-600">Month to date litres</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatLitres(monthlyLitres)}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-600">Gross earnings</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(monthlyPayout)}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-600">Final payout</p>
              <p className="mt-2 text-2xl font-bold text-milk-green-600">{formatCurrency(monthlyFinalPayout)}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-600">Advances</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(monthlyAdvances)}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-600">Est. profit</p>
              <p className="mt-2 text-2xl font-bold text-milk-green-600">{formatCurrency(monthlyProfit)}</p>
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <p className="text-sm font-semibold text-gray-700">Latest deliveries</p>
          {recentDeliveries.length === 0 ? (
            <p className="text-sm text-gray-600">No deliveries recorded for this month yet.</p>
          ) : (
            <div className="space-y-3">
              {recentDeliveries.map((delivery) => (
                <div key={delivery.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900">{formatDate(delivery.date)}</p>
                    <span className="text-xs uppercase tracking-wide text-gray-500">
                      {delivery.delivery_type}
                    </span>
                  </div>
                  <p className="mt-2 text-lg font-semibold text-gray-900">{formatLitres(delivery.litres)}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Earned: {formatCurrency(delivery.litres * 55)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
