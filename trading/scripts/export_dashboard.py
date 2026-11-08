"""Export everything the Kroxis dashboard shows as JSON row files.

    python scripts/export_dashboard.py --out /path/to/dir

Daily files (change after each daily_run.py):
    scan.json, market.json, prices.json, accounts.json, orders.json, positions.json
Backtest files (fixed):
    equity.json, yearly.json, pertrade.json, portfolio.json, stops.json,
    calibration.json, volume.json
"""
import argparse
import json
import os
import sys

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from kroxis_trader import paper  # noqa: E402

ROOT = os.path.join(os.path.dirname(__file__), "..")
STRAT_HE = {"minervini": "מינרביני", "oneil": "אוניל"}
STATUS_HE = {"BUY": "קנייה", "WATCH": "מחכה לפריצה", "UPTREND": "במגמה"}
PERIODS = {"p2020": ("sp1500_2020_2026", "2020–2026"), "p2006": ("allus_2006_2017", "2006–2017")}
STOP_HE = {"fixed 3%": "קבוע 3%", "fixed 5%": "קבוע 5%", "fixed 7.5%": "קבוע 7.5%",
           "fixed 10%": "קבוע 10%", "ATR x1.5": "1.5×ATR", "ATR x2": "2×ATR",
           "ATR x3": "3×ATR", "below base low (max 8%)": "מתחת לבסיס (עד 8%)"}
STOP_CODE = {"fixed 3%": "fix3", "fixed 5%": "fix5", "fixed 7.5%": "fix75", "fixed 10%": "fix10",
             "ATR x1.5": "atr15", "ATR x2": "atr2", "ATR x3": "atr3", "below base low (max 8%)": "base"}


def clean(v):
    if isinstance(v, (np.floating, float)):
        return None if not np.isfinite(v) else round(float(v), 6)
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.bool_,)):
        return bool(v)
    return v


def write(out, name, rows):
    rows = [{k: clean(v) for k, v in r.items()} for r in rows]
    with open(os.path.join(out, name), "w") as fh:
        json.dump(rows, fh, ensure_ascii=False, separators=(",", ":"))
    print(f"{name}: {len(rows)} rows, {os.path.getsize(os.path.join(out, name)) / 1024:.0f} KB")


def daily(out):
    scan_dir = os.path.join(ROOT, "reports", "scan")
    scan = pd.read_csv(os.path.join(scan_dir, "latest.csv"))
    rows = []
    for _, r in scan.iterrows():
        rows.append({"rank": int(r["rank"]), "symbol": r.symbol, "sector": r.sector if isinstance(r.sector, str) else "",
                     "strategy": r.strategy, "strategy_he": STRAT_HE[r.strategy],
                     "status": r.status, "status_he": STATUS_HE[r.status],
                     "close": r.close, "buy_above": r.buy_above, "buy_max": r.buy_max,
                     "stop": r.stop, "risk_pct": r.risk_pct, "distance_to_buy": r.distance_to_buy,
                     "rs": r.rs, "vol_ratio": r.vol_ratio if r.status == "BUY" else None,
                     "win_rate": r.win_rate, "win_ci_low": r.win_ci_low, "win_ci_high": r.win_ci_high,
                     "shares_for_demo": int(r.shares_for_demo) if r.status == "BUY" else None})
    write(out, "scan.json", rows)
    with open(os.path.join(scan_dir, "latest_market.json")) as fh:
        write(out, "market.json", [json.load(fh)])
    prices = pd.read_csv(os.path.join(scan_dir, "latest_prices.csv"))
    write(out, "prices.json", prices.to_dict("records"))

    spy_now = json.load(open(os.path.join(scan_dir, "latest_market.json")))["spy_close"]
    acc, orders, pos = [], [], []
    for k in ("minervini", "oneil"):
        s = paper.load_state(os.path.join(ROOT, "paper", f"{k}.json"))
        a = paper.account_stats(s, spy_now)
        acc.append({"account": k, "account_he": STRAT_HE[k], "start_date": s["start_date"],
                    "last_date": s["last_date"], "equity": a["equity"], "return": a["return"],
                    "spy_return": a.get("spy_return"), "max_drawdown": a["max_drawdown"],
                    "closed_trades": a["closed_trades"], "win_rate": a.get("win_rate"),
                    "open_positions": a["open_positions"], "pending_orders": len(s["pending"])})
        for o in s["pending"]:
            orders.append({"key": f"{k}-{o['symbol']}", "account_he": STRAT_HE[k], "symbol": o["symbol"],
                           "pivot": o["pivot"], "buy_max": o["pivot"] * 1.05})
        for q in s["positions"]:
            pos.append({"key": f"{k}-{q['symbol']}", "account_he": STRAT_HE[k], "symbol": q["symbol"],
                        "entry_date": q["entry_date"], "entry_price": q["entry_price"],
                        "last_close": q["last_close"], "pnl_pct": q["last_close"] / q["entry_price"] - 1,
                        "stop_now": q["stop_now"], "shares": round(q["shares"])})
    write(out, "accounts.json", acc)
    write(out, "orders.json", orders)
    write(out, "positions.json", pos)


