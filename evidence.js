/* Evidence layer: verdicts, visible calculations, source labels and consistency checks.
   Reads the existing ATLAS / FUTURE_SCENARIOS data; adds no numbers of its own. */

function evNum(v) { return v == null ? "No data" : Number(v).toLocaleString("en-US") }

function evQty(v, unit) { return v == null ? "No data" : evNum(v) + " " + unit }

function evBadge(kind, text) { return '<span class="ev-badge">' + esc(text) + "</span>" }

function evBasis(evidence) {
  if (evidence === "Contract" || evidence === "Tender") return evBadge("sourced", evidence)
  if (evidence === "Reported") return evBadge("reported", "Reported")
  return evBadge("missing", "Not stated")
}

function evSource(text) { return text ? esc(text) : evBadge("missing", "Source missing") }

/* ---------- Current shortages: product detail ---------- */

function evVerdict(row, product) {
  var gap = gapOf(row)
  if (gap == null) {
    return '<section class="ev-verdict ev-none"><p class="ev-kicker">Verdict</p><p class="ev-head"><b>Not enough data</b>: ' +
      (row.demand == null ? "demand" : "supply") + " is not known for " + esc(row.region) + ".</p>" +
      '<p class="ev-why">Fill this gap before acting on it.</p></section>'
  }
  var share = row.demand ? Math.round(gap / row.demand * 100) : 0
  var firm = row.evidence === "Contract" || row.evidence === "Tender"
  var level = gap <= 0 ? "none" : firm ? "act" : "watch"
  var word = level === "act" ? "Act now" : level === "watch" ? "Watch" : "No action"
  var dir = product.directory || {}
  var next = level === "none" ? "Supply covers demand in this window."
    : "Offer " + plain(product.grade) + " to " + plain((dir.customers || []).slice(0, 2).join(" and ") || "the customers below") +
      "; secure supply through " + plain((dir.suppliers || [])[0] || "a qualified supplier") + "."
  var why = firm
    ? "The demand side is a " + row.evidence.toLowerCase() + (row.contracts && row.contracts[0] ? " (" + esc(row.contracts[0].name + " " + row.contracts[0].year) + ")" : "") + ", not an estimate."
    : "The demand side is reported, not contracted. Confirm it before committing stock."
  return '<section class="ev-verdict ev-' + level + '"><p class="ev-kicker">Verdict</p>' +
    '<p class="ev-head"><b>' + word + "</b>: " + evNum(gap) + " " + esc(row.unit) + " gap, " + share + "% of demand, " + esc(row.region) + " " + esc(row.delivery) + "</p>" +
    '<p class="ev-next">' + next + "</p><p class=\"ev-why\">" + why + "</p></section>"
}

function evCalculation(row) {
  var gap = gapOf(row)
  var formula = gap == null
    ? "Gap = Demand − Supply = " + evNum(row.demand) + " − " + evNum(row.supply) + " → cannot be calculated"
    : "Gap = Demand − Supply = " + evNum(row.demand) + " − " + evNum(row.supply) + " = " + evNum(gap) + " " + row.unit
  var contract = row.contracts && row.contracts[0] ? row.contracts[0].name + " " + row.contracts[0].year : ""
  return '<section class="ev-box"><h3>How this number is calculated</h3><p class="ev-formula">' + esc(formula) + "</p>" +
    '<table class="ev-table"><thead><tr><th>Input</th><th>Value</th><th>Basis</th><th>Source</th></tr></thead><tbody>' +
    "<tr><td>Demand</td><td>" + esc(evQty(row.demand, row.unit)) + "</td><td>" + evBasis(row.evidence) + "</td><td>" + evSource(row.demandSource || contract) + "</td></tr>" +
    "<tr><td>Supply</td><td>" + esc(evQty(row.supply, row.unit)) + "</td><td>" + (row.supply == null ? evBadge("missing", "No data") : evBadge("reported", "Estimate")) + "</td><td>" + evSource(row.supplySource) + "</td></tr>" +
    "</tbody></table></section>"
}

function evGradeKey(name) { return String(name).split(" ").slice(0, 2).join(" ").replace(/,$/, "") }

function evUnitsFromName(name) {
  var m = /(\d[\d,]*)\s+(?:new\s+)?([A-Za-z]+(?:\s+[A-Za-z]+)?)/.exec(name || "")
  if (!m) return null
  var label = m[2].replace(/\s+(of|by|in)$/i, "")
  if (/^(years?|months?|days?|percent)$/i.test(label)) return null
  var one = /^(GW|MW|km|t)$/.test(label) ? label : label.replace(/s$/, "")
  return { count: Number(m[1].replace(/,/g, "")), label: label, one: one }
}

