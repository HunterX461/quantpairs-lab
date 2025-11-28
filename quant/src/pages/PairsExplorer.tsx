import { useEffect, useState } from 'react';
import { Filter, ArrowRight } from 'lucide-react';
import DataTable from '../components/DataTable';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import LineChart from '../components/LineChart';
import MetricCard from '../components/MetricCard';
import { mockApi } from '../lib/mockApi';
import { Pair, PairDetail } from '../types';
import { useNavigation } from '../context/NavigationContext';

export default function PairsExplorer() {
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [filteredPairs, setFilteredPairs] = useState<Pair[]>([]);
  const [selectedPair, setSelectedPair] = useState<Pair | null>(null);
  const [pairDetail, setPairDetail] = useState<PairDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'spread' | 'zscore' | 'summary'>('spread');

  const [filters, setFilters] = useState({
    universe: 'all',
    maxPValue: 0.05,
    minCorrelation: 0.7
  });

  const { navigateTo, setPageParams, pageParams } = useNavigation();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const pairsData = await mockApi.getPairs();
        setPairs(pairsData);
        setFilteredPairs(pairsData);

        if (pageParams.selectedPairId) {
          const pair = pairsData.find(p => p.id === pageParams.selectedPairId);
          if (pair) {
            setSelectedPair(pair);
            loadPairDetail(pair.id);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [pageParams.selectedPairId]);

  const loadPairDetail = async (pairId: string) => {
    setDetailLoading(true);
    try {
      const detail = await mockApi.getPairDetail(pairId);
      setPairDetail(detail);
    } finally {
      setDetailLoading(false);
    }
  };

  const applyFilters = () => {
    const filtered = pairs.filter(pair =>
      pair.pValue <= filters.maxPValue &&
      pair.correlation >= filters.minCorrelation
    );
    setFilteredPairs(filtered);
  };

  const handlePairSelect = (pair: Pair) => {
    setSelectedPair(pair);
    loadPairDetail(pair.id);
  };

  const handleSendToBacktest = () => {
    if (selectedPair) {
      setPageParams({ selectedPairId: selectedPair.id });
      navigateTo('backtest-studio');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
      <div className="flex flex-col space-y-4 overflow-hidden">
        <Card title="Filters">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Universe
              </label>
              <select
                value={filters.universe}
                onChange={(e) => setFilters({ ...filters, universe: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Sectors</option>
                <option value="tech">US Tech</option>
                <option value="banks">US Banks</option>
                <option value="energy">US Energy</option>
                <option value="consumer">US Consumer</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max p-value
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={filters.maxPValue}
                  onChange={(e) => setFilters({ ...filters, maxPValue: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Correlation
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={filters.minCorrelation}
                  onChange={(e) => setFilters({ ...filters, minCorrelation: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <Button onClick={applyFilters} className="w-full">
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </Card>

        <Card title={`Pairs (${filteredPairs.length})`} className="flex-1 overflow-hidden">
          <div className="overflow-auto h-full">
            <DataTable
              columns={[
                {
                  key: 'pair',
                  header: 'Pair',
                  render: (row: Pair) => (
                    <div>
                      <div className="font-medium">{row.ticker1} / {row.ticker2}</div>
                      <div className="text-xs text-gray-500">Half-life: {row.halfLife}d</div>
                    </div>
                  )
                },
                {
                  key: 'correlation',
                  header: 'Corr',
                  render: (row: Pair) => row.correlation.toFixed(3)
                },
                {
                  key: 'pValue',
                  header: 'p-value',
                  render: (row: Pair) => row.pValue.toFixed(4)
                },
                {
                  key: 'tags',
                  header: 'Tags',
                  render: (row: Pair) => (
                    <div className="flex flex-wrap gap-1">
                      {row.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                      ))}
                    </div>
                  )
                }
              ]}
              data={filteredPairs}
              onRowClick={handlePairSelect}
              selectedId={selectedPair?.id}
              getRowId={(row) => row.id}
            />
          </div>
        </Card>
      </div>

      <div className="flex flex-col overflow-hidden">
        {!selectedPair ? (
          <Card className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <p>No pair selected yet</p>
              <p className="text-sm mt-1">Click a pair to view details</p>
            </div>
          </Card>
        ) : (
          <Card title={`${selectedPair.ticker1} / ${selectedPair.ticker2}`} className="flex-1 overflow-hidden flex flex-col">
            {detailLoading ? (
              <LoadingSpinner />
            ) : pairDetail ? (
              <>
                <div className="border-b border-gray-200 mb-4">
                  <div className="flex space-x-4">
                    {['spread', 'zscore', 'summary'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`
                          px-4 py-2 text-sm font-medium border-b-2 transition-colors
                          ${activeTab === tab
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                          }
                        `}
                      >
                        {tab === 'spread' ? 'Spread Chart' : tab === 'zscore' ? 'Z-Score Distribution' : 'Summary'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-auto">
                  {activeTab === 'spread' && (
                    <div>
                      <LineChart
                        data={pairDetail.spread.map((d, idx) => ({ x: idx, y: d.spread }))}
                        height={300}
                        color="#2563eb"
                        yAxisLabel="Spread"
                      />
                    </div>
                  )}

                  {activeTab === 'zscore' && (
                    <div>
                      <LineChart
                        data={pairDetail.spread.map((d, idx) => ({ x: idx, y: d.zScore }))}
                        height={300}
                        color="#dc2626"
                        yAxisLabel="Z-Score"
                      />
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          Z-score represents the spread normalized by its standard deviation.
                          Values beyond ±2 typically signal trading opportunities.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'summary' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <MetricCard
                          label="Correlation"
                          value={pairDetail.pair.correlation.toFixed(3)}
                        />
                        <MetricCard
                          label="p-value"
                          value={pairDetail.pair.pValue.toFixed(4)}
                        />
                        <MetricCard
                          label="Half-life"
                          value={`${pairDetail.pair.halfLife} days`}
                        />
                        <MetricCard
                          label="MR Score"
                          value={pairDetail.meanReversionScore}
                        />
                      </div>

                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-700">{pairDetail.summary}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {pairDetail.pair.tags.map(tag => (
                          <Badge key={tag} variant="info">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button onClick={handleSendToBacktest} className="w-full">
                    Send to Backtest <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            ) : null}
          </Card>
        )}
      </div>
    </div>
  );
}
