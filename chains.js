"use strict"

var CHAIN_PLACES = {
  kolwezi: [25.47, -10.72],
  tenke: [26.15, -10.61],
  lubumbashi: [27.48, -11.66],
  quzhou: [118.87, 28.97],
  jingmen: [112.2, 31.04],
  tongren: [109.18, 27.72],
  ningde: [119.55, 26.66],
  ningbo: [121.55, 29.87],
  cheonan: [127.15, 36.82],
  olen: [4.86, 51.14],
  paris: [2.35, 48.86],
  shenzhen: [114.06, 22.54],
  sudbury: [-81.0, 46.49],
  kambalda: [121.67, -31.2],
  jinchang: [102.19, 38.52],
  sorowako: [121.35, -2.56],
  kristiansand: [8.0, 58.15],
  montbard: [4.34, 47.62],
  sandviken: [16.77, 60.62],
  kokomo: [-86.13, 40.49],
  pittsburgh: [-79.99, 40.44],
  unna: [7.69, 51.53],
  whitehall: [-86.35, 43.41],
  derby: [-1.47, 52.92],
  tornio: [24.14, 65.85],
  losbarrios: [-5.48, 36.18],
  genk: [5.5, 50.96],
  sorel: [-73.12, 46.04],
  perth: [115.86, -31.95],
  moma: [40.5, -16.8],
  amagasaki: [135.42, 34.72],
  salda: [60.55, 58.05],
  seattle: [-122.33, 47.61],
  toulouse: [1.44, 43.6],
  rustenburg: [27.24, -25.67],
  johannesburg: [28.05, -26.2],
  hamburg: [9.99, 53.55]
}

var chainView = { scale: 1 }

function formBucket(formId) {
  var tube = ["seamless-tube", "welded-tube", "seamless-pipe", "welded-pipe", "fitting", "flange"]
  var flat = ["plate", "sheet", "strip", "foil", "slab"]
  var long = ["round-bar", "flat-bar", "hex-bar", "rod", "fastener"]
  var wire = ["wire", "welding-filler-wire"]
  var forge = ["billet", "forged-ring", "forged-disc", "extruded-profile"]
  if (["powder", "ingot", "remelt-stock"].indexOf(formId) >= 0) return "melt"
  if (tube.indexOf(formId) >= 0) return "tube"
  if (flat.indexOf(formId) >= 0) return "flat"
  if (long.indexOf(formId) >= 0) return "long"
  if (wire.indexOf(formId) >= 0) return "wire"
  if (formId === "investment-casting") return "cast"
  if (forge.indexOf(formId) >= 0) return "forge"
  return "long"
}

var SUPPLY_METALS = [
  { id: "nickel", name: "Nickel" },
  { id: "cobalt", name: "Cobalt" },
  { id: "chromium", name: "Chromium" },
  { id: "molybdenum", name: "Molybdenum" },
  { id: "titanium", name: "Titanium" },
  { id: "tungsten", name: "Tungsten" },
  { id: "zirconium", name: "Zirconium" },
  { id: "copper", name: "Copper" },
  { id: "aluminium", name: "Aluminium" },
  { id: "manganese", name: "Manganese" }
]

var SUPPLY_SPECIFICS = {
  nickel: [["690", "Alloy 690"], ["625", "Alloy 625"], ["718", "Alloy 718"], ["600", "Alloy 600"], ["800h", "Alloy 800H"]],
  cobalt: [["l605", "L605"], ["mp35n", "MP35N"], ["188", "Alloy 188"]],
  chromium: [["ferrochrome", "Ferrochrome"], ["electrolytic", "Electrolytic"], ["metal", "Metal"]],
  molybdenum: [["oxide", "Oxide"], ["ferromoly", "Ferromolybdenum"], ["pure", "Pure"]],
  titanium: [["64", "Ti-6Al-4V"], ["cp", "CP titanium"], ["6242", "Ti-6242"]],
  tungsten: [["carbide", "Carbide"], ["heavy", "Heavy alloy"], ["pure", "Pure"]],
  zirconium: [["z4", "Zircaloy-4"], ["z2", "Zircaloy-2"], ["702", "Zr 702"]],
  copper: [["etp", "ETP"], ["ofe", "OFE"], ["c101", "C101"]],
  aluminium: [["6061", "6061"], ["7075", "7075"], ["2024", "2024"]],
  manganese: [["electrolytic", "Electrolytic"], ["ferromanganese", "Ferromanganese"], ["silicomanganese", "Silicomanganese"]]
}

