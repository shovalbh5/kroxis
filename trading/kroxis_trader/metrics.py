"""Performance statistics for trades and equity curves."""
from __future__ import annotations

import math

import numpy as np
import pandas as pd


def wilson_interval(wins: int, n: int, z: float = 1.96) -> tuple[float, float]:
    """95% confidence interval for a win rate."""
    if n == 0:
        return (float("nan"), float("nan"))
    p = wins / n
    den = 1 + z * z / n
    mid = (p + z * z / (2 * n)) / den
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / den
    return (mid - half, mid + half)


def trades_frame(trades, dates) -> pd.DataFrame:
    rows = [{
        "symbol": t.symbol,
        "entry_date": dates[t.entry_idx],
        "exit_date": dates[t.exit_idx],
        "entry": t.entry_price, "exit": t.exit_price, "stop0": t.stop0,
        "ret": t.ret, "r": t.r_multiple, "days": t.exit_idx - t.entry_idx,
        "reason": t.reason, "shares": t.shares, "rs": t.signal_rank,
    } for t in trades]
    return pd.DataFrame(rows)


def trade_stats(df: pd.DataFrame) -> dict:
    n = len(df)
    if n == 0:
        return {"trades": 0}
    r = df["ret"].values
    wins, losses = r[r > 0], r[r <= 0]
    lo, hi = wilson_interval(len(wins), n)
    gross_win, gross_loss = wins.sum(), -losses.sum()
    rm = df["r"].replace([np.inf, -np.inf], np.nan).dropna()
    return {
        "trades": n,
        "win_rate": len(wins) / n,
        "win_rate_ci95": (lo, hi),
        "avg_win": wins.mean() if len(wins) else 0.0,
        "avg_loss": losses.mean() if len(losses) else 0.0,
        "payoff_ratio": (wins.mean() / -losses.mean()) if len(wins) and len(losses) and losses.mean() < 0 else float("nan"),
        "profit_factor": gross_win / gross_loss if gross_loss > 0 else float("inf"),
        "expectancy": r.mean(),
        "expectancy_ci95": _mean_ci(r),
        "expectancy_r": rm.mean() if len(rm) else float("nan"),
        "median_days": float(np.median(df["days"])),
        "best": r.max(), "worst": r.min(),
        "exit_reasons": df["reason"].value_counts(normalize=True).round(3).to_dict(),
    }


def _mean_ci(x: np.ndarray, n_boot: int = 2000, seed: int = 0) -> tuple[float, float]:
    """Bootstrap 95% interval for the average trade return."""
    if len(x) < 5:
        return (float("nan"), float("nan"))
    rng = np.random.default_rng(seed)
    means = rng.choice(x, size=(n_boot, len(x)), replace=True).mean(axis=1)
    return (float(np.percentile(means, 2.5)), float(np.percentile(means, 97.5)))


def equity_stats(eq: pd.Series, exposure: pd.Series | None = None) -> dict:
    eq = eq.dropna()
    if len(eq) < 2:
        return {}
    rets = eq.pct_change().dropna()
    years = (eq.index[-1] - eq.index[0]).days / 365.25
    cagr = (eq.iloc[-1] / eq.iloc[0]) ** (1 / years) - 1 if years > 0 else float("nan")
    dd = eq / eq.cummax() - 1
    sharpe = rets.mean() / rets.std() * math.sqrt(252) if rets.std() > 0 else float("nan")
    downside = rets[rets < 0].std()
    sortino = rets.mean() / downside * math.sqrt(252) if downside > 0 else float("nan")
    out = {
        "start": str(eq.index[0].date()), "end": str(eq.index[-1].date()),
        "total_return": eq.iloc[-1] / eq.iloc[0] - 1,
        "cagr": cagr, "max_drawdown": dd.min(),
        "volatility": rets.std() * math.sqrt(252),
        "sharpe": sharpe, "sortino": sortino,
        "calmar": cagr / -dd.min() if dd.min() < 0 else float("nan"),
    }
    if exposure is not None:
        out["avg_exposure"] = float(exposure.mean())
    return out


def yearly_returns(eq: pd.Series) -> pd.Series:
    eq = eq.dropna()
    year_end = eq.groupby(eq.index.year).last()
    first = eq.iloc[0]
    prev = year_end.shift(1)
    prev.iloc[0] = first
    return year_end / prev - 1
