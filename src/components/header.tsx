import { LogOut, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/auth';
import { useUIStore } from '@/lib/stores/ui';

export function Header() {
  const { logout } = useAuthStore();
  const { isOnline, syncStatus } = useUIStore();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-milk-green-600 shadow-sm">
            <span className="text-lg font-bold text-white">M</span>
          </div>
          <h1 className="text-xl font-bold text-gray-950">Milky</h1>
        </div>

        {/* Status and Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            {!isOnline ? (
              <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700 border border-red-200">
                <WifiOff className="h-3.5 w-3.5" />
                <span>Offline</span>
              </div>
            ) : syncStatus === 'syncing' ? (
              <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700 border border-amber-200">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Syncing...</span>
              </div>
            ) : syncStatus === 'error' ? (
              <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700 border border-red-200">
                <span>Sync failed</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-milk-green-600">
                <Wifi className="h-3.5 w-3.5" />
                <span className="hidden lg:inline text-xs font-medium">Connected</span>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="gap-2 text-gray-700"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline text-sm">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
