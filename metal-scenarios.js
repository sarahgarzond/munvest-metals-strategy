"use strict";

/* Scope follows the ten metals in the scenario outlook. These are product examples, not orders. */
var METAL_SCENARIO_PRODUCTS = {
  Lithium: [["carbonate", "Battery-grade lithium carbonate", "ev"], ["hydroxide", "Lithium hydroxide monohydrate", "ev"]],
  Manganese: [["ferro", "High-carbon ferromanganese", "steel"], ["sulphate", "High-purity manganese sulphate", "ev"]],
  Tin: [["solder", "SAC305 solder alloy", "elec"], ["tinplate", "Tinplate coating", "steel"]],
  Vanadium: [["ferro", "Ferrovanadium", "steel"], ["electrolyte", "Vanadium electrolyte", "energy"]],
  Zinc: [["shg", "Special High Grade zinc", "steel"], ["zamak", "Zamak 3 alloy", "auto"]],
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

function scnMetalFilter(params) {
  var metal = params.get("metal")
  return Object.prototype.hasOwnProperty.call(METAL_SCENARIO_PRODUCTS, metal) ? metal : ""
}

function scnMetalSelect(params, gradeControl) {
  var metal = scnMetalFilter(params)
  var options = gradeControl ? (METAL_SCENARIO_PRODUCTS[metal] || []) :
    Object.keys(METAL_SCENARIO_PRODUCTS).sort().map(function (name) { return [name, name] })
  var name = gradeControl ? "grade" : "metal"
  var label = gradeControl ? "Grade or product" : "Metal"
  var id = "scn-filter-" + name
  var select = '<select id="' + id + '" name="' + name + '" data-control>' +
    '<option value="">' + (gradeControl ? "All grades" : "All metals") + '</option>' +
    options.map(function (item) {
      return '<option value="' + esc(item[0]) + '"' + (params.get(name) === item[0] ? ' selected' : '') + '>' + esc(item[1]) + '</option>'
    }).join("") + '</select>'
  return '<label for="' + id + '">' + label + '</label>' + select
}

function scnFilterMetalResults(model, params) {
  var metal = scnMetalFilter(params)
  if (!metal) return model
  model.metalOutlooks = model.metalOutlooks.filter(function (product) { return product.metal === metal })
  var grade = METAL_SCENARIO_PRODUCTS[metal].find(function (product) { return product[0] === params.get("grade") })
  if (!grade) return model
  var industry = model.industries[grade[2] === "nuclear" ? "energy" : grade[2]]
  model.metalOutlooks = [{
    metal: metal, name: grade[1], cardTitle: grade[1],
    per: industry.per, index: industry.index, strategy: scnProductStrategy(industry.index)
  }]
  return model
}
