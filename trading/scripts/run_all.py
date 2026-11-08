"""Run the full study on one dataset and write results to reports/<name>/.

    python scripts/run_all.py --panel data/panel.parquet --name sp1500_2020_2026 \
        --split 2023-01-01 --stocks-with-sector
    python scripts/run_all.py --panel data/panel_2004_2017.parquet --name allus_2006_2017 \
        --split 2012-01-01

What it measures:
  1. Book strategies (Minervini SEPA, O'Neil CAN SLIM) - every signal as a trade
  2. Control group - random entries with the SAME exits and costs
  3. Stop-loss study (the video's topic) - how each stop method changes
     results and how often a stop is hit just before the stock recovers
  4. Portfolio simulation - $100k, position sizing, max positions, costs,
     compared with buying and holding SPY and an equal-weight basket
"""
import argparse
import json
import os
import sys
import time

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from kroxis_trader import engine as en          # noqa: E402
from kroxis_trader import metrics as me         # noqa: E402
from kroxis_trader import strategies as st      # noqa: E402
from kroxis_trader.data import EXCLUDE, INDEX_SYMBOLS, load_saved_panel  # noqa: E402
from kroxis_trader.presets import BOOK          # noqa: E402

COST = 0.001  # 0.1% per side: commission + slippage

STRATEGIES = BOOK

STOP_VARIANTS = {
    "fixed 3%": dict(stop_mode="pct", stop_pct=0.03),
    "fixed 5%": dict(stop_mode="pct", stop_pct=0.05),
    "fixed 7.5%": dict(stop_mode="pct", stop_pct=0.075),
    "fixed 10%": dict(stop_mode="pct", stop_pct=0.10),
    "ATR x1.5": dict(stop_mode="atr", stop_atr=1.5),
    "ATR x2": dict(stop_mode="atr", stop_atr=2.0),
    "ATR x3": dict(stop_mode="atr", stop_atr=3.0),
    "below base low (max 8%)": dict(stop_mode="structure", stop_pct=0.08),
}


def jsonable(x):
    if isinstance(x, dict):
        return {str(k): jsonable(v) for k, v in x.items()}
    if isinstance(x, (list, tuple)):
        return [jsonable(v) for v in x]
    if isinstance(x, (np.floating, float)):
        return None if not np.isfinite(x) else round(float(x), 6)
    if isinstance(x, (np.integer,)):
        return int(x)
    return x


def shakeout_rate(df: pd.DataFrame, f: st.Features, horizon: int = 20) -> dict:
    """For trades closed by the stop: how often did the stock trade back
    above the entry price (and +10% above) within `horizon` days after?"""
    stops = df[df["reason"] == "stop"]
    if stops.empty:
        return {"stopped": 0}
    m = f.mkt
    sym_idx = {s: k for k, s in enumerate(m.symbols)}
    date_idx = {d: k for k, d in enumerate(m.dates)}
    back, plus10 = 0, 0
    for _, t in stops.iterrows():
        j, i = sym_idx[t.symbol], date_idx[t.exit_date]
        hi = np.nanmax(m.h[i + 1:i + 1 + horizon, j]) if i + 1 < len(m.dates) else np.nan
        raw_entry = t.entry / (1 + COST)
        back += bool(hi >= raw_entry)
        plus10 += bool(hi >= raw_entry * 1.10)
    n = len(stops)
    return {"stopped": n, "recovered_above_entry": back / n, "recovered_plus10": plus10 / n}


