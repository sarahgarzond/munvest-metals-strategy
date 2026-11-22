"use strict"

function findById(list, id) {
  for (var i = 0; i < list.length; i += 1) {
    if (list[i].id === id) return list[i]
  }
  return null
}

function formsForFamily(familyId) {
  return ATLAS.forms.filter(function (form) {
    return form.families.indexOf(familyId) !== -1
  })
}

function scenariosFor(familyId, formId) {
  return ATLAS.scenarios.filter(function (scenario) {
    return scenario.family === familyId && scenario.form === formId
  })
}

function scaleQty(value, count) {
  return Math.round(value * count * 1000) / 1000
}

function normalizeScenarios(params) {
  var changed = false
  var family = params.get("family")
  if (!findById(ATLAS.families, family)) {
    params.set("family", "nickel")
    family = "nickel"
    changed = true
  }
  var forms = formsForFamily(family)
  var form = params.get("form")
  if (!forms.some(function (item) { return item.id === form })) {
    var preferred = forms.filter(function (item) { return item.id === "seamless-tube" })[0] || forms[0]
    params.set("form", preferred.id)
    form = preferred.id
    changed = true
  }
  var available = scenariosFor(family, form)
  var current = findById(available, params.get("scenario"))
  if (!current) {
    if (available[0]) {
      params.set("scenario", available[0].id)
      params.set("count", String(available[0].defaultCount))
      if (available[0].kind === "reactors") params.set("country", "France")
      if (available[0].kind === "engines") params.set("builder", available[0].defaultBuilder)
      changed = true
    } else if (params.has("scenario")) {
      params.delete("scenario")
      changed = true
    }
    current = available[0] || null
  }
  if (current && current.kind === "reactors") {
    if (!findById(ATLAS.places, params.get("country"))) {
      params.set("country", "France")
      changed = true
    }
    if (!findById(ATLAS.places, params.get("fleet"))) {
      params.set("fleet", params.get("country") || "France")
      changed = true
    }
  }
  if (current && current.kind === "engines" && current.builders.indexOf(params.get("builder")) === -1) {
    params.set("builder", current.defaultBuilder)
    changed = true
  }
  if (current) {
    var count = Number(params.get("count"))
    if (!Number.isInteger(count) || count < current.min || count > current.max) {
      params.set("count", String(current.defaultCount))
      changed = true
    }
  }
  return changed
}

function placeSupply(material, place) {
  if (!material.supply || !Object.prototype.hasOwnProperty.call(material.supply, place)) return null
  return material.supply[place]
}

function simModel(params) {
  var family = findById(ATLAS.families, params.get("family"))
  var form = findById(ATLAS.forms, params.get("form"))
  var available = family && form ? scenariosFor(family.id, form.id) : []
  var scenario = findById(available, params.get("scenario"))
  var count = scenario ? Number(params.get("count")) : 0
  var place = null
  if (scenario && scenario.kind === "engines") place = params.get("builder")
  if (scenario && scenario.kind === "reactors") place = params.get("country")
  var materials = scenario ? scenario.materials.filter(function (material) { return material.form === form.id }) : []
  var additional = 0
  var anyQty = false
  var supply = 0
  var supplyKnown = materials.length > 0
  materials.forEach(function (material) {
    if (material.perUnit == null) {
      supplyKnown = false
      return
    }
    anyQty = true
    additional += scaleQty(material.perUnit, count)
    var value = placeSupply(material, place)
    if (value == null) supplyKnown = false
    else supply += value
  })
  if (!anyQty || !supplyKnown) supply = null
  var baseline = null
  if (scenario && scenario.baseline != null && anyQty) {
    baseline = typeof scenario.baseline === "number" ? scenario.baseline : scenario.baseline[place]
    if (baseline == null) baseline = null
  }
  var fleetId = params.get("fleet") || place
  var fleet = scenario && scenario.kind === "reactors" ? fleetFor(fleetId) : null
  var result = null
  if (scenario && anyQty) {
    if (supply == null) result = { value: additional, label: "Additional demand" }
    else if (additional > supply) result = { value: additional - supply, label: "Modeled shortfall" }
    else result = { value: supply - additional, label: "Spare capacity" }
  }
  return {
    family: family,
    form: form,
    available: available,
    scenario: scenario,
    count: count,
    place: place,
    fleetId: fleetId,
    materials: materials,
    additional: additional,
    supply: supply,
    baseline: baseline,
    fleet: fleet,
    result: result,
    primary: materials[0] || null,
    trace: params.get("trace") === "1"
  }
}

