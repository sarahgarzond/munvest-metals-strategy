"use strict"

/* Market scenarios to 2035 — the scenario model from the Münvest report, as a live simulator.
   Drivers (probability of the first state) → 16 combinations → 5 visions → industry scores → sectors and product lines.
   Default driver values come from the 24 sourced indicators in the report (sections 3–4). */

var SCN_DRIVERS = [
  { key: "a", name: "A · European industry strong", low: "Weak", high: "Strong", def: 50, scores: "0, +2, −2, −2, +1, +1" },
  { key: "b", name: "B · Stance on China closed", low: "Open", high: "Closed", def: 46, scores: "+1, +1, +1, −1, −2, −1" },
  { key: "c", name: "C · Critical-metal supply tight", low: "Loose", high: "Tight", def: 54, scores: "+2, +2, −2, +1, −1, −1" },
  { key: "d", name: "D · Technology change fast", low: "Slow", high: "Fast", def: 58, scores: "+2, 0, −1, +1, −1, +1" }
]

var SCN_VISIONS = [
  { id: "open", name: "Open Door Europe", short: "Open Door" },
  { id: "stag", name: "Armoured Stagnation", short: "Stagnation" },
  { id: "super", name: "Electric Super-cycle", short: "Super-cycle" },
  { id: "fort", name: "Fortress Europe", short: "Fortress" },
  { id: "ren", name: "Engineering Renaissance", short: "Renaissance" }
]

/* Industry score = base trend + Σ sensitivity × average driver state, capped at ±2 (report section 6).
   Oil and gas is scored with the same formula (report section 10). */
var SCN_INDUSTRIES = {
  aero: { name: "Aerospace", s: [1.0, 0.3, -0.3, -0.3, 0.3] },
  defence: { name: "Defence", s: [1.0, 0.3, 0.7, 0, 0] },
  energy: { name: "Energy and power", s: [0.5, 0.8, -0.3, 0, 0.5] },
  auto: { name: "EU-owned car making", s: [-0.5, 1.0, 0.5, 0, 0] },
  ev: { name: "EU-made batteries (EV chain)", s: [1.0, 0.3, -0.5, 0, 0.5] },
  steel: { name: "Steel and construction", s: [0, 1.0, 0.3, 0, 0] },
  chem: { name: "Chemicals", s: [-1.0, 0.8, -0.2, -0.3, 0] },
  elec: { name: "Electronics", s: [0.5, 0.5, -0.3, 0, 0.5] },
  med: { name: "Medical", s: [0.5, 0.1, 0, 0, 0.1] },
  og: { name: "Oil and gas", s: [0.3, 0.3, 0.5, 0, -0.5] }
}

/* The seven sectors of the project brief. */
var SCN_SECTORS = [
  { id: "aero", name: "Aerospace", key: "aero", note: "defence" },
  { id: "energy", name: "Energy and Environmental Technology", key: "energy" },
  { id: "med", name: "Medical Technology", key: "med" },
  { id: "elec", name: "Electronics and Electrical Engineering", key: "elec" },
  { id: "og", name: "Oil and Gas", key: "og" },
  { id: "auto", name: "Automotive", key: "auto", note: "ev" },
  { id: "chem", name: "Chemical Processing", key: "chem" }
]

/* The client's product lines (project brief). Weights: 2 = main sector, 1 = secondary sector.
   The links are our mapping and need checking with the company. */
var SCN_PRODUCTS = [
  { name: "AM powders", w: { aero: 2, med: 2 }, action: "Qualify nickel and cobalt powders for engine parts and implants (small base)." },
  { name: "Cobalt alloys", metal: "Cobalt", w: { aero: 2, med: 2, energy: 1 }, action: "Engine wear parts and implants; secure cobalt through recycling, outside the DRC quota." },
  { name: "Copper products", metal: "Copper", w: { elec: 2, energy: 2, ev: 1 }, action: "Grid, power electronics and EV busbars." },
  { name: "Aluminium products", metal: "Aluminium", w: { aero: 2, auto: 2, ev: 1 }, action: "Move from combustion-engine parts to aerospace plate and EV parts." },
  { name: "Nickel alloys", metal: "Nickel", w: { aero: 2, energy: 2, og: 2, chem: 2 }, action: "New capacity to aerospace and energy grades; cap the share sold to European chemical plants." },
  { name: "Welding consumables", w: { og: 2, chem: 2, energy: 2 }, action: "Volume follows energy and LNG projects." },
  { name: "Zirconium", metal: "Zirconium", w: { chem: 2, energy: 2 }, action: "Move sales effort from EU chemicals to nuclear and energy." },
  { name: "Specialty stainless", w: { chem: 2, og: 2, energy: 1 }, action: "LNG, hydrogen and energy projects; no new capacity for European chemical new-build." }
]

