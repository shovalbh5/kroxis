"""Build the price cache used by the backtests.

Data source: the public brownbear repository (daily OHLCV from Yahoo
Finance for S&P 500 / 400 / 600 members and major ETFs, 2019 onwards).

    git clone --depth 1 --filter=blob:none --sparse https://github.com/fja05680/brownbear.git
    cd brownbear && git sparse-checkout set symbol-cache universe
    python scripts/build_cache.py --src /path/to/brownbear
"""
import argparse
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from kroxis_trader.data import INDEX_SYMBOLS, load_panel, read_universe, save_panel  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("--src", required=True, help="path to the brownbear checkout")
ap.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "..", "data", "panel.parquet"))
a = ap.parse_args()

uni = read_universe([os.path.join(a.src, "universe", g) for g in
                     ("sp500-galaxy", "sp400-galaxy", "sp600-galaxy")])
symbols = sorted(set(uni) | set(INDEX_SYMBOLS))
panel = load_panel(os.path.join(a.src, "symbol-cache"), symbols, sectors=uni)
save_panel(panel, a.out)
stocks = [s for s in panel.symbols if s in uni]
print(f"saved {a.out}: {len(panel.dates)} days {panel.dates[0].date()}..{panel.dates[-1].date()}, "
      f"{len(stocks)} stocks + {len(panel.symbols) - len(stocks)} index ETFs")
