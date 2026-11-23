"use strict"

/* Content of the Münvest 2035 scenario report ("Münvest 2035: five visions for Germany and the EU", rev. 107,
   15 Nov 2026), used by the Scenario briefs page. Text and numbers are copied from the report; model numbers
   (likelihoods, industry scores) are recalculated live by scenarios.js from the same inputs. */

var RPT_SOURCES = {
  cee: { label: "Council of Economic Experts, annual report 2026/27 (11 Nov 2026)", url: "https://www.bundeswirtschaftsministerium.de/Redaktion/DE/Pressemitteilungen/2026/11/20261111-sachverstaendigenrat-jahresgutachten.html" },
  jef: { label: "Joint Economic Forecast autumn 2026 (Hellenic Shipping News)", url: "https://www.hellenicshippingnews.com/?p=1149516" },
  kiel: { label: "Kiel Institute Economic Outlook, Autumn 2025", url: "https://www.ifw-kiel.de/fileadmin/Dateiverwaltung/IfW-Publications/fis-import/86f72dde-c6e3-4879-b1ca-9e8e0c017e1c-KKB_127_2025-Q3_Deutschland_EN.pdf" },
  vci: { label: "German chemicals lobby expects 1.5% output fall in 2026 (Reuters via Euronext)", url: "https://live.euronext.com/en/financial-news/german-chemicals-lobby-warns-growth-drift-asia-hurting-recovery" },
  vw: { label: "VW warning deepens gloom as workers protest (Sep 2026)", url: "https://www.thestar.com.my/business/business-news/2026/09/22/vw-warning-deepens-gloom-as-workers-protest" },
  icds: { label: "Defence spending: who is doing what? (ICDS, Jul 2026)", url: "https://icds.ee/en/defence-spending-who-is-doing-what-july-2026/" },
  janes: { label: "Ankara summit and spending risks (Janes, Jul 2026)", url: "https://www.janes.com/defence-intelligence-insights/defence-and-national-security-analysis/ankara-summit-underscores-nato-unity-as-defence-spending-risks-persist" },
  rte: { label: "Brussels presents “Made in EU” act (RTÉ, Mar 2026)", url: "https://www.rte.ie/news/business/2026/0304/1561678-made-in-eu-act" },
  scmp: { label: "China extends pause on rare earth controls (SCMP, Nov 2026)", url: "https://scmp.com/economy/china-economy/article/3373924/china-extends-rare-earth-controls-pause-pricing-and-financing-hold-back-eu-supply-push" },
  gta: { label: "Global Trade Alert: suspension extended until 10 January 2027", url: "https://globaltradealert.org/state-act/95168-china-temporary-suspension-of-additional-export-controls-for-rare-earth-related-technologies" },
  bt: { label: "EU–China trade talks (Brussels Times, Oct 2026)", url: "https://www.brusselstimes.com/2357552/eu-china-trade-talks-grapple-with-tariffs-rare-earths-and-export-controls" },
  dataforce: { label: "Chinese brands 12.7% of European registrations in Q3 2026, 14.5% in September (Dataforce, via Briefs/Bloomberg)", url: "https://www.briefs.co/?p=27909" },
  newmob: { label: "Chinese brands hit record market share in Europe; Counterpoint >20% by 2030 (NewMobility, Aug 2026)", url: "https://newmobility.news/en/2026/08/25/chinese-brands-hit-record-market-share-in-europe-targeting-30-by-2030/" },
  plants: { label: "Chinese automakers accelerate factory builds in Europe (Jun 2026)", url: "https://english.news18a.com/m/news/english_266793.html" },
  spdrc: { label: "DRC cobalt export quotas (S&P Global)", url: "https://www.spglobal.com/market-intelligence/en/news-insights/research/2025/10/drc-cobalt-export-quotas-to-support-cobalt-prices-though-challenges-loom" },
  argus: { label: "DRC quotas vs. 2024 exports (Argus)", url: "https://www.argusmedia.com/news-and-insights/latest-market-news/2734806-drc-cobalt-quotas-to-address-structural-surplus" },
  fastdrc: { label: "DRC keeps 2026–27 cobalt quotas, withdraws unused allocations (Fastmarkets)", url: "https://www.fastmarkets.com/insights/drc-may-reduce-cobalt-quota-if-market-needs-rebalancing-arecoms-says-exclusive/" },
  tungsten: { label: "China restrictions lead to tungsten supply crunch (Industrial Info, Jun 2026)", url: "https://www.industrialinfo.com/news/article.jsp?newsitemID=358432" },
  indo: { label: "Indonesia signals further nickel ore quota cuts (S&P Global, Nov 2026)", url: "https://www.spglobal.com/energy/en/news-research/latest-news/metals/110226-indonesia-signals-further-nickel-ore-quota-cuts-as-global-surplus-weighs-on-prices" },
  cassel: { label: "Aircraft and engine shortages (Cassel Salpeter, Aug 2026)", url: "https://www.casselsalpeter.com/?p=15416" },
  sangdong: { label: "Almonty begins processing at Sangdong (Mining Technology, Jul 2026)", url: "https://www.mining-technology.com/newsletters/almonty-processing-operations-sangdong-mine" },
  goslar: { label: "H.C. Starck Tungsten invests €50m in Goslar recycling", url: "https://www.hcstarck.com/en/h-c-starck-tungsten-invests-in-recycling-capacity/" },
  lfp: { label: "How LFP became the volume chemistry (May 2026)", url: "https://elevenes.com/?p=3046" },
  sodium: { label: "Sodium-ion vs LFP in 2026 (citing IEA)", url: "https://www.arabwheels.ae/blog/?p=170318" },
  woodmac: { label: "Wood Mackenzie on sodium-ion cost parity (TaiyangNews)", url: "https://taiyangnews.info/technology/wood-mackenzie-sees-growth-in-sodium-ion-battery-market" },
  kobold: { label: "KoBold breaks ground on Mingomba (Skillings, May 2026)", url: "https://www.skillings.net/?p=88615" },
  wyman: { label: "Why engine availability is a growing challenge (Oliver Wyman, Sep 2026)", url: "https://www.oliverwyman.com/our-expertise/insights/2026/sep/aviation-engine-availaibility-bottlenecks.html" },
  vernova: { label: "GE Vernova backlog hits 116 GW (Turbomachinery Magazine, Jul 2026)", url: "https://www.turbomachinerymag.com/view/ge-vernova-gas-turbine-backlog-hits-116-gw-as-power-orders-more-than-double" },
  mlex: { label: "Industrial Accelerator Act still dividing lawmakers (MLex, 11 Nov 2026)", url: "https://www.mlex.com/mlex/articles/2548982" },
  spre: { label: "China extends rare earth export suspension to January 2027 (S&P Global, 9 Nov 2026)", url: "https://www.spglobal.com/energy/en/news-research/latest-news/metals/110926-china-extends-rare-earth-export-suspension-to-january-2027" },
  cobaltinst: { label: "Cobalt Institute, Cobalt Market Report 2024", url: "https://www.cobaltinstitute.org/wp-content/uploads/2025/05/Cobalt-Market-Report-2024.pdf" },
  nickelinst: { label: "Nickel Institute, Nickel magazine vol. 40 no. 2 (first use 2024)", url: "https://www.cedinox.es/export/sites/cedinox/.galleries/publicaciones-tecnicas/nickelvol40no2_summer_2025_eng_fb.pdf" },
  imoa: { label: "IMOA: molybdenum uses", url: "https://www.imoa.info/molybdenum-uses/molybdenum-uses.php" },
  usgsW: { label: "USGS MCS 2026: Tungsten", url: "https://pubs.usgs.gov/periodicals/mcs2026/mcs2026-tungsten.pdf" },
  usgsRe: { label: "USGS MCS 2026: Rhenium", url: "https://pubs.usgs.gov/periodicals/mcs2026/mcs2026-rhenium.pdf" },
  usgsNb: { label: "USGS MCS 2026: Niobium", url: "https://pubs.usgs.gov/periodicals/mcs2026/mcs2026-niobium.pdf" },
  usgsTi: { label: "USGS MCS 2018: Titanium (aerospace share)", url: "https://d9-wret.s3.us-west-2.amazonaws.com/assets/palladium/production/mineral-pubs/titanium/mcs-2018-titan.pdf" },
  benchmark: { label: "Benchmark: what is manganese", url: "https://www.benchmarkminerals.com/glossary/what-is-manganese" },
  iea_wo: { label: "IEA World Energy Outlook 2025 (via IIR)", url: "https://iifiir.org/en/fridoc/world-energy-outlook-2025-151172" },
  eugas: { label: "Council of the EU: stepwise ban on Russian gas imports", url: "https://www.eeas.europa.eu/delegations/ukraine/russian-gas-imports-council-gives-final-greenlight-stepwise-ban_en" }
}

