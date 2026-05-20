'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { useAuthStore } from '@/lib/stores/auth';
import { useSyncManager } from '@/hooks/useSync';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useSyncManager();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      setIsReady(true);
    }
  }, [isAuthenticated, router]);

  if (!isReady) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
