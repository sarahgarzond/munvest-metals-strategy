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

/* Market conditions are now the report's 24 indicators (outlook-data.js, SCN_CONDITIONS). */
var SCN_ADVANCED = []

var SCN_VISIONS = [
  { id: "open", name: "Open Door Europe", short: "Open Door" },
  { id: "stag", name: "Armoured Stagnation", short: "Stagnation" },
  { id: "super", name: "Electric Super-cycle", short: "Super-cycle" },
  { id: "fort", name: "Fortress Europe", short: "Fortress" },
  { id: "ren", name: "Engineering Renaissance", short: "Renaissance" }
]

var SCN_NEWS = {
  ev: {
    source: "IEA · 2026", url: "https://www.iea.org/reports/global-ev-outlook-2026/trends-in-electric-cars",
    event: "Global electric car sales rose 20% in 2025 to more than 20 million.",
    followup: "Tesla reported shipping its first Megapack with Nevada-made LFP cells in Q3 2026. LFP cells do not use nickel or cobalt in the cathode.",
    followupUrl: "https://www.sec.gov/Archives/edgar/data/1318605/000162828026066775/tsla-20260930.htm",
    followupSource: "Tesla SEC filing · Q3 2026",
  },
  energy: {
    source: "U.S. Department of Energy · October 2024", url: "https://www.energy.gov/oe/grid-resilience-and-innovation-partnerships-grip-program-projects",
    event: "The U.S. Department of Energy announced about $4.2 billion in grid investments across 46 projects.",
  },
  elec: {
    source: "SIA · February 2026", url: "https://www.semiconductors.org/global-annual-semiconductor-sales-increase-25-6-to-791-7-billion-in-2025/",
    event: "SIA reported that 2025 semiconductor sales rose 25.6% to $791.7 billion.",
  },
  auto: {
    source: "ACEA · April 2026", url: "https://www.acea.auto/publication/economic-and-market-report-global-and-eu-auto-industry-full-year-2025/",
    event: "ACEA reported that global new-car registrations rose 3.5% in 2025.",
  },
  aero: {
    source: "Airbus · January 2026", url: "https://www.airbus.com/en/newsroom/press-releases/2026-01-airbus-reports-793-commercial-aircraft-deliveries-in-2025",
    event: "Airbus reported 793 aircraft deliveries and 1,000 gross orders in 2025.",
  },
  med: {
    source: "European Commission · December 2025", url: "https://health.ec.europa.eu/publications/proposal-regulation-simplify-rules-medical-and-vitro-diagnostic-devices_en",
    event: "The European Commission proposed simplifying its medical-device rules.",
  },
  chem: {
    source: "Cefic · Q3 2026", url: "https://cefic.org/news/cefics-chemical-trends-report-q3-2026-is-out/",
    event: "Cefic reported weak demand, falling output and upstream overcapacity in European chemicals.",
  },
  og: {
    source: "IEA · 2026", url: "https://www.iea.org/data-and-statistics/data-tools/global-lng-capacity-tracker",
    event: "The IEA recorded four LNG project investment decisions from January to October 2026 in the United States and Canada.",
  },
  steel: {
    source: "worldsteel · October 2026", url: "https://worldsteel.org/media/press-releases/2026/worldsteel-short-range-outlook-october-2026/",
    event: "Worldsteel projected broadly flat global steel demand for 2026 and 1.7% growth in 2027.",
  },
  defence: {
    source: "NATO · June 2025", url: "https://nato.int/en/about-us/official-texts-and-resources/official-texts/2025/06/25/the-hague-summit-declaration",
    event: "NATO allies adopted a 2035 spending commitment, including at least 3.5% of GDP for core defence.",
  }
}

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

