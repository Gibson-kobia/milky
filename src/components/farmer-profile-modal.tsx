"use client";

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchFarmerById, fetchFarmerMonthHistory, fetchFarmerMonthlyStatement, fetchFarmerPaymentsForMonth, saveFarmerPayment } from '@/lib/data';
import { formatCurrency, formatDate, formatLitres } from '@/lib/utils';
import type { LedgerEntry, MilkDelivery, PaymentMethod } from '@/types';

interface Props {
  farmerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: string;
}

export default function FarmerProfileModal({ farmerId, open, onOpenChange }: Props) {
  const [advances, setAdvances] = useState<LedgerEntry[]>([]);
  const [deliveries, setDeliveries] = useState<MilkDelivery[]>([]);
  const [name, setName] = useState<string>('Farmer');
  const [isLoading, setIsLoading] = useState(false);
  const [monthOptions, setMonthOptions] = useState<string[]>([]);
  const [detailMonth, setDetailMonth] = useState<string>(() => {
    const today = new Date();
    const previous = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const year = previous.getFullYear();
    const month = String(previous.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });
  const [statement, setStatement] = useState<import('@/types').FarmerMonthlyStatement | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<import('@/types').Payment[]>([]);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const farmer = await fetchFarmerById(farmerId);
        setName(farmer?.name ?? 'Farmer');

        // Load month history (available months for this farmer)
        const history = await fetchFarmerMonthHistory(farmerId);
        const months = history.map((h) => h.month);
        setMonthOptions(months);

        // Choose a sensible default month:
        // Prefer the previous calendar month; if that isn't available
        // fall back to the most recent month that has data for the farmer.
        const prevDefault = detailMonth;
        const chosen = months.includes(prevDefault) ? prevDefault : (months[0] ?? prevDefault);
        setDetailMonth(chosen);

        // Load statement and payments for the chosen month
        const stmt = await fetchFarmerMonthlyStatement(farmerId, chosen);
        setStatement(stmt);
        const payments = await fetchFarmerPaymentsForMonth(farmerId, chosen);
        setPaymentHistory(payments);
        setPaymentDate(new Date().toISOString().slice(0, 10));
        setPaymentAmount('');
        setPaymentNotes('');
        setPaymentMethod('cash');
        setPayError(null);

        // Also set advances/deliveries for the currently displayed month (if any)
        setAdvances(stmt?.advances_detail ?? []);
        setDeliveries(stmt?.deliveries?.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, farmerId]);

  // Load details when user selects another month
  useEffect(() => {
    if (!open || !detailMonth) return;
    const loadMonth = async () => {
      setIsLoading(true);
      try {
        const stmt = await fetchFarmerMonthlyStatement(farmerId, detailMonth);
        setStatement(stmt);
        const payments = await fetchFarmerPaymentsForMonth(farmerId, detailMonth);
        setPaymentHistory(payments);
        setPaymentDate(new Date().toISOString().slice(0, 10));
        setPaymentAmount('');
        setPaymentNotes('');
        setPaymentMethod('cash');
        setPayError(null);
        setAdvances(stmt?.advances_detail ?? []);
        setDeliveries(stmt?.deliveries?.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    void loadMonth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailMonth, open, farmerId]);

  const monthlyLitres = useMemo(
    () => deliveries.reduce((sum, delivery) => sum + delivery.litres, 0),
    [deliveries]
  );

  const totalAdvances = useMemo(
    () => advances.reduce((sum, advance) => sum + advance.amount_kes, 0),
    [advances]
  );

  const grossEarnings = monthlyLitres * 55;
  const finalPayout = grossEarnings - totalAdvances;
  const monthlyProfit = monthlyLitres * 15;
  const paymentsTotal = paymentHistory.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const remainingBalance = Math.max(finalPayout - paymentsTotal, 0);
  const isFullyPaid = remainingBalance <= 0;

  const handlePay = async () => {
    if (!statement || isPaying) return;

    const amountValue = Number(paymentAmount);
    if (!paymentDate || Number.isNaN(amountValue) || amountValue <= 0) {
      setPayError('Enter a valid payment amount');
      return;
    }

    setIsPaying(true);
    setPayError(null);

    try {
      const created = await saveFarmerPayment(
        farmerId,
        amountValue,
        paymentMethod,
        paymentDate,
        paymentNotes || null,
        null
      );
      setPaymentHistory((prev) => [...prev, created]);
      setPaymentAmount('');
      setPaymentNotes('');
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setPaymentMethod('cash');
    } catch (err) {
      console.error(err);
      setPayError('Unable to record payment right now.');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex-shrink-0 border-b border-gray-100 pb-4">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-lg p-1 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
          <DialogTitle className="text-xl font-semibold text-gray-950">{name}</DialogTitle>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Farmer ledger overview
          </p>
        </DialogHeader>

        <div className="mt-4 flex-shrink-0 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Previous Month Payout</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{detailMonth}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => {
                const [year, monthNumber] = detailMonth.split('-').map(Number);
                const current = new Date(Date.UTC(year, monthNumber - 1 - 1, 1));
                const prev = `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, '0')}`;
                setDetailMonth(prev);
              }}>Prev</Button>
              <Button size="sm" variant="outline" onClick={() => {
                const [year, monthNumber] = detailMonth.split('-').map(Number);
                const current = new Date(Date.UTC(year, monthNumber - 1 + 1, 1));
                const next = `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, '0')}`;
                setDetailMonth(next);
              }}>Next</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowMonthPicker((s) => !s)}>View Another Month</Button>
            </div>
          </div>

          {showMonthPicker && (
            <div>
              <label className="sr-only">Select month</label>
              <select
                value={detailMonth}
                onChange={(e) => setDetailMonth(e.target.value)}
                className="w-full rounded-md border-gray-200 p-2"
              >
                {monthOptions.length === 0 ? (
                  <option value={detailMonth}>{detailMonth}</option>
                ) : (
                  monthOptions.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))
                )}
              </select>
            </div>
          )}

          <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Previous Month</p>
                <p className="mt-1 text-base font-semibold text-gray-900">{detailMonth}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Milk Rate</p>
                <p className="mt-1 text-base font-semibold text-gray-900">{statement ? `${Number(((statement.gross_amount || 0) / Math.max(statement.total_litres || 1, 1)).toFixed(2))} KES` : '55 KES'}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Total Litres</p>
                <p className="mt-1 text-base font-semibold text-gray-900">{formatLitres(monthlyLitres)}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Gross Earnings</p>
                <p className="mt-1 text-base font-semibold text-gray-900">{formatCurrency(grossEarnings)}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Advances</p>
                <p className="mt-1 text-base font-semibold text-gray-900">{formatCurrency(totalAdvances)}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Payments Already Made</p>
                <p className="mt-1 text-base font-semibold text-gray-900">{formatCurrency(paymentsTotal)}</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Balance To Pay</p>
                  <p className="mt-1 text-3xl font-extrabold text-emerald-800">{formatCurrency(remainingBalance)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${isFullyPaid ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-700'}`}>
                    {isFullyPaid ? 'PAID' : 'UNPAID'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">Payment amount</label>
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="mt-2"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">Payment method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="cash">Cash</option>
                    <option value="mpesa">Mpesa</option>
                  </select>
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Payment date</label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Notes</label>
                  <Input
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Optional"
                    className="mt-2"
                  />
                </div>
              </div>
              {payError ? <p className="mt-3 text-sm text-rose-600">{payError}</p> : null}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-600">This adds one payment row to the existing payments table and keeps deliveries and advances unchanged.</p>
                <Button onClick={handlePay} disabled={isPaying || isFullyPaid} className="sm:min-w-[140px]">
                  {isPaying ? 'Recording...' : isFullyPaid ? 'Already Paid' : 'Pay'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto pb-4 pr-2 pt-4">
          <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-700">Delivery history</p>
                <p className="mt-1 text-xs text-gray-500">Daily deliveries for the selected month</p>
              </div>
              <p className="text-sm font-medium text-gray-900">{deliveries.length} deliveries</p>
            </div>
            {isLoading ? (
              <p className="mt-4 text-sm text-gray-600">Loading deliveries…</p>
            ) : deliveries.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500 italic">No deliveries recorded yet.</p>
            ) : (
              <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Date</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Morning/Evening</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Litres</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Totals</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {deliveries.map((delivery) => (
                      <tr key={delivery.id}>
                        <td className="px-3 py-2 text-gray-700">{formatDate(delivery.date)}</td>
                        <td className="px-3 py-2 text-gray-700">{delivery.delivery_type === 'morning' ? 'Morning' : 'Evening'}</td>
                        <td className="px-3 py-2 text-gray-700">{formatLitres(delivery.litres)}</td>
                        <td className="px-3 py-2 text-gray-700">{formatCurrency(delivery.litres * 55)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-700">Advances ledger</p>
            {isLoading ? (
              <p className="mt-3 text-sm text-gray-600">Loading advances…</p>
            ) : advances.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500 italic">No advances recorded yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {advances.map((advance) => (
                  <div key={advance.id} className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(advance.amount_kes)} — {advance.entry_type === 'advance_cash' ? 'Cash' : 'Goods'}
                        </p>
                        <p className="text-xs uppercase tracking-wide text-gray-500">{formatDate(advance.transaction_date)}</p>
                      </div>
                      <div className="rounded-2xl bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm">
                        {advance.entry_type === 'advance_cash' ? 'Cash' : 'Goods'}
                      </div>
                    </div>
                    {advance.description ? (
                      <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Reason</p>
                        <p className="mt-1 text-sm text-gray-700">{advance.description}</p>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Gross earnings</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">{formatCurrency(grossEarnings)}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Total advances</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">{formatCurrency(totalAdvances)}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Profit margin</p>
                <p className="mt-2 text-lg font-semibold text-milk-green-600">{formatCurrency(monthlyProfit)}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
