"use strict"

/* Scenario briefs: the report as a readable page with charts. Model numbers are recalculated from the same inputs as
   the calculator (evidence baseline); text, 2035 numbers, metal scores and stress tests come from report-data.js. */

var RPT_COLORS = { open: "#4d6c7d", stag: "#d77d31", super: "#2b6cb0", fort: "#8f9d35", ren: "#9b6fb0" }

function rptSrc(keys) {
  return (keys || []).map(function (k, i) {
    var s = RPT_SOURCES[k]
    return s ? '<a class="trk-src" href="' + esc(s.url) + '" target="_blank" rel="noopener" title="' + esc(s.label) + '">' + esc(rptSrcNo(k)) + "</a>" : ""
  }).join(" ")
}

var RPT_SRC_ORDER = []
function rptSrcNo(key) {
  var i = RPT_SRC_ORDER.indexOf(key)
  if (i < 0) { RPT_SRC_ORDER.push(key); i = RPT_SRC_ORDER.length - 1 }
  return "[" + (i + 1) + "]"
}

/* ---------- small chart kit (SVG / HTML, no libraries) ---------- */

function rptDonut(slices, size, center) {
  var total = slices.reduce(function (s, x) { return s + x.value }, 0) || 1
  var r = size / 2, ir = r * 0.62, a0 = -Math.PI / 2
  var paths = slices.map(function (sl) {
    var a1 = a0 + sl.value / total * Math.PI * 2
    var large = a1 - a0 > Math.PI ? 1 : 0
    var p = function (rad, a) { return [(r + rad * Math.cos(a)).toFixed(2), (r + rad * Math.sin(a)).toFixed(2)] }
    var o0 = p(r, a0), o1 = p(r, a1), i1 = p(ir, a1), i0 = p(ir, a0)
    var d = "M" + o0 + "A" + r + "," + r + " 0 " + large + " 1 " + o1 + "L" + i1 + "A" + ir + "," + ir + " 0 " + large + " 0 " + i0 + "Z"
    var mid = (a0 + a1) / 2; var lp = p((r + ir) / 2, mid)
    a0 = a1
    return '<path d="' + d + '" fill="' + sl.color + '"><title>' + esc(sl.label + ": " + sl.text) + "</title></path>" +
      (sl.value / total > 0.08 ? '<text x="' + lp[0] + '" y="' + lp[1] + '" class="rpt-donut-lbl">' + esc(sl.text) + "</text>" : "")
  }).join("")
  return '<svg class="rpt-donut" viewBox="0 0 ' + size + " " + size + '" width="' + size + '" height="' + size + '">' + paths +
    (center ? '<text x="' + r + '" y="' + (r - 4) + '" class="rpt-donut-c">' + esc(center[0]) + '</text><text x="' + r + '" y="' + (r + 14) + '" class="rpt-donut-s">' + esc(center[1]) + "</text>" : "") + "</svg>"
}

function rptLegend(items) {
  return '<ul class="rpt-legend">' + items.map(function (i) { return '<li><i style="background:' + i.color + '"></i>' + esc(i.label) + "</li>" }).join("") + "</ul>"
}

function rptHBars(rows, scaleMax, fmt) {
  var max = scaleMax || Math.max.apply(null, rows.map(function (r) { return Math.abs(r.value) }).concat([1e-9]))
  return '<div class="trk-bars">' + rows.map(function (r) {
    var w = Math.min(Math.abs(r.value) / max, 1) * 50
    return '<div class="trk-bar-row"><span class="trk-bar-name">' + esc(r.name) + '</span><span class="trk-bar-track"><span class="trk-bar ' + (r.value >= 0 ? "up" : "down") +
      '" style="' + (r.value >= 0 ? "left:50%" : "right:50%") + ";width:" + w.toFixed(1) + "%" + (r.color ? ";background:" + r.color : "") + '"></span></span><b>' + esc(fmt ? fmt(r.value) : scnSigned(r.value)) + "</b></div>"
  }).join("") + "</div>"
}