function knownFamily(id) {
  var found = false
  SUPPLY_METALS.forEach(function (item) { if (item.id === id) found = true })
  return found
}

function specificsFor(family) {
  return (SUPPLY_SPECIFICS[family] || []).map(function (item) { return { id: item[0], name: item[1] } })
}

function addFirms(nodes, firms, stage, forms) {
  firms.forEach(function (firm) {
    nodes.push({ id: firm[0], name: firm[1], place: firm[2], stage: stage, forms: forms })
  })
}

function fanLinks(from, to) {
  return from.map(function (firm, index) {
    return [firm[0], to[index % to.length][0]]
  })
}

function streamChain(title, mines, refiners, routes) {
  var nodes = []
  var links = fanLinks(mines, refiners)
  addFirms(nodes, mines, 0, "*")
  addFirms(nodes, refiners, 1, "*")
  Object.keys(routes).forEach(function (bucket) {
    var route = routes[bucket]
    addFirms(nodes, route.mills, 2, bucket)
    addFirms(nodes, route.buyers, 3, bucket)
    links = links.concat(fanLinks(refiners, route.mills), fanLinks(route.mills, route.buyers))
  })
  return { title: title, stages: ["Mining", "Refining", "Mill", "Buyers"], nodes: nodes, links: links }
}

function cobaltBattery() {
  var groups = [
    [["kamoto", "Kamoto Copper", "kolwezi"], ["mutanda", "Mutanda", "kolwezi"], ["metalkol", "Metalkol tailings", "kolwezi"], ["tenke", "Tenke Fungurume", "tenke"], ["sicomines", "Sicomines", "kolwezi"]],
    [["cdm", "Congo Dongfang", "lubumbashi"], ["kamoto-plant", "Kamoto plant", "kolwezi"], ["tfm-plant", "TFM plant", "tenke"]],
    [["shituru", "Shituru", "lubumbashi"], ["luilu", "Luilu", "kolwezi"]],
    [["huayou", "Huayou Cobalt", "quzhou"], ["gem", "GEM", "jingmen"], ["umicore", "Umicore", "olen"]],
    [["huayou-p", "Huayou precursor", "quzhou"], ["gem-p", "GEM precursor", "jingmen"], ["cngr", "CNGR", "tongren"]],
    [["ronbay", "Ronbay", "ningbo"], ["catl-c", "CATL cathode", "ningde"]],
    [["catl", "CATL", "ningde"], ["samsung", "Samsung SDI", "cheonan"]],
    [["catl-pack", "CATL pack", "ningde"], ["sdi-pack", "SDI pack", "cheonan"]],
    [["renault", "Renault-Nissan", "paris"], ["byd", "BYD", "shenzhen"]]
  ]
  var nodes = []
  groups.forEach(function (group, stage) { addFirms(nodes, group, stage, "*") })
  var links = []
  for (var i = 0; i < groups.length - 1; i += 1) links = links.concat(fanLinks(groups[i], groups[i + 1]))
  return {
    title: "Cobalt",
    stages: ["Mining", "Processing", "Smelting", "Refining", "Precursor", "Cathode", "Battery cell", "Battery pack", "Vehicle"],
    nodes: nodes,
    links: links
  }
}

