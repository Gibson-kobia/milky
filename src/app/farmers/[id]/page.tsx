'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchFarmers } from '@/lib/data';
import { requireAuth } from '@/lib/auth';
import type { Farmer } from '@/types';

export default function FarmerDetailPage(props: any) {
  const { id } = props.params;
  const router = useRouter();
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!requireAuth()) {
      router.push('/login');
      return;
    }

    const loadFarmer = async () => {
      const farmers = await fetchFarmers();
      const found = farmers.find((item) => item.id === id) || null;
      setFarmer(found);
      setIsReady(true);
    };

    loadFarmer();
  }, [id, router]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-milk-green-50 to-white px-4 py-12">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-lg">
          <p className="text-sm font-medium text-gray-700">Loading farmer…</p>
        </div>
      </div>
    );
  }

  if (!farmer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-milk-green-50 to-white px-4 py-12">
        <Card className="p-8 text-center">
          <p className="text-gray-700">Farmer not found.</p>
          <Button className="mt-4" onClick={() => router.push('/farmers')}>
            Back to farmers
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{farmer.name}</h1>
          <p className="mt-1 text-sm text-gray-600">{farmer.phone}</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/farmers')}>
          Back
        </Button>
      </div>

      <Card className="p-6">
        <p className="text-sm text-gray-700">Notes</p>
        <p className="mt-2 text-gray-900">{farmer.notes || 'No notes available.'}</p>
        <p className="mt-4 text-sm text-gray-700">
          Evening delivery: {farmer.evening_delivery_enabled ? 'Enabled' : 'Disabled'}
        </p>
      </Card>
    </div>
  );
}
