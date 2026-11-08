"""Indicators computed on wide (date x symbol) tables.

Every value at row t uses only data up to and including day t, so a
signal formed at the close of day t can be traded at the open of t+1.
"""
from __future__ import annotations

import numpy as np
import pandas as pd


def sma(df: pd.DataFrame, n: int) -> pd.DataFrame:
    return df.rolling(n, min_periods=n).mean()


def atr(high, low, close, n: int = 14) -> pd.DataFrame:
    prev = close.shift(1)
    tr = np.fmax(high - low, np.fmax((high - prev).abs(), (low - prev).abs()))
    # Wilder smoothing
    return tr.ewm(alpha=1 / n, adjust=False, min_periods=n).mean()


def rs_rating(close: pd.DataFrame, universe_mask: pd.DataFrame | None = None) -> pd.DataFrame:
    """IBD-style relative strength rating (1-99).

    Weighted 12-month performance, with the latest quarter counted twice:
    0.4*ROC(63) + 0.2*ROC(126) + 0.2*ROC(189) + 0.2*ROC(252),
    then ranked as a percentile across all stocks on each day.
    """
    score = (0.4 * close.pct_change(63, fill_method=None)
             + 0.2 * close.pct_change(126, fill_method=None)
             + 0.2 * close.pct_change(189, fill_method=None)
             + 0.2 * close.pct_change(252, fill_method=None))
    if universe_mask is not None:
        score = score.where(universe_mask)
    pct = score.rank(axis=1, pct=True)
    return (pct * 98 + 1).round()


def distribution_days(close: pd.Series, volume: pd.Series, window: int = 25,
                      min_drop: float = -0.002) -> pd.Series:
    """O'Neil distribution days: index falls >= 0.2% on higher volume
    than the day before. Returns the count over the last `window` sessions."""
    ret = close.pct_change(fill_method=None)
    dist = ((ret <= min_drop) & (volume > volume.shift(1))).values
    c = close.values
    active: list[int] = []   # indexes of distribution days still counting
    out = np.zeros(len(c))
    for i in range(len(c)):
        if dist[i]:
            active.append(i)
        # a distribution day expires after `window` sessions, or once the
        # index closes 5% or more above that day's close
        active = [k for k in active if i - k < window and c[i] < c[k] * 1.05]
        out[i] = len(active)
    return pd.Series(out, index=close.index)


def market_regime(spy_close: pd.Series, spy_volume: pd.Series,
                  mode: str = "oneil") -> pd.Series:
    """True on days when new buys are allowed.

    mode="oneil": SPY above its 50-day average and fewer than 6 active
                  distribution days (IBD's current "5-6 in 25 sessions"
                  warning level; SPY ETF volume stands in for index volume).
    mode="trend200": SPY above its 200-day average.
    mode="none": always allowed.
    """
    if mode == "none":
        return pd.Series(True, index=spy_close.index)
    if mode == "trend200":
        return spy_close > spy_close.rolling(200).mean()
    if mode == "oneil":
        above50 = spy_close > spy_close.rolling(50).mean()
        dd = distribution_days(spy_close, spy_volume)
        return above50 & (dd < 6)
    raise ValueError(mode)


def base_stats(high: pd.DataFrame, low: pd.DataFrame, n: int):
    """Highest high and lowest low of the n days *before* today, and the
    depth of that range as a fraction of the high."""
    hh = high.shift(1).rolling(n, min_periods=n).max()
    ll = low.shift(1).rolling(n, min_periods=n).min()
    depth = (hh - ll) / hh
    return hh, ll, depth
