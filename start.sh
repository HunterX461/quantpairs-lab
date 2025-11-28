#!/usr/bin/env bash
set -e

# optional: refresh data once if missing
if [ ! -f prices_daily_adj_close.csv ]; then
  echo "[+] No prices CSV found, rebuilding data..."
  python manage_data.py
fi

echo "[+] Starting API server..."
uvicorn api_server:app --host 0.0.0.0 --port ${PORT:-8000}
