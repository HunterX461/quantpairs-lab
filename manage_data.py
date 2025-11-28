from stat_arb_pairs import main as build_universe
from backtest_stat_arb import main as run_sample_backtest

if __name__ == "__main__":
    print("[+] Rebuilding universe & cointegration table...")
    build_universe()
    print("[+] Running sample backtest for sanity...")
    run_sample_backtest()
    print("[+] Data refresh complete.")