/* Layer 1: the 24 indicators (report section 3). */
var RPT_INDICATORS = [
  { d: "a", id: "A1", name: "GDP growth vs. potential", data: "1.3% (2026), 1.0% (2027), 0.4% (2028); average 0.9% vs. potential about 0.8% = +0.1 pp", score: 0, src: ["cee", "jef"] },
  { d: "a", id: "A2", name: "Fiscal impulse", data: "€500bn infrastructure fund; defence above 1% of GDP exempt from the debt brake; extra fiscal space about 3¼% of GDP", score: 2, src: ["kiel"] },
  { d: "a", id: "A3", name: "Chemical output", data: "VCI: −1.5% in 2026, after −3% in H1", score: -2, src: ["vci"] },
  { d: "a", id: "A4", name: "Automotive employment", data: "VW: up to 100,000 jobs cut by end of decade; suppliers lost 74,000 jobs in 2019–25", score: -2, src: ["vw"] },
  { d: "a", id: "A5", name: "Defence spending growth", data: "Europe + Canada about $634bn in 2026 (+11%); growth slows to low single digits to 2030", score: 1, src: ["icds", "janes"] },
  { d: "a", id: "A6", name: "Industrial policy", data: "Industrial Accelerator Act: manufacturing 14.3% → 20% of GDP by 2035; still a proposal", score: 1, src: ["rte", "mlex"] },
  { d: "b", id: "B1", name: "Trade defence", data: "Countervailing duties on Chinese EVs since 2024; PHEV duties under discussion", score: 1, src: ["bt"] },
  { d: "b", id: "B2", name: "Local-content rules", data: "Industrial Accelerator Act proposes 70% EU content for subsidised EVs", score: 1, src: ["rte"] },
  { d: "b", id: "B3", name: "Chinese counter-measures", data: "Dual-use export bans (Jul 2026); rare-earth control pause extended only to 10 January 2027", score: 1, src: ["scmp", "gta"] },
  { d: "b", id: "B4", name: "Dialogue", data: "EU–China trade talks (8–9 Oct 2026) agreed a fast-track for rare-earth licences", score: -1, src: ["bt"] },
  { d: "b", id: "B5", name: "Market reality", data: "Chinese brands 0.5% (2021) → 12.7% (Q3 2026), record 14.5% in Sep 2026", score: -2, src: ["dataforce"] },
  { d: "b", id: "B6", name: "Localisation", data: "BYD (Hungary, Turkey), Chery, Leapmotor, SAIC, Geely (Spain); governments court the plants", score: -1, src: ["plants"] },
  { d: "c", id: "C1", name: "Cobalt", data: "DRC quota 96,600 t a year (2026–27), about 49% of 2024 exports; unused H1 2026 quotas withdrawn", score: 2, src: ["spdrc", "argus", "fastdrc"] },
  { d: "c", id: "C2", name: "Tungsten", data: "China about 80% of supply, 15 licensed exporters; APT prices more than quadrupled in 2026", score: 2, src: ["tungsten", "usgsW"] },
  { d: "c", id: "C3", name: "Nickel", data: "Indonesia raised 2026 quota; price below $16,000/t; large surplus stocks", score: -2, src: ["indo"] },
  { d: "c", id: "C4", name: "Processing", data: "More than 3,500 commercial engines waiting for castings and forgings", score: 1, src: ["cassel"] },
  { d: "c", id: "C5", name: "New Western supply", data: "Sangdong processing since mid-2026; Goslar recycling 5,000 → 7,000 t by 2028; El Moto 2029", score: -1, src: ["sangdong", "goslar"] },
  { d: "c", id: "C6", name: "Policy outlook", data: "S&P base case: DRC raises quota from 2028", score: -1, src: ["spdrc"] },
  { d: "d", id: "D1", name: "Battery chemistry", data: "LFP about 20% (2020) → about 61% (2025) of the global market", score: 2, src: ["lfp"] },
  { d: "d", id: "D2", name: "Sodium-ion outlook", data: "Morgan Stanley: 20% of capacity by 2030; IEA: below 10% of EV batteries by 2030", score: 0, src: ["sodium"] },
  { d: "d", id: "D3", name: "Sodium-ion cost", data: "Cell parity with LFP by end-2026, system parity only after 2030", score: -1, src: ["woodmac"] },
  { d: "d", id: "D4", name: "AI in mining", data: "KoBold's AI-found Mingomba deposit broke ground 2026", score: 1, src: ["kobold"] },
  { d: "d", id: "D5", name: "Aerospace supply chain", data: "About 30% of MRO-survey respondents expect no full recovery for more than 3 years", score: -1, src: ["wyman"] },
  { d: "d", id: "D6", name: "Power equipment", data: "GE Vernova: output from 20 GW to 30 GW a year by 2030, mostly sold out", score: 1, src: ["vernova"] }
]