function scenarioSummary(model) {
  if (!model.scenario) return "No scenario available"
  if (!model.result) return model.scenario.name
  return num(model.result.value) + " " + model.scenario.unit + " " + model.result.label
}

function combo(id, label, value, options, hideLabel) {
  var selected = null
  options.forEach(function (opt) { if (opt.value === value) selected = opt })
  return '<div class="combo" data-combo="' + esc(id) + '" data-value="' + esc(value) + '" data-options="' + esc(JSON.stringify(options)) + '">' +
    '<label class="' + (hideLabel ? "visually-hidden" : "") + '" for="' + esc(id) + '-input">' + esc(label) + "</label>" +
    '<input id="' + esc(id) + '-input" role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="' + esc(id) + '-list" autocomplete="off" spellcheck="false" value="' + esc(selected ? selected.label : "") + '">' +
    '<ul id="' + esc(id) + '-list" class="combo-list" role="listbox" hidden></ul></div>'
}

function stepper(count, min, max, lessLabel, moreLabel) {
  return '<span class="stepper"><button type="button" id="step-less" data-action="step" data-step="-1" aria-label="' + esc(lessLabel) + '"' + (count <= min ? " disabled" : "") + ">−</button>" +
    '<output id="step-count">' + esc(String(count)) + "</output>" +
    '<button type="button" id="step-more" data-action="step" data-step="1" aria-label="' + esc(moreLabel) + '"' + (count >= max ? " disabled" : "") + ">+</button></span>"
}

function placeOptions() {
  return ATLAS.places.map(function (place) {
    return { value: place.id, label: place.name, group: place.kind === "country" ? place.continent : place.group }
  })
}

function fleetFor(id) {
  var place = findById(ATLAS.places, id)
  if (!place) return null
  var counts = ATLAS.reactorFleet.counts
  if (place.kind === "world") return counts.World || null
  if (place.kind === "country") {
    if (ATLAS.reactorFleet.unknown.indexOf(id) !== -1) return null
    return counts[id] || { operating: 0, construction: 0 }
  }
  var operating = 0
  var construction = 0
  var blocked = false
  ATLAS.places.forEach(function (item) {
    if (item.continent !== place.id) return
    if (ATLAS.reactorFleet.unknown.indexOf(item.id) !== -1) blocked = true
    var row = counts[item.id]
    if (!row) return
    operating += row.operating
    construction += row.construction
  })
  if (blocked) return null
  return { operating: operating, construction: construction }
}

function demandPanel(model) {
  var scenario = model.scenario
  if (model.baseline == null) {
    return '<section class="sim-panel board-demand"><h2 class="panel-title">Additional demand by material</h2>' +
      chart({
        unit: scenario.unit,
        spoken: "tonnes",
        height: 420,
        label: "Additional demand by material, tonnes",
        groups: model.materials.filter(function (material) { return material.perUnit != null }).map(function (material) {
          return { label: material.grade || material.component, bars: [{ name: "Additional", value: scaleQty(material.perUnit, model.count), fill: "slate" }] }
        })
      }) + "</section>"
  }
  return '<section class="sim-panel board-demand"><h2 class="panel-title">Baseline vs. scenario demand</h2>' +
    chart({
      unit: scenario.unit,
      spoken: "tonnes",
      height: 420,
      label: "Baseline versus scenario demand, tonnes",
      legend: [{ cls: "today", name: "Baseline" }, { cls: "future", name: "Scenario" }],
      groups: [
        { label: "Baseline", bars: [{ name: "Baseline", value: model.baseline, fill: "line" }] },
        { label: "Scenario", bars: [{ name: "Scenario", value: model.baseline + model.additional, fill: "solid" }] }
      ]
    }) + "</section>"
}

function resultPanel(model) {
  var result = model.result
  var body = result
    ? '<p class="result-num">' + num(result.value) + '\u00a0<span class="unit">' + esc(model.scenario.unit) + "</span></p><p class=\"panel-title\">" + esc(result.label) + "</p>"
    : '<p class="result-num"><span class="unknown">Quantity unknown</span></p>'
  var trace = model.primary
    ? '<button type="button" class="trace-btn" data-action="trace" aria-expanded="' + (model.trace ? "true" : "false") + '">Trace value chain</button>'
    : ""
  return '<section class="sim-panel board-result">' + body + trace + "</section>"
}

