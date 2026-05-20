'use client';

import { create } from 'zustand';

export type SupabaseStatus = 'Connected' | 'Disconnected';
export type AuthDebugStatus = 'PIN verified' | 'Not verified';

interface DebugState {
  lastError: string | null;
  setLastError: (value: string | null) => void;
  currentUrl: string;
  setCurrentUrl: (value: string) => void;
  supabaseStatus: SupabaseStatus;
  setSupabaseStatus: (value: SupabaseStatus) => void;
  supabaseUrl: string;
  setSupabaseUrl: (value: string) => void;
  authStatus: AuthDebugStatus;
  setAuthStatus: (value: AuthDebugStatus) => void;
}

export const useDebugStore = create<DebugState>()((set) => ({
  lastError: null,
  currentUrl: '',
  supabaseStatus: 'Disconnected',
  supabaseUrl: '',
  authStatus: 'Not verified',
  setLastError: (value) => set({ lastError: value }),
  setCurrentUrl: (value) => set({ currentUrl: value }),
  setSupabaseStatus: (value) => set({ supabaseStatus: value }),
  setSupabaseUrl: (value) => set({ supabaseUrl: value }),
  setAuthStatus: (value) => set({ authStatus: value }),
}));
