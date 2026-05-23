"use client";

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchFarmerById, fetchAdvancesForFarmer, fetchDeliveriesForFarmer } from '@/lib/data';
import type { MilkDelivery } from '@/types';

interface Props {
  farmerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: string;
}

export default function FarmerProfileModal({ farmerId, open, onOpenChange, selectedDate }: Props) {
  const [advances, setAdvances] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<MilkDelivery[]>([]);
  const [name, setName] = useState<string>('');

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      const farmer = await fetchFarmerById(farmerId);
      setName(farmer?.name ?? 'Farmer');
      const start = selectedDate ? selectedDate : new Date().toISOString().split('T')[0];
      const from = start;
      const to = start;
      const adv = await fetchAdvancesForFarmer(farmerId, from, to);
      const dels = await fetchDeliveriesForFarmer(farmerId, from, to);
      setAdvances(adv);
      setDeliveries(dels);
    };
    load();
  }, [open, farmerId, selectedDate]);

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
          {/* Advances Section */}
          <div className="space-y-3">
            <p className="label-operational">Advances</p>
            {advances.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No advances recorded</p>
            ) : (
              <div className="space-y-2">
                {advances.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start justify-between rounded-lg bg-gray-50 px-3 py-2.5 border border-gray-100"
                  >
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">{a.date}</p>
                      {a.note && <p className="text-sm text-gray-700 mt-1">{a.note}</p>}
                    </div>
                    <p className="font-semibold text-gray-900 ml-2">{a.amount} KES</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deliveries Section */}
          <div className="space-y-3">
            <p className="label-operational">Recent Deliveries</p>
            {deliveries.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No deliveries recorded</p>
            ) : (
              <div className="space-y-2">
                {deliveries.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5 border border-gray-100"
                  >
                    <p className="text-sm text-gray-700">{d.date}</p>
                    <p className="font-semibold text-gray-900">{d.litres}L</p>
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
