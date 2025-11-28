import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import DataTable from '../components/DataTable';
import LineChart from '../components/LineChart';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import { mockApi } from '../lib/mockApi';
import { Pair, EquityCurvePoint } from '../types';
import { useNavigation } from '../context/NavigationContext';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [equityCurve, setEquityCurve] = useState<EquityCurvePoint[]>([]);
  const { navigateTo, setPageParams } = useNavigation();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [pairsData] = await Promise.all([
          mockApi.getPairs()
        ]);
        setPairs(pairsData);

        const mockEquity: EquityCurvePoint[] = [];
        let equity = 100000;
        const startDate = new Date('2023-01-01');

        for (let i = 0; i < 250; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          equity *= (1 + (Math.random() - 0.45) * 0.015);
          mockEquity.push({
            timestamp: date.toISOString(),
            equity: Math.round(equity * 100) / 100
          });
        }
        setEquityCurve(mockEquity);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  const strongPairs = pairs.filter(p => p.status === 'Strong');
  const topPairs = strongPairs.slice(0, 8);
  const avgSharpe = 1.42;
  const finalEquity = equityCurve[equityCurve.length - 1]?.equity || 100000;
  const initialEquity = equityCurve[0]?.equity || 100000;
  const portfolioReturn = ((finalEquity - initialEquity) / initialEquity) * 100;

  const chartData = equityCurve.map((point, idx) => ({
    x: idx,
    y: point.equity
  }));

  const handleViewPair = (pair: Pair) => {
    setPageParams({ selectedPairId: pair.id });
    navigateTo('pairs-explorer');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Universe Size"
          value={45}
          subtitle="Active tickers"
        />
        <MetricCard
          label="Cointegrated Pairs"
          value={pairs.length}
          subtitle={`${strongPairs.length} strong`}
        />
        <MetricCard
          label="Avg Sharpe (Top 10)"
          value={avgSharpe.toFixed(2)}
          trend="up"
        />
        <MetricCard
          label="Last Data Update"
          value="12:45 PM"
          subtitle="2024-01-15"
        />
      </div>

      <Card title="Portfolio Equity Curve">
        <div className="mb-4">
          <div className="flex items-baseline space-x-4">
            <div className="text-2xl font-semibold text-gray-900">
              ${finalEquity.toLocaleString()}
            </div>
            <div className={`text-sm font-medium ${portfolioReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolioReturn >= 0 ? '+' : ''}{portfolioReturn.toFixed(2)}%
            </div>
          </div>
          <div className="text-sm text-gray-500">Sample portfolio performance (250 days)</div>
        </div>
        <LineChart
          data={chartData}
          height={280}
          color="#2563eb"
          yAxisLabel="Equity ($)"
        />
      </Card>

      <Card title="Top Pairs">
        <DataTable
          columns={[
            {
              key: 'pair',
              header: 'Pair',
              render: (row: Pair) => (
                <div className="font-medium">
                  {row.ticker1} / {row.ticker2}
                </div>
              )
            },
            {
              key: 'correlation',
              header: 'Correlation',
              render: (row: Pair) => row.correlation.toFixed(3)
            },
            {
              key: 'pValue',
              header: 'p-value',
              render: (row: Pair) => row.pValue.toFixed(4)
            },
            {
              key: 'status',
              header: 'Status',
              render: (row: Pair) => (
                <Badge variant={row.status === 'Strong' ? 'success' : 'warning'}>
                  {row.status}
                </Badge>
              )
            },
            {
              key: 'actions',
              header: '',
              render: (row: Pair) => (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewPair(row);
                  }}
                >
                  View <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )
            }
          ]}
          data={topPairs}
          onRowClick={handleViewPair}
          getRowId={(row) => row.id}
        />
      </Card>
    </div>
  );
}