/* Which sector each project scenario on the Future demand page belongs to. */
var SCN_SCENARIO_SECTOR = {
  Nuclear: "energy", Energy: "energy", Hydrogen: "energy", "Power grid": "energy",
  Aerospace: "aero", Defense: "defence", Automotive: "ev", Semiconductors: "elec", "Oil and gas": "og"
}

function scnVisionOf(A, B, C, D) {
  if (!A) return B ? "stag" : "open"
  if (!C && D) return "ren"
  return B ? "fort" : "super"
}

function scnDrivers(params) {
  var out = {}
  SCN_DRIVERS.forEach(function (d) {
    var v = Number(params && params.get(d.key))
    out[d.key] = Number.isInteger(v) && v >= 10 && v <= 90 ? v : d.def
  })
  return out
}

function scnModel(params) {
  var dr = scnDrivers(params)
  var p = [dr.a / 100, dr.b / 100, dr.c / 100, dr.d / 100]
  var vis = {}
  SCN_VISIONS.forEach(function (v) { vis[v.id] = { p: 0, st: [0, 0, 0, 0] } })
  for (var m = 0; m < 16; m += 1) {
    var s = [m & 8 ? 1 : 0, m & 4 ? 1 : 0, m & 2 ? 1 : 0, m & 1 ? 1 : 0]
    var prob = 1
    for (var k = 0; k < 4; k += 1) prob *= s[k] ? p[k] : 1 - p[k]
    var v = vis[scnVisionOf(s[0], s[1], s[2], s[3])]
    v.p += prob
    for (var j = 0; j < 4; j += 1) v.st[j] += prob * (s[j] ? 1 : -1)
  }
  SCN_VISIONS.forEach(function (v) {
    var x = vis[v.id]
    x.st = x.st.map(function (t) { return x.p ? t / x.p : 0 })
  })
  var ind = {}
  Object.keys(SCN_INDUSTRIES).forEach(function (key) {
    var sens = SCN_INDUSTRIES[key].s
    var per = SCN_VISIONS.map(function (v) {
      var st = vis[v.id].st
      var score = sens[0] + sens[1] * st[0] + sens[2] * st[1] + sens[3] * st[2] + sens[4] * st[3]
      return Math.max(-2, Math.min(2, score))
    })
    ind[key] = { per: per, index: scnWeighted(per, vis) }
  })
  var products = SCN_PRODUCTS.map(function (pr) {
    var total = 0
    Object.keys(pr.w).forEach(function (k) { total += pr.w[k] })
    var per = SCN_VISIONS.map(function (v, i) {
      var sum = 0
      Object.keys(pr.w).forEach(function (k) { sum += ind[k].per[i] * pr.w[k] })
      return sum / total
    })
    var chance = 0
    SCN_VISIONS.forEach(function (v, i) { if (per[i] > 0) chance += vis[v.id].p })
    var index = scnWeighted(per, vis)
    return { name: pr.name, metal: pr.metal, w: pr.w, action: pr.action, per: per, index: index, chance: chance, strategy: scnProductStrategy(index) }
  })
  return { drivers: dr, visions: vis, industries: ind, products: products }
}

function scnWeighted(per, vis) {
  var out = 0
  SCN_VISIONS.forEach(function (v, i) { out += vis[v.id].p * per[i] })
  return out
}

function scnSectorStrategy(sector, ind) {
  var x = ind[sector.key].index
  if (sector.id === "auto" && x < 0 && ind.ev.index >= 0.5) return { label: "Shift to EV", cls: "shift" }
  if (x >= 0.5) return { label: "Grow", cls: "grow" }
  if (x >= 0) return { label: "Hold", cls: "hold" }
  if (x >= -0.75) return { label: "Cut", cls: "shift" }
  return { label: "Reduce in EU", cls: "reduce" }
}

function scnProductStrategy(index) {
  if (index >= 0.5) return { label: "Grow", cls: "grow" }
  if (index >= 0) return { label: "Shift", cls: "shift" }
  return { label: "Hold", cls: "hold" }
}

