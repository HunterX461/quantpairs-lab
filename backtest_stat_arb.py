import pandas as pd
import numpy as np
from dataclasses import dataclass
from typing import List, Optional

# -----------------------------
# CONFIG
# -----------------------------
PRICES_CSV = "prices_daily_adj_close.csv"
COINTEGRATION_CSV = "cointegration_good_pairs.csv"

LOOKBACK = 60
ENTRY_Z = 2.0
EXIT_Z = 0.5

ANNUAL_TRADING_DAYS = 252


@dataclass
class Trade:
    direction: str  # "long_spread" or "short_spread"
    entry_date: pd.Timestamp
    exit_date: Optional[pd.Timestamp]
    entry_z: float
    exit_z: Optional[float]
    pnl: float
    return_pct: float
    bars_held: int


def pick_top_pair(path: str = COINTEGRATION_CSV):
    df = pd.read_csv(path)
    if df.empty:
        raise ValueError("No cointegrated pairs found in CSV.")
    row = df.iloc[0]
    return row["ticker1"], row["ticker2"]


def load_prices(path: str = PRICES_CSV):
    prices = pd.read_csv(path, index_col=0, parse_dates=True)
    return prices


def compute_hedge_ratio(s1: pd.Series, s2: pd.Series) -> float:
    # OLS s1 ~ beta * s2
    x = s2.values
    y = s1.values
    beta = np.polyfit(x, y, 1)[0]
    return beta


def backtest_pair(
    prices: pd.DataFrame,
    t1: str,
    t2: str,
    lookback: int = LOOKBACK,
    entry_z: float = ENTRY_Z,
    exit_z: float = EXIT_Z,
):
    s1 = prices[t1]
    s2 = prices[t2]
    beta = compute_hedge_ratio(s1, s2)

    spread = s1 - beta * s2
    spread_mean = spread.rolling(lookback).mean()
    spread_std = spread.rolling(lookback).std()
    zscore = (spread - spread_mean) / spread_std

    ret1 = s1.pct_change()
    ret2 = s2.pct_change()

    # Strategy state
    pos = 0  # 0: flat, 1: long spread, -1: short spread
    pos_history = []
    trade_list: List[Trade] = []
    current_trade_index = None
    trade_entry_z = None
    trade_entry_date = None

    strat_ret = []

    dates = prices.index

    for i in range(len(dates)):
        date = dates[i]
        if i == 0:
            pos_history.append(0)
            strat_ret.append(0.0)
            continue

        z = zscore.iloc[i]
        # carry position from previous day by default
        prev_pos = pos
        pos = prev_pos

        # entry / exit rules
        if np.isnan(z):
            # can't trade without z-score
            pass
        else:
            if pos == 0:
                # flat -> check entries
                if z > entry_z:
                    pos = -1  # short spread: short s1, long s2
                    trade_entry_z = float(z)
                    trade_entry_date = date
                    current_trade_index = len(strat_ret)
                elif z < -entry_z:
                    pos = 1  # long spread: long s1, short s2
                    trade_entry_z = float(z)
                    trade_entry_date = date
                    current_trade_index = len(strat_ret)
            else:
                # in a trade -> check exit
                if abs(z) < exit_z:
                    # exit trade
                    trade_pnl = float(np.nansum(strat_ret[current_trade_index:]))
                    trade_ret_pct = trade_pnl  # returns are already pct
                    bars_held = i - current_trade_index
                    trade = Trade(
                        direction="long_spread" if prev_pos == 1 else "short_spread",
                        entry_date=trade_entry_date,
                        exit_date=date,
                        entry_z=trade_entry_z,
                        exit_z=float(z),
                        pnl=trade_pnl,
                        return_pct=trade_ret_pct,
                        bars_held=bars_held,
                    )
                    trade_list.append(trade)
                    # flat after closing
                    pos = 0
                    current_trade_index = None
                    trade_entry_z = None
                    trade_entry_date = None

        # compute strategy return for this day based on position HELD over this day
        r1 = ret1.iloc[i]
        r2 = ret2.iloc[i]
        if np.isnan(r1) or np.isnan(r2):
            r_strategy = 0.0
        else:
            # long_spread: long s1, short beta*s2 -> ret ≈ r1 - beta*r2
            # short_spread: -(r1 - beta*r2)
            base = r1 - beta * r2
            r_strategy = pos * base

        strat_ret.append(float(r_strategy))
        pos_history.append(pos)

    strat_ret_series = pd.Series(strat_ret, index=dates)
    pos_series = pd.Series(pos_history, index=dates)

    # Equity curve (starting at 1.0)
    equity = (1 + strat_ret_series.fillna(0)).cumprod()

    # Metrics
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

    # Trade stats
    if trade_list:
        wins = [1 for t in trade_list if t.return_pct > 0]
        win_rate = len(wins) / len(trade_list)
        avg_bars = np.mean([t.bars_held for t in trade_list])
    else:
        win_rate = np.nan
        avg_bars = np.nan

    metrics = {
        "pair": f"{t1}/{t2}",
        "beta": beta,
        "lookback": lookback,
        "entry_z": entry_z,
        "exit_z": exit_z,
        "cumulative_return": cum_return,
        "annualized_return": ann_return,
        "sharpe_ratio": sharpe,
        "max_drawdown": max_dd,
        "num_trades": len(trade_list),
        "win_rate": win_rate,
        "avg_bars_held": avg_bars,
    }

    # Pack results into DataFrames
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

    return metrics, results_df, trades_df


def main():
    print("[+] Loading prices and cointegration results...")
    prices = load_prices()
    t1, t2 = pick_top_pair()
    print(f"[+] Using top cointegrated pair: {t1} / {t2}")

    metrics, results_df, trades_df = backtest_pair(prices, t1, t2)

    eq_path = f"backtest_{t1}_{t2}_equity.csv"
    tr_path = f"backtest_{t1}_{t2}_trades.csv"

    results_df.to_csv(eq_path)
    trades_df.to_csv(tr_path, index=False)

    print("[+] Backtest completed.")
    print(f"[+] Saved equity & diagnostics to {eq_path}")
    print(f"[+] Saved trade list to {tr_path}")

    print("\n=== BACKTEST SUMMARY ===")
    for k, v in metrics.items():
        print(f"{k:20s}: {v}")


if __name__ == "__main__":
    main()
