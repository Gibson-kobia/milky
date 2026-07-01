'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, CircleDollarSign, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate, formatLitres } from '@/lib/utils';
import {
  fetchFarmerMonthHistory,
  fetchFarmerMonthlyStatement,
  fetchFarmerPaymentHistory,
  fetchFarmerPaymentsForMonth,
  fetchMonthlyPayoutRows,
  fetchMonthlyPayoutSummary,
  saveFarmerPayment,
} from '@/lib/data';
import type { FarmerMonthHistoryEntry, FarmerMonthlyStatement, MonthlyFarmerPayoutRow, MonthlyPayoutSummary, Payment } from '@/types';

function getDefaultMonth() {
  const today = new Date();
  const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const year = previousMonth.getFullYear();
  const month = String(previousMonth.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function monthLabel(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1, 1));
  return date.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });
}

export function MonthlyPayoutsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedMonth, setSelectedMonth] = useState(getDefaultMonth);
  const [detailMonth, setDetailMonth] = useState(getDefaultMonth);
  const [selectedRow, setSelectedRow] = useState<MonthlyFarmerPayoutRow | null>(null);
  const [statement, setStatement] = useState<FarmerMonthlyStatement | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<MonthlyPayoutSummary | null>(null);
  const [rows, setRows] = useState<MonthlyFarmerPayoutRow[]>([]);
  const [historyEntries, setHistoryEntries] = useState<FarmerMonthHistoryEntry[]>([]);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa'>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [payAmount, setPayAmount] = useState('');

  useEffect(() => {
    const monthFromUrl = searchParams?.get('month');
    if (monthFromUrl) {
      setSelectedMonth(monthFromUrl);
      setDetailMonth(monthFromUrl);
    } else {
      const defaultMonth = getDefaultMonth();
      setSelectedMonth(defaultMonth);
      setDetailMonth(defaultMonth);
      router.replace(`/monthly-payouts?month=${defaultMonth}`);
    }
  }, [router, searchParams]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [payoutSummary] = await Promise.all([
          fetchMonthlyPayoutSummary(selectedMonth),
        ]);
        setSummary(payoutSummary);
        setRows(await fetchMonthlyPayoutRows(selectedMonth));
      } catch (err) {
        console.error(err);
      }
    };

    if (selectedMonth) {
      loadData();
    }
  }, [selectedMonth]);

  const handleMonthChange = (direction: -1 | 1) => {
    const [year, monthNumber] = selectedMonth.split('-').map(Number);
    const current = new Date(Date.UTC(year, monthNumber - 1 + direction, 1));
    const nextMonth = `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(nextMonth);
    router.replace(`/monthly-payouts?month=${nextMonth}`);
  };

  const loadFarmerDetails = async (farmerId: string, month: string) => {
    setIsDetailLoading(true);
    try {
      const [statementData, historyData, historyEntriesData] = await Promise.all([
        fetchFarmerMonthlyStatement(farmerId, month),
        fetchFarmerPaymentsForMonth(farmerId, month),
        fetchFarmerMonthHistory(farmerId),
      ]);
      setStatement(statementData);
      setPaymentHistory(historyData);
      setHistoryEntries(historyEntriesData);
      setExpandedMonth(null);
      setPaymentDate(statementData?.payment?.date ?? new Date().toISOString().slice(0, 10));
      setPaymentMethod(statementData?.payment?.method ?? 'cash');
      setPaymentNotes(statementData?.payment?.notes ?? '');
      setPayAmount(statementData ? String(Math.max(statementData.net_amount - historyData.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0), 0)) : '');
    } catch (err) {
      console.error(err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleOpenStatement = async (row: MonthlyFarmerPayoutRow) => {
    setSelectedRow(row);
    setDetailMonth(selectedMonth);
    await loadFarmerDetails(row.farmer_id, selectedMonth);
  };

  const handleDetailMonthChange = async (direction: -1 | 1) => {
    if (!selectedRow) return;
    const [year, monthNumber] = detailMonth.split('-').map(Number);
    const current = new Date(Date.UTC(year, monthNumber - 1 + direction, 1));
    const nextMonth = `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, '0')}`;
    setDetailMonth(nextMonth);
    await loadFarmerDetails(selectedRow.farmer_id, nextMonth);
  };

  const handlePayFarmer = async () => {
    if (!selectedRow || !statement) return;

    const amountValue = Number(payAmount);
    if (!paymentDate || Number.isNaN(amountValue) || amountValue <= 0) {
      return;
    }

    setSubmitting(true);
    try {
      await saveFarmerPayment(selectedRow.farmer_id, amountValue, paymentMethod, paymentDate, paymentNotes || null);

      if (detailMonth === selectedMonth) {
        const [refreshedRows, refreshedSummary] = await Promise.all([
          fetchMonthlyPayoutRows(selectedMonth),
          fetchMonthlyPayoutSummary(selectedMonth),
        ]);
        setRows(refreshedRows);
        setSummary(refreshedSummary);
      }

      await loadFarmerDetails(selectedRow.farmer_id, detailMonth);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const monthOptions = historyEntries.map((entry) => entry.month);
  const previousPaymentsTotal = paymentHistory.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const remainingBalance = Math.max(Number(statement?.net_amount ?? 0) - previousPaymentsTotal, 0);
  const amountToPay = statement?.payment ? 0 : Math.max(remainingBalance, 0);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Monthly payouts</p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">{monthLabel(selectedMonth)}</h1>
          <p className="mt-2 text-sm text-gray-600">Pay each farmer for the selected month, one farmer at a time.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleMonthChange(-1)}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          <Input
            type="month"
            value={selectedMonth}
            onChange={(event) => {
              const monthValue = event.target.value;
              setSelectedMonth(monthValue);
              router.replace(`/monthly-payouts?month=${monthValue}`);
            }}
            className="w-[180px]"
          />
          <Button variant="outline" size="sm" onClick={() => handleMonthChange(1)}>
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {summary && (
        <div className="grid gap-4 xl:grid-cols-4">
          <Card className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-milk-green-50 p-3 text-milk-green-700"><CalendarDays className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total litres</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{formatLitres(summary.totalLitres)}</p>
              </div>
            </div>
          </Card>
          <Card className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-700"><CircleDollarSign className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Gross payout</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(summary.totalGrossPayout)}</p>
              </div>
            </div>
          </Card>
          <Card className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-700"><Wallet className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Advances</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(summary.totalAdvances)}</p>
              </div>
            </div>
          </Card>
          <Card className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><CheckCircle2 className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Net payout</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(summary.totalNetPayout)}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid gap-4">
        {rows.map((row) => (
          <div
            key={row.farmer_id}
            role="button"
            tabIndex={0}
            onClick={() => handleOpenStatement(row)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleOpenStatement(row);
              }
            }}
            className="cursor-pointer rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-milk-green-300 hover:shadow-md"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">{row.farmer_name}</h2>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {row.payment_status}
                  </span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Litres</p>
                    <p className="mt-1 text-base font-semibold text-gray-900">{formatLitres(row.total_litres)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Advances deducted</p>
                    <p className="mt-1 text-base font-semibold text-gray-900">{formatCurrency(row.advances)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Gross milk amount</p>
                    <p className="mt-1 text-base font-semibold text-gray-900">{formatCurrency(row.gross_amount)}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-right lg:min-w-[220px]">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Amount to pay</p>
                <p className="mt-2 text-3xl font-semibold text-emerald-700">{formatCurrency(row.net_amount)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={!!selectedRow}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRow(null);
            setStatement(null);
            setPaymentHistory([]);
            setHistoryEntries([]);
            setExpandedMonth(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-[95vw] overflow-hidden p-0 sm:max-w-5xl">
          <div className="flex h-full max-h-[90vh] flex-col">
            <div className="sticky top-0 z-10 flex-shrink-0 border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
              <DialogHeader className="space-y-3">
                <DialogTitle>{statement?.farmer_name ?? selectedRow?.farmer_name}</DialogTitle>
                <DialogDescription>
                  Review the selected month payout summary and delivery history before paying.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleDetailMonthChange(-1)}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Previous Month
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDetailMonthChange(1)}>
                    Next Month <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <select
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  value={detailMonth}
                  onChange={(event) => {
                    const nextMonth = event.target.value;
                    setDetailMonth(nextMonth);
                    if (selectedRow) {
                      void loadFarmerDetails(selectedRow.farmer_id, nextMonth);
                    }
                  }}
                >
                  {(monthOptions.length > 0 ? monthOptions : [detailMonth]).map((month) => (
                    <option key={month} value={month}>
                      {monthLabel(month)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              {isDetailLoading ? (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
                  Loading payout details...
                </div>
              ) : statement ? (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Previous month payout</p>
                        <p className="mt-1 text-sm text-gray-600">{monthLabel(detailMonth)}</p>
                      </div>
                      <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                        {statement.payment ? 'Paid' : 'Unpaid'}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-5">
                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Month</p>
                      <p className="mt-2 text-xl font-semibold text-gray-900">{monthLabel(detailMonth)}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Milk rate</p>
                      <p className="mt-2 text-xl font-semibold text-gray-900">{formatCurrency(statement.gross_amount / Math.max(statement.total_litres, 1))}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total litres</p>
                      <p className="mt-2 text-xl font-semibold text-gray-900">{formatLitres(statement.total_litres)}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Advances</p>
                      <p className="mt-2 text-xl font-semibold text-gray-900">{formatCurrency(statement.advances)}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Balance to pay</p>
                      <p className="mt-2 text-xl font-semibold text-gray-900">{formatCurrency(amountToPay)}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Previous month payout summary</p>
                        <p className="mt-1 text-sm text-gray-600">Gross earnings, advances deducted, payments made, and final payout amount.</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Gross earnings</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(statement.gross_amount)}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-4">
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total litres</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">{formatLitres(statement.total_litres)}</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Gross amount</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(statement.gross_amount)}</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Advances</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(statement.advances)}</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Payments made</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(previousPaymentsTotal)}</p>
                      </div>
                    </div>
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Final amount to pay</p>
                      <p className="mt-2 text-3xl font-semibold text-emerald-700">{formatCurrency(amountToPay)}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Month history</h3>
                    <div className="space-y-3">
                      {historyEntries.map((entry) => {
                        const isExpanded = expandedMonth === entry.month;
                        const isCurrentMonth = entry.month === detailMonth;
                        return (
                          <div key={entry.month} className="rounded-2xl border border-gray-200 bg-white">
                            <button
                              type="button"
                              className="flex w-full items-center justify-between px-4 py-3 text-left"
                              onClick={() => setExpandedMonth(isExpanded ? null : entry.month)}
                            >
                              <div>
                                <p className="font-semibold text-gray-900">{monthLabel(entry.month)}</p>
                                <p className="mt-1 text-sm text-gray-600">{formatLitres(entry.totalLitres)} • {formatCurrency(entry.netAmount)}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${entry.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {entry.paymentStatus}
                                </span>
                                <span className="text-sm font-medium text-milk-green-700">{isExpanded ? 'Hide' : 'Show'}</span>
                              </div>
                            </button>
                            {isExpanded && (
                              <div className="space-y-4 border-t border-gray-200 px-4 py-4">
                                <div className="grid gap-3 sm:grid-cols-4">
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Litres</p>
                                    <p className="mt-1 font-semibold text-gray-900">{formatLitres(entry.totalLitres)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Gross</p>
                                    <p className="mt-1 font-semibold text-gray-900">{formatCurrency(entry.grossAmount)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Advances</p>
                                    <p className="mt-1 font-semibold text-gray-900">{formatCurrency(entry.advances)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Net</p>
                                    <p className="mt-1 font-semibold text-gray-900">{formatCurrency(entry.netAmount)}</p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-sm font-semibold text-gray-700">Deliveries</p>
                                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                                    <table className="min-w-full divide-y divide-gray-200">
                                      <thead className="bg-gray-50">
                                        <tr>
                                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Type</th>
                                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Litres</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-200 bg-white">
                                        {entry.deliveries.length === 0 ? (
                                          <tr><td colSpan={3} className="px-3 py-3 text-sm text-gray-600">No deliveries.</td></tr>
                                        ) : entry.deliveries.map((delivery) => (
                                          <tr key={delivery.id}><td className="px-3 py-2 text-sm text-gray-700">{formatDate(delivery.date)}</td><td className="px-3 py-2 text-sm text-gray-700">{delivery.delivery_type}</td><td className="px-3 py-2 text-sm text-gray-700">{formatLitres(delivery.litres)}</td></tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-sm font-semibold text-gray-700">Advances</p>
                                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                                    <table className="min-w-full divide-y divide-gray-200">
                                      <thead className="bg-gray-50">
                                        <tr>
                                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Amount</th>
                                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-200 bg-white">
                                        {entry.advancesDetail.length === 0 ? (
                                          <tr><td colSpan={3} className="px-3 py-3 text-sm text-gray-600">No advances.</td></tr>
                                        ) : entry.advancesDetail.map((advance) => (
                                          <tr key={advance.id}><td className="px-3 py-2 text-sm text-gray-700">{formatDate(advance.transaction_date)}</td><td className="px-3 py-2 text-sm text-gray-700">{formatCurrency(advance.amount_kes)}</td><td className="px-3 py-2 text-sm text-gray-700">{advance.description ?? '—'}</td></tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-sm font-semibold text-gray-700">Payments</p>
                                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                                    <table className="min-w-full divide-y divide-gray-200">
                                      <thead className="bg-gray-50">
                                        <tr>
                                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Amount</th>
                                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Method</th>
                                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-200 bg-white">
                                        {entry.payments.length === 0 ? (
                                          <tr><td colSpan={4} className="px-3 py-3 text-sm text-gray-600">No payments.</td></tr>
                                        ) : entry.payments.map((payment) => (
                                          <tr key={payment.id}><td className="px-3 py-2 text-sm text-gray-700">{formatDate(payment.date)}</td><td className="px-3 py-2 text-sm text-gray-700">{formatCurrency(payment.amount)}</td><td className="px-3 py-2 text-sm text-gray-700">{payment.method}</td><td className="px-3 py-2 text-sm text-gray-700">{payment.notes ?? '—'}</td></tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                                {isCurrentMonth && (
                                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                                    <p className="text-sm font-semibold text-gray-900">Current month payout</p>
                                    <p className="mt-1 text-sm text-gray-600">Use the payment controls at the bottom to record a payment for this month.</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Delivery history</h3>
                    <div className="overflow-x-auto rounded-2xl border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Type</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Litres</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {statement.deliveries.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="px-3 py-4 text-sm text-gray-600">No deliveries for this month.</td>
                            </tr>
                          ) : (
                            statement.deliveries.map((delivery) => (
                              <tr key={delivery.id}>
                                <td className="px-3 py-2 text-sm text-gray-700">{formatDate(delivery.date)}</td>
                                <td className="px-3 py-2 text-sm text-gray-700">{delivery.delivery_type}</td>
                                <td className="px-3 py-2 text-sm text-gray-700">{formatLitres(delivery.litres)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Advances</h3>
                    <div className="overflow-x-auto rounded-2xl border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Amount</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {statement.advances_detail.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="px-3 py-4 text-sm text-gray-600">No advances for this month.</td>
                            </tr>
                          ) : (
                            statement.advances_detail.map((advance) => (
                              <tr key={advance.id}>
                                <td className="px-3 py-2 text-sm text-gray-700">{formatDate(advance.transaction_date)}</td>
                                <td className="px-3 py-2 text-sm text-gray-700">{formatCurrency(advance.amount_kes)}</td>
                                <td className="px-3 py-2 text-sm text-gray-700">{advance.description ?? '—'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Previous payments</h3>
                    <div className="overflow-x-auto rounded-2xl border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Amount</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Method</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {paymentHistory.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-3 py-4 text-sm text-gray-600">No payments for this month.</td>
                            </tr>
                          ) : (
                            paymentHistory.map((payment) => (
                              <tr key={payment.id}>
                                <td className="px-3 py-2 text-sm text-gray-700">{formatDate(payment.date)}</td>
                                <td className="px-3 py-2 text-sm text-gray-700">{formatCurrency(payment.amount)}</td>
                                <td className="px-3 py-2 text-sm text-gray-700">{payment.method}</td>
                                <td className="px-3 py-2 text-sm text-gray-700">{payment.notes ?? '—'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
                  No payout details available for this farmer.
                </div>
              )}
            </div>

            <div className="sticky bottom-0 z-10 flex-shrink-0 border-t border-gray-200 bg-white px-4 py-4 sm:px-6">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Milk deliveries</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{statement ? formatLitres(statement.total_litres) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Advances</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{statement ? formatCurrency(statement.advances) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Previous payments</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{formatCurrency(previousPaymentsTotal)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Balance remaining</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{formatCurrency(remainingBalance)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Amount to pay</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{formatCurrency(amountToPay)}</p>
                  </div>
                  <div className="flex items-end justify-end">
                    <Button onClick={handlePayFarmer} disabled={submitting || !paymentDate || !payAmount || !!statement?.payment}>
                      {submitting ? 'Saving…' : 'Pay'}
                    </Button>
                  </div>
                </div>
                {!statement?.payment ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Input type="number" value={payAmount} onChange={(event) => setPayAmount(event.target.value)} placeholder="Amount" />
                    <Input type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} />
                    <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as 'cash' | 'mpesa')}>
                      <option value="cash">Cash</option>
                      <option value="mpesa">Mpesa</option>
                    </select>
                    <Input value={paymentNotes} onChange={(event) => setPaymentNotes(event.target.value)} placeholder="Payment notes" />
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                    This payout month has already been recorded as paid.
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={() => {
                  setSelectedRow(null);
                  setStatement(null);
                  setPaymentHistory([]);
                  setHistoryEntries([]);
                  setExpandedMonth(null);
                }}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
