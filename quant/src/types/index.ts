export interface Pair {
  id: string;
  ticker1: string;
  ticker2: string;
  correlation: number;
  pValue: number;
  halfLife: number;
  tags: string[];
  status: 'Strong' | 'Moderate' | 'Weak';
}

export interface MetricData {
  label: string;
  value: string | number;
  subtitle?: string;
}

export interface EquityCurvePoint {
  timestamp: string;
  equity: number;
}

export interface Trade {
  entryTime: string;
  exitTime: string;
  pnl: number;
  direction: 'Long' | 'Short';
  entryZ: number;
  exitZ: number;
}

export interface BacktestMetrics {
  cumulativeReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  avgTradeDurationDays: number;
}

export interface BacktestResult {
  metrics: BacktestMetrics;
  equityCurve: EquityCurvePoint[];
  trades: Trade[];
}

export interface BacktestConfig {
  pairId: string;
  startDate: string;
  endDate: string;
  entryZScore: number;
  exitZScore: number;
  maxLeverage: number;
  positionSize: number;
  stopLoss: number;
  useMarketNeutral: boolean;
}

export interface SpreadData {
  timestamp: string;
  spread: number;
  zScore: number;
}

export interface PairDetail {
  pair: Pair;
  spread: SpreadData[];
  summary: string;
  meanReversionScore: number;
}
