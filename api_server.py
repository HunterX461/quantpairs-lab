import pandas as pd
import numpy as np
from dataclasses import dataclass
from typing import List, Optional
from datetime import date

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# =============================
# CONFIG & GLOBAL STATE
# =============================

PRICES_CSV = "prices_daily_adj_close.csv"
COINTEGRATION_CSV = "cointegration_good_pairs.csv"
ANNUAL_TRADING_DAYS = 252

try:
    PRICES = pd.read_csv(PRICES_CSV, index_col=0, parse_dates=True)
except FileNotFoundError:
    raise RuntimeError(f"Could not find {PRICES_CSV}. Run stat_arb_pairs.py first.")

try:
    COINT = pd.read_csv(COINTEGRATION_CSV)
except FileNotFoundError:
    raise RuntimeError(f"Could not find {COINTEGRATION_CSV}. Run stat_arb_pairs.py first.")


# =============================
# QUANT CORE
# =============================

@dataclass
class Trade:
    direction: str
    entry_date: pd.Timestamp
    exit_date: Optional[pd.Timestamp]
    entry_z: float
    exit_z: Optional[float]
    pnl: float
    return_pct: float
    bars_held: int


def compute_hedge_ratio(s1: pd.Series, s2: pd.Series) -> float:
    x = s2.values
    y = s1.values
    beta = np.polyfit(x, y, 1)[0]
    return float(beta)


def compute_half_life(spread: pd.Series) -> float:
    spread = spread.dropna()
    if len(spread) < 2:
        return np.nan

    y_lag = spread.shift(1).dropna()
    y = spread.iloc[1:]
    dy = y.values - y_lag.values
    x = y_lag.values

    X = np.vstack([x, np.ones(len(x))]).T
    try:
        beta, alpha = np.linalg.lstsq(X, dy, rcond=None)[0]
    except Exception:
        return np.nan

    if beta >= 0:
        return np.nan

    halflife = -np.log(2) / beta
    return float(halflife)


def backtest_pair(
    prices: pd.DataFrame,
    t1: str,
    t2: str,
    start: Optional[pd.Timestamp] = None,
    end: Optional[pd.Timestamp] = None,
    lookback: int = 60,
    entry_z: float = 2.0,
    exit_z: float = 0.5,
):
    if t1 not in prices.columns or t2 not in prices.columns:
        raise ValueError(f"Tickers {t1} or {t2} not in price data.")

    data = prices.copy()
    if start is not None:
        data = data[data.index >= start]
    if end is not None:
        data = data[data.index <= end]

    if data.shape[0] < lookback + 10:
        raise ValueError("Not enough data for this date range and lookback.")

    s1 = data[t1]
    s2 = data[t2]
    beta = compute_hedge_ratio(s1, s2)

    spread = s1 - beta * s2
    spread_mean = spread.rolling(lookback).mean()
    spread_std = spread.rolling(lookback).std()
    zscore = (spread - spread_mean) / spread_std

    ret1 = s1.pct_change()
    ret2 = s2.pct_change()

    pos = 0
    pos_history = []
    trade_list: List[Trade] = []
    current_trade_index = None
    trade_entry_z = None
    trade_entry_date = None
    strat_ret = []

    dates = data.index

    for i in range(len(dates)):
        d = dates[i]
        if i == 0:
            pos_history.append(0)
            strat_ret.append(0.0)
            continue

        z = zscore.iloc[i]
        prev_pos = pos
        pos = prev_pos

        if not np.isnan(z):
            if pos == 0:
                if z > entry_z:
                    pos = -1
                    trade_entry_z = float(z)
                    trade_entry_date = d
                    current_trade_index = len(strat_ret)
                elif z < -entry_z:
                    pos = 1
                    trade_entry_z = float(z)
                    trade_entry_date = d
                    current_trade_index = len(strat_ret)
            else:
                if abs(z) < exit_z:
                    trade_pnl = float(np.nansum(strat_ret[current_trade_index:]))
                    trade_ret_pct = trade_pnl
                    bars_held = i - current_trade_index
                    trade = Trade(
                        direction="long_spread" if prev_pos == 1 else "short_spread",
                        entry_date=trade_entry_date,
                        exit_date=d,
                        entry_z=trade_entry_z,
                        exit_z=float(z),
                        pnl=trade_pnl,
                        return_pct=trade_ret_pct,
                        bars_held=bars_held,
                    )
                    trade_list.append(trade)
                    pos = 0
                    current_trade_index = None
                    trade_entry_z = None
                    trade_entry_date = None

        r1 = ret1.iloc[i]
        r2 = ret2.iloc[i]
        if np.isnan(r1) or np.isnan(r2):
            r_strategy = 0.0
        else:
            base = r1 - beta * r2
            r_strategy = pos * base

        strat_ret.append(float(r_strategy))
        pos_history.append(pos)

    strat_ret_series = pd.Series(strat_ret, index=dates)
    pos_series = pd.Series(pos_history, index=dates)
    equity = (1 + strat_ret_series.fillna(0)).cumprod()

    daily_ret = strat_ret_series.replace([np.inf, -np.inf], np.nan).dropna()
    if len(daily_ret) > 1:
        mean_ret = daily_ret.mean()
        vol_ret = daily_ret.std()
        if vol_ret != 0:
            sharpe = np.sqrt(ANNUAL_TRADING_DAYS) * mean_ret / vol_ret
        else:
            sharpe = np.nan
        cum_return = equity.iloc[-1] - 1.0
        ann_return = (
            (1 + cum_return) ** (ANNUAL_TRADING_DAYS / len(daily_ret)) - 1
            if len(daily_ret) > 0
            else np.nan
        )
        rolling_max = equity.cummax()
        drawdown = equity / rolling_max - 1.0
        max_dd = drawdown.min()
    else:
        sharpe = np.nan
        cum_return = 0.0
        ann_return = np.nan
        max_dd = np.nan

    if trade_list:
        wins = [1 for t in trade_list if t.return_pct > 0]
        win_rate = len(wins) / len(trade_list)
        avg_bars = float(np.mean([t.bars_held for t in trade_list]))
    else:
        win_rate = np.nan
        avg_bars = np.nan

    metrics = {
        "pair": f"{t1}/{t2}",
        "beta": beta,
        "lookback": lookback,
        "entry_z": entry_z,
        "exit_z": exit_z,
        "cumulative_return": float(cum_return),
        "annualized_return": float(ann_return),
        "sharpe_ratio": float(sharpe),
        "max_drawdown": float(max_dd),
        "num_trades": len(trade_list),
        "win_rate": float(win_rate) if not np.isnan(win_rate) else None,
        "avg_bars_held": float(avg_bars) if not np.isnan(avg_bars) else None,
    }

    results_df = pd.DataFrame(
        {
            "equity": equity,
            "strategy_return": strat_ret_series,
            "position": pos_series,
            "spread": spread,
            "zscore": zscore,
        }
    )

    trades_df = pd.DataFrame([t.__dict__ for t in trade_list])

    return metrics, results_df, trades_df, beta, spread, zscore