function rptHeat(rowsLabel, cols, rows) {
  return '<div class="scn-table-wrap"><table class="rpt-heat"><thead><tr><th>' + esc(rowsLabel) + "</th>" + cols.map(function (c) { return "<th>" + esc(c) + "</th>" }).join("") + "</tr></thead><tbody>" +
    rows.map(function (r) {
      return "<tr><th>" + esc(r.name) + "</th>" + r.values.map(function (v) {
        return '<td style="background:' + scnShade(v) + ";color:" + scnInk(v) + '">' + scnSigned(v) + "</td>"
      }).join("") + "</tr>"
    }).join("") + "</tbody></table></div>"
}

function rptDumbbell(rows) {
  var W = 640, rowH = 30, left = 110, lo = -0.5, hi = 2, H = rows.length * rowH + 34
  var X = function (v) { return left + (v - lo) / (hi - lo) * (W - left - 30) }
  var grid = [-0.5, 0, 0.5, 1, 1.5, 2].map(function (t) {
    return '<line x1="' + X(t) + '" x2="' + X(t) + '" y1="18" y2="' + (H - 6) + '" class="rpt-grid' + (t === 0 ? " zero" : "") + '"></line><text x="' + X(t) + '" y="12" class="rpt-axis">' + (t > 0 ? "+" : "") + t + "</text>"
  }).join("")
  var marks = rows.map(function (r, i) {
    var y = 34 + i * rowH
    return '<text x="0" y="' + (y + 4) + '" class="rpt-row-lbl">' + esc(r.metal) + "</text>" +
      '<line x1="' + X(r.index) + '" x2="' + X(r.hp) + '" y1="' + y + '" y2="' + y + '" class="rpt-db-line"></line>' +
      '<circle cx="' + X(r.index) + '" cy="' + y + '" r="6" class="rpt-db-whole"><title>Whole market ' + scnSigned(r.index) + "</title></circle>" +
      '<circle cx="' + X(r.hp) + '" cy="' + y + '" r="6" class="rpt-db-hp"><title>High-performance slice ' + scnSigned(r.hp) + "</title></circle>" +
      '<text x="' + (X(r.hp) + 10) + '" y="' + (y + 4) + '" class="rpt-db-val">' + scnSigned(r.hp) + "</text>"
  }).join("")
  return '<svg class="rpt-svg" viewBox="0 0 ' + W + " " + H + '">' + grid + marks + "</svg>"
}

function rptStack(rows) {
  return '<div class="rpt-stack">' + rows.map(function (r) {
    return '<div class="rpt-stack-row"><span>' + esc(r.event) + '</span><span class="rpt-stack-bar">' + r.values.map(function (v, i) {
      var id = SCN_VISIONS[i].id
      return '<span style="width:' + v + "%;background:" + RPT_COLORS[id] + '" title="' + esc(SCN_VISIONS[i].name + " " + v.toFixed(1) + "%") + '">' + (v >= 9 ? v.toFixed(0) : "") + "</span>"
    }).join("") + "</span></div>"
  }).join("") + "</div>"
}

function rptColumns(values, labels, unit, highlight) {
  var max = Math.max.apply(null, values.map(Math.abs).concat([1e-9]))
  var neg = values.some(function (v) { return v < 0 })
  return '<div class="rpt-cols' + (neg ? " neg" : "") + '">' + values.map(function (v, i) {
    var h = Math.abs(v) / max * (neg ? 45 : 90)
    return '<div class="rpt-col' + (i === highlight ? " hi" : "") + '"><span class="rpt-col-val">' + (v > 0 && neg ? "+" : "") + v + esc(unit === "%" ? "%" : "") + '</span><span class="rpt-col-bar ' + (v < 0 ? "down" : "up") + '" style="height:' + h.toFixed(1) + '%"></span><span class="rpt-col-lbl">' + esc(labels[i]) + "</span></div>"
  }).join("") + "</div>"
}

/* ---------- page ---------- */

function rptBaseModel() { return scnModel(new URLSearchParams()) }

function rptIndustryRows(model, i) {
  return Object.keys(SCN_INDUSTRIES).map(function (k) { return { name: SCN_INDUSTRIES[k].name, value: model.industries[k].per[i] } })
    .sort(function (a, b) { return b.value - a.value })
}

