'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { LedgerEntry } from '@/types';

export default function AccountingPage() {
  const mockLedger: LedgerEntry[] = [
    {
      id: '1',
      farmer_id: '1',
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
      farmer_id: '2',
      entry_type: 'milk_delivery',
      amount_kes: 192.5,
      description: null,
      created_at: new Date().toISOString(),
      created_by: null,
      transaction_date: new Date().toISOString().split('T')[0],
      reference_id: null,
    },
    {
      id: '3',
      farmer_id: '3',
      entry_type: 'advance_cash',
      amount_kes: -500,
      description: 'Animal feed purchase',
      created_at: new Date().toISOString(),
      created_by: null,
      transaction_date: new Date().toISOString().split('T')[0],
      reference_id: null,
    },
    {
      id: '4',
      farmer_id: '1',
      entry_type: 'payout_mpesa',
      amount_kes: -1000,
      description: null,
      created_at: new Date().toISOString(),
      created_by: null,
      transaction_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      reference_id: null,
    },
  ];

  const entryTypeColors: Record<string, string> = {
    milk_delivery: 'default',
    evening_delivery: 'default',
    advance_cash: 'warning',
    advance_goods: 'warning',
    payout_cash: 'destructive',
    payout_mpesa: 'destructive',
    adjustment: 'secondary',
  };

  const totalIncome = mockLedger
    .filter((e) => !e.entry_type.startsWith('payout') && !e.entry_type.startsWith('advance'))
    .reduce((sum, e) => sum + e.amount_kes, 0);

  const totalPayouts = mockLedger
    .filter((e) => e.entry_type.startsWith('payout'))
    .reduce((sum, e) => sum + Math.abs(e.amount_kes), 0);

  const totalAdvances = mockLedger
    .filter((e) => e.entry_type.startsWith('advance'))
    .reduce((sum, e) => sum + Math.abs(e.amount_kes), 0);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounting</h1>
          <p className="mt-1 text-sm text-gray-600">
            Complete financial transaction ledger
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Entry</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-gray-600 uppercase">
              Total Income
            </p>
            <p className="mt-2 text-2xl font-bold text-milk-green-600">
              {formatCurrency(totalIncome)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-gray-600 uppercase">
              Advances Given
            </p>
            <p className="mt-2 text-2xl font-bold text-milk-amber-600">
              {formatCurrency(totalAdvances)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-gray-600 uppercase">
              Payouts
            </p>
            <p className="mt-2 text-2xl font-bold text-red-600">
              {formatCurrency(totalPayouts)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Entries */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-900">Recent Transactions</h2>
        {mockLedger.map((entry) => (
          <Card key={entry.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 capitalize">
                    {entry.entry_type.replace('_', ' ')}
                  </p>
                  <Badge
                    variant={
                      entryTypeColors[
                        entry.entry_type as keyof typeof entryTypeColors
                      ] as any
                    }
                  >
                    {formatDate(entry.transaction_date)}
                  </Badge>
                </div>
                {entry.description && (
                  <p className="mt-1 text-sm text-gray-600">
                    {entry.description}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p
                  className={`text-lg font-bold ${
                    entry.amount_kes > 0
                      ? 'text-milk-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {entry.amount_kes > 0 ? '+' : ''}
                  {formatCurrency(entry.amount_kes)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
