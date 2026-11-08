"""Print the key numbers from reports/<name>/results.json as Markdown tables.

    python scripts/summarize.py reports/sp1500_2020_2026 reports/allus_2006_2017
"""
import json
import os
import sys


def pct(x, d=1):
    return "–" if x is None else f"{x * 100:.{d}f}%"


def num(x, d=2):
    return "–" if x is None else f"{x:.{d}f}"


def main(dirs):
    for d in dirs:
        r = json.load(open(os.path.join(d, "results.json")))
        print(f"\n## {r['dataset']}  ({r['stocks']} stocks, {r['test_start']} → {r['test_end']})\n")
        print("| Strategy | Trades | Win rate (95% range) | Avg win | Avg loss | Profit factor | Avg trade |")
        print("|---|---|---|---|---|---|---|")
        for k, s in r["strategies"].items():
            a = s["all_signals"]
            ci = a["win_rate_ci95"]
            print(f"| {k} | {a['trades']} | {pct(a['win_rate'])} ({pct(ci[0])}–{pct(ci[1])}) | "
                  f"{pct(a['avg_win'])} | {pct(a['avg_loss'])} | {num(a['profit_factor'])} | "
                  f"{pct(a['expectancy'], 2)} |")
            for reg, c in s["random_control"].items():
                print(f"| ↳ random entries, market filter={reg} | 3000×5 | {pct(c['win_rate']['mean'])} "
                      f"({pct(c['win_rate']['min'])}–{pct(c['win_rate']['max'])}) | {pct(c['avg_win']['mean'])} | "
                      f"{pct(c['avg_loss']['mean'])} | {num(c['profit_factor']['mean'])} | "
                      f"{pct(c['expectancy']['mean'], 2)} |")
        print("\n| Strategy | Half | Trades | Win rate | Avg trade |")
        print("|---|---|---|---|---|")
        for k, s in r["strategies"].items():
            for h in ("first_half", "second_half"):
                a = s[h]
                print(f"| {k} | {h} | {a['trades']} | {pct(a['win_rate'])} | {pct(a['expectancy'], 2)} |")
        print("\n| Portfolio ($100k) | CAGR | Max drawdown | Sharpe | Trades | Win rate | Time invested |")
        print("|---|---|---|---|---|---|---|")
        for name, b in r["benchmarks"].items():
            print(f"| {name} | {pct(b['cagr'])} | {pct(b['max_drawdown'])} | {num(b['sharpe'])} | – | – | 100% |")
        for k, s in r["strategies"].items():
            p = s["portfolio"]
            rc = s["portfolio_random_control"]
            print(f"| {k} | {pct(p['cagr'])} | {pct(p['max_drawdown'])} | {num(p['sharpe'])} | "
                  f"{p['trades']} | {pct(p['win_rate'])} | {pct(p['avg_exposure'], 0)} |")
            print(f"| ↳ random entries, same rules | {pct(rc['cagr'])} | {pct(rc['max_drawdown'])} | "
                  f"{num(rc['sharpe'])} | | | |")
        for k, s in r["strategies"].items():
            print(f"\nStop study – {k}\n")
            print("| Stop | Win rate | Avg loss | Avg trade | Avg trade (R) | 1st half | 2nd half | Stopped, then back above entry within 20d | …and +10% | Portfolio CAGR | Max DD |")
            print("|---|---|---|---|---|---|---|---|---|---|---|")
            for name, v in s["stop_study"].items():
                print(f"| {name} | {pct(v['win_rate'])} | {pct(v['avg_loss'])} | {pct(v['expectancy'], 2)} | "
                      f"{num(v['expectancy_r'], 3)} | "
                      f"{pct(v['first_half_expectancy'], 2)} | {pct(v['second_half_expectancy'], 2)} | "
                      f"{pct(v.get('recovered_above_entry'))} | {pct(v.get('recovered_plus10'))} | "
                      f"{pct(v.get('portfolio_cagr'))} | {pct(v.get('portfolio_max_dd'))} |")
        print("\nYearly portfolio returns")
        years = sorted(r["benchmark_yearly"]["SPY"])
        print("| Year | SPY | " + " | ".join(r["strategies"]) + " |")
        print("|---|---|" + "---|" * len(r["strategies"]))
        for y in years:
            row = [pct(r["benchmark_yearly"]["SPY"][y])] + [pct(s["portfolio_yearly"].get(y)) for s in r["strategies"].values()]
            print(f"| {y[:4]} | " + " | ".join(row) + " |")


if __name__ == "__main__":
    main(sys.argv[1:])
