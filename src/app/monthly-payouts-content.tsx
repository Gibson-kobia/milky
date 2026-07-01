'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, CircleDollarSign, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate, formatLitres } from '@/lib/utils';
import {
  fetchFarmerMonthlyStatement,
  fetchFarmerPaymentHistory,
  fetchMonthlyPayoutRows,
  fetchMonthlyPayoutSummary,
  saveFarmerPayment,
} from '@/lib/data';
import type { FarmerMonthlyStatement, MonthlyFarmerPayoutRow, MonthlyPayoutSummary, Payment } from '@/types';

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
  const [detailMonth, setDetailMonth] = useState(getDefaultMonth);
  const [selectedRow, setSelectedRow] = useState<MonthlyFarmerPayoutRow | null>(null);
  const [statement, setStatement] = useState<FarmerMonthlyStatement | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<MonthlyPayoutSummary | null>(null);
  const [rows, setRows] = useState<MonthlyFarmerPayoutRow[]>([]);
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
      const [statementData, historyData] = await Promise.all([
        fetchFarmerMonthlyStatement(farmerId, month),
        fetchFarmerPaymentHistory(farmerId),
      ]);
      setStatement(statementData);
      setPaymentHistory(historyData);
      setPaymentDate(statementData?.payment?.date ?? new Date().toISOString().slice(0, 10));
      setPaymentMethod(statementData?.payment?.method ?? 'cash');
      setPaymentNotes(statementData?.payment?.notes ?? '');
      setPayAmount(statementData ? String(statementData.net_amount) : '');
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
          }
        }}
      >
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{statement?.farmer_name ?? selectedRow?.farmer_name}</DialogTitle>
            <DialogDescription>
              Review payouts, deliveries, advances, and payment history for {monthLabel(detailMonth)}.
            </DialogDescription>
          </DialogHeader>

          {isDetailLoading ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
              Loading payout details...
            </div>
          ) : statement ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{monthLabel(detailMonth)}</p>
                  <p className="mt-1 text-sm text-gray-600">Switch months to review prior payout periods without changing historical records.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleDetailMonthChange(-1)}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDetailMonthChange(1)}>
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-5">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total litres</p>
                  <p className="mt-2 text-xl font-semibold text-gray-900">{formatLitres(statement.total_litres)}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Milk rate</p>
                  <p className="mt-2 text-xl font-semibold text-gray-900">{formatCurrency(statement.gross_amount / Math.max(statement.total_litres, 1))}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Gross amount</p>
                  <p className="mt-2 text-xl font-semibold text-gray-900">{formatCurrency(statement.gross_amount)}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total advances</p>
                  <p className="mt-2 text-xl font-semibold text-gray-900">{formatCurrency(statement.advances)}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Net amount to pay</p>
                  <p className="mt-2 text-xl font-semibold text-gray-900">{formatCurrency(statement.net_amount)}</p>
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
                          <td colSpan={3} className="px-3 py-4 text-sm text-gray-600">No deliveries recorded for this month.</td>
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
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Advance history</h3>
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
                          <td colSpan={3} className="px-3 py-4 text-sm text-gray-600">No advances recorded for this month.</td>
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
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Payment history</h3>
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
                          <td colSpan={4} className="px-3 py-4 text-sm text-gray-600">No payments recorded for this farmer yet.</td>
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

              {!statement.payment ? (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Pay farmer</p>
                      <p className="mt-1 text-sm text-gray-600">Record a new payment for this payout month.</p>
                    </div>
                    <div className="flex flex-col gap-2 lg:min-w-[320px]">
                      <Input type="number" value={payAmount} onChange={(event) => setPayAmount(event.target.value)} placeholder="Amount" />
                      <Input type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} />
                      <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as 'cash' | 'mpesa')}>
                        <option value="cash">Cash</option>
                        <option value="mpesa">Mpesa</option>
                      </select>
                      <Input value={paymentNotes} onChange={(event) => setPaymentNotes(event.target.value)} placeholder="Payment notes" />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button onClick={handlePayFarmer} disabled={submitting || !paymentDate || !payAmount}>
                      {submitting ? 'Saving…' : 'Pay Farmer'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  This payout month has already been recorded as paid.
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
              No payout details available for this farmer.
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedRow(null);
              setStatement(null);
              setPaymentHistory([]);
            }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
