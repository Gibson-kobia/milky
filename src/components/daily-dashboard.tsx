import { TrendingUp, Users, Droplets, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatLitres } from '@/lib/utils';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
}

function StatCard({ icon, label, value, subtext }: StatCardProps) {
  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {value}
            </p>
          </div>
          {subtext && <p className="text-xs text-gray-600">{subtext}</p>}
        </div>
        <div className="rounded-lg bg-milk-green-100 p-3 text-milk-green-600">
          {icon}
        </div>
      </div>
    </Card>
  );
}

interface DailyDashboardProps {
  todayLitres: number;
  todayFarmers: number;
  todayProfit: number;
  todayPayout: number;
  monthLitres: number;
  monthPayout: number;
  monthProfit: number;
  activeFarmers: number;
}

export function DailyDashboard({
  todayLitres,
  todayFarmers,
  todayProfit,
  todayPayout,
  monthLitres,
  monthPayout,
  monthProfit,
  activeFarmers,
}: DailyDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Today</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Droplets className="h-6 w-6" />}
            label="Litres Collected"
            value={formatLitres(todayLitres)}
          />
          <StatCard
            icon={<Users className="h-6 w-6" />}
            label="Farmers Delivered"
            value={todayFarmers.toString()}
          />
          <StatCard
            icon={<TrendingUp className="h-6 w-6" />}
            label="Gross Profit"
            value={formatCurrency(todayProfit)}
          />
          <StatCard
            icon={<Package className="h-6 w-6" />}
            label="Payout"
            value={formatCurrency(todayPayout)}
          />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">This Month</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Droplets className="h-6 w-6" />}
            label="Litres Collected"
            value={formatLitres(monthLitres)}
          />
          <StatCard
            icon={<Users className="h-6 w-6" />}
            label="Active Farmers"
            value={activeFarmers.toString()}
          />
          <StatCard
            icon={<TrendingUp className="h-6 w-6" />}
            label="Gross Profit"
            value={formatCurrency(monthProfit)}
          />
          <StatCard
            icon={<Package className="h-6 w-6" />}
            label="Total Payout"
            value={formatCurrency(monthPayout)}
          />
        </div>
      </div>
    </div>
  );
}
