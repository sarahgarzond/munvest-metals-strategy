"""Monthly data refresh for the Munvest Metal Atlas.

Pulls two public sources and writes data/live.json, which metal-atlas.html
reads on load (the page keeps its built-in data as a fallback).

1. World Bank Commodity Price Data ("Pink Sheet"), monthly workbook: no key.
   Nickel, aluminium and copper in USD per tonne.
2. UN Comtrade API, annual trade by country: needs a free key in the
   COMTRADE_KEY secret. Skipped (old values kept) when the key is missing.
   HS 8411 jet engines and gas turbines (exports),
   HS 902131 artificial joints (exports and imports).

Each source fails on its own: a failed source keeps last month's values and
is reported in pipeline/last_run.md, which becomes the pull request text.
"""
from __future__ import annotations

import datetime as dt
import io
import json
import os
import re
import sys
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "live.json"
REPORT = ROOT / "pipeline" / "last_run.md"
UA = {"User-Agent": "munvest-metal-atlas-data-refresh"}
WB_PAGE = "https://www.worldbank.org/en/research/commodity-markets"
COMTRADE = "https://comtradeapi.un.org/data/v1/get/C/A/HS"
PRICE_COLS = {"ni": "Nickel", "al": "Aluminum", "cu": "Copper"}
TRADE = {  # key -> (HS code, flow, label)
    "hs8411_x": ("8411", "X", "Jet engine & gas turbine exports (HS 8411)"),
    "hs902131_x": ("902131", "X", "Artificial joint exports (HS 902131)"),
    "hs902131_m": ("902131", "M", "Artificial joint imports (HS 902131)"),
}
JUMP = 0.5  # flag changes above 50% for a human to check


# ---------------- World Bank Pink Sheet ----------------
def find_wb_url(html: str) -> str:
    m = re.search(r'href="([^"]*CMO-Historical-Data-Monthly\.xlsx)"', html, re.I)
    if not m:
        raise ValueError("monthly workbook link not found on the World Bank page")
    url = m.group(1)
    return url if url.startswith("http") else "https://www.worldbank.org" + url


def parse_pink_sheet(xlsx: bytes) -> dict:
    """Return {key: {"month": "2026-09", "usd_t": float, "yoy": float|None}}."""
    from openpyxl import load_workbook

    wb = load_workbook(io.BytesIO(xlsx), read_only=True, data_only=True)
    ws = next((wb[n] for n in wb.sheetnames if n.strip().lower() == "monthly prices"), None)
    if ws is None:
        raise ValueError(f"no 'Monthly Prices' sheet (found {wb.sheetnames})")
    rows = list(ws.iter_rows(values_only=True))
    head_i = next(i for i, r in enumerate(rows[:15])
                  if r and any(str(c).strip() == "Nickel" for c in r if c))
    head = [str(c).strip() if c else "" for c in rows[head_i]]
    units = [str(c).strip() if c else "" for c in rows[head_i + 1]]
    data = [r for r in rows[head_i + 1:] if r and re.fullmatch(r"\d{4}M\d{2}", str(r[0] or "").strip())]
    out = {}
    for key, name in PRICE_COLS.items():
        j = head.index(name)
        if "mt" not in units[j].lower():
            raise ValueError(f"unexpected unit for {name}: {units[j]!r}")
        series = [(str(r[0]).strip(), r[j]) for r in data if isinstance(r[j], (int, float))]
        if len(series) < 13:
            raise ValueError(f"too few months for {name}")
        (m, v), (m12, v12) = series[-1], series[-13]
        out[key] = {"name": name, "month": f"{m[:4]}-{m[5:]}", "usd_t": round(float(v), 1),
                    "yoy": round(float(v) / float(v12) - 1, 4) if v12 else None}
    return out


def fetch_prices() -> dict:
    page = requests.get(WB_PAGE, headers=UA, timeout=60)
    page.raise_for_status()
    url = find_wb_url(page.text)
    xl = requests.get(url, headers=UA, timeout=120)
    xl.raise_for_status()
    return {"source": url, "series": parse_pink_sheet(xl.content)}