function rptVisionChapter(model, v, i, n) {
  var info = RPT_VISIONS[v.id]
  var p = model.visions[v.id].p
  var metals = RPT_METALS.map(function (m) { return { name: m.metal, value: m.per[i] } }).sort(function (a, b) { return b.value - a.value })
  var nums = RPT_NUMBERS.map(function (r) {
    var v = r.values[i]
    var shown = v === 0 && r.unit === "%" ? "about flat" : (r.approx ? "about " : "") + (v < 0 ? "−" + Math.abs(v) : v) + (r.unit === "%" ? "%" : r.unit.indexOf("%") === 0 ? r.unit : " " + r.unit)
    return '<div class="rpt-num"><b>' + esc(shown) + '</b><span>' + esc(r.name) + '</span><small>Today: ' + esc(r.today) + " " + rptSrc(r.src) + "</small></div>"
  }).join("")
  var play = RPT_PLAYBOOK.find(function (x) { return x.vision === v.id })
  return '<section class="rpt-chapter" id="rpt-' + v.id + '" style="--vc:' + RPT_COLORS[v.id] + '">' +
    '<header class="rpt-ch-head"><span class="rpt-ch-no">' + (n + 4) + '</span><div><h2>' + esc(v.name) + '</h2><p class="rpt-role">Vision ' + (n + 1) + " of 5 by likelihood · " + esc(info.role) + " · likelihood " + scnPct(p) + '</p></div>' +
    '<span class="rpt-ch-bar"><span style="width:' + (p * 100 / 0.3).toFixed(1) + '%"></span></span></header>' +
    '<blockquote>“' + esc(info.quote) + '”</blockquote><p class="rpt-cond">' + esc(info.conditions) + "</p>" +
    '<ol class="rpt-timeline">' + info.story.map(function (s) { return "<li><b>" + esc(s[0]) + "</b><p>" + esc(s[1]) + "</p></li>" }).join("") + "</ol>" +
    '<div class="rpt-two"><figure><figcaption>Industry demand in this vision (−2 to +2)</figcaption>' + rptHBars(rptIndustryRows(model, i), 2) + "</figure>" +
    '<figure><figcaption>Whole-market metal demand in this vision (report section 7)</figcaption>' + rptHBars(metals, 2) + '<p class="trk-note">' + esc(info.metalNote) + "</p></figure></div>" +
    '<h3>2035 in numbers</h3><div class="rpt-nums">' + nums + "</div>" +
    '<div class="rpt-two"><div class="rpt-card"><h3>What the company should do</h3><ul>' + info.act.map(function (a) { return "<li>" + esc(a) + "</li>" }).join("") + "</ul></div>" +
    '<div class="rpt-card"><h3>Watch for</h3><ul>' + info.watch.map(function (a) { return "<li>" + esc(a) + "</li>" }).join("") + "</ul>" +
    (play ? '<p class="trk-note"><b>Playbook:</b> if “' + esc(play.signal) + "” → " + esc(play.move) + "</p>" : "") + "</div></div>" +
    '<p class="scn-link"><a href="#/trends?' + rptPreset(v.id) + '">Open this vision in the calculator →</a></p></section>'
}

/* Calculator preset: puts each driver of the vision at 85% or 15% (illustrative, not an evidence value). */
var RPT_PRESETS = { open: { a: 15, b: 15 }, stag: { a: 15, b: 85 }, super: { a: 85, b: 15, c: 85 }, fort: { a: 85, b: 85, c: 85 }, ren: { a: 85, c: 15, d: 85 } }
function rptPreset(id) {
  var q = new URLSearchParams()
  Object.keys(RPT_PRESETS[id]).forEach(function (k) { q.set(k, RPT_PRESETS[id][k]) })
  q.set("scn-preset", id)
  return q.toString()
}

