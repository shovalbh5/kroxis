"""Daily scan: today's buy signals, and the stocks closest to a buy point.

Rows come in three groups:
  1. BUY      - broke out today under the book rules; buy at tomorrow's open
                if the price is no more than 5% above the pivot.
  2. WATCH    - a valid setup (VCP for Minervini, base for O'Neil); buy only
                if it closes above the pivot on high volume.
  3. UPTREND  - passes Minervini's Trend Template but has no setup yet
                (only added to reach the minimum number of rows).
Win rates are historical: how often trades of the same kind won in
15,000+ backtested trades (2006-2017 and 2020-2026), with a 95% range.
"""
from __future__ import annotations

import json
import os

import numpy as np
import pandas as pd

from . import strategies as st
from .presets import KROXIS

VOL_BUCKETS = [(1.0, 2.0, "1.4-2x"), (2.0, 3.0, "2-3x"), (3.0, np.inf, "3x+")]
STATUS_ORDER = {"BUY": 0, "WATCH": 1, "UPTREND": 2}


def load_table(path: str) -> dict:
    with open(path) as fh:
        return json.load(fh)


def _bucket(vr: float) -> str:
    for lo, hi, name in VOL_BUCKETS:
        if lo <= vr < hi:
            return name
    return "1.4-2x"


def _stop(price: float, atr: float, atr_mult: float = 3.0, cap: float = 0.15) -> float:
    if not np.isfinite(atr):
        return price * (1 - 0.08)
    return max(price - atr_mult * atr, price * (1 - cap))