/* What-if assumptions, applied to the report baseline. Region factors are model inputs. */
var SCN_REGION_GROUPS = [
  { name: "Africa", factor: 0.5, regions: [
    ["africa", "Africa"], ["north-africa", "Northern Africa"], ["east-africa", "Eastern Africa"],
    ["central-africa", "Middle Africa"], ["southern-africa", "Southern Africa"], ["west-africa", "Western Africa"]
  ] },
  { name: "Americas", factor: 0.5, regions: [
    ["americas", "Americas"], ["northamerica", "Northern America", 0.45],
    ["latin-america-caribbean", "Latin America and the Caribbean"],
    ["central-america", "Central America"], ["caribbean", "Caribbean"], ["south-america", "South America"]
  ] },
  { name: "Asia", factor: 0.55, regions: [
    ["asia", "Asia"], ["central-asia", "Central Asia"], ["east-asia", "Eastern Asia"],
    ["southeast-asia", "South-eastern Asia"], ["south-asia", "Southern Asia"], ["west-asia", "Western Asia"]
  ] },
  { name: "Europe", factor: 0.65, regions: [
    ["europe", "Europe"], ["east-europe", "Eastern Europe"], ["north-europe", "Northern Europe"],
    ["south-europe", "Southern Europe"], ["west-europe", "Western Europe"]
  ] },
  { name: "Oceania", factor: 0.5, regions: [
    ["oceania", "Oceania"], ["australia-new-zealand", "Australia and New Zealand"],
    ["melanesia", "Melanesia"], ["micronesia", "Micronesia"], ["polynesia", "Polynesia"]
  ] },
  { name: "Polar regions", factor: 0, regions: [["antarctica", "Antarctica"]] }
]

var SCN_REGIONS = { global: { name: "Global", factor: 1 } }
SCN_REGION_GROUPS.forEach(function (group) {
  group.regions.forEach(function (entry) {
    SCN_REGIONS[entry[0]] = { name: entry[1], factor: entry.length === 3 ? entry[2] : group.factor, group: group.name }
  })
})

/* Illustrative regional demand tilts, shared by subregions unless specified. */
var SCN_REGIONAL_BASELINES = {
  Africa: { energy: 0.38, steel: 0.25, og: 0.25, auto: -0.12 },
  Americas: { energy: 0.25, elec: 0.30, aero: 0.24, og: 0.15 },
  Asia: { ev: 0.35, elec: 0.40, steel: 0.22, energy: 0.24 },
  Europe: { energy: 0.32, chem: -0.27, auto: -0.12, aero: 0.22 },
  Oceania: { energy: 0.28, og: 0.20, steel: 0.12, elec: -0.16 }
}

var SCN_INDUSTRY_DRIVERS = [
  { id: "ev", name: "EVs and batteries", grow: ["Affordable EV models scale up", "Fleet electrification accelerates", "Local battery plants expand"], fall: ["EV incentives expire", "Battery plants delay expansion", "Buyers switch to hybrids"] },
  { id: "energy", name: "Energy and power", grow: ["Grid upgrades accelerate", "Renewables win more capacity", "Nuclear projects reach construction"], fall: ["Grid connections are delayed", "Power projects lose funding"] },
  { id: "elec", name: "Electronics", grow: ["New chip plants open", "Data centre demand rises"], fall: ["Chipmakers delay investment", "Electronics orders weaken"] },
  { id: "auto", name: "Automotive", grow: ["Vehicle production expands", "Manufacturers bring production home"], fall: ["Vehicle sales slow", "Plants cut output"] },
  { id: "aero", name: "Aerospace", grow: ["Airlines replace older aircraft", "Aircraft makers increase deliveries"], fall: ["Airlines defer deliveries", "Aircraft makers cut output"] },
  { id: "med", name: "Medical technology", grow: ["Implant procedures increase", "Hospitals upgrade equipment"], fall: ["Hospitals defer purchases", "Procedure volumes weaken"] },
  { id: "chem", name: "Chemical processing", grow: ["Plants invest in retrofits", "Demand for specialty chemicals rises"], fall: ["High energy costs force closures", "Chemical orders weaken"] },
  { id: "og", name: "Oil and gas", grow: ["LNG projects proceed", "Operators increase maintenance"], fall: ["Producers defer projects", "LNG investments slow"] },
  { id: "steel", name: "Steel and construction", grow: ["Infrastructure projects accelerate", "Construction investment recovers"], fall: ["High borrowing costs delay projects", "Steel orders decline"] },
  { id: "defence", name: "Defence", grow: ["Procurement budgets rise", "Manufacturers expand capacity"], fall: ["Procurement programmes slip", "Public budgets tighten"] }
]

