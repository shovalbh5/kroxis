"""Trade and portfolio simulation.

Timing (no look-ahead):
  * A signal is formed with data up to the close of day t.
  * The buy is filled at the open of day t+1 (plus costs).
  * Stops and profit targets fill intraday at their price, or at the open
    if the stock gaps through them. If a stop and a target are both
    touched on the same day, the stop is assumed to fill first.
  * Close-based exits (e.g. close below the 50-day average) are filled at
    the next day's open.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
import pandas as pd


@dataclass
class ExitRules:
    stop_mode: str = "pct"         # "pct", "atr" or "structure"
    stop_pct: float = 0.08         # max loss for "pct" (and the cap for "structure")
    stop_atr: float = 2.0          # ATR multiple for "atr"
    min_stop_pct: float = 0.0      # floor on stop distance (0 = none)
    target_pct: float | None = None  # take profit (O'Neil: 0.20)
    oneil_8week: bool = False      # +20% within 3 weeks -> hold 8 weeks
    breakeven_r: float | None = None  # move stop to entry after +N R
    trail_sma50: bool = False      # exit when close < 50-day average
    sma50_heavy_volume: bool = False  # ...only if volume > 1.5x average
    max_hold: int = 252            # trading days


@dataclass
class Market:
    """Numpy views of the panel for fast simulation."""
    dates: pd.DatetimeIndex
    symbols: list
    o: np.ndarray
    h: np.ndarray
    l: np.ndarray
    c: np.ndarray
    v: np.ndarray
    sma50: np.ndarray
    avgvol50: np.ndarray
    atr14: np.ndarray


@dataclass
class Trade:
    symbol: str
    entry_idx: int
    entry_price: float
    stop0: float
    exit_idx: int = -1
    exit_price: float = np.nan
    reason: str = ""
    shares: float = 0.0
    signal_rank: float = 0.0

    @property
    def ret(self) -> float:
        return self.exit_price / self.entry_price - 1

    @property
    def r_multiple(self) -> float:
        risk = self.entry_price - self.stop0
        return (self.exit_price - self.entry_price) / risk if risk > 0 else np.nan


class Position:
    """State machine for one open trade. Used by both simulators."""

    def __init__(self, mkt: Market, j: int, entry_idx: int, entry_price: float,
                 stop_ref: float, rules: ExitRules, cost: float):
        self.m, self.j, self.rules, self.cost = mkt, j, rules, cost
        self.entry_idx, self.entry = entry_idx, entry_price
        raw_open = entry_price / (1 + cost)
        self.stop = self._initial_stop(raw_open, stop_ref, entry_idx)
        self.target = raw_open * (1 + rules.target_pct) if rules.target_pct else None
        self.hold_until = None          # 8-week rule
        self.exit_next_open = None      # reason string when a close rule fired
        self.trade = Trade(mkt.symbols[j], entry_idx, entry_price, self.stop)

    def _initial_stop(self, px: float, stop_ref: float, i: int) -> float:
        r = self.rules
        if r.stop_mode == "pct":
            stop = px * (1 - r.stop_pct)
        elif r.stop_mode == "atr":
            a = self.m.atr14[i - 1, self.j]
            stop = px - r.stop_atr * a if np.isfinite(a) else px * (1 - r.stop_pct)
            stop = max(stop, px * (1 - max(r.stop_pct, 0.15)))  # sanity cap
        elif r.stop_mode == "structure":
            ref = stop_ref * 0.995 if np.isfinite(stop_ref) else 0.0
            stop = max(ref, px * (1 - r.stop_pct))
        else:
            raise ValueError(r.stop_mode)
        if r.min_stop_pct:
            stop = min(stop, px * (1 - r.min_stop_pct))
        return stop

    def _close(self, i: int, px: float, reason: str) -> Trade:
        t = self.trade
        t.exit_idx, t.exit_price, t.reason = i, px * (1 - self.cost), reason
        return t

    def on_open(self, i: int) -> Trade | None:
        """Called at the open of day i (i > entry day)."""
        o = self.m.o[i, self.j]
        if not np.isfinite(o):
            return None
        if self.exit_next_open:
            return self._close(i, o, self.exit_next_open)
        if o <= self.stop:
            return self._close(i, o, "stop")
        if self.target and self.hold_until is None and o >= self.target:
            return self._close(i, o, "target")
        return None

    def intraday(self, i: int) -> Trade | None:
        """Stops and targets touched during day i."""
        lo, hi = self.m.l[i, self.j], self.m.h[i, self.j]
        if not np.isfinite(lo):
            return None
        if lo <= self.stop:
            return self._close(i, self.stop, "stop")
        if self.target and self.hold_until is None and hi >= self.target:
            if self.rules.oneil_8week and i - self.entry_idx < 15:
                # Big fast winner: hold at least 8 weeks, protect breakeven.
                self.hold_until = self.entry_idx + 40
                self.stop = max(self.stop, self.entry)
            else:
                return self._close(i, self.target, "target")
        return None

    def on_close(self, i: int) -> None:
        """End-of-day rules; exits fill at the next open."""
        r, m, j = self.rules, self.m, self.j
        c = m.c[i, j]
        if not np.isfinite(c):
            return
        risk = self.entry - self.trade.stop0
        if r.breakeven_r and risk > 0 and c >= self.entry + r.breakeven_r * risk:
            self.stop = max(self.stop, self.entry)
        in_hold = self.hold_until is not None and i < self.hold_until
        s50 = m.sma50[i, j]
        if not in_hold and np.isfinite(s50) and c < s50:
            heavy = m.v[i, j] > 1.5 * m.avgvol50[i, j]
            if r.trail_sma50 and (heavy or not r.sma50_heavy_volume):
                self.exit_next_open = "below_50dma"
            elif self.hold_until is not None:
                self.exit_next_open = "below_50dma"   # after the 8-week hold
        if i - self.entry_idx >= r.max_hold:
            self.exit_next_open = "time"

    def force_close(self, i: int) -> Trade:
        col = self.m.c[: i + 1, self.j]
        last = np.flatnonzero(np.isfinite(col))
        k = last[-1] if len(last) else self.entry_idx
        px = col[k] if len(last) else self.entry / (1 + self.cost)
        return self._close(k, px, "end_of_data")


def simulate_trade(mkt: Market, j: int, signal_idx: int, stop_ref: float,
                   rules: ExitRules, cost: float, max_entry_gap: float | None,
                   pivot: float = np.nan) -> Trade | None:
    """Simulate one signal on its own (no portfolio limits)."""
    i = signal_idx + 1
    n = len(mkt.dates)
    if i >= n or not np.isfinite(mkt.o[i, j]):
        return None
    o = mkt.o[i, j]
    if max_entry_gap is not None and np.isfinite(pivot) and o > pivot * (1 + max_entry_gap):
        return None   # gapped out of the buy zone
    pos = Position(mkt, j, i, o * (1 + cost), stop_ref, rules, cost)
    t = pos.intraday(i)
    if t:
        return t
    pos.on_close(i)
    for k in range(i + 1, n):
        t = pos.on_open(k) or pos.intraday(k)
        if t:
            return t
        pos.on_close(k)
    return pos.force_close(n - 1)


def simulate_signals(mkt: Market, sig: dict, rules: ExitRules, cost: float = 0.001,
                     max_entry_gap: float | None = 0.05, start_idx: int = 0,
                     one_at_a_time: bool = True) -> list[Trade]:
    """Every signal as an independent trade. If one_at_a_time, a new signal
    in a stock is ignored while a previous trade in it is still open."""
    entries, stop_ref, pivot = sig["entry"], sig["stop_ref"], sig["pivot"]
    rank = sig.get("rank")
    trades = []
    for j in range(entries.shape[1]):
        idxs = np.flatnonzero(entries[:, j])
        busy_until = -1
        for t_idx in idxs:
            if t_idx < start_idx or t_idx <= busy_until:
                continue
            tr = simulate_trade(mkt, j, t_idx, stop_ref[t_idx, j], rules, cost,
                                max_entry_gap, pivot[t_idx, j])
            if tr is None:
                continue
            if rank is not None:
                tr.signal_rank = float(rank[t_idx, j])
            trades.append(tr)
            if one_at_a_time:
                busy_until = tr.exit_idx
    return trades


@dataclass
class PortfolioConfig:
    initial_equity: float = 100_000.0
    risk_per_trade: float = 0.0125   # Minervini: 1.25%-2.5% of equity at risk
    max_position: float = 0.20       # of equity
    max_positions: int = 8
    cost: float = 0.001              # per side (commission + slippage)
    max_entry_gap: float | None = 0.05


@dataclass
class PortfolioResult:
    equity: pd.Series
    exposure: pd.Series
    trades: list = field(default_factory=list)


def backtest_portfolio(mkt: Market, sig: dict, rules: ExitRules,
                       cfg: PortfolioConfig, start_idx: int = 0) -> PortfolioResult:
    n, _ = mkt.c.shape
    entries, stop_ref, pivot, rank = sig["entry"], sig["stop_ref"], sig["pivot"], sig["rank"]
    cash = cfg.initial_equity
    positions: dict[int, Position] = {}
    shares: dict[int, float] = {}
    last_px: dict[int, float] = {}
    trades, eq, expo = [], np.full(n, np.nan), np.zeros(n)

    def close_pos(j, t):
        nonlocal cash
        t.shares = shares[j]
        cash += shares[j] * t.exit_price
        trades.append(t)
        del positions[j], shares[j]

    for i in range(start_idx, n):
        # 1) exits at the open (gaps / pending close-rule exits)
        for j in list(positions):
            t = positions[j].on_open(i)
            if t:
                close_pos(j, t)
        # 2) new entries from yesterday's signals, best RS first
        if i > start_idx:
            cand = np.flatnonzero(entries[i - 1])
            cand = [j for j in cand if j not in positions]
            cand.sort(key=lambda j: -rank[i - 1, j])
            equity_now = cash + sum(shares[j] * last_px.get(j, positions[j].entry)
                                    for j in positions)
            for j in cand:
                if len(positions) >= cfg.max_positions:
                    break
                o = mkt.o[i, j]
                if not np.isfinite(o):
                    continue
                if (cfg.max_entry_gap is not None and np.isfinite(pivot[i - 1, j])
                        and o > pivot[i - 1, j] * (1 + cfg.max_entry_gap)):
                    continue
                px = o * (1 + cfg.cost)
                pos = Position(mkt, j, i, px, stop_ref[i - 1, j], rules, cfg.cost)
                risk_ps = px - pos.stop
                if risk_ps <= 0:
                    continue
                qty = min(cfg.risk_per_trade * equity_now / risk_ps,
                          cfg.max_position * equity_now / px,
                          cash / px)
                if qty * px < 0.01 * equity_now:
                    continue
                cash -= qty * px
                pos.trade.signal_rank = float(rank[i - 1, j])
                positions[j], shares[j] = pos, qty
        # 3) intraday stops / targets, then close rules
        for j in list(positions):
            t = positions[j].intraday(i)
            if t:
                close_pos(j, t)
                continue
            positions[j].on_close(i)
        # 4) mark to market
        mv = 0.0
        for j in positions:
            c = mkt.c[i, j]
            if np.isfinite(c):
                last_px[j] = c
            mv += shares[j] * last_px.get(j, positions[j].entry)
        eq[i] = cash + mv
        expo[i] = mv / eq[i] if eq[i] > 0 else 0
    for j in list(positions):
        close_pos(j, positions[j].force_close(n - 1))
    idx = mkt.dates[start_idx:]
    return PortfolioResult(pd.Series(eq[start_idx:], idx), pd.Series(expo[start_idx:], idx), trades)
