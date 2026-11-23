"""Sector Research Tracker -> tracker-data.js

The team's Google Sheet is the single source for the scenario calculator. This script
reads the sheet (xlsx export) and writes `tracker-data.js`, a plain JavaScript file the
dashboard loads before scenarios.js. Nothing is invented here: every number comes from a
tracker cell, and every row keeps its Source ID or source label.

Usage
  python pipeline/tracker.py                       # download the shared sheet (needs network)
  python pipeline/tracker.py --xlsx tracker.xlsx   # use a local export (File > Download > xlsx)

The sheet is shared as "anyone with the link can view", so the export URL needs no login.
"""

import argparse
import io
import json
import re
import sys
from datetime import date
from pathlib import Path

import openpyxl

SHEET_ID = "1SCXxEVCGfsQZd6ctvV5DoPF-qMtP3OHeX9poOTXzQT0"
EXPORT_URL = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=xlsx"
OUT = Path(__file__).resolve().parent.parent / "tracker-data.js"

# Tracker sector names -> dashboard industry keys (scenarios.js SCN_INDUSTRIES).
SECTOR_KEYS = {
    "Aerospace": "aero",
    "Automotive": "auto",
    "Oil & Gas": "og",
    "Medical Technology": "med",
    "Environmental / Energy Technology": "energy",
    "Chemical Process Industry": "chem",
    "Electronics & Electrical Engineering": "elec",
}

# Tracker material families -> dashboard metal names.
MATERIALS = {
    "Nickel and nickel alloys": "Nickel",
    "Cobalt alloys": "Cobalt",
    "Zirconium": "Zirconium",
    "Specialty stainless steels": "Specialty stainless",
    "Aluminium and aluminium alloys": "Aluminium",
    "Copper and copper alloys": "Copper",
    "Chromium": "Chromium",
    "Molybdenum": "Molybdenum",
    "Titanium": "Titanium",
    "Tungsten": "Tungsten",
    "Manganese": "Manganese",
}

# Source labels used in summary tabs that correspond to one Source Log entry.
LABEL_SOURCES = {
    ("USGS 2026", "Nickel"): "S001", ("USGS 2026", "Cobalt"): "S010", ("USGS 2026", "Chromium"): "S118",
    ("USGS 2026", "Molybdenum"): "S119", ("USGS 2026", "Tungsten"): "S120", ("USGS 2026", "Zirconium"): "S121",
    ("USGS 2026", "Copper"): "S124", ("USGS 2026", "Aluminium"): "S125", ("USGS 2026", "Manganese"): "S126",
    ("IEA explorer 2026", None): "S038", ("IEA 2026", None): "S038",
}

# IEA demand components that belong to an industry in the scenario model.
IEA_USES = {
    "Electric vehicles": "ev", "Grid battery storage": "energy", "Solar PV": "energy", "Wind": "energy",
    "Other low emissions power": "energy", "Hydrogen technologies": "energy", "Electricity networks": "energy",
}

MASS_UNITS = {"t", "kt", "Mt"}


def text(value):
    if value is None:
        return ""
    if isinstance(value, float) and value.is_integer():
        value = int(value)
    return str(value).strip()


def number(value):
    """Parse '23,310.0', '~5,290', 3900000 -> float; '>140,000' or '' -> None."""
    if value is None or value == "":
        return None
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value).strip().replace(",", "").replace("~", "").replace("%", "")
    try:
        return float(s)
    except ValueError:
        return None


def rows_of(wb, name):
    # xlsx export cuts sheet names to 31 characters
    sheet = next(ws for ws in wb.worksheets if name.startswith(ws.title) or ws.title == name)
    return [tuple(r) + (None,) * (30 - len(r)) for r in sheet.iter_rows(values_only=True)]


def source_ids(value):
    return re.findall(r"S\d{3}", text(value))


def label_source(label, metal=None):
    return LABEL_SOURCES.get((label, metal)) or LABEL_SOURCES.get((label, None))


def parse_sources(wb):
    rows = rows_of(wb, "Source Log")
    head = next(i for i, r in enumerate(rows) if text(r[0]) == "ID")
    out = {}
    for r in rows[head + 1:]:
        sid = text(r[0])
        if not re.fullmatch(r"S\d{3}", sid):
            continue
        out[sid] = {"name": text(r[1]), "publisher": text(r[2]), "year": text(r[3]), "url": text(r[5]),
                    "accessed": text(r[7]), "limits": text(r[9])}
    return out