function scnRegion(params) {
  var country = typeof trkCountry === "function" ? trkCountry(params) : ""
  if (country && SCN_REGIONS[TRK_GEO[country][3]]) return TRK_GEO[country][3]
  var region = params && params.get("scn-region")
  if (Object.prototype.hasOwnProperty.call(SCN_REGIONS, region)) return region
  // Older scenario links can carry a region on an individual industry.
  var legacy = SCN_INDUSTRY_DRIVERS.map(function (industry) {
    return params && params.get("scn-" + industry.id + "-region")
  }).find(function (value) { return Object.prototype.hasOwnProperty.call(SCN_REGIONS, value) })
  return legacy || "global"
}

function scnIndustryAssumption(params, industry) {
  var prefix = "scn-" + industry.id + "-"
  var region = scnRegion(params)
  var legacy = params && params.get(prefix + "direction")
  var rawLevel = params && params.get(prefix + "level")
  var level = Number(rawLevel)
  if (rawLevel == null || !Number.isFinite(level) || Math.abs(level) > 2) {
    level = legacy === "grow" ? 2 : legacy === "fall" ? -2 : 0
  }
  if (typeof trkEventLevel === "function") level = Math.max(-2, Math.min(2, level + trkEventLevel(params, industry.id)))
  var profile = SCN_REGIONS[region]
  var baseline = SCN_REGIONAL_BASELINES[profile.group]?.[industry.id] || 0
  var shift = Math.max(-1, Math.min(1, baseline + level / 2 * profile.factor))
  return { region: region, level: level, shift: shift }
}

