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
  { key: "tariffs", name: "Trade barriers", low: "Lower", high: "Higher", driver: "b", effect: 10 },
  { key: "recycling", name: "Metal recycling", low: "Slower", high: "Faster", driver: "c", effect: -10 },
  { key: "adoption", name: "Clean technology adoption", low: "Slower", high: "Faster", driver: "d", effect: 10 }
]

var SCN_VISIONS = [
  { id: "open", name: "Open Door Europe", short: "Open Door" },
  { id: "stag", name: "Armoured Stagnation", short: "Stagnation" },
  { id: "super", name: "Electric Super-cycle", short: "Super-cycle" },
  { id: "fort", name: "Fortress Europe", short: "Fortress" },
  { id: "ren", name: "Engineering Renaissance", short: "Renaissance" }
]

var SCN_PATH_INDUSTRIES = { open: "elec", stag: "chem", super: "ev", fort: "steel", ren: "energy" }

var SCN_NEWS = {
  ev: {
    source: "IEA · 2026", url: "https://www.iea.org/reports/global-ev-outlook-2026/trends-in-electric-cars",
    event: "Global electric car sales rose 20% in 2025 to more than 20 million.",
    followup: "Tesla reported shipping its first Megapack with Nevada-made LFP cells in Q3 2026. LFP cells do not use nickel or cobalt in the cathode.",
    followupUrl: "https://www.sec.gov/Archives/edgar/data/1318605/000162828026066775/tsla-20260930.htm",
    followupSource: "Tesla SEC filing · Q3 2026",
    up: "Automakers would need to turn rising sales into larger cell and battery-material orders. Nickel and cobalt exposure depends on the battery chemistry.",
    down: "Automakers would need to cut EV production plans or delay battery orders despite recent sales growth."
  },
  energy: {
    source: "U.S. Department of Energy · October 2024", url: "https://www.energy.gov/oe/grid-resilience-and-innovation-partnerships-grip-program-projects",
    event: "The U.S. Department of Energy announced about $4.2 billion in grid investments across 46 projects.",
    up: "Utilities and governments would need to move more projects from funding to construction, then order conductors, transformers and other grid equipment.",
    down: "Permitting, financing or interconnection delays would need to postpone construction and equipment orders."
  },
  elec: {
    source: "SIA · February 2026", url: "https://www.semiconductors.org/global-annual-semiconductor-sales-increase-25-6-to-791-7-billion-in-2025/",
    event: "SIA reported that 2025 semiconductor sales rose 25.6% to $791.7 billion.",
    up: "Chipmakers would need to convert growth into new fabrication and packaging capacity, supporting demand for electronics materials.",
    down: "A chip-order slowdown or excess capacity would need to delay new fabs and equipment purchases."
  },
  auto: {
    source: "ACEA · April 2026", url: "https://www.acea.auto/publication/economic-and-market-report-global-and-eu-auto-industry-full-year-2025/",
    event: "ACEA reported that global new-car registrations rose 3.5% in 2025.",
    up: "Sustained orders would need to translate into more vehicles produced and higher demand for sheet, castings and components.",
    down: "Manufacturers would need to cut output as vehicle demand slows or inventories rise."
  },
  aero: {
    source: "Airbus · January 2026", url: "https://www.airbus.com/en/newsroom/press-releases/2026-01-airbus-reports-793-commercial-aircraft-deliveries-in-2025",
    event: "Airbus reported 793 aircraft deliveries and 1,000 gross orders in 2025.",
    up: "Airframers and engine suppliers would need to convert order backlogs into higher delivery rates and qualified alloy orders.",
    down: "Delivery delays or airline deferrals would need to reduce near-term production and alloy orders."
  },
  med: {
    source: "European Commission · December 2025", url: "https://health.ec.europa.eu/publications/proposal-regulation-simplify-rules-medical-and-vitro-diagnostic-devices_en",
    event: "The European Commission proposed simplifying its medical-device rules.",
    up: "Regulatory changes would need to help products reach market, while hospitals increase device and implant purchasing.",
    down: "Budget pressure, slower procedures or approval delays would need to reduce device and implant purchasing."
  },
  chem: {
    source: "Cefic · Q3 2026", url: "https://cefic.org/news/cefics-chemical-trends-report-q3-2026-is-out/",
    event: "Cefic reported weak demand, falling output and upstream overcapacity in European chemicals.",
    up: "Stronger orders and lower energy costs would need to revive plant investment, reversing the recent weakness.",
    down: "Persistent energy-cost pressure and weak orders could delay projects and reduce demand for corrosion-resistant equipment."
  },
  og: {
    source: "IEA · 2026", url: "https://www.iea.org/data-and-statistics/data-tools/global-lng-capacity-tracker",
    event: "The IEA recorded four LNG project investment decisions from January to October 2026 in the United States and Canada.",
    up: "Project sponsors would need to convert investment decisions into construction, equipment purchases and maintenance contracts.",
    down: "More projects would need to be deferred as prices, financing or construction costs worsen."
  },
  steel: {
    source: "worldsteel · October 2026", url: "https://worldsteel.org/media/press-releases/2026/worldsteel-short-range-outlook-october-2026/",
    event: "Worldsteel projected broadly flat global steel demand for 2026 and 1.7% growth in 2027.",
    up: "Construction and infrastructure orders would need to strengthen beyond that gradual recovery.",
    down: "Weak building starts or delayed public projects would need to outweigh infrastructure demand."
  },
  defence: {
    source: "NATO · June 2025", url: "https://nato.int/en/about-us/official-texts-and-resources/official-texts/2025/06/25/the-hague-summit-declaration",
    event: "NATO allies adopted a 2035 spending commitment, including at least 3.5% of GDP for core defence.",
    up: "Governments would need to turn spending commitments into funded procurement and suppliers would need capacity to deliver.",
    down: "Governments would need to delay appropriations or procurement despite the commitment."
  }
}

