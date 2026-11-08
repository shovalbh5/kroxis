"""Train and test the win-probability model.

    python scripts/train_model.py

Test design (decided before looking at test results):
  * Model type is chosen on a validation period: train on 2006-2017,
    validate on 2020-2022.
  * Final test: train on 2006-2017 + 2020-2022, test on 2023-2026, which
    the model never saw.
  * Second test: train on 2006-2011, test on 2012-2017.
  * Portfolio check on 2023-2026: keep only signals whose probability is
    in the top half of the training predictions, ranked by probability.
  * The daily scan uses a plain win-rate table (by strategy and breakout
    volume) because the model showed no reliable edge on unseen years.
"""
import json
import os
import sys
import time

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from kroxis_trader import engine as en          # noqa: E402
from kroxis_trader import metrics as me         # noqa: E402
from kroxis_trader import model as mdl          # noqa: E402
from kroxis_trader import strategies as st      # noqa: E402
from kroxis_trader.data import EXCLUDE, INDEX_SYMBOLS, load_saved_panel  # noqa: E402
from kroxis_trader.presets import KROXIS        # noqa: E402

ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT = os.path.join(ROOT, "reports", "model")
TEST_START = pd.Timestamp("2023-01-01")


def load(name, path, with_sector):
    p = load_saved_panel(os.path.join(ROOT, path))
    stocks = [s for s in p.symbols if s not in INDEX_SYMBOLS and s not in EXCLUDE
              and (not with_sector or p.sectors.get(s))]
    return p, st.build_features(p, stocks)


def fit_predict(kind, train, test):
    m = mdl.make_model(kind)
    m.fit(train[mdl.FEATURES], train["win"])
    return m, m.predict_proba(test[mdl.FEATURES])[:, 1]


def main():
    os.makedirs(OUT, exist_ok=True)
    t0 = time.time()
    res = {"features": mdl.FEATURES, "preset": "kroxis (3x ATR stop)"}

    # ---- signal datasets -------------------------------------------------
    p2, f2 = load("allus", "data/panel_2004_2017.parquet", False)
    d2 = mdl.build_dataset(f2, p2, KROXIS, start_idx=252, name="2006-2017")
    del p2, f2
    p1, f1 = load("sp1500", "data/panel.parquet", True)
    d1 = mdl.build_dataset(f1, p1, KROXIS, start_idx=252, name="2020-2026")
    data = pd.concat([d2, d1], ignore_index=True)
    data.to_parquet(os.path.join(ROOT, "data", "signal_dataset.parquet"))
    print(f"dataset: {len(data)} trades ({time.time() - t0:.0f}s)")
    res["dataset"] = {k: int(v) for k, v in data.groupby("dataset").size().items()}

    # ---- 1) choose the model type on a validation period -----------------
    tr, va = d2, d1[d1.date < TEST_START]
    val = {}
    for kind in ("logit", "gbm"):
        _, p = fit_predict(kind, tr, va)
        val[kind] = mdl.evaluate(va.win.values, p, va.ret.values, va.r.values, tr.win.mean())
        print(f"validation {kind}: AUC={val[kind]['auc']:.3f} skill={val[kind]['brier_skill']:.3f}")
    kind = max(val, key=lambda k: val[k]["auc"])
    res["validation"] = {k: {x: v[x] for x in ("auc", "brier_skill", "n")} for k, v in val.items()}
    res["chosen_model"] = kind

    # ---- 2) main out-of-sample test: 2023-2026 ---------------------------
    train = data[(data.dataset == "2006-2017") | (data.date < TEST_START)]
    test = data[(data.dataset == "2020-2026") & (data.date >= TEST_START)]
    model, p_test = fit_predict(kind, train, test)
    p_train = model.predict_proba(train[mdl.FEATURES])[:, 1]
    thr = float(np.median(p_train))
    res["test_2023_2026"] = mdl.evaluate(test.win.values, p_test, test.ret.values,
                                         test.r.values, train.win.mean())
    res["test_2023_2026"]["by_strategy"] = {}
    for s in ("minervini", "oneil"):
        mk = (test.strategy == s).values
        res["test_2023_2026"]["by_strategy"][s] = {
            "all": {"n": int(mk.sum()), "win_rate": float(test.win.values[mk].mean()),
                    "avg_return": float(test.ret.values[mk].mean())},
            "top_half": {"n": int((mk & (p_test >= thr)).sum()),
                         "win_rate": float(test.win.values[mk & (p_test >= thr)].mean()),
                         "avg_return": float(test.ret.values[mk & (p_test >= thr)].mean())},
            "bottom_half": {"n": int((mk & (p_test < thr)).sum()),
                            "win_rate": float(test.win.values[mk & (p_test < thr)].mean()),
                            "avg_return": float(test.ret.values[mk & (p_test < thr)].mean())},
        }
    res["threshold_top_half"] = thr
    print(f"test 2023-26: AUC={res['test_2023_2026']['auc']:.3f} "
          f"skill={res['test_2023_2026']['brier_skill']:.3f} thr={thr:.3f}")

    # ---- 3) second test: 2006-2011 -> 2012-2017 ---------------------------
    a = d2[d2.date < pd.Timestamp("2012-01-01")]
    b = d2[d2.date >= pd.Timestamp("2012-01-01")]
    _, pb = fit_predict(kind, a, b)
    res["test_2012_2017"] = mdl.evaluate(b.win.values, pb, b.ret.values, b.r.values, a.win.mean())
    print(f"test 2012-17: AUC={res['test_2012_2017']['auc']:.3f}")

    # ---- 4) portfolio on 2023-2026 with and without the model ------------
    sigs = {k: v["signals"](f1) for k, v in KROXIS.items()}
    signals_today = sum(s["entry"].sum(axis=1) for s in sigs.values()).astype(float)
    fa = mdl.feature_arrays(f1, p1.close["SPY"], p1.volume["SPY"])
    start = int(np.searchsorted(f1.mkt.dates, TEST_START))
    res["portfolio_2023_2026"] = {}
    curves = {}
    spy = p1.close["SPY"].reindex(f1.mkt.dates).iloc[start:]
    curves["SPY buy & hold"] = 100_000 * spy / spy.iloc[0]
    res["portfolio_2023_2026"]["SPY"] = me.equity_stats(curves["SPY buy & hold"])
    for k, cfg in KROXIS.items():
        sig = sigs[k]
        ii, jj = np.nonzero(sig["entry"])
        X = mdl.cell_features(fa, f1, ii, jj, k, signals_today, sig["pivot"])
        prob = np.zeros(sig["entry"].shape)
        prob[ii, jj] = model.predict_proba(X)[:, 1]
        filtered = {**sig, "entry": sig["entry"] & (prob >= thr), "rank": prob}
        for label, s in ((f"{k}: all signals", sig), (f"{k}: model top half", filtered)):
            pr = en.backtest_portfolio(f1.mkt, s, cfg["rules"], en.PortfolioConfig(), start_idx=start)
            tdf = me.trades_frame(pr.trades, f1.mkt.dates)
            ts = me.trade_stats(tdf)
            res["portfolio_2023_2026"][label] = {**me.equity_stats(pr.equity, pr.exposure),
                                                 "trades": ts["trades"], "win_rate": ts["win_rate"],
                                                 "win_rate_ci95": ts["win_rate_ci95"]}
            curves[label] = pr.equity
            print(f"  {label}: CAGR={res['portfolio_2023_2026'][label]['cagr']*100:.1f}% "
                  f"win={ts['win_rate']*100:.1f}% n={ts['trades']}")

    # ---- 5) the model had no reliable edge, so the daily scan uses a plain
    # lookup table instead: historical win rate by strategy and breakout
    # volume (the one factor that pointed the same way in most periods).
    res["winrate_table"] = winrate_table(data)
    os.makedirs(os.path.join(ROOT, "models"), exist_ok=True)
    with open(os.path.join(ROOT, "models", "winrate_table.json"), "w") as fh:
        json.dump(res["winrate_table"], fh, indent=1)
    # what drives the model (permutation importance on the test period)
    from sklearn.inspection import permutation_importance
    pi = permutation_importance(model, test[mdl.FEATURES], test["win"], scoring="roc_auc",
                                n_repeats=5, random_state=0)
    res["feature_importance"] = dict(sorted(zip(mdl.FEATURES, pi.importances_mean.round(4)),
                                            key=lambda x: -x[1]))
    with open(os.path.join(OUT, "results.json"), "w") as fh:
        json.dump(json.loads(json.dumps(res, default=lambda o: o.tolist() if hasattr(o, "tolist") else str(o))),
                  fh, indent=1)
    plot(res, curves)
    print(f"done in {time.time() - t0:.0f}s")