function familyChain(family, bucket) {
  if (family === "cobalt" && bucket === "melt") return cobaltBattery()
  var nickel = streamChain("Nickel", [
    ["vale", "Vale", "sudbury"], ["glencore", "Glencore", "sudbury"], ["bhp", "BHP Nickel West", "kambalda"], ["jinchuan", "Jinchuan", "jinchang"], ["ptvale", "PT Vale", "sorowako"]
  ], [
    ["nikkelverk", "Nikkelverk", "kristiansand"], ["jinchuan-r", "Jinchuan refinery", "jinchang"], ["vale-r", "Vale refinery", "sudbury"]
  ], {
    tube: { mills: [["valinox", "Valinox", "montbard"], ["sandvik", "Sandvik", "sandviken"], ["alleima", "Alleima", "sandviken"]], buyers: [["framatome", "Framatome", "paris"], ["westinghouse", "Westinghouse", "pittsburgh"], ["edf", "EDF", "paris"]] },
    flat: { mills: [["haynes", "Haynes", "kokomo"], ["vdm", "VDM Metals", "unna"], ["ati", "ATI", "pittsburgh"]], buyers: [["alfalaval", "Alfa Laval", "sandviken"], ["wartsila", "Wärtsilä", "sandviken"]] },
    long: { mills: [["ati-b", "ATI", "pittsburgh"], ["carpenter", "Carpenter", "pittsburgh"]], buyers: [["ge", "GE Aerospace", "derby"], ["safran", "Safran", "paris"]] },
    wire: { mills: [["kanthal", "Kanthal", "sandviken"], ["esab", "ESAB", "kokomo"]], buyers: [["watlow", "Watlow", "pittsburgh"], ["subsea", "Subsea 7", "paris"]] },
    cast: { mills: [["howmet", "Howmet", "whitehall"], ["pcc", "PCC", "pittsburgh"]], buyers: [["ge-c", "GE Aerospace", "derby"], ["rolls", "Rolls-Royce", "derby"]] },
    forge: { mills: [["special", "Special Metals", "kokomo"], ["vdm-f", "VDM Metals", "unna"]], buyers: [["howmet-f", "Howmet", "whitehall"], ["ati-f", "ATI", "pittsburgh"]] },
    melt: { mills: [["special-m", "Special Metals", "kokomo"], ["vdm-m", "VDM Metals", "unna"], ["ati-m", "ATI", "pittsburgh"]], buyers: [["ge-m", "GE Aerospace", "derby"], ["sandvik-m", "Sandvik", "sandviken"]] }
  })
  var cobalt = streamChain("Cobalt", [
    ["kamoto", "Kamoto Copper", "kolwezi"], ["mutanda", "Mutanda", "kolwezi"], ["metalkol", "Metalkol tailings", "kolwezi"], ["tenke", "Tenke Fungurume", "tenke"]
  ], [
    ["huayou", "Huayou Cobalt", "quzhou"], ["gem", "GEM", "jingmen"], ["umicore", "Umicore", "olen"]
  ], {
    tube: { mills: [["valinox-c", "Valinox", "montbard"], ["sandvik-c", "Sandvik", "sandviken"]], buyers: [["framatome-c", "Framatome", "paris"], ["westinghouse-c", "Westinghouse", "pittsburgh"]] },
    flat: { mills: [["haynes-c", "Haynes", "kokomo"], ["vdm-c", "VDM Metals", "unna"]], buyers: [["alfalaval-c", "Alfa Laval", "sandviken"]] },
    long: { mills: [["ati-c", "ATI", "pittsburgh"], ["carpenter-c", "Carpenter", "pittsburgh"]], buyers: [["ge-co", "GE Aerospace", "derby"]] },
    wire: { mills: [["kanthal-c", "Kanthal", "sandviken"]], buyers: [["watlow-c", "Watlow", "pittsburgh"]] },
    cast: { mills: [["howmet-c", "Howmet", "whitehall"], ["pcc-c", "PCC", "pittsburgh"]], buyers: [["ge-cc", "GE Aerospace", "derby"], ["safran-c", "Safran", "paris"]] },
    forge: { mills: [["ati-cf", "ATI", "pittsburgh"]], buyers: [["howmet-cf", "Howmet", "whitehall"]] }
  })
  var titanium = streamChain("Titanium", [
    ["riotinto", "Rio Tinto", "sorel"], ["iluka", "Iluka", "perth"], ["kenmare", "Kenmare", "moma"]
  ], [
    ["osaka", "Osaka Titanium", "amagasaki"], ["vsmpo", "VSMPO-AVISMA", "salda"]
  ], {
    tube: { mills: [["vsmpo-t", "VSMPO-AVISMA", "salda"], ["ati-t", "ATI", "pittsburgh"]], buyers: [["airbus", "Airbus", "toulouse"], ["boeing", "Boeing", "seattle"]] },
    flat: { mills: [["ati-tf", "ATI", "pittsburgh"], ["vsmpo-f", "VSMPO-AVISMA", "salda"]], buyers: [["airbus-f", "Airbus", "toulouse"]] },
    long: { mills: [["vsmpo-b", "VSMPO-AVISMA", "salda"], ["ati-tb", "ATI", "pittsburgh"]], buyers: [["ge-t", "GE Aerospace", "derby"], ["safran-t", "Safran", "paris"]] },
    wire: { mills: [["vsmpo-w", "VSMPO-AVISMA", "salda"]], buyers: [["boeing-w", "Boeing", "seattle"]] },
    cast: { mills: [["pcc-t", "PCC", "pittsburgh"], ["howmet-t", "Howmet", "whitehall"]], buyers: [["ge-tc", "GE Aerospace", "derby"], ["rolls-t", "Rolls-Royce", "derby"]] },
    forge: { mills: [["vsmpo-g", "VSMPO-AVISMA", "salda"], ["ati-tg", "ATI", "pittsburgh"]], buyers: [["airbus-g", "Airbus", "toulouse"], ["boeing-g", "Boeing", "seattle"]] },
    melt: { mills: [["osaka-m", "Osaka Titanium", "amagasaki"], ["vsmpo-m", "VSMPO-AVISMA", "salda"]], buyers: [["ati-tm", "ATI", "pittsburgh"], ["boeing-m", "Boeing", "seattle"]] }
  })
  var stainless = streamChain("Stainless", [
    ["samancor", "Samancor", "rustenburg"], ["glencore-s", "Glencore", "johannesburg"], ["vale-s", "Vale", "sudbury"]
  ], [
    ["outokumpu", "Outokumpu", "tornio"], ["acerinox", "Acerinox", "losbarrios"], ["aperam", "Aperam", "genk"]
  ], {
    tube: { mills: [["alleima-s", "Alleima", "sandviken"], ["tubacex", "Tubacex", "losbarrios"]], buyers: [["aker", "Aker Solutions", "sandviken"], ["baker", "Baker Hughes", "pittsburgh"]] },
    flat: { mills: [["outokumpu-p", "Outokumpu", "tornio"], ["acerinox-p", "Acerinox", "losbarrios"], ["aperam-p", "Aperam", "genk"]], buyers: [["andritz", "Andritz", "genk"], ["valmet", "Valmet", "sandviken"], ["metso", "Metso", "sandviken"]] },
    long: { mills: [["outokumpu-b", "Outokumpu", "tornio"], ["acerinox-b", "Acerinox", "losbarrios"]], buyers: [["andritz-b", "Andritz", "genk"]] },
    wire: { mills: [["aperam-w", "Aperam", "genk"]], buyers: [["esab-s", "ESAB", "kokomo"]] },
    forge: { mills: [["outokumpu-g", "Outokumpu", "tornio"]], buyers: [["andritz-g", "Andritz", "genk"], ["metso-g", "Metso", "sandviken"]] },
    melt: { mills: [["outokumpu-m", "Outokumpu", "tornio"], ["aperam-m", "Aperam", "genk"]], buyers: [["acerinox-m", "Acerinox", "losbarrios"]] }
  })
  if (family === "nickel") return nickel
  if (family === "cobalt") return cobalt
  if (family === "titanium") return titanium
  if (family === "chromium") return { title: "Chromium", stages: stainless.stages, nodes: stainless.nodes, links: stainless.links }
  return streamChain(metalName(family), [
    ["mine-a", metalName(family) + " mine", "johannesburg"],
    ["mine-b", metalName(family) + " pit", "perth"]
  ], [
    ["ref-a", metalName(family) + " refinery", "hamburg"]
  ], {
    tube: { mills: [["mill-t", "Tube mill", "sandviken"]], buyers: [["buyer-t", "Tube buyers", "paris"]] },
    flat: { mills: [["mill-f", "Flat mill", "tornio"]], buyers: [["buyer-f", "Flat buyers", "genk"]] },
    long: { mills: [["mill-l", "Bar mill", "pittsburgh"]], buyers: [["buyer-l", "Bar buyers", "derby"]] },
    wire: { mills: [["mill-w", "Wire mill", "sandviken"]], buyers: [["buyer-w", "Wire buyers", "paris"]] },
    cast: { mills: [["mill-c", "Cast house", "whitehall"]], buyers: [["buyer-c", "Cast buyers", "derby"]] },
    forge: { mills: [["mill-g", "Forge", "unna"]], buyers: [["buyer-g", "Forge buyers", "paris"]] },
    melt: { mills: [["mill-m", "Melt shop", "hamburg"]], buyers: [["buyer-m", "Melt buyers", "paris"]] }
  })
}