var SCN_STORIES = {
  open: {
    text: "Trade stays open, so buyers can diversify and source equipment internationally. Demand can expand where buyers keep spending, even while weak European industrial output limits a broad recovery.",
    industries: ["ev", "elec", "auto", "aero", "med"]
  },
  stag: {
    text: "Trade tightens before European industry recovers. Defence and resilience orders can grow, but higher costs and deferred investment weigh on chemicals, construction and equipment demand.",
    industries: ["defence", "chem", "steel", "auto", "og"]
  },
  super: {
    text: "Utilities fund grid projects and automakers ramp battery orders at the same time. Chip and equipment orders follow. Demand grows fastest where project funding turns into purchase orders, while competition for material can raise costs for other industries.",
    industries: ["energy", "ev", "elec", "steel", "chem"]
  },
  fort: {
    text: "Governments prioritise regional suppliers and turn security commitments into orders. Domestic production grows where capacity is available. More expensive inputs and tighter trade can still hold back import-dependent buyers.",
    industries: ["defence", "steel", "auto", "aero", "chem"]
  },
  ren: {
    text: "Materials become easier to source as technology adoption accelerates. Grid, digital and industrial projects move from investment decisions into equipment orders, creating demand across several end markets.",
    industries: ["energy", "elec", "ev", "aero", "med"]
  }
}

var SCN_PATH_FACTORS = [
  ["European industry remains weak", "European industry strengthens"],
  ["Trade with China remains open", "Trade with China tightens"],
  ["Critical-metal supply eases", "Critical-metal supply stays tight"],
  ["Technology adoption stays slow", "Technology adoption accelerates"]
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
    SCN_REGIONS[entry[0]] = { name: entry[1], factor: entry.length === 3 ? entry[2] : group.factor }
  })
})

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
  if (rawLevel == null || !Number.isInteger(level) || Math.abs(level) > 2) {
    level = legacy === "grow" ? 2 : legacy === "fall" ? -2 : 0
  }
  return { region: region, level: level, shift: level / 2 * SCN_REGIONS[region].factor }
}

