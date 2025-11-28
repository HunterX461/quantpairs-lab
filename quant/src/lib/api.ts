const API_BASE =
  (import.meta as any).env?.VITE_API_BASE || "http://localhost:8000";

export interface UniverseResponse {
  universe_name: string;
  num_tickers: number;
  tickers: string[];
  last_date: string;
}

export interface PairItem {
  id: string;
  ticker1: string;
  ticker2: string;
  pvalue: number;
  score: number;
  correlation: number;
  half_life: number | null;
  status: string;
  tags: string[];
}

export interface PairsResponse {
  pairs: PairItem[];
}

export interface PairDetailResponse {
  pair: string;
  beta: number;
  times: string[];
  spread: number[];
  zscore: number[];
  equity: number[];
  metrics: {
    pair: string;
    beta: number;
    lookback: number;
    entry_z: number;
    exit_z: number;
    cumulative_return: number;
    annualized_return: number;
    sharpe_ratio: number;
    max_drawdown: number;
    num_trades: number;
    win_rate: number | null;
    avg_bars_held: number | null;
  };
}

export interface BacktestRequest {
  ticker1: string;
  ticker2: string;
  start_date?: string | null;
  end_date?: string | null;
  lookback: number;
  entry_z: number;
  exit_z: number;
}

export interface BacktestResponse {
  metrics: PairDetailResponse["metrics"];
  equity_curve: { timestamp: string; equity: number }[];
  trades: any[]; // you can tighten this type later if you want
}

// ---------- API HELPERS ----------

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchUniverse(): Promise<UniverseResponse> {
  const res = await fetch(`${API_BASE}/api/universe`);
  return handleResponse<UniverseResponse>(res);
}

export async function fetchPairs(): Promise<PairsResponse> {
  const res = await fetch(`${API_BASE}/api/pairs`);
  return handleResponse<PairsResponse>(res);
}

export async function fetchPairDetail(
  pairId: string
): Promise<PairDetailResponse> {
  const res = await fetch(`${API_BASE}/api/pair/${pairId}`);
  return handleResponse<PairDetailResponse>(res);
}

export async function runBacktest(
  body: BacktestRequest
): Promise<BacktestResponse> {
  const res = await fetch(`${API_BASE}/api/backtest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return handleResponse<BacktestResponse>(res);
}