function metalName(id) {
  var name = "Nickel"
  SUPPLY_METALS.forEach(function (item) { if (item.id === id) name = item.name })
  return name
}

function packChain(chain, bucket, formName) {
  var nodes = chain.nodes.filter(function (node) { return node.forms === "*" || node.forms === bucket })
  var used = {}
  nodes.forEach(function (node) { used[node.stage] = true })
  var stages = []
  var stageMap = {}
  chain.stages.forEach(function (stage, index) {
    if (!used[index]) return
    stageMap[index] = stages.length
    stages.push(stage === "Mill" ? formName : stage)
  })
  var packed = nodes.map(function (node) {
    return { id: node.id, name: node.name, place: node.place, stage: stageMap[node.stage] }
  })
  var ids = {}
  packed.forEach(function (node) { ids[node.id] = true })
  var links = chain.links.filter(function (link) { return ids[link[0]] && ids[link[1]] })
  return { title: chain.title, stages: stages, nodes: packed, links: links }
}

function chainModel(family, formId) {
  var form = null
  ATLAS.forms.forEach(function (item) { if (item.id === formId) form = item })
  return packChain(familyChain(family, formBucket(formId)), formBucket(formId), form ? form.name : "Mill")
}

function formsForFamily(family) {
  var forms = ATLAS.forms.filter(function (form) { return form.families.indexOf(family) >= 0 })
  if (forms.length) return forms
  return ATLAS.forms.filter(function (form) { return form.families.indexOf("nickel") >= 0 })
}