function scnResetUpdates() {
  var updates = { a: null, b: null, c: null, d: null, "scn-industry": null, "scn-region": null }
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
  { metal: "Tungsten", name: "Carbide tooling and specialty materials", w: { steel: 2, auto: 1, aero: 1 } }
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

function scnModel(params) {
  var dr = scnDrivers(params)
  var p = [dr.a / 100, dr.b / 100, dr.c / 100, dr.d / 100]
  var assumptions = SCN_INDUSTRY_DRIVERS.map(function (industry) {
    var input = scnIndustryAssumption(params, industry)
    return { id: industry.id, name: industry.name, level: input.level, shift: input.shift }
  })
  var activeIndustries = assumptions.filter(function (industry) { return industry.level !== 0 })
  var vis = {}
  SCN_VISIONS.forEach(function (v) { vis[v.id] = { p: 0, st: [0, 0, 0, 0], paths: [] } })
  for (var m = 0; m < 16; m += 1) {
    var s = [m & 8 ? 1 : 0, m & 4 ? 1 : 0, m & 2 ? 1 : 0, m & 1 ? 1 : 0]
    var prob = 1
    for (var k = 0; k < 4; k += 1) prob *= s[k] ? p[k] : 1 - p[k]
    var v = vis[scnVisionOf(s[0], s[1], s[2], s[3])]
    v.p += prob
    v.paths.push({ states: s, probability: prob })
    for (var j = 0; j < 4; j += 1) v.st[j] += prob * (s[j] ? 1 : -1)
  }
  SCN_VISIONS.forEach(function (v) {
    var x = vis[v.id]
    x.st = x.st.map(function (t) { return x.p ? t / x.p : 0 })
    var mostLikely = x.paths.reduce(function (best, path) { return path.probability > best.probability ? path : best })
    x.factors = mostLikely.states.map(function (state, index) {
      var probability = (1 + x.st[index]) / 2
      return { label: SCN_PATH_FACTORS[index][state], probability: state ? probability : 1 - probability }
    })
    x.pathShare = mostLikely.probability / x.p
    var industry = SCN_PATH_INDUSTRIES[v.id]
    var sensitivity = SCN_INDUSTRIES[industry].s
    var shift = 0.6 * scnIndustryAssumption(params, { id: industry }).shift
    var growth = x.paths.reduce(function (sum, path) {
      var score = path.states.reduce(function (value, state, index) {
        return value + sensitivity[index + 1] * (state ? 1 : -1)
      }, sensitivity[0] + shift)
      return sum + (score > 1e-9 ? path.probability : 0)
    }, 0) / x.p
    x.factors.push({
      label: SCN_INDUSTRIES[industry].name + (growth >= 0.5 ? " grows" : " stalls or declines"),
      probability: growth >= 0.5 ? growth : 1 - growth
    })
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
  return { drivers: dr, visions: vis, industries: ind, activeIndustries: activeIndustries, products: results.slice(0, SCN_PRODUCTS.length), metalOutlooks: results }
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
  Object.keys(scnResetUpdates()).forEach(function (key) { if (key !== "scn-industry" && params.get(key)) q.set(key, params.get(key)) })
  var s = q.toString()
  return s ? "?" + s : ""
}

/* ---------- Market scenarios (simulator) ---------- */

function scnLevelLabel(level) {
  return ["Strong decline", "Decline", "Baseline", "Growth", "Strong growth"][level + 2]
}

function scnDriverPanel(params) {
  var sliders = SCN_INDUSTRY_DRIVERS.map(function (item) {
    var state = scnIndustryAssumption(params, item)
    var id = "scn-" + item.id + "-level"
    return '<div class="scn-industry-card"><label for="' + id + '">' + esc(item.name) + '</label>' +
      '<input type="range" id="' + id + '" min="-2" max="2" step="1" value="' + state.level + '" data-industry-slider="' + item.id +
      '" aria-valuetext="' + scnLevelLabel(state.level) + '">' +
      '<div class="scn-slide-ends" aria-hidden="true"><span>Decline</span><span>Grow</span></div></div>'
  }).join("")
  var region = scnRegion(params)
  function regionOption(id) {
    return '<option value="' + esc(id) + '"' + (region === id ? ' selected' : '') + '>' + esc(SCN_REGIONS[id].name) + '</option>'
  }
  var regions = regionOption("global") + SCN_REGION_GROUPS.map(function (group) {
    return '<optgroup label="' + esc(group.name) + '">' + group.regions.map(function (entry) {
      return regionOption(entry[0])
    }).join("") + '</optgroup>'
  }).join("")
  var filtersOpen = params.get("scn-filters") === "1"
  return '<section class="scn-panel" aria-labelledby="scn-drivers-heading"><div class="scn-reset"><h2 id="scn-drivers-heading" class="scn-heading">Industry drivers</h2>' +
    '<div class="scn-toolbar"><label>Region <select id="scn-region" name="scn-region" data-control>' + regions + '</select></label>' +
    '<button id="scn-reset" type="button" class="ev-csv" data-action="scn-reset">Reset assumptions</button></div></div>' +
    '<div class="scn-industries">' + sliders +
    '<button id="scn-filters-button" type="button" class="ev-csv scn-filters-trigger" data-action="scn-open-filters" aria-expanded="' + filtersOpen + '">Advanced filters</button>' +
    '</div></section>' + (filtersOpen ? scnSideFilters(params) : "")
}

function scnSideFilters(params) {
  var industry = SCN_INDUSTRY_DRIVERS.find(function (item) { return item.id === params.get("scn-industry") }) || SCN_INDUSTRY_DRIVERS[0]
  var level = scnIndustryAssumption(params, industry).level
  var industries = SCN_INDUSTRY_DRIVERS.map(function (item) {
    return '<option value="' + item.id + '"' + (industry === item ? ' selected' : '') + '>' + esc(item.name) + '</option>'
  }).join("")
  var field = "scn-" + industry.id + "-path"
  var paths = level > 0 ? industry.grow : level < 0 ? industry.fall : []
  var options = paths.map(function (path) {
    return '<option' + (params.get(field) === path ? ' selected' : '') + '>' + esc(path) + '</option>'
  }).join("")
  return '<aside class="scn-side-filters" aria-labelledby="scn-filters-title"><div class="scn-filter-heading">' +
    '<h2 id="scn-filters-title">Advanced filters</h2><button type="button" class="ev-csv" data-action="scn-close-filters">Close</button></div>' +
    scnAdvancedGroup("Scenario assumptions", SCN_DRIVERS, params, false) +
    scnAdvancedGroup("Market conditions", SCN_ADVANCED, params, true) +
    '<details class="scn-reasons"><summary>Industry reasons</summary>' +
    '<label>Industry<select id="scn-filter-industry" name="scn-industry" data-control>' + industries + '</select></label>' +
    (paths.length ? '<label>How could this happen?<select id="scn-filter-path" name="' + field + '" data-control><option value="">Choose a reason</option>' + options + '</select></label>' :
      '<p>Move this industry’s slider to explore possible reasons.</p>') + '</details></aside>'
}

function scnAdvancedGroup(title, items, params, relative) {
  return '<fieldset class="scn-advanced-group"><legend>' + esc(title) + '</legend><div class="scn-advanced-grid">' +
    items.map(function (item) {
      var value = relative ? scnAdvancedValue(params, item) : scnDriverValue(params, item)
      var id = "scn-advanced-" + item.key
      var name = relative ? item.name : item.name.slice(4)
      return '<div class="scn-industry-card"><label for="' + id + '">' + esc(name) + '</label>' +
        '<input type="range" id="' + id + '" name="' + item.key + '" min="' + (relative ? -2 : 10) +
        '" max="' + (relative ? 2 : 90) + '" step="1" value="' + value + '" data-advanced-slider data-control' +
        (relative ? ' aria-valuetext="' + scnAdjustmentLabel(value) + '"' : '') + '>' +
        '<div class="scn-slide-ends" aria-hidden="true"><span>' + esc(item.low) + '</span><span>' + esc(item.high) + '</span></div></div>'
    }).join("") + '</div></fieldset>'
}

function scnAdjustmentLabel(value) {
  return ["Much lower", "Lower", "Baseline", "Higher", "Much higher"][value + 2]
}

function scnOpenPathways() {
  var panel = document.getElementById("scn-likelihoods")
  if (!panel) return undefined
  return Array.from(panel.querySelectorAll("details[open]")).map(function (details) { return details.dataset.vision })
}

function scnDemandLabel(score) {
  if (score >= 1) return "Strong growth"
  if (score >= 0.05) return "Growth"
  if (score <= -1) return "Strong decline"
  if (score <= -0.05) return "Decline"
  return "Broadly stable"
}

function scnIndustryMetalLinks(model, industry) {
  return scnMetalProducts(model).filter(function (metal) { return Object.hasOwn(metal.w, industry.id) })
    .map(function (metal) { return metal.metal }).join(", ")
}

function scnMatchesSetting(industry, score) {
  var threshold = Math.abs(industry.level) === 2 ? 1 : 0.05
  return score * Math.sign(industry.level) >= threshold
}

function scnRankJointScenarios(model) {
  return SCN_VISIONS.map(function (vision, index) {
    var matches = model.activeIndustries.filter(function (industry) {
      var score = model.industries[industry.id].per[index]
      return scnMatchesSetting(industry, score)
    }).length
    return { vision: vision, index: index, matches: matches, probability: model.visions[vision.id].p }
  }).sort(function (a, b) {
    return b.matches - a.matches || b.probability - a.probability
  })
}

function scnScenarioStory(model, fit, primary) {
  var story = SCN_STORIES[fit.vision.id]
  var active = model.activeIndustries
  var industries = active.length ? active : story.industries.map(function (id) {
    return SCN_INDUSTRY_DRIVERS.find(function (industry) { return industry.id === id })
  })
  var status = active.length
    ? (fit.matches === active.length ? "Matches all " + active.length + " adjusted industries." :
      (primary ? "No modeled scenario meets all your settings. " : "") + "Matches " + fit.matches + " of " + active.length + " adjusted industries.")
    : (primary ? "Most likely with the baseline settings." : "")
  return '<article class="scn-story"><div class="scn-story-title"><h3>' + esc(fit.vision.name) + '</h3><b>' +
    scnPct(fit.probability) + '</b></div>' + (status ? '<p class="scn-story-fit">' + esc(status) + '</p>' : '') +
    '<p class="scn-story-text">' + esc(story.text) + '</p><h4>What would have to happen</h4><ol class="scn-story-events">' +
    industries.map(function (industry) {
      var news = SCN_NEWS[industry.id]
      var score = model.industries[industry.id].per[fit.index]
      var condition = (industry.level ? industry.level > 0 : score >= 0) ? news.up : news.down
      var metals = scnIndustryMetalLinks(model, industry)
      return '<li><div class="scn-story-event-title"><strong>' + esc(industry.name) + '</strong><span>' +
        scnDemandLabel(score) + ' ' + scnSigned(score) + '</span></div>' +
        (industry.level ? '<small>Your setting: ' + esc(scnLevelLabel(industry.level)) + (scnMatchesSetting(industry, score) ? ' · Matches' : ' · Falls short of this setting') + '</small>' : '') +
        '<p>' + esc(condition) + '</p><p class="scn-story-source">' + esc(news.event) + ' <a href="' + esc(news.url) + '">' +
        esc(news.source) + '</a></p>' + (news.followup ? '<p class="scn-story-source">' + esc(news.followup) +
        ' <a href="' + esc(news.followupUrl) + '">' + esc(news.followupSource) + '</a></p>' : '') + (metals ? '<small>Linked metals: ' + esc(metals) + '</small>' : '') + '</li>'
    }).join("") + '</ol><p class="scn-path-note">Percentages and scores come from the scenario model. Dated sources show what was reported. The steps above describe what would need to happen.</p></article>'
}

function scnLikelihoods(model, open) {
  var ranked = scnRankJointScenarios(model)
  var best = ranked[0]
  var max = Math.max.apply(null, ranked.map(function (fit) { return fit.probability }))
  return scnScenarioStory(model, best, true) + '<details class="scn-alternatives" data-vision="alternatives"' +
    (open && open.includes("alternatives") ? ' open' : '') + '><summary>More scenarios</summary>' +
    ranked.slice(1).map(function (fit) {
      var v = fit.vision
      var result = model.visions[v.id]
      var expanded = open && open.includes(v.id)
      return '<details class="scn-path" data-vision="' + v.id + '"' + (expanded ? ' open' : '') + '>' +
        '<summary class="scn-lk"><span>' + esc(v.name) + '</span><span class="scn-lk-track" aria-hidden="true"><span class="scn-lk-bar' +
        (result.p === max ? ' top' : '') + '" style="width:' + (result.p / max * 100).toFixed(1) + '%"></span></span><b>' +
        scnPct(result.p) + '</b></summary>' +
        '<div class="scn-path-content">' + scnScenarioStory(model, fit, false) +
        '<p class="scn-path-note">Top driver combination: ' + scnPct(result.pathShare) +
        ' of this scenario. Factor probabilities are conditional on this scenario.</p><ul class="scn-path-factors">' +
        result.factors.map(function (factor) {
          return '<li><span>' + esc(factor.label) + '</span><b>' + scnPct(factor.probability) + '</b></li>'
        }).join("") + "</details>" + '</ul></div></details>'
    }).join("")
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
    return '<article class="scn-card"><h3>' + esc(product.metal) + '</h3><p class="scn-ix">' + scnSigned(product.index) + "</p>" +
      scnSquares(product.per) + '<span class="scn-badge scn-' + product.strategy.cls + '">' + esc(product.strategy.label) + "</span></article>"
  }).join("")
}

function scnCalcTable(model) {
  return '<details class="ev-box ev-wide scn-calc"><summary>Show calculation</summary>' +
    '<p class="ev-why">The baseline uses 24 indicators from report sections 3–4. Industry assumptions adjust scenario weights and scores. Advanced market conditions shift the corresponding baseline driver by up to 20 percentage points using illustrative settings. One region applies to all industry drivers using illustrative weights. Most subregions share their group’s weight. Antarctica has no modeled industry exposure. Optional reasons record your assumptions. Each metal uses a representative application or product line. End-market weights for the additional metals are illustrative. ' +
    'Its score in each scenario is a weighted average of the end markets for that product line. The overall index (−2 to +2) weights those scores by scenario likelihood. Joint scenarios rank by how many adjusted industry settings they match, then by likelihood. Strong settings need a score of at least +1 or at most −1. Mild settings need +0.05 or −0.05. ' +
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

function viewSimulator(route, openScenarios) {
  var model = scnModel(route.params)
  return '<div class="scn">' + pageHead("Market scenarios to 2035") +
    scnDriverPanel(route.params) +
    '<div class="scn-grid"><section class="scn-panel" aria-labelledby="scn-likelihoods-heading"><h2 id="scn-likelihoods-heading" class="scn-heading">Scenario</h2><div id="scn-likelihoods" class="scn-body">' + scnLikelihoods(model, openScenarios) + "</div></section>" +
    '<section class="scn-panel" aria-labelledby="scn-metal-heading"><h2 id="scn-metal-heading" class="scn-heading">Market outlook by metal</h2>' +
    '<div id="scn-metals" class="scn-body scn-cards">' + scnMetalCards(model) + "</div></section></div>" +
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
