"use strict"

/* Scenario generator 2035 — data that links industries to metals and market conditions to the drivers.
   Shares: % of each metal's demand that goes to each industry. "p" = published (tracker source),
   "e" = team estimate inside a published total. Shares not linked to a model industry are "other"
   and follow the baseline. Sources are tracker Source Log IDs (S…). */

var SCN_METAL_SHARES = [
  { metal: "Copper", use: "Wire, busbars and strip", sources: ["S124", "S038"],
    basis: "USGS US end use 2025: building 42%, electrical/electronic 23%, transport 18%, consumer 10%, machinery 7%. EV share from IEA (2.9% of world demand).",
    s: { steel: [42, "p"], energy: [12, "e"], elec: [11, "e"], auto: [15, "e"], ev: [3, "p"], other: [17, "p"] },
    note: "Electrical/electronic 23% split evenly between energy and electronics; transport 18% split into EVs (IEA) and the rest of automotive." },
  { metal: "Aluminium", use: "Sheet, plate and extrusions", sources: ["S125"],
    basis: "USGS US end use 2025: transport 36%, packaging 24%, building 13%, electrical 9%, consumer durables 8%, machinery 8%, other 2%.",
    s: { auto: [31, "e"], aero: [5, "e"], steel: [13, "p"], energy: [9, "p"], other: [42, "p"] },
    note: "Transport 36% split into automotive and aerospace (team estimate)." },
  { metal: "Nickel", use: "Nickel alloys and stainless", sources: ["S038", "S001"],
    basis: "IEA 2025: EVs 439 of 3,530 kt, energy (storage, wind, other low-emission power) 185 kt. USGS: stainless and nickel alloys are more than 85% of US use.",
    s: { ev: [12, "p"], energy: [5, "p"], steel: [45, "e"], chem: [10, "e"], aero: [8, "e"], og: [6, "e"], auto: [5, "e"], med: [1, "e"], other: [8, "e"] },
    note: "The IEA 'other uses' (83%) are split by end market as a team estimate." },
  { metal: "Cobalt", use: "Cobalt alloys and battery materials", sources: ["S038", "S010"],
    basis: "IEA 2025: EVs 84 of 259 kt, grid storage 6 kt. USGS US end use: superalloys 51%, chemicals 25%, other metallic 15%, carbides 9%.",
    s: { ev: [32, "p"], energy: [9, "e"], aero: [26, "e"], chem: [10, "e"], med: [3, "e"], other: [20, "e"] },
    note: "Non-battery demand split with the USGS end-use pattern; superalloys divided between aircraft engines and power turbines (team estimate)." },
  { metal: "Chromium", use: "Stainless and corrosion-resistant alloys", sources: ["S118"],
    basis: "USGS: stainless steel is the leading use; superalloys a major strategic use. No percentages published.",
    s: { steel: [60, "e"], chem: [12, "e"], og: [6, "e"], energy: [6, "e"], aero: [5, "e"], auto: [5, "e"], other: [6, "e"] },
    note: "All shares are team estimates following the USGS ranking." },
  { metal: "Molybdenum", use: "Alloy and stainless steels", sources: ["S119"],
    basis: "USGS: alloying agent in cast iron, steel and superalloys; also catalysts. No percentages published.",
    s: { steel: [45, "e"], og: [15, "e"], chem: [15, "e"], energy: [8, "e"], auto: [7, "e"], aero: [3, "e"], other: [7, "e"] },
    note: "All shares are team estimates following the USGS ranking." },
  { metal: "Titanium", use: "Aircraft and implant alloys", sources: ["S123"],
    basis: "USGS: the majority of titanium metal goes to aerospace; also armour, chemical plant, marine and medical implants.",
    s: { aero: [55, "e"], defence: [10, "e"], chem: [12, "e"], med: [8, "e"], energy: [5, "e"], other: [10, "e"] },
    note: "All shares are team estimates following the USGS description." },
  { metal: "Tungsten", use: "Carbide tooling and heavy alloys", sources: ["S120"],
    basis: "USGS: cemented carbides are 60% of US use; the rest goes to alloys, mill products and chemicals.",
    s: { auto: [15, "e"], steel: [15, "e"], aero: [10, "e"], elec: [12, "e"], defence: [8, "e"], other: [40, "e"] },
    note: "Carbide tooling (60%) split across automotive machining, mining and construction tools, and general machining (team estimate)." },
  { metal: "Zirconium", use: "Nuclear and chemical-plant zirconium", sources: ["S121"],
    basis: "USGS: ceramics are the leading use of zircon; also foundry sand, refractories, chemicals. Zirconium metal goes mainly to nuclear cladding and chemical plant.",
    s: { energy: [15, "e"], chem: [15, "e"], steel: [5, "e"], med: [3, "e"], elec: [2, "e"], other: [60, "e"] },
    note: "All shares are team estimates; ceramics, foundry and refractories are kept as 'other'." },
  { metal: "Manganese", use: "Steelmaking and battery materials", sources: ["S126"],
    basis: "USGS: mainly steelmaking (ferroalloys); also batteries and chemicals.",
    s: { steel: [88, "e"], ev: [6, "e"], chem: [3, "e"], other: [3, "e"] },
    note: "All shares are team estimates following the USGS description." }
]