/* Every place in the atlas that states a per-reactor quantity for the same grade. */
function evPerReactorValues(product) {
  var key = evGradeKey(product.grade), out = []
  var r = ATLAS.assumptions && ATLAS.assumptions.reactors
  if (r) r.materials.forEach(function (m) {
    if (m.productId === product.id && m.perUnit != null) out.push({ page: "Total supply (reactor assumptions)", value: m.perUnit })
  })
  ;(ATLAS.scenarios || []).forEach(function (s) {
    if (s.kind !== "reactors") return
    s.materials.forEach(function (m) {
      if (m.grade && m.grade.indexOf(key) === 0 && m.perUnit != null) out.push({ page: "Scenario builder: " + s.name, value: m.perUnit })
    })
  })
  if (typeof FUTURE_SCENARIOS !== "undefined") FUTURE_SCENARIOS.forEach(function (s) {
    var u = evUnitsFromName(s.name)
    if (!u || !/reactor/i.test(u.label)) return
    s.products.forEach(function (p) {
      if (p.name.indexOf(key) === 0) out.push({ page: "Future demand: " + s.name + " (" + evNum(p.extra) + " t ÷ " + u.count + ")", value: Math.round(p.extra / u.count) })
    })
  })
  return out
}

function evConsistency(product) {
  var vals = evPerReactorValues(product)
  var distinct = vals.map(function (v) { return v.value }).filter(function (v, i, a) { return a.indexOf(v) === i })
  if (vals.length < 2 || distinct.length < 2) return ""
  return '<section class="ev-box ev-warn"><h3>Consistency check</h3><p>' + esc(evGradeKey(product.grade)) +
    " per reactor differs between pages:</p><table class=\"ev-table\"><thead><tr><th>Where</th><th class=\"num\">t per reactor</th></tr></thead><tbody>" +
    vals.map(function (v) { return "<tr><td>" + esc(v.page) + '</td><td class="num">' + evNum(v.value) + "</td></tr>" }).join("") +
    '</tbody></table><p class="ev-why">One cited value should be used everywhere, so every page gives the same answer.</p></section>'
}

/* ---------- Future demand: scenario detail ---------- */

function evPct(p) { return p.extra ? Math.round(p.shortage / p.extra * 100) : 0 }

function evBottomLine(s) {
  if (!s.products || !s.products.length) return ""
  var ranked = s.products.slice().sort(function (a, b) { return evPct(b) - evPct(a) })
  var top = ranked[0], rest = ranked.slice(1)
  return '<section class="ev-verdict ev-act"><p class="ev-kicker">Bottom line</p>' +
    "<p class=\"ev-head\"><b>Biggest opportunity: " + esc(top.name) + "</b>, " + evNum(top.shortage) + " t short (" + evPct(top) + "% of extra demand)</p>" +
    '<p class="ev-next">Prioritise ' + esc(top.name) + " sourcing from " + esc(s.players.suppliers[0]) + " and pitch it to " + esc(s.players.customers[0]) + "." +
    (rest.length ? " Lower priority: " + rest.map(function (p) { return esc(p.name) + " " + evPct(p) + "%" }).join(", ") + "." : "") + "</p>" +
    '<p class="ev-why">Confidence: ' + evBadge("reported", s.basis === "sourced" ? "Sourced" : "Modeled") + " — the numbers below show which inputs still need a source.</p></section>"
}

function evProductCalc(s, p) {
  var u = evUnitsFromName(s.name)
  var demand = u
    ? "Extra demand = " + u.count + " " + u.label + " × " + evNum(Math.round(p.extra / u.count)) + " t = " + evNum(p.extra) + " t"
    : "Extra demand = " + evNum(p.extra) + " t"
  return '<p class="ev-calc">' + esc(demand) + " · Supply " + evNum(p.supply) + " t · Shortage = " + evNum(p.extra) + " − " + evNum(p.supply) + " = " + evNum(p.shortage) + " t " +
    "· " + (p.source ? esc(p.source) : "source missing") + "</p>"
}

function evAssumptions(s) {
  var u = evUnitsFromName(s.name)
  var rows = []
  if (u) rows.push(["Scenario size", u.count + " " + u.label, evBadge("reported", "Scenario input"), evSource(s.sizeSource)])
  s.products.forEach(function (p) {
    if (u) rows.push([p.name + " per " + u.one, evNum(Math.round(p.extra / u.count)) + " t", evBadge("reported", "Modeled"), evSource(p.perUnitSource)])
    rows.push([p.name + " supply", evNum(p.supply) + " t", evBadge("reported", "Modeled"), evSource(p.supplySource)])
  })
  rows.push(["Delivery window", s.window || "Not stated", s.window ? evBadge("sourced", "Stated") : evBadge("missing", "Not stated"), s.window ? "" : "Add the years the demand falls in"])
  return '<section class="ev-box ev-wide"><h2>Assumptions and evidence</h2><table class="ev-table"><thead><tr><th>Assumption</th><th>Value</th><th>Basis</th><th>Source</th></tr></thead><tbody>' +
    rows.map(function (r) { return "<tr><td>" + esc(r[0]) + "</td><td>" + r[1] + "</td><td>" + r[2] + "</td><td>" + r[3] + "</td></tr>" }).join("") +
    '</tbody></table><p class="ev-why">Every number on this page traces back to one row here. A row marked "Source missing" is an open task.</p></section>'
}
