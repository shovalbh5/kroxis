"""Strategy presets shared by the backtest, the model and the daily scanner.

"book":   rules as written in the books (O'Neil: 7.5% stop, +20% target).
"kroxis": same entries, but a stop of 3x ATR (3 times the average daily
          range). In the stop-loss study this gave the smallest drawdown in
          all four tests (both books, both data sets).
"""
from . import engine as en
from . import strategies as st

BOOK = {
    "minervini": {
        "title": "Minervini SEPA (Trend Template + VCP breakout)",
        "signals": lambda f: st.minervini_signals(f, regime="trend200"),
        "regime": "trend200",
        "rules": en.ExitRules(stop_mode="structure", stop_pct=0.08,
                              breakeven_r=2.0, trail_sma50=True),
    },
    "oneil": {
        "title": "O'Neil CAN SLIM (price/volume rules: N, L, M)",
        "signals": lambda f: st.oneil_signals(f, regime="oneil"),
        "regime": "oneil",
        "rules": en.ExitRules(stop_mode="pct", stop_pct=0.075, target_pct=0.20,
                              oneil_8week=True, trail_sma50=True,
                              sma50_heavy_volume=True),
    },
}

KROXIS = {
    "minervini": {**BOOK["minervini"],
                  "rules": en.ExitRules(stop_mode="atr", stop_atr=3.0, stop_pct=0.08,
                                        breakeven_r=2.0, trail_sma50=True)},
    "oneil": {**BOOK["oneil"],
              "rules": en.ExitRules(stop_mode="atr", stop_atr=3.0, stop_pct=0.075,
                                    target_pct=0.20, oneil_8week=True,
                                    trail_sma50=True, sma50_heavy_volume=True)},
}

PRESETS = {"book": BOOK, "kroxis": KROXIS}
