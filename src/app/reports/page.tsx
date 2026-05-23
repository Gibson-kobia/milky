import { Suspense } from 'react';
import { ReportsContent } from '@/app/reports-content';
import { Card } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

function ReportsSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <Card className="p-8">
        <p className="text-sm font-medium text-gray-700">Loading reports…</p>
      </Card>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<ReportsSkeleton />}>
      <ReportsContent />
    </Suspense>
  );
}
