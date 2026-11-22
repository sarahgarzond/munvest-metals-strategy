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