function scnResetUpdates() {
  var updates = { a: null, b: null, c: null, d: null, "scn-case": null, "scn-industry": null, "scn-region": null, "scn-country": null, "scn-ev-industry": null, "scn-preset": null, focus: null }
  if (typeof trkEvents === "function") trkEvents().forEach(function (e) { updates["ev-" + e.id] = null })
  SCN_INDUSTRY_DRIVERS.forEach(function (industry) {
    ["region", "direction", "level", "path"].forEach(function (key) { updates["scn-" + industry.id + "-" + key] = null })
  })
  SCN_ADVANCED.forEach(function (item) { updates[item.key] = null })
  if (typeof RPT_INDICATORS !== "undefined") RPT_INDICATORS.forEach(function (x) { updates["mc-" + x.id] = null })
  return updates
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

function scnDriverValue(params, driver) {
  var value = Number(params && params.get(driver.key))
  if (Number.isInteger(value) && value >= 10 && value <= 90) return value
  return scnConditionDriver(params, driver.key).value
}

/* Driver probability from the report's indicators: 50% + 24 points × average indicator score. */
function scnConditionScore(params, item) {
  var raw = params && params.get("mc-" + item.id)
  var v = Number(raw)
  return raw != null && raw !== "" && Number.isInteger(v) && Math.abs(v) <= 2 ? v : item.score
}

function scnConditionDriver(params, key) {
  var list = typeof RPT_INDICATORS === "undefined" ? [] : RPT_INDICATORS.filter(function (x) { return x.d === key })
  if (!list.length) return { value: SCN_DRIVERS.find(function (d) { return d.key === key }).def, changed: 0 }
  var sum = 0, changed = 0
  list.forEach(function (x) { var v = scnConditionScore(params, x); sum += v; if (v !== x.score) changed += 1 })
  return { value: Math.max(10, Math.min(90, Math.round(50 + 24 * sum / list.length))), changed: changed }
}

function scnAdvancedValue(params, item) {
  var value = Number(params && params.get(item.key))
  return Number.isInteger(value) && Math.abs(value) <= 2 ? value : 0
}

function scnDrivers(params) {
  var out = {}
  SCN_DRIVERS.forEach(function (d) {
    out[d.key] = scnDriverValue(params, d)
  })
  SCN_ADVANCED.forEach(function (item) {
    out[item.driver] = Math.max(10, Math.min(90, out[item.driver] + scnAdvancedValue(params, item) * item.effect))
  })
  return out
}

function scnModel(params) {
  var dr = scnDrivers(params)
  var p = [dr.a / 100, dr.b / 100, dr.c / 100, dr.d / 100]
  var assumptionParams = params
  var assumptions = SCN_INDUSTRY_DRIVERS.map(function (industry) {
    var input = scnIndustryAssumption(assumptionParams, industry)
    return { id: industry.id, name: industry.name, grow: industry.grow, fall: industry.fall, shift: input.shift }
  })
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
    ind[key] = { per: per }
  })
  /* Industry assumptions change industry scores only. Vision likelihoods move only with the drivers
     (market conditions or a start point), so a metal moves only through its own end markets. */
  assumptions.forEach(function (industry) {
    var result = ind[industry.id]
    result.per = result.per.map(function (score) { return Math.max(-2, Math.min(2, score + 0.6 * industry.shift)) })
    result.index = scnWeighted(result.per, vis)
  })
  var results = SCN_PRODUCTS.map(function (pr) {
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
  var metals = SCN_METAL_SHARES.map(function (m) {
    var per = SCN_VISIONS.map(function (v, i) {
      return Object.keys(m.s).reduce(function (sum, k) { return k === "other" ? sum : sum + m.s[k][0] / 100 * ind[k].per[i] }, 0)
    })
    var chance = 0
    SCN_VISIONS.forEach(function (v, i) { if (per[i] > 0) chance += vis[v.id].p })
    var index = scnWeighted(per, vis)
    var w = {}
    Object.keys(m.s).forEach(function (k) { if (k !== "other") w[k] = m.s[k][0] })
    return { name: m.use, metal: m.metal, w: w, shares: m, per: per, index: index, chance: chance, strategy: scnMetalCall(index) }
  })
  var model = { region: scnRegion(params), drivers: dr, visions: vis, industries: ind, assumptions: assumptions, selectedCase: params?.get("scn-case"), products: results, metalOutlooks: metals }
  return model
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

function scnMetalCall(index) {
  var c = SCN_CALLS.find(function (x) { return index >= x.min })
  return { label: c.label, cls: c.cls, text: c.text }
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

/* ---------- Market scenarios (simulator) ---------- */

function scnLevelLabel(level) {
  if (!level) return "Evidence baseline"
  return (level > 0 ? "+" : "−") + Math.round(Math.abs(level) * 25) + "% demand in 2035 vs baseline"
}

function scnPctLabel(level) {
  var pct = Math.round(level * 25)
  return pct === 0 ? "baseline" : (pct > 0 ? "+" : "−") + Math.abs(pct) + "%"
}

function scnDriverPanel(params) {
  var sliders = SCN_INDUSTRY_DRIVERS.map(function (item) {
    var key = "scn-" + item.id + "-level"
    var raw = Number(params.get(key))
    var level = Number.isFinite(raw) && Math.abs(raw) <= 2 ? raw : 0
    var help = typeof trkSliderHelp === "function" ? trkSliderHelp(item.id) : ""
    var cls = level > 0 ? "up" : level < 0 ? "down" : ""
    return '<div class="trk-srow' + (level ? " changed" : "") + '"><div class="trk-shead"><label for="' + key + '">' + esc(item.name) + '</label>' +
      '<output id="out-' + key + '" class="trk-delta ' + cls + '">' + scnPctLabel(level) + '</output></div>' +
      '<input type="range" id="' + key + '" min="-50" max="50" step="5" value="' + Math.round(level * 25) + '" data-scale="25" data-industry-slider="' + item.id + '"' +
      ' aria-valuetext="' + scnLevelLabel(level) + '">' +
      '<div class="trk-sscale" aria-hidden="true"><span>−50%</span><span>baseline</span><span>+50%</span></div>' +
      '<details class="trk-smore"><summary>What this moves</summary><p>' + help + '</p></details></div>'
  }).join("")
  var filtersOpen = params.get("scn-filters") !== "0"
  return '<section class="scn-panel" aria-labelledby="scn-drivers-heading"><div class="scn-reset"><h2 id="scn-drivers-heading" class="scn-heading">Your 2035 assumptions by industry</h2>' +
    '<div class="scn-toolbar">' + (typeof trkCountrySelect === "function" ? trkCountrySelect(params) : "") +
    '<button id="scn-reset" type="button" class="ev-csv" data-action="scn-reset">Reset to evidence baseline</button></div></div>' +
    scnPresetBar(params) +
    '<p class="trk-help">Each slider is the change in 2035 demand for that industry against the report baseline (±50% is the largest change the model allows). A metal moves only by the share of its use in that industry: open “What this moves”.</p>' +
    '<div class="trk-sgrid">' + sliders + '</div>' +
    '<details class="scn-inline-filters"' + (filtersOpen ? ' open' : '') + '><summary id="scn-filters-button" data-action="scn-toggle-filters">Advanced filters: 2035 market conditions and tracker values</summary>' +
    (filtersOpen ? '<div class="scn-filter-fields">' + (typeof olConditions === "function" ? olConditions(params) : "") +
      (typeof trkEventPanel === "function" ? trkEventPanel(params) : "") + '</div>' : '') +
    '</details></section>'
}

/* Start points: the evidence baseline or one of the five visions (drivers set to 85% / 15%, illustrative). */
function scnPresetBar(params) {
  if (typeof RPT_PRESETS === "undefined") return ""
  var current = params.get("scn-preset") || ""
  var page = readRoute().page
  return '<div class="trk-presets" role="group" aria-label="Start from"><span>Start from:</span>' +
    '<button type="button" class="trk-chip' + (current ? '' : ' on') + '" data-action="scn-preset" data-preset="">Evidence baseline</button>' +
    SCN_VISIONS.map(function (v) {
      return '<button type="button" class="trk-chip' + (current === v.id ? ' on' : '') + '" data-action="scn-preset" data-preset="' + v.id + '" style="--c:' + RPT_COLORS[v.id] + '">' + esc(v.name) + '</button>'
    }).join("") + (current ? '<span class="trk-note">Drivers set to 85% / 15% for ' + esc(SCN_VISIONS.find(function (v) { return v.id === current }).name) + ' (illustrative start point). <a href="#/report?go=rpt-' + current + '">Read the brief →</a></span>' : '') + '</div>'
}

/* The scenario card names the demand path that best matches the inputs. Its rows show the modelled change in
   2035 demand for each industry (shift × 50%, the same scale as the sliders). The path weight is its share among the
   candidate paths. Paths and example company actions are illustrative storylines, not sourced forecasts. */

function scnMetalProducts(model) {
  return model.metalOutlooks.filter(function (product) { return product.metal })
    .sort(function (a, b) { return a.metal.localeCompare(b.metal) })
}

/* ---------- Link from a project scenario to the sector strategy ---------- */

function scnFitStrip(scenario) {
  var key = SCN_SCENARIO_SECTOR[scenario.industry]
  if (!key) return ""
  var route = readRoute()
  var model = scnModel(route.params)
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
  var route = readRoute()
  var model = scnModel(route.params)
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
  a.download = (kind === "products" ? "product-lines" : "market-outlook") + ".csv"
  document.body.appendChild(a)
  a.click()
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove() }, 0)
}

