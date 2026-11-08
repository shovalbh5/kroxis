"""The daily job: scan + demo accounts. Run once a day after the US close
(any time works: it always uses the last finished trading day).

    python scripts/daily_run.py                    # live prices (Yahoo Finance)
    python scripts/daily_run.py --source cache --asof 2026-06-01   # test on old data

Outputs (Hebrew):
    reports/scan/latest.md     at least 20 stocks: buy signals + watchlist
    reports/paper/latest.md    the two demo accounts ($100k each)
State of the demo accounts: paper/<strategy>.json (commit it to keep history).
"""
import argparse
import json
import os
import sys

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from kroxis_trader import engine as en                        # noqa: E402
from kroxis_trader import paper, scanner                      # noqa: E402
from kroxis_trader import strategies as st                    # noqa: E402
from kroxis_trader.data import EXCLUDE, INDEX_SYMBOLS, Panel, load_saved_panel  # noqa: E402
from kroxis_trader.presets import KROXIS                      # noqa: E402

ROOT = os.path.join(os.path.dirname(__file__), "..")
STRAT_HE = {"minervini": "מינרביני", "oneil": "אוניל"}
REASON_HE = {"stop": "סטופ", "target": "יעד +20%", "below_50dma": "ירידה מתחת לממוצע 50",
             "time": "זמן", "end_of_data": "סוף נתונים"}


def load_panel(source: str, asof: str | None, sectors: dict, symbols: list[str]) -> Panel:
    if source == "cache":
        p = load_saved_panel(os.path.join(ROOT, "data", "panel.parquet"))
        p.sectors = {**p.sectors, **sectors}
        if asof:
            cut = lambda d: d.loc[:pd.Timestamp(asof)]  # noqa: E731
            p = Panel(cut(p.open), cut(p.high), cut(p.low), cut(p.close), cut(p.volume),
                      cut(p.raw_close), p.sectors)
        return p
    from kroxis_trader import yahoo
    day = pd.Timestamp(asof) if asof else yahoo.last_complete_session()
    start = (day - pd.Timedelta(days=800)).strftime("%Y-%m-%d")
    print(f"downloading {len(symbols)} symbols from Yahoo Finance...", flush=True)
    frames = yahoo.download(symbols, start)
    print(f"got {len(frames)} symbols", flush=True)
    return yahoo.panel_from_yahoo(frames, sectors, asof=day)


def pct(x):
    return "–" if x is None or (isinstance(x, float) and np.isnan(x)) else f"{x * 100:+.1f}%"


