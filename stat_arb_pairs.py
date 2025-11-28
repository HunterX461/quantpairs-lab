import pandas as pd
import numpy as np
import yfinance as yf
import matplotlib.pyplot as plt
import seaborn as sns
from statsmodels.tsa.stattools import coint
from datetime import datetime

# -----------------------------
# CONFIG
# -----------------------------
TICKERS = [
    "AAPL", "MSFT", "GOOG", "AMZN", "META",
    "NFLX", "TSLA", "NVDA", "JPM", "BAC",
]

START_DATE = "2015-01-01"
END_DATE = datetime.today().strftime("%Y-%m-%d")


# -----------------------------
# DATA DOWNLOAD
# -----------------------------
def download_price_data(tickers, start, end):
    print(f"[+] Downloading data from {start} to {end} for {len(tickers)} tickers...")

    # Force yfinance to keep OHLCV columns, including Adj Close
    data = yf.download(tickers, start=start, end=end, auto_adjust=False)

    # If multiple tickers, yfinance returns a MultiIndex columns (field, ticker)
    if isinstance(data.columns, pd.MultiIndex):
        # Select only the "Adj Close" level -> columns become tickers
        data = data["Adj Close"]
    else:
        # Single ticker case: keep as DataFrame
        data = data.to_frame(name="Adj Close")

    data = data.sort_index()
    # Clean: drop days where everything is NaN
    data = data.dropna(how="all")
    print(f"[+] Data shape: {data.shape}")
    return data


# -----------------------------
# BASIC CLEANING
# -----------------------------
def clean_price_data(prices: pd.DataFrame) -> pd.DataFrame:
    # Forward-fill then back-fill remaining gaps
    prices_ffill = prices.ffill().bfill()
    # Drop columns that are still all NaN (just in case)
    prices_ffill = prices_ffill.dropna(axis=1, how="all")
    return prices_ffill


# -----------------------------
# CORRELATION ANALYSIS
# -----------------------------
def plot_correlation_matrix(prices: pd.DataFrame, title: str = "Correlation Matrix"):
    returns = prices.pct_change().dropna()
    corr = returns.corr()

    plt.figure(figsize=(10, 8))
    sns.heatmap(corr, annot=True, fmt=".2f", square=True)
    plt.title(title)
    plt.tight_layout()
    plt.show()

    return corr


# -----------------------------
# COINTEGRATION SCAN
# -----------------------------
def find_cointegrated_pairs(prices: pd.DataFrame, pvalue_threshold: float = 0.05):
    """
    Run Engle-Granger cointegration test on all pairs.
    Return list of (ticker1, ticker2, pvalue, score).
    """
    tickers = prices.columns
    n = len(tickers)
    results = []

    print("[+] Running cointegration tests on all pairs...")
    for i in range(n):
        for j in range(i + 1, n):
            s1 = prices[tickers[i]]
            s2 = prices[tickers[j]]

            # Drop NaNs just in case
            df = pd.concat([s1, s2], axis=1).dropna()
            if df.shape[0] < 100:
                # too little data, skip
                continue

            score, pvalue, _ = coint(df.iloc[:, 0], df.iloc[:, 1])
            results.append((tickers[i], tickers[j], pvalue, score))

    # Convert to DataFrame
    res_df = pd.DataFrame(
        results,
        columns=["ticker1", "ticker2", "pvalue", "score"]
    ).sort_values("pvalue")

    # Filter by p-value
    good_pairs = res_df[res_df["pvalue"] < pvalue_threshold].reset_index(drop=True)

    print(f"[+] Total pairs tested: {len(results)}")
    print(f"[+] Cointegrated pairs found (p < {pvalue_threshold}): {len(good_pairs)}")
    return res_df, good_pairs


# -----------------------------
# MAIN PIPELINE
# -----------------------------
def main():
    # 1) Download
    prices_raw = download_price_data(TICKERS, START_DATE, END_DATE)

    # 2) Clean
    prices = clean_price_data(prices_raw)

    # 3) Save raw prices to CSV for future research
    prices.to_csv("prices_daily_adj_close.csv")
    print("[+] Saved cleaned prices to prices_daily_adj_close.csv")

    # 4) Correlation matrix
    corr = plot_correlation_matrix(prices, title="Daily Returns Correlation")

    # 5) Cointegration scan
    all_pairs, good_pairs = find_cointegrated_pairs(prices, pvalue_threshold=0.05)

    # 6) Save results
    all_pairs.to_csv("cointegration_all_pairs.csv", index=False)
    good_pairs.to_csv("cointegration_good_pairs.csv", index=False)
    print("[+] Saved cointegration results to cointegration_all_pairs.csv and cointegration_good_pairs.csv")

    # 7) Show top 10 best pairs on screen
    print("\n=== TOP 10 LOWEST P-VALUE PAIRS (Most Likely Cointegrated) ===")
    print(good_pairs.head(10))


if __name__ == "__main__":
    main()