function viewReport(route) {
  RPT_SRC_ORDER = []
  var model = rptBaseModel()
  var visions = SCN_VISIONS.slice().sort(function (a, b) { return model.visions[b.id].p - model.visions[a.id].p })
  var slices = visions.map(function (v) { return { label: v.name, value: model.visions[v.id].p, text: scnPct(model.visions[v.id].p), color: RPT_COLORS[v.id] } })
  var weak = model.visions.open.p + model.visions.stag.p
  var drivers = SCN_DRIVERS.map(function (d) {
    var inds = RPT_INDICATORS.filter(function (x) { return x.d === d.key })
    return '<div class="rpt-driver"><h4>' + esc(d.name) + ' <b>' + model.drivers[d.key] + '%</b></h4><div class="rpt-ind-grid">' + inds.map(function (x) {
      return '<div class="rpt-ind" style="background:' + scnShade(x.score / 1.6) + ";color:" + scnInk(x.score / 1.6) + '" tabindex="0"><b>' + x.id + " " + (x.score > 0 ? "+" : x.score < 0 ? "−" : "") + Math.abs(x.score) +
        "</b><span>" + esc(x.name) + '</span><div class="rpt-ind-tip">' + esc(x.data) + " " + rptSrc(x.src) + "</div></div>"
    }).join("") + '</div><p class="trk-note">Probability = 50% + average score ÷ 4 = 50% ' + (model.drivers[d.key] >= 50 ? "+ " : "− ") + Math.abs(model.drivers[d.key] - 50) + " pts</p></div>"
  }).join("")
  var heat = Object.keys(SCN_INDUSTRIES).map(function (k) { return { name: SCN_INDUSTRIES[k].name, values: model.industries[k].per, index: model.industries[k].index } })
    .sort(function (a, b) { return b.index - a.index })
  var toc = [["rpt-summary", "1 Summary"], ["rpt-evidence", "2 Evidence"], ["rpt-likely", "3 Likelihoods"]].concat(visions.map(function (v, i) { return ["rpt-" + v.id, (4 + i) + " " + v.short] }))
    .concat([["rpt-compare", "9 Compare"], ["rpt-stress", "10 Stress tests"], ["rpt-advice", "11 Advice"], ["rpt-sources", "Sources"]])
  var body = '<div class="rpt">' + pageHead("Scenario briefs 2035") +
    '<p class="trk-intro">The five 2035 visions for Germany and the EU, explained one by one with the evidence, the model results and what the board should do. Model figures are recalculated from the evidence baseline; text and 2035 numbers come from the Münvest scenario report (15 Nov 2026).</p>' +
    '<nav class="rpt-toc" aria-label="Report sections">' + toc.map(function (t) { return '<a href="#/report?go=' + t[0] + '" data-rpt-go="' + t[0] + '">' + esc(t[1]) + "</a>" }).join("") + "</nav>" +
    '<section id="rpt-summary" class="rpt-sec"><h2>1 · The answer in one page</h2><div class="rpt-kpis">' +
    '<div class="rpt-kpi"><b>' + scnPct(model.visions[visions[0].id].p) + '</b><span>' + esc(visions[0].name) + ' is the most likely vision (planning case)</span></div>' +
    '<div class="rpt-kpi"><b>' + scnPct(weak) + '</b><span>of the probability sits in the two weak-industry visions</span></div>' +
    '<div class="rpt-kpi"><b>' + model.drivers.a + '%</b><span>European industry strong: a pure coin flip, so the advice must work either way</span></div>' +
    '<div class="rpt-kpi"><b>8 of 8</b><span>metals: the high-performance slice beats the whole market</span></div></div>' +
    '<div class="rpt-two"><figure><figcaption>Industries that grow in almost every vision (index, −2 to +2)</figcaption>' +
    rptHBars(heat.map(function (h) { return { name: h.name, value: h.index } }), 2) + "</figure>" +
    '<div class="rpt-card"><h3>Five pieces of advice to the board</h3><ol class="rpt-advice">' + RPT_ADVICE.map(function (a) { return "<li><b>" + esc(a[0]) + ":</b> " + esc(a[1]) + "<small>" + esc(a[2]) + "</small></li>" }).join("") + "</ol></div></div></section>" +
    '<section id="rpt-evidence" class="rpt-sec"><h2>2 · 24 facts behind the model</h2><p>Each fact is scored from −2 to +2 by a rule written before scoring. Hover or tab onto a tile to see the data and source. Blue tiles point to the first state of a driver, orange to the second.</p><div class="rpt-drivers">' + drivers + "</div></section>" +
    '<section id="rpt-likely" class="rpt-sec"><h2>3 · How likely each vision is</h2><div class="rpt-two"><figure class="rpt-center">' + rptDonut(slices, 230, [scnPct(weak), "weak industry"]) + rptLegend(slices) + "</figure>" +
    '<figure><figcaption>Where the visions sit</figcaption><div class="rpt-matrix"><span class="rpt-mx-y">← open · Stance on China · closed →</span>' +
    '<div class="rpt-mx" style="--c:' + RPT_COLORS.stag + '"><b>Armoured Stagnation</b>' + scnPct(model.visions.stag.p) + '</div><div class="rpt-mx" style="--c:' + RPT_COLORS.fort + '"><b>Fortress Europe</b>' + scnPct(model.visions.fort.p) + "</div>" +
    '<div class="rpt-mx" style="--c:' + RPT_COLORS.open + '"><b>Open Door Europe</b>' + scnPct(model.visions.open.p) + '</div><div class="rpt-mx" style="--c:' + RPT_COLORS.super + '"><b>Electric Super-cycle</b>' + scnPct(model.visions.super.p) + "</div>" +
    '<span class="rpt-mx-x">weak ← European industrial strength → strong</span></div><p class="trk-note">Engineering Renaissance (' + scnPct(model.visions.ren.p) + ") needs strong industry, loose supply and fast technology.</p></figure></div></section>" +
    visions.map(function (v, n) { return rptVisionChapter(model, v, SCN_VISIONS.indexOf(v), n) }).join("") +
    '<section id="rpt-compare" class="rpt-sec"><h2>9 · The visions side by side</h2><figure><figcaption>Industry demand by vision (−2 to +2), sorted by likelihood-weighted index</figcaption>' +
    rptHeat("Industry", SCN_VISIONS.map(function (v) { return v.short + " " + scnPct(model.visions[v.id].p) }), heat) + "</figure>" +
    '<figure><figcaption>Metal demand: whole market (grey) vs high-performance slice (blue), likelihood-weighted index — report section 7</figcaption>' + rptDumbbell(RPT_METALS) +
    '<p class="trk-note">' + RPT_METALS.map(function (m) { return esc(m.metal) + ": " + esc(m.use) + " " + rptSrc(m.src) }).join(" · ") + "</p></figure>" +
    '<div class="rpt-two">' + RPT_NUMBERS.map(function (r) {
      return '<figure><figcaption>' + esc(r.name) + " in 2035 (" + (r.approx ? "approximate" : "") + ")</figcaption>" + rptColumns(r.values, SCN_VISIONS.map(function (v) { return v.short }), r.unit, 0) +
        '<p class="trk-note">Today: ' + esc(r.today) + " " + rptSrc(r.src) + "</p></figure>"
    }).join("") + "</div></section>" +
    '<section id="rpt-stress" class="rpt-sec"><h2>10 · What one piece of news does</h2><p>Each row changes one indicator to the score the next big piece of news would give it. No single event moves any vision by more than 2.5 points.</p>' +
    rptStack(RPT_STRESS) + rptLegend(SCN_VISIONS.map(function (v) { return { label: v.name, color: RPT_COLORS[v.id] } })) + "</section>" +
    '<section id="rpt-advice" class="rpt-sec"><h2>11 · Playbook: if this happens, the company does that</h2><div class="scn-table-wrap"><table class="ev-table rpt-play"><thead><tr><th>Signal</th><th>Vision gaining</th><th>Company move</th></tr></thead><tbody>' +
    RPT_PLAYBOOK.map(function (p) { var v = SCN_VISIONS.find(function (x) { return x.id === p.vision }); return '<tr><td>' + esc(p.signal) + '</td><td><span class="rpt-chip" style="--c:' + RPT_COLORS[p.vision] + '">' + esc(v.name) + "</span></td><td>" + esc(p.move) + "</td></tr>" }).join("") +
    '</tbody></table></div><p class="scn-link"><a href="#/strategy">Strategy by product line →</a> · <a href="#/metal-scenarios">Calculator by metal →</a></p></section>' +
    '<section id="rpt-sources" class="rpt-sec"><h2>Sources</h2><ol class="rpt-sources">' + RPT_SRC_ORDER.map(function (k) { return '<li><a href="' + esc(RPT_SOURCES[k].url) + '" target="_blank" rel="noopener">' + esc(RPT_SOURCES[k].label) + "</a></li>" }).join("") +
    '</ol><p class="trk-note">Full source list and method: Münvest scenario report, sections 3–13.</p></section></div>'
  return body
}