def scan(panel, table: dict, presets: dict = KROXIS, min_rows: int = 20,
         equity: float = 100_000, risk_per_trade: float = 0.0125,
         max_position: float = 0.20) -> tuple[pd.DataFrame, dict]:
    from .data import EXCLUDE, INDEX_SYMBOLS
    stocks = [s for s in panel.symbols if s not in INDEX_SYMBOLS and s not in EXCLUDE]
    f = st.build_features(panel, stocks)
    m, L = f.mkt, len(f.mkt.dates) - 1
    df = lambda a: pd.DataFrame(a, index=f.close.index, columns=f.close.columns)  # noqa: E731
    H, Lo, V = df(m.h), df(m.l), df(m.v)
    c = m.c[L]
    atr = m.atr14[L]
    rs = f.rs.values[L]
    avgv = f.avgvol50.values[L]
    tt = st.trend_template(f).values[L]
    liquid = f.liquid.values[L]
    # A stock that barely moves (average daily range under 1%) is usually
    # waiting for a buyout to close - not a real setup.
    with np.errstate(all="ignore"):
        moving = atr / c >= 0.01
    rows = []

    def add(j, strategy, status, pivot, vol_ratio=np.nan):
        price = float(c[j])
        entry = price if status == "BUY" else float(pivot)
        stop = _stop(entry, float(atr[j]))
        tab = table[strategy]
        key = _bucket(vol_ratio) if status == "BUY" and np.isfinite(vol_ratio) else "all"
        wr = tab[key]
        risk = entry - stop
        shares = int(min(risk_per_trade * equity / risk, max_position * equity / entry)) if risk > 0 else 0
        rows.append({
            "symbol": m.symbols[j], "sector": panel.sectors.get(m.symbols[j], ""),
            "strategy": strategy, "status": status, "close": price,
            "buy_above": float(pivot), "buy_max": float(pivot) * 1.05,
            "distance_to_buy": float(pivot) / price - 1,
            "stop": stop, "risk_pct": risk / entry if entry > 0 else np.nan,
            "target": entry * 1.20 if strategy == "oneil" else np.nan,
            "rs": float(rs[j]), "vol_ratio": float(vol_ratio),
            "win_rate": wr["win_rate"], "win_ci_low": wr["ci95"][0], "win_ci_high": wr["ci95"][1],
            "win_rate_if_3x_volume": tab["3x+"]["win_rate"],
            "avg_win": wr["avg_win"], "avg_loss": wr["avg_loss"], "avg_return": wr["avg_return"],
            "history_n": wr["n"], "shares_for_demo": shares,
        })

    # 1) buy signals at today's close
    sigs = {k: p["signals"](f) for k, p in presets.items()}
    for k, sig in sigs.items():
        for j in np.flatnonzero(sig["entry"][L]):
            add(j, k, "BUY", sig["pivot"][L, j], m.v[L, j] / f.avgvol50.values[L - 1, j])
    listed = {(r["symbol"], r["strategy"]) for r in rows}

    # 2) setups that would trigger on a breakout tomorrow
    hh10, ll10 = H.rolling(10).max().values[L], Lo.rolling(10).min().values[L]
    hh20, ll20 = H.rolling(20).max().values[L], Lo.rolling(20).min().values[L]
    hh50, ll50 = H.rolling(50).max().values[L], Lo.rolling(50).min().values[L]
    vol10 = V.rolling(10).mean().values[L]
    with np.errstate(all="ignore"):
        d10, d20, d50 = (hh10 - ll10) / hh10, (hh20 - ll20) / hh20, (hh50 - ll50) / hh50
        vcp = ((d50 <= 0.35) & (d20 < d50) & (d10 < d20) & (d10 <= 0.10) & (d10 <= 0.6 * d50)
               & (vol10 < avgv) & (hh10 >= 0.85 * hh50))
        mins_ok = vcp & tt & liquid & moving & bool(f.regime["trend200"][L]) & (c <= hh10)
    for j in np.flatnonzero(mins_ok):
        if (m.symbols[j], "minervini") not in listed:
            add(j, "minervini", "WATCH", hh10[j])
    piv35, low35 = H.rolling(35).max().values[L], Lo.rolling(35).min().values[L]
    sma200 = f.sma200.values
    with np.errstate(all="ignore"):
        oneil_ok = (((piv35 - low35) / piv35 <= 0.33) & (rs >= 80)
                    & (piv35 >= 0.95 * f.hi52.values[L]) & (c > sma200[L])
                    & (sma200[L] > sma200[L - 22]) & (f.raw_close.values[L] >= 15)
                    & liquid & moving & bool(f.regime["oneil"][L]) & (c <= piv35)
                    & (c >= 0.85 * piv35))
    for j in np.flatnonzero(oneil_ok):
        if (m.symbols[j], "oneil") not in listed:
            add(j, "oneil", "WATCH", piv35[j])

    # 3) fill up with the strongest Trend Template stocks
    have = {r["symbol"] for r in rows}
    if len(rows) < min_rows:
        cand = [j for j in np.flatnonzero(tt & liquid & moving) if m.symbols[j] not in have]
        cand.sort(key=lambda j: (hh10[j] / c[j] - 1, -rs[j]))
        for j in cand[: min_rows - len(rows)]:
            add(j, "minervini", "UPTREND", hh10[j])

    out = pd.DataFrame(rows)
    if not out.empty:
        out["order"] = out["status"].map(STATUS_ORDER)
        out = out.sort_values(["order", "win_rate", "distance_to_buy", "rs"],
                              ascending=[True, False, True, False]).drop(columns="order")
        out = out.reset_index(drop=True)
        out.index += 1
    spy_c = panel.close["SPY"].reindex(f.close.index)
    market = {
        "date": str(m.dates[L].date()),
        "spy_close": float(spy_c.iloc[L]),
        "spy_above_50d": bool(spy_c.iloc[L] > spy_c.rolling(50).mean().iloc[L]),
        "spy_above_200d": bool(spy_c.iloc[L] > spy_c.rolling(200).mean().iloc[L]),
        "minervini_market_ok": bool(f.regime["trend200"][L]),
        "oneil_market_ok": bool(f.regime["oneil"][L]),
        "stocks_scanned": int(np.isfinite(c).sum()),
        "trend_template_count": int((tt & liquid).sum()),
        "buy_signals": int((out["status"] == "BUY").sum()) if not out.empty else 0,
    }
    return out, market