# ---------------- UN Comtrade ----------------
def parse_comtrade(payload: dict) -> tuple[dict, dict]:
    """World totals per reporter -> ({ISO3: USD}, {ISO3: name})."""
    vals, names = {}, {}
    for r in payload.get("data") or []:
        iso = r.get("reporterISO") or ""
        if not re.fullmatch(r"[A-Z]{3}", iso) or iso.startswith(("W0", "X")):
            continue  # skip aggregates such as World or 'areas nes'
        if r.get("partnerCode") not in (0, None) or r.get("partner2Code") not in (0, None):
            continue
        if r.get("customsCode") not in ("C00", None) or r.get("motCode") not in (0, None):
            continue
        v = r.get("primaryValue")
        if isinstance(v, (int, float)) and v > 0:
            vals[iso] = max(vals.get(iso, 0), float(v))
            names[iso] = r.get("reporterDesc") or iso
    return vals, names


def fetch_trade(key: str) -> dict:
    out, names = {}, {}
    year0 = dt.date.today().year - 1
    for k, (hs, flow, label) in TRADE.items():
        for year in (year0, year0 - 1):  # latest year with broad coverage
            r = requests.get(COMTRADE, headers={**UA, "Ocp-Apim-Subscription-Key": key}, timeout=120,
                             params={"cmdCode": hs, "flowCode": flow, "partnerCode": 0,
                                     "period": year, "includeDesc": "true"})
            r.raise_for_status()
            vals, nm = parse_comtrade(r.json())
            if len(vals) >= 30:
                out[k] = {"label": f"{label}, {year}", "year": year, "unit": "USD", "d": vals}
                names.update(nm)
                break
        else:
            raise ValueError(f"{k}: fewer than 30 reporting countries in {year0} and {year0 - 1}")
    return {"series": out, "names": names}


# ---------------- validation and report ----------------
def compare(old: dict, new: dict, report: list):
    for k, s in new.get("prices", {}).get("series", {}).items():
        o = old.get("prices", {}).get("series", {}).get(k)
        line = f"- {s['name']}: USD {s['usd_t']:,.0f}/t ({s['month']})"
        if o and o.get("usd_t"):
            ch = s["usd_t"] / o["usd_t"] - 1
            line += f", {ch:+.1%} vs last run" + ("  **check: large jump**" if abs(ch) > JUMP else "")
        report.append(line)
    for k, s in new.get("trade", {}).get("series", {}).items():
        o = old.get("trade", {}).get("series", {}).get(k, {})
        flags = [iso for iso, v in s["d"].items() if o.get("d", {}).get(iso) and abs(v / o["d"][iso] - 1) > JUMP]
        top = sorted(s["d"].items(), key=lambda x: -x[1])[:3]
        report.append(f"- {s['label']}: {len(s['d'])} countries; top "
                      + ", ".join(f"{i} USD {v / 1e9:.1f} bn" for i, v in top)
                      + (f"  **check: >50% change for {', '.join(flags[:8])}**" if flags else ""))


def main() -> int:
    old = json.loads(OUT.read_text()) if OUT.exists() else {}
    new = {k: old[k] for k in ("prices", "trade") if k in old}
    status, report = {}, []
    try:
        new["prices"] = {**fetch_prices(), "fetched": dt.date.today().isoformat()}
        status["World Bank Pink Sheet"] = "updated"
    except Exception as e:  # keep last values
        status["World Bank Pink Sheet"] = f"failed, kept previous values ({e})"
    key = os.environ.get("COMTRADE_KEY", "").strip()
    if key:
        try:
            new["trade"] = {**fetch_trade(key), "fetched": dt.date.today().isoformat()}
            status["UN Comtrade"] = "updated"
        except Exception as e:
            status["UN Comtrade"] = f"failed, kept previous values ({e})"
    else:
        status["UN Comtrade"] = "skipped: no COMTRADE_KEY secret set"
    if not any(v == "updated" for v in status.values()):
        print("\n".join(f"{k}: {v}" for k, v in status.items()))
        return 1
    new["updated"] = dt.date.today().isoformat()
    new["sources"] = {"WB_PINK": ["World Bank", "Commodity Price Data (Pink Sheet), monthly", WB_PAGE],
                      "COMTRADE": ["UN Comtrade", "Trade data API, annual, world partner",
                                   "https://comtradeplus.un.org/"]}
    compare(old, new, report)
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(new, indent=1, ensure_ascii=False) + "\n")
    REPORT.write_text(
        f"Automatic data refresh, {new['updated']}.\n\n**Sources**\n"
        + "".join(f"- {k}: {v}\n" for k, v in status.items())
        + "\n**What changed**\n" + ("\n".join(report) or "- nothing new") + "\n\n"
        "Check flagged lines against the source before merging. Merging updates the atlas.\n")
    print(REPORT.read_text())
    return 0


if __name__ == "__main__":
    sys.exit(main())
