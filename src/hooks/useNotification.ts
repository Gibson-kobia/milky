import { useCallback } from 'react';
import { useUIStore } from '@/lib/stores/ui';

export function useNotification() {
  const addToast = useUIStore((state) => state.addToast);

  const notify = useCallback(
    (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
      addToast({
        type,
        message,
        duration: type === 'error' ? 4000 : 3000,
      });
    },
    [addToast]
  );

  return {
    success: (msg: string) => notify('success', msg),
    error: (msg: string) => notify('error', msg),
    info: (msg: string) => notify('info', msg),
    warning: (msg: string) => notify('warning', msg),
  };
}
