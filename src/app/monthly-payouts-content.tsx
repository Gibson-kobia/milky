'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, CalendarDays, CheckCircle2, CircleDollarSign, FileText, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate, formatLitres } from '@/lib/utils';
import {
  fetchBuyingRate,
  fetchFarmerMonthlyStatement,
  fetchMonthlyPayoutRows,
  fetchMonthlyPayoutSummary,
  saveFarmerPayment,
} from '@/lib/data';
import type { MonthlyPayoutSummary, MonthlyFarmerPayoutRow, FarmerMonthlyStatement } from '@/types';

function getDefaultMonth() {
  const today = new Date();
  const month = today.getMonth();
  const year = today.getFullYear();
  return month === 0 ? `${year - 1}-12` : `${year}-${String(month).padStart(2, '0')}`;
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
  const [selectedRow, setSelectedRow] = useState<MonthlyFarmerPayoutRow | null>(null);
  const [statement, setStatement] = useState<FarmerMonthlyStatement | null>(null);
  const [summary, setSummary] = useState<MonthlyPayoutSummary | null>(null);
  const [rows, setRows] = useState<MonthlyFarmerPayoutRow[]>([]);
  const [buyingRate, setBuyingRate] = useState(55);
  const [submitting, setSubmitting] = useState(false);
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa'>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  useEffect(() => {
    const monthFromUrl = searchParams?.get('month');
    if (monthFromUrl) {
      setSelectedMonth(monthFromUrl);
    } else {
      const defaultMonth = getDefaultMonth();
      setSelectedMonth(defaultMonth);
      router.replace(`/monthly-payouts?month=${defaultMonth}`);
    }
  }, [router, searchParams]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [rate, payoutSummary] = await Promise.all([
          fetchBuyingRate(),
          fetchMonthlyPayoutSummary(selectedMonth),
        ]);
        setBuyingRate(rate);
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

  const handleOpenStatement = async (row: MonthlyFarmerPayoutRow) => {
    const statementData = await fetchFarmerMonthlyStatement(row.farmer_id, selectedMonth);
    setSelectedRow(row);
    setStatement(statementData);
    setPaymentDate(statementData?.payment?.date ?? '');
    setPaymentMethod(statementData?.payment?.method ?? 'cash');
    setPaymentNotes(statementData?.payment?.notes ?? '');
  };

  const handleMarkPaid = async () => {
    if (!selectedRow) return;
    setSubmitting(true);
    try {
      await saveFarmerPayment(selectedRow.farmer_id, selectedRow.net_amount, paymentMethod, paymentDate || selectedMonth, paymentNotes);
      const refreshedRows = await fetchMonthlyPayoutRows(selectedMonth);
      setRows(refreshedRows);
      const refreshedStatement = await fetchFarmerMonthlyStatement(selectedRow.farmer_id, selectedMonth);
      setStatement(refreshedStatement);
      setSelectedRow(refreshedRows.find((row) => row.farmer_id === selectedRow.farmer_id) ?? null);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Monthly payouts</p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">{monthLabel(selectedMonth)}</h1>
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
        <div className="grid gap-4 xl:grid-cols-3">
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
          <Card className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-gray-100 p-3 text-gray-700"><FileText className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Active farmers</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.activeFarmers}</p>
              </div>
            </div>
          </Card>
          <Card className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-gray-100 p-3 text-gray-700"><FileText className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Paid / unpaid</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.paidCount} / {summary.unpaidCount}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Farmer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Litres</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Milk rate</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Gross</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Advances</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Net</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {rows.map((row) => (
                <tr key={row.farmer_id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{row.farmer_name}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{formatLitres(row.total_litres)}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{formatCurrency(row.milk_rate)}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{formatCurrency(row.gross_amount)}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{formatCurrency(row.advances)}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-gray-900">{formatCurrency(row.net_amount)}</td>
                  <td className="px-4 py-4 text-sm">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {row.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <Button variant="outline" size="sm" onClick={() => handleOpenStatement(row)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-3 p-4 lg:hidden">
          {rows.map((row) => (
            <div key={row.farmer_id} className="rounded-2xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">{row.farmer_name}</p>
                  <p className="mt-1 text-sm text-gray-600">{formatLitres(row.total_litres)} • {formatCurrency(row.net_amount)}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {row.payment_status}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <p>Rate: {formatCurrency(row.milk_rate)}</p>
                  <p>Advances: {formatCurrency(row.advances)}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleOpenStatement(row)}>
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={!!selectedRow} onOpenChange={(open) => { if (!open) { setSelectedRow(null); setStatement(null); } }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{statement?.farmer_name ?? selectedRow?.farmer_name}</DialogTitle>
            <DialogDescription>{monthLabel(selectedMonth)} monthly statement</DialogDescription>
          </DialogHeader>

          {statement && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total litres</p>
                  <p className="mt-2 text-xl font-semibold text-gray-900">{formatLitres(statement.total_litres)}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Gross amount</p>
                  <p className="mt-2 text-xl font-semibold text-gray-900">{formatCurrency(statement.gross_amount)}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Advances</p>
                  <p className="mt-2 text-xl font-semibold text-gray-900">{formatCurrency(statement.advances)}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Net payable</p>
                  <p className="mt-2 text-xl font-semibold text-gray-900">{formatCurrency(statement.net_amount)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Deliveries</h3>
                <div className="overflow-x-auto rounded-2xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Type</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Litres</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Daily value</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Running total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {statement.deliveries.map((delivery, index) => {
                        const dailyValue = Number((delivery.litres * buyingRate).toFixed(2));
                        const runningTotal = Number(((index + 1 === 0 ? 0 : statement.deliveries.slice(0, index + 1).reduce((sum, item) => sum + item.litres, 0)) * buyingRate).toFixed(2));
                        return (
                          <tr key={delivery.id}>
                            <td className="px-3 py-2 text-sm text-gray-700">{formatDate(delivery.date)}</td>
                            <td className="px-3 py-2 text-sm text-gray-700">{delivery.delivery_type}</td>
                            <td className="px-3 py-2 text-sm text-gray-700">{formatLitres(delivery.litres)}</td>
                            <td className="px-3 py-2 text-sm text-gray-700">{formatCurrency(dailyValue)}</td>
                            <td className="px-3 py-2 text-sm text-gray-700">{formatCurrency(runningTotal)}</td>
                          </tr>
                        );
                      })}
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
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Reason</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {statement.advances_detail.map((advance) => (
                        <tr key={advance.id}>
                          <td className="px-3 py-2 text-sm text-gray-700">{formatDate(advance.transaction_date)}</td>
                          <td className="px-3 py-2 text-sm text-gray-700">{formatCurrency(advance.amount_kes)}</td>
                          <td className="px-3 py-2 text-sm text-gray-700">{advance.entry_type === 'advance_cash' ? 'Cash' : 'Goods'}</td>
                          <td className="px-3 py-2 text-sm text-gray-700">{advance.description ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Payment workflow</p>
                    <p className="mt-1 text-sm text-gray-600">Mark the farmer as paid for this month.</p>
                  </div>
                  <div className="flex flex-col gap-2 md:min-w-[240px]">
                    <Input type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} />
                    <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as 'cash' | 'mpesa')}>
                      <option value="cash">Cash</option>
                      <option value="mpesa">Mpesa</option>
                    </select>
                    <Input value={paymentNotes} onChange={(event) => setPaymentNotes(event.target.value)} placeholder="Payment notes" />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button onClick={handleMarkPaid} disabled={submitting || !paymentDate}>
                    {submitting ? 'Saving…' : 'Mark as Paid'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedRow(null); setStatement(null); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