# =============================
# API MODELS
# =============================

class BacktestRequest(BaseModel):
    ticker1: str
    ticker2: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    lookback: int = 60
    entry_z: float = 2.0
    exit_z: float = 0.5


# =============================
# FASTAPI APP
# =============================

app = FastAPI(title="QuantPairs Lab API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # relax later if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/universe")
def get_universe():
    tickers = list(PRICES.columns)
    return {
        "universe_name": "US Large Cap (Demo)",
        "num_tickers": len(tickers),
        "tickers": tickers,
        "last_date": str(PRICES.index.max().date()),
    }


@app.get("/api/pairs")
def get_pairs():
    if COINT.empty:
        return {"pairs": []}

    returns = PRICES.pct_change()
    pairs = []

    for _, row in COINT.iterrows():
        t1 = row["ticker1"]
        t2 = row["ticker2"]
        if t1 not in PRICES.columns or t2 not in PRICES.columns:
            continue

        corr = float(returns[[t1, t2]].dropna().corr().iloc[0, 1])
        spread = PRICES[t1] - PRICES[t2]
        halflife = compute_half_life(spread)

        pair_id = f"{t1}-{t2}"
        status = "Strong" if row["pvalue"] < 0.02 else "Moderate"

        tags = []
        if abs(corr) > 0.9:
            tags.append("Highly Correlated")
        if halflife and halflife < 20:
            tags.append("Fast Reversion")
        elif halflife and halflife < 60:
            tags.append("Slow Reversion")

        pairs.append(
            {
                "id": pair_id,
                "ticker1": t1,
                "ticker2": t2,
                "pvalue": float(row["pvalue"]),
                "score": float(row["score"]),
                "correlation": corr,
                "half_life": halflife,
                "status": status,
                "tags": tags,
            }
        )

    pairs = sorted(pairs, key=lambda x: x["pvalue"])
    return {"pairs": pairs}


@app.get("/api/pair/{pair_id}")
def get_pair_detail(pair_id: str):
    try:
        t1, t2 = pair_id.split("-")
    except ValueError:
        raise HTTPException(status_code=400, detail="pair_id must be like 'AAPL-MSFT'")

    if t1 not in PRICES.columns or t2 not in PRICES.columns:
        raise HTTPException(status_code=404, detail="Tickers not in universe")

    metrics, results_df, _, beta, _, _ = backtest_pair(
        PRICES, t1, t2, lookback=60, entry_z=2.0, exit_z=0.5
    )

    N = 500
    df = results_df.tail(N)
    times = [ts.isoformat() for ts in df.index]

    return {
        "pair": metrics["pair"],
        "beta": beta,
        "times": times,
        "spread": df["spread"].tolist(),
        "zscore": df["zscore"].tolist(),
        "equity": df["equity"].tolist(),
        "metrics": metrics,
    }


@app.post("/api/backtest")
def run_backtest(req: BacktestRequest):
    try:
        start_ts = pd.to_datetime(req.start_date) if req.start_date else None
        end_ts = pd.to_datetime(req.end_date) if req.end_date else None

        metrics, results_df, trades_df, _, _, _ = backtest_pair(
            PRICES,
            req.ticker1,
            req.ticker2,
            start=start_ts,
            end=end_ts,
            lookback=req.lookback,
            entry_z=req.entry_z,
            exit_z=req.exit_z,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    eq = results_df["equity"]

    return {
        "metrics": metrics,
        "equity_curve": [
            {"timestamp": ts.isoformat(), "equity": float(eq_val)}
            for ts, eq_val in eq.items()
        ],
        "trades": trades_df.to_dict(orient="records"),
    }
