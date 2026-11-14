"use strict"

var FUTURE_SCENARIOS = [
  {
    id: "us-reactors",
    name: "US government orders 20 reactors",
    industry: "Nuclear",
    featured: "peach",
    tags: [
      { name: "Nuclear", tone: "olive" },
      { name: "Nickel", tone: "rose" },
      { name: "United States", tone: "blue" }
    ],
    intro: "Using the most common reactor design today (PWR, ~1,100 MWe), each build requires:",
    needs: [
      "Alloy 690 steam generator tubing (≈400 km per unit)",
      "Alloy 625 / 718 fasteners and springs",
      "316LN stainless piping",
      "Zirconium alloy fuel cladding"
    ],
    products: [
      { name: "Alloy 690 tube", signal: "buy", tone: "red", extra: 8000, supply: 5200, shortage: 2800 },
      { name: "Alloy 718 bar", signal: "watch", tone: "blue", extra: 1400, supply: 1100, shortage: 300 },
      { name: "316LN pipe", signal: "balanced", tone: "gold", extra: 22000, supply: 21000, shortage: 1000 }
    ],
    players: {
      suppliers: ["Sandvik", "Special Metals", "Haynes International"],
      customers: ["Westinghouse", "BWX Technologies", "Framatome"],
      competitors: ["Nippon Steel", "Valinox Nucléaire", "Baosteel"]
    }
  },
  {
    id: "duplex",
    name: "Projects requiring duplex stainless",
    industry: "Energy",
    featured: "sky",
    tags: [
      { name: "Energy", tone: "olive" },
      { name: "Chromium", tone: "rose" },
      { name: "Europe", tone: "blue" }
    ],
    intro: "Pulp, desalination, and chemical plants specified in duplex need:",
    needs: [
      "2205 plate for digesters and storage tanks",
      "2507 tube for seawater and acid lines",
      "Matching filler metal for the weld procedure"
    ],
    products: [
      { name: "2205 plate", signal: "watch", tone: "gold", extra: 2400, supply: 1700, shortage: 700 },
      { name: "2507 tube", signal: "buy", tone: "red", extra: 900, supply: 520, shortage: 380 }
    ],
    players: {
      suppliers: ["Outokumpu", "Acerinox", "Aperam"],
      customers: ["Andritz", "Valmet", "Metso"],
      competitors: ["TISCO", "POSCO"]
    }
  },
  {
    id: "ev",
    name: "EV production doubles by 2030",
    industry: "Automotive",
    tags: [
      { name: "Automotive", tone: "olive" },
      { name: "Cobalt", tone: "rose" },
      { name: "China", tone: "blue" }
    ],
    intro: "A doubled electric-vehicle build rate pulls cathode material through:",
    needs: [
      "Cobalt sulphate and precursor for NMC cathodes",
      "Cathode powder for cell lines",
      "Battery-pack hardware at the vehicle plant"
    ],
    products: [
      { name: "Cobalt precursor", signal: "watch", tone: "blue", extra: 18000, supply: 14200, shortage: 3800 }
    ],
    players: {
      suppliers: ["Huayou Cobalt", "GEM", "CNGR"],
      customers: ["CATL", "Samsung SDI", "Renault-Nissan"],
      competitors: ["Umicore", "Ronbay"]
    }
  },
  {
    id: "aerospace",
    name: "Narrow-body backlog cleared in 5 years",
    industry: "Aerospace",
    tags: [
      { name: "Aerospace", tone: "olive" },
      { name: "Nickel", tone: "rose" },
      { name: "United States", tone: "blue" }
    ],
    intro: "Clearing the narrow-body backlog raises rotating-part demand:",
    needs: [
      "Alloy 718 bar for disks and shafts",
      "Investment cast blades in nickel alloy",
      "Alloy 625 sheet for ducts and nacelles"
    ],
    products: [
      { name: "Alloy 718 bar", signal: "watch", tone: "blue", extra: 900, supply: 640, shortage: 260 },
      { name: "Alloy 625 sheet", signal: "balanced", tone: "gold", extra: 420, supply: 360, shortage: 60 }
    ],
    players: {
      suppliers: ["ATI", "Carpenter", "Allegheny"],
      customers: ["GE Aerospace", "Safran", "Rolls-Royce"],
      competitors: ["Howmet", "VSMPO-AVISMA"]
    }
  },
  {
    id: "hydrogen",
    name: "EU builds 40 GW of electrolysers",
    industry: "Hydrogen",
    tags: [
      { name: "Hydrogen", tone: "olive" },
      { name: "Nickel", tone: "rose" },
      { name: "Europe", tone: "blue" }
    ],
    intro: "Alkaline and solid-oxide stacks at that scale require:",
    needs: [
      "Alloy 800H plate for interconnects and balance of plant",
      "Nickel wire and mesh for electrodes",
      "High-alloy tube for the hydrogen dryer"
    ],
    products: [
      { name: "Alloy 800H plate", signal: "watch", tone: "gold", extra: 2200, supply: 1500, shortage: 700 },
      { name: "Nickel wire", signal: "watch", tone: "blue", extra: 640, supply: 480, shortage: 160 }
    ],
    players: {
      suppliers: ["VDM Metals", "ATI", "Sandvik"],
      customers: ["Technip", "Linde", "Air Liquide"],
      competitors: ["Haynes", "Nippon Yakin"]
    }
  },
  {
    id: "hvdc",
    name: "India expands HVDC grid",
    industry: "Power grid",
    tags: [
      { name: "Power grid", tone: "olive" },
      { name: "Copper", tone: "rose" },
      { name: "India", tone: "blue" }
    ],
    intro: "New HVDC corridors are specified around:",
    needs: [
      "Copper conductor for the cable and bus",
      "Converter-transformer copper",
      "Fitting hardware at the terminal stations"
    ],
    products: [
      { name: "Copper conductor", signal: "balanced", tone: "gold", extra: 40000, supply: 36000, shortage: 4000 }
    ],
    players: {
      suppliers: ["Hindalco", "Vedanta", "Aurubis"],
      customers: ["Power Grid", "Adani", "Siemens Energy"],
      competitors: ["Prysmian", "Nexans", "LS Cable"]
    }
  },
  {
    id: "defense",
    name: "NATO triples munitions output",
    industry: "Defense",
    tags: [
      { name: "Defense", tone: "olive" },
      { name: "Tungsten", tone: "rose" },
      { name: "Europe", tone: "blue" }
    ],
    intro: "A tripled munitions rate concentrates on:",
    needs: [
      "Tungsten carbide powder for penetrators",
      "Heavy-alloy bar for kinetic parts",
      "Tooling alloys at the machining lines"
    ],
    products: [
      { name: "Tungsten powder", signal: "buy", tone: "red", extra: 1200, supply: 700, shortage: 500 }
    ],
    players: {
      suppliers: ["Wolfram", "H.C. Starck", "Xiamen Tungsten"],
      customers: ["Rheinmetall", "Nammo", "BAE Systems"],
      competitors: ["Kennametal", "Sandvik"]
    }
  },
  {
    id: "fabs",
    name: "10 new semiconductor fabs",
    industry: "Semiconductors",
    tags: [
      { name: "Semiconductors", tone: "olive" },
      { name: "Tantalum", tone: "rose" },
      { name: "United States", tone: "blue" }
    ],
    intro: "Ten new fabs add process-tool and capacitor demand:",
    needs: [
      "Tantalum powder for capacitors",
      "Tantalum plate for sputtering targets",
      "High-purity wire for the tool set"
    ],
    products: [
      { name: "Tantalum powder", signal: "watch", tone: "blue", extra: 180, supply: 140, shortage: 40 }
    ],
    players: {
      suppliers: ["Global Advanced Metals", "Ningxia", "AMG"],
      customers: ["TSMC", "Intel", "Samsung"],
      competitors: ["JX Metals", "Materion"]
    }
  },
  {
    id: "lng",
    name: "Korea orders 30 LNG carriers",
    industry: "Shipbuilding",
    tags: [
      { name: "Shipbuilding", tone: "olive" },
      { name: "Nickel", tone: "rose" },
      { name: "Korea", tone: "blue" }
    ],
    intro: "Thirty membrane carriers add cryogenic plate and pipe:",
    needs: [
      "9% nickel plate for the cargo tanks",
      "Stainless pipe for the cargo handling lines",
      "Matching weld metal for the cryogenic procedure"
    ],
    products: [
      { name: "9% nickel plate", signal: "watch", tone: "blue", extra: 3200, supply: 2700, shortage: 500 }
    ],
    players: {
      suppliers: ["POSCO", "Outokumpu", "Acerinox"],
      customers: ["Hanwha Ocean", "Samsung Heavy", "HD Hyundai"],
      competitors: ["Nippon Steel", "Baosteel"]
    }
  },
  {
    id: "flowlines",
    name: "Brazil orders 200 km of duplex flowlines",
    industry: "Oil and gas",
    tags: [
      { name: "Oil and gas", tone: "olive" },
      { name: "Chromium", tone: "rose" },
      { name: "Brazil", tone: "blue" }
    ],
    intro: "Sour-service flowlines at that length are specified as:",
    needs: [
      "2507 seamless tube for the flowlines",
      "2205 fittings at the manifolds",
      "Super-duplex weld wire for the reeling yard"
    ],
    products: [
      { name: "2507 tube", signal: "watch", tone: "gold", extra: 1100, supply: 900, shortage: 200 }
    ],
    players: {
      suppliers: ["Outokumpu", "Alleima", "Tubacex"],
      customers: ["Petrobras", "Saipem", "Subsea 7"],
      competitors: ["TISCO", "Butting"]
    }
  }
]

