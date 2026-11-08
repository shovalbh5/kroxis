"""Win-probability model for book signals.

For every historical signal we record what was measurable at the close of
the signal day (relative strength, breakout volume, base depth, distance
from the 52-week high, volatility, market state ...) and whether the trade
that followed ended in profit. A model learns which combinations won more
often. It gives a probability, not a certainty: it is checked on years it
never saw during training, and its calibration table shows how far its
numbers can be trusted.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from . import engine as en
from . import indicators as ind
from . import metrics as me
from .strategies import Features

STOCK_FEATURES = [
    "rs", "vol_ratio", "close_vs_pivot", "range_pos", "gap", "ext50", "ext200",
    "slope50", "slope200", "from_high", "from_low", "atr_pct", "d50", "d20", "d10",
    "depth35", "vol_dry", "ret20", "ret60", "log_dollar_vol",
]
MARKET_FEATURES = ["spy_ret20", "spy_ext50", "spy_ext200", "dist_days",
                   "breadth50", "new_high_share", "signals_today"]
FEATURES = STOCK_FEATURES + MARKET_FEATURES + ["is_oneil"]
# Breakout-day facts that are unknown before a stock breaks out. For
# watchlist stocks they are filled with the typical (median) breakout value.
BREAKOUT_ONLY = ["vol_ratio", "close_vs_pivot", "range_pos", "gap"]


def feature_arrays(f: Features, spy_close: pd.Series, spy_volume: pd.Series) -> dict:
    """Date x symbol arrays of stock features, plus per-day market features."""
    m = f.mkt
    idx, cols = f.close.index, f.close.columns
    df = lambda a: pd.DataFrame(a, index=idx, columns=cols)  # noqa: E731
    c, h, l, o, v = f.close, df(m.h), df(m.l), df(m.o), df(m.v)
    avgv_prev = f.avgvol50.shift(1)
    hh10, _, d10 = ind.base_stats(h, l, 10)
    _, _, d20 = ind.base_stats(h, l, 20)
    _, _, d50 = ind.base_stats(h, l, 50)
    _, _, depth35 = ind.base_stats(h, l, 35)
    rng = (h - l).replace(0, np.nan)
    with np.errstate(all="ignore"):
        out = {
            "rs": f.rs.values,
            "vol_ratio": (v / avgv_prev).values,
            "close_vs_pivot": c.values / hh10.values - 1,   # replaced per strategy
            "range_pos": ((c - l) / rng).values,
            "gap": (o / c.shift(1) - 1).values,
            "ext50": (c / f.sma50 - 1).values,
            "ext200": (c / f.sma200 - 1).values,
            "slope50": (f.sma50 / f.sma50.shift(10) - 1).values,
            "slope200": (f.sma200 / f.sma200.shift(22) - 1).values,
            "from_high": (c / f.hi52 - 1).values,
            "from_low": (c / f.lo52 - 1).values,
            "atr_pct": m.atr14 / c.values,
            "d50": d50.values, "d20": d20.values, "d10": d10.values,
            "depth35": depth35.values,
            "vol_dry": (v.shift(1).rolling(10).mean() / avgv_prev).values,
            "ret20": (c / c.shift(20) - 1).values,
            "ret60": (c / c.shift(60) - 1).values,
            "log_dollar_vol": np.log((f.raw_close * v).rolling(50).mean()).values,
        }
    spy = spy_close.reindex(idx)
    sv = spy_volume.reindex(idx)
    liquid = f.liquid.values
    above50 = np.where(liquid, (c > f.sma50).values, np.nan)
    at_high = np.where(liquid, (c >= f.hi52 * 0.999).values, np.nan)
    with np.errstate(all="ignore"):
        market = {
            "spy_ret20": (spy / spy.shift(20) - 1).values,
            "spy_ext50": (spy / spy.rolling(50).mean() - 1).values,
            "spy_ext200": (spy / spy.rolling(200).mean() - 1).values,
            "dist_days": ind.distribution_days(spy, sv).values,
            "breadth50": np.nanmean(above50, axis=1),
            "new_high_share": np.nanmean(at_high, axis=1),
        }
    return {"stock": out, "market": market}


def signal_rows(fa: dict, f: Features, trades: list, strategy: str,
                signals_today: np.ndarray, pivot: np.ndarray) -> pd.DataFrame:
    """One row per traded signal: features at the signal day + outcome."""
    m = f.mkt
    sym_idx = {s: k for k, s in enumerate(m.symbols)}
    rows = []
    for t in trades:
        i, j = t.entry_idx - 1, sym_idx[t.symbol]
        r = {k: fa["stock"][k][i, j] for k in STOCK_FEATURES}
        r["close_vs_pivot"] = m.c[i, j] / pivot[i, j] - 1
        r.update({k: fa["market"][k][i] for k in MARKET_FEATURES if k != "signals_today"})
        r["signals_today"] = signals_today[i]
        r["is_oneil"] = 1.0 if strategy == "oneil" else 0.0
        r.update({"date": m.dates[i], "symbol": t.symbol, "strategy": strategy,
                  "ret": t.ret, "r": t.r_multiple, "days": t.exit_idx - t.entry_idx,
                  "reason": t.reason, "win": int(t.ret > 0)})
        rows.append(r)
    return pd.DataFrame(rows)


def build_dataset(f: Features, panel, presets: dict, start_idx: int,
                  cost: float = 0.001, name: str = "") -> pd.DataFrame:
    sigs = {k: p["signals"](f) for k, p in presets.items()}
    signals_today = sum(s["entry"].sum(axis=1) for s in sigs.values()).astype(float)
    fa = feature_arrays(f, panel.close["SPY"], panel.volume["SPY"])
    frames = []
    for k, p in presets.items():
        trades = en.simulate_signals(f.mkt, sigs[k], p["rules"], cost=cost, start_idx=start_idx)
        frames.append(signal_rows(fa, f, trades, k, signals_today, sigs[k]["pivot"]))
    out = pd.concat(frames, ignore_index=True)
    out["dataset"] = name
    return out


def make_model(kind: str = "gbm"):
    from sklearn.ensemble import HistGradientBoostingClassifier
    from sklearn.impute import SimpleImputer
    from sklearn.linear_model import LogisticRegression
    from sklearn.pipeline import make_pipeline
    from sklearn.preprocessing import StandardScaler
    if kind == "logit":
        return make_pipeline(SimpleImputer(strategy="median"), StandardScaler(),
                             LogisticRegression(C=0.1, max_iter=2000))
    return HistGradientBoostingClassifier(max_depth=3, learning_rate=0.03, max_iter=300,
                                          min_samples_leaf=200, l2_regularization=1.0,
                                          random_state=0)


def evaluate(y: np.ndarray, p: np.ndarray, ret: np.ndarray, rr: np.ndarray,
             base_rate: float) -> dict:
    from sklearn.metrics import brier_score_loss, roc_auc_score
    brier = brier_score_loss(y, p)
    brier_base = brier_score_loss(y, np.full_like(p, base_rate))
    q = pd.qcut(p, 5, labels=False, duplicates="drop")
    buckets = []
    for b in sorted(np.unique(q)):
        mask = q == b
        lo, hi = me.wilson_interval(int(y[mask].sum()), int(mask.sum()))
        buckets.append({"bucket": int(b) + 1, "n": int(mask.sum()),
                        "predicted": float(p[mask].mean()),
                        "actual_win_rate": float(y[mask].mean()),
                        "actual_ci95": (lo, hi),
                        "avg_return": float(ret[mask].mean()),
                        "avg_r": float(np.nanmean(rr[mask])),
                        "p_min": float(p[mask].min()), "p_max": float(p[mask].max())})
    return {"n": int(len(y)), "win_rate": float(y.mean()), "auc": float(roc_auc_score(y, p)),
            "brier": float(brier), "brier_baseline": float(brier_base),
            "brier_skill": float(1 - brier / brier_base), "quintiles": buckets}


def cell_features(fa: dict, f: Features, ii: np.ndarray, jj: np.ndarray, strategy: str,
                  signals_today: np.ndarray, pivot: np.ndarray) -> pd.DataFrame:
    """Feature rows for arbitrary (day, stock) cells - used for scoring."""
    d = {k: fa["stock"][k][ii, jj] for k in STOCK_FEATURES}
    with np.errstate(all="ignore"):
        d["close_vs_pivot"] = f.mkt.c[ii, jj] / pivot[ii, jj] - 1
    for k in MARKET_FEATURES:
        d[k] = signals_today[ii] if k == "signals_today" else fa["market"][k][ii]
    d["is_oneil"] = np.full(len(ii), 1.0 if strategy == "oneil" else 0.0)
    return pd.DataFrame(d)[FEATURES]
