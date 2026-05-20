import { TrendingUp, Users, Droplets, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatLitres } from '@/lib/utils';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  trend?: 'up' | 'down';
}

function StatCard({ icon, label, value, subtext, trend }: StatCardProps) {
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
            {trend && (
              <TrendingUp
                className={`h-4 w-4 ${
                  trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}
              />
            )}
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
  totalLitres: number;
  totalFarmers: number;
  estimatedProfit: number;
  estimatedPayout: number;
}

export function DailyDashboard({
  totalLitres,
  totalFarmers,
  estimatedProfit,
  estimatedPayout,
}: DailyDashboardProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={<Droplets className="h-6 w-6" />}
        label="Today's Collection"
        value={formatLitres(totalLitres)}
      />
      <StatCard
        icon={<Users className="h-6 w-6" />}
        label="Farmers Delivered"
        value={totalFarmers.toString()}
      />
      <StatCard
        icon={<TrendingUp className="h-6 w-6" />}
        label="Est. Gross Profit"
        value={formatCurrency(estimatedProfit)}
      />
      <StatCard
        icon={<Package className="h-6 w-6" />}
        label="Est. Payout"
        value={formatCurrency(estimatedPayout)}
      />
    </div>
  );
}