var FUTURE_METALS = [
  { name: "Tungsten", pct: "42%", count: "1 scenario", signal: "buy", tone: "green", scenario: "defense" },
  { name: "Tantalum", pct: "22%", count: "1 scenario", signal: "watch", tone: "rose", scenario: "fabs" },
  { name: "Nickel", pct: "21%", count: "4 scenarios", signal: "watch", tone: "blue", scenario: "us-reactors" },
  { name: "Cobalt", pct: "21%", count: "1 scenario", signal: "watch", tone: "gold", scenario: "ev" },
  { name: "Chromium", pct: "21%", count: "2 scenarios", signal: "watch", tone: "lilac", scenario: "duplex" },
  { name: "Copper", pct: "10%", count: "1 scenario", signal: "balanced", tone: "green", scenario: "hvdc" }
]

var FUTURE_INDUSTRIES = [
  { scenario: "us-reactors", tone: "green" },
  { scenario: "duplex", tone: "rose" },
  { scenario: "ev", tone: "blue" },
  { scenario: "aerospace", tone: "gold" },
  { scenario: "hydrogen", tone: "green" },
  { scenario: "hvdc", tone: "sky" },
  { scenario: "defense", tone: "gold" },
  { scenario: "fabs", tone: "rose" },
  { scenario: "lng", tone: "sky" },
  { scenario: "flowlines", tone: "green" }
]

