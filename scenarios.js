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

var SCN_ADVANCED = [
  { key: "investment", name: "Industrial investment", low: "Slower", high: "Faster", driver: "a", effect: 10 },
  { key: "financing", name: "Industrial financing costs", low: "Lower", high: "Higher", driver: "a", effect: -5 },
  { key: "tariffs", name: "Trade barriers", low: "Lower", high: "Higher", driver: "b", effect: 10 },
  { key: "recycling", name: "Metal recycling", low: "Slower", high: "Faster", driver: "c", effect: -10 },
  { key: "export-controls", name: "Critical-metal export controls", low: "Looser", high: "Tighter", driver: "c", effect: 5 },
  { key: "adoption", name: "Clean technology adoption", low: "Slower", high: "Faster", driver: "d", effect: 10 }
]

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

/* Profiles use the same −1 to +1 scale as the rescaled industry controls. */
/* Illustrative 2035 actions by organisations with a role in each market. */
var SCN_SECTOR_FACTORS = {
  ev: [["Volkswagen expands low-cost EV production", "CATL adds battery-cell lines", "Tesla opens more fast-charging sites"], ["Germany lets EV incentives lapse", "CATL delays new cell lines", "Volkswagen shifts orders toward hybrids"], "Tesla replaces battery-line equipment"],
  energy: [["France funds EDF’s next reactor builds", "National Grid awards transmission contracts", "UK awards offshore wind contracts"], ["UK delays offshore wind awards", "National Grid reschedules grid upgrades", "France defers EDF reactor funding"], "EDF renovates existing reactors"],
  elec: [["TSMC equips new fabs", "ASML adds lithography capacity", "Microsoft orders more data-centre equipment"], ["TSMC delays fab fit-outs", "Intel postpones tool orders", "Microsoft phases data-centre projects"], "TSMC replaces tools at existing fabs"],
  auto: [["Toyota expands hybrid assembly", "Volkswagen retools European plants", "Ford adds commercial-vehicle shifts"], ["Volkswagen cuts assembly shifts", "Ford defers factory retooling", "Toyota delays assembly-line expansion"], "Toyota renews existing model tooling"],
  aero: [["United orders fleet replacements", "Airbus adds A320 assembly slots", "GE Aerospace adds engine overhaul capacity"], ["Boeing pushes back delivery schedules", "United defers fleet replacements", "Airbus delays another assembly line"], "GE Aerospace overhauls in-service engines"],
  med: [["NHS England funds joint replacements", "Stryker adds implant production", "Siemens Healthineers equips more hospitals"], ["NHS England phases hospital equipment orders", "Stryker defers a plant expansion", "Siemens Healthineers delays production expansion"], "NHS trusts replace worn imaging equipment"],
  chem: [["BASF retrofits Ludwigshafen plants", "Dow upgrades chemical process equipment", "INEOS orders corrosion-resistant equipment"], ["BASF retires more Ludwigshafen units", "Dow postpones plant retrofits", "INEOS mothballs older capacity"], "BASF replaces equipment at existing plants"],
  og: [["QatarEnergy orders LNG train equipment", "Shell commits to additional LNG capacity", "ExxonMobil orders offshore equipment"], ["Shell defers LNG expansion", "QatarEnergy phases new train orders", "ExxonMobil postpones offshore projects"], "Shell orders parts for LNG maintenance"],
  steel: [["Germany tenders rail and bridge works", "ArcelorMittal adds steelmaking capacity", "Network Rail awards renewal contracts"], ["Germany postpones infrastructure tenders", "ArcelorMittal idles steel capacity", "Network Rail phases bridge renewals"], "Network Rail replaces worn track"],
  defence: [["Germany places multiyear procurement orders", "France awards equipment framework contracts", "UK brings forward procurement funding"], ["UK defers planned procurement awards", "Germany phases equipment contracts", "France delays new procurement funding"], "UK renews existing equipment contracts"]
}

