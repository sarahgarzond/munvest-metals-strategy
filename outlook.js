"use strict"

/* Scenario generator 2035 — one page:
   1 Recommendation and decision brief → 2 Your 2035 assumptions by industry (+ market conditions, tracker values)
   → 3 Market outlook by metal → 4 Evidence and calculation.
   A metal's outlook = Σ (share of the metal's use in an industry × that industry's 2035 outlook), per vision,
   weighted by vision likelihood. Shares and market conditions: outlook-data.js. */

var OL_IND_COLORS = { aero: "#2b6cb0", defence: "#5a4e8c", energy: "#8f9d35", ev: "#3f9b8f", auto: "#4d6c7d", steel: "#9a8f80", chem: "#d77d31", elec: "#6fa8dc", med: "#c0587e", og: "#7a5a3a", other: "#d9d4ca" }

function olIndName(k) {
  if (k === "other") return "Other uses"
  var d = SCN_INDUSTRY_DRIVERS.find(function (i) { return i.id === k })
  return d ? d.name : SCN_INDUSTRIES[k].name
}

function olTop(model) { return SCN_VISIONS.slice().sort(function (a, b) { return model.visions[b.id].p - model.visions[a.id].p })[0] }

function olBase(params) {
  var base = new URLSearchParams()
  if (params.get("scn-country")) base.set("scn-country", params.get("scn-country"))
  return scnModel(base)
}

function olFind(model, metal) { return model.metalOutlooks.find(function (p) { return p.metal === metal }) }

function olFocus(model, params) {
  var hit = olFind(model, params.get("focus") || params.get("metal"))
  return hit || model.metalOutlooks.slice().sort(function (a, b) { return b.index - a.index })[0]
}

/* Robustness of the call: in how many visions, and with what likelihood, demand grows. */
function olConfidence(p) {
  var n = p.per.filter(function (v) { return v > 0 }).length
  var grow = p.strategy.cls !== "hold"
  var share = grow ? p.chance : 1 - p.chance
  var level = share >= 0.8 ? "Robust" : share > 0.55 ? "Holds in most outcomes" : "Depends on the scenario"
  return { n: n, level: level, chance: p.chance }
}

/* Change in a metal's 2035 demand caused directly by the inputs: Σ share × industry change (%). */
function olDirectPct(m, params) {
  return SCN_INDUSTRY_DRIVERS.reduce(function (sum, industry) {
    var share = m.shares.s[industry.id] ? m.shares.s[industry.id][0] / 100 : 0
    if (!share) return sum
    return sum + share * scnIndustryAssumption(params, industry).level * 25
  }, 0)
}

function olInputCount(params) {
  var n = 0
  SCN_INDUSTRY_DRIVERS.forEach(function (i) { if (Number(params.get("scn-" + i.id + "-level"))) n += 1 })
  n += trkActiveEvents(params).length
  SCN_DRIVERS.forEach(function (d) { n += scnConditionDriver(params, d.key).changed })
  if (params.get("scn-preset")) n += 1
  return n
}

function olList(names) {
  if (names.length <= 1) return names.join("")
  return names.slice(0, -1).join(", ") + " and " + names[names.length - 1]
}

/* ---------- 1 Recommendation and decision brief ---------- */

/* A metal's end markets with share, 2035 outlook and contribution (share × outlook). */
function olMarkets(model, p) {
  return Object.keys(p.shares.s).filter(function (k) { return k !== "other" }).map(function (k) {
    return { k: k, share: p.shares.s[k][0], flag: p.shares.s[k][1], outlook: model.industries[k].index, contrib: p.shares.s[k][0] / 100 * model.industries[k].index }
  })
}

/* Industry name inside a sentence: lower case (keeps "EVs"), "&" instead of "and" so lists stay readable. */
function olInline(k) {
  var n = olIndName(k).replace(/ and /g, " & ")
  return /^[A-Z][a-z]/.test(n) ? n.charAt(0).toLowerCase() + n.slice(1) : n
}

function olMarketText(list) {
  return list.map(function (x) { return esc(olInline(x.k)) + " " + x.share + "%" }).join(", ")
}

