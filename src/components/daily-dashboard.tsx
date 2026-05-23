import { Users, Droplets } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatLitres } from '@/lib/utils';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <Card className="p-0">
      <CardContent className="flex items-start justify-between gap-4 p-4 sm:p-5">
        <div className="flex-1">
          <p className="label-operational">{label}</p>
          <p className="stat-value mt-2">{value}</p>
        </div>
        <div className="flex items-center justify-center rounded-lg bg-milk-green-50 p-3 text-milk-green-600">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

interface DailyDashboardProps {
  dateLabel: string;
  todayLitres: number;
  todayFarmers: number;
}

export function DailyDashboard({
  dateLabel,
  todayLitres,
  todayFarmers,
}: DailyDashboardProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <p className="label-operational">{dateLabel}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard
          icon={<Droplets className="h-5 w-5" />}
          label="Total Litres"
          value={formatLitres(todayLitres)}
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Farmers Delivered"
          value={todayFarmers.toString()}
        />
      </div>
    </div>
  );
}
