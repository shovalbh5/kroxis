"""Checks on order fills using tiny hand-made price series.

Run:  python -m pytest -q tests   (or: python tests/test_engine.py)
"""
import os
import sys

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from kroxis_trader import engine as en          # noqa: E402
from kroxis_trader import metrics as me         # noqa: E402


def make_market(o, h, l, c, sma50=None, v=None):
    n = len(c)
    col = lambda x: np.asarray(x, float).reshape(n, 1)  # noqa: E731
    sma = col(sma50) if sma50 is not None else np.zeros((n, 1))
    vol = col(v) if v is not None else np.full((n, 1), 1e6)
    return en.Market(pd.bdate_range("2024-01-01", periods=n), ["X"], col(o), col(h), col(l),
                     col(c), vol, sma, np.full((n, 1), 1e6), np.full((n, 1), 2.0))


def sig_at(n, k, stop_ref=np.nan, pivot=np.nan):
    e = np.zeros((n, 1), bool)
    e[k] = True
    return {"entry": e, "stop_ref": np.full((n, 1), stop_ref),
            "pivot": np.full((n, 1), pivot), "rank": np.ones((n, 1))}


def test_buys_next_open_and_stops_at_stop_price():
    # signal on day 0, buy day 1 at 100, stop 8% = 92, day 3 trades down to 90
    o = [99, 100, 101, 98, 95]
    h = [100, 102, 102, 99, 96]
    l = [98, 99, 97, 90, 94]
    c = [100, 101, 98, 93, 95]
    m = make_market(o, h, l, c)
    t = en.simulate_trade(m, 0, 0, np.nan, en.ExitRules(stop_pct=0.08), 0.0, None)
    assert t.entry_idx == 1 and t.entry_price == 100
    assert t.exit_idx == 3 and abs(t.exit_price - 92) < 1e-9 and t.reason == "stop"


def test_gap_below_stop_fills_at_open():
    o = [99, 100, 101, 85]
    h = [100, 102, 102, 86]
    l = [98, 99, 97, 80]
    c = [100, 101, 98, 84]
    m = make_market(o, h, l, c)
    t = en.simulate_trade(m, 0, 0, np.nan, en.ExitRules(stop_pct=0.08), 0.0, None)
    assert t.exit_idx == 3 and t.exit_price == 85 and t.reason == "stop"


def test_target_and_costs():
    o = [99, 100, 105, 112]
    h = [100, 104, 121, 125]
    l = [98, 99, 104, 110]
    c = [100, 103, 118, 120]
    m = make_market(o, h, l, c)
    cost = 0.001
    t = en.simulate_trade(m, 0, 0, np.nan, en.ExitRules(stop_pct=0.08, target_pct=0.20), cost, None)
    assert t.reason == "target" and t.exit_idx == 2
    assert abs(t.entry_price - 100 * 1.001) < 1e-9
    assert abs(t.exit_price - 120 * 0.999) < 1e-9


def test_oneil_8_week_rule_holds_fast_winner():
    # +20% on day 3 (within 3 weeks) -> no target exit; held until the 50-day break
    n = 60
    c = np.linspace(100, 140, n)
    o, h, l = c - 0.5, c + 1, c - 1
    o[1] = 100
    h[3] = 121
    sma = np.full(n, 90.0)
    sma[50:] = 200.0   # close falls below the 50-day on day 50
    m = make_market(o, h, l, c, sma50=sma)
    rules = en.ExitRules(stop_pct=0.075, target_pct=0.20, oneil_8week=True)
    t = en.simulate_trade(m, 0, 0, np.nan, rules, 0.0, None)
    assert t.reason == "below_50dma"
    assert t.exit_idx == 51            # rule fires at day 50 close, fills next open
    assert t.exit_idx - t.entry_idx >= 40


def test_close_rule_exits_next_open():
    o = [99, 100, 101, 97, 96]
    h = [100, 102, 102, 98, 97]
    l = [98, 99, 96, 95, 94]
    c = [100, 101, 97, 96, 95]
    sma = [0, 0, 98, 98, 98]   # day 2 closes below the 50-day
    m = make_market(o, h, l, c, sma50=sma)
    t = en.simulate_trade(m, 0, 0, np.nan, en.ExitRules(stop_pct=0.08, trail_sma50=True), 0.0, None)
    assert t.reason == "below_50dma" and t.exit_idx == 3 and t.exit_price == 97


def test_structure_stop_is_capped():
    o = [99, 100, 100, 100]
    h = [100, 101, 101, 101]
    l = [98, 99, 99, 99]
    c = [100, 100, 100, 100]
    m = make_market(o, h, l, c)
    pos = en.Position(m, 0, 1, 100.0, 80.0, en.ExitRules(stop_mode="structure", stop_pct=0.08), 0.0)
    assert abs(pos.stop - 92) < 1e-9          # 20% below is too far: capped at 8%
    pos = en.Position(m, 0, 1, 100.0, 96.0, en.ExitRules(stop_mode="structure", stop_pct=0.08), 0.0)
    assert abs(pos.stop - 96 * 0.995) < 1e-9  # base low is closer: used


def test_portfolio_sizing_respects_risk():
    n = 10
    c = np.full(n, 100.0)
    m = make_market(c, c + 1, c - 1, c)
    sig = sig_at(n, 0, pivot=100)
    cfg = en.PortfolioConfig(initial_equity=100_000, risk_per_trade=0.01, max_position=0.5, cost=0.0)
    res = en.backtest_portfolio(m, sig, en.ExitRules(stop_pct=0.05), cfg)
    t = res.trades[0]
    # risk 1% of 100k = 1000 / (5 per share) = 200 shares = 20k position
    assert abs(t.shares - 200) < 1e-6


def test_wilson_interval():
    lo, hi = me.wilson_interval(50, 100)
    assert 0.40 < lo < 0.41 and 0.59 < hi < 0.60


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok", name)
