"""Check that the paper-trading account trades exactly like the backtest.

Runs the demo account one day at a time (saving and reloading its JSON
state every day) and compares trades and equity with backtest_portfolio().
Needs data/panel.parquet (see README_HE.md).

    python tests/check_paper_vs_backtest.py
"""
import json
import os
import sys

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from kroxis_trader import engine as en               # noqa: E402
from kroxis_trader import paper                      # noqa: E402
from kroxis_trader import strategies as st           # noqa: E402
from kroxis_trader.data import EXCLUDE, INDEX_SYMBOLS, load_saved_panel  # noqa: E402
from kroxis_trader.presets import KROXIS             # noqa: E402

ROOT = os.path.join(os.path.dirname(__file__), "..")
p = load_saved_panel(os.path.join(ROOT, "data", "panel.parquet"))
stocks = [s for s in p.symbols if s not in INDEX_SYMBOLS and s not in EXCLUDE and p.sectors.get(s)]
f = st.build_features(p, stocks)
m = f.mkt
start = int(np.searchsorted(m.dates, pd.Timestamp("2025-01-02")))
cfg = en.PortfolioConfig()
ok = True
for k, preset in KROXIS.items():
    sig = preset["signals"](f)
    bt = en.backtest_portfolio(m, sig, preset["rules"], cfg, start_idx=start)
    state = paper.new_state(k, k, "kroxis", m.dates[start], cfg.initial_equity, 1.0)
    state["pending"] = paper._pending_from_row(m, sig, start)
    for upto in range(start + 1, len(m.dates)):
        state = json.loads(json.dumps(state, default=float))      # save / reload every day
        paper.advance(state, m, sig, preset["rules"], cfg, upto_idx=upto)
    key = lambda t: (t["symbol"], t["entry_date"], t["exit_date"], t["reason"], round(t["exit"], 6))  # noqa: E731
    paper_trades = sorted(key(t) for t in state["trades"])
    bt_trades = sorted(key({"symbol": t.symbol, "entry_date": str(m.dates[t.entry_idx].date()),
                            "exit_date": str(m.dates[t.exit_idx].date()), "reason": t.reason,
                            "exit": t.exit_price}) for t in bt.trades if t.reason != "end_of_data")
    eq_paper = pd.Series({pd.Timestamp(r["date"]): r["equity"] for r in state["equity_history"]})
    max_eq_diff = float((eq_paper - bt.equity.reindex(eq_paper.index)).abs().max())
    same = paper_trades == bt_trades and max_eq_diff < 1e-6
    ok &= same
    print(f"{k}: closed trades paper={len(paper_trades)} backtest={len(bt_trades)} "
          f"open={len(state['positions'])} max equity diff=${max_eq_diff:.6f} -> {'MATCH' if same else 'DIFFERENT'}")
sys.exit(0 if ok else 1)
