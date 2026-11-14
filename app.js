"use strict"

var lastAnnounce = ""
var restoringFocus = false

function esc(value) {
  return String(value).replace(/[&<>"']/g, function (char) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]
  })
}

function plain(value) {
  return '<span translate="no">' + esc(value) + "</span>"
}

function num(value) {
  if (value == null || Number.isNaN(Number(value))) return null
  var n = Number(value)
  var digits = Math.abs(n % 1) > 0.001 ? 1 : 0
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n)
}

function amount(value, unit) {
  if (value == null) return '<span class="amount unknown">Unknown</span>'
  return '<span class="amount">' + num(value) + "\u00a0<span class=\"unit\">" + esc(unit) + "</span></span>"
}

function gapOf(record) {
  if (!record) return null
  if (record.demand == null || record.supply == null) return null
  if (!record.productId || !record.market || !record.delivery || !record.unit) return null
  return record.demand - record.supply
}

function seriesGap(row) {
  if (!row || row.demand2035 == null || row.supply2035 == null) return null
  if (!row.productId || !row.market || !row.unit) return null
  return row.demand2035 - row.supply2035
}

function productById(id) {
  for (var i = 0; i < ATLAS.products.length; i += 1) {
    if (ATLAS.products[i].id === id) return ATLAS.products[i]
  }
  return null
}

function unique(list) {
  var seen = {}
  var out = []
  list.forEach(function (item) {
    if (!seen[item]) {
      seen[item] = true
      out.push(item)
    }
  })
  out.sort(function (a, b) { return a.localeCompare(b) })
  return out
}

