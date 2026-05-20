'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/lib/stores/ui';
import { APP_PIN, isAuthenticated, signIn } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const { error } = useToast();
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/');
      return;
    }
    setIsReady(true);
  }, [router]);

  const handleLogin = async () => {
    if (pin.length !== 4) {
      error('PIN must be 4 digits');
      return;
    }

    setIsLoading(true);

    if (pin === APP_PIN) {
      signIn();
      router.push('/');
      return;
    }

    error('Invalid PIN');
    setPin('');
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLogin();
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-milk-green-50 to-white px-4 py-12">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-lg">
          <p className="text-sm font-medium text-gray-700">Loading…</p>
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
          <CardTitle className="text-2xl">Login</CardTitle>
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
          </form>
          <p className="mt-6 text-center text-xs text-gray-600">
            Use PIN: {APP_PIN}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
