"""Build the Kroxis app as ONE self-contained HTML file.

    python scripts/build_app_html.py            # -> app/kroxis_app.html

The file holds the same page as the Claude dashboard (app/dashboard_page.html),
all its data (exported by export_dashboard.py) and the d3 charting library,
so it opens in any browser, also offline. A small stand-in for the
dashboard's `dash` functions serves the embedded data to the page.
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile

ROOT = os.path.join(os.path.dirname(__file__), "..")
APP = os.path.join(ROOT, "app")
DATASETS = ["scan", "market", "prices", "accounts", "orders", "positions", "equity",
            "yearly", "pertrade", "portfolio", "stops", "calibration", "volume"]

HEAD = """<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Kroxis Trader</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600&family=Frank+Ruhl+Libre:wght@400;500&display=swap">
<style>
  /* Theme tokens (the Claude dashboard supplies these itself). */
  :root {
    --font-anthropic-sans: "Assistant", system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
    --font-anthropic-serif: "Frank Ruhl Libre", Georgia, "Times New Roman", serif;
    --color-bg: #f6f7f9; --color-panel: #ffffff; --color-fg: #171a20; --color-fg-muted: #5c6370;
    --color-border-line: #e2e5ea; --color-ok: #1d8049; --color-warn: #a86d12; --color-bad: #c3303a;
    --cds-chart-muted: #9aa0ab; --cds-chart-grid: #eceef2; --cds-chart-axis: #c5cad3;
    --cds-chart-reference: #8a919c; --cds-chart-status-critical: #cf3f48;
    --cds-surface-popover: #ffffff; --cds-border: #dce0e6; --cds-shadow-popover: 0 6px 20px rgba(20, 24, 32, .14);
    --cds-text-secondary: #5c6370;
    --cds-font-size-caption: .8125rem; --cds-font-size-body: .9375rem; --cds-font-size-heading: 1.0625rem;
    --cds-font-size-title: 1.875rem; --cds-font-weight-medium: 600;
    --cds-gap-xs: .25rem; --cds-gap-sm: .5rem; --cds-gap-md: .875rem; --cds-gap-lg: 1.25rem; --cds-gap-xl: 2rem;
    --cds-pad-xs: .25rem; --cds-pad-sm: .5rem; --cds-pad-md: .875rem; --cds-pad-lg: 1.125rem; --cds-pad-xl: 2rem;
    --cds-radius: 8px; --cds-dur-slow: 300ms;
    color-scheme: light;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --color-bg: #0e1014; --color-panel: #161920; --color-fg: #e7e9ee; --color-fg-muted: #9aa1ad;
      --color-border-line: #2a2f38; --color-ok: #4cc27f; --color-warn: #e1a84b; --color-bad: #ef6b72;
      --cds-chart-muted: #6c7380; --cds-chart-grid: #222730; --cds-chart-axis: #3a404b;
      --cds-chart-reference: #8a919c; --cds-chart-status-critical: #ef6b72;
      --cds-surface-popover: #1c2028; --cds-border: #323844; --cds-shadow-popover: 0 6px 20px rgba(0, 0, 0, .45);
      --cds-text-secondary: #9aa1ad; color-scheme: dark;
    }
  }
  :root[data-theme="dark"] {
    --color-bg: #0e1014; --color-panel: #161920; --color-fg: #e7e9ee; --color-fg-muted: #9aa1ad;
    --color-border-line: #2a2f38; --color-ok: #4cc27f; --color-warn: #e1a84b; --color-bad: #ef6b72;
    --cds-chart-muted: #6c7380; --cds-chart-grid: #222730; --cds-chart-axis: #3a404b;
    --cds-chart-reference: #8a919c; --cds-chart-status-critical: #ef6b72;
    --cds-surface-popover: #1c2028; --cds-border: #323844; --cds-shadow-popover: 0 6px 20px rgba(0, 0, 0, .45);
    --cds-text-secondary: #9aa1ad; color-scheme: dark;
  }
  html { -webkit-text-size-adjust: 100%; }
  body { margin: 0; background: var(--color-bg); color: var(--color-fg); font-family: var(--font-anthropic-sans);
         font-size: var(--cds-font-size-body); line-height: 1.45;
         padding-block: max(20px, env(safe-area-inset-top, 0px)) max(32px, env(safe-area-inset-bottom, 0px));
         padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
  .kx-wrap { max-width: 1180px; margin-inline: auto; }
  [hidden] { display: none !important; }
</style>
"""

SHIM = r"""
(() => {
  // Stand-in for the Claude dashboard's `dash` functions, over the embedded data.
  const DATA = JSON.parse(document.getElementById('kx-data').textContent);
  const params = Object.assign({}, DATA._params || {});
  const draws = new Map(), calcs = new Map(), onData = [];
  const runDraw = (name) => {
    const fn = draws.get(name);
    document.querySelectorAll('[data-draw="' + name + '"]').forEach((el) => {
      if (el.closest('[hidden]')) return;
      try { fn(el); } catch (e) { console.error('draw ' + name, e); }
    });
  };
  const runAll = () => {
    onData.forEach((f) => { try { f(); } catch (e) { console.error(e); } });
    draws.forEach((_, n) => runDraw(n));
  };
  let queued = false;
  const schedule = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; runAll(); }); };
  window.dash = {
    colors: ['#3a6fd8', '#e0762a', '#2a9d74', '#a35bd4', '#d24a68', '#8b9136', '#2f9fb8', '#7d6b57'],
    data(id) {
      if (calcs.has(id)) {
        const c = calcs.get(id);
        return { status: 'ok', data: c.fn(...c.inputs.map((i) => DATA[i] || [])), refreshing: false, meta: [] };
      }
      return id in DATA ? { status: 'ok', data: DATA[id], refreshing: false, meta: [] } : { status: 'missing', data: [], meta: [] };
    },
    onData(fn) { onData.push(fn); try { fn(); } catch (e) { console.error(e); } },
    draw(name, fn) { draws.set(name, fn); },
    calc(id, spec) { calcs.set(id, spec); },
    loader() {},
    params() { return Object.assign({}, params); },
    setParams(p) { Object.assign(params, p); schedule(); },
    resetParams() { Object.keys(params).forEach((k) => delete params[k]); Object.assign(params, DATA._params || {}); schedule(); },
    setLink(name) { try { history.replaceState(null, '', '#' + name); } catch (e) { /* file:// may refuse */ } },
    refresh() {},
  };
  document.addEventListener('DOMContentLoaded', () => {
    runAll();
    const mo = new MutationObserver(schedule);
    document.querySelectorAll('.kx-page').forEach((s) => mo.observe(s, { attributes: true, attributeFilter: ['hidden'] }));
    let w = window.innerWidth;
    window.addEventListener('resize', () => { if (window.innerWidth !== w) { w = window.innerWidth; schedule(); } });
  });
})();
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", help="folder with the exported JSON files (default: export now)")
    ap.add_argument("--out", default=os.path.join(APP, "kroxis_app.html"))
    a = ap.parse_args()
    data_dir = a.data
    if not data_dir:
        data_dir = tempfile.mkdtemp(prefix="kx_app_")
        subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "export_dashboard.py"),
                        "--out", data_dir], check=True, stdout=subprocess.DEVNULL)
    data = {k: json.load(open(os.path.join(data_dir, f"{k}.json"))) for k in DATASETS}
    data["_params"] = {"period": "p2020", "strat": "minervini", "sym": ""}
    blob = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    page = open(os.path.join(APP, "dashboard_page.html")).read()
    page = page.replace('<meta name="dash-one-writer">\n', "")
    d3 = open(os.path.join(APP, "vendor", "d3.v7.9.0.min.js")).read()
    html = (HEAD
            + "<script>\n" + d3 + "\n</script>\n"
            + '<script id="kx-data" type="application/json">' + blob + "</script>\n"
            + "<script>" + SHIM + "</script>\n</head>\n<body>\n<main class=\"kx-wrap\">\n"
            + page + "\n</main>\n</body>\n</html>\n")
    with open(a.out, "w") as fh:
        fh.write(html)
    print(f"wrote {a.out} ({os.path.getsize(a.out) / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
