"use client";

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { fetchFarmerById, fetchFarmerMonthHistory, fetchFarmerMonthlyStatement, fetchFarmerPaymentsForMonth } from '@/lib/data';
import { formatCurrency, formatDate, formatLitres } from '@/lib/utils';
import type { LedgerEntry, MilkDelivery } from '@/types';

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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

        {/* Previous Month Payout section - shown first for paying farmers */}
        <div className="mt-4 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Previous Month Payout</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{detailMonth}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={async () => {
                // go to previous month
                const [year, monthNumber] = detailMonth.split('-').map(Number);
                const current = new Date(Date.UTC(year, monthNumber - 1 - 1, 1));
                const prev = `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, '0')}`;
                setDetailMonth(prev);
              }}>Prev</Button>
              <Button size="sm" variant="outline" onClick={async () => {
                // go to next month
                const [year, monthNumber] = detailMonth.split('-').map(Number);
                const current = new Date(Date.UTC(year, monthNumber - 1 + 1, 1));
                const next = `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, '0')}`;
                setDetailMonth(next);
              }}>Next</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowMonthPicker((s) => !s)}>View Another Month</Button>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Month</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{detailMonth}</p>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Milk rate</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{/* rate fetched from statement or default */}{/* show via statement.gross_amount / total litres when available */}
                {statement ? (() => {
                  const rate = statement.total_litres ? (Number(statement.gross_amount) / Number(statement.total_litres)) : 55;
                  return `${Number(rate.toFixed(2))} KES`;
                })() : '55 KES'}</p>
            </div>
          </div>

          <div className="mt-3 grid gap-3">
            <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total litres</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{formatLitres(monthlyLitres)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Gross earnings</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(grossEarnings)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Advances</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(totalAdvances)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Payments</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(paymentHistory.reduce((s, p) => s + Number(p.amount ?? 0), 0))}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Balance</p>
                  <p className="mt-1 text-2xl font-extrabold text-milk-green-600">{formatCurrency(Math.max(finalPayout - paymentHistory.reduce((s, p) => s + Number(p.amount ?? 0), 0), 0))}</p>
                  <div className="mt-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${paymentHistory.length > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {paymentHistory.length > 0 ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/** Month picker dropdown **/}
          {showMonthPicker && (
            <div className="mt-3">
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
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto pb-4 pr-2 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Month litres</p>
              <p className="mt-3 text-3xl font-semibold text-gray-950">{formatLitres(monthlyLitres)}</p>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Gross earnings</p>
              <p className="mt-3 text-3xl font-semibold text-gray-950">{formatCurrency(grossEarnings)}</p>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Advances</p>
              <p className="mt-3 text-3xl font-semibold text-gray-900">{formatCurrency(totalAdvances)}</p>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Final payout</p>
              <p className="mt-3 text-3xl font-semibold text-milk-green-600">{formatCurrency(finalPayout)}</p>
            </div>
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

          <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-700">Recent deliveries</p>
                <p className="mt-1 text-xs text-gray-500">Latest month activity</p>
              </div>
              <p className="text-sm font-medium text-gray-900">{deliveries.length} deliveries</p>
            </div>
            {isLoading ? (
              <p className="mt-4 text-sm text-gray-600">Loading deliveries…</p>
            ) : deliveries.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500 italic">No deliveries recorded yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {deliveries.slice(0, 7).map((delivery) => (
                  <div key={delivery.id} className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{formatDate(delivery.date)}</p>
                        <p className="text-sm text-gray-600">{formatLitres(delivery.litres)} delivered</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Earned</p>
                        <p className="mt-1 text-lg font-semibold text-milk-green-600">{formatCurrency(delivery.litres * 55)}</p>
                      </div>
                    </div>
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