function normalizeSupply(params) {
  var changed = false
  var family = params.get("family")
  if (!knownFamily(family)) {
    params.set("family", "cobalt")
    family = "cobalt"
    changed = true
  }
  var forms = formsForFamily(family)
  var form = params.get("form")
  var known = false
  forms.forEach(function (item) { if (item.id === form) known = true })
  if (!known) {
    params.set("form", family === "cobalt" ? "powder" : forms[0].id)
    changed = true
  }
  var specifics = specificsFor(params.get("family"))
  var specific = params.get("specific")
  if (!specifics.some(function (item) { return item.id === specific })) {
    params.set("specific", specifics[0].id)
    changed = true
  }
  var model = chainModel(params.get("family"), params.get("form"))
  var node = params.get("node")
  if (node && !model.nodes.some(function (item) { return item.id === node })) {
    params.delete("node")
    changed = true
  }
  return changed
}

function layoutChain(model) {
  var width = Math.max(980, model.stages.length * 136)
  var height = 440
  var colW = width / model.stages.length
  var columns = model.stages.map(function () { return [] })
  model.nodes.forEach(function (node) { columns[node.stage].push(node) })
  var placed = model.nodes.map(function (node) {
    var column = columns[node.stage]
    var index = column.indexOf(node)
    var boxH = 28
    var gap = 8
    var total = column.length * boxH + (column.length - 1) * gap
    var boxW = Math.min(122, colW - 16)
    return {
      id: node.id,
      name: node.name,
      place: node.place,
      stage: node.stage,
      x: node.stage * colW + (colW - boxW) / 2,
      y: 46 + (height - 70 - total) / 2 + index * (boxH + gap),
      w: boxW,
      h: boxH
    }
  })
  return { width: width, height: height, colW: colW, placed: placed }
}

