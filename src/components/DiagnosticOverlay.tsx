'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth';
import { useDebugStore } from '@/lib/stores/debug';
import { supabaseUrl, supabase } from '@/lib/supabase/client';

export function DiagnosticOverlay() {
  const { isAuthenticated } = useAuthStore();
  const {
    lastError,
    currentUrl,
    supabaseStatus,
    supabaseUrl: storedSupabaseUrl,
    authStatus,
    setCurrentUrl,
    setSupabaseStatus,
    setSupabaseUrl,
    setAuthStatus,
  } = useDebugStore();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, [setCurrentUrl]);

  useEffect(() => {
    setAuthStatus(isAuthenticated ? 'PIN verified' : 'Not verified');
  }, [isAuthenticated, setAuthStatus]);

  useEffect(() => {
    const status = supabase ? 'Connected' : 'Disconnected';
    setSupabaseStatus(status);
    setSupabaseUrl(supabaseUrl ?? '');
  }, [setSupabaseStatus, setSupabaseUrl]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-full px-4 pb-4 sm:px-6">
      <div className="rounded-3xl border border-slate-300/80 bg-slate-950/95 p-4 text-sm text-white shadow-2xl backdrop-blur-xl">
        <div className="grid gap-2 md:grid-cols-4">
          <div>
            <p className="font-semibold text-slate-200">Supabase Status</p>
            <p className="text-slate-100">{supabaseStatus}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-200">Current URL</p>
            <p className="max-w-full truncate text-slate-100" title={currentUrl}>{currentUrl || 'N/A'}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-200">Auth Status</p>
            <p className="text-slate-100">{authStatus}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-200">Last Error</p>
            <p className="max-w-full truncate text-rose-300" title={lastError ?? 'None'}>{lastError ?? 'None'}</p>
          </div>
        </div>
        <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-3 text-xs text-slate-300">
          <p>
            <span className="font-semibold text-slate-200">Supabase URL:</span>{' '}
            <span className="break-all text-slate-100">{storedSupabaseUrl || supabaseUrl || 'Unavailable'}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