def backtest(out):
    eq_rows, yr_rows, pt_rows, pf_rows, st_rows = [], [], [], [], []
    for pid, (name, label) in PERIODS.items():
        d = os.path.join(ROOT, "reports", name)
        r = json.load(open(os.path.join(d, "results.json")))
        eq = pd.read_csv(os.path.join(d, "equity_curves.csv"), index_col=0, parse_dates=True)
        eq = eq.resample("W-FRI").last().dropna(how="all")
        cols = {"SPY buy & hold": "spy", "Equal-weight all stocks": "ew",
                r["strategies"]["minervini"]["title"]: "minervini",
                r["strategies"]["oneil"]["title"]: "oneil"}
        for dt, row in eq.iterrows():
            eq_rows.append({"key": f"{pid}-{dt:%Y-%m-%d}", "period": pid, "date": f"{dt:%Y-%m-%d}",
                            **{v: row[k] for k, v in cols.items()}})
        for y in sorted(r["benchmark_yearly"]["SPY"]):
            yr_rows.append({"key": f"{pid}-{y[:4]}", "period": pid, "year": int(y[:4]),
                            "spy": r["benchmark_yearly"]["SPY"][y],
                            "minervini": r["strategies"]["minervini"]["portfolio_yearly"].get(y),
                            "oneil": r["strategies"]["oneil"]["portfolio_yearly"].get(y)})
        b = r["benchmarks"]["SPY buy & hold"]
        pf_rows.append({"key": f"{pid}-spy", "period": pid, "name_he": "SPY (קנה והחזק)",
                        "cagr": b["cagr"], "max_dd": b["max_drawdown"], "sharpe": b["sharpe"],
                        "trades": None, "win_rate": None})
        for k in ("minervini", "oneil"):
            s = r["strategies"][k]
            a = s["all_signals"]
            pt_rows.append({"key": f"{pid}-{k}", "period": pid, "name_he": f"{STRAT_HE[k]} (לפי הספר)",
                            "trades": a["trades"], "win_rate": a["win_rate"],
                            "ci_low": a["win_rate_ci95"][0], "ci_high": a["win_rate_ci95"][1],
                            "avg_win": a["avg_win"], "avg_loss": a["avg_loss"],
                            "profit_factor": a["profit_factor"], "expectancy": a["expectancy"]})
            c = s["random_control"]["none"]
            pt_rows.append({"key": f"{pid}-{k}-random", "period": pid,
                            "name_he": f"כניסות אקראיות, יציאות של {STRAT_HE[k]}",
                            "trades": None, "win_rate": c["win_rate"]["mean"], "ci_low": c["win_rate"]["min"],
                            "ci_high": c["win_rate"]["max"], "avg_win": c["avg_win"]["mean"],
                            "avg_loss": c["avg_loss"]["mean"], "profit_factor": c["profit_factor"]["mean"],
                            "expectancy": c["expectancy"]["mean"]})
            p = s["portfolio"]
            pf_rows.append({"key": f"{pid}-{k}", "period": pid, "name_he": f"{STRAT_HE[k]} (לפי הספר)",
                            "cagr": p["cagr"], "max_dd": p["max_drawdown"], "sharpe": p["sharpe"],
                            "trades": p["trades"], "win_rate": p["win_rate"]})
            rc = s["portfolio_random_control"]
            pf_rows.append({"key": f"{pid}-{k}-random", "period": pid,
                            "name_he": f"{STRAT_HE[k]}, כניסות אקראיות",
                            "cagr": rc["cagr"], "max_dd": rc["max_drawdown"], "sharpe": rc["sharpe"],
                            "trades": None, "win_rate": None})
            for stop, v in s["stop_study"].items():
                st_rows.append({"key": f"{pid}-{k}-{STOP_CODE[stop]}", "period": pid, "strategy": k,
                                "stop": STOP_CODE[stop], "stop_he": STOP_HE[stop], "win_rate": v["win_rate"],
                                "recovered": v.get("recovered_above_entry"),
                                "recovered10": v.get("recovered_plus10"),
                                "cagr": v.get("portfolio_cagr"), "max_dd": v.get("portfolio_max_dd"),
                                "expectancy_r": v.get("expectancy_r")})
    write(out, "equity.json", eq_rows)
    write(out, "yearly.json", yr_rows)
    write(out, "pertrade.json", pt_rows)
    write(out, "portfolio.json", pf_rows)
    write(out, "stops.json", st_rows)

    m = json.load(open(os.path.join(ROOT, "reports", "model", "results.json")))
    cal = []
    for key, label in (("test_2023_2026", "2023–2026"), ("test_2012_2017", "2012–2017")):
        for q in m[key]["quintiles"]:
            cal.append({"key": f"{key}-{q['bucket']}", "test": label, "bucket": q["bucket"],
                        "predicted": q["predicted"], "actual": q["actual_win_rate"],
                        "ci_low": q["actual_ci95"][0], "ci_high": q["actual_ci95"][1], "n": q["n"]})
    write(out, "calibration.json", cal)
    t = json.load(open(os.path.join(ROOT, "models", "winrate_table.json")))
    vol = []
    for k, v in t.items():
        for b in ("1.4-2x", "2-3x", "3x+"):
            x = v[b]
            vol.append({"key": f"{k}-{b}", "strategy": k, "strategy_he": STRAT_HE[k], "bucket": b,
                        "n": x["n"], "win_rate": x["win_rate"], "ci_low": x["ci95"][0],
                        "ci_high": x["ci95"][1], "avg_return": x["avg_return"]})
    write(out, "volume.json", vol)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--daily-only", action="store_true")
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    daily(a.out)
    if not a.daily_only:
        backtest(a.out)