function nodeFill(stage, count, selected) {
  if (selected) return "#217a45"
  if (stage === 0) return "#6a4b32"
  if (stage === count - 1) return "#3f6b52"
  if (stage < count / 2) return "#6e5878"
  return "#5d6d86"
}

function flowSvg(model, selected) {
  var layout = layoutChain(model)
  var byId = {}
  layout.placed.forEach(function (node) { byId[node.id] = node })
  var bands = model.stages.map(function (stage, index) {
    var wash = "#f6f1e8"
    return '<rect x="' + (index * layout.colW).toFixed(1) + '" y="0" width="' + layout.colW.toFixed(1) + '" height="' + layout.height + '" fill="' + wash + '"></rect>' +
      '<text class="chain-stage" x="' + (index * layout.colW + layout.colW / 2).toFixed(1) + '" y="22" text-anchor="middle" fill="#8a8478">' + esc(stage) + "</text>"
  }).join("")
  var curves = model.links.map(function (link) {
    var from = byId[link[0]]
    var to = byId[link[1]]
    if (!from || !to) return ""
    var x1 = from.x + from.w
    var y1 = from.y + from.h / 2
    var x2 = to.x
    var y2 = to.y + to.h / 2
    var bend = Math.max(24, (x2 - x1) * 0.45)
    var hot = selected && (selected === from.id || selected === to.id)
    return '<path d="M' + x1.toFixed(1) + " " + y1.toFixed(1) + " C" + (x1 + bend).toFixed(1) + " " + y1.toFixed(1) + " " + (x2 - bend).toFixed(1) + " " + y2.toFixed(1) + " " + x2.toFixed(1) + " " + y2.toFixed(1) + '" fill="none" stroke="' + (hot ? "#217a45" : "#b7b1a6") + '" stroke-width="' + (hot ? "1.7" : "1") + '"></path>'
  }).join("")
  var boxes = layout.placed.map(function (node) {
    var label = node.name.length > 18 ? node.name.slice(0, 16) + "…" : node.name
    var pressed = selected === node.id
    return '<g class="chain-node" data-node="' + esc(node.id) + '" tabindex="0" role="button" aria-pressed="' + (pressed ? "true" : "false") + '" aria-label="' + esc(node.name) + '">' +
      "<title>" + esc(node.name) + "</title>" +
      '<rect x="' + node.x.toFixed(1) + '" y="' + node.y.toFixed(1) + '" width="' + node.w.toFixed(1) + '" height="' + node.h.toFixed(1) + '" rx="3" fill="' + nodeFill(node.stage, model.stages.length, pressed) + '"></rect>' +
      '<text x="' + (node.x + node.w / 2).toFixed(1) + '" y="' + (node.y + 18).toFixed(1) + '" text-anchor="middle" fill="#fff">' + esc(label) + "</text></g>"
  }).join("")
  return '<svg class="chain-flow-svg" viewBox="0 0 ' + layout.width + " " + layout.height + '" role="group" aria-label="' + esc(model.title) + ' supply chain">' + bands + curves + boxes + "</svg>"
}

function mapPoint(lon, lat) {
  return [((lon + 180) / 360) * 1000, ((90 - lat) / 180) * 500]
}

