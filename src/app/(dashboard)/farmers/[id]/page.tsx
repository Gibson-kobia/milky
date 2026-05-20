import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Farmer, MilkDelivery, LedgerEntry } from '@/types';

export default function FarmerDetailPage(props: any) {
  const { params } = props;
  // Mock data - in real app would fetch from params.id
  const farmer: Farmer = {
    id: params.id,
    name: 'John Kipchoge',
    phone: '+254712345678',
    active: true,
    evening_delivery_enabled: false,
    notes: 'Consistent supplier',
    created_at: new Date().toISOString(),
    archived_at: null,
  };

  const mockDeliveries: MilkDelivery[] = [
    {
      id: '1',
      farmer_id: farmer.id,
      date: new Date().toISOString().split('T')[0],
      litres: 2.5,
      delivery_type: 'morning',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
    },
    {
      id: '2',
      farmer_id: farmer.id,
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      litres: 2,
      delivery_type: 'morning',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
    },
  ];

  const mockLedger: LedgerEntry[] = [
    {
      id: '1',
      farmer_id: farmer.id,
      entry_type: 'milk_delivery',
      amount_kes: 137.5,
      description: null,
      created_at: new Date().toISOString(),
      created_by: null,
      transaction_date: new Date().toISOString().split('T')[0],
      reference_id: null,
    },
    {
      id: '2',
      farmer_id: farmer.id,
      entry_type: 'milk_delivery',
      amount_kes: 110,
      description: null,
      created_at: new Date().toISOString(),
      created_by: null,
      transaction_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      reference_id: null,
    },
  ];

  const totalDeliveries = mockDeliveries.length;
  const totalLitres = mockDeliveries.reduce((sum, d) => sum + d.litres, 0);
  const totalEarnings = mockLedger
    .filter((e) => e.entry_type.includes('delivery'))
    .reduce((sum, e) => sum + e.amount_kes, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{farmer.name}</h1>
          <p className="text-sm text-gray-600">{farmer.phone}</p>
        </div>
        <Badge variant="success">Active</Badge>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-gray-600 uppercase">
              Deliveries
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {totalDeliveries}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-gray-600 uppercase">
              Total Litres
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {totalLitres}L
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-gray-600 uppercase">
              Total Earnings
            </p>
            <p className="mt-2 text-2xl font-bold text-milk-green-600">
              {formatCurrency(totalEarnings)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="deliveries">
        <TabsList>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="advances">Advances</TabsTrigger>
        </TabsList>

        <TabsContent value="deliveries" className="mt-6 space-y-3">
          {mockDeliveries.map((delivery) => (
            <Card key={delivery.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-gray-900">
                    {formatDate(delivery.date)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {delivery.litres}L - {delivery.delivery_type}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {formatCurrency(delivery.litres * 55)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="ledger" className="mt-6 space-y-3">
          {mockLedger.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-gray-900 capitalize">
                    {entry.entry_type.replace('_', ' ')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDate(entry.transaction_date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {formatCurrency(entry.amount_kes)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="advances" className="mt-6">
          <Card className="p-6 text-center">
            <p className="text-gray-600">No advances recorded</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
