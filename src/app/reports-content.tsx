'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  formatCurrency,
  formatDate,
  formatDateHeading,
  formatLitres,
  formatMonthYear,
  getTodayString,
  getDateOffsetString,
  isValidIsoDate,
} from '@/lib/utils';
import {
  fetchDailyCollectionAggregates,
  fetchDailySummaryByDate,
  fetchFarmers,
  fetchMonthlySummaryByMonth,
} from '@/lib/data';
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
  const [selectedSummary, setSelectedSummary] = useState<DailySummary | null>(null);
  const [selectedMonthSummary, setSelectedMonthSummary] = useState<{
    month: string;
    totalLitres: number;
    totalFarmers: number;
    totalAdvances: number;
    totalPayout: number;
  } | null>(null);
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
        const [farmersData, collectionData, dailySummaryData, monthSummaryData] = await Promise.all([
          fetchFarmers(),
          fetchDailyCollectionAggregates(windowStart, today),
          fetchDailySummaryByDate(selectedDate),
          fetchMonthlySummaryByMonth(selectedDate),
        ]);

        setFarmers(farmersData);
        setDailySummaries(collectionData);
        setSelectedSummary(dailySummaryData);
        setSelectedMonthSummary(monthSummaryData);
      } catch (err) {
        setLoadError('Unable to load report data. Check your database connection and try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadReports();
  }, [selectedDate, today, windowStart]);

  const last7DailySummaries = useMemo(() => dailySummaries.slice(0, 7), [dailySummaries]);

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
    <div className="space-y-6 pb-12 px-4 sm:px-6 lg:px-8">
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

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Daily Summary</p>
              {selectedSummary ? (
                <p className="mt-2 text-lg font-semibold text-gray-900">{formatDate(selectedSummary.day)}</p>
              ) : (
                <p className="mt-2 text-lg font-semibold text-gray-900">No selected date</p>
              )}
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-center">
              <p className="text-xs uppercase tracking-wide text-gray-500">Farmers</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{selectedSummary?.totalFarmers ?? 0}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Litres collected</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{formatLitres(selectedSummary?.totalLitres ?? 0)}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total payout</p>
              <p className="mt-2 text-3xl font-semibold text-milk-green-600">
                {formatCurrency(selectedSummary?.totalPayout ?? 0)}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total advances</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{formatCurrency(selectedSummary?.totalAdvances ?? 0)}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Farmer visits</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{selectedSummary?.totalFarmers ?? 0}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Monthly Snapshot</p>
              {selectedMonthSummary ? (
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {formatMonthYear(new Date(selectedMonthSummary.month).getFullYear(), new Date(selectedMonthSummary.month).getMonth() + 1)}
                </p>
              ) : (
                <p className="mt-2 text-lg font-semibold text-gray-900">No month data</p>
              )}
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-center">
              <p className="text-xs uppercase tracking-wide text-gray-500">Active farmers</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{activeFarmers}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Month total litres</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{formatLitres(selectedMonthSummary?.totalLitres ?? 0)}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total payout</p>
                <p className="mt-2 text-xl font-semibold text-gray-900">{formatCurrency(selectedMonthSummary?.totalPayout ?? 0)}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total advances</p>
                <p className="mt-2 text-xl font-semibold text-gray-900">{formatCurrency(selectedMonthSummary?.totalAdvances ?? 0)}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Farmer visits</p>
              <p className="mt-2 text-xl font-semibold text-gray-900">{selectedMonthSummary?.totalFarmers ?? 0}</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Daily Summary</TabsTrigger>
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
            <>
              <div className="space-y-3 lg:hidden">
                {last7DailySummaries.map((report) => (
                  <Card key={report.day}>
                    <CardContent className="flex flex-col gap-4 p-4 sm:p-6 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{formatDate(report.day)}</p>
                        <p className="mt-2 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                          <span>{formatLitres(report.totalLitres)} collected</span>
                          <span>{report.totalFarmers} farmers delivered</span>
                          <span>Payout: {formatCurrency(report.totalPayout)}</span>
                          <span>Advances: {formatCurrency(report.totalAdvances)}</span>
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Export</span>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="hidden lg:block overflow-x-auto rounded-3xl border border-gray-200 bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Litres</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Farmers</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Payout</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Advances</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {last7DailySummaries.map((report) => (
                      <tr key={report.day} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{formatDate(report.day)}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{formatLitres(report.totalLitres)}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{report.totalFarmers}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{formatCurrency(report.totalPayout)}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{formatCurrency(report.totalAdvances)}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <Button variant="outline" size="sm" className="gap-2">
                            <Download className="h-4 w-4" />
                            <span>Export</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="monthly" className="mt-6 space-y-3">
          {isLoading ? (
            <Card className="p-6 text-center">
              <p className="text-gray-700">Loading monthly summary…</p>
            </Card>
          ) : selectedMonthSummary ? (
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-500">Month</p>
                    <p className="mt-2 text-lg font-semibold text-gray-900">
                      {formatMonthYear(new Date(selectedMonthSummary.month).getFullYear(), new Date(selectedMonthSummary.month).getMonth() + 1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Farmer visits</p>
                    <p className="mt-2 text-lg font-semibold text-gray-900">{selectedMonthSummary.totalFarmers}</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total litres</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">{formatLitres(selectedMonthSummary.totalLitres)}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total payout</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">{formatCurrency(selectedMonthSummary.totalPayout)}</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-gray-100 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total advances</p>
                    <p className="mt-2 text-xl font-semibold text-gray-900">{formatCurrency(selectedMonthSummary.totalAdvances)}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Farmer visits</p>
                    <p className="mt-2 text-xl font-semibold text-gray-900">{selectedMonthSummary.totalFarmers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-gray-700">No monthly summary available for this month.</p>
            </Card>
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