function boardInner(model) {
  if (!model.scenario) return '<p class="sim-empty">No scenario available</p>'
  return demandPanel(model) + resultPanel(model)
}

function materialLine(material, model) {
  var formName = model.form ? model.form.name : ""
  var bits = [material.component, material.grade == null ? "Specification unknown" : material.grade, formName]
  if (material.perUnit == null) bits.push("Quantity unknown")
  else {
    bits.push(num(material.perUnit) + " " + model.scenario.unit + " " + model.scenario.perName)
    bits.push(num(scaleQty(material.perUnit, model.count)) + " " + model.scenario.unit + " extra")
  }
  var basis = material.basis === "sourced" ? "Sourced" : "Modeled"
  return "<li><p class=\"spec-line\">" + bits.map(function (bit) {
    return "<span>" + esc(bit) + "</span>"
  }).join('<span class="dot" aria-hidden="true">·</span>') + '</p><p class="when">' + esc(basis) + "</p></li>"
}

function fleetPanel(model) {
  var fleet = model.fleet
  var counts = fleet
    ? '<div class="fleet-counts"><p><span class="panel-title">Operating</span><strong>' + num(fleet.operating) + '</strong></p><p><span class="panel-title">Under construction</span><strong>' + num(fleet.construction) + "</strong></p></div>"
    : '<p class="unknown">Unknown</p>'
  return '<section class="lever" id="fleet-section"><h2 class="panel-title">Current reactors</h2><div class="lever-filters">' +
    combo("fleet", "Place", model.fleetId, placeOptions()) +
    "</div>" + counts +
    '<p class="addition">+' + num(model.count) + " modeled additions</p>" +
    '<p class="when">' + esc(ATLAS.reactorFleet.source) + " · " + esc(ATLAS.reactorFleet.asOf) + "</p></section>"
}

function materialsPanel(model) {
  var rows = model.materials.map(function (material) { return materialLine(material, model) }).join("")
  return '<section class="sim-panel materials"><h2 class="panel-title">Specified materials</h2><ul class="spec-list">' +
    (rows || '<li><p class="unknown">Specification unknown</p></li>') + "</ul></section>"
}

function factsInner(model) {
  if (!model.scenario) return ""
  if (model.scenario.kind === "reactors") return fleetPanel(model) + materialsPanel(model)
  return materialsPanel(model)
}

function traceHtml(model) {
  if (!model.trace || !model.primary) return ""
  var item = model.primary
  var directory = item.directory || {}
  return '<section class="trace" id="trace">' +
    listSection("Suppliers", directory.suppliers) +
    listSection("Customers", directory.customers) +
    listSection("Competitors", directory.competitors) +
    listSection("Sources", item.sources) +
    "</section>"
}

function scenarioControls(model) {
  if (!model.family || !model.form) return ""
  var familyOptions = ATLAS.families.map(function (family) {
    return { value: family.id, label: family.name }
  })
  var formOptions = formsForFamily(model.family.id).map(function (form) {
    return { value: form.id, label: form.name, group: form.group }
  })
  var sentence = ""
  if (model.scenario && model.scenario.kind === "reactors") {
    sentence = '<div class="sentence">' +
      combo("country", "Country", model.place, placeOptions(), true) +
      "<span>orders</span>" +
      stepper(model.count, model.scenario.min, model.scenario.max, "Fewer reactors", "More reactors") +
      "<span>additional reactors</span></div>"
  }
  if (model.scenario && model.scenario.kind === "engines") {
    sentence = '<div class="sentence">' +
      combo("builder", "Builder", model.place, model.scenario.builders.map(function (name) {
        return { value: name, label: name }
      }), true) +
      "<span>delivers</span>" +
      stepper(model.count, model.scenario.min, model.scenario.max, "Fewer engines", "More engines") +
      "<span>additional engines</span></div>"
  }
  return '<section class="lever"><h2 class="panel-title">Scenario</h2><div class="lever-filters">' +
    combo("family", "Metal family", model.family.id, familyOptions) +
    combo("form", "Product form", model.form.id, formOptions) +
    sentence + "</div></section>"
}

function viewScenarios(route) {
  var model = simModel(route.params)
  return '<h1 class="visually-hidden">Scenario builder</h1><div id="board" class="board">' + boardInner(model) + "</div>" +
    scenarioControls(model) +
    '<div id="facts" class="facts">' + factsInner(model) + "</div>" +
    traceHtml(model)
}

