import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isPinSet: boolean;
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;
  setPinSet: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isPinSet: false,
      isAuthenticated: false,
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setPinSet: (value) => set({ isPinSet: value }),
      logout: () => set({ isAuthenticated: false }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        isPinSet: state.isPinSet,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
