import { LogOut, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/auth';
import { useUIStore } from '@/lib/stores/ui';

export function Header() {
  const { logout } = useAuthStore();
  const { isOnline, syncStatus } = useUIStore();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-milk-green-600">
            <span className="text-lg font-bold text-white">M</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Milky</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 sm:flex">
            {!isOnline ? (
              <div className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1">
                <WifiOff className="h-4 w-4 text-red-600" />
                <span className="text-xs text-red-700">Offline</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Wifi className="h-4 w-4 text-milk-green-600" />
              </div>
            )}

            {syncStatus === 'syncing' && (
              <div className="flex items-center gap-1 rounded-lg bg-milk-amber-50 px-3 py-1">
                <RefreshCw className="h-4 w-4 animate-spin text-milk-amber-600" />
                <span className="text-xs text-milk-amber-700">Syncing...</span>
              </div>
            )}

            {syncStatus === 'error' && (
              <div className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1">
                <span className="text-xs text-red-700">Sync failed</span>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