var OL_WORDS = ["no", "one", "two", "three", "four", "five"]

/* The recommendation in three sentences: what to expand and why, what to reposition and where to, what to maintain and why. */
function olSentences(model, groups) {
  var out = []
  var exp = groups[0].items, rep = groups[1].items, keep = groups[2].items
  if (exp.length) {
    out.push("<b>Expand</b> " + olList(exp.map(function (p) {
      var up = olMarkets(model, p).filter(function (x) { return x.contrib > 0 }).sort(function (a, b) { return b.contrib - a.contrib }).slice(0, 2)
      return "<b>" + esc(p.metal) + "</b> (" + (up.length ? olMarketText(up) + " of use" : "broad demand") + ")"
    })) + ": add capacity and qualify grades for these markets. " + (exp.length > 1 ? (exp.length === 2 ? "Both grow" : "All grow") : "It grows") + " in at least " + OL_WORDS[Math.min.apply(null, exp.map(function (p) { return olConfidence(p).n }))] + " of the five visions.")
  }
  if (rep.length) {
    var from = {}, to = {}
    rep.forEach(function (p) {
      olMarkets(model, p).forEach(function (x) {
        if (x.outlook < 0) from[x.k] = (from[x.k] || 0) + x.share
        if (x.outlook >= 0.3) to[x.k] = (to[x.k] || 0) + x.share
      })
    })
    var pick = function (o) { return Object.keys(o).sort(function (a, b) { return o[b] - o[a] }).slice(0, 2).map(function (k) { return esc(olInline(k)) }) }
    out.push("<b>Reposition</b> " + olList(rep.map(function (p) { return "<b>" + esc(p.metal) + "</b>" })) + ": keep volume but move sales out of " + (pick(from).length ? olList(pick(from)) : "flat markets") + " into " + (pick(to).length ? olList(pick(to)) : "the markets that grow") + ".")
  }
  if (keep.length) {
    var weight = {}
    keep.forEach(function (p) { olMarkets(model, p).forEach(function (x) { if (x.outlook < 0.1) weight[x.k] = (weight[x.k] || 0) + x.share }) })
    var big = Object.keys(weight).sort(function (a, b) { return weight[b] - weight[a] }).slice(0, 2)
    var weak = model.visions.open.p + model.visions.stag.p
    out.push("<b>Maintain</b> " + olList(keep.map(function (p) { return esc(p.metal) })) + ": no new capacity" +
      (big.length ? ". Their largest markets, " + olList(big.map(function (k) { return esc(olInline(k)) })) + ", stay flat or shrink in the two weak-industry visions, which together hold " + scnPct(weak) : "") + ".")
  }
  return out.join(" ")
}

function olAnswer(model, base, params) {
  var groups = SCN_CALLS.map(function (c) {
    return { c: c, items: model.metalOutlooks.filter(function (p) { return p.strategy.label === c.label }).sort(function (a, b) { return b.index - a.index }) }
  })
  var top = olTop(model)
  var country = trkCountry(params)
  var n = olInputCount(params)
  var answer = olSentences(model, groups)
  var moves = model.metalOutlooks.map(function (p) {
    var b = olFind(base, p.metal)
    return { p: p, b: b, d: p.index - b.index }
  })
  var changed = moves.filter(function (x) { return x.p.strategy.label !== x.b.strategy.label })
  var ctx = "Most likely 2035 vision: <b>" + esc(top.name) + "</b> (" + scnPct(model.visions[top.id].p) + ")."
  var delta = n ? (changed.length ? " Your inputs change the call for " + changed.map(function (x) { return esc(x.p.metal) + " (" + esc(x.b.strategy.label) + " → <b>" + esc(x.p.strategy.label) + "</b>)" }).join(", ") + "."
    : " Your inputs do not change any call.") : ""
  var cols = groups.map(function (g) {
    return '<div class="ol-call ol-' + g.c.cls + '"><p class="ol-call-head"><span class="scn-badge scn-' + g.c.cls + '">' + esc(g.c.label) + "</span> " + g.items.length + " metal" + (g.items.length === 1 ? "" : "s") + "</p>" +
      '<p class="ol-call-text">' + esc(g.c.text) + "</p>" +
      (g.items.length ? '<ul class="ol-call-list">' + g.items.map(function (x) {
        var conf = olConfidence(x)
        return '<li><button type="button" class="ol-metal-link" data-action="trk-focus" data-metal="' + esc(x.metal) + '">' + esc(x.metal) + '</button><span>' + scnSigned(x.index) + "</span><small>grows in " + conf.n + " of 5 visions</small></li>"
      }).join("") + "</ul>" : '<p class="ol-none">None at these settings.</p>') + "</div>"
  }).join("")
  return '<div class="ol-answer"><p class="ev-kicker">Our recommendation · ' + esc(country ? TRK_GEO[country][0] : "Global") + " · " + (n ? n + " input" + (n === 1 ? "" : "s") + " changed" : "evidence baseline") + "</p>" +
    '<p class="ol-answer-text">' + answer + "</p>" +
    '<p class="ol-context">' + ctx + delta + "</p>" +
    '<div class="ol-calls">' + cols + "</div></div>"
}

