'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/stores/auth';
import { useToast } from '@/lib/stores/ui';
import { validatePin, verifyPin, hashPin } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { setAuthenticated, isPinSet, setPinSet } = useAuthStore();
  const { error } = useToast();
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'setup'>('login');
  const [pinConfirm, setPinConfirm] = useState('');

  const handleLogin = async () => {
    if (!validatePin(pin)) {
      error('PIN must be 4 digits');
      return;
    }

    setIsLoading(true);
    try {
      // In a real app, verify against backend
      const storedHash = localStorage.getItem('pin_hash');
      if (storedHash) {
        const isValid = await verifyPin(pin, storedHash);
        if (isValid) {
          setAuthenticated(true);
          router.push('/dashboard');
        } else {
          error('Invalid PIN');
          setPin('');
        }
      } else {
        error('No PIN set. Please setup a PIN first.');
        setMode('setup');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupPin = async () => {
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
      localStorage.setItem('pin_hash', hash);
      setPinSet(true);
      setMode('login');
      setPin('');
      setPinConfirm('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      handleLogin();
    } else {
      handleSetupPin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-milk-green-50 to-white px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-milk-green-600">
              <span className="text-3xl font-bold text-white">M</span>
            </div>
          </div>
          <CardTitle className="text-2xl">
            {mode === 'login' ? 'Welcome to Milky' : 'Setup PIN'}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'login' ? (
              <>
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
                    onChange={(e) =>
                      setPin(e.target.value.replace(/\D/g, ''))
                    }
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

                {!isPinSet && (
                  <button
                    type="button"
                    onClick={() => setMode('setup')}
                    className="w-full text-center text-sm text-milk-green-600 hover:text-milk-green-700 font-medium"
                  >
                    Setup new PIN
                  </button>
                )}
              </>
            ) : (
              <>
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
                    onChange={(e) =>
                      setPin(e.target.value.replace(/\D/g, ''))
                    }
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
                    onChange={(e) =>
                      setPinConfirm(e.target.value.replace(/\D/g, ''))
                    }
                    placeholder="••••"
                    className="text-center text-2xl tracking-widest"
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    pin.length !== 4 || pinConfirm.length !== 4 || isLoading
                  }
                >
                  {isLoading ? 'Setting up...' : 'Create PIN'}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setPin('');
                    setPinConfirm('');
                  }}
                  className="w-full text-center text-sm text-gray-600 hover:text-gray-700 font-medium"
                >
                  Back to login
                </button>
              </>
            )}
          </form>

          <p className="mt-6 text-center text-xs text-gray-600">
            🥛 Milk collection & farmer payment system for Meru, Kenya
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