function mapSvg(model, selected) {
  var byId = {}
  model.nodes.forEach(function (node) { byId[node.id] = node })
  var seen = {}
  var arcs = []
  model.links.forEach(function (link) {
    var from = byId[link[0]]
    var to = byId[link[1]]
    if (!from || !to || from.place === to.place || !CHAIN_PLACES[from.place] || !CHAIN_PLACES[to.place]) return
    var key = [from.place, to.place].sort().join("|")
    if (seen[key]) return
    seen[key] = true
    var a = mapPoint(CHAIN_PLACES[from.place][0], CHAIN_PLACES[from.place][1])
    var b = mapPoint(CHAIN_PLACES[to.place][0], CHAIN_PLACES[to.place][1])
    var mx = (a[0] + b[0]) / 2
    var my = Math.min(a[1], b[1]) - Math.min(80, Math.abs(b[0] - a[0]) * 0.18)
    var hot = selected && (selected === from.id || selected === to.id)
    arcs.push('<path d="M' + a[0].toFixed(1) + " " + a[1].toFixed(1) + " Q" + mx.toFixed(1) + " " + my.toFixed(1) + " " + b[0].toFixed(1) + " " + b[1].toFixed(1) + '" fill="none" stroke="' + (hot ? "#217a45" : "#8d97a0") + '" stroke-width="' + (hot ? "1.6" : "0.8") + '"></path>')
  })
  var dots = {}
  model.nodes.forEach(function (node) {
    if (!CHAIN_PLACES[node.place]) return
    if (!dots[node.place]) dots[node.place] = { hot: false, name: node.name }
    if (selected === node.id) dots[node.place].hot = true
  })
  var circles = Object.keys(dots).map(function (place) {
    var point = mapPoint(CHAIN_PLACES[place][0], CHAIN_PLACES[place][1])
    var hot = dots[place].hot
    return '<circle cx="' + point[0].toFixed(1) + '" cy="' + point[1].toFixed(1) + '" r="' + (hot ? "6" : "4") + '" fill="' + (hot ? "#217a45" : "#3e6b52") + '"><title>' + esc(dots[place].name) + "</title></circle>"
  }).join("")
  var transform = "translate(500 218) scale(" + chainView.scale.toFixed(2) + ") translate(-500 -218)"
  return '<svg class="chain-map-svg" viewBox="0 18 1000 400" role="img" aria-label="Map of the supply chain"><g id="chain-land" transform="' + transform + '"><path fill="#c5ced6" d="' + LAND_PATH + '"></path>' + arcs.join("") + circles + "</g></svg>"
}

function chainOptions(name, label, value, options) {
  var opts = options.map(function (opt) {
    return '<option value="' + esc(opt.id) + '"' + (opt.id === value ? " selected" : "") + ">" + esc(opt.name) + "</option>"
  }).join("")
  return '<label class="filter">' + esc(label) + '<select data-control="1" id="control-' + esc(name) + '" name="' + esc(name) + '" autocomplete="off">' + opts + "</select></label>"
}

function companySelect(model, selected) {
  var groups = model.stages.map(function (stage, index) {
    var items = model.nodes.filter(function (node) { return node.stage === index })
    if (!items.length) return ""
    return '<optgroup label="' + esc(stage) + '">' + items.map(function (node) {
      return '<option value="' + esc(node.id) + '"' + (node.id === selected ? " selected" : "") + ">" + esc(node.name) + "</option>"
    }).join("") + "</optgroup>"
  }).join("")
  return '<label class="chain-company"><span class="visually-hidden">Company</span><select data-control="1" id="control-node" name="node" autocomplete="off"><option value="">All companies</option>' + groups + "</select></label>"
}

function viewChain(route) {
  var family = route.params.get("family")
  var form = route.params.get("form")
  var model = chainModel(family, form)
  var selected = route.params.get("node")
  var forms = formsForFamily(family).map(function (item) { return { id: item.id, name: item.name } })
  var clear = selected ? '<button type="button" class="chain-clear" data-action="clear-node" aria-label="Clear company">×</button>' : ""
  return '<div class="chain-page"><div class="chain-picks">' +
    chainOptions("family", "Metal", family, SUPPLY_METALS) +
    chainOptions("form", "Form", form, forms) +
    chainOptions("specific", "Specific", route.params.get("specific"), specificsFor(family)) +
    '</div><section class="chain-card"><div class="chain-top"><h1 class="chain-title">' + esc(model.title) + " · " + esc(specificsFor(family).filter(function (item) { return item.id === route.params.get("specific") })[0].name) + ' supply chain</h1><div class="chain-tools">' +
    companySelect(model, selected) + clear + '</div></div><div class="chain-flow">' + flowSvg(model, selected) +
    '</div><div class="chain-map"><div class="chain-zoom"><button type="button" data-action="zoom" data-dir="in" aria-label="Zoom in">+</button><button type="button" data-action="zoom" data-dir="out" aria-label="Zoom out">−</button></div>' +
    mapSvg(model, selected) + "</div></section></div>"
}
