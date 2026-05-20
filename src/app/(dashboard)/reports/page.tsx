'use client';

import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate, formatMonthYear } from '@/lib/utils';

interface MonthlySummaryData {
  month: number;
  year: number;
  totalFarmers: number;
  totalLitres: number;
  totalPayouts: number;
  totalAdvances: number;
  estimatedProfit: number;
}

export default function ReportsPage() {
  const mockMonthlySummaries: MonthlySummaryData[] = [
    {
      month: 12,
      year: 2025,
      totalFarmers: 4,
      totalLitres: 95.5,
      totalPayouts: 5252.5,
      totalAdvances: 500,
      estimatedProfit: 1432.5,
    },
    {
      month: 11,
      year: 2025,
      totalFarmers: 4,
      totalLitres: 88,
      totalPayouts: 4840,
      totalAdvances: 300,
      estimatedProfit: 1320,
    },
  ];

  const mockDailyReport = [
    {
      date: new Date().toISOString().split('T')[0],
      totalLitres: 12.5,
      totalFarmers: 4,
      estimatedProfit: 187.5,
      estimatedPayout: 687.5,
    },
    {
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      totalLitres: 10,
      totalFarmers: 3,
      estimatedProfit: 150,
      estimatedPayout: 550,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="mt-1 text-sm text-gray-600">
          View and download daily and monthly reports
        </p>
      </div>

      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Daily Report</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
          <TabsTrigger value="farmerReports">Farmer Statements</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-6 space-y-3">
          {mockDailyReport.map((report) => (
            <Card key={report.date}>
              <CardContent className="flex items-center justify-between p-4 sm:p-6">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {formatDate(report.date)}
                  </p>
                  <p className="mt-2 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                    <span>{report.totalLitres}L collected</span>
                    <span>{report.totalFarmers} farmers delivered</span>
                    <span>Profit: {formatCurrency(report.estimatedProfit)}</span>
                    <span>Payout: {formatCurrency(report.estimatedPayout)}</span>
                  </p>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">PDF</span>
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="monthly" className="mt-6 space-y-3">
          {mockMonthlySummaries.map((summary) => (
            <Card key={`${summary.year}-${summary.month}`}>
              <CardHeader>
                <CardTitle>
                  {formatMonthYear(summary.year, summary.month)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">
                      Total Litres
                    </p>
                    <p className="mt-1 text-xl font-bold text-gray-900">
                      {summary.totalLitres}L
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">
                      Farmers
                    </p>
                    <p className="mt-1 text-xl font-bold text-gray-900">
                      {summary.totalFarmers}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">
                      Total Payouts
                    </p>
                    <p className="mt-1 text-xl font-bold text-gray-900">
                      {formatCurrency(summary.totalPayouts)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">
                      Est. Profit
                    </p>
                    <p className="mt-1 text-xl font-bold text-milk-green-600">
                      {formatCurrency(summary.estimatedProfit)}
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="mt-4 w-full gap-2">
                  <FileText className="h-4 w-4" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="farmerReports" className="mt-6">
          <Card className="p-6">
            <p className="text-gray-600">
              Select a farmer to generate their monthly statement PDF
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