def parse_database(wb):
    rows = rows_of(wb, "Database")
    out = []
    for r in rows[1:]:
        if not text(r[0]):
            continue
        out.append({"sector": text(r[0]), "material": text(r[1]), "form": text(r[2]), "application": text(r[3]),
                    "region": text(r[4]), "metric": text(r[5]), "year": int(number(r[6]) or 0), "value": number(r[7]),
                    "unit": text(r[8]), "type": text(r[9]), "sources": source_ids(r[10]), "confidence": text(r[11]),
                    "note": text(r[12]) if len(r) > 12 else ""})
    return out


def parse_applications(wb):
    rows = rows_of(wb, "material-product-industry-application")
    out, material, form, industry = [], "", "", ""
    for r in rows[1:]:
        if not any(text(c) for c in r[:5]):
            continue
        material = text(r[0]) or material
        industry = text(r[2]) or industry
        form = text(r[1]) or form
        app = text(r[3])
        m = re.match(r"\[([^\]]+)\]\s*(.*)", app)
        out.append({"material": MATERIALS.get(material, material), "form": form, "industry": industry,
                    "key": SECTOR_KEYS.get(industry, ""), "status": m.group(1) if m else "",
                    "use": m.group(2) if m else app, "source": text(r[4])})
    return out


def parse_country_production(wb):
    rows = rows_of(wb, "Country production")
    out, material, measure = [], "", ""
    for r in rows[1:]:
        if not text(r[2]):
            continue
        material = text(r[0]) or material
        measure = text(r[1]) or measure
        metal = MATERIALS.get(material, material)
        out.append({"metal": metal, "measure": measure, "country": text(r[2]), "y2024": number(r[3]),
                    "y2025": number(r[4]), "share": number(r[6]), "label": text(r[7]),
                    "source": label_source(text(r[7]), metal) or ""})
    return out


def parse_country_data(wb):
    rows = rows_of(wb, "Country Data (Aero & MedTech)")
    head = rows[0]
    columns = []
    for i, h in enumerate(head[3:15], start=3):
        m = re.match(r"(.*)\((S\d{3})\)\s*$", text(h))
        if not m:
            continue
        body, source = m.group(1).strip().rstrip(","), m.group(2)
        year = ""
        y = re.search(r",\s*(\d{4})$", body)
        if y:
            year, body = y.group(1), body[:y.start()]
        parts = body.rsplit(", ", 1)
        name, unit = (parts[0], parts[1]) if len(parts) == 2 else (body, "")
        columns.append((i, name.strip(), unit.strip(), year, source))
    indicators = [{"id": f"c{i}", "name": n, "unit": u, "year": y, "source": s} for i, n, u, y, s in columns]
    countries = []
    for r in rows[1:]:
        iso = text(r[1])
        if not re.fullmatch(r"[A-Z]{3}", iso):
            continue
        values = {f"c{i}": number(r[i]) for i, *_ in columns if number(r[i]) is not None}
        countries.append({"iso": iso, "name": text(r[0]), "region": text(r[2]), "values": values,
                          "note": text(r[15]) if len(r) > 15 else ""})
    return {"indicators": indicators, "countries": countries}


def parse_outlook(wb):
    rows = rows_of(wb, "2035 outlook")
    totals, components = [], []
    in_components = False
    for r in rows[1:]:
        first = text(r[0])
        if first.startswith("IEA demand components"):
            in_components = True
            continue
        if in_components:
            if first in ("Material", "") or not text(r[1]):
                continue
            components.append({"metal": first, "use": text(r[1]), "y2025": number(r[2]), "y2035": number(r[3]),
                               "unit": "kt", "label": text(r[4]), "source": label_source(text(r[4])) or ""})
            continue
        if first in MATERIALS and text(r[5]):
            metal = MATERIALS[first]
            totals.append({"metal": metal, "definition": text(r[1]), "y2025": number(r[2]), "y2035": number(r[3]),
                           "unit": text(r[5]), "basis": text(r[6]), "label": text(r[8]),
                           "source": label_source(text(r[8]), metal) or ""})
    return {"totals": totals, "components": components}


def parse_supplement(wb):
    """Metals supplement, section B: reserves, prices, end uses, import reliance and supply policy."""
    rows = rows_of(wb, "Metals supplement")
    start = next((i for i, r in enumerate(rows) if text(r[0]).startswith("B.")), None)
    out, metal = [], ""
    if start is None:
        return out
    for r in rows[start + 2:]:
        if text(r[0]).startswith("C."):
            break
        if not text(r[1]):
            continue
        metal = text(r[0]) or metal
        out.append({"metal": metal, "indicator": text(r[1]), "detail": text(r[2]), "y0": text(r[3]), "v0": number(r[4]),
                    "y1": text(r[5]), "v1": number(r[6]), "raw1": text(r[6]), "unit": text(r[7]), "why": text(r[8]),
                    "sources": source_ids(r[9]), "note": text(r[9])})
    return out


