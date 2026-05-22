'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  calculateDailyProfit,
  calculateProfit,
  formatCurrency,
  formatDate,
  formatMonthYear,
  getTodayString,
} from '@/lib/utils';
import { fetchDeliveriesInRange, fetchFarmers, fetchLedgerEntriesInRange } from '@/lib/data';
import type { Farmer, LedgerEntry, MilkDelivery } from '@/types';

export default function ReportsPage() {
  const router = useRouter();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [deliveries, setDeliveries] = useState<MilkDelivery[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const today = getTodayString();
  const windowStart = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 2, 1);
    return date.toISOString().split('T')[0];
  }, []);

  useEffect(() => {
    const loadReports = async () => {
      setIsLoading(true);
      try {
        const [farmersData, deliveriesData, ledgerData] = await Promise.all([
          fetchFarmers(),
          fetchDeliveriesInRange(windowStart, today),
          fetchLedgerEntriesInRange(windowStart, today),
        ]);

        setFarmers(farmersData);
        setDeliveries(deliveriesData);
        setLedgerEntries(ledgerData);
      } catch (err) {
        setLoadError('Unable to load report data. Check your database connection and try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadReports();
  }, [today, windowStart]);

  const last7DailySummaries = useMemo(() => {
    if (deliveries.length === 0) return [];

    const grouped = deliveries.reduce<Record<string, MilkDelivery[]>>((acc, delivery) => {
      acc[delivery.date] = acc[delivery.date] || [];
      acc[delivery.date].push(delivery);
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .slice(0, 7)
      .map(([date, entries]) => {
        const totalLitres = entries.reduce((sum, item) => sum + item.litres, 0);
        return {
          date,
          totalLitres,
          totalFarmers: new Set(entries.map((item) => item.farmer_id)).size,
          estimatedProfit: calculateDailyProfit(totalLitres),
          estimatedPayout: totalLitres * 55,
        };
      });
  }, [deliveries]);

  const monthlySummaries = useMemo(() => {
    if (deliveries.length === 0) return [];

    const grouped = new Map<
      string,
      {
        year: number;
        month: number;
        totalLitres: number;
        totalPayouts: number;
        totalAdvances: number;
        farmerIds: Set<string>;
      }
    >();

    deliveries.forEach((delivery) => {
      const date = new Date(delivery.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          totalLitres: 0,
          totalPayouts: 0,
          totalAdvances: 0,
          farmerIds: new Set(),
        });
      }

      const summary = grouped.get(key)!;
      summary.totalLitres += delivery.litres;
      summary.totalPayouts += delivery.litres * 55;
      summary.farmerIds.add(delivery.farmer_id);
    });

    ledgerEntries.forEach((entry) => {
      const key = entry.transaction_date.slice(0, 7);
      const summary = grouped.get(key);
      if (!summary) return;
      if (entry.entry_type === 'advance_cash' || entry.entry_type === 'advance_goods') {
        summary.totalAdvances += entry.amount_kes;
      }
    });

    return Array.from(grouped.values())
      .map((item) => ({
        month: item.month,
        year: item.year,
        totalLitres: item.totalLitres,
        totalFarmers: item.farmerIds.size,
        totalPayouts: item.totalPayouts,
        totalAdvances: item.totalAdvances,
        estimatedProfit: calculateProfit(item.totalLitres, 55, 70),
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
  }, [deliveries, ledgerEntries]);

  const activeFarmers = farmers.filter((farmer) => farmer.active).length;

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="mt-1 text-sm text-gray-600">
          Daily and monthly collection summaries for your milk business.
        </p>
      </div>

      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Daily Report</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
          <TabsTrigger value="farmerReports">Farmer Statements</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-6 space-y-3">
          {isLoading ? (
            <Card className="p-6 text-center">
              <p className="text-gray-700">Loading daily report…</p>
            </Card>
          ) : last7DailySummaries.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-gray-700">No deliveries recorded for the current reporting window.</p>
            </Card>
          ) : (
            last7DailySummaries.map((report) => (
              <Card key={report.date}>
                <CardContent className="flex flex-col gap-4 p-4 sm:p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{formatDate(report.date)}</p>
                    <p className="mt-2 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                      <span>{report.totalLitres}L collected</span>
                      <span>{report.totalFarmers} farmers delivered</span>
                      <span>Profit: {formatCurrency(report.estimatedProfit)}</span>
                      <span>Payout: {formatCurrency(report.estimatedPayout)}</span>
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="monthly" className="mt-6 space-y-3">
          {isLoading ? (
            <Card className="p-6 text-center">
              <p className="text-gray-700">Loading monthly summaries…</p>
            </Card>
          ) : monthlySummaries.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-gray-700">No monthly collection data available yet.</p>
            </Card>
          ) : (
            monthlySummaries.map((summary) => (
              <Card key={`${summary.year}-${summary.month}`}>
                <CardHeader>
                  <CardTitle>{formatMonthYear(summary.year, summary.month)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">Total Litres</p>
                      <p className="mt-1 text-xl font-bold text-gray-900">{summary.totalLitres}L</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">Farmers</p>
                      <p className="mt-1 text-xl font-bold text-gray-900">{summary.totalFarmers}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">Total Payouts</p>
                      <p className="mt-1 text-xl font-bold text-gray-900">{formatCurrency(summary.totalPayouts)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">Advances</p>
                      <p className="mt-1 text-xl font-bold text-gray-900">{formatCurrency(summary.totalAdvances)}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs font-medium text-gray-600 uppercase">Est. Profit</p>
                      <p className="mt-1 text-xl font-bold text-milk-green-600">{formatCurrency(summary.estimatedProfit)}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="mt-4 w-full gap-2">
                    <FileText className="h-4 w-4" />
                    Export Summary
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="farmerReports" className="mt-6 space-y-3">
          <Card className="p-6">
            <div className="space-y-3">
              <p className="text-gray-700">
                Your farmer statement area shows active producers and payment readiness.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Active farmers</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{activeFarmers}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Reporting window</p>
                  <p className="mt-2 text-sm text-gray-900">{formatDate(windowStart)} – {formatDate(today)}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full gap-2" onClick={() => router.push('/farmers')}>
                View farmer list
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {loadError && (
        <Card className="p-6 text-center text-red-700">
          <p>{loadError}</p>
        </Card>
      )}
    </div>
  );
}
