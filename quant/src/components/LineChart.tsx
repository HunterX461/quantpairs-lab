import { useMemo } from 'react';

interface DataPoint {
  x: number;
  y: number;
  label?: string;
}

interface LineChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
  showGrid?: boolean;
  yAxisLabel?: string;
  xAxisLabel?: string;
}

export default function LineChart({
  data,
  height = 300,
  color = '#2563eb',
  showGrid = true,
  yAxisLabel,
  xAxisLabel
}: LineChartProps) {
  const { path, minY, maxY, minX, maxX } = useMemo(() => {
    if (data.length === 0) return { path: '', minY: 0, maxY: 0, minX: 0, maxX: 0 };

    const minY = Math.min(...data.map(d => d.y));
    const maxY = Math.max(...data.map(d => d.y));
    const minX = Math.min(...data.map(d => d.x));
    const maxX = Math.max(...data.map(d => d.x));

    const padding = 40;
    const width = 800;
    const chartHeight = height - padding * 2;
    const chartWidth = width - padding * 2;

    const scaleX = (x: number) => ((x - minX) / (maxX - minX)) * chartWidth + padding;
    const scaleY = (y: number) => height - (((y - minY) / (maxY - minY)) * chartHeight + padding);

    const pathData = data.map((point, i) => {
      const x = scaleX(point.x);
      const y = scaleY(point.y);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return { path: pathData, minY, maxY, minX, maxX };
  }, [data, height]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-gray-400 text-sm">No data available</p>
      </div>
    );
  }

  const yTicks = 5;
  const gridLines = [];
  for (let i = 0; i <= yTicks; i++) {
    const y = (height - 80) * (i / yTicks) + 40;
    const value = maxY - ((maxY - minY) * i / yTicks);
    gridLines.push({ y, value });
  }

  return (
    <div className="relative">
      <svg width="100%" height={height} viewBox={`0 0 800 ${height}`} className="overflow-visible">
        {showGrid && gridLines.map((line, i) => (
          <g key={i}>
            <line
              x1={40}
              y1={line.y}
              x2={760}
              y2={line.y}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
            <text
              x={30}
              y={line.y}
              textAnchor="end"
              alignmentBaseline="middle"
              className="text-xs fill-gray-500"
            >
              {line.value.toFixed(0)}
            </text>
          </g>
        ))}

        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {yAxisLabel && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-gray-500 origin-center">
          {yAxisLabel}
        </div>
      )}
      {xAxisLabel && (
        <div className="text-center text-xs text-gray-500 mt-2">
          {xAxisLabel}
        </div>
      )}
    </div>
  );
}