/* Outlook call from the demand score (share-weighted industry outlook, −2 to +2). */
var SCN_CALLS = [
  { min: 0.3, label: "Expand", cls: "grow", text: "Add capacity and qualify grades for the growing end markets." },
  { min: 0.1, label: "Reposition", cls: "shift", text: "Keep volume; move the sales mix towards the end markets that grow." },
  { min: -Infinity, label: "Maintain", cls: "hold", text: "Serve existing demand; no new capacity until a signpost turns." }
]

/* 2035 market conditions: the report's 24 indicators as filters. Each runs from the low end (−2) to the
   high end (+2) of its driver; the report's current score is the starting position.
   Driver probability = 50% + 24 points × average score, as in the report. */
var OL_DRIVER_NAMES = { a: "European industry", b: "Stance on China", c: "Metal supply", d: "Technology change" }

var SCN_CONDITIONS = {
  A1: { name: "Economic growth", low: "Recession", high: "Boom" },
  A2: { name: "Fiscal stimulus", low: "Cut back", high: "Fully spent" },
  A3: { name: "Chemical output", low: "Falling", high: "Recovering" },
  A4: { name: "Automotive jobs", low: "Cuts", high: "Hiring" },
  A5: { name: "Defence spending", low: "Flat", high: "+10% a year" },
  A6: { name: "Industrial policy", low: "Dropped", high: "Fully funded" },
  B1: { name: "Tariffs on Chinese EVs", low: "Removed", high: "Widened" },
  B2: { name: "EU-content rules", low: "None", high: "70% EU content" },
  B3: { name: "Chinese export controls", low: "Lifted", high: "Fully enforced" },
  B4: { name: "EU–China dialogue", low: "Close", high: "Broken off" },
  B5: { name: "Chinese car brands in the EU", low: "Above 15%", high: "Below 5%" },
  B6: { name: "Chinese car plants in the EU", low: "Several", high: "Blocked" },
  C1: { name: "Cobalt export quota (DRC)", low: "Lifted", high: "Cut" },
  C2: { name: "Tungsten export licences (China)", low: "Eased", high: "Cut further" },
  C3: { name: "Nickel supply (Indonesia)", low: "Surplus", high: "Capped" },
  C4: { name: "Castings and forgings backlog", low: "Cleared", high: "Growing" },
  C5: { name: "New Western mines and recycling", low: "Ahead of plan", high: "Cancelled" },
  C6: { name: "Export restrictions", low: "Relaxed", high: "Widened" },
  D1: { name: "LFP share of batteries", low: "Below 40%", high: "Above 75%" },
  D2: { name: "Sodium-ion uptake", low: "Niche", high: "20% by 2030" },
  D3: { name: "Sodium-ion cost parity", low: "After 2035", high: "By 2027" },
  D4: { name: "AI in mineral exploration", low: "No impact", high: "Major share" },
  D5: { name: "Aerospace supply recovery", low: "After 2030", high: "By 2027" },
  D6: { name: "Power-equipment capacity", low: "Stalls", high: "Catches up" }
}

/* Companies for the decision brief.
   Producers and tracker buyers: companies whose own documents the tracker cites in its application list.
   Directory buyers: named in the team product directory (data.js) and Metal market map (chains.js), not yet sourced row by row. */
var OL_PRODUCERS = {
  "Alleima": "SE", "Arnold": "US", "Carpenter": "US", "Constellium": "FR", "EOS": "DE", "ESAB": "US", "Haynes": "US",
  "Höganäs": "SE", "Hussey": "US", "Oerlikon": "CH", "Osaka Titanium": "JP", "Outokumpu": "FI", "Sandvik": "SE",
  "Special Metals": "US", "UACJ": "JP", "VDM": "DE", "Wieland": "DE", "alimex": "DE", "voestalpine": "AT", "Hobart": "US", "Polymet": ""
}

