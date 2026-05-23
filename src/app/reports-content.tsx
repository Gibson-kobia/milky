'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  calculateDailyProfit,
  calculateProfit,
  formatCurrency,
  formatDate,
  formatDateHeading,
  formatMonthYear,
  getTodayString,
  getDateOffsetString,
  isValidIsoDate,
} from '@/lib/utils';
import { fetchDailyCollectionAggregates, fetchFarmers } from '@/lib/data';
import type { Farmer } from '@/types';

interface DailySummary {
  day: string;
  totalLitres: number;
  totalFarmers: number;
  totalAdvances: number;
  totalPayout: number;
}

export function ReportsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const today = getTodayString();
  const windowStart = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 2, 1);
    return date.toISOString().split('T')[0];
  }, []);

  useEffect(() => {
    const paramDate = searchParams?.get('date');
    if (paramDate && isValidIsoDate(paramDate)) {
      setSelectedDate(paramDate);
    } else {
      setSelectedDate(today);
      router.replace(`/reports?date=${today}`);
    }
  }, [router, searchParams, today]);

  useEffect(() => {
    const loadReports = async () => {
      setIsLoading(true);
      try {
        const [farmersData, collectionData] = await Promise.all([
          fetchFarmers(),
          fetchDailyCollectionAggregates(windowStart, today),
        ]);

        setFarmers(farmersData);
        setDailySummaries(collectionData);
      } catch (err) {
        setLoadError('Unable to load report data. Check your database connection and try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadReports();
  }, [today, windowStart]);

  const selectedSummary = useMemo(
    () => dailySummaries.find((summary) => summary.day === selectedDate) ?? null,
    [dailySummaries, selectedDate]
  );

  const last7DailySummaries = useMemo(() => {
    return dailySummaries.slice(0, 7).map((summary) => ({
      ...summary,
      estimatedProfit: calculateDailyProfit(summary.totalLitres),
      estimatedPayout: summary.totalLitres * 55 - summary.totalAdvances,
    }));
  }, [dailySummaries]);

  const monthlySummaries = useMemo(() => {
    if (dailySummaries.length === 0) return [];

    const grouped = new Map<
      string,
      {
        year: number;
        month: number;
        totalLitres: number;
        totalPayouts: number;
        totalAdvances: number;
        farmerVisits: number;
      }
    >();

    dailySummaries.forEach((summary) => {
      const date = new Date(summary.day);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          totalLitres: 0,
          totalPayouts: 0,
          totalAdvances: 0,
          farmerVisits: 0,
        });
      }

      const summaryGroup = grouped.get(key)!;
      summaryGroup.totalLitres += summary.totalLitres;
      summaryGroup.totalPayouts += summary.totalLitres * 55;
      summaryGroup.totalAdvances += summary.totalAdvances;
      summaryGroup.farmerVisits += summary.totalFarmers;
    });

    return Array.from(grouped.values())
      .map((item) => ({
        month: item.month,
        year: item.year,
        totalLitres: item.totalLitres,
        totalFarmers: item.farmerVisits,
        totalPayouts: item.totalPayouts,
        totalAdvances: item.totalAdvances,
        estimatedProfit: calculateProfit(item.totalLitres, 55, 70),
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return a.month - b.month;
      });
  }, [dailySummaries]);

  const activeFarmers = farmers.filter((farmer) => farmer.active).length;
  const previousDate = getDateOffsetString(selectedDate, -1);
  const nextDate = getDateOffsetString(selectedDate, 1);
  const canGoBack = previousDate >= windowStart;
  const canGoForward = nextDate <= today;

  const handleDateChange = (value: string) => {
    if (!isValidIsoDate(value)) return;
    setSelectedDate(value);
    router.push(`/reports?date=${value}`);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Reports</p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">{formatDateHeading(selectedDate)}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDateChange(previousDate)}
            disabled={!canGoBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            type="date"
            value={selectedDate}
            min={windowStart}
            max={today}
            onChange={(event) => handleDateChange(event.target.value)}
            className="max-w-[180px]"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDateChange(nextDate)}
            disabled={!canGoForward}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {selectedSummary ? (
        <Card className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Litres</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{selectedSummary.totalLitres}L</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Farmers</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{selectedSummary.totalFarmers}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Advances</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{formatCurrency(selectedSummary.totalAdvances)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Payout</p>
              <p className="mt-2 text-2xl font-semibold text-milk-green-600">{formatCurrency(selectedSummary.totalPayout)}</p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-700">No summary available for the selected date.</p>
        </Card>
      )}

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
              <Card key={report.day}>
                <CardContent className="flex flex-col gap-4 p-4 sm:p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{formatDate(report.day)}</p>
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
