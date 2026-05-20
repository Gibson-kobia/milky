'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/stores/auth';
import { useToast } from '@/lib/stores/ui';
import { validatePin, hashPin } from '@/lib/utils';
import { getStoredPinHash, saveStoredPinHash } from '@/lib/data';

export default function SetupPinPage() {
  const router = useRouter();
  const { setAuthenticated, setPinSet } = useAuthStore();
  const { error, success } = useToast();
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      console.log('[MILKY-LOG] SetupPinPage(root) useEffect initialize');
      try {
        const storedHash = await getStoredPinHash();
        console.log('[MILKY-LOG] SetupPinPage(root) storedHash result', {
          hasStoredHash: Boolean(storedHash),
        });
        if (storedHash) {
          router.push('/login');
          return;
        }
      } catch (err) {
        console.error('[MILKY-LOG] SetupPinPage(root) error checking PIN setup:', err);
      } finally {
        setIsReady(true);
      }
    };

    initialize();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[MILKY-LOG] SetupPinPage(root) handleSubmit', {
      pinLength: pin.length,
      pinConfirmLength: pinConfirm.length,
    });

    if (!validatePin(pin)) {
      error('PIN must be 4 digits');
      return;
    }

    if (pin !== pinConfirm) {
      error('PINs do not match');
      return;
    }

    setIsLoading(true);

    try {
      const hash = await hashPin(pin);
      await saveStoredPinHash(hash);
      setPinSet(true);
      setAuthenticated(true);
      success('PIN setup complete. Redirecting to dashboard.');
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      error(
        err instanceof Error
          ? err.message
          : 'Failed to create PIN. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-milk-green-50 to-white px-4 py-12">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-lg">
          <p className="text-sm font-medium text-gray-700">Checking setup state…</p>
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
          <CardTitle className="text-2xl">Setup PIN</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Create 4-Digit PIN
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm PIN
              </label>
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pinConfirm}
                onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="text-center text-2xl tracking-widest"
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={pin.length !== 4 || pinConfirm.length !== 4 || isLoading}>
              {isLoading ? 'Creating PIN...' : 'Create PIN'}
            </Button>

            <button
              type="button"
              onClick={() => router.push('/login')}
              className="w-full text-center text-sm text-gray-600 hover:text-gray-700 font-medium"
            >
              Already have a PIN? Login
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