var OL_USERS = { "Boeing": "US", "Chart": "US", "Linde": "", "Agilent": "US", "Getter Technologies": "", "Swagelok": "US", "Dana": "US" }

var OL_BUYERS = [
  ["Framatome", "FR", "energy", ["Nickel", "Cobalt"], "Nuclear steam-generator tubing"],
  ["Westinghouse", "US", "energy", ["Nickel", "Cobalt"], "Nuclear steam-generator tubing"],
  ["EDF", "FR", "energy", ["Nickel"], "Nuclear fleet operator"],
  ["Wärtsilä", "FI", "energy", ["Nickel"], "Engines and power plants"],
  ["Alfa Laval", "SE", "chem", ["Nickel", "Cobalt"], "Heat exchangers"],
  ["Kelvion", "DE", "chem", ["Nickel"], "Heat exchangers"],
  ["Technip", "FR", "chem", ["Nickel"], "Process plants"],
  ["Linde", "", "chem", ["Nickel"], "Hydrogen and gas plants"],
  ["Air Liquide", "FR", "chem", ["Nickel"], "Hydrogen and gas plants"],
  ["Andritz", "AT", "chem", ["Chromium"], "Pulp and process equipment (duplex plate)"],
  ["Valmet", "FI", "chem", ["Chromium"], "Pulp and process equipment (duplex plate)"],
  ["Metso", "FI", "chem", ["Chromium"], "Process equipment (duplex plate)"],
  ["GE Aerospace", "US", "aero", ["Nickel", "Cobalt", "Titanium"], "Jet-engine bar, castings and forgings"],
  ["Safran", "FR", "aero", ["Nickel", "Cobalt", "Titanium"], "Jet-engine bar and castings"],
  ["Rolls-Royce", "GB", "aero", ["Nickel", "Titanium"], "Jet-engine castings"],
  ["Airbus", "FR", "aero", ["Titanium"], "Airframe plate, tube and forgings"],
  ["Boeing", "US", "aero", ["Titanium"], "Airframe forgings and wire"],
  ["Howmet", "US", "aero", ["Cobalt"], "Engine forgings"],
  ["Subsea 7", "GB", "og", ["Nickel"], "Clad pipe, Alloy 625 filler wire"],
  ["Tenaris", "LU", "og", ["Nickel"], "Clad pipe, Alloy 625 filler wire"],
  ["Saipem", "IT", "og", ["Nickel"], "Clad pipe, Alloy 625 filler wire"],
  ["Aker Solutions", "NO", "og", ["Chromium"], "Super-duplex tube"],
  ["Baker Hughes", "US", "og", ["Chromium"], "Super-duplex tube"],
  ["Stryker", "US", "med", ["Nickel"], "Alloy 600 strip for devices"],
  ["Zimmer Biomet", "US", "med", ["Nickel"], "Alloy 600 strip for devices"],
  ["Medtronic", "IE", "med", ["Nickel"], "Alloy 600 strip for devices"],
  ["Autoliv", "SE", "auto", ["Nickel"], "Alloy 625 strip (airbag parts)"],
  ["Bosch", "DE", "auto", ["Nickel"], "Alloy 625 strip"],
  ["Continental", "DE", "auto", ["Nickel"], "Alloy 625 strip"],
  ["Watlow", "US", "elec", ["Nickel", "Cobalt"], "NiCr heating-element wire"],
  ["Tutco", "US", "elec", ["Nickel"], "NiCr heating-element wire"],
  ["CATL", "CN", "ev", ["Cobalt"], "Battery cells"],
  ["Samsung SDI", "KR", "ev", ["Cobalt"], "Battery cells"],
  ["BYD", "CN", "ev", ["Cobalt"], "Battery packs and vehicles"],
  ["Renault-Nissan", "FR", "ev", ["Cobalt"], "Electric vehicles"]
]

var OL_ISO2 = { SE: "Sweden", US: "United States", FR: "France", DE: "Germany", CH: "Switzerland", JP: "Japan", FI: "Finland", AT: "Austria", GB: "United Kingdom", LU: "Luxembourg", IT: "Italy", NO: "Norway", IE: "Ireland", CN: "China", KR: "South Korea" }
var OL_ISO3 = { SE: "SWE", US: "USA", FR: "FRA", DE: "DEU", CH: "CHE", JP: "JPN", FI: "FIN", AT: "AUT", GB: "GBR", LU: "LUX", IT: "ITA", NO: "NOR", IE: "IRL", CN: "CHN", KR: "KOR" }
