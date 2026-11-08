"""Paper-trading (demo) account: virtual money, real prices, same rules
as the backtest.

The account is saved as a JSON file. Each daily run:
  1. rebuilds the open positions by replaying their days on current data,
  2. processes every new trading day with PortfolioSim.step() - buys at
     the open from yesterday's signals, stops, targets, close rules,
  3. stores today's signals as orders for the next open.
Prices are corrected if Yahoo later adjusts history (dividends, splits).
"""
from __future__ import annotations

import json
import os

import numpy as np
import pandas as pd

from . import engine as en
from . import metrics as me


def new_state(name: str, strategy: str, preset: str, start_date, equity: float,
              spy_close: float) -> dict:
    return {"name": name, "strategy": strategy, "preset": preset,
            "start_date": str(pd.Timestamp(start_date).date()),
            "last_date": str(pd.Timestamp(start_date).date()),
            "initial_equity": equity, "cash": equity, "spy_start": spy_close,
            "positions": [], "pending": [], "trades": [],
            "equity_history": [{"date": str(pd.Timestamp(start_date).date()),
                                "equity": equity, "exposure": 0.0}]}


def load_state(path: str) -> dict | None:
    if not os.path.exists(path):
        return None
    with open(path) as fh:
        return json.load(fh)


def save_state(path: str, state: dict) -> None:
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w") as fh:
        json.dump(state, fh, indent=1, default=float)
    os.replace(tmp, path)


def _pending_from_row(m: en.Market, sig: dict, i: int) -> list[dict]:
    js = sorted(np.flatnonzero(sig["entry"][i]), key=lambda j: -sig["rank"][i, j])
    return [{"symbol": m.symbols[j], "pivot": float(sig["pivot"][i, j]),
             "stop_ref": float(sig["stop_ref"][i, j]), "rank": float(sig["rank"][i, j]),
             "ref_close": float(m.c[i, j])} for j in js]


def _rows(m: en.Market, pending: list[dict], i_prev: int):
    """Turn a pending-order list into the arrays PortfolioSim.step() takes."""
    n = len(m.symbols)
    sym_idx = {s: k for k, s in enumerate(m.symbols)}
    pivot, stop_ref, rank = np.full(n, np.nan), np.full(n, np.nan), np.zeros(n)
    cand = []
    for o in pending:
        j = sym_idx.get(o["symbol"])
        if j is None:
            continue
        now = m.c[i_prev, j]
        scale = now / o["ref_close"] if np.isfinite(now) and o["ref_close"] > 0 else 1.0
        pivot[j], stop_ref[j], rank[j] = o["pivot"] * scale, o["stop_ref"] * scale, o["rank"]
        cand.append(j)
    cand.sort(key=lambda j: -rank[j])
    return cand, pivot, stop_ref, rank


def advance(state: dict, m: en.Market, sig: dict, rules: en.ExitRules,
            cfg: en.PortfolioConfig, upto_idx: int | None = None) -> dict:
    """Move the account forward to `upto_idx` (default: last day of data).
    Returns a summary of what happened."""
    dates = m.dates
    date_idx = {d: k for k, d in enumerate(dates)}
    sym_idx = {s: k for k, s in enumerate(m.symbols)}
    last_idx = int(np.searchsorted(dates, pd.Timestamp(state["last_date"]), side="right")) - 1
    upto = len(dates) - 1 if upto_idx is None else upto_idx
    summary = {"from": state["last_date"], "to": str(dates[upto].date()),
               "bought": [], "sold": [], "data_fixes": []}
    if upto <= last_idx:
        summary["to"] = state["last_date"]
        return summary

    sim = en.PortfolioSim(m, rules, cfg, cash=state["cash"])
    for p in state["positions"]:
        j, e = sym_idx.get(p["symbol"]), date_idx.get(pd.Timestamp(p["entry_date"]))
        if j is None or e is None:
            summary["data_fixes"].append(f"{p['symbol']}: no data, position kept as cash")
            sim.cash += p["shares"] * p.get("last_close", p["entry_price"])
            continue
        now = m.c[e, j]
        scale = now / p["ref_close"] if np.isfinite(now) and p["ref_close"] > 0 else 1.0
        t = sim.restore(j, e, p["entry_price"] * scale, p["stop_ref"] * scale,
                        p["shares"] / scale, last_idx)
        if t:
            summary["data_fixes"].append(f"{p['symbol']}: closed on revised data")

    held_before = set(sim.positions)
    for i in range(last_idx + 1, upto + 1):
        pending = state["pending"] if i == last_idx + 1 else _pending_from_row(m, sig, i - 1)
        cand, pivot, stop_ref, rank = _rows(m, pending, i - 1)
        eq, ex = sim.step(i, cand, pivot, stop_ref, rank)
        state["equity_history"].append({"date": str(dates[i].date()), "equity": float(eq),
                                        "exposure": float(ex)})

    for t in sim.trades:
        rec = {"symbol": t.symbol, "entry_date": str(dates[t.entry_idx].date()),
               "exit_date": str(dates[t.exit_idx].date()), "entry": t.entry_price,
               "exit": t.exit_price, "stop0": t.stop0, "shares": t.shares,
               "ret": t.ret, "pnl": (t.exit_price - t.entry_price) * t.shares, "reason": t.reason}
        state["trades"].append(rec)
        summary["sold"].append(rec)
    state["positions"] = []
    for j, pos in sim.positions.items():
        rec = {"symbol": m.symbols[j], "entry_date": str(dates[pos.entry_idx].date()),
               "entry_price": pos.entry, "stop_ref": float(pos.stop_ref),
               "shares": sim.shares[j], "ref_close": float(m.c[pos.entry_idx, j]),
               "stop_now": float(pos.stop),
               "target": float(pos.target) if pos.target and pos.hold_until is None else None,
               "last_close": float(sim.last_px.get(j, pos.entry)),
               "exit_next_open": pos.exit_next_open}
        state["positions"].append(rec)
        if j not in held_before:
            summary["bought"].append(rec)
    state["pending"] = _pending_from_row(m, sig, upto)
    state["cash"] = sim.cash
    state["last_date"] = str(dates[upto].date())
    return summary


def account_stats(state: dict, spy_now: float | None = None) -> dict:
    eq = pd.Series({pd.Timestamp(r["date"]): r["equity"] for r in state["equity_history"]})
    t = pd.DataFrame(state["trades"])
    out = {"equity": float(eq.iloc[-1]), "return": float(eq.iloc[-1] / state["initial_equity"] - 1),
           "max_drawdown": float((eq / eq.cummax() - 1).min()), "closed_trades": len(t),
           "open_positions": len(state["positions"])}
    if len(t):
        wins = int((t.ret > 0).sum())
        out.update({"win_rate": wins / len(t), "win_rate_ci95": me.wilson_interval(wins, len(t)),
                    "avg_win": float(t.ret[t.ret > 0].mean()) if wins else None,
                    "avg_loss": float(t.ret[t.ret <= 0].mean()) if wins < len(t) else None,
                    "realized_pnl": float(t.pnl.sum())})
    if spy_now and state.get("spy_start"):
        out["spy_return"] = spy_now / state["spy_start"] - 1
    return out