VOL_BUCKETS = [(1.0, 2.0, "1.4-2x"), (2.0, 3.0, "2-3x"), (3.0, np.inf, "3x+")]


def winrate_table(data: pd.DataFrame) -> dict:
    out = {}
    for s, g in data.groupby("strategy"):
        rows = {"all": g}
        for lo, hi, name in VOL_BUCKETS:
            rows[name] = g[(g.vol_ratio >= lo) & (g.vol_ratio < hi)]
        out[s] = {}
        for name, x in rows.items():
            ci = me.wilson_interval(int(x.win.sum()), len(x))
            out[s][name] = {"n": int(len(x)), "win_rate": float(x.win.mean()),
                            "ci95": [float(ci[0]), float(ci[1])],
                            "avg_return": float(x.ret.mean()),
                            "avg_win": float(x.ret[x.ret > 0].mean()),
                            "avg_loss": float(x.ret[x.ret <= 0].mean()),
                            "median_days": float(x.days.median())}
    return out


def plot(res, curves):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    fig, (a1, a2) = plt.subplots(1, 2, figsize=(12, 4.6))
    for key, col, lbl in (("test_2023_2026", "#1f6feb", "2023-2026"),
                          ("test_2012_2017", "#d1242f", "2012-2017")):
        q = res[key]["quintiles"]
        x = [b["predicted"] * 100 for b in q]
        y = [b["actual_win_rate"] * 100 for b in q]
        lo = [(b["actual_win_rate"] - b["actual_ci95"][0]) * 100 for b in q]
        hi = [(b["actual_ci95"][1] - b["actual_win_rate"]) * 100 for b in q]
        a1.errorbar(x, y, yerr=[lo, hi], fmt="o-", color=col, capsize=3, label=f"test {lbl}")
    lim = [10, 65]
    a1.plot(lim, lim, ls="--", color="#999", lw=1, label="perfect")
    a1.set_xlim(lim); a1.set_ylim(lim)
    a1.set_xlabel("Predicted win probability (%)"); a1.set_ylabel("Actual win rate (%)")
    a1.set_title("Calibration: predicted vs actual (by fifths)")
    a1.legend(fontsize=8, frameon=False); a1.grid(alpha=0.2)
    colors = ["#888888", "#9ec5fe", "#1f6feb", "#f5a3a8", "#d1242f"]
    for (name, eq), col in zip(curves.items(), colors):
        a2.plot(eq.index, eq.values / 1000, label=name, color=col, lw=1.4)
    a2.set_title("Portfolio 2023-2026 (unseen years)")
    a2.set_ylabel("Equity ($k)"); a2.legend(fontsize=7, frameon=False); a2.grid(alpha=0.2)
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, "model.png"), dpi=110)


if __name__ == "__main__":
    main()