function olDecision(model, base, params) {
  var p = olFocus(model, params)
  var b = olFind(base, p.metal)
  var m = p.shares
  var conf = olConfidence(p)
  var client = SCN_PRODUCTS.find(function (x) { return x.metal === p.metal })
  var markets = olMarkets(model, p).sort(function (a, b2) { return Math.abs(b2.contrib) - Math.abs(a.contrib) })
  var up = markets.filter(function (x) { return x.outlook >= 0.3 }).sort(function (a, b2) { return b2.share - a.share }).slice(0, 2)
  var down = markets.filter(function (x) { return x.outlook < 0 }).sort(function (a, b2) { return b2.share - a.share }).slice(0, 2)
  var decision = client ? client.action
    : p.strategy.cls === "grow" ? "Add capacity and qualify grades for " + olList(up.map(function (x) { return olIndName(x.k).toLowerCase() })) + "."
    : p.strategy.cls === "shift" ? "Keep volume; move sales from " + (down.length ? olList(down.map(function (x) { return olIndName(x.k).toLowerCase() })) : "flat markets") + " to " + (up.length ? olList(up.map(function (x) { return olIndName(x.k).toLowerCase() })) : "the markets that grow") + "."
    : "Serve existing customers; no new capacity. " + (down.length ? olList(down.map(function (x) { return olIndName(x.k) }) ) + " weigh on demand." : "")
  var maxC = Math.max.apply(null, markets.map(function (x) { return Math.abs(x.contrib) }).concat([0.3]))
  var why = '<div class="ol-why">' + markets.map(function (x) {
    var w = Math.abs(x.contrib) / maxC * 50
    return '<div class="ol-why-row"><span class="ol-why-name">' + esc(olIndName(x.k)) + ' <small>' + x.share + "% of use · outlook " + scnSigned(x.outlook) + "</small></span>" +
      '<span class="trk-bar-track"><span class="trk-bar ' + (x.contrib >= 0 ? "up" : "down") + '" style="' + (x.contrib >= 0 ? "left:50%" : "right:50%") + ";width:" + w.toFixed(1) + '%"></span></span><b>' + scnSigned(x.contrib) + "</b></div>"
  }).join("") + "</div>"
  var directIdx = markets.reduce(function (s, x) { return s + x.share / 100 * (model.industries[x.k].index - base.industries[x.k].index) }, 0)
  var totalD = p.index - b.index
  var split = Math.abs(totalD) >= 0.005 ? "<p>Change from your inputs: <b>" + scnSigned(totalD) + "</b> (" + scnSigned(directIdx) + " from its end markets, " + scnSigned(totalD - directIdx) + " from market conditions).</p>" : ""
  var strip = '<div class="trk-strip">' + SCN_VISIONS.map(function (v, i) {
    var val = p.per[i]
    return '<span style="width:' + (model.visions[v.id].p * 100).toFixed(2) + "%;background:" + scnShade(val) + ";color:" + scnInk(val) + '" title="' + esc(v.name + " · " + scnPct(model.visions[v.id].p) + " likely · " + scnSigned(val)) + '"><b>' + esc(v.short) + "</b>" + scnSigned(val) + "</span>"
  }).join("") + "</div>"
  var anchor = trkReady() ? TRACKER.outlook.totals.find(function (t) { return t.metal === p.metal && t.y2035 && t.y2025 }) : null
  var dPct = olDirectPct(p, params)
  var demand = anchor ? "<p>World demand " + trkFmt(anchor.y2025, anchor.unit) + " (2025) → <b>" + trkFmt(anchor.y2035, anchor.unit) + "</b> (2035), " + trkPctText((anchor.y2035 / anchor.y2025 - 1) * 100) + " · " + (anchor.source ? trkSourceLink(anchor.source) : esc(anchor.label)) + "</p>" +
    (Math.abs(dPct) >= 0.05 ? "<p>Your industry inputs: " + trkPctText(dPct) + " → <b>" + trkFmt(anchor.y2035 * (1 + dPct / 100), anchor.unit) + "</b> in 2035.</p>" : "")
    : "<p>No published 2035 demand total for " + esc(p.metal) + ".</p>" + (Math.abs(dPct) >= 0.05 ? "<p>Your industry inputs change its 2035 demand by <b>" + trkPctText(dPct) + "</b> against the baseline.</p>" : "")
  var sup = trkSupply(p.metal)
  var price = trkPrice(p.metal)
  var risks = []
  var producers = sup ? '<div class="ol-prod">' + sup.top3.map(function (r) {
    return '<div class="ol-prod-row"><span>' + esc(r.country) + '</span><span class="ol-prod-bar"><i style="width:' + Math.round(r.share * 100) + '%"></i></span><b>' + Math.round(r.share * 100) + "%</b></div>"
  }).join("") + "<p>Share of world " + esc(sup.measure.toLowerCase()) + " · " + (sup.source ? trkSourceLink(sup.source) : esc(sup.label)) + (sup.hhi > 2500 ? " · highly concentrated" : "") + "</p></div>" : ""
  if (price) risks.push(esc(price.indicator) + " " + price.v0.toLocaleString("en-US") + " → <b>" + price.v1.toLocaleString("en-US") + " " + esc(price.unit) + "</b> (" + esc(price.y0) + "–" + esc(price.y1) + ", " + trkPctText((price.v1 / price.v0 - 1) * 100) + ") · " + trkSources(price.sources))
  var sp = TRK_METAL_SIGNPOSTS[p.metal] ? RPT_INDICATORS.find(function (x) { return x.id === TRK_METAL_SIGNPOSTS[p.metal] }) : null
  var weakest = SCN_VISIONS[p.per.indexOf(Math.min.apply(null, p.per))]
  var chips = model.metalOutlooks.slice().sort(function (a, c) { return c.index - a.index }).map(function (x) {
    return '<button type="button" class="trk-chip trk-' + x.strategy.cls + (x.metal === p.metal ? " on" : "") + '" data-action="trk-focus" data-metal="' + esc(x.metal) + '" aria-pressed="' + (x.metal === p.metal) + '">' + esc(x.metal) + "</button>"
  }).join("")
  return '<section class="trk-decision ol-decision" id="trk-decision" aria-labelledby="ol-dec-h"><div class="trk-chips" role="group" aria-label="Choose a metal">' + chips + "</div>" +
    '<div class="trk-dec-head"><span class="scn-badge scn-' + p.strategy.cls + '">' + esc(p.strategy.label) + '</span><h3 id="ol-dec-h">' + esc(p.metal) + " <small>" + esc(m.use) + "</small></h3>" +
    '<span class="trk-dec-ix">outlook score <b>' + scnSigned(p.index) + "</b>" + (Math.abs(p.index - b.index) >= 0.005 ? " (baseline " + scnSigned(b.index) + ")" : "") + "</span></div>" +
    '<p class="ol-decision-text"><b>Decision:</b> ' + esc(decision) + (client ? ' <small>Client product line: ' + esc(client.name) + "</small>" : "") + "</p>" +
    '<div class="ol-grid">' +
    '<div class="ol-box"><h4>Why: its end markets in 2035</h4>' + why + split + "</div>" +
    '<div class="ol-box"><h4>Robustness: ' + esc(conf.level.toLowerCase()) + "</h4><p>Demand grows in <b>" + conf.n + " of 5</b> visions, together <b>" + scnPct(conf.chance) + "</b> likely. Weakest case: " + esc(weakest.name) + " (" + scnSigned(Math.min.apply(null, p.per)) + ").</p>" + strip +
    "</div>" +
    '<div class="ol-box"><h4>Demand anchor</h4>' + demand + "</div>" +
    '<div class="ol-box"><h4>Supply risk and signpost</h4>' + producers + (risks.length ? "<ul>" + risks.map(function (r) { return "<li>" + r + "</li>" }).join("") + "</ul>" : "") + (!sup && !risks.length ? "<p>No supply or price data in the tracker.</p>" : "") +
    (sp ? '<p><b>Watch:</b> ' + esc(sp.name) + " — " + esc(sp.data) + " " + rptSrc(sp.src) + "</p>" : "") + "</div></div>" + olCompanyBox(model, p, params) + "</section>"
}