/* Section 8: the five visions. */
var RPT_VISIONS = {
  open: {
    role: "Planning case", quote: "Europe keeps buying cars, but the value chain is no longer European.",
    conditions: "Weak European industry + open stance towards China. Supply and technology can go either way.",
    story: [["2026–2028", "BYD's Szeged plant ramps up; Leapmotor builds in Stellantis's Zaragoza plant and Chery in Barcelona. Brussels accepts price undertakings instead of higher tariffs. Volkswagen carries out its restructuring."],
      ["2029–2031", "The Industrial Accelerator Act passes in a softened form. Chinese OEMs meet the content rule by bringing their own suppliers into Hungary and Spain. German tier-1 suppliers lose battery-pack, casting and electronics contracts."],
      ["2032–2035", "Chinese brands hold about a third of the EV market. Germany keeps premium brands, defence and machinery. Volume car production sits in Spain, Hungary and Turkey."]],
    act: ["Win the new Chinese-owned cell and car plants as customers for copper and aluminium products.", "Keep aerospace as the core; cut combustion-engine parts for EU carmakers."],
    watch: ["EV duties replaced by price undertakings.", "Chinese brands above 15% of EU car sales.", "New Chinese supplier plants in Spain and Hungary."],
    metalNote: "Battery-grade manganese reaches +1.95, the highest metal-segment score in this vision."
  },
  stag: {
    role: "Stress test", quote: "Europe re-arms on an empty stomach.",
    conditions: "Weak European industry + closed stance.",
    story: [["2026–2028", "China does not extend its export-control pause after January 2027. Europe answers with PHEV duties and a strict Industrial Accelerator Act. Energy prices stay high and chemical plants keep closing. The €500bn fund is slowed by planning and labour shortages."],
      ["2029–2031", "Growth falls towards 0.5%. Defence is protected; other budgets are cut. China extends dual-use bans, so supply crises hit even though demand is weak."],
      ["2032–2035", "A strong defence industry (Rheinmetall, KNDS, Diehl) sits on a weak industrial base."]],
    act: ["Shift the sales mix towards defence and aerospace.", "Hold strategic stock of cobalt and critical alloying inputs.", "Share supply risk through EU joint purchasing."],
    watch: ["China's decision on the export-control pause in January 2027.", "EU duties on plug-in hybrids.", "Growth forecasts below 0.5% for 2028."],
    metalNote: "Every high-performance metal segment stays at or above zero except nickel (−0.08). This is the stress test the advice must survive."
  },
  super: {
    role: "Upside", quote: "Everything that carries electricity needs more metal.",
    conditions: "Strong industry + open stance + tight supply (or loose supply with slow technology).",
    story: [["2026–2028", "AI data centres, heat pumps and grid expansion push power demand up. Siemens Energy and GE Vernova sell out turbine slots."],
      ["2029–2031", "Europe buys Chinese storage cells and sells turbines and grid technology. The infrastructure fund turns into construction. The DRC raises its cobalt quota."],
      ["2032–2035", "Turbines, engines and power electronics run at full capacity. Melting, casting and forging capacity become the limit."]],
    act: ["Add capacity in superalloy and energy grades for turbines and the grid.", "Book melting, casting and forging capacity early, before it becomes the limit."],
    watch: ["Turbine order books extending beyond 2031.", "Grid approvals under the €500bn fund."],
    metalNote: "Cobalt has its best whole-market score here (+1.15). Nickel superalloys reach +1.42."
  },
  fort: {
    role: "Policy-driven alternative", quote: "Security first: Europe pays more for metal it can count on.",
    conditions: "Strong industry + closed stance + tight supply (or loose supply with slow technology).",
    story: [["2026–2028", "RESourceEU runs its first joint purchases and stockpiles. The Industrial Accelerator Act passes with the 70% rule intact. Defence budgets head towards 3.5%."],
      ["2029–2031", "European supply comes online: El Moto (tungsten), H.C. Starck's expanded Goslar recycling, Almonty's Panasqueira."],
      ["2032–2035", "Europe runs two supply chains: an expensive, certified one for strategic uses and a cheap, global one for everything else."]],
    act: ["Sell certified non-China material at a premium.", "Bid for EU stockpile tenders; serve LNG and energy-security projects."],
    watch: ["The Industrial Accelerator Act adopted intact.", "The first RESourceEU stockpile purchases."],
    metalNote: "Tungsten (+1.02) and niobium (+1.16) do best here, pulled by defence and protected steel."
  },
  ren: {
    role: "Long shot", quote: "Technology breaks the bottlenecks, and Europe's engineers profit.",
    conditions: "Strong industry + loose supply + fast technology.",
    story: [["2026–2028", "AI exploration finds new deposits; recycling of cobalt, nickel and tungsten scales up in Germany and the Nordics."],
      ["2029–2031", "New mines and recycling weaken the hold of China, the DRC and Indonesia. New casting capacity (Safran, GE Aerospace) ends the engine shortage."],
      ["2032–2035", "Prices fall and volumes grow. Value moves to qualifying advanced alloys."]],
    act: ["Run down stock as prices fall.", "Move into alloy engineering and qualification services."],
    watch: ["AI-found deposits reaching production decisions.", "Recycled content above 30% in superalloys."],
    metalNote: "All metals are positive."
  }
}

