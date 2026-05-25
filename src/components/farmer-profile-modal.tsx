"use client";

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchFarmerById, fetchAdvancesForFarmer, fetchDeliveriesForFarmer } from '@/lib/data';
import { formatCurrency, formatDate, getMonthStartForDate } from '@/lib/utils';
import type { LedgerEntry, MilkDelivery } from '@/types';

interface Props {
  farmerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: string;
}

export default function FarmerProfileModal({ farmerId, open, onOpenChange, selectedDate }: Props) {
  const [advances, setAdvances] = useState<LedgerEntry[]>([]);
  const [deliveries, setDeliveries] = useState<MilkDelivery[]>([]);
  const [name, setName] = useState<string>('Farmer');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const farmer = await fetchFarmerById(farmerId);
        setName(farmer?.name ?? 'Farmer');

        const selected = selectedDate ?? new Date().toISOString().split('T')[0];
        const from = getMonthStartForDate(selected);
        const to = selected;

        const [adv, dels] = await Promise.all([
          fetchAdvancesForFarmer(farmerId, from, to),
          fetchDeliveriesForFarmer(farmerId, from, to),
        ]);

        setAdvances(adv);
        setDeliveries(dels.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [open, farmerId, selectedDate]);

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
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden">
        <DialogHeader className="border-b border-gray-100 pb-4">
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

        <div className="space-y-6 overflow-y-auto pb-4 pt-4 pr-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Month litres</p>
              <p className="mt-3 text-3xl font-semibold text-gray-950">{monthlyLitres}L</p>
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
                        <p className="text-sm text-gray-600">{delivery.litres}L delivered</p>
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
