# Atlas data refresh

Run `pip install -r pipeline/requirements.txt` and `python pipeline/fetch_data.py`.
The workflow runs monthly and opens a review pull request with the resulting
`data/live.json`. The Data sources page (`data-sources.html`) lets you search by metric,
geography, period and scenario.

The automatic sources cover selected series. World Bank supplies monthly nickel,
aluminium and copper prices. Eurostat supplies the EU basic-metals production
index and selected PRODCOM sold-production values. WHO supplies country-level
medical-device policy responses. ICAO supplies historical traffic through World
Bank WDI. Comtrade uses the repository's `COMTRADE_KEY` Actions secret for three
selected trade series. The last successful snapshot is retained when a refresh
fails. The dashboard's scenario assumptions are edited separately.

## Publisher exports

For any publisher listed in `data/providers.json`, place a normalized UTF-8 CSV
in `pipeline/imports/<publisher-id>.csv` before running the refresh. A local
export takes precedence over the publisher's automatic feed for the Data sources
page. The required header is:

```csv
metric,geography,period,value,unit,source_url,scenario
```

The scenario column is optional. Preserve the publisher's observation units and
periods. Put both origin and destination dimensions in the geography for
bilateral data, and identify both industries in the metric for ICIO rows. Use a
publisher HTTPS link and one row per metric, geography, period, unit and
scenario. Leave missing observations out of the export.

Use only observations permitted for redistribution. GitHub Pages serves the
generated JSON publicly, including any values loaded from a local CSV.

## Sector Research Tracker

`python pipeline/tracker.py` reads the team's Google Sheet (shared as "anyone with the link
can view") and writes `tracker-data.js`, which the scenario pages load. Use
`--xlsx file.xlsx` with a manual export if the download is blocked. The workflow
`refresh-tracker.yml` runs every Monday and on demand ("Run workflow") and opens a review
pull request. What the dashboard reads:

- `Database`: a series with an actual value (2026 or earlier) and a 2035 value becomes a
  2035 event for its sector. Metal-demand rows (t, kt) for 2035 that share a Source ID with
  the event scale with it.
- `2035 outlook`: metal 2035 baselines and the IEA demand components (energy and EV events).
- `material-product-industry-application`: products shown under each industry.
- `Country production` and `Country Data (Aero & MedTech)`: country selector, map and facts.
- `Source Log`: every Source ID becomes a link to the source.
