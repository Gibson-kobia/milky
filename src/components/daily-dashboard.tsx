import { Users, Droplets, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatLitres } from '@/lib/utils';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            {value}
          </p>
        </div>
        <div className="rounded-2xl bg-milk-green-100 p-3 text-milk-green-600">
          {icon}
        </div>
      </div>
    </Card>
  );
}

interface DailyDashboardProps {
  dateLabel: string;
  todayLitres: number;
  todayFarmers: number;
  todayPayout: number;
}

export function DailyDashboard({
  dateLabel,
  todayLitres,
  todayFarmers,
  todayPayout,
}: DailyDashboardProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {dateLabel}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Fast milk entry for the selected day.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <StatCard
            icon={<Droplets className="h-5 w-5" />}
            label="Litres"
            value={formatLitres(todayLitres)}
          />
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Farmers"
            value={todayFarmers.toString()}
          />
          <StatCard
            icon={<Package className="h-5 w-5" />}
            label="Payout"
            value={formatCurrency(todayPayout)}
          />
        </div>
      </div>
    </div>
  );
}