def summarize(df: pd.DataFrame) -> dict:
    s = me.trade_stats(df)
    return {k: s[k] for k in ("trades", "win_rate", "win_rate_ci95", "avg_win", "avg_loss",
                              "payoff_ratio", "profit_factor", "expectancy",
                              "expectancy_ci95", "expectancy_r", "median_days",
                              "exit_reasons")} if s.get("trades") else {"trades": 0}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--panel", required=True)
    ap.add_argument("--name", required=True)
    ap.add_argument("--split", required=True, help="date splitting the two halves")
    ap.add_argument("--stocks-with-sector", action="store_true",
                    help="trade only symbols that have a sector (drops ETFs)")
    ap.add_argument("--random-n", type=int, default=3000)
    ap.add_argument("--seeds", type=int, default=5)
    a = ap.parse_args()

    out_dir = os.path.join(os.path.dirname(__file__), "..", "reports", a.name)
    os.makedirs(out_dir, exist_ok=True)
    t0 = time.time()
    panel = load_saved_panel(a.panel)
    stocks = [s for s in panel.symbols if s not in INDEX_SYMBOLS and s not in EXCLUDE]
    if a.stocks_with_sector:
        stocks = [s for s in stocks if panel.sectors.get(s)]
    f = st.build_features(panel, stocks)
    dates = f.mkt.dates
    start = 252                      # one year of history for the indicators
    split = pd.Timestamp(a.split)
    print(f"[{a.name}] {len(stocks)} stocks, {dates[start].date()}..{dates[-1].date()}, "
          f"features {time.time() - t0:.0f}s")

    res = {"dataset": a.name, "stocks": len(stocks),
           "test_start": str(dates[start].date()), "test_end": str(dates[-1].date()),
           "cost_per_side": COST, "strategies": {}}

    # Benchmarks
    spy = panel.close["SPY"].reindex(dates).iloc[start:]
    liquid = f.liquid.values
    rets = f.close.pct_change(fill_method=None).values
    with np.errstate(all="ignore"):
        masked = np.where(liquid[:-1], rets[1:], np.nan)
        ew = np.array([np.nanmean(r) if np.isfinite(r).any() else 0.0 for r in masked])
    ew = pd.Series(np.r_[0, ew], index=dates).iloc[start:].fillna(0)
    ew_eq = 100_000 * (1 + ew).cumprod()
    spy_eq = 100_000 * spy / spy.iloc[0]
    res["benchmarks"] = {"SPY buy & hold": me.equity_stats(spy_eq),
                         "Equal-weight all stocks": me.equity_stats(ew_eq)}
    res["benchmark_yearly"] = {"SPY": me.yearly_returns(spy_eq).to_dict(),
                               "EW": me.yearly_returns(ew_eq).to_dict()}
    curves = {"SPY buy & hold": spy_eq, "Equal-weight all stocks": ew_eq}

    for key, cfg in STRATEGIES.items():
        sig = cfg["signals"](f)
        r = {"title": cfg["title"], "signals": int(sig["entry"][start:].sum())}
        # 1) every signal as a trade
        trades = en.simulate_signals(f.mkt, sig, cfg["rules"], cost=COST, start_idx=start)
        df = me.trades_frame(trades, dates)
        df.to_csv(os.path.join(out_dir, f"trades_{key}.csv"), index=False)
        r["all_signals"] = summarize(df)
        r["first_half"] = summarize(df[df.entry_date < split])
        r["second_half"] = summarize(df[df.entry_date >= split])
        r["by_year"] = {int(y): {"trades": len(g), "win_rate": (g.ret > 0).mean(),
                                 "expectancy": g.ret.mean()}
                        for y, g in df.groupby(df.entry_date.dt.year)}
        # 2) control group: random entries, same exits
        ctrl = {}
        for reg in ("none", cfg["regime"]):
            runs = []
            for seed in range(a.seeds):
                rs = st.random_signals(f, a.random_n, seed, regime=reg, start_idx=start)
                rt = en.simulate_signals(f.mkt, rs, cfg["rules"], cost=COST,
                                         start_idx=start, max_entry_gap=None)
                runs.append(me.trade_stats(me.trades_frame(rt, dates)))
            ctrl[reg] = {k: {"mean": float(np.mean([x[k] for x in runs])),
                             "min": float(np.min([x[k] for x in runs])),
                             "max": float(np.max([x[k] for x in runs]))}
                         for k in ("win_rate", "expectancy", "profit_factor", "avg_win", "avg_loss")}
        r["random_control"] = ctrl
        # 3) stop-loss study
        stops = {}
        for name, kw in STOP_VARIANTS.items():
            rules = en.ExitRules(**{**cfg["rules"].__dict__, **kw})
            sdf = me.trades_frame(en.simulate_signals(f.mkt, sig, rules, cost=COST,
                                                      start_idx=start), dates)
            port = en.backtest_portfolio(f.mkt, sig, rules, en.PortfolioConfig(cost=COST),
                                         start_idx=start)
            pst = me.equity_stats(port.equity)
            stops[name] = {**summarize(sdf), **shakeout_rate(sdf, f),
                           "first_half_expectancy": sdf[sdf.entry_date < split].ret.mean(),
                           "second_half_expectancy": sdf[sdf.entry_date >= split].ret.mean(),
                           "portfolio_cagr": pst["cagr"], "portfolio_max_dd": pst["max_drawdown"],
                           "portfolio_sharpe": pst["sharpe"]}
        r["stop_study"] = stops
        # 4) portfolio
        pcfg = en.PortfolioConfig(cost=COST)
        pr = en.backtest_portfolio(f.mkt, sig, cfg["rules"], pcfg, start_idx=start)
        pdf = me.trades_frame(pr.trades, dates)
        pdf.to_csv(os.path.join(out_dir, f"portfolio_trades_{key}.csv"), index=False)
        r["portfolio"] = {**me.equity_stats(pr.equity, pr.exposure), **summarize(pdf)}
        r["portfolio_yearly"] = me.yearly_returns(pr.equity).to_dict()
        curves[cfg["title"]] = pr.equity
        rp = []
        for seed in range(a.seeds):
            rs = st.random_signals(f, a.random_n, 100 + seed, regime=cfg["regime"], start_idx=start)
            rs["rank"] = np.random.default_rng(seed).random(rs["entry"].shape)
            rp.append(me.equity_stats(en.backtest_portfolio(f.mkt, rs, cfg["rules"],
                                                            pcfg, start_idx=start).equity))
        r["portfolio_random_control"] = {k: float(np.mean([x[k] for x in rp]))
                                         for k in ("cagr", "max_drawdown", "sharpe")}
        res["strategies"][key] = r
        print(f"  {key}: done ({time.time() - t0:.0f}s)")

    with open(os.path.join(out_dir, "results.json"), "w") as fh:
        json.dump(jsonable(res), fh, indent=1, default=str)
    pd.DataFrame(curves).to_csv(os.path.join(out_dir, "equity_curves.csv"))
    plot_curves(curves, os.path.join(out_dir, "equity.png"), a.name)
    print(f"[{a.name}] wrote {out_dir} in {time.time() - t0:.0f}s")


def plot_curves(curves: dict, path: str, title: str):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    fig, (ax, ax2) = plt.subplots(2, 1, figsize=(11, 7), sharex=True,
                                  gridspec_kw={"height_ratios": [3, 1]})
    colors = ["#888888", "#bbbbbb", "#1f6feb", "#d1242f"]
    for k, ((name, eq), col) in enumerate(zip(curves.items(), colors)):
        eq = eq.dropna()
        ax.plot(eq.index, eq.values, label=name, color=col, lw=1.6 if k >= 2 else 1.1)
        ax2.plot(eq.index, (eq / eq.cummax() - 1) * 100, color=col, lw=1)
    ax.set_yscale("log")
    ax.set_ylabel("Equity ($, log scale)")
    ax.set_title(f"Portfolio equity - {title}")
    ax.legend(fontsize=8, frameon=False)
    ax.grid(alpha=0.2)
    ax2.set_ylabel("Drawdown %")
    ax2.grid(alpha=0.2)
    fig.tight_layout()
    fig.savefig(path, dpi=110)
    plt.close(fig)


if __name__ == "__main__":
    main()
