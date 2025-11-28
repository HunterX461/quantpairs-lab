# QuantPairs Lab – Statistical Arbitrage Research Platform

**Author:** Tabrez (HunterX461)  
**Stack:** Python (FastAPI, pandas, statsmodels), React + TypeScript + Tailwind, Vite

QuantPairs Lab is a **full-stack quantitative research platform** for **market-neutral statistical arbitrage (pairs trading)**.

It ingests historical equity data, detects **cointegrated pairs**, and runs **mean-reversion backtests** behind a clean web interface that looks like an internal tool at a quant fund.

---

## Features

### 🔢 Data & Research Engine (Backend)

- Downloads multi-year OHLC data using `yfinance`
- Cleans and stores prices in `prices_daily_adj_close.csv`
- Scans all stock pairs for **cointegration** using the Engle–Granger test
- Saves:
  - `cointegration_all_pairs.csv`
  - `cointegration_good_pairs.csv`
- Implements a **mean-reversion pairs trading strategy**:
  - OLS hedge ratio estimation
  - Rolling z-score of the spread
  - Entry / exit based on z-score thresholds
  - Market-neutral long-spread / short-spread positions
- Computes performance metrics:
  - Cumulative return
  - Annualized return
  - Sharpe ratio
  - Max drawdown
  - Win rate
  - Average holding period (bars held)
- Exposes everything via a **FastAPI** backend:

  - `GET /api/universe` – available tickers & last date
  - `GET /api/pairs` – cointegrated pairs with p-value, correlation, half-life
  - `GET /api/pair/{pair_id}` – spread / z-score / equity curve for a specific pair
  - `POST /api/backtest` – run parametric backtests for a pair

---

### 📊 Frontend – Quant Dashboard

Frontend lives in [`quant/`](./quant) and is built with:

- React + TypeScript
- Tailwind CSS
- Vite

Pages:

- **Dashboard**
  - Universe size, cointegrated pairs count
  - Sample portfolio equity curve
  - Top pairs table with status badges

- **Pairs Explorer**
  - Table of cointegrated pairs with:
    - Tickers
    - Correlation
    - p-value
    - Estimated half-life
    - Tags (“Highly Correlated”, “Fast Reversion”, etc.)
  - Pair detail view:
    - Spread chart
    - Z-score behaviour
    - Summary text + mean-reversion “score”
    - “Send to Backtest” flow

- **Backtest Studio**
  - Configure:
    - Pair
    - Date range
    - Lookback window
    - Entry / exit z-score thresholds
  - Runs a real backtest via `/api/backtest`
  - Shows:
    - Equity curve
    - Key metrics (Sharpe, max drawdown, win rate, etc.)
    - Trade list (direction, PnL, entry/exit z-score)

- **Trade Simulator** (placeholder)
- **Settings** (theme + basic user preferences)

The UI originally used mocked data; it is now wired to the **live backend** while preserving the same component API.

---

## Architecture

```text
Data Layer
  └── stat_arb_pairs.py
        • Download & clean OHLC data
        • Compute correlations & cointegration
        • Persist CSV data

Research / Backtest Engine
  └── backtest_stat_arb.py
        • OLS hedge ratio
        • Rolling z-score of spread
        • Entry/exit logic
        • Performance metrics
        • Equity & trades CSV export

API Layer
  └── api_server.py (FastAPI)
        • /api/universe
        • /api/pairs
        • /api/pair/{id}
        • /api/backtest

Frontend
  └── quant/
        • React + TS + Tailwind dashboard
        • Uses mockApi wrapper wired to FastAPI