function scnSigned(v) {
  var r = Math.round(v * 100) / 100
  if (r === 0) return "0.00"
  return (r > 0 ? "+" : "−") + Math.abs(r).toFixed(2)
}

function scnPct(p) { return Math.round(p * 100) + "%" }

function scnShade(v) {
  var t = Math.min(Math.abs(v) / 1.2, 1)
  var a = v > 0 ? [43, 108, 176] : [215, 125, 49]
  var c = a.map(function (x) { return Math.round(255 + (x - 255) * (0.2 + 0.8 * t)) })
  return "rgb(" + c.join(",") + ")"
}

function scnInk(v) { return Math.abs(v) > 0.65 ? "#fff" : "#24343c" }

function scnKeep(params) {
  var q = new URLSearchParams()
  SCN_DRIVERS.forEach(function (d) { if (params.get(d.key)) q.set(d.key, params.get(d.key)) })
  var s = q.toString()
  return s ? "?" + s : ""
}

/* ---------- Market scenarios (simulator) ---------- */

function scnDriverPanel(model) {
  return '<section class="scn-panel" aria-labelledby="scn-drivers-heading"><div class="scn-reset"><h2 id="scn-drivers-heading" class="scn-heading">Drivers</h2><button type="button" class="ev-csv" data-action="scn-reset">Reset to evidence-based values</button></div>' +
    '<div class="scn-drivers">' + SCN_DRIVERS.map(function (d) {
      var v = model.drivers[d.key]
      return '<label class="scn-driver"><span class="scn-driver-name">' + esc(d.name) + ' <b id="scn-val-' + d.key + '">' + v + "%</b></span>" +
        '<input type="range" min="10" max="90" step="1" value="' + v + '" data-driver="' + d.key + '" id="scn-' + d.key + '" aria-label="' + esc(d.name) + '">' +
        '<span class="scn-ends"><span>' + esc(d.low) + "</span><span>" + esc(d.high) + "</span></span></label>"
    }).join("") + "</div></section>"
}

function scnLikelihoods(model) {
  var max = 0
  SCN_VISIONS.forEach(function (v) { max = Math.max(max, model.visions[v.id].p) })
  return SCN_VISIONS.map(function (v) {
    var p = model.visions[v.id].p
    return '<div class="scn-lk"><span>' + esc(v.name) + '</span><span class="scn-lk-track"><span class="scn-lk-bar' + (p === max ? " top" : "") + '" style="width:' + (p / max * 100).toFixed(1) + '%"></span></span><b>' + scnPct(p) + "</b></div>"
  }).join("")
}

function scnSquares(per) {
  return '<span class="scn-squares">' + per.map(function (v, i) {
    return '<i style="background:' + scnShade(v) + '" title="' + esc(SCN_VISIONS[i].short + " " + scnSigned(v)) + '"></i>'
  }).join("") + "</span>"
}

function scnMetalProducts(model) {
  return model.products.filter(function (product) { return product.metal })
    .sort(function (a, b) { return a.metal.localeCompare(b.metal) })
}

function scnMetalCards(model) {
  return scnMetalProducts(model).map(function (product) {
    return '<article class="scn-card"><h3>' + esc(product.metal) + '</h3><p class="scn-ix">' + scnSigned(product.index) + "</p>" +
      scnSquares(product.per) + '<span class="scn-badge scn-' + product.strategy.cls + '">' + esc(product.strategy.label) + "</span></article>"
  }).join("")
}

function scnCalcTable(model) {
  return '<details class="ev-box ev-wide scn-calc"><summary>Show calculation</summary>' +
    '<p class="ev-why">The starting driver settings use 24 indicators from report sections 3–4. Each metal uses the model’s matching product line. ' +
    'Its score in each scenario is a weighted average of the end markets for that product line. The overall index (−2 to +2) weights those scores by scenario likelihood. ' +
    'The five squares show the separate scenario scores (blue for growth, orange for decline). These scores describe the modeled market outlook.</p>' +
    '<div class="scn-table-wrap"><table class="ev-table"><thead><tr><th>Metal</th><th>Product line</th>' +
    SCN_VISIONS.map(function (vision) { return '<th class="num">' + esc(vision.short) + "</th>" }).join("") +
    '<th class="num">Index</th></tr></thead><tbody>' +
    scnMetalProducts(model).map(function (product) {
      return "<tr><td>" + esc(product.metal) + "</td><td>" + esc(product.name) + "</td>" +
        product.per.map(function (score) { return '<td class="num">' + scnSigned(score) + "</td>" }).join("") +
        '<td class="num"><b>' + scnSigned(product.index) + "</b></td></tr>"
    }).join("") + "</tbody></table></div>" +
    '<button type="button" class="ev-csv" data-action="scn-csv" data-kind="metals">Download CSV</button></details>'
}

