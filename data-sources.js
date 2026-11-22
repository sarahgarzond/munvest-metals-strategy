"use strict";

const select = document.querySelector("#provider");
const query = document.querySelector("#query");
const status = document.querySelector("#status");
const publisher = document.querySelector("#publisher");
const table = document.querySelector("table");
const body = table.querySelector("tbody");
const more = document.querySelector("#more");
const number = new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 });
const pageSize = 100;

async function load(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status})`);
  return response.json();
}

function sourceLink(url, text) {
  const link = document.createElement("a");
  link.textContent = text;
  if (typeof url === "string" && url.startsWith("https://")) link.href = url;
  return link;
}

async function start() {
  const [catalogResult, snapshotResult] = await Promise.allSettled([
    load("data/providers.json"), load("data/live.json"),
  ]);
  if (catalogResult.status === "rejected") {
    status.textContent = "The publisher catalog could not be loaded.";
    return;
  }
  const catalog = catalogResult.value;
  const snapshot = snapshotResult.value?.providers ?? {};
  let limit = pageSize;

  for (const source of catalog) {
    const option = new Option(source.name, source.id);
    select.add(option);
  }
  const firstAvailable = catalog.find(source => snapshot[source.id]?.rows?.length);
  if (firstAvailable) select.value = firstAvailable.id;

  function render() {
    const source = catalog.find(item => item.id === select.value);
    const entry = snapshot[source.id];
    publisher.replaceChildren(sourceLink(source.url, source.name), ` · ${source.scope} · ${source.method}`);
    const term = query.value.toLowerCase().trim();
    const rows = (entry?.rows ?? []).filter(row =>
      [row.metric, row.geography, row.period, row.scenario].join(" ").toLowerCase().includes(term)
    ).sort((a, b) => b.period.localeCompare(a.period));
    const available = entry?.status ?? (source.method === "CSV import" ? "Awaiting export" : "Awaiting first refresh");
    status.textContent = [
      available.replace(";", "."),
      entry?.fetched && `Last successful load ${entry.fetched}`,
      entry?.rows?.length && `Showing ${Math.min(limit, rows.length)} of ${rows.length} matching observations`,
    ].filter(Boolean).join(". ");

    const fragment = document.createDocumentFragment();
    for (const row of rows.slice(0, limit)) {
      const tr = document.createElement("tr");
      const value = typeof row.value === "number" ? number.format(row.value) : row.value;
      for (const cell of [row.metric, row.geography, row.period, row.scenario, value, row.unit, row.flag]) {
        tr.insertCell().textContent = cell == null || cell === "" ? "—" : cell;
      }
      tr.insertCell().append(sourceLink(row.source_url, "Publisher data"));
      fragment.append(tr);
    }
    body.replaceChildren(fragment);
    table.hidden = rows.length === 0;
    more.hidden = rows.length <= limit;
  }

  function reset() {
    limit = pageSize;
    render();
  }
  select.addEventListener("change", reset);
  query.addEventListener("input", reset);
  more.addEventListener("click", () => {
    limit += pageSize;
    render();
  });
  render();
}

start().catch(() => {
  status.textContent = "The publisher data could not be displayed.";
});