function olResults(model, params) {
  var base = olBase(params)
  return olAnswer(model, base, params) + olDecision(model, base, params)
}

/* ---------- Companies to look at ---------- */

/* Producers and buyers for a metal. Rows from the tracker carry the company's own document as source;
   directory rows are flagged as not yet sourced. Sourced rows first, then the fastest-growing markets. */
function olCompanies(model, metal, country) {
  var out = [], seen = {}
  var apps = trkReady() ? TRACKER.applications.filter(function (a) { return a.material === metal || (metal === "Chromium" && a.material === "Specialty stainless") }) : []
  apps.forEach(function (a) {
    var name = a.source.split("|")[0].trim()
    var producer = Object.prototype.hasOwnProperty.call(OL_PRODUCERS, name)
    var user = Object.prototype.hasOwnProperty.call(OL_USERS, name)
    if (!producer && !user) return
    if (seen[name]) { if (seen[name].uses.length < 2 && seen[name].uses.indexOf(a.use) < 0) seen[name].uses.push(a.use); return }
    var ind = SCN_INDUSTRIES[a.key] ? a.key : ""
    seen[name] = { name: name, role: producer ? "Producer" : "Buyer", cc: producer ? OL_PRODUCERS[name] : OL_USERS[name], ind: ind, uses: [a.use], source: a.source, sourced: true }
    out.push(seen[name])
  })
  OL_BUYERS.forEach(function (b) {
    if (b[3].indexOf(metal) < 0 || seen[b[0]]) return
    seen[b[0]] = { name: b[0], role: "Buyer", cc: b[1], ind: b[2], uses: [b[4]], source: "Team product directory", sourced: false }
    out.push(seen[b[0]])
  })
  var home = country ? Object.keys(OL_ISO3).find(function (k) { return OL_ISO3[k] === country }) : ""
  out.forEach(function (r) {
    r.local = !!home && r.cc === home
    r.outlook = r.ind && model.industries[r.ind] ? model.industries[r.ind].index : -9
  })
  return out.sort(function (a, b) {
    return (b.local - a.local) || (b.sourced - a.sourced) || (b.outlook - a.outlook) || ((a.role === "Buyer") === (b.role === "Buyer") ? 0 : a.role === "Buyer" ? -1 : 1)
  })
}