def to_markdown_he(rows: pd.DataFrame, market: dict, equity: float) -> str:
    ok = lambda b: "✅ מותר לקנות" if b else "⛔ לא קונים (השוק חלש)"  # noqa: E731
    status_he = {"BUY": "🟢 קנייה", "WATCH": "🟡 מחכה לפריצה", "UPTREND": "⚪ במגמה"}
    strat_he = {"minervini": "מינרביני", "oneil": "אוניל"}
    p = lambda x: "–" if pd.isna(x) else f"{x * 100:.1f}%"  # noqa: E731
    d = lambda x: "–" if pd.isna(x) else f"{x:,.2f}"  # noqa: E731
    lines = [
        f"# סריקה יומית – {market['date']}",
        "",
        f"נסרקו {market['stocks_scanned']} מניות. {market['trend_template_count']} עוברות את ה-Trend Template. "
        f"**{market['buy_signals']} אותות קנייה.**",
        "",
        f"- SPY: {market['spy_close']:.2f} | מעל ממוצע 50: {'כן' if market['spy_above_50d'] else 'לא'} "
        f"| מעל ממוצע 200: {'כן' if market['spy_above_200d'] else 'לא'}",
        f"- מסנן שוק מינרביני: {ok(market['minervini_market_ok'])}",
        f"- מסנן שוק אוניל: {ok(market['oneil_market_ok'])}",
        "",
        "| # | מניה | שיטה | מצב | סגירה | קנייה מעל | עד (5%) | סטופ | סיכון | מרחק | RS | נפח | סיכוי היסטורי (95%) | מניות בדמו |",
        "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|",
    ]
    for i, r in rows.iterrows():
        vol = "–" if pd.isna(r.vol_ratio) else f"{r.vol_ratio:.1f}x"
        lines.append(
            f"| {i} | **{r.symbol}** | {strat_he[r.strategy]} | {status_he[r.status]} | {d(r.close)} | "
            f"{d(r.buy_above)} | {d(r.buy_max)} | {d(r.stop)} | {p(r.risk_pct)} | {p(r.distance_to_buy)} | "
            f"{r.rs:.0f} | {vol} | {p(r.win_rate)} ({p(r.win_ci_low)}–{p(r.win_ci_high)}) | "
            f"{r.shares_for_demo if r.status == 'BUY' else '–'} |")
    lines += [
        "",
        "**איך לקרוא:**",
        "- 🟢 קנייה = פרצה היום לפי חוקי הספר. קונים בפתיחה של מחר, רק אם המחיר לא עולה על עמודת \"עד\".",
        "- 🟡 מחכה לפריצה = מבנה תקין. קונים רק אם המניה **נסגרת** מעל \"קנייה מעל\" במחזור גבוה (מינרביני ×1.4, אוניל ×1.5 מהממוצע).",
        "- ⚪ במגמה = עוברת את ה-Trend Template, אבל עוד אין נקודת קנייה. רק למעקב.",
        "- סטופ = פי 3 מהתנודה היומית הממוצעת (3×ATR). סיכון = המרחק מהקנייה לסטופ.",
        "- סיכוי היסטורי = כמה פעמים עסקאות מאותו סוג הרוויחו בבדיקה על 15,000+ עסקאות עבר. "
        "זה **לא** ניבוי של המניה הספציפית: כל עסקה כאן היא בערך 32%–41% להצלחה, "
        "והרווח בא מכך שהרווח הממוצע גדול בערך פי 2 מההפסד הממוצע.",
        f"- מניות בדמו = כמות לחשבון של ${equity:,.0f}, בסיכון של 1.25% מהחשבון לעסקה.",
    ]
    return "\n".join(lines)
