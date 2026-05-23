'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { fetchFarmers, addLedgerEntry } from '@/lib/data';
import { getCurrentDate } from '@/lib/utils';
import { useToast } from '@/lib/stores/ui';
import type { Farmer } from '@/types';

export default function AdvancesPage() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [farmerId, setFarmerId] = useState<string>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState<string>(getCurrentDate());
  const [type, setType] = useState<'advance_cash' | 'advance_goods'>('advance_cash');
  const [note, setNote] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const { success, error } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchFarmers().then(setFarmers).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!farmerId || !amount || amount <= 0) {
      error('Please select a farmer and enter a valid amount');
      return;
    }

    setIsSaving(true);
    try {
      await addLedgerEntry(farmerId, type, Number(amount), date, note || null);
      success('Advance recorded');
      router.push('/reports');
    } catch (err) {
      console.error(err);
      error('Failed to record advance');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Advances</h1>
        <p className="mt-1 text-sm text-gray-600">Record cash or goods advances to farmers.</p>
      </div>

      <Card className="p-6">
        <div className="grid gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Farmer</span>
            <select
              value={farmerId}
              onChange={(e) => setFarmerId(e.target.value)}
              className="rounded-md border px-3 py-2"
            >
              <option value="">Select farmer</option>
              {farmers.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Amount (KES)</span>
            <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Date</span>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Type</span>
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="rounded-md border px-3 py-2">
              <option value="advance_cash">Cash</option>
              <option value="advance_goods">Goods</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Note (optional)</span>
            <textarea value={note} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)} className="rounded-md border px-3 py-2" />
          </label>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Record Advance'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