function olShort(text) {
  var t = String(text || "").split(/[:;]/)[0].trim()
  return t.length > 70 ? t.slice(0, 68).replace(/\s+\S*$/, "") + "…" : t
}

function olCompanyBox(model, p, params) {
  var country = trkCountry(params)
  var list = olCompanies(model, p.metal, country)
  if (!list.length) return '<div class="ol-box ol-companies"><h4>Companies to look at</h4><p>No named producers or buyers for ' + esc(p.metal) + " in the tracker or the product directory yet.</p></div>"
  var row = function (c) {
    return "<tr" + (c.local ? ' class="is-on"' : "") + "><td><b>" + esc(c.name) + "</b></td><td>" + esc(c.role) + "</td><td>" + (c.ind ? esc(olIndName(c.ind)) : "–") + "</td><td>" + esc(OL_ISO2[c.cc] || "–") + "</td><td>" + esc(olShort(c.uses[0])) + "</td><td>" +
      (c.sourced ? esc(c.source) : '<span class="ol-unsourced">' + esc(c.source) + ", not yet sourced</span>") + "</td></tr>"
  }
  var head = '<thead><tr><th>Company</th><th>Role</th><th>Market</th><th>Country</th><th>What for</th><th>Source</th></tr></thead>'
  var first = list.slice(0, 6), rest = list.slice(6)
  return '<div class="ol-box ol-companies"><h4>Companies to look at</h4>' +
    '<p>Companies with a cited document first, then those in the fastest-growing markets' + (country ? "; companies in " + esc(TRK_GEO[country][0]) + " are highlighted" : "") + ". A shortlist to research, not an investment rating.</p>" +
    '<div class="scn-table-wrap"><table class="ev-table">' + head + "<tbody>" + first.map(row).join("") + "</tbody></table></div>" +
    (rest.length ? '<details class="ol-more"><summary>Show ' + rest.length + " more</summary>" + '<div class="scn-table-wrap"><table class="ev-table">' + head + "<tbody>" + rest.map(row).join("") + "</tbody></table></div></details>" : "") + "</div>"
}

