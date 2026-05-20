'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/stores/auth';
import { useToast } from '@/lib/stores/ui';
import { validatePin, verifyPin } from '@/lib/utils';
import { getStoredPinHash } from '@/lib/data';

export default function LoginPage() {
  const router = useRouter();
  const { setAuthenticated, setPinSet } = useAuthStore();
  const { error } = useToast();
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      console.log('[DEBUG-MILKY] LoginPage useEffect initialize');
      try {
        const storedHash = await getStoredPinHash();
        console.log('[DEBUG-MILKY] LoginPage storedHash result', {
          hasStoredHash: Boolean(storedHash),
        });
        setPinSet(Boolean(storedHash));

        if (!storedHash) {
          console.warn('[DEBUG-MILKY] LoginPage no stored PIN hash, redirecting to setup-pin');
          router.push('/setup-pin');
          return;
        }
      } catch (err) {
        console.error('[DEBUG-MILKY] LoginPage error checking PIN setup:', err);
      } finally {
        setIsReady(true);
      }
    };

    initialize();
  }, [router, setPinSet]);

  const handleLogin = async () => {
    console.log('[DEBUG-MILKY] LoginPage handleLogin start', { pinLength: pin.length });
    if (!validatePin(pin)) {
      error('PIN must be 4 digits');
      return;
    }

    setIsLoading(true);
    try {
      const storedHash = await getStoredPinHash();
      console.log('[DEBUG-MILKY] LoginPage handleLogin storedHash', {
        hasStoredHash: Boolean(storedHash),
      });
      if (!storedHash) {
        console.error('[DEBUG-MILKY] CRITICAL: Settings table is empty or unreachable during login');
        error('No PIN set. Redirecting to setup.');
        router.push('/setup-pin');
        return;
      }

      const isValid = await verifyPin(pin, storedHash);
      if (isValid) {
        setAuthenticated(true);
        setPinSet(true);
        router.push('/dashboard');
      } else {
        error('Invalid PIN');
        setPin('');
      }
    } catch (err) {
      console.error(err);
      error(
        err instanceof Error
          ? err.message
          : 'Unable to validate PIN. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLogin();
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-milk-green-50 to-white px-4 py-12">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-lg">
          <p className="text-sm font-medium text-gray-700">Checking authentication…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-milk-green-50 to-white px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-milk-green-600">
              <span className="text-3xl font-bold text-white">M</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome to Milky</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter 4-Digit PIN
              </label>
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="text-center text-2xl tracking-widest"
                autoFocus
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={pin.length !== 4 || isLoading}
            >
              {isLoading ? 'Checking...' : 'Login'}
            </Button>

            <button
              type="button"
              onClick={() => router.push('/setup-pin')}
              className="w-full text-center text-sm text-milk-green-600 hover:text-milk-green-700 font-medium"
            >
              Setup new PIN
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-600">
            🥛 Milk collection & farmer payment system for Meru, Kenya
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