function readRoute() {
  var raw = (location.hash || "#/shortages").replace(/^#/, "")
  var q = raw.indexOf("?")
  var path = (q === -1 ? raw : raw.slice(0, q)).replace(/^\//, "")
  var params = new URLSearchParams(q === -1 ? "" : raw.slice(q + 1))
  var alias = { scenarios: "builder", reactors: "builder", duplex: "builder" }
  if (alias[path]) path = alias[path]
  var known = { shortages: 1, trends: 1, demand: 1, builder: 1, supply: 1, wire: 1, plate: 1 }
  return { page: known[path] ? path : "shortages", params: params }
}

function hashFor(page, params) {
  var query = params.toString()
  return "#/" + page + (query ? "?" + query : "")
}

function go(page, updates, options) {
  var current = readRoute()
  var params = new URLSearchParams(current.params)
  var replace = options && options.replace
  var partial = options && options.partial
  Object.keys(updates || {}).forEach(function (key) {
    var value = updates[key]
    if (value == null || value === "" || value === "All") params.delete(key)
    else params.set(key, String(value))
  })
  var hash = hashFor(page || current.page, params)
  if (location.hash === hash) {
    render({ partial: partial })
    return
  }
  if (replace) {
    history.replaceState(null, "", hash)
    render({ partial: partial })
    return
  }
  location.hash = hash
}

function setParam(params, key, value) {
  if (!params.get(key) && value != null && value !== "") {
    params.set(key, String(value))
    return true
  }
  return false
}

function filteredObservations(params) {
  return ATLAS.observations.filter(function (row) {
    var product = productById(row.productId)
    if (!product) return false
    if (params.get("industry") && row.industry !== params.get("industry")) return false
    if (params.get("region") && row.region !== params.get("region")) return false
    if (params.get("metal") && product.metal !== params.get("metal")) return false
    if (params.get("form") && product.form !== params.get("form")) return false
    if (params.get("evidence") && row.evidence !== params.get("evidence")) return false
    return true
  })
}

function textValue(row, key) {
  var product = productById(row.productId)
  if (key === "grade") return product ? product.grade : ""
  if (key === "form") return product ? product.form : ""
  if (key === "region") return row.region
  if (key === "delivery") return row.delivery
  if (key === "evidence") return row.evidence
  return ""
}

function sortRows(rows, params) {
  var key = params.get("sort") || "gap"
  var dir = params.get("dir") || (key === "gap" ? "desc" : "asc")
  var sign = dir === "asc" ? 1 : -1
  return rows.slice().sort(function (a, b) {
    if (key === "gap") {
      if (a.unit !== b.unit) return a.unit.localeCompare(b.unit)
      var ag = gapOf(a)
      var bg = gapOf(b)
      if (ag == null && bg == null) return 0
      if (ag == null) return 1
      if (bg == null) return -1
      return (ag - bg) * sign
    }
    return textValue(a, key).localeCompare(textValue(b, key)) * sign
  })
}

function normalize(route) {
  var params = new URLSearchParams(route.params)
  var changed = false
  if (route.page === "shortages" && params.get("id")) {
    var stillThere = false
    filteredObservations(params).forEach(function (row) { if (row.id === params.get("id")) stillThere = true })
    if (!stillThere) {
      params.delete("id")
      changed = true
    }
  }
  if (route.page === "demand") changed = normalizeDemand(params) || changed
  if (route.page === "trends") changed = normalizeTrends(params) || changed
  if (route.page === "supply") changed = normalizeSupply(params) || changed
  if (route.page === "builder") changed = normalizeScenarios(params) || changed
  if (route.page === "wire") changed = setParam(params, "id", "nicr-8020-wire") || changed
  if (route.page === "plate") changed = setParam(params, "id", "alloy-625-plate") || changed
  if (changed) history.replaceState(null, "", hashFor(route.page, params))
  return { page: route.page, params: params }
}

function titles(page) {
  return {
    shortages: "Current shortages",
    trends: "Trends by industry",
    demand: "Scenarios",
    builder: "Scenario builder",
    supply: "Total supply",
    wire: "Wire",
    plate: "Plate"
  }[page] || "Atlas"
}

function markNav(page) {
  ["shortages", "trends", "demand", "builder", "supply"].forEach(function (id) {
    var link = document.getElementById("nav-" + id)
    if (!link) return
    if (page === id) link.setAttribute("aria-current", "page")
    else link.removeAttribute("aria-current")
  })
}

function announce(text) {
  if (!text || text === lastAnnounce) return
  lastAnnounce = text
  var live = document.getElementById("live")
  live.textContent = ""
  window.setTimeout(function () { live.textContent = text }, 30)
}

function pageHead(title, aside) {
  return '<div class="page-head"><h1>' + esc(title) + "</h1>" + (aside || "") + "</div>"
}

function selectBox(name, label, value, options, blank) {
  var opts = (blank ? ['<option value="">All</option>'] : []).concat(options.map(function (opt) {
    return '<option value="' + esc(opt) + '"' + (opt === value ? " selected" : "") + ">" + esc(opt) + "</option>"
  }))
  return '<label class="filter">' + esc(label) +
    '<select data-control="1" id="control-' + esc(name) + '" name="' + esc(name) + '" autocomplete="off" class="' + (value ? "is-set" : "") + '">' +
    opts.join("") + "</select></label>"
}

function rawSelect(id, name, label, value, options) {
  var opts = options.map(function (opt) {
    return '<option value="' + esc(opt) + '"' + (opt === value ? " selected" : "") + ">" + esc(opt) + "</option>"
  })
  return '<select data-control="1" id="' + esc(id) + '" name="' + esc(name) + '" autocomplete="off" aria-label="' + esc(label) + '">' + opts.join("") + "</select>"
}

function listSection(title, items) {
  var body = items && items.length
    ? '<ul class="names">' + items.map(function (item) { return "<li>" + plain(item) + "</li>" }).join("") + "</ul>"
    : '<p class="unknown">Unknown</p>'
  return '<section class="block"><h3>' + esc(title) + "</h3>" + body + "</section>"
}

function contractsBlock(contracts) {
  var body = contracts && contracts.length
    ? '<ul class="names">' + contracts.map(function (item) {
      return "<li>" + esc(String(item.year)) + " " + plain(item.name) + "</li>"
    }).join("") + "</ul>"
    : '<p class="unknown">Unknown</p>'
  return '<section class="block"><h3>Contracts</h3>' + body + "</section>"
}

function figure(label, value, unit, when) {
  var future = when === "2035" && value != null
  return '<div class="figure' + (future ? " future" : "") + '"><h3>' + esc(label) + "</h3><p>" + amount(value, unit) + "</p>" +
    (when ? '<p class="when">' + esc(when) + "</p>" : "") + "</div>"
}

function ledger(config) {
  var head = config.columns.map(function (col) {
    var cls = [col.num ? "num" : "", col.wide ? "wide" : ""].filter(Boolean).join(" ")
    if (!config.sort) return '<span role="columnheader" class="' + cls + '">' + esc(col.label) + "</span>"
    var active = config.sort.key === col.key
    var aria = active ? (config.sort.dir === "asc" ? "ascending" : "descending") : "none"
    return '<button type="button" data-sort="' + esc(col.key) + '" role="columnheader" aria-sort="' + aria + '" class="' + cls + '">' + esc(col.label) + "</button>"
  }).join("")
  var body = config.rows.length ? config.rows.map(function (row) {
    var open = row.id === config.selected
    var cells = config.columns.map(function (col) {
      var cls = [col.num ? "num" : "", col.wide ? "wide" : "", col.key === "grade" ? "grade" : ""].filter(Boolean).join(" ")
      var value = row.cells[col.key]
      if (config.profile && col.key === "form") {
        value = '<button type="button" class="form-hit" id="form-' + esc(row.id) + '" data-profile="' + esc(row.id) + '" aria-pressed="' + (open ? "true" : "false") + '">' + value + "</button>"
      }
      return '<span role="cell" data-label="' + esc(col.label) + '" class="' + cls + '">' + value + "</span>"
    }).join("")
    if (config.profile) {
      return '<div class="ledger-row ' + config.colClass + (open ? " is-open" : "") + '" role="row">' + cells + "</div>"
    }
    return '<button type="button" id="row-' + esc(row.id) + '" class="ledger-row ' + config.colClass + '" role="row" data-row="' + esc(row.id) + '" aria-pressed="' + (open ? "true" : "false") + '">' + cells + "</button>"
  }).join("") : '<p class="empty">None</p>'
  return '<div class="ledger-wrap"><div class="ledger" role="table" aria-label="' + esc(config.label) + '"><div class="ledger-head ' + config.colClass + '" role="row">' + head + "</div>" + body + "</div></div>"
}

function axisTop(max) {
  var safe = Math.max(max, 1)
  var rough = safe / 4
  var pow = Math.pow(10, Math.floor(Math.log10(rough)))
  var n = rough / pow
  var step = (n >= 7.5 ? 10 : n >= 3 ? 5 : n >= 1.5 ? 2 : 1) * pow
  var top = Math.ceil((safe * 1.08) / step) * step || step
  var ticks = []
  for (var value = 0; value <= top + step * 0.001; value += step) ticks.push(Math.round(value))
  return { top: top, ticks: ticks }
}

function chart(spec) {
  var width = 640
  var height = spec.height || 300
  var pad = { l: 58, r: 16, t: 22, b: 36 }
  var values = []
  spec.groups.forEach(function (group) {
    group.bars.forEach(function (bar) { if (bar.value != null) values.push(bar.value) })
  })
  var scale = axisTop(Math.max.apply(null, values.concat([1])))
  var innerW = width - pad.l - pad.r
  var innerH = height - pad.t - pad.b
  var groupW = innerW / spec.groups.length
  var barsPer = 1
  spec.groups.forEach(function (group) { barsPer = Math.max(barsPer, group.bars.length) })
  var multiple = barsPer > 1
  var barW = multiple ? 20 : 56
  var gap = multiple ? 78 : 0
  var parts = []
  scale.ticks.forEach(function (tick) {
    var y = pad.t + innerH - (tick / scale.top) * innerH
    parts.push('<line class="' + (tick === 0 ? "baseline" : "tick") + '" x1="' + pad.l + '" y1="' + y.toFixed(2) + '" x2="' + (width - pad.r) + '" y2="' + y.toFixed(2) + '"></line>')
    parts.push('<text x="' + (pad.l - 8) + '" y="' + (y + 4).toFixed(2) + '" text-anchor="end">' + esc(num(tick)) + "</text>")
  })
  parts.push('<text x="' + (pad.l - 8) + '" y="14" text-anchor="end">' + esc(spec.unit) + "</text>")
  spec.groups.forEach(function (group, groupIndex) {
    var cluster = barsPer * barW + (barsPer - 1) * gap
    var start = pad.l + groupIndex * groupW + (groupW - cluster) / 2
    group.bars.forEach(function (bar, barIndex) {
      var x = start + barIndex * (barW + gap)
      var label = group.label + ", " + bar.name + ", " + (bar.value == null ? "Unknown" : num(bar.value) + " " + spec.spoken)
      if (bar.value == null) {
        parts.push('<text class="value" x="' + (x + barW / 2).toFixed(2) + '" y="' + (pad.t + innerH - 8) + '">Unknown</text>')
        return
      }
      var h = Math.max(1, (bar.value / scale.top) * innerH)
      var y = pad.t + innerH - h
      var future = multiple ? bar.name === "2035" : bar.name === "Supply"
      var fill = bar.fill === "solid" ? "#8f9d35" : bar.fill === "slate" ? "#4d6c7d" : bar.fill === "line" ? "none" : (future ? "#8f9d35" : (multiple ? "none" : "#4d6c7d"))
      var stroke = bar.fill === "line" ? "#355464" : (bar.fill ? "none" : (multiple && !future ? "#355464" : "none"))
      parts.push('<rect class="bar" tabindex="0" role="img" data-bar="1" aria-label="' + esc(label) + '" x="' + x.toFixed(2) + '" y="' + y.toFixed(2) + '" width="' + barW.toFixed(2) + '" height="' + h.toFixed(2) + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1.5"></rect>')
      parts.push('<text class="value" x="' + (x + barW / 2).toFixed(2) + '" y="' + (y - 6).toFixed(2) + '">' + esc(num(bar.value)) + "</text>")
    })
    parts.push('<text x="' + (pad.l + groupIndex * groupW + groupW / 2).toFixed(2) + '" y="' + (height - 12) + '">' + esc(group.label) + "</text>")
  })
  var legend = spec.legend
    ? '<div class="legend">' + spec.legend.map(function (item) {
      return '<span><i class="swatch ' + esc(item.cls) + '" aria-hidden="true"></i>' + esc(item.name) + "</span>"
    }).join("") + "</div>"
    : (multiple
      ? '<div class="legend"><span><i class="swatch today" aria-hidden="true"></i>Today</span><span><i class="swatch future" aria-hidden="true"></i>2035</span></div>'
      : "")
  var rows = spec.groups.map(function (group) {
    return '<tr><th scope="row">' + esc(group.label) + "</th>" + group.bars.map(function (bar) {
      return "<td>" + esc(bar.name) + " " + esc(bar.value == null ? "Unknown" : num(bar.value)) + "</td>"
    }).join("") + "</tr>"
  }).join("")
  return '<figure class="chart-panel"><svg class="chart" viewBox="0 0 ' + width + " " + height + '" role="group" aria-label="' + esc(spec.label) + '">' + parts.join("") + '</svg><figcaption>' + legend + '</figcaption><table class="visually-hidden"><caption>' + esc(spec.label) + "</caption><tbody>" + rows + "</tbody></table></figure>"
}

function visibleObservation(params) {
  var id = params.get("id")
  var match = null
  filteredObservations(params).forEach(function (row) { if (row.id === id) match = row })
  return match
}

function viewShortages(route) {
  var rows = sortRows(filteredObservations(route.params), route.params)
  var filters = '<div class="filters">' +
    selectBox("industry", "Industry", route.params.get("industry") || "", unique(ATLAS.observations.map(function (row) { return row.industry })), true) +
    selectBox("region", "Region", route.params.get("region") || "", unique(ATLAS.observations.map(function (row) { return row.region })), true) +
    selectBox("metal", "Metal", route.params.get("metal") || "", unique(ATLAS.products.map(function (product) { return product.metal })), true) +
    selectBox("form", "Form", route.params.get("form") || "", unique(ATLAS.products.map(function (product) { return product.form })), true) +
    selectBox("evidence", "Evidence", route.params.get("evidence") || "", unique(ATLAS.observations.map(function (row) { return row.evidence })), true) +
    '<button class="reset" type="button" data-action="reset">Reset</button></div>'
  var profile = visibleObservation(route.params)
  var table = ledger({
    label: "Shortages",
    colClass: "cols-shortage",
    profile: true,
    selected: profile ? route.params.get("id") : "",
    sort: { key: route.params.get("sort") || "gap", dir: route.params.get("dir") || "desc" },
    columns: [
      { key: "grade", label: "Grade", wide: true },
      { key: "form", label: "Form" },
      { key: "region", label: "Region" },
      { key: "delivery", label: "Window" },
      { key: "evidence", label: "Evidence" },
      { key: "gap", label: "Gap", num: true }
    ],
    rows: rows.map(function (row) {
      var product = productById(row.productId)
      return {
        id: row.id,
        cells: {
          grade: plain(product.grade),
          form: esc(product.form),
          region: esc(row.region),
          delivery: esc(row.delivery),
          evidence: esc(row.evidence),
          gap: amount(gapOf(row), row.unit)
        }
      }
    })
  })
  return pageHead("Shortages") + filters + '<div class="work' + (profile ? "" : " solo") + '">' + table + (profile ? detailPanel(route.params) : "") + "</div>"
}

function detailPanel(params) {
  var row = visibleObservation(params)
  if (!row) return '<section class="detail"><h2 class="name">None</h2><p class="unknown">Unknown</p></section>'
  var product = productById(row.productId)
  return '<section class="detail"><h2 class="name">' + plain(product.grade) + '</h2><p class="meta-line"><span>' + esc(product.form) + "</span><span>" + esc(row.region) + "</span><span>" + esc(row.delivery) + '</span></p><p class="meta-evidence">' + esc(row.evidence) + '</p><div class="figures">' +
    figure("Demand", row.demand, row.unit) +
    figure("Supply", row.supply, row.unit) +
    figure("Gap", gapOf(row), row.unit) +
    "</div>" +
    listSection("Suppliers", product.directory.suppliers) +
    listSection("Customers", product.directory.customers) +
    listSection("Competitors", product.directory.competitors) +
    contractsBlock(row.contracts) + "</section>"
}

function seriesById(id) {
  var raw = ATLAS.assumptions.series[id]
  var product = productById(id)
  if (!raw || !product) return null
  return {
    productId: id,
    grade: product.grade,
    form: product.form,
    metal: product.metal,
    market: raw.market,
    unit: raw.unit,
    supplyNow: raw.supplyNow,
    demandNow: raw.demandNow,
    supply2035: raw.supply2035,
    demand2035: raw.demand2035,
    current: raw.current,
    forecast: raw.forecast,
    directory: product.directory
  }
}

function formProducts(form, metal) {
  return ATLAS.products.filter(function (product) {
    return product.form === form && product.metal === metal && ATLAS.assumptions.series[product.id]
  })
}

function sortedGrades(products, params) {
  var key = params.get("sort") || "demand"
  return products.slice().sort(function (a, b) {
    if (key === "grade") return a.grade.localeCompare(b.grade)
    var left = seriesById(a.id)
    var right = seriesById(b.id)
    var av = key === "supply" ? left.supply2035 : key === "gap" ? seriesGap(left) : left.demand2035
    var bv = key === "supply" ? right.supply2035 : key === "gap" ? seriesGap(right) : right.demand2035
    if (av == null && bv == null) return a.grade.localeCompare(b.grade)
    if (av == null) return 1
    if (bv == null) return -1
    return bv - av
  })
}

function nameList(items) {
  if (!items || !items.length) return '<p class="unknown">Unknown</p>'
  return '<ul class="names">' + items.map(function (item) { return "<li>" + plain(item) + "</li>" }).join("") + "</ul>"
}

function viewForm(route, form, metal) {
  var products = sortedGrades(formProducts(form, metal), route.params)
  var selected = seriesById(route.params.get("id"))
  if (!selected || selected.form !== form || selected.metal !== metal) selected = products[0] ? seriesById(products[0].id) : null
  var sort = route.params.get("sort") || "demand"
  var labels = { demand: "Demand", supply: "Supply", gap: "Gap", grade: "Grade" }
  var sortSelect = '<label class="filter">Sort<select data-control="1" id="control-sort" name="sort" autocomplete="off">' +
    ["demand", "supply", "gap", "grade"].map(function (opt) {
      return '<option value="' + opt + '"' + (opt === sort ? " selected" : "") + ">" + labels[opt] + "</option>"
    }).join("") + "</select></label>"
  var grades = products.map(function (product) {
    var pressed = selected && product.id === selected.productId
    return '<button type="button" id="row-' + esc(product.id) + '" data-row="' + esc(product.id) + '" aria-pressed="' + (pressed ? "true" : "false") + '">' + plain(product.grade) + "</button>"
  }).join("")
  var panel = route.params.get("panel") === "customers" ? "customers" : "producers"
  var parties = selected ? (panel === "customers" ? selected.directory.customers : selected.directory.suppliers) : []
  var left = '<aside class="grades">' + sortSelect + '<div class="grade-list">' + grades + "</div>" +
    '<div class="switch" role="group" aria-label="Parties">' +
    '<button type="button" id="panel-producers" data-panel="producers" aria-pressed="' + (panel === "producers" ? "true" : "false") + '">Producers</button>' +
    '<button type="button" id="panel-customers" data-panel="customers" aria-pressed="' + (panel === "customers" ? "true" : "false") + '">Customers</button></div>' +
    (parties.length ? '<ul class="names" aria-label="' + (panel === "customers" ? "Customers" : "Producers") + '">' + parties.map(function (item) { return "<li>" + plain(item) + "</li>" }).join("") + "</ul>" : '<p class="unknown">Unknown</p>') +
    "</aside>"
  var gap = selected ? seriesGap(selected) : null
  var right = selected
    ? '<div class="metrics-wrap"><div class="metrics-head"><h2 class="name">' + plain(selected.grade) + '</h2></div><div class="metrics">' +
      figure("Supply", selected.supplyNow, selected.unit, "Today") +
      figure("Demand", selected.demandNow, selected.unit, "Today") +
      figure("Supply", selected.supply2035, selected.unit, "2035") +
      figure("Demand", selected.demand2035, selected.unit, "2035") +
      "</div></div>" + chart({
        unit: selected.unit,
        spoken: "tonnes per year",
        label: "Today versus 2035, tonnes per year",
        groups: [
          { label: "Supply", bars: [{ name: "Today", value: selected.supplyNow }, { name: "2035", value: selected.supply2035 }] },
          { label: "Demand", bars: [{ name: "Today", value: selected.demandNow }, { name: "2035", value: selected.demand2035 }] }
        ]
      }) +
      '<div class="apps"><section><h3>Current<span class="visually-hidden"> applications</span></h3>' + nameList(selected.current) + '</section><section><h3>Forecast<span class="visually-hidden"> applications</span></h3>' + nameList(selected.forecast) + "</section></div>" +
      '<section class="recommend"><div><h2 class="kicker">Recommendation</h2><p class="name">' + plain(selected.grade) + '</p></div><p class="rec-num">' +
      (gap == null ? '<span class="unknown">Unknown</span>' : num(gap) + '\u00a0<span class="unit">t/y</span>') +
      ' <span class="when">2035</span></p></section>'
    : '<p class="unknown">None</p>'
  return pageHead(form, '<p class="alongside" translate="no">' + esc(metal) + "</p>") + '<div class="wire">' + left + right + "</div>"
}

function summary(route) {
  if (route.page === "shortages") {
    var row = visibleObservation(route.params)
    if (!row) return "Shortages"
    var product = productById(row.productId)
    var gap = gapOf(row)
    return product.grade + ", demand " + (num(row.demand) || "unknown") + ", supply " + (num(row.supply) || "unknown") + ", gap " + (gap == null ? "unknown" : num(gap))
  }
  if (route.page === "builder") return scenarioSummary(simModel(route.params))
  if (route.page === "trends") {
    var trend = trendModel(route.params)
    return trend.industry.name + ", probability " + trendLevel(route.params, trend.industry) + "%"
  }
  if (route.page === "demand") {
    var scenario = futureScenario(route.params.get("scenario"))
    return scenario ? scenario.name : "Scenarios"
  }
  if (route.page === "wire" || route.page === "plate") {
    var series = seriesById(route.params.get("id"))
    if (!series) return "None"
    var seriesValue = seriesGap(series)
    return series.grade + ", 2035 gap " + (seriesValue == null ? "unknown" : num(seriesValue))
  }
  return titles(route.page)
}

function view(route) {
  if (route.page === "demand") return viewDemand(route)
  if (route.page === "trends") return viewTrends(route)
  if (route.page === "builder") return viewScenarios(route)
  if (route.page === "supply") return viewChain(route)
  if (route.page === "wire") return viewForm(route, "Wire", "Nickel")
  if (route.page === "plate") return viewForm(route, "Plate", "Nickel")
  return viewShortages(route)
}

function syncNav() {
  var button = document.getElementById("nav-toggle")
  if (!button) return
  var open = !document.body.classList.contains("nav-closed")
  button.setAttribute("aria-expanded", open ? "true" : "false")
  var label = button.querySelector(".visually-hidden")
  if (label) label.textContent = open ? "Hide sections" : "Show sections"
}

function render(options) {
  var route = normalize(readRoute())
  var title = titles(route.page)
  if (route.page === "demand") {
    var scenario = futureScenario(route.params.get("scenario"))
    if (scenario) title = scenario.name
  }
  document.title = title + " · Atlas"
  syncNav()
  markNav(route.page)
  if (options && options.partial && route.page === "builder" && document.body.dataset.page === "builder") {
    var model = simModel(route.params)
    if (refreshScenario(model)) {
      announce(scenarioSummary(model))
      return
    }
  }
  var focusId = document.activeElement && document.activeElement.id
  document.body.dataset.page = route.page
  document.getElementById("main").innerHTML = view(route)
  if (focusId) {
    var el = document.getElementById(focusId)
    if (el) {
      restoringFocus = true
      el.focus()
      restoringFocus = false
    }
  }
  announce(summary(route))
}

document.addEventListener("click", function (event) {
  var option = event.target.closest(".combo-list [role='option']")
  if (option) {
    commitCombo(option.closest(".combo"), option.dataset.value)
    return
  }
  var comboInput = event.target.closest("[role='combobox']")
  if (comboInput) {
    openCombo(comboInput)
    return
  }
  if (!event.target.closest(".combo")) closeCombos()
  var action = event.target.closest("[data-action]")
  if (action) {
    if (action.dataset.action === "reset") go(null, { industry: null, region: null, metal: null, form: null, evidence: null, id: null })
    if (action.dataset.action === "nav") {
      var closed = document.body.classList.contains("nav-closed")
      document.body.classList.toggle("nav-closed", !closed)
      try { localStorage.setItem("atlas-nav", closed ? "open" : "closed") } catch (err) { /* storage blocked */ }
      syncNav()
    }
    if (action.dataset.action === "clear-node") go("supply", { node: null })
    if (action.dataset.action === "zoom") {
      var step = action.dataset.dir === "in" ? 0.35 : -0.35
      chainView.scale = Math.min(3.2, Math.max(1, chainView.scale + step))
      var land = document.getElementById("chain-land")
      if (land) land.setAttribute("transform", "translate(500 218) scale(" + chainView.scale.toFixed(2) + ") translate(-500 -218)")
    }
    if (action.dataset.action === "trace") {
      var tracing = readRoute().params.get("trace") === "1"
      go("builder", { trace: tracing ? null : "1" })
    }
    if (action.dataset.action === "step") {
      var route = normalize(readRoute())
      var current = simModel(route.params)
      if (!current.scenario) return
      var next = current.count + Number(action.dataset.step)
      if (next < current.scenario.min || next > current.scenario.max) return
      go("builder", { count: next }, { replace: true, partial: true })
    }
    return
  }
  var sort = event.target.closest("[data-sort]")
  if (sort) {
    var route = readRoute()
    var key = sort.dataset.sort
    var current = route.params.get("sort") || "gap"
    var dir = route.params.get("dir") || (current === "gap" ? "desc" : "asc")
    var nextDir = current === key ? (dir === "asc" ? "desc" : "asc") : (key === "gap" ? "desc" : "asc")
    go(null, { sort: key, dir: nextDir })
    return
  }
  var panel = event.target.closest("[data-panel]")
  if (panel) {
    go(null, { panel: panel.dataset.panel })
    return
  }
  var profileHit = event.target.closest("[data-profile]")
  if (profileHit) {
    var profileId = profileHit.getAttribute("data-profile")
    var currentId = readRoute().params.get("id")
    go(null, { id: currentId === profileId ? null : profileId })
    return
  }
  var chainNode = event.target.closest("[data-node]")
  if (chainNode) {
    var nodeId = chainNode.getAttribute("data-node")
    var currentNode = readRoute().params.get("node")
    go("supply", { node: currentNode === nodeId ? null : nodeId })
    return
  }
  var row = event.target.closest("[data-row]")
  if (row) go(null, { id: row.dataset.row })
})

document.addEventListener("change", function (event) {
  var el = event.target
  if (el.matches && el.matches("[data-trend]")) {
    var same = readRoute().params.get("industry") === el.dataset.trend
    go("trends", { industry: el.dataset.trend, level: el.value, form: same ? readRoute().params.get("form") : null })
    return
  }
  if (!el.matches || !el.matches("[data-control]")) return
  var update = {}
  update[el.name] = el.value
  go(null, update)
})

document.addEventListener("input", function (event) {
  var slider = event.target.closest && event.target.closest("[data-trend]")
  if (slider && readRoute().page === "trends") {
    var params = new URLSearchParams(readRoute().params)
    if (params.get("industry") !== slider.dataset.trend) params.delete("form")
    params.set("industry", slider.dataset.trend)
    params.set("level", slider.value)
    normalizeTrends(params)
    history.replaceState(null, "", hashFor("trends", params))
    paintTrends(params)
    return
  }
  var input = event.target.closest && event.target.closest("[role='combobox']")
  if (!input) return
  var wrap = input.closest(".combo")
  var list = document.getElementById(wrap.dataset.combo + "-list")
  input.setAttribute("aria-expanded", "true")
  list.hidden = false
  fillComboList(wrap, input.value)
})

document.addEventListener("focusin", function (event) {
  if (restoringFocus) return
  var input = event.target.closest && event.target.closest("[role='combobox']")
  if (!input) return
  openCombo(input)
  input.select()
})

document.addEventListener("mousedown", function (event) {
  var option = event.target.closest && event.target.closest(".combo-list [role='option']")
  if (option) event.preventDefault()
})

document.addEventListener("keydown", function (event) {
  if (!event.target.closest) return
  var comboInput = event.target.closest("[role='combobox']")
  if (comboInput) {
    onComboKey(event, comboInput)
    return
  }
  var chainKey = event.target.closest("[data-node]")
  if (chainKey && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault()
    var nodeId = chainKey.getAttribute("data-node")
    var currentNode = readRoute().params.get("node")
    go("supply", { node: currentNode === nodeId ? null : nodeId })
    return
  }
  var profileKey = event.target.closest("[data-profile]")
  if (profileKey && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
    var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-profile]"))
    var nextProfile = buttons[buttons.indexOf(profileKey) + (event.key === "ArrowDown" ? 1 : -1)]
    if (!nextProfile) return
    event.preventDefault()
    nextProfile.focus()
    if (readRoute().params.get("id")) go(null, { id: nextProfile.getAttribute("data-profile") })
    return
  }
  var bar = event.target.closest("[data-bar]")
  if (bar && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault()
    document.getElementById("live").textContent = bar.getAttribute("aria-label")
    return
  }
  var row = event.target.closest("[data-row]")
  if (!row || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return
  var rows = Array.prototype.slice.call(document.querySelectorAll("[data-row]"))
  var next = rows[rows.indexOf(row) + (event.key === "ArrowDown" ? 1 : -1)]
  if (!next) return
  event.preventDefault()
  go(null, { id: next.getAttribute("data-row") })
  var again = document.getElementById(next.id)
  if (again) again.focus()
})

window.addEventListener("hashchange", function () { render() })
try {
  if (localStorage.getItem("atlas-nav") === "closed") document.body.classList.add("nav-closed")
} catch (err) { /* keep the sidebar open when storage is blocked */ }
render()
