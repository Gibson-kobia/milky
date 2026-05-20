import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface UIState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  setSyncStatus: (status: 'idle' | 'syncing' | 'error' | 'success') => void;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => {
      const id = Math.random().toString(36).substr(2, 9);
      return {
        toasts: [
          ...state.toasts,
          {
            ...toast,
            id,
          },
        ],
      };
    }),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  syncStatus: 'idle',
  setSyncStatus: (status) => set({ syncStatus: status }),
  isOnline: true,
  setIsOnline: (online) => set({ isOnline: online }),
}));

// Hook for showing toasts
export const useToast = () => {
  const addToast = useUIStore((state) => state.addToast);

  return {
    success: (message: string) =>
      addToast({ type: 'success', message, duration: 3000 }),
    error: (message: string) =>
      addToast({ type: 'error', message, duration: 4000 }),
    info: (message: string) =>
      addToast({ type: 'info', message, duration: 3000 }),
    warning: (message: string) =>
      addToast({ type: 'warning', message, duration: 3000 }),
  };
};