var SCN_DEMAND_PATHS = [
  { id: "public-orders", title: "Public investment wave", factors: [["Germany tenders rail and bridge works", "steel"], ["France awards equipment framework contracts", "defence"]], level: 0.85, driver: "a", direction: 1 },
  { id: "cheap-credit", title: "Broad investment boom", factors: [["Toyota expands hybrid assembly", "auto"], ["TSMC equips new fabs", "elec"]], level: 0.95, driver: "a", direction: 1 },
  { id: "cheaper-power", title: "Power and plant investment", factors: [["France funds EDF’s next reactor builds", "energy"], ["National Grid awards transmission contracts", "energy"], ["BASF retrofits Ludwigshafen plants", "chem"]], level: 0.75, driver: "d", direction: 1 },
  { id: "tight-credit", title: "Investment slowdown", factors: [["Ford defers factory retooling", "auto"], ["Germany postpones infrastructure tenders", "steel"]], level: -0.95, driver: "a", direction: -1 },
  { id: "energy-shock", title: "Industrial projects put on hold", factors: [["BASF retires more Ludwigshafen units", "chem"], ["UK delays offshore wind awards", "energy"]], level: -0.85, driver: "c", direction: 1 },
  { id: "trade-shock", title: "Trade and budget squeeze", factors: [["Intel postpones tool orders", "elec"], ["UK defers planned procurement awards", "defence"]], level: -0.75, driver: "b", direction: 1 },
  { id: "replacement", title: "Replacement-led demand", factors: [["EDF renovates existing reactors", "energy"], ["BASF replaces equipment at existing plants", "chem"]], level: 0, driver: "d", direction: -1 },
  { id: "steady-consumption", title: "Steady consumer demand", factors: [["Toyota renews existing model tooling", "auto"], ["Network Rail replaces worn track", "steel"]], level: 0, driver: "a", direction: -1 },
  { id: "productivity", title: "Productivity offsets costs", factors: [["TSMC replaces tools at existing fabs", "elec"], ["Dow automates existing process lines", "chem"]], level: 0, driver: "d", direction: 1 }
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

var SCN_NORTH_AFRICA_ACTIONS = {
  energy: ["Morocco’s ONEE awards new grid contracts", "Morocco’s ONEE defers grid expansion", "Morocco’s ONEE renews grid equipment"],
  og: ["Sonatrach orders equipment for new gas capacity", "Sonatrach delays gas expansion orders", "Sonatrach replaces equipment at existing gas plants"],
  chem: ["OCP upgrades phosphate processing lines", "OCP postpones a processing-line expansion", "OCP renews equipment at existing plants"]
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

/* Additional outlooks use illustrative end-market weights and appear only in Market scenarios. */
var SCN_METAL_OUTLOOKS = [
  { metal: "Chromium", name: "Stainless and corrosion-resistant alloys", w: { steel: 2, chem: 1, energy: 1 } },
  { metal: "Molybdenum", name: "Alloy and stainless steels", w: { steel: 2, og: 1, chem: 1 } },
  { metal: "Tantalum", name: "Capacitors and sputtering targets", w: { elec: 2 } },
  { metal: "Titanium", name: "Aircraft and implant alloys", w: { aero: 2, med: 1 } },
  { metal: "Tungsten", name: "Carbide tooling and specialty materials", w: { steel: 2, auto: 1, aero: 1 } },
  { metal: "Lithium", name: "Rechargeable battery materials", w: { ev: 3, energy: 1 } },
  { metal: "Manganese", name: "Steelmaking and battery materials", w: { steel: 3, ev: 1 } },
  { metal: "Tin", name: "Electronics solder and tinplate", w: { elec: 3, steel: 1 } },
  { metal: "Zinc", name: "Galvanised steel and die castings", w: { steel: 3, auto: 1 } },
  { metal: "Vanadium", name: "High-strength steel and flow batteries", w: { steel: 3, energy: 1 } }
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
  return Number.isInteger(value) && value >= 10 && value <= 90 ? value : driver.def
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

function scnModel(params, byMetal) {
  var dr = scnDrivers(params)
  var p = [dr.a / 100, dr.b / 100, dr.c / 100, dr.d / 100]
  var assumptionParams = params
  if (byMetal) {
    assumptionParams = new URLSearchParams(params)
    var shifts = scnMetalIndustryShifts(params)
    SCN_INDUSTRY_DRIVERS.forEach(function (industry) {
      var key = "scn-" + industry.id
      assumptionParams.delete(key + "-direction")
      assumptionParams.set(key + "-level", Math.max(-2, Math.min(2, shifts[industry.id] || 0)))
    })
  }
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
  var totalLikelihood = 0
  SCN_VISIONS.forEach(function (vision, index) {
    var tilt = assumptions.reduce(function (sum, industry) {
      return sum + 0.4 * industry.shift * ind[industry.id].per[index]
    }, 0)
    vis[vision.id].p *= Math.exp(tilt)
    totalLikelihood += vis[vision.id].p
  })
  SCN_VISIONS.forEach(function (vision) { vis[vision.id].p /= totalLikelihood })
  assumptions.forEach(function (industry) {
    var result = ind[industry.id]
    result.per = result.per.map(function (score) { return Math.max(-2, Math.min(2, score + 0.6 * industry.shift)) })
    result.index = scnWeighted(result.per, vis)
  })
  var results = SCN_PRODUCTS.concat(SCN_METAL_OUTLOOKS).map(function (pr) {
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
  var model = { region: scnRegion(params), drivers: dr, visions: vis, industries: ind, assumptions: assumptions, selectedCase: params?.get("scn-case"), products: results.slice(0, SCN_PRODUCTS.length), metalOutlooks: results }
  return byMetal ? scnFilterMetalResults(model, params) : model
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
  Object.keys(scnResetUpdates()).forEach(function (key) { if (key !== "scn-industry" && key !== "scn-case" && params.get(key)) q.set(key, params.get(key)) })
  params.forEach(function (value, key) { if (/^scn-metal-/.test(key)) q.set(key, value) })
  var s = q.toString()
  return s ? "?" + s : ""
}

/* ---------- Market scenarios (simulator) ---------- */

function scnLevelLabel(level) {
  if (!level) return "Evidence baseline"
  return (level > 0 ? "+" : "−") + Math.round(Math.abs(level) * 25) + "% demand in 2035 vs baseline"
}

function scnPctLabel(level) {
  var pct = Math.round(level * 25)
  return pct === 0 ? "baseline" : (pct > 0 ? "+" : "−") + Math.abs(pct) + "%"
}

function scnDriverPanel(params, byMetal) {
  var controls = byMetal ? scnMetalDrivers(params) : SCN_INDUSTRY_DRIVERS.map(function (item) {
    var raw = Number(params.get("scn-" + item.id + "-level"))
    return { key: "scn-" + item.id + "-level", name: item.name, level: Number.isFinite(raw) && Math.abs(raw) <= 2 ? raw : 0 }
  })
  var sliders = controls.map(function (item) {
    var baseline = byMetal && typeof trkMetalBaseline === "function" ? trkMetalBaseline(item.name) : null
    var note = baseline ? esc(baseline.text) + (baseline.source ? " · " + trkSourceLink(baseline.source) : baseline.label ? " · " + esc(baseline.label) : "") : ""
    return '<div class="scn-industry-card"><label for="' + item.key + '">' + esc(item.name) +
      ' <output id="out-' + item.key + '" class="trk-delta ' + (item.level > 0 ? "up" : item.level < 0 ? "down" : "") + '">' + scnPctLabel(item.level) + '</output></label>' +
      '<input type="range" id="' + item.key + '" min="-50" max="50" step="5" value="' + Math.round(item.level * 25) + '" data-scale="25"' +
      (byMetal ? ' data-metal-slider="' + item.key + '"' : ' data-industry-slider="' + item.key.slice(4, -6) + '"') +
      ' aria-valuetext="' + scnLevelLabel(item.level) + '">' +
      '<div class="scn-slide-ends" aria-hidden="true"><span>−50%</span><span>0</span><span>+50%</span></div>' +
      (note ? '<p class="trk-baseline">' + note + '</p>' : '') +
      (typeof trkSliderHelp === "function" ? '<p class="trk-feeds">' + trkSliderHelp(byMetal, byMetal ? item.name : item.key.slice(4, -6)) + '</p>' : '') + '</div>'
  }).join("")
  var filtersOpen = params.get("scn-filters") !== "0"
  return '<section class="scn-panel" aria-labelledby="scn-drivers-heading"><div class="scn-reset"><h2 id="scn-drivers-heading" class="scn-heading">' +
    '<span class="trk-step">1</span>' + (byMetal ? "Set 2035 demand by metal" : "Set 2035 demand by industry") + '</h2>' +
    '<div class="scn-toolbar">' + (typeof trkCountrySelect === "function" ? trkCountrySelect(params) : "") +
    (byMetal ? scnMetalSelect(params, false) : '') +
    '<button id="scn-reset" type="button" class="ev-csv" data-action="scn-reset">Reset to evidence baseline</button></div></div>' +
    scnPresetBar(params) +
    '<p class="trk-help">Each slider is the change in 2035 demand against the baseline (' + (byMetal ? "tracker 2035 demand where it exists" : "report scenario model") +
    '). ±50% is the full range of the model. Results update as you move a slider.</p>' +
    '<div class="scn-industries">' + sliders + '</div>' +
    '<details class="scn-inline-filters"' + (filtersOpen ? ' open' : '') + '><summary id="scn-filters-button" data-action="scn-toggle-filters">Advanced filters: industry events, grades and market conditions</summary>' +
    (filtersOpen ? '<div class="scn-filter-fields">' +
      (typeof trkEventPanel === "function" ? trkEventPanel(params) : "") +
      (byMetal ? (scnMetalFilter(params) ? '<div class="scn-filter-select scn-grade-filter">' + scnMetalSelect(params, true) + '</div>' :
        '<p class="trk-note">Select a metal above to filter by grade or product.</p>') :
        scnAdvancedGroup("Scenario assumptions", SCN_DRIVERS, params, false) +
        scnAdvancedGroup("Market conditions", SCN_ADVANCED, params, true)) + '</div>' : '') +
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

function scnAdvancedGroup(title, items, params, relative) {
  return '<fieldset class="scn-advanced-group"><legend>' + esc(title) + '</legend><div class="scn-advanced-grid">' +
    items.map(function (item) {
      var value = relative ? scnAdvancedValue(params, item) : scnDriverValue(params, item)
      var id = "scn-advanced-" + item.key
      var name = relative ? item.name : item.name.slice(4)
      if (relative) {
        var labels = ["Much " + item.low.toLowerCase(), item.low, "Baseline", item.high, "Much " + item.high.toLowerCase()]
        return '<label class="scn-filter-select" for="' + id + '">' + esc(name) +
          '<select id="' + id + '" name="' + item.key + '" data-advanced-slider data-control>' +
          [-2, -1, 0, 1, 2].map(function (level, index) {
            return '<option value="' + level + '"' + (level === value ? ' selected' : '') + '>' + esc(labels[index]) + '</option>'
          }).join("") + '</select></label>'
      }
      return '<div class="scn-industry-card"><label for="' + id + '">' + esc(name) + '</label>' +
        '<input type="range" id="' + id + '" name="' + item.key + '" min="' + (relative ? -2 : 10) +
        '" max="' + (relative ? 2 : 90) + '" step="1" value="' + value + '" data-advanced-slider data-control>' +
        '<div class="scn-slide-ends" aria-hidden="true"><span>' + esc(item.low) + '</span><span>' + esc(item.high) + '</span></div></div>'
    }).join("") + '</div></fieldset>'
}

function scnAdjustmentLabel(value) {
  return ["Much lower", "Lower", "Baseline", "Higher", "Much higher"][value + 2]
}

function scnOpenPathways() {
  return Boolean(document.querySelector("#scn-likelihoods .scn-alternatives[open]"))
}

function scnDemandScenarios(model) {
  var settings = model.assumptions
  var average = settings.reduce(function (sum, item) { return sum + item.shift }, 0) / settings.length
  var candidates = SCN_DEMAND_PATHS.map(function (path) {
    var prior = model.drivers[path.driver] / 100
    return { id: path.id, title: path.title, factors: path.factors, level: path.level, overrides: {}, prior: path.direction > 0 ? prior : 1 - prior }
  })
  var active = settings.filter(function (item) { return Math.abs(item.shift) >= 0.08 })
    .sort(function (a, b) { return Math.abs(b.shift) - Math.abs(a.shift) })
  var rising = active.filter(function (item) { return item.shift > 0 })
  var falling = active.filter(function (item) { return item.shift < 0 })
  var concentrated = Math.abs(average) < 0.5

  if (concentrated) {
    active.slice(0, 5).forEach(function (item) {
      var level = item.shift > 0 ? 0.85 : -0.85
      var factors = SCN_SECTOR_FACTORS[item.id][level > 0 ? 0 : 1]
      var alternative = factors[2]
      var mechanismsByCase = [factors.slice(0, 2), [alternative, factors[1]]]
      mechanismsByCase.forEach(function (mechanisms, index) {
        candidates.push({
          id: item.id + (level > 0 ? "-rise-" : "-fall-") + index,
          title: index === 0 ? item.name + (level > 0 ? " expansion" : " slowdown") : alternative,
          factors: mechanisms.map(function (label) { return [label, item.id] }),
          level: average * 0.5, overrides: { [item.id]: level }, prior: index === 0 ? 0.5 : 0.4
        })
      })
    })
  }
  rising.slice(0, 3).forEach(function (up) {
    falling.slice(0, 3).forEach(function (down) {
      var upFactors = SCN_SECTOR_FACTORS[up.id][0]
      var downFactors = SCN_SECTOR_FACTORS[down.id][1]
      var pairs = [
        [upFactors[0], downFactors[0], 0.55],
        [upFactors[2], downFactors[0], 0.42],
        [upFactors[0], downFactors[2], 0.38]
      ]
      pairs.forEach(function (pair, index) {
        candidates.push({
          id: up.id + "-" + down.id + "-split-" + index,
          title: index === 0 ? up.name + " growth / " + down.name.toLowerCase() + " slowdown" :
            index === 1 ? pair[0] + ", selective slowdown" : pair[1] + ", growth elsewhere",
          factors: [[pair[0], up.id], [pair[1], down.id], [upFactors[1], up.id]],
          level: average * 0.65, overrides: { [up.id]: 0.85, [down.id]: -0.85 }, prior: pair[2]
        })
      })
    })
  })

  candidates.forEach(function (candidate) {
    var error = settings.reduce(function (sum, item) {
      var expected = candidate.overrides[item.id] ?? candidate.level
      return sum + Math.pow(expected - item.shift, 2)
    }, 0)
    candidate.weight = candidate.prior * Math.exp(-1.8 * error)
  })
  candidates.sort(function (a, b) { return b.weight - a.weight })
  var relevant = candidates.filter(function (candidate) { return candidate.weight >= candidates[0].weight * 0.16 }).slice(0, 10)
  var total = relevant.reduce(function (sum, candidate) { return sum + candidate.weight }, 0)
  // Largest-remainder rounding makes the visible and expandable rows sum to 100%.
  var remainder = 100
  relevant.forEach(function (candidate) {
    var percent = candidate.weight / total * 100
    candidate.percent = Math.floor(percent)
    candidate.fraction = percent - candidate.percent
    remainder -= candidate.percent
  })
  relevant.slice().sort(function (a, b) { return b.fraction - a.fraction })
    .slice(0, remainder).forEach(function (candidate) { candidate.percent += 1 })
  return relevant
}

function scnScenarioFactors(candidate, settings, region) {
  return settings.map(function (item) {
    var score = candidate.overrides[item.id] ?? candidate.level
    var scenarioAction = candidate.factors.find(function (factor) { return factor[1] === item.id })
    var actions = SCN_SECTOR_FACTORS[item.id]
    var action = score >= 0.2 ? actions[0][0] : score <= -0.2 ? actions[1][0] : actions[2]
    var regionalActions = region === "north-africa" && SCN_NORTH_AFRICA_ACTIONS[item.id]
    var regionalAction = regionalActions && regionalActions[score >= 0.2 ? 0 : score <= -0.2 ? 1 : 2]
    return {
      industry: item.name,
      label: regionalAction || (scenarioAction ? scenarioAction[0] : action),
      shift: item.shift,
      pathShift: score,
      percent: Math.round(100 * (1 - Math.abs(score - item.shift) / 2))
    }
  })
}

/* The scenario card names the demand path that best matches the inputs. Its rows show the modelled change in
   2035 demand for each industry (shift × 50%, the same scale as the sliders). The path weight is its share among the
   candidate paths. Paths and example company actions are illustrative storylines, not sourced forecasts. */
function scnLikelihoods(model, open) {
  var candidates = scnDemandScenarios(model)
  var selected = candidates.find(function (candidate) { return candidate.id === model.selectedCase }) || candidates[0]
  var factors = scnScenarioFactors(selected, model.assumptions, model.region)
    .sort(function (a, b) { return Math.abs(b.shift) - Math.abs(a.shift) })
  var alternatives = candidates.filter(function (candidate) { return candidate !== selected })
  var changed = factors.filter(function (f) { return Math.abs(f.shift) >= 0.02 })
  return '<div class="scn-case-heading"><span id="scn-case-label" tabindex="-1">Best-matching demand path</span>' +
    '<b title="Share of this path among ' + candidates.length + ' candidate paths">' + selected.percent + '% weight</b></div>' +
    '<p class="trk-path-title">' + esc(selected.title) + '</p>' +
    '<p class="trk-note">' + (changed.length ? changed.length + ' of ' + factors.length + ' industries differ from the baseline.' :
      'All industries are at the evidence baseline, so the path with no change fits best.') + ' Bars: modelled change in 2035 demand.</p>' +
    factors.map(function (factor) {
      var pct = Math.round(factor.shift * 50)
      var w = Math.min(Math.abs(factor.shift), 1) * 50
      return '<div class="scn-lk trk-lk"><span><b>' + esc(factor.industry) + '</b><small>e.g. ' + esc(factor.label) + '</small></span>' +
        '<span class="trk-bar-track" aria-hidden="true"><span class="trk-bar ' + (pct >= 0 ? 'up' : 'down') + '" style="' + (pct >= 0 ? 'left:50%' : 'right:50%') + ';width:' + w.toFixed(1) + '%"></span></span>' +
        '<b>' + (pct === 0 ? '0%' : (pct > 0 ? '+' : '−') + Math.abs(pct) + '%') + '</b></div>'
    }).join("") +
    '<p class="trk-note">Example actions are illustrative storylines, not sourced forecasts.</p>' + (alternatives.length
      ? '<details class="scn-alternatives"' + (open ? ' open' : '') + '><summary>Other paths (' + alternatives.length + ')</summary><ul>' +
        alternatives.map(function (candidate) {
          return '<li><button type="button" class="ev-csv" data-action="scn-select-case" data-case="' + esc(candidate.id) + '">' +
            esc(candidate.title) + ' · ' + candidate.percent + '% weight</button></li>'
        }).join("") + '</ul></details>'
      : "")
}

function scnSquares(per) {
  return '<span class="scn-squares">' + per.map(function (v, i) {
    return '<i style="background:' + scnShade(v) + '" title="' + esc(SCN_VISIONS[i].short + " " + scnSigned(v)) + '"></i>'
  }).join("") + "</span>"
}

function scnMetalProducts(model) {
  return model.metalOutlooks.filter(function (product) { return product.metal })
    .sort(function (a, b) { return a.metal.localeCompare(b.metal) })
}

function scnMetalCards(model) {
  return scnMetalProducts(model).map(function (product) {
    return '<article class="scn-card"><h3>' + esc(product.cardTitle || product.metal) + '</h3><p class="scn-ix">' + scnSigned(product.index) + "</p>" +
      scnSquares(product.per) + '<span class="scn-badge scn-' + product.strategy.cls + '">' + esc(product.strategy.label) + "</span></article>"
  }).join("")
}

function scnCalcTable(model) {
  return '<details class="ev-box ev-wide scn-calc"><summary>Show calculation</summary>' +
    '<p class="ev-why">The baseline uses 24 indicators from report sections 3–4. Driver assumptions adjust scenario weights and scores. On Scenario by metal, metal settings are translated into industry demand using illustrative end-market weights. Advanced market conditions shift the corresponding baseline driver by up to 20 percentage points using illustrative settings. A selected country uses the illustrative industry tilt of its UN subregion and scales the effect of slider changes; these tilts are not yet tracker data. Sliders are the change in 2035 demand against the baseline; ±50% equals the full model range (±2). A 2035 event from the tracker compares your 2035 value with the tracker’s 2035 value; ±50% again equals the full range for that industry, and several events in one industry add up to that limit. Metal tonnages linked to an event scale in proportion to it, as in the tracker’s own estimate. Each metal uses a representative application or product line. A specific grade uses its primary end market as an illustrative proxy. End-market weights for the additional metals are illustrative. ' +
    'Its score in each scenario is a weighted average of the end markets for that product line. The overall index (−2 to +2) weights those scores by scenario likelihood. The Scenario card compares the resulting industry demand assumptions with plausible demand paths. It gives more weight to paths that match the selected direction and strength, then normalizes the retained paths to 100%. These illustrative likelihoods are conditional on the settings and the candidate paths. Factor bars show how closely each associated industry’s modeled level matches its slider. Several factors may refer to the same industry. ' +
    'The five squares show the separate outlook model’s scores (blue for growth, orange for decline).</p>' +
    '<details class="scn-scenario-sources"><summary>Sources behind the scenario examples</summary><ul>' +
    Object.values(SCN_NEWS).map(function (news) {
      return '<li>' + esc(news.event) + ' <a href="' + esc(news.url) + '">' + esc(news.source) + '</a>' +
        (news.followup ? ' ' + esc(news.followup) + ' <a href="' + esc(news.followupUrl) + '">' + esc(news.followupSource) + '</a>' : '') + '</li>'
    }).join("") + '</ul></details>' +
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

function viewSimulator(route, openScenarios) {
  var byMetal = route.page === "metal-scenarios"
  var model = scnModel(route.params, byMetal)
  var intro = byMetal
    ? "Calculator: change expected 2035 demand for a metal or an industry event, and see the demand outlook, the recommended strategy and where supply comes from."
    : "Calculator: change expected 2035 demand by industry or replace a tracker 2035 value, and see which 2035 vision becomes more likely and what it means for each metal."
  return '<div class="scn">' + pageHead(byMetal ? "Scenario by metal" : "Scenario generator 2035") +
    '<p class="trk-intro">' + esc(intro) + '</p>' +
    '<nav class="trk-flow" aria-label="Workflow"><a href="#scn-drivers-heading" data-scroll="scn-drivers-heading"><b>1</b> Set inputs</a><a href="#trk-results-heading" data-scroll="trk-results-heading"><b>2</b> Read the result</a><a href="#trk-decision" data-scroll="trk-decision"><b>3</b> Decide per metal</a><a href="#scn-likelihoods-heading" data-scroll="scn-likelihoods-heading"><b>4</b> Check the story</a><a href="#/report"><b>5</b> Scenario briefs</a></nav>' +
    scnDriverPanel(route.params, byMetal) +
    '<section class="scn-panel trk-results-panel" aria-labelledby="trk-results-heading"><h2 id="trk-results-heading" class="scn-heading"><span class="trk-step">2</span>Result and recommendation</h2>' +
    '<div id="trk-results" class="scn-body">' + (typeof trkResults === "function" ? trkResults(model, route.params, byMetal) : "") + '</div></section>' +
    '<div class="scn-grid"><section class="scn-panel" aria-labelledby="scn-likelihoods-heading"><h2 id="scn-likelihoods-heading" class="scn-heading">Scenario story</h2><div id="scn-likelihoods" class="scn-body">' + scnLikelihoods(model, openScenarios) + "</div></section>" +
    '<section class="scn-panel" aria-labelledby="scn-metal-heading"><h2 id="scn-metal-heading" class="scn-heading">Market outlook by metal <small>demand index −2 to +2 · squares = 5 visions</small></h2>' +
    '<div id="scn-metals" class="scn-body scn-cards">' + scnMetalCards(model) + "</div></section></div>" +
    '<h2 class="scn-heading trk-section"><span class="trk-step">3</span>Evidence and calculation</h2>' +
    (typeof trkSnapshotLine === "function" ? trkSnapshotLine() : "") +
    '<div id="scn-calc">' + scnCalcTable(model) + "</div>" + marketEvidencePanel() +
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
  var route = readRoute()
  var model = scnModel(route.params, route.page === "metal-scenarios")
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
  var model = scnModel(route.params, route.page === "metal-scenarios")
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
