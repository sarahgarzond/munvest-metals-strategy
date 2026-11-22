"use strict";

/* Scope follows the ten metals in the scenario outlook. These are product examples, not orders. */
var METAL_SCENARIO_PRODUCTS = {
  Nickel: [
    ["690-tube", "Alloy 690 tubing", "nuclear", "steam-generator tubing"],
    ["625-plate", "Alloy 625 plate", "chem", "corrosion-resistant plate for process equipment"],
    ["625-wire", "Alloy 625 filler wire", "og", "weld overlay for corrosion-resistant piping"],
    ["718-bar", "Alloy 718 bar", "aero", "qualified nickel-alloy bar for engine components"],
    ["600-strip", "Alloy 600 strip", "chem", "corrosion-resistant strip for industrial equipment"],
    ["800h-plate", "Alloy 800H plate", "chem", "high-temperature plate for process furnaces"],
    ["nicr-wire", "NiCr 80/20 wire", "energy", "resistance wire for industrial heaters"]
  ],
  Cobalt: [
    ["l605", "L605 sheet", "aero", "qualified heat-resistant alloy sheet"],
    ["mp35n", "MP35N wire", "med", "high-strength alloy wire for medical components"],
    ["188", "Alloy 188 sheet", "aero", "high-temperature alloy sheet"]
  ],
  Chromium: [
    ["ferrochrome", "Ferrochrome", "steel", "alloy input for stainless steelmaking"],
    ["electrolytic", "Electrolytic chromium", "aero", "high-purity chromium for qualified alloy melts"],
    ["metal", "Chromium metal", "chem", "chromium for corrosion-resistant alloy production"]
  ],
  Molybdenum: [
    ["oxide", "Molybdenum oxide", "steel", "molybdenum input for alloy steelmaking"],
    ["ferromoly", "Ferromolybdenum", "chem", "molybdenum additions for corrosion-resistant steels"],
    ["pure", "Pure molybdenum", "elec", "molybdenum materials for electronic and thermal components"]
  ],
  Titanium: [
    ["64", "Ti-6Al-4V bar", "aero", "qualified titanium bar for aircraft components"],
    ["cp", "CP titanium sheet", "chem", "corrosion-resistant sheet for heat exchangers"],
    ["6242", "Ti-6242 forgings", "aero", "heat-resistant titanium forgings"]
  ],
  Tungsten: [
    ["carbide", "Tungsten carbide powder", "steel", "carbide powder for industrial cutting tools"],
    ["heavy", "Tungsten heavy alloy", "aero", "dense alloy for aircraft balance weights"],
    ["pure", "Pure tungsten", "elec", "tungsten materials for electronics fabrication"]
  ],
  Zirconium: [
    ["z4", "Zircaloy-4 tubing", "nuclear", "qualified zirconium-alloy fuel cladding"],
    ["z2", "Zircaloy-2 tubing", "nuclear", "qualified zirconium-alloy fuel cladding"],
    ["702", "Zr 702 plate", "chem", "corrosion-resistant plate for process equipment"]
  ],
  Copper: [
    ["etp", "ETP copper rod", "energy", "copper rod for power conductors"],
    ["ofe", "OFE copper", "elec", "high-purity copper for electronic components"],
    ["c101", "C101 copper", "elec", "oxygen-free copper for electrical equipment"]
  ],
  Aluminium: [
    ["6061", "6061 aluminium extrusion", "auto", "aluminium extrusions for vehicle components"],
    ["7075", "7075 aluminium plate", "aero", "high-strength plate for aircraft structures"],
    ["2024", "2024 aluminium sheet", "aero", "qualified sheet for aircraft structures"]
  ],
  Tantalum: [
    ["powder", "Tantalum capacitor powder", "elec", "capacitor-grade tantalum powder"],
    ["plate", "Tantalum sputtering targets", "elec", "tantalum targets for chip fabrication"],
    ["lining", "Tantalum lining sheet", "chem", "corrosion-resistant lining for process plants"]
  ]
}

var METAL_SCENARIO_DRIVERS = {
  aero: ["aircraft and engine programmes convert backlogs into production", "replacement and maintenance orders offset slower new deliveries", "aircraft deliveries are deferred or buyers qualify alternative designs"],
  auto: ["automakers raise output and order more components", "replacement orders offset weaker production in some vehicle lines", "vehicle production slows or manufacturers substitute lighter designs"],
  chem: ["plant operators approve retrofits and new process equipment", "maintenance orders offset deferred capacity expansion", "customers postpone plant upgrades or choose lower-cost materials"],
  elec: ["electronics manufacturers bring additional production capacity online", "replacement and established production volumes offset a slower expansion cycle", "equipment makers defer expansions or switch to alternative materials"],
  energy: ["utilities and manufacturers turn funded power projects into equipment orders", "replacement and maintenance orders offset a slower grid build-out", "connection, financing or permitting delays push equipment orders back"],
  med: ["medical-device makers increase production for funded hospital purchases", "replacement purchases offset muted growth in procedures", "device makers reduce orders as hospitals defer purchases"],
  nuclear: ["reactor builds or life-extension projects move into funded, grade-qualified procurement", "refurbishment and reload orders offset delays to new reactor projects", "reactor projects slip or procure fuel and equipment designed for different grades"],
  og: ["energy companies award new project and maintenance contracts", "maintenance demand offsets fewer new project awards", "operators defer projects or reduce their equipment budgets"],
  steel: ["infrastructure and manufacturing orders raise output at steel mills", "tool replacement and maintenance offset weaker construction orders", "mills and toolmakers cut output as construction and investment slow"]
}

var METAL_SCENARIO_OPTIONS = [
  { id: "increase", label: "Increase", result: "could rise" },
  { id: "steady", label: "Stay the same", result: "could stay near today’s level" },
  { id: "decline", label: "Lower", result: "could fall" }
]

