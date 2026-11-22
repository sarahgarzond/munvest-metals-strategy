"use strict"

var TREND_YEARS = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035]

var INDUSTRY_TRENDS = [
  {
    id: "automotive",
    name: "Automotive",
    scenario: "EV production doubles by 2030",
    probability: 62,
    forms: [
      { id: "demand", name: "Automotive", series: [9000, 10200, 11600, 13200, 15000, 16800, 18600, 20400, 22000, 23600], opportunities: [["Cathode material", "China", 18000], ["Connectors", "Europe", 900], ["Sensors", "United States", 400]] }
    ]
  },
  {
    id: "oilgas",
    name: "Oil and Gas",
    scenario: "Brazil orders 200 km of duplex flowlines",
    probability: 38,
    forms: [
      { id: "demand", name: "Oil and Gas", series: [500, 580, 680, 800, 940, 1080, 1220, 1360, 1500, 1640], opportunities: [["Flowlines", "Brazil", 900], ["Manifolds", "Brazil", 280], ["Jumpers", "Norway", 140]] }
    ]
  },
  {
    id: "energy",
    name: "Energy and Environmental Technology",
    scenario: "Energy and environmental projects specify high alloys",
    probability: 41,
    forms: [
      { id: "demand", name: "Energy and Environmental Technology", series: [1400, 1600, 1840, 2120, 2440, 2780, 3140, 3500, 3860, 4200], opportunities: [["Digesters and tanks", "Europe", 1700], ["Electrolyser plant", "Europe", 1500], ["Seawater lines", "Europe", 520]] }
    ]
  },
  {
    id: "aerospace",
    name: "Aerospace",
    scenario: "Narrow-body backlog cleared in 5 years",
    probability: 47,
    forms: [
      { id: "demand", name: "Aerospace", series: [480, 560, 660, 780, 920, 1080, 1240, 1400, 1560, 1720], opportunities: [["Disks and shafts", "United States", 860], ["Nacelles and ducts", "France", 340], ["Fan discs", "United Kingdom", 160]] }
    ]
  },
  {
    id: "chemical",
    name: "Chemical Processing",
    scenario: "Chemical plants specify duplex and nickel equipment",
    probability: 34,
    forms: [
      { id: "demand", name: "Chemical Processing", series: [900, 1040, 1200, 1380, 1580, 1800, 2020, 2240, 2460, 2680], opportunities: [["Reactors", "Europe", 1400], ["Heat exchangers", "United States", 800], ["Piping", "Europe", 480]] }
    ]
  },
  {
    id: "electronics",
    name: "Electronics and Electrical Engineering",
    scenario: "Electronics and electrical build-out",
    probability: 44,
    forms: [
      { id: "demand", name: "Electronics and Electrical Engineering", series: [4200, 4700, 5300, 6000, 6800, 7600, 8400, 9200, 9900, 10600], opportunities: [["Cable and bus", "India", 6000], ["Converter hardware", "Europe", 2800], ["Capacitors and targets", "United States", 900]] }
    ]
  },
  {
    id: "medical",
    name: "Medical Technology",
    scenario: "Implant demand rises with aging populations",
    probability: 18,
    forms: [
      { id: "demand", name: "Medical Technology", series: [60, 72, 86, 102, 120, 140, 162, 184, 206, 228], opportunities: [["Implants", "United States", 160], ["Instruments", "Europe", 70], ["Devices", "United States", 42]] }
    ]
  }
]

function trendIndustry(id) {
  return findById(INDUSTRY_TRENDS, id)
}

var TREND_GROUPS = [
  { name: "Industries", ids: ["automotive", "oilgas", "energy", "aerospace", "chemical", "electronics", "medical"] }
]

var TREND_COLORS = ["#5c3317", "#d94f30", "#e39b12", "#2f9e44", "#148f8f", "#5b3f8c"]