/* Section 8.6: each vision in numbers, 2035 (order: open, stag, super, fort, ren). */
var RPT_NUMBERS = [
  { name: "Chinese brands' share of European car registrations", today: "12.7% in Q3 2026, record 14.5% in September (Dataforce)", unit: "%", values: [33, 15, 25, 12, 20], approx: true, src: ["dataforce", "newmob"] },
  { name: "German real GDP growth, average 2027–35", today: "1.0% in 2027 (Council of Economic Experts); potential about 0.8%", unit: "%", values: [0.5, 0.3, 1.4, 1.0, 1.5], approx: true, src: ["cee", "jef"] },
  { name: "European NATO allies' core defence spending, % of GDP", today: "Target 3.5% core by 2035 (NATO, The Hague 2025)", unit: "% of GDP", values: [2.5, 3.5, 3.0, 3.5, 3.0], approx: true, src: ["icds"] },
  { name: "German chemical output vs. 2025", today: "−1.5% in 2026 (VCI)", unit: "%", values: [-15, -20, 0, -5, 0], approx: true, src: ["vci"] }
]

/* Section 7: whole-market metal scores by vision and the high-performance slice (report, Layer 5). */
var RPT_METALS = [
  { metal: "Titanium", per: [0.71, 0.30, 1.24, 0.82, 1.72], index: 0.88, hp: 1.01, use: "About 80% of titanium metal goes to aerospace (USGS)", src: ["usgsTi"] },
  { metal: "Rhenium", per: [0.46, -0.09, 1.17, 0.62, 1.59], index: 0.65, hp: 0.95, use: "Superalloys for turbine engines about 80% (USGS 2026)", src: ["usgsRe"] },
  { metal: "Cobalt", per: [0.29, -0.37, 1.15, 0.49, 0.85], index: 0.42, hp: 0.88, use: "Li-ion batteries 76%; superalloys about 8% (Cobalt Institute 2024)", src: ["cobaltinst"] },
  { metal: "Niobium", per: [-0.86, -0.44, 0.74, 1.16, 1.12], index: 0.16, hp: 0.93, use: "About 77% steel, about 23% superalloys (USGS 2026)", src: ["usgsNb"] },
  { metal: "Tungsten", per: [-0.79, -0.47, 0.71, 1.02, 1.09], index: 0.14, hp: 0.73, use: "Cemented carbides about 60–65% (USGS 2026)", src: ["usgsW"] },
  { metal: "Nickel", per: [-0.77, -0.75, 0.74, 0.76, 0.84], index: 0.01, hp: 0.77, use: "Stainless 66%, batteries 16%, nickel-base alloys 6% (Nickel Institute 2024)", src: ["nickelinst"] },
  { metal: "Molybdenum", per: [-1.08, -0.82, 0.58, 0.84, 0.91], index: -0.10, hp: 0.76, use: "Stainless about 25%; engineering, tool steels and cast iron about 54% (IMOA)", src: ["imoa"] },
  { metal: "Manganese", per: [-1.44, -0.85, 0.48, 1.07, 0.80], index: -0.20, hp: 1.59, use: "About 90% into steel; less than 2% battery-grade (Benchmark)", src: ["benchmark"] }
]