function futureScenario(id) {
  for (var i = 0; i < FUTURE_SCENARIOS.length; i += 1) {
    if (FUTURE_SCENARIOS[i].id === id) return FUTURE_SCENARIOS[i]
  }
  return null
}

function normalizeDemand(params) {
  if (params.get("scenario") && !futureScenario(params.get("scenario"))) {
    params.delete("scenario")
    return true
  }
  return false
}

function signalText(signal) {
  if (signal === "buy") return "Strong buy signal"
  if (signal === "balanced") return "Balanced"
  return "Watch closely"
}

function signalClass(signal) {
  if (signal === "buy") return "signal-buy"
  if (signal === "balanced") return "signal-balanced"
  return "signal-watch"
}

function demandTags(tags) {
  return '<p class="tag-row">' + tags.map(function (tag) {
    return '<span class="tag tag-' + esc(tag.tone) + '">' + esc(tag.name) + "</span>"
  }).join("") + "</p>"
}

function demandProduct(product) {
  var pct = Math.round((product.shortage / product.extra) * 100)
  var supplyShare = (product.supply / (product.supply + product.shortage)) * 100
  var label = product.name + ", supply " + num(product.supply) + " t, shortage " + num(product.shortage) + " t"
  return '<article class="opp opp-' + esc(product.tone) + '"><div class="opp-head"><div><h3>' + esc(product.name) +
    '</h3><p>Extra demand ' + num(product.extra) + " t · shortfall of supply</p></div><div class=\"opp-score\"><p class=\"opp-pct\">" +
    pct + '%</p><span class="signal ' + signalClass(product.signal) + '">' + esc(signalText(product.signal)) + "</span></div></div>" +
    '<div class="opp-bar" role="img" aria-label="' + esc(label) + '"><span class="opp-supply" style="width:' + supplyShare.toFixed(1) +
    '%"></span><span class="opp-short" style="width:' + (100 - supplyShare).toFixed(1) + '%"></span></div><p class="opp-foot"><span>Supply ' +
    num(product.supply) + ' t</span><span class="shortage">Shortage ' + num(product.shortage) + " t</span></p></article>"
}