function scnPaintTrends(model) {
  var lk = document.getElementById("scn-likelihoods")
  var cards = document.getElementById("scn-metals")
  var calc = document.getElementById("scn-calc")
  if (!lk || !cards || !calc) return false
  lk.innerHTML = scnLikelihoods(model)
  cards.innerHTML = scnMetalCards(model)
  var open = calc.querySelector("details") && calc.querySelector("details").open
  calc.innerHTML = scnCalcTable(model)
  if (open) calc.querySelector("details").open = true
  SCN_DRIVERS.forEach(function (d) {
    var label = document.getElementById("scn-val-" + d.key)
    if (label) label.textContent = model.drivers[d.key] + "%"
  })
  return true
}

function viewSimulator(route) {
  var model = scnModel(route.params)
  return '<div class="scn">' + pageHead("Market scenarios to 2035") +
    scnDriverPanel(model) +
    '<div class="scn-grid"><section class="scn-panel" aria-labelledby="scn-likelihoods-heading"><h2 id="scn-likelihoods-heading" class="scn-heading">Likelihood by scenario</h2><div id="scn-likelihoods" class="scn-body">' + scnLikelihoods(model) + "</div></section>" +
    '<section class="scn-panel" aria-labelledby="scn-metal-heading"><h2 id="scn-metal-heading" class="scn-heading">Market outlook by metal</h2>' +
    '<div id="scn-metals" class="scn-body scn-cards">' + scnMetalCards(model) + "</div></section></div>" +
    '<div id="scn-calc">' + scnCalcTable(model) + "</div>" +
    '<p class="scn-link"><a href="#/strategy' + scnKeep(route.params) + '">See what this means for each product line →</a></p></div>'
}

/* ---------- Board strategy ---------- */

function scnStrips(model) {
  var head = '<div class="scn-strip scn-strip-head"><span></span><span class="scn-strip-bar">' + SCN_VISIONS.map(function (v) {
    var p = model.visions[v.id].p
    return '<span style="width:' + (p * 100).toFixed(2) + '%"><b>' + esc(v.short) + "</b>" + scnPct(p) + "</span>"
  }).join("") + '</span><span class="scn-chance">Chance of growth</span><span>Strategy</span><span>What the board does</span></div>'
  var rows = model.products.slice().sort(function (a, b) { return b.index - a.index }).map(function (pr) {
    return '<div class="scn-strip"><span class="scn-strip-name">' + esc(pr.name) + '<small>expected ' + scnSigned(pr.index) + "</small></span>" +
      '<span class="scn-strip-bar">' + SCN_VISIONS.map(function (v, i) {
        var val = pr.per[i]
        return '<span style="width:' + (model.visions[v.id].p * 100).toFixed(2) + "%;background:" + scnShade(val) + ";color:" + scnInk(val) + '" title="' + esc(v.short + " " + scnSigned(val)) + '">' + scnSigned(val) + "</span>"
      }).join("") + '</span><span class="scn-chance scn-' + pr.strategy.cls + '-ink">' + scnPct(pr.chance) + "</span>" +
      '<span><span class="scn-badge scn-' + pr.strategy.cls + '">' + esc(pr.strategy.label) + '</span></span><span class="scn-action">' + esc(pr.action) + "</span></div>"
  }).join("")
  return head + rows
}

function scnPaintStrategy(model) {
  var el = document.getElementById("scn-strips")
  if (!el) return false
  el.innerHTML = scnStrips(model)
  return true
}