/* Section 12: stress tests (likelihoods in %, order open, stag, super, fort, ren). */
var RPT_STRESS = [
  { event: "Base case (today)", values: [27.1, 22.9, 19.9, 16.8, 13.3] },
  { event: "China lets the pause lapse on 10 Jan 2027 (B3 +1 → +2)", values: [25.0, 25.0, 18.3, 18.3, 13.4] },
  { event: "German recession (A1 0 → −1)", values: [29.3, 24.8, 18.2, 15.4, 12.3] },
  { event: "Industrial Accelerator Act adopted with funding (A6 +1 → +2)", values: [24.8, 21.0, 21.5, 18.2, 14.5] },
  { event: "DRC loosens its cobalt quota (C1 +2 → 0)", values: [27.1, 22.9, 18.5, 15.7, 15.8] },
  { event: "“Fortress path”: B3, B2, A6 all → +2", values: [21.0, 24.8, 18.2, 21.5, 14.5] }
]

/* Section 10: playbook. */
var RPT_PLAYBOOK = [
  { signal: "EV duties replaced by price undertakings; Chinese share above 15%", vision: "open", move: "Win Chinese-owned EU plants as customers for copper and aluminium; cut combustion-engine parts faster" },
  { signal: "China lets its export-control pause expire after January 2027; PHEV duties introduced", vision: "stag", move: "Raise cobalt and critical-input stock; prioritise defence and aerospace orders; switch to non-China sources" },
  { signal: "Turbine order books extend beyond 2031", vision: "super", move: "Add capacity in superalloy and energy grades" },
  { signal: "Industrial Accelerator Act adopted with the 70% rule; first EU stockpile purchases", vision: "fort", move: "Sell certified non-China material at a premium; bid for stockpile tenders; add LNG and energy-security grades" },
  { signal: "AI-found mines and recycling at scale; controls lose effect", vision: "ren", move: "Run down stock; offer alloy engineering and qualification services" }
]

var RPT_ADVICE = [
  ["Demand", "Put capacity and qualification first into aerospace and energy grades.", "Target (proposed): more than 60% of sales to aerospace, defence, energy and medical by 2030."],
  ["Supply", "Secure raw materials outside China and the DRC quota system.", "Target: no input metal more than 50% from one country by 2028."],
  ["Batteries", "Join the EV shift through copper and aluminium products, not battery nickel.", "EU-made batteries are the strongest industry (+1.13, positive in every vision)."],
  ["Hedge", "Use recycling and strategic stock as the hedge for a weak, closed Europe.", "Hold 3–6 months of cobalt and critical alloying inputs, backed by take-or-pay contracts."],
  ["Monitoring", "Münvest runs a quarterly signpost review and tells the board when to shift.", "Next big signal: China's decision on the export-control pause, 10 January 2027."]
]
