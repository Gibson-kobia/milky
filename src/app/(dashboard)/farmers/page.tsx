'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TextArea } from '@/components/ui/input';
import { Label, FormField } from '@/components/ui/form';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Archive } from 'lucide-react';
import { useToast } from '@/lib/stores/ui';
import { FarmerSchema, type FarmerFormData } from '@/lib/validations';
import type { Farmer } from '@/types';
import { addFarmer, fetchFarmers } from '@/lib/data';

export default function FarmersPage() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { success, error } = useToast();

  const form = useForm<FarmerFormData>({
    resolver: zodResolver(FarmerSchema),
    defaultValues: {
      name: '',
      phone: '',
      evening_delivery_enabled: false,
      notes: '',
    },
  });

  useEffect(() => {
    const loadFarmers = async () => {
      setIsLoading(true);
      try {
        const data = await fetchFarmers();
        setFarmers(data);
      } catch (err) {
        error('Unable to load farmers');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadFarmers();
  }, [error]);

  const handleSubmit = async (data: FarmerFormData) => {
    try {
      const newFarmer = await addFarmer(
        data.name,
        data.phone,
        data.evening_delivery_enabled,
        data.notes ?? null
      );

      setFarmers((prev) => [...prev, newFarmer]);
      success('Farmer added successfully');
      form.reset();
      setIsAddDialogOpen(false);
    } catch (err) {
      error('Failed to add farmer');
      console.error(err);
    }
  };

  const handleArchive = (farmerId: string) => {
    setFarmers((prev) =>
      prev.map((f) =>
        f.id === farmerId ? { ...f, archived_at: new Date().toISOString() } : f
      )
    );
    success('Farmer archived');
  };

  const activeFarmers = farmers.filter((f) => !f.archived_at);
  const archivedFarmers = farmers.filter((f) => f.archived_at);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Farmers</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage farmer information and delivery settings
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Farmer</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Farmer</DialogTitle>
              <DialogDescription>
                Add a new farmer to the milk collection system
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField label="Full Name" required>
                <Input
                  {...form.register('name')}
                  placeholder="John Kipchoge"
                  disabled={form.formState.isSubmitting}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-600">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </FormField>

              <FormField label="Phone Number" required>
                <Input
                  {...form.register('phone')}
                  placeholder="+254712345678"
                  disabled={form.formState.isSubmitting}
                />
                {form.formState.errors.phone && (
                  <p className="text-xs text-red-600">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </FormField>

              <FormField label="Notes">
                <TextArea
                  {...form.register('notes')}
                  placeholder="Optional notes about this farmer"
                  disabled={form.formState.isSubmitting}
                />
              </FormField>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...form.register('evening_delivery_enabled')}
                  id="evening"
                  className="rounded border-gray-300"
                />
                <Label htmlFor="evening" className="font-normal">
                  Enable evening deliveries
                </Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={form.formState.isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="flex-1"
                >
                  {form.formState.isSubmitting ? 'Adding...' : 'Add Farmer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Active Farmers ({activeFarmers.length})
        </h2>
        <div className="grid gap-3">
          {activeFarmers.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-gray-600">No active farmers</p>
            </Card>
          ) : (
            activeFarmers.map((farmer) => (
              <Card
                key={farmer.id}
                className="flex items-center justify-between p-4 sm:p-6"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{farmer.name}</p>
                  <p className="text-sm text-gray-600">{farmer.phone}</p>
                  {farmer.notes && (
                    <p className="mt-1 text-xs text-gray-500">{farmer.notes}</p>
                  )}
                  <div className="mt-2 flex gap-2">
                    {farmer.evening_delivery_enabled && (
                      <Badge variant="default">Evening enabled</Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Edit2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArchive(farmer.id)}
                    className="gap-1"
                  >
                    <Archive className="h-4 w-4" />
                    <span className="hidden sm:inline">Archive</span>
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {archivedFarmers.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Archived Farmers ({archivedFarmers.length})
          </h2>
          <div className="grid gap-3">
            {archivedFarmers.map((farmer) => (
              <Card key={farmer.id} className="p-4 sm:p-6">
                <div>
                  <p className="font-medium text-gray-900">{farmer.name}</p>
                  <p className="text-sm text-gray-600">{farmer.phone}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <Card className="p-6 text-center">
          <p className="text-gray-600">Loading farmers…</p>
        </Card>
      )}
    </div>
  );
}
