import { Suspense } from 'react';
import { MonthlyPayoutsContent } from '@/app/monthly-payouts-content';
import { Card } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

function MonthlyPayoutsSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <Card className="p-8">
        <p className="text-sm font-medium text-gray-700">Loading monthly payouts…</p>
      </Card>
    </div>
  );
}

export default function MonthlyPayoutsPage() {
  return (
    <Suspense fallback={<MonthlyPayoutsSkeleton />}>
      <MonthlyPayoutsContent />
    </Suspense>
  );
}