function playerCard(title, items) {
  var list = items.map(function (item) { return "<li>" + esc(item) + "</li>" }).join("")
  return '<section class="player-card"><h3>' + esc(title) + "</h3><ul>" + list + "</ul></section>"
}

function viewDemandDetail(scenario) {
  var needs = scenario.needs.map(function (item) { return "<li>" + esc(item) + "</li>" }).join("")
  var products = scenario.products.map(demandProduct).join("")
  return '<div class="demand"><h1>' + esc(scenario.name) + "</h1>" + demandTags(scenario.tags) +
    '<section class="need-box"><p>' + esc(scenario.intro) + "</p><ul>" + needs + "</ul></section>" +
    "<h2>Product opportunity</h2>" + products +
    "<h2>Market players</h2><div class=\"players\">" +
    playerCard("Suppliers", scenario.players.suppliers) +
    playerCard("Customers", scenario.players.customers) +
    playerCard("Competitors", scenario.players.competitors) +
    "</div><details class=\"demand-sources\"><summary>Sources</summary><p>Modeled scenario.</p></details></div>"
}

function promptCard(scenario) {
  return '<a class="scenario-card" href="#/demand?scenario=' + esc(scenario.id) + '"><span class="scenario-name">' +
    esc(scenario.name) + "</span></a>"
}

function viewDemandHome() {
  var featured = FUTURE_SCENARIOS.map(promptCard).join("")
  var metals = FUTURE_METALS.map(function (metal) {
    return '<a class="metal-card" href="#/demand?scenario=' + esc(metal.scenario) + '"><span class="metal-name">' +
      esc(metal.name) + '</span><span class="metal-count">' + esc(metal.count) + "</span></a>"
  }).join("")
  var industries = FUTURE_INDUSTRIES.map(function (item) {
    var scenario = futureScenario(item.scenario)
    return '<a class="industry-card tone-' + esc(item.tone) + '" href="#/demand?scenario=' + esc(scenario.id) + '"><h2>' +
      esc(scenario.industry) + "</h2><p>" + esc(scenario.name) + "</p></a>"
  }).join("")
  return '<div class="demand"><h1>Scenarios</h1><div class="demand-featured">' + featured +
    '</div><p class="demand-kicker">By metal</p><div class="demand-metals">' +
    metals + '</div><p class="demand-kicker">By industry</p><div class="demand-industries">' + industries + "</div></div>"
}

function viewDemand(route) {
  var scenario = futureScenario(route.params.get("scenario"))
  if (scenario) return viewDemandDetail(scenario)
  return viewDemandHome()
}
