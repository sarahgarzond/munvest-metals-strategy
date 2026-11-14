var ATLAS = {
  products: [
    { id: "alloy-690-tube", grade: "Alloy 690 tubing", form: "Tube", metal: "Nickel", directory: { suppliers: ["Valinox", "Sandvik", "Alleima"], customers: ["EDF", "Framatome", "Westinghouse"], competitors: ["Jiuli", "Tubacex"] } },
    { id: "nicr-8020-wire", grade: "NiCr 80/20", form: "Wire", metal: "Nickel", directory: { suppliers: ["Kanthal", "VDM Metals", "Aperam"], customers: ["Watlow", "Tutco", "Backer"], competitors: ["Isabellenhütte", "Alloy Wire"] } },
    { id: "alloy-625-filler", grade: "Alloy 625 filler wire", form: "Wire", metal: "Nickel", directory: { suppliers: ["Special Metals", "voestalpine Böhler", "ESAB"], customers: ["Tenaris", "Subsea 7", "Saipem"], competitors: ["Lincoln Electric", "Kobelco"] } },
    { id: "alloy-625-plate", grade: "Alloy 625", form: "Plate", metal: "Nickel", directory: { suppliers: ["Haynes", "VDM Metals", "ATI"], customers: ["Alfa Laval", "Kelvion", "Wärtsilä"], competitors: ["Nippon Yakin", "Outokumpu"] } },
    { id: "alloy-800h-plate", grade: "Alloy 800H", form: "Plate", metal: "Nickel", directory: { suppliers: ["VDM Metals", "ATI", "Sandvik"], customers: ["Technip", "Linde", "Air Liquide"], competitors: ["Haynes", "Nippon Yakin"] } },
    { id: "2205-plate", grade: "2205", form: "Plate", metal: "Stainless", directory: { suppliers: ["Outokumpu", "Acerinox", "Aperam"], customers: ["Andritz", "Valmet", "Metso"], competitors: ["TISCO", "POSCO"] } },
    { id: "2507-tube", grade: "2507", form: "Tube", metal: "Stainless", directory: { suppliers: ["Alleima", "Tubacex", "Sandvik"], customers: ["Aker Solutions", "OneSubsea", "Baker Hughes"], competitors: ["Jiuli", "Walsin"] } },
    { id: "alloy-718-bar", grade: "Alloy 718", form: "Bar", metal: "Nickel", directory: { suppliers: ["ATI", "Carpenter", "Allegheny"], customers: ["GE Aerospace", "Safran", "Rolls-Royce"], competitors: ["Howmet", "VSMPO-AVISMA"] } },
    { id: "alloy-600-strip", grade: "Alloy 600", form: "Strip", metal: "Nickel", directory: { suppliers: ["VDM Metals", "Elgiloy", "Ulbrich"], customers: ["Stryker", "Zimmer Biomet", "Medtronic"], competitors: ["Haynes", "Aperam"] } },
    { id: "alloy-625-strip", grade: "Alloy 625", form: "Strip", metal: "Nickel", directory: { suppliers: ["VDM Metals", "Ulbrich", "Elgiloy"], customers: ["Autoliv", "Bosch", "Continental"], competitors: ["Aperam", "Jindal"] } }
  ],
  families: [
    { id: "nickel", name: "Nickel alloys" },
    { id: "titanium", name: "Titanium alloys" },
    { id: "cobalt", name: "Cobalt alloys" },
    { id: "stainless", name: "Specialty stainless steels" }
  ],
  forms: [
    { id: "ingot", name: "Ingot", group: "Melt", families: ["nickel", "titanium", "cobalt", "stainless"] },
    { id: "remelt-stock", name: "Remelt stock", group: "Melt", families: ["nickel", "titanium", "cobalt"] },
    { id: "billet", name: "Billet", group: "Semi-finished", families: ["nickel", "titanium", "cobalt", "stainless"] },
    { id: "slab", name: "Slab", group: "Semi-finished", families: ["nickel", "titanium", "cobalt", "stainless"] },
    { id: "round-bar", name: "Round bar", group: "Bar", families: ["nickel", "titanium", "cobalt", "stainless"] },
    { id: "flat-bar", name: "Flat bar", group: "Bar", families: ["nickel", "titanium", "cobalt", "stainless"] },
    { id: "hex-bar", name: "Hex bar", group: "Bar", families: ["nickel", "titanium", "cobalt", "stainless"] },
    { id: "rod", name: "Rod", group: "Bar", families: ["nickel", "titanium", "cobalt", "stainless"] },
    { id: "wire", name: "Wire", group: "Wire", families: ["nickel", "titanium", "cobalt", "stainless"] },
    { id: "welding-filler-wire", name: "Welding filler wire", group: "Wire", families: ["nickel", "titanium", "cobalt", "stainless"] },
    { id: "plate", name: "Plate", group: "Flat", families: ["nickel", "titanium", "cobalt", "stainless"] },
    { id: "sheet", name: "Sheet", group: "Flat", families: ["nickel", "titanium", "cobalt", "stainless"] },
    { id: "strip", name: "Strip", group: "Flat", families: ["nickel", "titanium", "cobalt", "stainless"] },
    { id: "foil", name: "Foil", group: "Flat", families: ["nickel", "titanium", "stainless"] },
    { id: "seamless-tube", name: "Seamless tube", group: "Tubular", families: ["nickel", "titanium", "cobalt", "stainless"] },
    { id: "welded-tube", name: "Welded tube", group: "Tubular", families: ["nickel", "titanium", "cobalt", "stainless"] },
    { id: "seamless-pipe", name: "Seamless pipe", group: "Tubular", families: ["nickel", "titanium", "cobalt", "stainless"] },
    { id: "welded-pipe", name: "Welded pipe", group: "Tubular", families: ["nickel", "titanium", "stainless"] },
    { id: "forged-ring", name: "Forged ring", group: "Forged", families: ["nickel", "titanium", "cobalt", "stainless"] },
    { id: "forged-disc", name: "Forged disc", group: "Forged", families: ["nickel", "titanium", "cobalt", "stainless"] },
    { id: "investment-casting", name: "Investment casting", group: "Cast", families: ["nickel", "titanium", "cobalt"] },
    { id: "powder", name: "Powder", group: "Powder", families: ["nickel", "titanium", "cobalt", "stainless"] },
    { id: "fastener", name: "Fastener", group: "Other", families: ["nickel"] },
    { id: "extruded-profile", name: "Extruded profile", group: "Other", families: ["titanium"] },
    { id: "fitting", name: "Fitting", group: "Other", families: ["stainless"] },
    { id: "flange", name: "Flange", group: "Other", families: ["stainless"] }
  ],
  reactorFleet: {
    source: "IAEA PRIS",
    asOf: "1 July 2026",
    unknown: ["Japan", "Pakistan", "Russia", "Ukraine"],
    counts: {
      World: { operating: 411, construction: 73 },
      Argentina: { operating: 3, construction: 1 },
      Armenia: { operating: 1, construction: 0 },
      Bangladesh: { operating: 0, construction: 2 },
      Belarus: { operating: 2, construction: 0 },
      Belgium: { operating: 2, construction: 0 },
      Brazil: { operating: 2, construction: 1 },
      Bulgaria: { operating: 2, construction: 0 },
      Canada: { operating: 17, construction: 1 },
      China: { operating: 63, construction: 37 },
      Czechia: { operating: 6, construction: 0 },
      Egypt: { operating: 0, construction: 4 },
      Finland: { operating: 5, construction: 0 },
      France: { operating: 57, construction: 0 },
      Germany: { operating: 0, construction: 0 },
      Hungary: { operating: 4, construction: 1 },
      India: { operating: 25, construction: 8 },
      Iran: { operating: 1, construction: 2 },
      Mexico: { operating: 2, construction: 0 },
      Netherlands: { operating: 1, construction: 0 },
      Poland: { operating: 0, construction: 0 },
      Romania: { operating: 2, construction: 0 },
      Slovakia: { operating: 5, construction: 1 },
      Slovenia: { operating: 1, construction: 0 },
      "South Africa": { operating: 2, construction: 0 },
      "South Korea": { operating: 23, construction: 4 },
      Spain: { operating: 7, construction: 0 },
      Sweden: { operating: 6, construction: 0 },
      Switzerland: { operating: 4, construction: 0 },
      Turkey: { operating: 0, construction: 4 },
      "United Arab Emirates": { operating: 4, construction: 0 },
      "United Kingdom": { operating: 9, construction: 2 },
      "United States": { operating: 94, construction: 0 }
    }
  },
  places: [
    { id: "World", name: "World", group: "World", kind: "world" },
    { id: "Africa", name: "Africa", group: "Continent", kind: "continent" },
    { id: "Asia", name: "Asia", group: "Continent", kind: "continent" },
    { id: "Europe", name: "Europe", group: "Continent", kind: "continent" },
    { id: "North America", name: "North America", group: "Continent", kind: "continent" },
    { id: "South America", name: "South America", group: "Continent", kind: "continent" },
    { id: "Oceania", name: "Oceania", group: "Continent", kind: "continent" }
  ].concat([
    ["Algeria", "Africa"], ["Angola", "Africa"], ["Benin", "Africa"], ["Botswana", "Africa"], ["Burkina Faso", "Africa"], ["Burundi", "Africa"], ["Cabo Verde", "Africa"], ["Cameroon", "Africa"], ["Central African Republic", "Africa"], ["Chad", "Africa"], ["Comoros", "Africa"], ["Congo", "Africa"], ["Côte d'Ivoire", "Africa"], ["Djibouti", "Africa"], ["Egypt", "Africa"], ["Equatorial Guinea", "Africa"], ["Eritrea", "Africa"], ["Eswatini", "Africa"], ["Ethiopia", "Africa"], ["Gabon", "Africa"], ["Gambia", "Africa"], ["Ghana", "Africa"], ["Guinea", "Africa"], ["Guinea-Bissau", "Africa"], ["Kenya", "Africa"], ["Lesotho", "Africa"], ["Liberia", "Africa"], ["Libya", "Africa"], ["Madagascar", "Africa"], ["Malawi", "Africa"], ["Mali", "Africa"], ["Mauritania", "Africa"], ["Mauritius", "Africa"], ["Morocco", "Africa"], ["Mozambique", "Africa"], ["Namibia", "Africa"], ["Niger", "Africa"], ["Nigeria", "Africa"], ["Rwanda", "Africa"], ["São Tomé and Príncipe", "Africa"], ["Senegal", "Africa"], ["Seychelles", "Africa"], ["Sierra Leone", "Africa"], ["Somalia", "Africa"], ["South Africa", "Africa"], ["South Sudan", "Africa"], ["Sudan", "Africa"], ["Tanzania", "Africa"], ["Togo", "Africa"], ["Tunisia", "Africa"], ["Uganda", "Africa"], ["Zambia", "Africa"], ["Zimbabwe", "Africa"],
    ["Afghanistan", "Asia"], ["Armenia", "Asia"], ["Azerbaijan", "Asia"], ["Bahrain", "Asia"], ["Bangladesh", "Asia"], ["Bhutan", "Asia"], ["Brunei", "Asia"], ["Cambodia", "Asia"], ["China", "Asia"], ["Cyprus", "Asia"], ["Georgia", "Asia"], ["India", "Asia"], ["Indonesia", "Asia"], ["Iran", "Asia"], ["Iraq", "Asia"], ["Israel", "Asia"], ["Japan", "Asia"], ["Jordan", "Asia"], ["Kazakhstan", "Asia"], ["Kuwait", "Asia"], ["Kyrgyzstan", "Asia"], ["Laos", "Asia"], ["Lebanon", "Asia"], ["Malaysia", "Asia"], ["Maldives", "Asia"], ["Mongolia", "Asia"], ["Myanmar", "Asia"], ["Nepal", "Asia"], ["North Korea", "Asia"], ["Oman", "Asia"], ["Pakistan", "Asia"], ["Palestine", "Asia"], ["Philippines", "Asia"], ["Qatar", "Asia"], ["Saudi Arabia", "Asia"], ["Singapore", "Asia"], ["South Korea", "Asia"], ["Sri Lanka", "Asia"], ["Syria", "Asia"], ["Tajikistan", "Asia"], ["Thailand", "Asia"], ["Timor-Leste", "Asia"], ["Turkey", "Asia"], ["Turkmenistan", "Asia"], ["United Arab Emirates", "Asia"], ["Uzbekistan", "Asia"], ["Vietnam", "Asia"], ["Yemen", "Asia"],
    ["Albania", "Europe"], ["Andorra", "Europe"], ["Austria", "Europe"], ["Belarus", "Europe"], ["Belgium", "Europe"], ["Bosnia and Herzegovina", "Europe"], ["Bulgaria", "Europe"], ["Croatia", "Europe"], ["Czechia", "Europe"], ["Denmark", "Europe"], ["Estonia", "Europe"], ["Finland", "Europe"], ["France", "Europe"], ["Germany", "Europe"], ["Greece", "Europe"], ["Hungary", "Europe"], ["Iceland", "Europe"], ["Ireland", "Europe"], ["Italy", "Europe"], ["Kosovo", "Europe"], ["Latvia", "Europe"], ["Liechtenstein", "Europe"], ["Lithuania", "Europe"], ["Luxembourg", "Europe"], ["Malta", "Europe"], ["Moldova", "Europe"], ["Monaco", "Europe"], ["Montenegro", "Europe"], ["Netherlands", "Europe"], ["North Macedonia", "Europe"], ["Norway", "Europe"], ["Poland", "Europe"], ["Portugal", "Europe"], ["Romania", "Europe"], ["Russia", "Europe"], ["San Marino", "Europe"], ["Serbia", "Europe"], ["Slovakia", "Europe"], ["Slovenia", "Europe"], ["Spain", "Europe"], ["Sweden", "Europe"], ["Switzerland", "Europe"], ["Ukraine", "Europe"], ["United Kingdom", "Europe"], ["Vatican City", "Europe"],
    ["Antigua and Barbuda", "North America"], ["Bahamas", "North America"], ["Barbados", "North America"], ["Belize", "North America"], ["Canada", "North America"], ["Costa Rica", "North America"], ["Cuba", "North America"], ["Dominica", "North America"], ["Dominican Republic", "North America"], ["El Salvador", "North America"], ["Grenada", "North America"], ["Guatemala", "North America"], ["Haiti", "North America"], ["Honduras", "North America"], ["Jamaica", "North America"], ["Mexico", "North America"], ["Nicaragua", "North America"], ["Panama", "North America"], ["Saint Kitts and Nevis", "North America"], ["Saint Lucia", "North America"], ["Saint Vincent and the Grenadines", "North America"], ["Trinidad and Tobago", "North America"], ["United States", "North America"],
    ["Argentina", "South America"], ["Bolivia", "South America"], ["Brazil", "South America"], ["Chile", "South America"], ["Colombia", "South America"], ["Ecuador", "South America"], ["Guyana", "South America"], ["Paraguay", "South America"], ["Peru", "South America"], ["Suriname", "South America"], ["Uruguay", "South America"], ["Venezuela", "South America"],
    ["Australia", "Oceania"], ["Fiji", "Oceania"], ["Kiribati", "Oceania"], ["Marshall Islands", "Oceania"], ["Micronesia", "Oceania"], ["Nauru", "Oceania"], ["New Zealand", "Oceania"], ["Palau", "Oceania"], ["Papua New Guinea", "Oceania"], ["Samoa", "Oceania"], ["Solomon Islands", "Oceania"], ["Tonga", "Oceania"], ["Tuvalu", "Oceania"], ["Vanuatu", "Oceania"]
  ].map(function (pair) {
    return { id: pair[0], name: pair[0], group: pair[1], kind: "country", continent: pair[1] }
  })),
  scenarios: [
    {
      id: "new-reactors",
      name: "New reactor builds",
      family: "nickel",
      form: "seamless-tube",
      kind: "reactors",
      market: "Nuclear",
      period: "2027–2030",
      unit: "t",
      perName: "per reactor",
      defaultCount: 3,
      min: 0,
      max: 40,
      baseline: null,
      materials: [
        {
          component: "Steam-generator tubing",
          grade: "Alloy 690",
          form: "seamless-tube",
          perUnit: 200,
          basis: "modeled",
          sources: ["Modeled"],
          directory: {
            suppliers: ["Valinox", "Sandvik", "Alleima"],
            customers: ["EDF", "Framatome", "Westinghouse"],
            competitors: ["Jiuli", "Tubacex"]
          },
          supply: { France: 450, Poland: null, Czechia: null, "United Kingdom": 400, "United States": 700 }
        }
      ]
    },
    {
      id: "jet-engines",
      name: "More jet engines delivered",
      family: "nickel",
      form: "investment-casting",
      kind: "engines",
      market: "Aerospace",
      period: "2026–2030",
      unit: "t",
      perName: "per engine",
      defaultCount: 40,
      min: 0,
      max: 80,
      builders: ["GE Aerospace", "Safran", "Rolls-Royce"],
      defaultBuilder: "GE Aerospace",
      baseline: { "GE Aerospace": 120, Safran: 90, "Rolls-Royce": 70 },
      materials: [
        {
          component: "Turbine blades",
          grade: "Alloy 713",
          form: "investment-casting",
          perUnit: 1,
          basis: "modeled",
          sources: ["Modeled"],
          directory: {
            suppliers: ["Howmet", "PCC", "Doncasters"],
            customers: ["GE Aerospace", "Safran", "Rolls-Royce"],
            competitors: ["Consolidated Precision", "Chromalloy"]
          },
          supply: { "GE Aerospace": null, Safran: null, "Rolls-Royce": null }
        }
      ]
    }
  ],
  observations: [
    { id: "s-690-fr", productId: "alloy-690-tube", industry: "Energy", region: "France", market: "Nuclear", delivery: "2027–2030", evidence: "Contract", demand: 144, supply: 90, unit: "t", contracts: [{ year: 2026, name: "EPR" }] },
    { id: "s-690-us", productId: "alloy-690-tube", industry: "Energy", region: "United States", market: "Nuclear", delivery: "2031–2034", evidence: "Reported", demand: 80, supply: null, unit: "t", contracts: [] },
    { id: "s-nicr", productId: "nicr-8020-wire", industry: "Energy", region: "Europe", market: "Heating", delivery: "2026–2035", evidence: "Reported", demand: 1460, supply: 1180, unit: "t/y", contracts: [{ year: 2025, name: "Heater" }] },
    { id: "s-625-oil", productId: "alloy-625-filler", industry: "Oil", region: "Americas", market: "Oil", delivery: "2026–2028", evidence: "Tender", demand: 180, supply: 70, unit: "t", contracts: [{ year: 2026, name: "Clad pipe" }] },
    { id: "s-625-aero", productId: "alloy-625-filler", industry: "Aerospace", region: "Europe", market: "Aerospace", delivery: "2026–2028", evidence: "Reported", demand: 55, supply: 55, unit: "t", contracts: [] },
    { id: "s-2205", productId: "2205-plate", industry: "Chemical", region: "Europe", market: "Process", delivery: "2026–2029", evidence: "Contract", demand: 680, supply: 400, unit: "t", contracts: [{ year: 2026, name: "Digesters" }] },
    { id: "s-2507", productId: "2507-tube", industry: "Oil", region: "Europe", market: "Oil", delivery: "2026–2029", evidence: "Reported", demand: 176, supply: null, unit: "t", contracts: [] },
    { id: "s-625-plate", productId: "alloy-625-plate", industry: "Chemical", region: "United States", market: "Chemical", delivery: "2027–2030", evidence: "Contract", demand: 210, supply: 160, unit: "t", contracts: [{ year: 2025, name: "Exchangers" }] },
    { id: "s-800", productId: "alloy-800h-plate", industry: "Energy", region: "Asia", market: "Energy", delivery: "2028–2032", evidence: "Reported", demand: 95, supply: null, unit: "t", contracts: [] },
    { id: "s-718", productId: "alloy-718-bar", industry: "Aerospace", region: "United States", market: "Aerospace", delivery: "2026–2028", evidence: "Contract", demand: 40, supply: 12, unit: "t", contracts: [{ year: 2026, name: "Disks" }] },
    { id: "s-600", productId: "alloy-600-strip", industry: "Medical", region: "Europe", market: "Medical", delivery: "2026–2028", evidence: "Contract", demand: 18, supply: 6, unit: "t", contracts: [{ year: 2025, name: "Implants" }] },
    { id: "s-625-strip", productId: "alloy-625-strip", industry: "Automotive", region: "Europe", market: "Automotive", delivery: "2026–2028", evidence: "Reported", demand: 30, supply: 28, unit: "t", contracts: [] }
  ],
  assumptions: {
    reactors: {
      countries: ["France", "Poland", "Czechia", "United Kingdom", "United States"],
      defaultCountry: "France",
      defaultCount: 3,
      market: "Nuclear",
      delivery: "2027–2030",
      unit: "t",
      materials: [
        { productId: "alloy-690-tube", perUnit: 48, supply: { France: 90, Poland: null, Czechia: null, "United Kingdom": 40, "United States": 140 } },
        { productId: "alloy-625-filler", perUnit: 6, supply: { France: 30, Poland: 10, Czechia: null, "United Kingdom": 18, "United States": 50 } },
        { productId: "alloy-800h-plate", perUnit: 22, supply: { France: null, Poland: null, Czechia: null, "United Kingdom": 15, "United States": 40 } }
      ]
    },
    duplex: {
      regions: ["Europe", "United States", "Asia"],
      defaultRegion: "Europe",
      defaultCount: 8,
      market: "Process",
      delivery: "2026–2029",
      unit: "t",
      materials: [
        { productId: "2205-plate", perUnit: 85, supply: { Europe: 400, "United States": 260, Asia: null } },
        { productId: "2507-tube", perUnit: 22, supply: { Europe: null, "United States": 90, Asia: 70 } }
      ]
    },
    series: {
      "nicr-8020-wire": { market: "Heating", unit: "t/y", supplyNow: 1180, demandNow: 1460, supply2035: 1090, demand2035: 2140, current: ["Heating", "Furnaces", "Resistors"], forecast: ["Hydrogen", "Ovens"] },
      "alloy-625-filler": { market: "Oil", unit: "t/y", supplyNow: 640, demandNow: 710, supply2035: 800, demand2035: 960, current: ["Overlay", "Cladding", "Subsea"], forecast: ["Repair", "Wells"] },
      "alloy-625-plate": { market: "Chemical", unit: "t/y", supplyNow: 900, demandNow: 860, supply2035: 1100, demand2035: 1480, current: ["Vessels", "Exchangers", "Ducts"], forecast: ["Acid", "Scrubbers", "CCS"] },
      "alloy-800h-plate": { market: "Energy", unit: "t/y", supplyNow: 420, demandNow: 390, supply2035: null, demand2035: 610, current: ["Reformers", "Heaters", "Piping"], forecast: ["Hydrogen", "Nuclear"] }
    }
  }
}
