"""Load daily price data into wide (date x symbol) tables.

Input: a folder of CSV files, one per symbol, with columns
Date, Adj Close, Close, High, Low, Open, Volume (yfinance format).

Prices are adjusted for splits and dividends using Adj Close / Close,
so percent moves are correct across corporate actions. The raw close is
kept separately for price filters such as "price above $10".
"""
from __future__ import annotations

import csv
import os
from dataclasses import dataclass

import numpy as np
import pandas as pd

INDEX_SYMBOLS = ["SPY", "QQQ", "IWM", "MDY", "RSP"]

# Tickers whose price history has broken jumps in the source data
# (pre-listing or pre-bankruptcy prices joined to the new stock).
EXCLUDE = ["IVT", "PECO", "INDV", "CHRD", "SEZL", "KNTK"]


@dataclass
class Panel:
    open: pd.DataFrame
    high: pd.DataFrame
    low: pd.DataFrame
    close: pd.DataFrame
    volume: pd.DataFrame
    raw_close: pd.DataFrame
    sectors: dict

    @property
    def dates(self) -> pd.DatetimeIndex:
        return self.close.index

    @property
    def symbols(self) -> list:
        return list(self.close.columns)

    def subset(self, symbols) -> "Panel":
        cols = [s for s in symbols if s in self.close.columns]
        return Panel(*(getattr(self, f)[cols] for f in
                       ("open", "high", "low", "close", "volume", "raw_close")),
                     sectors={s: self.sectors.get(s, "") for s in cols})


def read_universe(universe_dirs: list[str]) -> dict:
    """Read brownbear 'investment-options.csv' files -> {symbol: sector}."""
    out = {}
    for d in universe_dirs:
        path = os.path.join(d, "investment-options.csv")
        with open(path, newline="") as f:
            rows = [r for r in f if not r.startswith("#") and r.strip()]
        for row in csv.DictReader(rows):
            sym = row["Investment Option"].strip()
            out[sym] = row.get("Asset Class", "").replace("US Stocks:", "")
    return out


def _read_one(path: str) -> pd.DataFrame | None:
    df = pd.read_csv(path, parse_dates=["Date"])
    need = {"Date", "Adj Close", "Close", "High", "Low", "Open", "Volume"}
    if not need.issubset(df.columns) or df.empty:
        return None
    df = df.dropna(subset=["Close", "Adj Close", "High", "Low", "Open"])
    df = df[(df["Close"] > 0) & (df["Low"] > 0) & (df["High"] >= df["Low"])]
    df = df.drop_duplicates("Date").set_index("Date").sort_index()
    return df


def load_panel(csv_dir: str, symbols: list[str], sectors: dict | None = None,
               start: str | None = None, end: str | None = None) -> Panel:
    fields = {k: {} for k in ("open", "high", "low", "close", "volume", "raw_close")}
    for sym in symbols:
        path = os.path.join(csv_dir, f"{sym}.csv")
        if not os.path.exists(path):
            continue
        df = _read_one(path)
        if df is None or len(df) < 260:
            continue
        factor = df["Adj Close"] / df["Close"]
        fields["open"][sym] = df["Open"] * factor
        fields["high"][sym] = df["High"] * factor
        fields["low"][sym] = df["Low"] * factor
        fields["close"][sym] = df["Adj Close"]
        fields["volume"][sym] = df["Volume"].astype(float)
        fields["raw_close"][sym] = df["Close"]
    frames = {k: pd.DataFrame(v).sort_index() for k, v in fields.items()}
    # Use the trading calendar of SPY when present, else the union of dates.
    idx = frames["close"].index
    if "SPY" in frames["close"].columns:
        idx = frames["close"]["SPY"].dropna().index
    if start:
        idx = idx[idx >= pd.Timestamp(start)]
    if end:
        idx = idx[idx <= pd.Timestamp(end)]
    frames = {k: v.reindex(idx) for k, v in frames.items()}
    # Open/high/low must bracket the close; fix rare bad ticks.
    hi = np.fmax(frames["high"], np.fmax(frames["open"], frames["close"]))
    lo = np.fmin(frames["low"], np.fmin(frames["open"], frames["close"]))
    frames["high"], frames["low"] = hi, lo
    return Panel(frames["open"], frames["high"], frames["low"], frames["close"],
                 frames["volume"], frames["raw_close"], sectors or {})


