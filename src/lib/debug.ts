import { useDebugStore } from '@/lib/stores/debug';

export function debugLogError(error: unknown, context?: string) {
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : String(error);
  const output = context ? `${context}: ${message}` : message;

  if (typeof window !== 'undefined') {
    useDebugStore.getState().setLastError(output);
  }

  console.error('[MILKY-LOG]', output);
}