var METAL_LOCAL_DRIVERS = {
  FR: { nuclear: ["EDF and its suppliers move reactor projects or fleet upgrades into qualified purchasing", "French fleet refurbishment demand balances delays to new orders", "French reactor schedules slip or tenders specify a different grade"] },
  US: {
    energy: ["U.S. utilities convert approved transmission and industrial power projects into orders", "grid replacement work offsets delays to new transmission projects", "U.S. utilities defer grid investment and equipment orders"],
    nuclear: ["U.S. utilities commit to reactor life extensions or new builds that require the grade", "U.S. fleet maintenance offsets delays to new builds", "U.S. reactor or refurbishment contracts slip into later delivery windows"]
  },
  DE: {
    chem: ["German plant operators confirm retrofit budgets after power costs ease", "German maintenance orders offset a slower recovery in chemical investment", "German plant operators defer retrofits as energy costs and weak orders squeeze budgets"],
    auto: ["German vehicle programmes move into higher-volume production", "purchases for existing vehicles offset cautious expansion plans", "German vehicle makers cut production or shift their mix toward designs using less of the material"]
  },
  CN: {
    energy: ["Chinese grid and manufacturing projects move from approval into equipment purchasing", "equipment replacement balances slower project starts", "Chinese utilities delay equipment orders or revise equipment specifications"],
    nuclear: ["Chinese reactor projects award tenders that specify the material", "reload and refurbishment orders balance slower new reactor awards", "awards are deferred or specify a different qualified material"]
  },
  GB: { nuclear: ["UK nuclear developers move projects into qualified supply-chain procurement", "maintenance work offsets delays to new project orders", "UK developers defer procurement or select different equipment specifications"] },
  IN: { nuclear: ["Indian reactor programmes move from approval into qualified equipment purchases", "existing fleet purchases offset slower new project starts", "funding or construction delays postpone purchases for Indian reactor projects"] },
  JP: { elec: ["Japanese electronics manufacturers begin purchasing for new production lines", "replacement tooling offsets slower capacity additions", "Japanese manufacturers defer lines or adopt equipment needing less of the material"] }
}

var METAL_COUNTRY_CODES = "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(" ")

function metalScenarioCountryOptions() {
  var names = new Intl.DisplayNames(["en"], { type: "region" })
  return METAL_COUNTRY_CODES.map(function (code) {
    return { code: code, label: names.of(code) }
  }).sort(function (a, b) { return a.label.localeCompare(b.label) })
}

function metalScenarioHref(params) {
  return esc(hashFor("metal-scenarios", new URLSearchParams(params)))
}

function viewMetalScenarios(route) {
  var params = route.params
  var metal = params.get("metal")
  var metals = Object.keys(METAL_SCENARIO_PRODUCTS).sort()
  if (!metals.includes(metal)) {
    return '<nav class="metal-scenario-grid" aria-label="Metals">' + metals.map(function (name) {
      return '<a class="metal-scenario-tile" href="' + metalScenarioHref({ metal: name }) + '">' + esc(name) + '</a>'
    }).join("") + '</nav>'
  }

  var products = METAL_SCENARIO_PRODUCTS[metal]
  var product = products.find(function (item) { return item[0] === params.get("grade") })
  var menu = '<p class="metal-scenario-back"><a href="#/metal-scenarios">All metals</a>' +
    (product ? ' · <a href="' + metalScenarioHref({ metal: metal }) + '">' + esc(metal) + '</a>' : '') + '</p>' +
    '<nav class="metal-scenario-grid" aria-label="' + esc(metal) + ' products">' + products.map(function (item) {
      return '<a class="metal-scenario-tile" href="' + metalScenarioHref({ metal: metal, grade: item[0] }) + '"' +
        (item === product ? ' aria-current="true"' : '') + '>' + esc(item[1]) + '</a>'
    }).join("") + '</nav>'
  if (!product) return menu

  var countryCode = params.get("country") || ""
  var countries = metalScenarioCountryOptions()
  var country = countries.find(function (item) { return item.code === countryCode })
  var direction = METAL_SCENARIO_OPTIONS.find(function (option) { return option.id === params.get("direction") })
  var countryOptions = countries.map(function (item) {
    return '<option value="' + esc(item.code) + '"' + (item === country ? ' selected' : '') + '>' + esc(item.label) + '</option>'
  }).join("")
  var buttons = METAL_SCENARIO_OPTIONS.map(function (option) {
    var query = { metal: metal, grade: product[0], direction: option.id }
    if (country) query.country = country.code
    return '<a class="metal-scenario-option" href="' + metalScenarioHref(query) + '"' +
      (option === direction ? ' aria-current="true"' : '') + '>' + esc(option.label) + '</a>'
  }).join("")
  var controls = '<div class="metal-scenario-controls"><label>Country<select id="metal-scenario-country" name="country" data-control>' +
    '<option value="">Select a country</option>' + countryOptions + '</select></label><nav aria-label="Demand direction">' + buttons + '</nav></div>'
  if (!country || !direction) return menu + controls

  var market = product[2]
  var scenarios = METAL_LOCAL_DRIVERS[country.code]?.[market] || METAL_SCENARIO_DRIVERS[market]
  var position = METAL_SCENARIO_OPTIONS.indexOf(direction)
  var copy = 'By 2035, demand for ' + product[1] + ' among buyers serving ' + country.label + ' ' + direction.result +
    ' if ' + scenarios[position] + '. This would affect orders for ' + product[3] + '.'
  return menu + controls + '<section class="metal-scenario-result" aria-label="Illustrative 2035 demand scenario">' +
    '<p>' + esc(copy) + '</p><small>Illustrative demand scenario</small></section>'
}