/* ---------- 3 Market outlook by metal ---------- */

function olOutlook(model, params) {
  var base = olBase(params)
  var lo = -1.5, hi = 1.5
  var x = function (v) { return ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo) * 100).toFixed(2) }
  var zones = '<span class="ol-zone ol-z-hold" style="left:0;width:' + x(0.1) + '%"></span><span class="ol-zone ol-z-shift" style="left:' + x(0.1) + "%;width:" + (x(0.3) - x(0.1)).toFixed(2) + '%"></span><span class="ol-zone ol-z-grow" style="left:' + x(0.3) + "%;width:" + (100 - x(0.3)).toFixed(2) + '%"></span><span class="ol-zero" style="left:' + x(0) + '%"></span>'
  var rows = model.metalOutlooks.slice().sort(function (a, b) { return b.index - a.index }).map(function (p) {
    var b = olFind(base, p.metal)
    var mn = Math.min.apply(null, p.per), mx = Math.max.apply(null, p.per)
    var ticks = p.per.map(function (v, i) { return '<i class="ol-tick" style="left:' + x(v) + "%;background:" + RPT_COLORS[SCN_VISIONS[i].id] + '" title="' + esc(SCN_VISIONS[i].short + " " + scnSigned(v)) + '"></i>' }).join("")
    var ghost = Math.abs(p.index - b.index) >= 0.01 ? '<i class="ol-ghost" style="left:' + x(b.index) + '%" title="Baseline ' + scnSigned(b.index) + '"></i>' : ""
    var exp = Object.keys(p.shares.s).map(function (k) {
      var sh = p.shares.s[k][0]
      return '<i style="width:' + sh + "%;background:" + OL_IND_COLORS[k] + '" title="' + esc(olIndName(k) + " " + sh + "%" + (p.shares.s[k][1] === "e" ? " (estimate)" : "")) + '"></i>'
    }).join("")
    return '<tr data-action="trk-focus" data-metal="' + esc(p.metal) + '" tabindex="0"><th scope="row">' + esc(p.metal) + "</th>" +
      '<td><span class="scn-badge scn-' + p.strategy.cls + '">' + esc(p.strategy.label) + "</span></td>" +
      '<td class="ol-range-cell"><span class="ol-range">' + zones + '<span class="ol-span" style="left:' + x(mn) + "%;width:" + (x(mx) - x(mn)).toFixed(2) + '%"></span>' + ticks + ghost + '<i class="ol-dot" style="left:' + x(p.index) + '%"></i></span></td>' +
      '<td class="num"><b>' + scnSigned(p.index) + "</b></td>" +
      '<td><span class="ol-exp" aria-label="End-use split">' + exp + "</span></td></tr>"
  }).join("")
  var used = {}
  model.metalOutlooks.forEach(function (p) { Object.keys(p.shares.s).forEach(function (k) { used[k] = 1 }) })
  var legend = Object.keys(OL_IND_COLORS).filter(function (k) { return used[k] }).map(function (k) { return '<span><i style="background:' + OL_IND_COLORS[k] + '"></i>' + esc(olIndName(k)) + "</span>" }).join("")
  var visLegend = SCN_VISIONS.map(function (v) { return '<span><i class="ol-tick-key" style="background:' + RPT_COLORS[v.id] + '"></i>' + esc(v.short) + " " + scnPct(model.visions[v.id].p) + "</span>" }).join("")
  return '<div class="ol-table-wrap"><table class="ol-table"><thead><tr><th>Metal</th><th>Call</th><th>2035 outlook across the five visions</th><th class="num">Score</th><th>Where it is used</th></tr></thead><tbody>' + rows + "</tbody></table></div>" +
    '<div class="ol-legends"><p><span class="ol-key-dot"></span> Expected · ' + visLegend + ' · <span class="ol-key-ghost"></span> Baseline</p>' +
    "<p>" + legend + "</p></div>"
}

