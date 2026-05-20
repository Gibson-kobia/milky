'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/lib/stores/ui';
import { syncPendingQueue, isOnline } from '@/lib/data';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function useSyncManager() {
  useOnlineStatus();
  const setSyncStatus = useUIStore((state) => state.setSyncStatus);

  useEffect(() => {
    const sync = async () => {
      if (!isOnline()) {
        setSyncStatus('idle');
        return;
      }

      setSyncStatus('syncing');
      try {
        await syncPendingQueue();
        setSyncStatus('success');
      } catch (error) {
        console.error('Offline sync failed', error);
        setSyncStatus('error');
      }
    };

    sync();
    window.addEventListener('online', sync);

    return () => {
      window.removeEventListener('online', sync);
    };
  }, [setSyncStatus]);
}
