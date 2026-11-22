"""Fetch public evidence and import publisher exports into the atlas."""
from __future__ import annotations

import csv
import datetime as dt
import json
import math
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

import requests

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "data" / "providers.json"
IMPORTS = ROOT / "pipeline" / "imports"
EUROSTAT = "https://ec.europa.eu/eurostat/api"
WHO = "https://ghoapi.azureedge.net/api"


def observation(metric, geography, period, value, unit, source_url, scenario=""):
    return dict(metric=metric, geography=geography, period=str(period), value=value,
                unit=unit, source_url=source_url, scenario=scenario)


def get_json(url, **params):
    response = requests.get(url, params=params, timeout=45)
    response.raise_for_status()
    return response.json(), response.url


def eurostat_rows(endpoint, metric, geography, unit_label, **params):
    data, url = get_json(f"{EUROSTAT}/{endpoint}", **params)
    if data["id"][-1] != "time" or any(size != 1 for size in data["size"][:-1]):
        raise ValueError("expected one series with time as its final dimension")
    index = data["dimension"]["time"]["category"]["index"]
    values = data["value"]
    statuses = data.get("status", {})
    return [
        {**observation(metric, geography, year, values[str(position)], unit_label, url),
         "flag": statuses.get(str(position), "")}
        for year, position in index.items()
        if str(position) in values and isinstance(values[str(position)], (int, float))
    ]


def fetch_eurostat():
    return eurostat_rows(
        "dissemination/statistics/1.0/data/sts_inpr_a",
        "Basic metals output (NACE C24, calendar adjusted)", "EU27_2020", "index (2021=100)",
        freq="A", geo="EU27_2020", nace_r2="C24", unit="I21", s_adj="CA", sinceTimePeriod=2015,
    )


def fetch_prodcom():
    rows = []
    for code, metric in [
        ("24421130", "Unwrought non-alloy aluminium"),
        ("24441330", "Unwrought unalloyed refined copper"),
        ("24451100", "Unwrought nickel"),
    ]:
        rows.extend(eurostat_rows(
            "comext/dissemination/statistics/1.0/data/ds-059358",
            f"{metric} sold production ({code})", "EU27_2020", "EUR",
            reporter="EU27_2020", product=code, indicators="PRODVAL", sinceTimePeriod=2021,
        ))
    return rows


def fetch_who():
    rows = []
    for code, metric in [
        ("DEVICES17", "National procurement of medical devices"),
        ("DEVICES18", "National list of approved medical devices"),
    ]:
        data, url = get_json(f"{WHO}/{code}")
        while True:
            rows.extend(
                observation(metric, item["SpatialDim"], item["TimeDim"], item["Value"], "reported response", url)
                for item in data["value"]
                if item["SpatialDimType"] == "COUNTRY" and item["TimeDim"] and item["Value"]
            )
            next_page = data.get("@odata.nextLink")
            if not next_page:
                break
            if urlsplit(next_page).netloc != urlsplit(WHO).netloc:
                raise ValueError("unexpected WHO pagination host")
            data, _ = get_json(next_page)
    return rows


def fetch_icao():
    rows = []
    for code, metric, unit in [
        ("IS.AIR.PSGR", "Air passengers carried", "passengers"),
        ("IS.AIR.DPRT", "Registered carrier departures", "departures"),
    ]:
        data, url = get_json(
            f"https://api.worldbank.org/v2/country/WLD;USA;DEU;CHN/indicator/{code}",
            format="json", date=f"2010:{dt.date.today().year}", per_page=100,
        )
        rows.extend(
            observation(metric, item["country"]["value"], item["date"], item["value"], unit, url)
            for item in data[1] if item["value"] is not None
        )
    return rows