function viewStrategy(route) {
  var model = scnModel(route.params)
  var nickel = model.products.filter(function (p) { return p.name === "Nickel alloys" })[0]
  return '<div class="scn">' + pageHead("Strategy for the board") +
    '<p class="scn-sub">How each of the client\'s product lines does in each future. Each bar is 2035 split by likelihood: a wider block is a more likely vision. Blue = demand grows, orange = demand falls.</p>' +
    '<section class="scn-panel"><div id="scn-strips" class="scn-body">' + scnStrips(model) + "</div></section>" +
    '<section class="ev-box ev-wide"><h3>How to read it</h3><p>Chance of growth = total likelihood of the visions in which the product line grows. ' +
    "Strategy rule: expected value above +0.5 grow, 0 to +0.5 shift the mix, below 0 hold. Product scores average the industry scores of each product's sectors, main sectors counted twice " +
    "(nickel alloys: aerospace, energy, oil and gas and chemicals → expected " + scnSigned(nickel.index) + ").</p>" +
    '<p class="ev-why">The product-to-sector links are our mapping from the client portfolio in the project brief and need checking with the company.</p>' +
    '<button type="button" class="ev-csv" data-action="scn-csv" data-kind="products">Download CSV</button></section>' +
    '<section class="ev-box ev-wide"><h3>Bottom line for the board</h3><p>Put capacity and qualification first into aerospace and energy grades; join the EV shift through copper and aluminium; keep European chemicals as a maintenance market only. Raw materials from outside China and the DRC quota.</p></section>' +
    '<p class="scn-link"><a href="#/trends' + scnKeep(route.params) + '">← Change the drivers in the scenario simulator</a></p></div>'
}

/* ---------- Link from a project scenario to the sector strategy ---------- */

function scnFitStrip(scenario) {
  var key = SCN_SCENARIO_SECTOR[scenario.industry]
  if (!key) return ""
  var model = scnModel(readRoute().params)
  var x = model.industries[key]
  var positive = x.per.filter(function (v) { return v > 0 }).length
  var sector = SCN_SECTORS.filter(function (s) { return s.key === key })[0]
  var name = sector ? sector.name : SCN_INDUSTRIES[key].name
  var st = sector ? scnSectorStrategy(sector, model.industries) : scnProductStrategy(x.index)
  return '<section class="scn-fit"><span class="scn-badge scn-' + st.cls + '">' + esc(st.label) + "</span><span>Fits the sector strategy: <b>" + esc(name) +
    "</b> · index " + scnSigned(x.index) + " · grows in " + positive + ' of 5 visions · <a href="#/trends">open simulator</a></span></section>'
}

/* ---------- CSV ---------- */

function scnCsv(kind) {
  var model = scnModel(readRoute().params)
  var rows
  if (kind === "products") {
    rows = [["Product line", "Sectors (weight)"].concat(SCN_VISIONS.map(function (v) { return v.short })).concat(["Expected", "Chance of growth", "Strategy"])]
    model.products.forEach(function (p) {
      rows.push([p.name, Object.keys(p.w).map(function (k) { return SCN_INDUSTRIES[k].name + " ×" + p.w[k] }).join("; ")]
        .concat(p.per.map(function (v) { return v.toFixed(2) })).concat([p.index.toFixed(2), Math.round(p.chance * 100) + "%", p.strategy.label]))
    })
  } else {
    rows = [["Metal", "Product line"].concat(SCN_VISIONS.map(function (v) { return v.short })).concat(["Index"])]
    scnMetalProducts(model).forEach(function (product) {
      rows.push([product.metal, product.name].concat(product.per.map(function (score) { return score.toFixed(2) }))
        .concat([product.index.toFixed(2)]))
    })
    rows.push([])
    rows.push(["Vision", "Likelihood"])
    SCN_VISIONS.forEach(function (v) { rows.push([v.name, (model.visions[v.id].p * 100).toFixed(1) + "%"]) })
    rows.push([])
    rows.push(["Driver", "Probability"])
    SCN_DRIVERS.forEach(function (d) { rows.push([d.name, model.drivers[d.key] + "%"]) })
  }
  var csv = "﻿" + rows.map(function (r) {
    return r.map(function (c) { var s = String(c); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s }).join(",")
  }).join("\n")
  var a = document.createElement("a")
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
  a.download = (kind === "products" ? "board-strategy" : "market-scenarios") + ".csv"
  document.body.appendChild(a)
  a.click()
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove() }, 0)
}

function scnSummary(model) {
  var top = SCN_VISIONS.slice().sort(function (x, y) { return model.visions[y.id].p - model.visions[x.id].p })[0]
  return "Most likely vision " + top.name + ", " + scnPct(model.visions[top.id].p)
}