/* ---------- 2 Advanced filters: 2035 market conditions ---------- */

function olConditions(params) {
  var preset = params.get("scn-preset")
  return '<fieldset class="ol-cond"><legend>2035 market conditions</legend>' +
    (preset ? '<p class="ol-cond-warn">A start point is selected above. Change any condition to use your own.</p>' : "") +
    SCN_DRIVERS.map(function (d) {
      var info = scnConditionDriver(params, d.key)
      var list = RPT_INDICATORS.filter(function (x) { return x.d === d.key })
      var shift = info.value - d.def
      return '<details class="ol-driver"' + (info.changed ? " open" : "") + '><summary><span>' + esc(OL_DRIVER_NAMES[d.key]) + "</span>" +
        '<span class="ol-driver-val">' + esc(d.high) + " " + info.value + "%" + (shift ? ' <b class="trk-delta ' + (shift > 0 ? "up" : "down") + '">' + (shift > 0 ? "+" : "−") + Math.abs(shift) + "</b>" : "") + "</span></summary>" +
        '<div class="ol-cond-rows">' + list.map(function (x) {
          var c = SCN_CONDITIONS[x.id]
          var cur = scnConditionScore(params, x)
          var name = "mc-" + x.id
          var steps = [-2, -1, 0, 1, 2].map(function (v) {
            var id = name + "-" + (v + 2)
            return '<input type="radio" id="' + id + '" name="' + name + '" value="' + v + '" data-condition="' + x.id + '"' + (v === cur ? " checked" : "") + ">" +
              '<label for="' + id + '" class="' + (v === x.score ? "is-today" : "") + '" title="' + esc(v === x.score ? "Today" : "") + '"><span class="visually-hidden">' + esc(v < 0 ? c.low : v > 0 ? c.high : "Neutral") + " " + v + "</span></label>"
          }).join("")
          return '<div class="ol-cond-row' + (cur !== x.score ? " changed" : "") + '" role="radiogroup" aria-label="' + esc(c.name) + '"><span class="ol-cond-name">' + esc(c.name) + "</span>" +
            '<span class="ol-cond-low">' + esc(c.low) + '</span><span class="ol-steps">' + steps + '</span><span class="ol-cond-high">' + esc(c.high) + "</span></div>"
        }).join("") + '<p class="ol-cond-key"><i class="ol-today-key"></i> today</p></div></details>'
    }).join("") + "</fieldset>"
}

/* ---------- Page ---------- */

function olPaint(model, params) {
  var el = document.getElementById("trk-results")
  if (el) el.innerHTML = olResults(model, params)
  var out = document.getElementById("scn-metals")
  if (out) out.innerHTML = olOutlook(model, params)
}

