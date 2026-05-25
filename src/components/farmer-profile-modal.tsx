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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="border-b border-gray-100 pb-4">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-lg p-1 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
          <DialogTitle className="text-xl font-bold text-gray-950">{name}</DialogTitle>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Advances • Deliveries
          </p>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-600">Month litres</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{monthlyLitres}L</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-600">Gross earnings</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(grossEarnings)}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-600">Advances</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(totalAdvances)}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-600">Final payout</p>
              <p className="mt-2 text-2xl font-bold text-milk-green-600">{formatCurrency(finalPayout)}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-semibold text-gray-700">Advances</p>
            {isLoading ? (
              <p className="mt-3 text-sm text-gray-600">Loading advances…</p>
            ) : advances.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500 italic">No advances recorded yet.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {advances.map((advance) => (
                  <div key={advance.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-gray-900">
                        {advance.entry_type === 'advance_cash' ? 'Cash' : 'Goods'}
                      </p>
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(advance.amount_kes)}</p>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{formatDate(advance.transaction_date)}</p>
                    {advance.description && (
                      <p className="mt-2 text-sm text-gray-700">{advance.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-semibold text-gray-700">Recent deliveries</p>
            {isLoading ? (
              <p className="mt-3 text-sm text-gray-600">Loading deliveries…</p>
            ) : deliveries.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500 italic">No deliveries recorded yet.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {deliveries.slice(0, 7).map((delivery) => (
                  <div key={delivery.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-gray-900">{formatDate(delivery.date)}</p>
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(delivery.litres * 55)}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-700">{delivery.litres}L</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
