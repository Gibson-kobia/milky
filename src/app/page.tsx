import { Suspense } from 'react';
import { HomeContent } from '@/app/home-content';

export const dynamic = 'force-dynamic';

function HomeSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-milk-green-50 to-white px-4 py-12">
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-lg">
        <p className="text-sm font-medium text-gray-700">Loading…</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
