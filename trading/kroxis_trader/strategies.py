"""Entry rules from the two books, as testable code.

Mark Minervini - "Trade Like a Stock Market Wizard" (SEPA):
  Trend Template (all 8 must hold):
    1. Price above the 150-day and 200-day moving averages
    2. 150-day above 200-day
    3. 200-day rising for at least 1 month (22 trading days)
    4. 50-day above the 150-day and 200-day
    5. Price above the 50-day
    6. Price at least 30% above its 52-week low
    7. Price within 25% of its 52-week high
    8. Relative strength rating >= 70
  Entry: breakout from a volatility contraction pattern (VCP) - the
  price ranges get tighter from left to right, volume dries up in the
  last contraction, and the stock clears the pivot (high of the last
  contraction) on above-average volume.

William O'Neil - "How to Make Money in Stocks" (CAN SLIM):
  Only the price/volume parts can be tested without point-in-time
  fundamentals: N (new highs from a proper base), S/I (liquidity),
  L (leader: RS >= 80) and M (market in a confirmed uptrend).
  Entry: breakout above the pivot of a base of at least 7 weeks with
  depth <= 33%, on volume at least 50% above the 50-day average, bought
  no more than 5% above the pivot.
  C and A (earnings growth) need historical earnings data and are NOT
  included in this test.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd

from . import indicators as ind
from .data import Panel
from .engine import Market


@dataclass
class Features:
    mkt: Market
    close: pd.DataFrame
    sma50: pd.DataFrame
    sma150: pd.DataFrame
    sma200: pd.DataFrame
    hi52: pd.DataFrame
    lo52: pd.DataFrame
    avgvol50: pd.DataFrame
    rs: pd.DataFrame
    liquid: pd.DataFrame
    raw_close: pd.DataFrame
    regime: dict


def build_features(panel: Panel, stocks: list[str], min_price: float = 10.0,
                   min_dollar_vol: float = 10e6) -> Features:
    p = panel.subset(stocks)
    c, h, l, v = p.close, p.high, p.low, p.volume
    sma50, sma150, sma200 = ind.sma(c, 50), ind.sma(c, 150), ind.sma(c, 200)
    avgvol50 = v.rolling(50, min_periods=50).mean()
    dollar_vol = (p.raw_close * v).rolling(50, min_periods=50).mean()
    liquid = (p.raw_close >= min_price) & (dollar_vol >= min_dollar_vol)
    rs = ind.rs_rating(c, universe_mask=c.notna())
    atr14 = ind.atr(h, l, c, 14)
    spy_c, spy_v = panel.close["SPY"], panel.volume["SPY"]
    regime = {m: ind.market_regime(spy_c, spy_v, m).reindex(c.index).fillna(False).values
              for m in ("oneil", "trend200", "none")}
    mkt = Market(c.index, list(c.columns), p.open.values, h.values, l.values, c.values,
                 v.values, sma50.values, avgvol50.values, atr14.values)
    return Features(mkt, c, sma50, sma150, sma200,
                    h.rolling(252, min_periods=200).max(),
                    l.rolling(252, min_periods=200).min(),
                    avgvol50, rs, liquid, p.raw_close, regime)


def trend_template(f: Features, rs_min: float = 70) -> pd.DataFrame:
    c = f.close
    return ((c > f.sma150) & (c > f.sma200)
            & (f.sma150 > f.sma200)
            & (f.sma200 > f.sma200.shift(22))
            & (f.sma50 > f.sma150) & (f.sma50 > f.sma200)
            & (c > f.sma50)
            & (c >= 1.30 * f.lo52)
            & (c >= 0.75 * f.hi52)
            & (f.rs >= rs_min))


def _pack(entry: pd.DataFrame, stop_ref: pd.DataFrame, pivot: pd.DataFrame,
          rank: pd.DataFrame) -> dict:
    return {"entry": entry.fillna(False).values.astype(bool),
            "stop_ref": stop_ref.values, "pivot": pivot.values,
            "rank": rank.fillna(0).values}


def minervini_signals(f: Features, regime: str = "trend200", vol_mult: float = 1.4,
                      rs_min: float = 70) -> dict:
    m = f.mkt
    hi = pd.DataFrame(m.h, index=f.close.index, columns=f.close.columns)
    lo = pd.DataFrame(m.l, index=f.close.index, columns=f.close.columns)
    vol = pd.DataFrame(m.v, index=f.close.index, columns=f.close.columns)
    hh50, _, d50 = ind.base_stats(hi, lo, 50)    # whole base (~10 weeks)
    _, _, d20 = ind.base_stats(hi, lo, 20)       # middle contraction
    hh10, ll10, d10 = ind.base_stats(hi, lo, 10)  # last contraction (pivot)
    vol10 = vol.shift(1).rolling(10).mean()
    avgv = f.avgvol50.shift(1)
    setup = ((d50 <= 0.35) & (d20 < d50) & (d10 < d20) & (d10 <= 0.10)
             & (d10 <= 0.6 * d50)            # range contracted by 40%+
             & (vol10 < avgv)                # volume dry-up
             & (hh10 >= 0.85 * hh50))        # pivot near the top of the base
    c = f.close
    breakout = (c > hh10) & (vol >= vol_mult * avgv) & (c <= 1.05 * hh10)
    entry = (setup & breakout & trend_template(f, rs_min) & f.liquid)
    entry = entry & pd.DataFrame(np.repeat(f.regime[regime][:, None], c.shape[1], 1),
                                 index=c.index, columns=c.columns)
    return _pack(entry, ll10, hh10, f.rs)


def oneil_signals(f: Features, regime: str = "oneil", vol_mult: float = 1.5,
                  rs_min: float = 80, base_days: int = 35, max_depth: float = 0.33,
                  min_price: float = 15.0) -> dict:
    m = f.mkt
    hi = pd.DataFrame(m.h, index=f.close.index, columns=f.close.columns)
    lo = pd.DataFrame(m.l, index=f.close.index, columns=f.close.columns)
    vol = pd.DataFrame(m.v, index=f.close.index, columns=f.close.columns)
    pivot, base_low, depth = ind.base_stats(hi, lo, base_days)
    avgv = f.avgvol50.shift(1)
    c = f.close
    entry = ((depth <= max_depth)
             & (c > pivot) & (c <= 1.05 * pivot)          # breakout, in buy zone
             & (vol >= vol_mult * avgv)                    # volume +50%
             & (c >= 0.95 * f.hi52)                        # N: at/near new highs
             & (c > f.sma200) & (f.sma200 > f.sma200.shift(22))
             & (f.rs >= rs_min)                            # L: leader
             & f.liquid & (f.raw_close >= min_price))
    entry = entry & pd.DataFrame(np.repeat(f.regime[regime][:, None], c.shape[1], 1),
                                 index=c.index, columns=c.columns)
    return _pack(entry, base_low, pivot, f.rs)


def random_signals(f: Features, n: int, seed: int, regime: str = "none",
                   start_idx: int = 252) -> dict:
    """Random entries in liquid stocks: the control group. Same exits and
    costs are applied, so any edge of the real strategy shows up as a
    difference against this baseline."""
    rng = np.random.default_rng(seed)
    elig = f.liquid.values.copy()
    elig[:start_idx] = False
    elig &= f.regime[regime][:, None]
    elig[-2:] = False
    ii, jj = np.nonzero(elig)
    pick = rng.choice(len(ii), size=min(n, len(ii)), replace=False)
    entry = np.zeros_like(elig)
    entry[ii[pick], jj[pick]] = True
    hi = pd.DataFrame(f.mkt.h, index=f.close.index, columns=f.close.columns)
    lo = pd.DataFrame(f.mkt.l, index=f.close.index, columns=f.close.columns)
    hh10, ll10, _ = ind.base_stats(hi, lo, 10)
    return {"entry": entry, "stop_ref": ll10.values,
            "pivot": np.full(entry.shape, np.nan), "rank": f.rs.fillna(0).values}