def save_panel(panel: Panel, path: str) -> None:
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    long = pd.concat({f: getattr(panel, f) for f in
                      ("open", "high", "low", "close", "volume", "raw_close")},
                     axis=1)
    long.columns = [f"{a}|{b}" for a, b in long.columns]
    long.to_parquet(path)
    pd.Series(panel.sectors).to_csv(path + ".sectors.csv", header=False)


def load_saved_panel(path: str) -> Panel:
    long = pd.read_parquet(path)
    parts = {}
    for col in long.columns:
        field, sym = col.split("|", 1)
        parts.setdefault(field, {})[sym] = long[col]
    frames = {k: pd.DataFrame(v) for k, v in parts.items()}
    sec_path = path + ".sectors.csv"
    sec = {}
    if os.path.exists(sec_path) and os.path.getsize(sec_path) > 0:
        sec = pd.read_csv(sec_path, header=None, index_col=0,
                          keep_default_na=False).iloc[:, 0].to_dict()
    return Panel(frames["open"], frames["high"], frames["low"], frames["close"],
                 frames["volume"], frames["raw_close"], sec)


def load_panel_kaggle(stocks_dir: str, etf_dir: str, start: str, end: str,
                      min_end: str = "2017-10-01") -> Panel:
    """Load the Kaggle "Huge Stock Market Dataset" (Boris Marjanovic, 2017):
    one <ticker>.us.txt per stock, prices already adjusted for splits and
    dividends. Files that stop before `min_end` are skipped (truncated).

    Bad ticks (a one-day spike of +50% that reverses by a third or more the
    next day) are removed, and stocks with a one-day move above +300% or
    below -90% (usually two different securities joined) are dropped.
    """
    fields = {k: {} for k in ("open", "high", "low", "close", "volume")}
    for fn in sorted(os.listdir(stocks_dir)):
        if not fn.endswith(".us.txt"):
            continue
        try:
            df = pd.read_csv(os.path.join(stocks_dir, fn), parse_dates=["Date"],
                             on_bad_lines="skip")
        except Exception:
            continue
        if df.empty or df["Date"].max() < pd.Timestamp(min_end):
            continue
        df = df.dropna().drop_duplicates("Date").set_index("Date").sort_index()
        df = df[(df["Close"] > 0) & (df["Low"] > 0)]
        df = df.loc[start:end]
        if len(df) < 260:
            continue
        r = df["Close"].pct_change()
        spike = (r > 0.5) & (r.shift(-1) < -0.33)
        df = df[~spike]
        r = df["Close"].pct_change()
        if (r > 3.0).any() or (r < -0.9).any():
            continue
        sym = fn[:-7].upper().replace("-", ".")
        for k, col in (("open", "Open"), ("high", "High"), ("low", "Low"),
                       ("close", "Close"), ("volume", "Volume")):
            fields[k][sym] = df[col].astype(float)
    for etf in ("spy", "qqq", "iwm"):
        df = pd.read_csv(os.path.join(etf_dir, f"{etf}.us.txt"), parse_dates=["Date"])
        df = df.set_index("Date").sort_index().loc[start:end]
        for k, col in (("open", "Open"), ("high", "High"), ("low", "Low"),
                       ("close", "Close"), ("volume", "Volume")):
            fields[k][etf.upper()] = df[col].astype(float)
    frames = {k: pd.DataFrame(v).sort_index() for k, v in fields.items()}
    idx = frames["close"]["SPY"].dropna().index
    frames = {k: v.reindex(idx) for k, v in frames.items()}
    hi = np.fmax(frames["high"], np.fmax(frames["open"], frames["close"]))
    lo = np.fmin(frames["low"], np.fmin(frames["open"], frames["close"]))
    return Panel(frames["open"], hi, lo, frames["close"], frames["volume"],
                 frames["close"].copy(), {})
