import {
  Pair,
  BacktestResult,
  PairDetail,
  EquityCurvePoint,
} from "../types";
import {
  fetchPairs,
  fetchPairDetail,
  runBacktest as runBacktestApi,
} from "./api";

// Small helper: % rounding
const round2 = (x: number) => Math.round(x * 100) / 100;

// ---------- API-BACKED MOCK WRAPPER ----------

export const mockApi = {
  // This one can stay fake, it's just for the Settings "universe" dropdown
  getUniverse: async (): Promise<string[]> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return ["US Large Cap (Demo)"];
  },

  // Use real /api/pairs but map into the existing Pair type
  getPairs: async (): Promise<Pair[]> => {
    const res = await fetchPairs(); // FastAPI: { pairs: [...] }

    const pairs: Pair[] = res.pairs.map((p) => ({
      id: p.id, // e.g. "AAPL-MSFT"
      ticker1: p.ticker1,
      ticker2: p.ticker2,
      correlation: p.correlation,
      pValue: p.pvalue, // note: backend uses pvalue, UI uses pValue
      halfLife: p.half_life ?? null,
      tags: p.tags ?? [],
      status: p.status ?? "Moderate",
    }));

    return pairs;
  },

  // Use /api/pair/{id} + /api/pairs to build a nice PairDetail object
  getPairDetail: async (id: string): Promise<PairDetail> => {
    // Get all pairs to extract metadata (tags, pValue, halfLife, status)
    const pairsRes = await fetchPairs();
    const meta = pairsRes.pairs.find((p) => p.id === id);

    if (!meta) {
      throw new Error("Pair not found in backend");
    }

    const detail = await fetchPairDetail(id);

    const spreadData = detail.times.map((t, idx) => ({
      timestamp: t,
      spread: round2(detail.spread[idx]),
      zScore: round2(detail.zscore[idx]),
    }));

    // Build Pair type that UI expects
    const pair: Pair = {
      id,
      ticker1: meta.ticker1,
      ticker2: meta.ticker2,
      correlation: meta.correlation,
      pValue: meta.pvalue,
      halfLife: meta.half_life ?? null,
      tags: meta.tags ?? [],
      status: meta.status ?? "Moderate",
    };

    const halfLife = pair.halfLife ?? 30;
    const style =
      halfLife < 10 ? "aggressive"
      : halfLife < 20 ? "medium-term"
      : "slower";

    const summary = `This pair shows ${pair.status.toLowerCase()} cointegration with ${
      halfLife < 15 ? "fast" : "moderate"
    } half-life. Suitable for ${style} mean-reversion strategies.`;

    const meanReversionScore = Math.round((1 - pair.pValue) * 100);

    return {
      pair,
      spread: spreadData,
      summary,
      meanReversionScore,
    };
  },

  // Use /api/backtest but keep the old BacktestResult shape
  runBacktest: async (config: any): Promise<BacktestResult> => {
    // Try to infer tickers from config
    let ticker1: string | undefined = config.ticker1;
    let ticker2: string | undefined = config.ticker2;

    if (!ticker1 || !ticker2) {
      const pairId: string =
        config.pairId || config.pair || config.selectedPairId || "AAPL-MSFT";
      const parts = pairId.split("-");
      ticker1 = parts[0];
      ticker2 = parts[1] || "MSFT";
    }

    const start_date: string | undefined =
      config.startDate || config.start_date || undefined;
    const end_date: string | undefined =
      config.endDate || config.end_date || undefined;

    const body = {
      ticker1,
      ticker2,
      start_date: start_date ?? null,
      end_date: end_date ?? null,
      lookback: config.lookback ?? 60,
      entry_z: config.entryZScore ?? config.entry_z ?? 2.0,
      exit_z: config.exitZScore ?? config.exit_z ?? 0.5,
    };

    const apiResp = await runBacktestApi(body);

    // Map equity curve
    const equityCurve: EquityCurvePoint[] = apiResp.equity_curve.map((pt) => ({
      timestamp: pt.timestamp,
      equity: round2(pt.equity),
    }));

    // Map trades into UI shape
    const trades = apiResp.trades.map((t: any) => ({
      entryTime: t.entry_date || t.entryTime || t.entry_time,
      exitTime: t.exit_date || t.exitTime || t.exit_time,
      pnl: round2(t.pnl ?? 0),
      direction:
        t.direction === "long_spread"
          ? "Long"
          : t.direction === "short_spread"
          ? "Short"
          : t.direction || "Long",
      entryZ: t.entry_z ?? t.entryZ ?? 0,
      exitZ: t.exit_z ?? t.exitZ ?? 0,
    }));

    const m = apiResp.metrics;

    const metrics: BacktestResult["metrics"] = {
      cumulativeReturn: round2((m.cumulative_return ?? 0) * 100), // to %
      annualizedReturn: round2((m.annualized_return ?? 0) * 100), // to %
      sharpeRatio: round2(m.sharpe_ratio ?? 0),
      maxDrawdown: round2(Math.abs(m.max_drawdown ?? 0) * 100), // to %
      winRate: round2((m.win_rate ?? 0) * 100), // to %
      avgTradeDurationDays: round2(m.avg_bars_held ?? 0),
    };

    return {
      metrics,
      equityCurve,
      trades,
    };
  },
};