def fetch_iea_minerals():
    outlook = "https://www.iea.org/reports/global-critical-minerals-outlook-2026/outlook"
    prefix = "expected-mine-supply-from-existing-and-announced-projects-and-primary-supply-requirements-for-"
    units = {"Copper": "Mt", "Cobalt": "kt", "Nickel": "Mt"}
    charts = {}

    class ChartParser(HTMLParser):
        def handle_starttag(self, tag, attributes):
            attrs = dict(attributes)
            identifier = attrs.get("data-chart-identifier", "")
            if identifier.startswith(prefix) and attrs.get("data-chart-csv"):
                charts[identifier] = attrs

    response = requests.get(outlook, timeout=45)
    response.raise_for_status()
    ChartParser().feed(response.text)
    rows = []
    for metal, unit in units.items():
        identifier = prefix + metal.lower() + "-by-scenario-2035"
        chart = charts[identifier]
        if chart.get("data-chart-units") != unit:
            raise ValueError(f"unexpected IEA chart unit for {metal}")
        csv_rows = list(csv.reader(chart["data-chart-csv"].splitlines(), delimiter=";"))
        titles = [column.strip() for column in csv_rows[0]]
        data = {row[0].strip(): dict(zip(titles[1:], map(lambda cell: float(cell.strip()), row[1:])))
                for row in csv_rows[1:] if row}
        supply = data["Expected supply"]
        requirement = data["Primary supply requirements"]
        base = supply["Base case"]
        cps = requirement["CPS"]
        steps = cps + requirement["Additional in STEPS"]
        hds = steps + requirement["Additional in HDS"]
        source = "https://www.iea.org/data-and-statistics/charts/" + identifier
        values = [
            ("Expected mine supply", "Base case", base),
            ("Expected mine supply", "High-production case", base + supply["High-production case"]),
            ("Primary supply requirements", "CPS", cps),
            ("Primary supply requirements", "STEPS", steps),
            ("Primary supply requirements", "HDS", hds),
        ]
        if any(not math.isfinite(value) or value <= 0 for _, _, value in values):
            raise ValueError(f"unexpected value in IEA chart for {metal}")
        rows.extend(observation(f"{metal} — {metric}", "World", "2035", round(value, 3), unit, source, scenario)
                    for metric, scenario, value in values)
    return rows


def import_csv(path):
    required = ("metric", "geography", "period", "value", "unit", "source_url")
    seen = set()
    with path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        if not set(required).issubset(reader.fieldnames or ()):
            raise ValueError("expected columns " + ", ".join(required))
        for line, row in enumerate(reader, 2):
            fields = {field: (row.get(field) or "").strip() for field in required}
            scenario = (row.get("scenario") or "").strip()
            url = urlsplit(fields["source_url"])
            if not all(fields.values()) or url.scheme != "https" or not url.hostname or url.username:
                raise ValueError(f"missing field or invalid publisher URL on row {line}")
            try:
                value = float(fields["value"])
            except ValueError:
                value = fields["value"]
            if isinstance(value, float) and not math.isfinite(value):
                raise ValueError(f"nonfinite value on row {line}")
            key = tuple(fields[field] for field in ("metric", "geography", "period", "unit")) + (scenario,)
            if key in seen:
                raise ValueError(f"duplicate observation on row {line}")
            seen.add(key)
            yield observation(fields["metric"], fields["geography"], fields["period"],
                              value, fields["unit"], fields["source_url"], scenario)


def refresh_providers(previous, live, status):
    def prices():
        return [
            observation(series["name"], "World benchmark", point["month"], point["usd_t"],
                        "USD per metric tonne", live["prices"]["source"])
            for series in live["prices"]["series"].values()
            for point in series.get("history", [series])
        ]

    def trade():
        return [
            observation(series["label"], live["trade"]["names"].get(iso, iso), series["year"],
                        value, series["unit"], "https://comtradeplus.un.org/")
            for series in live["trade"]["series"].values()
            for iso, value in series["d"].items()
        ]

    automatic = {"eurostat": fetch_eurostat, "prodcom": fetch_prodcom, "who": fetch_who,
                 "world-bank": prices, "comtrade": trade, "icao": fetch_icao,
                 "iea-minerals": fetch_iea_minerals}
    existing_status = {"world-bank": "World Bank Pink Sheet", "comtrade": "UN Comtrade"}
    result = {}
    for provider in json.loads(CATALOG.read_text()):
        key = provider["id"]
        path = IMPORTS / f"{key}.csv"
        entry = previous.get(key, {})
        rows = None
        try:
            if path.is_file():
                rows = list(import_csv(path))
            elif key in automatic and (key not in existing_status or status[existing_status[key]] == "updated"):
                rows = automatic[key]()
            if rows is not None:
                if not rows:
                    raise ValueError("no observations returned")
                entry = {"fetched": dt.date.today().isoformat(), "rows": rows,
                         "status": "Imported" if path.is_file() else "Updated"}
            elif entry.get("rows"):
                entry = {**entry, "status": "Retained previous data"}
            else:
                message = "Awaiting export"
                if key in automatic:
                    message = status.get(existing_status.get(key), "Awaiting first refresh")
                entry = {"status": message}
        except (ValueError, KeyError, TypeError, OSError, requests.RequestException) as exc:
            entry = {**entry, "status": "Refresh failed; previous observations kept"
                     if entry.get("rows") else "Refresh failed"}
            print(f"{provider['name']}: {type(exc).__name__}")
        result[key] = entry
    return result