function normalizeTrends(params) {
  var changed = false
  var industry = trendIndustry(params.get("industry"))
  if (!industry) {
    params.set("industry", INDUSTRY_TRENDS[0].id)
    industry = INDUSTRY_TRENDS[0]
    changed = true
  }
  if (params.has("form")) {
    params.delete("form")
    changed = true
  }
  var rawLevel = params.get("level")
  var level = Number(rawLevel)
  if (rawLevel == null || rawLevel === "" || !Number.isInteger(level) || level < 0 || level > 100) {
    params.set("level", String(industry.probability))
    changed = true
  }
  return changed
}

function trendModel(params) {
  var industry = trendIndustry(params.get("industry")) || INDUSTRY_TRENDS[0]
  return { industry: industry, form: industry.forms[0] }
}

function trendLevel(params, industry) {
  var raw = params.get("level")
  var level = Number(raw)
  if (raw == null || raw === "" || !Number.isInteger(level) || level < 0 || level > 100) return industry.probability
  return level
}

function trendScale(industry, level) {
  return industry.probability ? level / industry.probability : 1
}

function trendPlot(maxValue) {
  return { width: 640, height: 250, pad: { l: 78, r: 14, t: 12, b: 24 }, top: (maxValue || 1) * 1.08 }
}

function trendX(plot, index) {
  var plotW = plot.width - plot.pad.l - plot.pad.r
  return plot.pad.l + (index / (TREND_YEARS.length - 1)) * plotW
}

function trendY(plot, value) {
  var plotH = plot.height - plot.pad.t - plot.pad.b
  return plot.pad.t + (1 - value / plot.top) * plotH
}

function trendGuides(plot) {
  var html = ""
  var right = plot.width - plot.pad.r
  var step = 0
  for (step = 0; step < 4; step += 1) {
    var value = plot.top * step / 3
    var yy = trendY(plot, value)
    html += '<line class="tick" x1="' + plot.pad.l + '" y1="' + yy.toFixed(1) + '" x2="' + right + '" y2="' + yy.toFixed(1) + '"></line>'
    html += '<text x="' + (plot.pad.l - 6) + '" y="' + (yy + 3).toFixed(1) + '" text-anchor="end">' + num(Math.round(value)) + "</text>"
  }
  TREND_YEARS.forEach(function (year, index) {
    if (index % 3 !== 0 && index !== TREND_YEARS.length - 1) return
    html += '<text x="' + trendX(plot, index).toFixed(1) + '" y="' + (plot.height - 6) + '" text-anchor="middle">' + year + "</text>"
  })
  return html
}

function sourceChart(model, level) {
  var scale = trendScale(model.industry, level)
  var weight = 0
  model.form.opportunities.forEach(function (item) { weight += item[2] })
  if (!weight) weight = 1
  var cum = TREND_YEARS.map(function () { return 0 })
  var bands = model.form.opportunities.map(function (item) {
    var bottom = cum.slice()
    model.form.series.forEach(function (value, index) { cum[index] += value * scale * item[2] / weight })
    return { bottom: bottom, top: cum.slice(), name: item[0] }
  })
  var plot = trendPlot(Math.max.apply(null, cum))
  var shapes = bands.map(function (band, index) {
    var pts = []
    var i = 0
    for (i = 0; i < band.top.length; i += 1) pts.push(trendX(plot, i).toFixed(1) + "," + trendY(plot, band.top[i]).toFixed(1))
    for (i = band.bottom.length - 1; i >= 0; i -= 1) pts.push(trendX(plot, i).toFixed(1) + "," + trendY(plot, band.bottom[i]).toFixed(1))
    return '<polygon points="' + pts.join(" ") + '" fill="' + TREND_COLORS[index % TREND_COLORS.length] + '"></polygon>'
  }).join("")
  var legend = bands.map(function (band, index) {
    return '<span style="background:' + TREND_COLORS[index % TREND_COLORS.length] + '">' + esc(band.name) + "</span>"
  }).join("")
  return '<svg class="chart" viewBox="0 0 ' + plot.width + " " + plot.height + '" role="img" aria-label="Sources of opportunity for ' + esc(model.form.name) + '">' +
    shapes + trendGuides(plot) + '</svg><div class="er-key">' + legend + "</div>"
}