def paper_report(states: dict, summaries: dict, spy_now: float, date: str) -> str:
    out = [f"# חשבון דמו – עדכון {date}", "",
           "כסף וירטואלי, מחירים אמיתיים, אותם חוקים בדיוק כמו בבדיקה על נתוני עבר.", "",
           "| חשבון | התחיל | הון | תשואה | SPY באותה תקופה | ירידה מקסימלית | עסקאות סגורות | אחוז ניצחון |",
           "|---|---|---|---|---|---|---|---|"]
    for k, s in states.items():
        a = paper.account_stats(s, spy_now)
        wr = (f"{a['win_rate'] * 100:.0f}% ({a['win_rate_ci95'][0] * 100:.0f}–{a['win_rate_ci95'][1] * 100:.0f}%)"
              if a.get("win_rate") is not None else "–")
        out.append(f"| {STRAT_HE[k]} | {s['start_date']} | ${a['equity']:,.0f} | {pct(a['return'])} | "
                   f"{pct(a.get('spy_return'))} | {pct(a['max_drawdown'])} | {a['closed_trades']} | {wr} |")
    for k, s in states.items():
        sm = summaries.get(k, {})
        out += ["", f"## {STRAT_HE[k]}", ""]
        if sm.get("bought") or sm.get("sold"):
            for b in sm.get("bought", []):
                out.append(f"- 🟢 נקנתה **{b['symbol']}**: {b['shares']:.0f} מניות ב-${b['entry_price']:.2f}, "
                           f"סטופ ${b['stop_now']:.2f}")
            for t in sm.get("sold", []):
                out.append(f"- 🔴 נמכרה **{t['symbol']}** ב-${t['exit']:.2f} ({REASON_HE.get(t['reason'], t['reason'])}): "
                           f"{pct(t['ret'])}, ${t['pnl']:+,.0f}")
        else:
            out.append("- אין קניות או מכירות בעדכון הזה.")
        if s["positions"]:
            out += ["", "| מניה | נכנס ב | מחיר כניסה | סגירה אחרונה | רווח/הפסד | סטופ נוכחי | יעד |",
                    "|---|---|---|---|---|---|---|"]
            for q in s["positions"]:
                pnl = q["last_close"] / q["entry_price"] - 1
                tgt = f"${q['target']:.2f}" if q.get("target") else "–"
                flag = " (יימכר בפתיחה)" if q.get("exit_next_open") else ""
                out.append(f"| **{q['symbol']}**{flag} | {q['entry_date']} | ${q['entry_price']:.2f} | "
                           f"${q['last_close']:.2f} | {pct(pnl)} | ${q['stop_now']:.2f} | {tgt} |")
        else:
            out += ["", "אין פוזיציות פתוחות."]
        if s["pending"]:
            out += ["", "**פקודות לפתיחה הבאה** (קנייה רק אם הפתיחה לא גבוהה ביותר מ-5% מנקודת הפריצה):", ""]
            for o in s["pending"][:8]:
                out.append(f"- {o['symbol']}: נקודת פריצה ${o['pivot']:.2f}, קנייה עד ${o['pivot'] * 1.05:.2f}")
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", choices=["yahoo", "cache"], default="yahoo")
    ap.add_argument("--asof")
    ap.add_argument("--min-rows", type=int, default=20)
    ap.add_argument("--equity", type=float, default=100_000)
    ap.add_argument("--no-paper", action="store_true")
    ap.add_argument("--state-dir", default=os.path.join(ROOT, "paper"))
    a = ap.parse_args()

    uni = pd.read_csv(os.path.join(ROOT, "universe", "sp1500.csv"))
    sectors = dict(zip(uni.symbol, uni.sector))
    panel = load_panel(a.source, a.asof, sectors, list(uni.symbol) + ["SPY"])

    # 1) scan: at least 20 stocks
    table = scanner.load_table(os.path.join(ROOT, "models", "winrate_table.json"))
    rows, market = scanner.scan(panel, table, min_rows=a.min_rows, equity=a.equity)
    out_dir = os.path.join(ROOT, "reports", "scan")
    os.makedirs(out_dir, exist_ok=True)
    md = scanner.to_markdown_he(rows, market, a.equity)
    for name in ("latest.md", f"scan_{market['date']}.md"):
        with open(os.path.join(out_dir, name), "w") as fh:
            fh.write(md)
    rows.to_csv(os.path.join(out_dir, f"scan_{market['date']}.csv"), index_label="rank")
    print(md)
    if a.no_paper:
        return

    # 2) demo accounts, one per book
    stocks = [s for s in panel.symbols if s not in INDEX_SYMBOLS and s not in EXCLUDE]
    f = st.build_features(panel, stocks)
    m = f.mkt
    spy_now = float(panel.close["SPY"].iloc[-1])
    cfg = en.PortfolioConfig(initial_equity=a.equity)
    states, summaries = {}, {}
    for k, preset in KROXIS.items():
        path = os.path.join(a.state_dir, f"{k}.json")
        sig = preset["signals"](f)
        s = paper.load_state(path)
        if s is None:
            s = paper.new_state(k, k, "kroxis", m.dates[-1], a.equity, spy_now)
            s["pending"] = paper._pending_from_row(m, sig, len(m.dates) - 1)
            summaries[k] = {"bought": [], "sold": [], "started": True}
        else:
            summaries[k] = paper.advance(s, m, sig, preset["rules"], cfg)
        paper.save_state(path, s)
        states[k] = s
    rep = paper_report(states, summaries, spy_now, str(m.dates[-1].date()))
    pdir = os.path.join(ROOT, "reports", "paper")
    os.makedirs(pdir, exist_ok=True)
    with open(os.path.join(pdir, "latest.md"), "w") as fh:
        fh.write(rep)
    with open(os.path.join(pdir, f"paper_{m.dates[-1].date()}.md"), "w") as fh:
        fh.write(rep)
    print("\n" + rep)


if __name__ == "__main__":
    main()