def slug(*parts):
    return re.sub(r"[^a-z0-9]+", "-", " ".join(parts).lower()).strip("-")[:48]


def build_events(database, outlook):
    """A 2035 event = a tracker series with a recent actual value and a 2035 value.
    The calculator lets the user replace the 2035 value; linked metal rows scale with it."""
    series = {}
    for row in database:
        if row["value"] is None or row["sector"] not in SECTOR_KEYS:
            continue
        if row["metric"] == "Metal demand" and row["unit"] in MASS_UNITS:
            continue  # metal tonnage is an output, linked below
        key = (row["sector"], row["application"], row["region"], row["unit"])
        series.setdefault(key, []).append(row)
    events = []
    for (sector, application, region, unit), rows in series.items():
        target = next((r for r in rows if r["year"] == 2035), None)
        base = max((r for r in rows if r["year"] <= 2026 and r["type"] == "Actual"), key=lambda r: r["year"], default=None)
        if not target or not base:
            continue
        key = "ev" if re.search(r"electric car", application, re.I) else SECTOR_KEYS[sector]
        sources = sorted(set(base["sources"] + target["sources"]))
        linked = [r for r in database if r["sector"] == sector and r["metric"] == "Metal demand"
                  and r["unit"] in MASS_UNITS and r["year"] == 2035 and set(r["sources"]) & set(target["sources"])]
        events.append({
            "id": slug(sector, application, region), "sector": sector, "key": key, "label": application,
            "region": region, "unit": unit, "kind": "activity",
            "base": {"year": base["year"], "value": base["value"], "type": base["type"], "sources": base["sources"]},
            "target": {"year": 2035, "value": target["value"], "type": target["type"], "sources": target["sources"],
                       "confidence": target["confidence"], "note": target["note"]},
            "sources": sources,
            "linked": [{"material": l["material"], "label": l["application"], "value": l["value"], "unit": l["unit"],
                        "type": l["type"], "sources": l["sources"]} for l in linked],
        })
    for c in outlook["components"]:
        key = IEA_USES.get(c["use"])
        if not key or not c["y2025"] or not c["y2035"] or max(c["y2025"], c["y2035"]) < 20:
            continue  # leave out components too small to move the result
        sector = "Automotive" if key == "ev" else "Environmental / Energy Technology"
        events.append({
            "id": slug("iea", c["metal"], c["use"]), "sector": sector, "key": key,
            "label": f"{c['metal']} used in {c['use'].lower()}", "region": "Global", "unit": "kt", "kind": "metal",
            "metal": c["metal"],
            "base": {"year": 2025, "value": c["y2025"], "type": "Actual", "sources": [c["source"]] if c["source"] else []},
            "target": {"year": 2035, "value": c["y2035"], "type": "Forecast (IEA STEPS)",
                       "sources": [c["source"]] if c["source"] else [], "confidence": "Medium", "note": c["label"]},
            "sources": [c["source"]] if c["source"] else [], "linked": [],
        })
    return events


def build(xlsx_bytes):
    wb = openpyxl.load_workbook(io.BytesIO(xlsx_bytes), data_only=True, read_only=True)
    database = parse_database(wb)
    outlook = parse_outlook(wb)
    data = {
        "sheet": f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit",
        "snapshot": date.today().isoformat(),
        "sectors": SECTOR_KEYS,
        "sources": parse_sources(wb),
        "database": database,
        "applications": parse_applications(wb),
        "production": parse_country_production(wb),
        "countryData": parse_country_data(wb),
        "outlook": outlook,
        "supplement": parse_supplement(wb),
        "events": build_events(database, outlook),
    }
    missing = sorted({s for e in data["events"] for s in e["sources"] if s not in data["sources"]})
    return data, missing


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--xlsx", help="local xlsx export of the tracker")
    args = parser.parse_args()
    if args.xlsx:
        raw = Path(args.xlsx).read_bytes()
    else:
        import requests
        response = requests.get(EXPORT_URL, timeout=60)
        response.raise_for_status()
        raw = response.content
    data, missing = build(raw)
    OUT.write_text("/* Generated by pipeline/tracker.py from the Sector Research Tracker. Do not edit by hand. */\n"
                   "var TRACKER = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"tracker-data.js: {len(data['events'])} events, {len(data['database'])} database rows, "
          f"{len(data['applications'])} applications, {len(data['sources'])} sources")
    if missing:
        print("Source IDs used but missing from the Source Log:", ", ".join(missing), file=sys.stderr)


if __name__ == "__main__":
    main()