function growthChart(model, level) {
  var scale = trendScale(model.industry, level)
  var scenario = model.form.series.map(function (value) { return value * scale })
  var start = model.form.series[0]
  var baseline = model.form.series.map(function (_, index) { return start * Math.pow(1.012, index) })
  var max = 0
  scenario.concat(baseline).forEach(function (value) { if (value > max) max = value })
  var plot = trendPlot(max)
  function line(values) {
    return values.map(function (value, index) { return trendX(plot, index).toFixed(1) + "," + trendY(plot, value).toFixed(1) }).join(" ")
  }
  return '<svg class="chart" viewBox="0 0 ' + plot.width + " " + plot.height + '" role="img" aria-label="Baseline and current scenario for ' + esc(model.form.name) + '">' +
    trendGuides(plot) + '<polyline points="' + line(baseline) + '" fill="none" stroke="#161616" stroke-width="2.25"></polyline><polyline points="' +
    line(scenario) + '" fill="none" stroke="#00aae6" stroke-width="2.5"></polyline></svg><div class="er-linekey"><span>Baseline</span><span>Current scenario</span></div>'
}

function probHtml(model, level) {
  return "<strong>" + level + "%</strong><p>" + esc(model.industry.scenario) + '</p><p class="er-quiet">Modeled</p>'
}

function trendSlider(industry, activeId, level) {
  var value = industry.id === activeId ? level : industry.probability
  return '<label class="er-slider' + (industry.id === activeId ? " is-on" : "") + '"><span>' + esc(industry.name) +
    '</span><input id="trend-' + esc(industry.id) + '" type="range" min="0" max="100" value="' + value + '" data-trend="' +
    esc(industry.id) + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + value + '"><span class="er-ends"><span>Lower</span><span>Higher</span></span></label>'
}

function paintTrends(params) {
  var model = trendModel(params)
  var level = trendLevel(params, model.industry)
  var sources = document.getElementById("er-sources")
  var growth = document.getElementById("er-growth")
  var prob = document.getElementById("er-prob")
  if (!sources || !growth || !prob) return false
  sources.innerHTML = sourceChart(model, level)
  growth.innerHTML = growthChart(model, level)
  prob.innerHTML = probHtml(model, level)
  Array.prototype.forEach.call(document.querySelectorAll(".er-slider"), function (row) {
    var input = row.querySelector("[data-trend]")
    row.classList.toggle("is-on", !!(input && input.dataset.trend === model.industry.id))
  })
  return true
}

function viewTrends(route) {
  var model = trendModel(route.params)
  var level = trendLevel(route.params, model.industry)
  var groups = TREND_GROUPS.map(function (group) {
    var sliders = group.ids.map(function (id) { return trendSlider(trendIndustry(id), model.industry.id, level) }).join("")
    return '<section class="er-group"><header class="er-bar"><h2>' + esc(group.name) + '</h2></header><div class="er-sliders">' + sliders + "</div></section>"
  }).join("")
  return '<h1 class="visually-hidden">Trends by industry</h1><div class="trends"><div class="er-top"><section class="er-panel"><header class="er-bar"><h2>Sources of opportunity</h2></header><div id="er-sources">' + sourceChart(model, level) +
    '</div></section><section class="er-panel"><header class="er-bar"><h2>Demand growth</h2></header><div id="er-growth">' + growthChart(model, level) +
    '</div></section><section class="er-panel er-outcome"><header class="er-bar"><h2>Probability</h2></header><div id="er-prob">' + probHtml(model, level) +
    "</div></section></div><div class=\"er-columns\">" + groups + "</div></div>"
}