function viewGenerator(route) {
  var model = scnModel(route.params)
  return '<div class="scn trk-calc ol">' + pageHead("Scenario generator 2035") +
    '<p class="trk-intro">Where should Münvest invest to 2035? The brief below answers for the evidence baseline. Change industry demand or market conditions further down and it updates.</p>' +
    '<section class="scn-panel trk-results-panel ol-brief" aria-labelledby="trk-results-heading"><h2 id="trk-results-heading" class="scn-heading">Recommendation and decision brief</h2>' +
    '<div id="trk-results" class="scn-body">' + olResults(model, route.params) + "</div></section>" +
    scnDriverPanel(route.params, false) +
    '<section class="scn-panel" aria-labelledby="scn-metal-heading"><h2 id="scn-metal-heading" class="scn-heading">Market outlook by metal</h2>' +
    '<div id="scn-metals" class="scn-body">' + olOutlook(model, route.params) + "</div></section>" +
    '<h2 class="scn-heading trk-section">Evidence and calculation</h2>' +
    (typeof trkSnapshotLine === "function" ? trkSnapshotLine() : "") +
    '<div id="scn-calc">' + olCalc(model) + "</div>" + marketEvidencePanel() +
    '<p class="scn-link"><a href="#/report">Read the scenario briefs →</a></p></div>'
}

function olCalc(model) {
  return '<details class="ev-box ev-wide scn-calc"><summary>Show calculation and end-use shares</summary>' +
    '<p class="ev-why">1. Market conditions: the 24 report indicators set the probability of the four drivers (50% + 24 points × average score). ' +
    "2. The 16 driver combinations give the likelihood of the five visions. " +
    "3. Each industry has a 2035 outlook score per vision (−2 to +2, report sections 6 and 10). Your industry sliders and tracker 2035 values shift that score in every vision (±50% = ±2 scaled by 0.6, capped at ±2); they do not change the vision likelihoods. A country applies the illustrative tilt of its UN subregion. " +
    "4. A metal’s score per vision = Σ share of its use in each industry × that industry’s score; uses outside the ten industries count as 0 (they follow the baseline). " +
    "5. The outlook score weights the five vision scores by likelihood. Expand ≥ +0.30, Reposition +0.10 to +0.30, Maintain below +0.10. " +
    "6. “Your industry inputs” in the brief = Σ share × industry change in %, applied to the published 2035 demand total where the tracker has one.</p>" +
    '<div class="scn-table-wrap"><table class="ev-table"><thead><tr><th>Metal</th>' + SCN_INDUSTRY_DRIVERS.map(function (i) { return '<th class="num">' + esc(i.name) + "</th>" }).join("") + '<th class="num">Other</th><th>Source</th></tr></thead><tbody>' +
    SCN_METAL_SHARES.map(function (m) {
      return "<tr><th>" + esc(m.metal) + "</th>" + SCN_INDUSTRY_DRIVERS.map(function (i) {
        var v = m.s[i.id]
        return '<td class="num">' + (v ? v[0] + (v[1] === "e" ? "*" : "") : "") + "</td>"
      }).join("") + '<td class="num">' + (m.s.other ? m.s.other[0] + (m.s.other[1] === "e" ? "*" : "") : "") + "</td><td>" + trkSources(m.sources) + "</td></tr>"
    }).join("") + "</tbody></table></div><p class=\"trk-note\">% of each metal’s use. * team estimate inside a published total.</p>" +
    '<ul class="ol-basis">' + SCN_METAL_SHARES.map(function (m) { return "<li><b>" + esc(m.metal) + ":</b> " + esc(m.basis) + " " + esc(m.note) + " " + trkSources(m.sources) + "</li>" }).join("") + "</ul>" +
    '<div class="scn-table-wrap"><table class="ev-table"><thead><tr><th>Metal</th>' + SCN_VISIONS.map(function (v) { return '<th class="num">' + esc(v.short) + "</th>" }).join("") + '<th class="num">Score</th><th>Call</th></tr></thead><tbody>' +
    model.metalOutlooks.map(function (p) {
      return "<tr><th>" + esc(p.metal) + "</th>" + p.per.map(function (v) { return '<td class="num">' + scnSigned(v) + "</td>" }).join("") + '<td class="num"><b>' + scnSigned(p.index) + "</b></td><td>" + esc(p.strategy.label) + "</td></tr>"
    }).join("") + "</tbody></table></div></details>"
}
