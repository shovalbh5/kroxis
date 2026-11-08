"""Download current daily prices from Yahoo Finance (free, no account).

Only completed trading days are kept: if the market is still open (or the
day's data is not final yet), today's partial bar is dropped so signals are
always computed on a finished daily candle.
"""
from __future__ import annotations

import time

import numpy as np
import pandas as pd

from .data import Panel

NY = "America/New_York"


def last_complete_session(now: pd.Timestamp | None = None) -> pd.Timestamp:
    """Latest date whose daily bar is final (after 16:30 New York time)."""
    now = (now or pd.Timestamp.now(tz=NY)).tz_convert(NY)
    day = now.normalize().tz_localize(None)
    if now.hour * 60 + now.minute < 16 * 60 + 30:
        day -= pd.Timedelta(days=1)
    return day


def download(symbols: list[str], start: str, batch: int = 200,
             pause: float = 1.0) -> dict[str, pd.DataFrame]:
    import yfinance as yf
    out = {}
    for k in range(0, len(symbols), batch):
        chunk = symbols[k:k + batch]
        for attempt in range(3):
            try:
                df = yf.download(chunk, start=start, interval="1d", auto_adjust=False,
                                 actions=False, group_by="ticker", threads=True,
                                 progress=False)
                break
            except Exception:  # network hiccup / rate limit
                time.sleep(5 * (attempt + 1))
        else:
            continue
        if df is None or df.empty:
            continue
        if not isinstance(df.columns, pd.MultiIndex):     # single ticker
            df = pd.concat({chunk[0]: df}, axis=1)
        lv0 = set(df.columns.get_level_values(0))
        if "Close" in lv0 or "Adj Close" in lv0:           # (field, ticker) layout
            df = df.swaplevel(0, 1, axis=1)
        for sym in chunk:
            if sym not in set(df.columns.get_level_values(0)):
                continue
            d = df[sym].dropna(how="all")
            if len(d) and {"Open", "High", "Low", "Close", "Adj Close", "Volume"} <= set(d.columns):
                d.index = pd.to_datetime(d.index).tz_localize(None)
                out[sym] = d
        time.sleep(pause)
    return out


def panel_from_yahoo(frames: dict[str, pd.DataFrame], sectors: dict,
                     asof: pd.Timestamp | None = None) -> Panel:
    fields = {k: {} for k in ("open", "high", "low", "close", "volume", "raw_close")}
    for sym, df in frames.items():
        df = df.dropna(subset=["Open", "High", "Low", "Close", "Adj Close"])
        df = df[(df["Close"] > 0) & (df["Low"] > 0)]
        if asof is not None:
            df = df[df.index <= asof]
        if len(df) < 60:
            continue
        factor = df["Adj Close"] / df["Close"]
        fields["open"][sym] = df["Open"] * factor
        fields["high"][sym] = df["High"] * factor
        fields["low"][sym] = df["Low"] * factor
        fields["close"][sym] = df["Adj Close"]
        fields["volume"][sym] = df["Volume"].astype(float)
        fields["raw_close"][sym] = df["Close"]
    frames_ = {k: pd.DataFrame(v).sort_index() for k, v in fields.items()}
    idx = frames_["close"]["SPY"].dropna().index
    frames_ = {k: v.reindex(idx) for k, v in frames_.items()}
    hi = np.fmax(frames_["high"], np.fmax(frames_["open"], frames_["close"]))
    lo = np.fmin(frames_["low"], np.fmin(frames_["open"], frames_["close"]))
    return Panel(frames_["open"], hi, lo, frames_["close"], frames_["volume"],
                 frames_["raw_close"], sectors)
