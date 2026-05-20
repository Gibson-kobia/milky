'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form';
import { useToast } from '@/lib/stores/ui';
import { SettingsSchema, type SettingsFormData } from '@/lib/validations';
import { hashPin } from '@/lib/utils';

export default function SettingsPage() {
  const { success, error } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      shop_name: 'Meru Milk Collection',
      owner_name: 'Grace Wanjiru',
      buying_rate: 55,
      selling_rate: 70,
    },
  });

  const handleSubmit = async (_data: SettingsFormData) => {
    setIsSaving(true);
    try {
      // In real app, save to Supabase
      success('Settings updated successfully');
    } catch (err) {
      error('Failed to update settings');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePIN = async () => {
    const newPin = prompt('Enter new 4-digit PIN:');
    if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      error('PIN must be 4 digits');
      return;
    }

    const confirmPin = prompt('Confirm PIN:');
    if (newPin !== confirmPin) {
      error('PINs do not match');
      return;
    }

    try {
      const hash = await hashPin(newPin);
      localStorage.setItem('pin_hash', hash);
      success('PIN changed successfully');
    } catch (err) {
      error('Failed to change PIN');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Configure your milk collection business settings
        </p>
      </div>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField label="Shop Name" required>
              <Input
                {...form.register('shop_name')}
                placeholder="Your shop name"
                disabled={isSaving}
              />
            </FormField>

            <FormField label="Owner Name" required>
              <Input
                {...form.register('owner_name')}
                placeholder="Your name"
                disabled={isSaving}
              />
            </FormField>

            <div className="flex gap-4">
              <FormField label="Buying Rate (KES/L)" required>
                <Input
                  {...form.register('buying_rate', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  placeholder="55"
                  disabled={isSaving}
                />
              </FormField>

              <FormField label="Selling Rate (KES/L)" required>
                <Input
                  {...form.register('selling_rate', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  placeholder="70"
                  disabled={isSaving}
                />
              </FormField>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-900">Change PIN</p>
            <p className="mt-1 text-sm text-gray-600">
              Update your 4-digit PIN for logging in
            </p>
            <Button
              variant="outline"
              onClick={handleChangePIN}
              className="mt-4"
            >
              Change PIN
            </Button>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm font-medium text-gray-900">
              Session & Data
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Manage your session and app data
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline">Clear Local Data</Button>
              <Button variant="destructive">Sign Out</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>Milky</strong> - Milk Collection & Farmer Payment System
          </p>
          <p>Version 1.0.0</p>
          <p>Built for milk collection shops in Meru, Kenya</p>
          <p className="pt-2 text-xs">
            🥛 Fast • Reliable • Offline-first • Made locally
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
