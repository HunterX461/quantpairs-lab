import { useEffect, useState } from 'react';
import { Play, Save } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import MetricCard from '../components/MetricCard';
import LineChart from '../components/LineChart';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';
import { mockApi } from '../lib/mockApi';
import { Pair, BacktestResult, BacktestConfig, Trade } from '../types';
import { useNavigation } from '../context/NavigationContext';

export default function BacktestStudio() {
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const { pageParams } = useNavigation();

  const [config, setConfig] = useState<BacktestConfig>({
    pairId: '',
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    entryZScore: 2.0,
    exitZScore: 0.5,
    maxLeverage: 2.0,
    positionSize: 10,
    stopLoss: 5,
    useMarketNeutral: true
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const pairsData = await mockApi.getPairs();
        setPairs(pairsData);

        if (pageParams.selectedPairId) {
          setConfig(prev => ({ ...prev, pairId: pageParams.selectedPairId }));
        } else if (pairsData.length > 0) {
          setConfig(prev => ({ ...prev, pairId: pairsData[0].id }));
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [pageParams.selectedPairId]);

  const handleRunBacktest = async () => {
    setRunning(true);
    try {
      const backtestResult = await mockApi.runBacktest(config);
      setResult(backtestResult);
    } finally {
      setRunning(false);
    }
  };

  const handleSaveConfiguration = () => {
    const saved = localStorage.getItem('backtestConfigs');
    const configs = saved ? JSON.parse(saved) : [];
    configs.push({ ...config, timestamp: new Date().toISOString() });
    localStorage.setItem('backtestConfigs', JSON.stringify(configs));
    alert('Configuration saved successfully!');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const selectedPair = pairs.find(p => p.id === config.pairId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card title="Backtest Configuration">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pair
              </label>
              <select
                value={config.pairId}
                onChange={(e) => setConfig({ ...config, pairId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {pairs.map(pair => (
                  <option key={pair.id} value={pair.id}>
                    {pair.ticker1} / {pair.ticker2}
                  </option>
                ))}
              </select>
            </div>

            {selectedPair && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Correlation:</span>
                  <span className="font-medium">{selectedPair.correlation.toFixed(3)}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600">p-value:</span>
                  <span className="font-medium">{selectedPair.pValue.toFixed(4)}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600">Half-life:</span>
                  <span className="font-medium">{selectedPair.halfLife} days</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={config.startDate}
                  onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={config.endDate}
                  onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entry Z-Score
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={config.entryZScore}
                  onChange={(e) => setConfig({ ...config, entryZScore: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exit Z-Score
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={config.exitZScore}
                  onChange={(e) => setConfig({ ...config, exitZScore: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Leverage
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={config.maxLeverage}
                  onChange={(e) => setConfig({ ...config, maxLeverage: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position Size (%)
                </label>
                <input
                  type="number"
                  step="1"
                  value={config.positionSize}
                  onChange={(e) => setConfig({ ...config, positionSize: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stop Loss (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={config.stopLoss}
                onChange={(e) => setConfig({ ...config, stopLoss: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="marketNeutral"
                checked={config.useMarketNeutral}
                onChange={(e) => setConfig({ ...config, useMarketNeutral: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="marketNeutral" className="ml-2 text-sm text-gray-700">
                Use market-neutral hedge ratio
              </label>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button onClick={handleRunBacktest} disabled={running} className="flex-1">
                {running ? (
                  <>Running...</>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Backtest
                  </>
                )}
              </Button>
              <Button variant="secondary" onClick={handleSaveConfiguration}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        {!result ? (
          <Card className="flex items-center justify-center h-[600px]">
            <div className="text-center text-gray-400">
              <p>Run a backtest to see results</p>
              <p className="text-sm mt-1">Configure parameters and click "Run Backtest"</p>
            </div>
          </Card>
        ) : (
          <>
            <Card title="Performance Metrics">
              <div className="grid grid-cols-2 gap-4">
                <MetricCard
                  label="Cumulative Return"
                  value={`${result.metrics.cumulativeReturn >= 0 ? '+' : ''}${result.metrics.cumulativeReturn.toFixed(2)}%`}
                  trend={result.metrics.cumulativeReturn >= 0 ? 'up' : 'down'}
                />
                <MetricCard
                  label="Annualized Return"
                  value={`${result.metrics.annualizedReturn >= 0 ? '+' : ''}${result.metrics.annualizedReturn.toFixed(2)}%`}
                  trend={result.metrics.annualizedReturn >= 0 ? 'up' : 'down'}
                />
                <MetricCard
                  label="Sharpe Ratio"
                  value={result.metrics.sharpeRatio.toFixed(2)}
                  trend={result.metrics.sharpeRatio >= 1 ? 'up' : 'neutral'}
                />
                <MetricCard
                  label="Max Drawdown"
                  value={`${result.metrics.maxDrawdown.toFixed(2)}%`}
                  trend="down"
                />
                <MetricCard
                  label="Win Rate"
                  value={`${result.metrics.winRate.toFixed(1)}%`}
                  trend={result.metrics.winRate >= 50 ? 'up' : 'down'}
                />
                <MetricCard
                  label="Avg Trade Duration"
                  value={`${result.metrics.avgTradeDurationDays.toFixed(1)} days`}
                />
              </div>
            </Card>

            <Card title="Equity Curve">
              <LineChart
                data={result.equityCurve.map((point, idx) => ({ x: idx, y: point.equity }))}
                height={280}
                color="#2563eb"
                yAxisLabel="Equity ($)"
              />
            </Card>

            <Card title={`Trades (${result.trades.length})`}>
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <DataTable
                  columns={[
                    {
                      key: 'entryTime',
                      header: 'Entry',
                      render: (row: Trade) => new Date(row.entryTime).toLocaleDateString()
                    },
                    {
                      key: 'exitTime',
                      header: 'Exit',
                      render: (row: Trade) => new Date(row.exitTime).toLocaleDateString()
                    },
                    {
                      key: 'direction',
                      header: 'Direction',
                      render: (row: Trade) => (
                        <Badge variant={row.direction === 'Long' ? 'info' : 'warning'}>
                          {row.direction}
                        </Badge>
                      )
                    },
                    {
                      key: 'pnl',
                      header: 'P&L',
                      render: (row: Trade) => (
                        <span className={row.pnl >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          ${row.pnl.toFixed(2)}
                        </span>
                      )
                    },
                    {
                      key: 'entryZ',
                      header: 'Entry Z',
                      render: (row: Trade) => row.entryZ.toFixed(2)
                    },
                    {
                      key: 'exitZ',
                      header: 'Exit Z',
                      render: (row: Trade) => row.exitZ.toFixed(2)
                    }
                  ]}
                  data={result.trades}
                />
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
