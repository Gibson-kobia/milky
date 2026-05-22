"use client";

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
          <DialogDescription>Advances · Notes · History</DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <Card className="p-3">
            <p className="text-xs font-semibold text-gray-600">Advances</p>
            {advances.length === 0 ? (
              <p className="mt-2 text-sm text-gray-700">No advances</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                {advances.map((a) => (
                  <li key={a.id}>{a.date} — {a.amount} KES — {a.note}</li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-3">
            <p className="text-xs font-semibold text-gray-600">Recent deliveries</p>
            {deliveries.length === 0 ? (
              <p className="mt-2 text-sm text-gray-700">No deliveries</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                {deliveries.map((d) => (
                  <li key={d.id}>{d.date} — {d.litres}L</li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <div className="mt-4 text-right">
          <DialogClose className="rounded bg-milk-green-600 text-white px-3 py-1">Close</DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
