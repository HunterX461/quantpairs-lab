interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export default function MetricCard({ label, value, subtitle, trend }: MetricCardProps) {
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="text-sm font-medium text-gray-500 mb-1">{label}</div>
      <div className={`text-2xl font-semibold ${trend ? trendColor : 'text-gray-900'}`}>
        {value}
      </div>
      {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
    </div>
  );
}