function refreshScenario(model) {
  var board = document.getElementById("board")
  var facts = document.getElementById("facts")
  if (!board || !facts || !model.scenario) return false
  board.innerHTML = boardInner(model)
  facts.innerHTML = factsInner(model)
  var out = document.getElementById("step-count")
  if (out) out.textContent = String(model.count)
  var less = document.getElementById("step-less")
  var more = document.getElementById("step-more")
  if (less) less.disabled = model.count <= model.scenario.min
  if (more) more.disabled = model.count >= model.scenario.max
  return true
}

function comboChoices(wrap) {
  try { return JSON.parse(wrap.dataset.options) } catch (err) { return [] }
}

function selectedComboLabel(wrap) {
  var value = wrap.dataset.value
  var match = null
  comboChoices(wrap).forEach(function (opt) { if (opt.value === value) match = opt })
  return match ? match.label : ""
}

function closeCombos(except) {
  Array.prototype.forEach.call(document.querySelectorAll(".combo"), function (wrap) {
    if (wrap === except) return
    var input = wrap.querySelector("[role='combobox']")
    var list = document.getElementById(wrap.dataset.combo + "-list")
    if (!input || !list) return
    input.setAttribute("aria-expanded", "false")
    input.removeAttribute("aria-activedescendant")
    list.hidden = true
    list.innerHTML = ""
    input.value = selectedComboLabel(wrap)
  })
}

function fillComboList(wrap, query) {
  var list = document.getElementById(wrap.dataset.combo + "-list")
  var q = query.trim().toLowerCase()
  var html = []
  var lastGroup = ""
  var count = 0
  comboChoices(wrap).forEach(function (opt, index) {
    if (q && opt.label.toLowerCase().indexOf(q) === -1) return
    if (opt.group && opt.group !== lastGroup) {
      html.push('<li class="combo-group" role="presentation">' + esc(opt.group) + "</li>")
      lastGroup = opt.group
    }
    var selected = opt.value === wrap.dataset.value ? "true" : "false"
    html.push('<li role="option" id="' + esc(wrap.dataset.combo) + "-opt-" + index + '" data-value="' + esc(opt.value) + '" aria-selected="' + selected + '">' + esc(opt.label) + "</li>")
    count += 1
  })
  list.innerHTML = count ? html.join("") : '<li class="combo-empty" role="presentation">None</li>'
  var active = list.querySelector('[aria-selected="true"]') || list.querySelector("[role='option']")
  markComboActive(wrap, active)
}

function markComboActive(wrap, option) {
  var input = wrap.querySelector("[role='combobox']")
  var list = document.getElementById(wrap.dataset.combo + "-list")
  Array.prototype.forEach.call(list.querySelectorAll("[role='option']"), function (item) {
    item.classList.toggle("is-active", item === option)
  })
  if (option) input.setAttribute("aria-activedescendant", option.id)
  else input.removeAttribute("aria-activedescendant")
}

function openCombo(input) {
  var wrap = input.closest(".combo")
  closeCombos(wrap)
  var list = document.getElementById(wrap.dataset.combo + "-list")
  input.setAttribute("aria-expanded", "true")
  list.hidden = false
  fillComboList(wrap, input.value === selectedComboLabel(wrap) ? "" : input.value)
}

function moveCombo(wrap, delta) {
  var options = Array.prototype.slice.call(document.getElementById(wrap.dataset.combo + "-list").querySelectorAll("[role='option']"))
  if (!options.length) return
  var current = wrap.querySelector(".is-active")
  var index = options.indexOf(current)
  var next = options[Math.max(0, Math.min(options.length - 1, index + delta))]
  markComboActive(wrap, next)
  if (next && next.scrollIntoView) next.scrollIntoView({ block: "nearest" })
}

function commitCombo(wrap, value) {
  if (!value) return
  closeCombos()
  var update = {}
  update[wrap.dataset.combo] = value
  var page = readRoute().page
  if (page === "builder" && wrap.dataset.combo === "country") update.fleet = value
  go(page, update)
}

function onComboKey(event, input) {
  var wrap = input.closest(".combo")
  var list = document.getElementById(wrap.dataset.combo + "-list")
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault()
    if (list.hidden) openCombo(input)
    moveCombo(wrap, event.key === "ArrowDown" ? 1 : -1)
    return
  }
  if (event.key === "Enter") {
    event.preventDefault()
    var active = wrap.querySelector(".is-active")
    if (active) commitCombo(wrap, active.dataset.value)
    return
  }
  if (event.key === "Escape") {
    event.preventDefault()
    closeCombos()
  }
}
