// Atlas browser. Builds the whole interface inside the element with data-atlas-browse, from static JSON files under
// its data-base URL (see site/build_data.py). A preview page may instead embed the files in
// <script type="application/json" id="atlas-embed">. All text goes in through textContent.
// Written for clinicians who know drug labels and have not studied machine learning: plain words first, technical
// names behind "Technical details".

const SVGNS = "http://www.w3.org/2000/svg";
const ICON = {
  prev: "M15 5l-7 7 7 7", next: "M9 5l7 7-7 7", down: "M6 9l6 6 6-6", up: "M6 15l6-6 6 6",
  check: "M5 12.5l4.5 4.5L19 7.5", info: "M12 11v6|M12 7.5v.01", warn: "M12 8v5|M12 16.5v.01", no: "M7 12h10",
};
const TYPICAL = 30;
const STRICT = { token: 5, section: 10, class: 5, medication: 10 };
const SECTION_PLAIN = ["Dosage and administration", "Boxed warning", "Contraindications", "Drug interactions", "Overdosage", "Warnings", "General web text"];
const TYPE_PLAIN = ["Other tokens", "Drug names", "Frequency or timing", "Dose units (mg, mL)", "Dose numbers (the 5 in 5 mg)", "Other numbers", "Routes", "Dosage forms"];
const THEMES = [
  ["numbers with", "A dose number together with its unit: 5 mg, 0.375 mg once daily, 10 mg per kg."],
  ["dose number", "The number in a dose, such as the 5 in 5 mg."],
  ["dose unit", "The measure of a dose: mg, mL, mcg per kg."],
  ["frequency", "How often or when a dose is taken: twice daily, at bedtime, every 8 hours."],
  ["route", "How a drug is given: by mouth, intravenously, under the skin."],
  ["dosage form", "Tablets, capsules, vials and other forms."],
  ["maximum", "Dose limits: do not exceed, maximum daily dose."],
  ["renal", "Dose changes for kidney or liver impairment."],
  ["pediatric", "Dosing for children, by age band or body weight."],
  ["overdose", "Managing an overdose: dialysis, activated charcoal, supportive care."],
  ["contraindication", "Contraindications and hypersensitivity reactions."],
  ["interaction", "Drug interactions, including CYP enzyme inhibitors, inducers and substrates."],
  ["pregnancy", "Statements about pregnancy and breastfeeding."],
  ["serious", "Language about serious risks, as in boxed warnings."],
  ["monitoring", "Monitoring instructions: laboratory tests, vital signs, follow-up."],
  ["titration", "Raising or lowering a dose over time: titrate, taper."],
  ["salt", "Salt names inside drug names, such as the hydrochloride in a generic name."],
  ["ending", "The shared ending of drug names in one class."],
];
const themeNote = (name) => (THEMES.find(([k]) => name.toLowerCase().includes(k)) || [null, ""])[1];

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
function add(parent, ...kids) {
  kids.forEach((k) => k != null && k !== false && parent.appendChild(typeof k === "string" ? document.createTextNode(k) : k));
  return parent;
}
function icon(d) {
  const s = document.createElementNS(SVGNS, "svg");
  s.setAttribute("viewBox", "0 0 24 24");
  s.setAttribute("aria-hidden", "true");
  d.split("|").forEach((path) => {
    const p = document.createElementNS(SVGNS, "path");
    p.setAttribute("d", path);
    p.setAttribute("stroke-linecap", "round");
    p.setAttribute("stroke-linejoin", "round");
    s.appendChild(p);
  });
  return s;
}
function searchIcon() {
  const s = document.createElementNS(SVGNS, "svg");
  s.setAttribute("viewBox", "0 0 24 24");
  s.setAttribute("aria-hidden", "true");
  const c = document.createElementNS(SVGNS, "circle");
  c.setAttribute("cx", "11"); c.setAttribute("cy", "11"); c.setAttribute("r", "7");
  const p = document.createElementNS(SVGNS, "path");
  p.setAttribute("d", "M20 20l-4-4");
  s.appendChild(c); s.appendChild(p);
  return s;
}
function ico(kind) {
  const s = el("span", "ico " + kind);
  s.appendChild(icon(ICON[kind === "ok" ? "check" : kind]));
  return s;
}
function snippet(text, cls) {
  const e = el("span", cls || "ab-q");
  String(text || "").split(/<<|>>/).forEach((p, i) => {
    if (!(i % 2)) return add(e, p);
    const m = p.match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (!m[2]) return add(e, el("mark", null, p));
    add(e, m[1] || null, el("mark", null, m[2]), m[3] || null);
  });
  return e;
}
function fold(title, nodes, cls) {
  const det = el("details", "ab-fold" + (cls ? " " + cls : "")), sm = el("summary");
  add(sm, el("span", null, title), icon(ICON.down));
  det.appendChild(sm);
  const body = el("div", "ab-fold-body");
  nodes.filter(Boolean).forEach((n) => body.appendChild(n));
  det.appendChild(body);
  return det;
}
const pct = (x) => (x == null ? "n/a" : Math.round(x * 100) + "%");
const sc = (x) => (x == null ? "n/a" : Number(x).toFixed(2));
const fmtRate = (v) => (v == null ? "n/a" : v < 1 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : Math.round(v).toLocaleString("en-US"));
const fmtInt = (v) => Number(v).toLocaleString("en-US");
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const times = (r) => (r == null ? "" : r >= 10 ? `${Math.round(r)} times` : `${fmtRate(r)} times`);

const TERMS = [
  ["Token", "The model reads text as tokens: a whole word, or a piece of a longer word or number. Rates on this site are per 1,000 tokens."],
  ["Step, and layer", "Every token passes through the same fixed sequence of 36 processing steps, always in the same order. Each step refines the model's working notes about that token. At the first step the notes hold little more than the token itself; after the last step the model must commit to the next token it will write. The technical name for a step is a layer. Layers are numbered 0 to 35, so step 12 of 36 is layer 11."],
  ["Neuron", "Each step has 12,288 neurons. A neuron computes one number at every token and adds a fixed pattern to the model's working notes in proportion to it."],
  ["Pole, which this site calls a unit", "A neuron's unusually high values and its unusually low values often respond to unrelated text, so each is studied separately as a pole. The model has 884,736 poles. Here a pole is called a unit. Its technical name gives the layer number: L11N11505-high is the high pole of neuron 11,505 in layer 11, which is step 12 of 36."],
  ["Activation and firing", "The activation is the neuron's value at one token. A unit fires on a token when the activation passes the unit's firing threshold. For a low unit the strongest activations are the most negative ones."],
  ["Firing threshold", "The 97th percentile of the neuron's values on a reference text for a high unit, or the 3rd percentile for a low unit. On that reference text every unit fires on about 30 of every 1,000 tokens. That is the expected rate, drawn as a dashed line in the charts; in this corpus a unit's rate can be far above or below it."],
  ["Strongest contexts", "The 20 places in a 10-million-token corpus (8 million tokens of FDA label text, 2 million of general web text) where the unit's activation was largest. The token it fired on is highlighted."],
  ["Card", "A short description of the unit written by Claude Sonnet from 10 of its 20 strongest contexts. The other 10 were held out for testing."],
  ["Strong score and threshold score", "Claude Haiku, given only the card, sorted held-out tokens into firing and not firing. The score is balanced accuracy, the mean of the share of firing tokens caught and the share of quiet tokens rejected; chance is 0.50. The strong score uses the held-out strongest contexts; the threshold score uses random firing tokens, most of them near the threshold."],
  ["String-matching baseline", "The same test without a card: a token counts as firing if it is the same token as one highlighted in the contexts the writer saw. A card is useful to the extent that it beats this."],
  ["Wrong-unit control", "The same test scored with another unit's card. It should sit near chance; a card that only sounds plausible for drug label text would score above it. It also runs above chance when the other unit happens to fire on the same kind of token."],
  ["Near-silent", "A unit whose largest activation size (ignoring sign) anywhere in the corpus is below 0.05. Its threshold is set from its own values, so it still fires on a share of tokens, at very small values: a repeatable but tiny signal, mostly at positions inside words. 502 near-silent units had cards written before they were excluded from the selection; the page shows their data but not their cards, and the cards stay in the public data files."],
  ["Selection reason and ratio", "30,529 units (about 30,500) were selected for a card because they fire more on a token type, in a label section, in one drug class's labels, or in label text generally. The ratio is the firing rate there divided by the rate in the comparison text named with it (other tokens, other label sections, other labels, or web text)."],
  ["Lift", "For a drug or drug class: the unit's firing rate in that label text divided by its rate in the rest of the corpus. It says where in the label wording the unit fires, not anything about the drug."],
  ["Token type", "Each token is tagged by simple rules as a drug name, a frequency or timing phrase, a dose unit (mg, mL), a dose number (the 5 in 5 mg), another number, a route, a dosage form, or other. A few tags are wrong."],
];
function terms() {
  const dl = el("dl", "ab-terms");
  TERMS.forEach(([t, d]) => add(dl, el("dt", null, t), el("dd", null, d)));
  return dl;
}

export function startAtlas(root) {
  const base = (root.getAttribute("data-base") || "data/").replace(/\/?$/, "/");
  const embedEl = document.getElementById("atlas-embed");
  const embed = embedEl ? JSON.parse(embedEl.textContent) : null;
  const cache = new Map();
  function load(path) {
    if (cache.has(path)) return cache.get(path);
    const pr = embed
      ? Promise.resolve(path in embed ? embed[path] : null)
      : fetch(base + path).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    cache.set(path, pr);
    return pr;
  }

  let timer = 0;
  let M, rows = [], byId = new Map(), names = null, featured = [];
  let view = { kind: "featured" }, agreeOnly = false, order = [], entries = [], shown = 0, current = null, seqNo = 0, searchResult = null;
  const PAGE = 80;

  // ---------- layout ----------
  root.textContent = "";
  const termsTop = fold("Terms used here", [terms()], "ab-terms-top");
  termsTop.open = !window.matchMedia("(max-width: 560px)").matches;
  root.appendChild(termsTop);
  const layout = el("div", "ab-layout");
  const rail = el("aside", "ab-rail");
  rail.setAttribute("aria-label", "Units");
  const top = el("div", "ab-rail-top");
  const qLabel = el("label", "ab-label", "Search cards, drugs, drug classes or a unit");
  qLabel.htmlFor = "ab-q";
  const qBox = el("div", "ab-search");
  const q = el("input");
  Object.assign(q, { id: "ab-q", type: "search", placeholder: "warfarin, taper, L24N11536-high", autocomplete: "off", spellcheck: false });
  add(qBox, searchIcon(), q);
  const browseRow = el("div", "ab-row");
  const browseLbl = el("span", null, "Browse");
  browseLbl.id = "ab-browse-label";
  const seg = el("div", "ab-seg");
  seg.setAttribute("role", "group");
  seg.setAttribute("aria-labelledby", "ab-browse-label");
  const MODES = [["featured", "Featured"], ["section", "Label section"], ["type", "Token type"], ["class", "Drug class"], ["layer", "Step"], ["all", "All"]];
  const segBtns = MODES.map(([k, label]) => {
    const b = el("button", null, label);
    b.type = "button";
    b.dataset.kind = k;
    b.addEventListener("click", () => setBrowse(k));
    seg.appendChild(b);
    return b;
  });
  add(browseRow, browseLbl, seg);
  const sel = el("select", "ab-select");
  sel.hidden = true;
  sel.addEventListener("change", () => setView({ kind: view.kind, value: sel.value }));
  const agreeLbl = el("label", "ab-check");
  const agreeBox = el("input");
  agreeBox.type = "checkbox";
  agreeBox.addEventListener("change", () => { agreeOnly = agreeBox.checked; drawList(); });
  add(agreeLbl, agreeBox, el("span", null, "Only units whose strongest contexts agree with their selection reason"));
  const ctxNote = el("div", "ab-ctxnote");
  ctxNote.hidden = true;
  const count = el("p", "ab-count");
  count.setAttribute("aria-live", "polite");
  add(top, qLabel, qBox, browseRow, sel, ctxNote, agreeLbl, count);
  const listBox = el("div", "ab-scroller");
  const foot = el("div", "ab-rail-foot");
  add(rail, top, listBox, foot);
  const card = el("article", "ab-card");
  add(layout, rail, card);
  root.appendChild(layout);
  card.appendChild(el("p", "ab-loading", "Loading the atlas."));
  const controls = [q, agreeBox, sel, ...segBtns];
  controls.forEach((c) => (c.disabled = true));

  // ---------- data helpers ----------
  const N = () => M.neurons;
  const layerOf = (id) => Math.floor(id / (2 * N()));
  const signOf = (id) => Math.floor(id / N()) % 2;
  const neuronOf = (id) => id % N();
  const poleName = (id) => `L${layerOf(id)}N${neuronOf(id)}${signOf(id) ? "-" : "+"}`;
  const hashOf = (id) => `L${layerOf(id)}N${neuronOf(id)}-${signOf(id) ? "low" : "high"}`;
  const idOf = (layer, sign, neuron) => (layer * 2 + sign) * N() + neuron;
  const stepOf = (l) => l + 1;
  const stepLabel = (l) => `step ${stepOf(l)} of ${M.layers}`;
  function parseUnit(text) {
    const m = String(text).trim().match(/^#?L(\d{1,2})\s*N(\d{1,5})\s*(\+|-|-high|-low|high|low)?$/i);
    if (!m) return null;
    const l = +m[1], n = +m[2];
    if (l >= M.layers || n >= N()) return null;
    const s = m[3] && /^-($|low)|^low/i.test(m[3]) ? 1 : 0;
    return { id: idOf(l, s, n), both: !m[3] };
  }
  const has = (r, f) => (r.flags & M.flags[f]) !== 0;
  const secPlain = (k) => SECTION_PLAIN[M.sections.indexOf(k)] || k;
  const typePlain = (k) => TYPE_PLAIN[M.types.indexOf(k)] || k;
  const typeShort = (k) => typePlain(k).replace(/ \(.*\)$/, "").toLowerCase();
  function rank(a, b) {
    return (has(b, "agrees") - has(a, "agrees")) || (has(a, "near_silent") - has(b, "near_silent")) || (has(b, "card") - has(a, "card"))
      || ((b.score_top ?? -1) - (a.score_top ?? -1)) || a.id - b.id;
  }
  const drugName = (d) => (d[2] && d[2].toLowerCase() !== d[1].toLowerCase() ? `${d[2]} (${d[1]})` : d[1]);
  const className = (c) => c.replace(/ \[EPC\]$/, "");

  // ---------- list ----------
  function setBrowse(kind) {
    if (kind === "all" || kind === "featured") return setView({ kind });
    if (kind === "section") return setView({ kind, value: "0" });
    if (kind === "type") return setView({ kind, value: "4" });
    if (kind === "layer") return setView({ kind, value: String(current != null ? layerOf(current) : 0) });
    if (kind === "class") return setView({ kind, value: String(firstBigClass()) });
  }
  function firstBigClass() {
    const i = M.classesInfo.findIndex((c) => c[2] >= M.class_min_tokens && c[3] > 0);
    return i < 0 ? 0 : i;
  }
  function fillSelect() {
    sel.textContent = "";
    let opts = [];
    if (view.kind === "section") opts = SECTION_PLAIN.map((l, i) => [i, l]);
    else if (view.kind === "type") opts = TYPE_PLAIN.map((l, i) => [i, l]).filter(([i]) => i > 0);
    else if (view.kind === "layer") opts = Array.from({ length: M.layers }, (_, i) => [i, `Step ${stepOf(i)} of ${M.layers}` + (i === 0 ? ": the token has just been read" : i === M.layers - 1 ? ": the model chooses the next token" : "")]);
    else if (view.kind === "class") opts = M.classesInfo.map((c, i) => [i, className(c[0]) + (c[2] < M.class_min_tokens ? " (small class)" : "")]).filter(([i]) => M.classesInfo[i][3] > 0).sort((a, b) => a[1].localeCompare(b[1]));
    sel.hidden = !opts.length;
    opts.forEach(([v, l]) => { const o = el("option", null, l); o.value = String(v); sel.appendChild(o); });
    if (opts.length) sel.value = view.value;
    const label = { section: "Choose a label section", type: "Choose a token type", layer: "Choose a step", class: "Choose a drug class" }[view.kind];
    if (label) sel.setAttribute("aria-label", label);
  }
  async function setView(v) {
    clearTimeout(timer);
    view = v;
    if (v.kind !== "search" && q.value) q.value = "";
    segBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.kind === v.kind)));
    fillSelect();
    await drawList();
  }
  async function viewGroups() {
    const all = rows.filter((r) => !agreeOnly || has(r, "agrees"));
    const k = view.kind, v = +view.value;
    if (k === "featured") {
      const themes = [];
      featured.forEach(([id, theme]) => {
        const r = byId.get(id);
        if (!r || (agreeOnly && !has(r, "agrees"))) return;
        let g = themes.find((t) => t.name === theme);
        if (!g) themes.push((g = { name: theme, desc: themeNote(theme), items: [], keep: true }));
        g.items.push(r);
      });
      return themes;
    }
    if (k === "all") return [{ name: "All units with a card or a selection reason", items: all }];
    if (k === "section") return [
      { name: `Selected for ${SECTION_PLAIN[v]}`, items: all.filter((r) => r.reason_sections.includes(v)) },
      { name: `Fire most in ${SECTION_PLAIN[v]}, not selected for it`, items: all.filter((r) => r.top_section === v && !r.reason_sections.includes(v)) }];
    if (k === "type") return [
      { name: `Selected for ${typeShort(M.types[v])}`, items: all.filter((r) => r.reason_types.includes(v)) },
      { name: `Most selective for ${typeShort(M.types[v])}, not selected for it`, items: all.filter((r) => r.sel_type === v && !r.reason_types.includes(v)) }];
    if (k === "layer") return [{ name: `Step ${stepOf(v)} of ${M.layers}`, items: all.filter((r) => layerOf(r.id) === v) }];
    if (k === "class" || k === "drug") {
      const list = (await load(`${k === "class" ? "c" : "d"}/${view.value}.json`)) || [];
      const inIdx = list.filter((x) => byId.has(x[0])).map((x) => ({ ...byId.get(x[0]), lift: x[1] })).filter((r) => !agreeOnly || has(r, "agrees"));
      const others = agreeOnly ? [] : list.filter((x) => !byId.has(x[0])).map((x) => ({ id: x[0], name: "", flags: 0, plain: true, lift: x[1], group: -1 }));
      return [{ name: "With a card or a selection reason", items: inIdx, byLift: true }, { name: "Data only, no card", items: others, byLift: true, keep: true }];
    }
    if (k === "search") return searchResult ? searchResult.groups.map((g) => (g.items ? { ...g, items: g.items.filter((r) => !agreeOnly || has(r, "agrees")) } : g)) : [];
    return [];
  }
  function collapse(items) {
    const seen = new Map(), out = [];
    items.forEach((r) => {
      if (r.group >= 0 && seen.has(r.group)) { seen.get(r.group).more++; return; }
      const e = { r, more: 0 };
      if (r.group >= 0) seen.set(r.group, e);
      out.push(e);
    });
    return out;
  }
  async function drawList() {
    const seq = ++seqNo;
    const groups = await viewGroups();
    if (seq !== seqNo) return;
    entries = [];
    groups.forEach((g) => {
      if (g.links) { entries.push({ head: g.name, links: g.links }); return; }
      let items = g.items.slice();
      if (g.byLift) items.sort((a, b) => (has(b, "agrees") - has(a, "agrees")) || ((b.lift ?? 0) - (a.lift ?? 0)));
      else if (!g.keep) items.sort(rank);
      const col = collapse(items);
      if (col.length) entries.push({ head: g.name, desc: g.desc, total: col.length, items: col });
    });
    shown = PAGE;
    renderList();
    drawContext();
  }
  function flatItems() {
    const out = [];
    entries.forEach((g) => g.items && g.items.forEach((e) => out.push(e)));
    return out;
  }
  function renderList() {
    listBox.textContent = "";
    const flat = flatItems();
    order = flat.map((e) => e.r.id);
    const total = flat.length;
    count.textContent = "";
    if (view.kind === "search" && !total && !entries.some((g) => g.links)) add(count, "Nothing matches. Try fewer or shorter words.");
    else if (!total && entries.some((g) => g.links)) add(count, "Matches by name");
    else add(count, el("b", null, fmtInt(total)), total === 1 ? " unit" : " units", total > shown ? `, first ${fmtInt(shown)} shown` : "");
    let budget = shown, gi = 0;
    entries.forEach((g) => {
      const ul = el("ul", "ab-group"), gid = `ab-g${gi++}`;
      ul.setAttribute("aria-labelledby", gid);
      const h = el("li", "ab-ghead");
      h.setAttribute("role", "presentation");
      const hn = el("span", null, g.head);
      hn.id = gid;
      add(h, hn, el("span", null, g.links ? String(g.links.length) : fmtInt(g.total)));
      ul.appendChild(h);
      if (g.desc) {
        const d = el("li", "ab-gdesc", g.desc);
        d.setAttribute("role", "presentation");
        ul.appendChild(d);
      }
      if (g.links) {
        g.links.forEach((lk) => {
          const li = el("li"), b = el("button", "ab-item");
          b.type = "button";
          add(b, el("span", "nm", lk.label), add(el("span", "meta"), ...lk.meta));
          b.addEventListener("click", lk.go);
          li.appendChild(b);
          ul.appendChild(li);
        });
        listBox.appendChild(ul);
        return;
      }
      if (budget <= 0) return;
      g.items.slice(0, budget).forEach((e) => ul.appendChild(itemRow(e)));
      budget -= g.items.length;
      listBox.appendChild(ul);
    });
    if (total > shown) {
      const more = el("button", "ab-moreb", `Show ${fmtInt(Math.min(PAGE, total - shown))} more`);
      more.type = "button";
      more.addEventListener("click", () => {
        const keep = shown;
        shown += PAGE;
        renderList();
        const bs = buttons();
        if (bs[keep]) bs[keep].focus();
      });
      listBox.appendChild(more);
    }
    if (!total && !entries.some((g) => g.links) && view.kind !== "search") listBox.appendChild(el("p", "ab-empty", "No unit here."));
    markCurrent();
    drawPager();
  }
  function itemRow(e) {
    const r = e.r, li = el("li"), b = el("button", "ab-item");
    b.type = "button";
    b.dataset.id = r.id;
    const silent = has(r, "near_silent");
    const title = r.name && !silent ? r.name : silent ? "Near-silent unit" : "No card";
    b.appendChild(el("span", "nm" + (r.name && !silent ? "" : " none"), title));
    const meta = el("span", "meta");
    meta.appendChild(el("span", null, hashOf(r.id)));
    meta.appendChild(el("span", null, stepLabel(layerOf(r.id))));
    if (r.lift != null) meta.appendChild(el("span", null, `lift ${fmtRate(r.lift)}`));
    if (has(r, "agrees")) meta.appendChild(el("span", "ab-tag agree", "agrees with its reason"));
    if (e.more) meta.appendChild(el("span", "ab-tag more", `+${e.more} with the same card name`));
    b.appendChild(meta);
    b.addEventListener("click", () => select(r.id, true));
    li.appendChild(b);
    return li;
  }
  function buttons() { return Array.from(listBox.querySelectorAll(".ab-item[data-id]")); }
  function markCurrent() {
    const all = Array.from(listBox.querySelectorAll(".ab-item"));
    let any = false;
    all.forEach((b) => {
      const on = b.dataset.id != null && +b.dataset.id === current;
      if (on) { b.setAttribute("aria-current", "true"); any = true; } else b.removeAttribute("aria-current");
      b.tabIndex = on ? 0 : -1;
    });
    if (!any && all.length) all[0].tabIndex = 0;
  }
  listBox.addEventListener("keydown", (ev) => {
    const bs = Array.from(listBox.querySelectorAll(".ab-item"));
    const i = bs.indexOf(document.activeElement);
    if (i < 0) return;
    let j = -1;
    if (ev.key === "ArrowDown") j = Math.min(bs.length - 1, i + 1);
    else if (ev.key === "ArrowUp") j = Math.max(0, i - 1);
    else if (ev.key === "Home") j = 0;
    else if (ev.key === "End") j = bs.length - 1;
    if (j < 0) return;
    ev.preventDefault();
    bs.forEach((b) => (b.tabIndex = -1));
    bs[j].tabIndex = 0;
    bs[j].focus();
  });
  function drawContext() {
    ctxNote.textContent = "";
    ctxNote.hidden = !["drug", "class", "featured", "layer", "type"].includes(view.kind);
    if (ctxNote.hidden) return;
    const back = el("button", null, "Back to featured units");
    back.type = "button";
    back.addEventListener("click", () => setView({ kind: "featured" }));
    if (view.kind === "featured") {
      add(ctxNote, add(el("span"), el("b", null, "Featured units, by theme. "), `${featured.length} units with a strong score of at least 0.90, not near-silent, whose strongest contexts agree with their selection reason, come from many labels and are not one repeated sentence. A separate AI reviewer then read all 20 strongest contexts of each and kept it only if the card fits them. Themes the check could not fill are left out.`));
    } else if (view.kind === "layer") {
      add(ctxNote, el("span", null, "Every token passes through the same 36 processing steps in order. At step 1 the model's notes hold little more than the token itself; after step 36 it must choose the next token. Steps are layers 0 to 35."));
    } else if (view.kind === "type") {
      add(ctxNote, el("span", null, "Token types are tagged by simple rules (a number followed by mg is a dose number), so a few tags are wrong."));
    } else if (view.kind === "drug") {
      const d = names && names.drugs.find((x) => String(x[0]) === view.value);
      add(ctxNote, add(el("span"), "Units with the highest lift in the label of ", el("b", null, d ? drugName(d) : "this drug"), ". Lift says where in the label's wording a unit fires, not anything about the drug."), back);
    } else {
      const c = M.classesInfo[+view.value];
      add(ctxNote, add(el("span"), "Units with the highest lift in labels of ", el("b", null, className(c[0])), `: ${fmtInt(c[1])} labels, ${fmtInt(c[2])} tokens.`));
      if (c[2] < M.class_min_tokens) ctxNote.appendChild(el("span", "ab-flag", `Small class: under ${fmtInt(M.class_min_tokens)} tokens of label text, so these links reflect a few labels' wording, not the class's pharmacology.`));
      ctxNote.appendChild(back);
    }
  }

  // ---------- search ----------
  q.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(runSearch, 180); });
  q.addEventListener("keydown", (ev) => {
    if (ev.key === "ArrowDown") { const b = listBox.querySelector(".ab-item"); if (b) { ev.preventDefault(); b.focus(); } }
  });
  const STOP = new Set("a an the of in on to and or for with by at as is it its that this from be are was were not no into after before than then when where which".split(" "));
  async function idsForWord(w) {
    const key = w.slice(0, 2);
    let shards = M.split_prefixes.includes(key) ? (w.length >= 3 ? [w.slice(0, 3)] : M.shards.filter((s) => s.startsWith(key))) : [key];
    shards = shards.filter((s) => M.shards.includes(s));
    const out = new Set();
    const parts = await Promise.all(shards.map((s) => load(`q/${s}.json`)));
    parts.forEach((terms) => terms && Object.keys(terms).forEach((t) => { if (t.startsWith(w)) terms[t].forEach((id) => out.add(id)); }));
    return out;
  }
  async function runSearch() {
    const text = q.value.trim();
    if (!text) { searchResult = null; return setView({ kind: featured.length ? "featured" : "all" }); }
    const seq = ++seqNo;
    view = { kind: "search" };
    segBtns.forEach((b) => b.setAttribute("aria-pressed", "false"));
    sel.hidden = true;
    const groups = [];
    const unit = parseUnit(text);
    if (unit) {
      const ids = unit.both ? [unit.id, unit.id + N()] : [unit.id];
      groups.push({ name: "Unit", links: ids.map((id) => { const r = byId.get(id); return { label: r && r.name && !has(r, "near_silent") ? r.name : r && has(r, "near_silent") ? "Near-silent unit" : "No card", meta: [el("span", null, hashOf(id)), el("span", null, stepLabel(layerOf(id)))], go: () => select(id, true) }; }) });
    }
    const low = text.toLowerCase();
    if (low.length >= 2 && !unit) {
      if (!names) names = await load("names.json");
      if (names) {
        const dr = names.drugs.filter((d) => d[4] > 0 && ((d[1] || "").toLowerCase().includes(low) || (d[2] || "").toLowerCase().includes(low))).slice(0, 8);
        if (dr.length) groups.push({ name: "Drug labels", links: dr.map((d) => ({ label: drugName(d), meta: [el("span", null, `${d[4]} units by lift`)], go: () => setView({ kind: "drug", value: String(d[0]) }) })) });
        const cl = M.classesInfo.map((c, i) => [c, i]).filter(([c]) => c[3] > 0 && c[0].toLowerCase().includes(low)).slice(0, 6);
        if (cl.length) groups.push({ name: "Drug classes", links: cl.map(([c, i]) => ({ label: className(c[0]), meta: [el("span", null, `${fmtInt(c[1])} labels`), c[2] < M.class_min_tokens ? el("span", "ab-flag", "small class") : null], go: () => setView({ kind: "class", value: String(i) }) })) });
      }
    }
    const words = (low.match(/[a-z0-9]+/g) || []).filter((w) => w.length > 1 && !STOP.has(w));
    let hits = [];
    if (words.length && !unit) {
      const sets = await Promise.all(words.map(idsForWord));
      if (seq !== seqNo) return;
      sets.sort((a, b) => a.size - b.size);
      hits = [...sets[0]].filter((id) => sets.every((s) => s.has(id)) && byId.has(id)).map((id) => byId.get(id));
      const inName = (r) => words.every((w) => r.name.toLowerCase().includes(w));
      hits.sort((a, b) => (has(b, "agrees") - has(a, "agrees")) || (inName(b) - inName(a)) || rank(a, b));
    }
    if (seq !== seqNo) return;
    groups.push({ name: "Units whose card matches", items: hits, keep: true });
    searchResult = { groups };
    await drawList();
  }

  // ---------- unit ----------
  function narrow() { return window.matchMedia("(max-width: 900px)").matches; }
  async function select(id, fromList, focusHead) {
    current = id;
    const at = order.indexOf(id);
    if (at >= shown) { shown = Math.ceil((at + 1) / PAGE) * PAGE; renderList(); }
    markCurrent();
    try { history.replaceState(null, "", "#" + hashOf(id)); } catch (e) { /* the frame may refuse */ }
    await drawUnit();
    if (fromList && narrow()) card.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    if (focusHead || (fromList && narrow())) { const h = card.querySelector("h2"); if (h) h.focus({ preventScroll: true }); }
  }
  async function unitData(id) {
    if (byId.has(id)) return load(`u/${layerOf(id)}/${id}.json`);
    const shard = await load(`s/${layerOf(id)}-${signOf(id)}-${Math.floor(neuronOf(id) / M.block)}.json`);
    if (!shard) return null;
    const x = shard[neuronOf(id) % M.block];
    if (!names) names = await load("names.json");
    const S = M.sections.length, T = M.types.length;
    const sections = x.slice(0, S).map((v) => v / 100), types = x.slice(S, S + T).map((v) => v / 100);
    const drugMap = new Map((names?.drugs || []).map((d) => [d[0], d]));
    const dl = x[S + T + 4], cl = x[S + T + 5];
    const drugs = [];
    for (let i = 0; i < dl.length; i += 2) { const d = drugMap.get(dl[i]); if (d) drugs.push([d[0], d[1], d[2], dl[i + 1], null]); }
    const classes = [];
    for (let i = 0; i < cl.length; i += 2) { const c = M.classesInfo[cl[i]]; if (c) classes.push([c[0], cl[i + 1], null, c[1], c[2]]); }
    const tok = M.section_tokens, tot = tok.reduce((a, b) => a + b, 0);
    return {
      id, pole: poleName(id), layer: layerOf(id), sign: signOf(id) ? "-" : "+", neuron: neuronOf(id), summaryOnly: true,
      sections, types, rate: sections.reduce((a, v, i) => a + v * tok[i], 0) / tot, max_activation: x[S + T], lens: x[S + T + 1],
      near_silent: !!x[S + T + 2], web_top20: x[S + T + 3] / 20, drugs, classes, flagged: !!(x[S + T + 6] & 1),
    };
  }

  function block(title, nodes, sub) {
    const b = el("section", "ab-block");
    const h = el("h3", null, title);
    b.appendChild(h);
    if (sub) b.appendChild(el("p", "ab-hsub", sub));
    nodes.filter(Boolean).forEach((n) => b.appendChild(n));
    return b;
  }
  function bars(labels, vals, sepAt) {
    const topI = vals.indexOf(Math.max(...vals));
    const step = 25, dmax = Math.max(Math.ceil(Math.max(...vals, 40) / step) * step, step * 2);
    const ticksEvery = dmax > 400 ? 200 : dmax > 200 ? 100 : dmax > 100 ? 50 : step;
    const at = (v) => (100 * Math.min(v, dmax) / dmax) + "%";
    const chart = el("div", "ab-chart");
    chart.setAttribute("role", "list");
    labels.forEach((lab, i) => {
      const b = el("div", "ab-bar" + (i === topI ? " top" : "") + (sepAt === i ? " sep" : ""));
      b.setAttribute("role", "listitem");
      const tr = el("div", "ab-track"), f = el("div", "ab-fill"), ref = el("div", "ab-ref");
      f.style.width = at(vals[i]);
      ref.style.left = at(TYPICAL);
      tr.setAttribute("aria-hidden", "true");
      add(tr, f, ref);
      const v = el("span", "v", fmtRate(vals[i]));
      v.setAttribute("aria-label", `${fmtRate(vals[i])} per 1,000 tokens`);
      add(b, el("span", "lab", lab), tr, v);
      chart.appendChild(b);
    });
    const ax = el("div", "ab-axis"), ticks = el("div", "ticks");
    ax.setAttribute("aria-hidden", "true");
    ax.appendChild(el("span", "unit", "per 1,000 tokens"));
    for (let t = 0; t <= dmax; t += ticksEvery) {
      if (Math.abs(t - TYPICAL) < dmax / 7) continue;
      const s = el("span", null, String(t));
      s.style.left = at(t);
      if (t === dmax) s.style.transform = "translateX(-100%)";
      ticks.appendChild(s);
    }
    const bs = el("span", "b", `${TYPICAL} expected`);
    bs.style.left = at(TYPICAL);
    if (TYPICAL / dmax < 0.15) bs.style.transform = "none";
    ticks.appendChild(bs);
    add(ax, ticks, el("span"));
    chart.appendChild(ax);
    return chart;
  }
  function note(kind, nodes) {
    const n = el("div", "ab-note" + (kind === "warn" ? " warn" : ""));
    n.appendChild(ico(kind));
    n.appendChild(add(el("div"), ...nodes));
    return n;
  }
  function trow(kind, nodes) {
    const r = el("div", "ab-trow");
    r.appendChild(ico(kind));
    r.appendChild(add(el("div"), ...nodes.filter(Boolean)));
    return r;
  }
  function countRow(label, k, n, cls) {
    const r = el("div", "ab-mrow" + (cls ? " " + cls : "")), tr = el("div", "ab-track"), f = el("div", "ab-fill");
    f.style.width = Math.round((100 * k) / n) + "%";
    tr.setAttribute("aria-hidden", "true");
    tr.appendChild(f);
    add(r, el("span", null, label), tr, el("span", "v", `${k} of ${n}`));
    return r;
  }
  function shareRow(label, share, cls) {
    const r = el("div", "ab-mrow" + (cls ? " " + cls : "")), tr = el("div", "ab-track"), f = el("div", "ab-fill");
    f.style.width = Math.round((share || 0) * 100) + "%";
    tr.setAttribute("aria-hidden", "true");
    tr.appendChild(f);
    add(r, el("span", null, label), tr, el("span", "v", pct(share)));
    return r;
  }
  function mrow(label, share, cls) {
    const r = shareRow(label, share, cls), ref = el("div", "ab-ref");
    ref.style.left = "50%";
    r.querySelector(".ab-track").appendChild(ref);
    r.querySelector(".v").textContent = sc(share);
    return r;
  }
  function linkBtn(text, go) {
    const b = el("button", "ab-link", text);
    b.type = "button";
    b.addEventListener("click", go);
    return b;
  }

  function header(u, title, plain, byline) {
    const head = el("header", "ab-head"), topline = el("div", "ab-topline"), idrow = el("div", "ab-idrow");
    add(idrow, el("span", "ab-pid", hashOf(u.id)), el("span", "ab-step", `Step ${stepOf(u.layer)} of ${M.layers}`));
    add(topline, idrow, el("div", "ab-pager"));
    head.appendChild(topline);
    const h2 = el("h2", title.muted ? "muted" : null, title.text);
    h2.tabIndex = -1;
    head.appendChild(h2);
    if (plain) head.appendChild(el("p", "ab-plain", plain));
    if (byline) head.appendChild(el("p", "ab-byline", byline));
    head.appendChild(stepStrip(u.layer));
    head.appendChild(fold("How to read a card, and the terms used here", [guideLead(), terms()], "ab-guide"));
    return head;
  }
  function stepStrip(layer) {
    const box = el("figure", "ab-steps"), g = el("div", "ab-steps-bar");
    g.setAttribute("aria-hidden", "true");
    for (let i = 0; i < M.layers; i++) g.appendChild(el("i", i === layer ? "on" : i < layer ? "past" : null));
    const ends = el("div", "ab-steps-ends");
    ends.setAttribute("aria-hidden", "true");
    add(ends, el("span", null, "Step 1: the token has just been read"), el("span", null, `Step ${M.layers}: the model chooses the next token`));
    const cap = el("figcaption", null, `This unit sits at step ${stepOf(layer)} of the ${M.layers} steps every token passes through.`);
    add(box, g, ends, cap);
    return box;
  }
  function guideLead() {
    return el("p", "ab-cap", "Read the card from the top: what the unit fires on, where in the labels it fires, why it was selected and whether its strongest contexts agree, then how far to trust the card. A card describes the unit's strongest firing; most of its firing is weaker and less specific. The strip under the title shows where the unit sits among the 36 processing steps every token passes through. The terms are defined below.");
  }
  function facts(u, third) {
    const dl = el("dl", "ab-facts");
    const fact = (dt, dd, small) => {
      const d = el("div"), v = el("dd", "num", dd);
      if (small) v.appendChild(el("small", null, small));
      add(d, el("dt", null, dt), v);
      dl.appendChild(d);
    };
    const ti = u.sections.indexOf(Math.max(...u.sections));
    fact("Fires most in", SECTION_PLAIN[ti], `${fmtRate(u.sections[ti])} per 1,000 tokens`);
    fact("Overall firing rate", `${fmtRate(u.rate)} per 1,000 tokens`, `Expected rate ${TYPICAL}`);
    if (third) fact(...third);
    return dl;
  }
  function silentNote(u, hadCard) {
    return note("warn", [el("b", null, "Near-silent unit, shown for completeness. "),
      `Its largest activation size anywhere in the corpus is ${Math.abs(u.max_activation)}, below the cut of 0.05. Its threshold is set from its own values, so it still fires on a share of tokens, at very small values: a repeatable but tiny signal, mostly at positions inside words. Its rates and contexts are shown as data.`
      + (hadCard ? " A card was written for it before near-silent units were excluded from the selection. The page does not show that card, because a signal this small says little about the unit; the card stays in the public data files." : "")]);
  }
  function repeatNotes(u) {
    const c = u.check || {}, out = [];
    if (c.repeated_sentence) out.push(note("warn", [el("b", null, "Same sentence, word for word, with the same lead-in. "),
      `One identical passage (30 tokens before the firing token, the token and 8 after) appears in ${c.repeated_window_max} of its 20 strongest contexts, probably one sentence copied across labels. The unit may respond to that sentence rather than to a general pattern.`]));
    if (c.nearby_wording_repeated) out.push(note("warn", [el("b", null, "Same nearby wording. "),
      `The same nine or so words around the firing token (4 tokens before, the token and 4 after) appear in ${c.nearby_wording_max} of its 20 strongest contexts.`]));
    return out;
  }
  function lensChips(u) {
    const ch = el("span", "ab-chips");
    (u.lens || []).forEach((w) => ch.appendChild(el("span", "ab-chip", w.trim() ? w : "(space)")));
    return ch;
  }
  function drugsAndClasses(u) {
    const nodes = [];
    if (u.drugs && u.drugs.length) {
      const wrap = el("div", "ab-table-wrap"), t = el("table", "ab-table"), hd = el("tr");
      add(hd, el("th", null, "Drug label"), el("th", "n", "Lift"), el("th", "n", "Firings"));
      t.appendChild(add(el("thead"), hd));
      const tb = el("tbody");
      u.drugs.forEach((d) => {
        const tr = el("tr");
        add(tr, add(el("td"), linkBtn(drugName([d[0], d[1], d[2]]), () => setView({ kind: "drug", value: String(d[0]) }))), el("td", "n", fmtRate(d[3])), el("td", "n", d[4] == null ? "" : fmtInt(d[4])));
        tb.appendChild(tr);
      });
      t.appendChild(tb);
      wrap.appendChild(t);
      nodes.push(el("p", "ab-sub", "Drug labels with the highest lift"), wrap);
    }
    if (u.classes && u.classes.length) {
      const wrap = el("div", "ab-table-wrap"), t = el("table", "ab-table"), hd = el("tr");
      add(hd, el("th", null, "Drug class"), el("th", "n", "Lift"), el("th", "n", "Labels"), el("th", "n", "Tokens"));
      t.appendChild(add(el("thead"), hd));
      const tb = el("tbody");
      u.classes.forEach((c) => {
        const tr = el("tr"), small = c[4] < M.class_min_tokens, i = M.classesInfo.findIndex((x) => x[0] === c[0]);
        const cell = add(el("td"), i >= 0 ? linkBtn(className(c[0]), () => setView({ kind: "class", value: String(i) })) : className(c[0]));
        if (small) add(cell, el("br"), el("span", "ab-flag", "Small class: not evidence about its pharmacology"));
        add(tr, cell, el("td", "n", fmtRate(c[1])), el("td", "n", fmtInt(c[3])), el("td", "n", fmtInt(c[4])));
        tb.appendChild(tr);
      });
      t.appendChild(tb);
      wrap.appendChild(t);
      nodes.push(el("p", "ab-sub", "Drug classes"), wrap);
    }
    if (!nodes.length) return null;
    nodes.push(el("p", "ab-cap", `Lift is the unit's firing rate in that label text divided by its rate in the rest of the corpus. It says where in the label wording the unit fires, not anything about the drug. A class with under ${fmtInt(M.class_min_tokens)} tokens of label text rests on a few labels and is not read as pharmacology.`));
    return block("Drugs and drug classes", nodes);
  }
  function reasonBlock(u) {
    const c = u.check || {}, out = [];
    (u.reasons || []).forEach((r) => {
      const box = el("div", "ab-reason"), why = el("p", "why");
      let strict, line, need;
      if (r.kind === "token") {
        const lab = typeShort(r.what);
        const n = (c.token_top20_each || {})[r.what] ?? 0;
        strict = n >= STRICT.token;
        add(why, el("b", null, "Selected for a token type. "), `It fires on ${lab} ${fmtRate(r.ratio)} times as often as on other tokens (ratio ${fmtRate(r.ratio)}).`);
        line = `The tagger marks ${n} of its 20 strongest contexts as ${lab}.`;
        if (u.selected_type && u.selected_type.type === r.what && u.selected_type.firing_share != null) line += ` ${pct(u.selected_type.firing_share)} of all its firing is on ${lab}.`;
        need = `${STRICT.token} or more of 20`;
      } else if (r.kind === "section") {
        const n = (c.section_top20_each || {})[r.what] ?? 0;
        strict = n >= STRICT.section;
        add(why, el("b", null, "Selected for a label section. "), `It fires ${fmtRate(r.ratio)} times as often in ${secPlain(r.what)} as in the other label sections.`);
        line = `${n} of 20 strongest contexts are in this section.`;
        need = `${STRICT.section} or more of 20`;
      } else if (r.kind === "class") {
        strict = !!c.strict_class;
        add(why, el("b", null, "Selected for a drug class. "), `It fires ${fmtRate(r.ratio)} times as often in labels of ${className(r.what)} as in other labels (ratio ${fmtRate(r.ratio)}; the lift in the table below compares with the whole corpus instead).`);
        line = `${c.class_top20 ?? 0} of 20 strongest contexts are in this class's labels, from ${c.class_top20_labels ?? 0} different ${c.class_top20_labels === 1 ? "label" : "labels"}.`;
        if (c.class_top_label_share != null) line += ` One label supplies ${pct(c.class_top_label_share)} of its firing in this class; without that label the ratio is ${fmtRate(c.class_lift_without_top_label)}.`;
        need = `${STRICT.class} or more of 20, from at least 2 labels`;
      } else {
        const n = c.web_top20 != null ? Math.round(c.web_top20) : Math.round((u.web_top20 || 0) * 20);
        strict = n <= STRICT.medication;
        add(why, el("b", null, "Selected for label text in general. "), `It fires ${fmtRate(r.ratio)} times as often in label text as in general web text.`);
        line = `${n} of its 20 strongest contexts are general web text.`;
        need = `at most ${STRICT.medication} of 20 in web text`;
      }
      box.appendChild(why);
      box.appendChild(el("p", null, line));
      box.appendChild(add(el("p", "ab-verdict"), ico(strict ? "ok" : "no"), el("span", null, strict
        ? `Its strongest contexts agree with this reason (${need}).`
        : `Its strongest contexts do not agree with this reason (that needs ${need}). The reason describes its everyday firing; the card describes its strongest firing, which lies elsewhere.`)));
      if ((r.kind === "section" || r.kind === "class") && u.selectivity != null && u.selectivity < 1) {
        box.appendChild(add(el("p", "ab-verdict"), ico("warn"), el("span", null, `It fires more in general web text than in label text (ratio ${fmtRate(u.selectivity)}). The rule that selected it compared label text with other label text only.`)));
      }
      if (r.kind === "class") {
        const ci = M.classesInfo.find((x) => x[0] === r.what);
        if (ci && ci[2] < M.class_min_tokens) box.appendChild(add(el("p", "ab-verdict"), ico("warn"), el("span", null, `Small class: ${fmtInt(ci[2])} tokens of label text in ${fmtInt(ci[1])} labels. Below ${fmtInt(M.class_min_tokens)} tokens a class link reflects a few labels' wording, not the class's pharmacology.`)));
      }
      out.push(box);
    });
    if (!out.length) return null;
    return block(out.length === 1 ? "Why it was selected" : `Why it was selected: ${out.length} reasons`, out, "Selection used firing across the whole corpus; the card was written from the strongest contexts. Each reason is checked against those 20 contexts.");
  }
  function trustBlock(u) {
    const s = u.scores || {}, rows = [], sb = M.score_baseline;
    const lead = el("p", "ab-trust-lead");
    add(lead, el("b", null, "What the scores measure. "),
      "The strong score measures whether a reader given only the card can recognize the unit's strongest firing. The threshold score measures its everyday firing, near the threshold, and across the atlas cards predict that little better than chance"
      + (sb ? ` (mean threshold score ${sc(sb.cards.everyday)}, string-matching baseline ${sc(sb.baseline.everyday)}).` : ".")
      + " Each score rests on 10 firing and 10 quiet tokens, so one card's score is coarse: its standard error is about 0.06 from the small number of test items, and about 0.1 once the scorer's own variation is included.");
    rows.push(add(el("div", "ab-trow ab-trow-lead"), lead));
    const hasBase = s.baseline_score_top != null;
    const scoreRow = (label, score, hits, n, fa, nq, base, bHits, bFa) => {
      const p = el("p");
      add(p, el("b", null, `${label} ${sc(score)}`), hits != null ? ` (recognized ${hits} of ${n}, wrongly marked ${fa} of ${nq} quiet tokens)` : "",
        `; string-matching baseline ${sc(base)}`, bHits != null ? ` (${bHits} of ${n}, ${bFa} of ${nq})` : "", "; chance 0.50.");
      return p;
    };
    if (s.score_top != null && hasBase) {
      const mini = el("div", "ab-mini");
      add(mini, mrow("Card, strong", s.score_top), mrow("Baseline, strong", s.baseline_score_top, "quiet"), mrow("Card, threshold", s.score), mrow("Baseline, threshold", s.baseline_score, "quiet"));
      mini.appendChild(el("span", "ab-small", "Balanced accuracy. Dashed line: chance, 0.50."));
      const gain = Math.round((s.score_top - s.baseline_score_top) * 100) / 100;
      rows.push(trow(gain >= 0.1 ? "ok" : "info", [
        scoreRow("Strong score", s.score_top, s.hits_top, s.n_top, s.false_alarms, s.n_quiet, s.baseline_score_top, s.baseline_hits_top, s.baseline_false_alarms),
        scoreRow("Threshold score", s.score, s.hits, s.n_fire, s.false_alarms, s.n_quiet, s.baseline_score, s.baseline_hits, s.baseline_false_alarms),
        mini,
        el("p", "ab-small", gain >= 0.1 ? "On strong firing the card beats the string-matching baseline by 0.10 or more." : gain > 0 ? "On strong firing the card beats the string-matching baseline by less than 0.10, which is within the uncertainty of one card's score." : "On strong firing the card does no better than the string-matching baseline."),
      ]));
    } else if (s.score_top != null) {
      rows.push(trow("info", [el("p", null, "This card was scored, but the string-matching baseline for this unit is not available yet, so its score is not shown.")]));
    }
    if (s.near_duplicates != null && s.n_top) {
      rows.push(trow(s.near_duplicates > 0 ? "warn" : "ok", [el("p", null, s.near_duplicates > 0
        ? `${s.near_duplicates} of the ${s.n_top} held-out strongest contexts repeat a sentence the writer saw, which makes them easier to recognize.`
        : `None of the ${s.n_top} held-out strongest contexts repeats a sentence the writer saw.`)]));
    }
    if (s.peak_ratio != null || s.activation_quintile != null) {
      const parts = [];
      if (s.peak_ratio != null) parts.push(`Peak ratio ${fmtRate(s.peak_ratio)}: its strongest activations are ${fmtRate(s.peak_ratio)} times its typical firing activation, so the card describes firing ${s.peak_ratio >= 2 ? "far stronger than" : "only a little stronger than"} its everyday firing.`);
      if (s.activation_quintile != null) parts.push(`Its largest activation size is in quintile ${s.activation_quintile} of 5 among the units at its step.`);
      rows.push(trow("info", [el("p", null, parts.join(" "))]));
    }
    if (s.reliability_tier) {
      const defs = M.reliability_tiers || {};
      rows.push(trow(s.reliability_tier === "high" ? "ok" : s.reliability_tier === "low" ? "warn" : "info", [add(el("p"), el("b", null, `Reliability: ${s.reliability_tier}. `), defs[s.reliability_tier] || "")]));
    }
    if (hasBase && s.control_score_top != null) rows.push(trow("info", [el("p", null, `Wrong-unit control: scored with another unit's card, ${sc(s.control_score_top)} strong and ${sc(s.control_score)} threshold, against chance 0.50. A control runs above chance when the other unit fires on the same kind of token.`)]));
    if (s.verbatim != null) rows.push(trow(s.verbatim >= 1 ? "ok" : "warn", [el("p", null, s.verbatim >= 1 ? "Every quotation on this card was checked and matches the source text exactly." : `${pct(s.verbatim)} of the quotations on this card match the source text exactly; the rest were reworded by the writer.`)]));
    const rec = M.recognition;
    if (rec && rec.tenths) {
      const mini = el("div", "ab-mini");
      mini.appendChild(mrow("Held-out strongest", rec.strongest_held_out.share));
      for (let d = 1; d <= 10; d++) mini.appendChild(mrow(d === 1 ? "Tenth 1, strongest" : d === 10 ? "Tenth 10, weakest" : `Tenth ${d}`, rec.tenths[String(d)].share, "quiet"));
      mini.appendChild(mrow("Quiet tokens", rec.quiet.share, "quiet"));
      mini.appendChild(el("span", "ab-small", "Share of test tokens marked as firing, pooled over all cards. Dashed line: 0.50."));
      const base = sb ? ` Mean strong score ${sc(sb.cards.strong)} against a string-matching baseline of ${sc(sb.baseline.strong)}; mean threshold score ${sc(sb.cards.everyday)} against ${sc(sb.baseline.everyday)}.` + (sb.test_contexts_repeating ? ` About ${pct(sb.test_contexts_repeating)} of held-out strongest contexts repeat a sentence the writer saw.` : "") : "";
      rows.push(trow("info", [el("p", null, `All ${fmtInt(rec.cards)} cards, by position in each unit's firing range (sampled firing tokens split into tenths by activation).${base}`), mini]));
    }
    const box = el("div", "ab-trust");
    rows.forEach((r) => box.appendChild(r));
    return block("How far to trust this card", [box]);
  }
  function examplesFold(u) {
    if (!u.contexts || !u.contexts.length) return null;
    const ol = el("ol", "ab-ctx");
    const hd = el("li", "h");
    hd.setAttribute("aria-hidden", "true");
    add(hd, el("span", "val", "Activation"), el("span", null, "Context, firing token highlighted"));
    ol.appendChild(hd);
    u.contexts.forEach((c) => {
      const li = el("li"), body = el("div");
      body.appendChild(snippet(c[1]));
      if (c.length > 2 && (c[2] || c[3])) body.appendChild(el("span", "src", c[2] ? `${c[2]} label${c[3] ? ", " + secPlain(c[3]).toLowerCase() : ""}` : "General web text"));
      add(li, el("span", "val", Number(c[0]).toFixed(2)), body);
      ol.appendChild(li);
    });
    return fold(`All ${u.contexts.length} strongest contexts`, [ol]);
  }
  function techFold(u) {
    const dl = el("dl", "ab-tech");
    const row = (k, v) => { if (v == null || v === "") return; add(dl, el("dt", null, k), el("dd", null, String(v))); };
    row("Technical name", `${u.pole}: the ${u.sign === "+" ? "high" : "low"} pole of neuron ${fmtInt(u.neuron)} in layer ${u.layer} (step ${stepOf(u.layer)} of ${M.layers})`);
    row("Largest activation", u.max_activation + (u.sign === "-" ? " (a low unit: its strongest values are negative)" : ""));
    if (u.selectivity != null) row("Label text against web text", `ratio ${fmtRate(u.selectivity)}`);
    if (u.firing_split && u.firing_split.edges && u.firing_split.edges.length) {
      const e = u.firing_split.edges;
      row("Sampled firing", `fires on ${pct(u.firing_split.fire_share)} of ${fmtInt(u.firing_split.sampled)} random tokens; firing activations from ${e[0]} (strongest) to ${e[e.length - 1]} (weakest), median ${e[5]}`);
    }
    row("Firing per 1,000 tokens by token type", M.types.map((t, i) => `${typeShort(t)} ${fmtRate(u.types[i])}`).join(", "));
    if (u.reasons && u.reasons.length) row("Selection rules", u.reasons.map((r) => `${r.kind}${r.what ? " " + r.what : ""}, ratio ${r.ratio}`).join("; "));
    return fold("Technical details", [dl]);
  }
  function sameBlock(u) {
    if (!u.same || !u.same.length) return null;
    const ul = el("ul", "ab-list");
    u.same.forEach(([id, name]) => ul.appendChild(add(el("li"), add(el("span"), linkBtn(name, () => select(id, false, true)), ` ${hashOf(id)}`))));
    const n = u.same_total ?? u.same.length;
    const more = n > u.same.length ? el("p", "ab-cap", `The first ${u.same.length} are listed.`) : null;
    return block(`${fmtInt(n)} other ${n === 1 ? "unit has" : "units have"} a card with the same name`, [ul, more], "Lists show units with the same card name once, under the first of them.");
  }

  async function drawUnit() {
    const id = current;
    card.textContent = "";
    card.appendChild(el("p", "ab-loading", "Loading the unit."));
    const u = await unitData(id);
    if (id !== current) return;
    card.textContent = "";
    if (!u) {
      card.appendChild(el("p", "ab-loading", M.sample ? "This unit is not in this sample of the atlas. The full atlas has a page for every one of its 884,736 units." : "This unit could not be loaded."));
      drawPager();
      return;
    }
    const c = u.near_silent ? null : u.card;
    if (c) card.appendChild(header(u, { text: c.name }, c.plain, "Card written by Claude Sonnet from 10 of the unit's 20 strongest contexts. Claude Haiku scored it on the other 10, on 10 everyday firing tokens and on 10 quiet tokens."));
    else card.appendChild(header(u, { text: u.near_silent ? "Near-silent unit" : "No card", muted: true },
      u.near_silent ? null : u.flagged ? "This unit was selected but has no card. Its data are below." : "Only the 30,529 selected units have a card. This unit's data are below.", null));
    const notes = el("div", "ab-notes");
    if (u.featured) notes.appendChild(note("info", [el("b", null, `Featured: ${u.featured.theme}. `), "A separate AI reviewer read all 20 of this unit's strongest contexts and kept it for this theme because the card fits them."]));
    if (u.near_silent) notes.appendChild(silentNote(u, !!u.card));
    repeatNotes(u).forEach((n) => notes.appendChild(n));
    if (c && c.no_clear_pattern) notes.appendChild(note("info", ["The writer found no clear pattern in this unit's strongest contexts."]));
    if (notes.childNodes.length) card.appendChild(notes);
    const s = u.scores || {};
    card.appendChild(facts(u, c && s.score_top != null && s.baseline_score_top != null ? ["Strong score", sc(s.score_top), `String-matching baseline ${sc(s.baseline_score_top)}; chance 0.50`] : ["Largest activation size", String(Math.abs(u.max_activation)), u.near_silent ? "Below the 0.05 cut" : "Anywhere in the corpus, ignoring sign"]));
    if (c) {
      const fp = el("p", "ab-fires");
      fp.appendChild(snippet(c.fires_on, "x"));
      card.appendChild(block("Fires on", [fp]));
      if ((c.modes || []).length) {
        const ul = el("ul", "ab-list");
        c.modes.forEach((m) => {
          const li = el("li"), d = el("p");
          add(d, el("span", "ab-lbl", m.label + ". "), m.description);
          li.appendChild(d);
          if (m.example) li.appendChild(snippet(m.example, "ab-q ab-quote"));
          ul.appendChild(li);
        });
        card.appendChild(block(c.modes.length === 1 ? "One pattern" : `${c.modes.length} separate patterns`, [ul]));
      }
      card.appendChild(block("What it pushes the model toward", [el("p", null, cap(c.writes || "No statement.")), el("p", "ab-sub", "Tokens its output most directly promotes"), lensChips(u),
        el("p", "ab-cap", "Promoted tokens are often unreadable for units in the first steps, because their effect passes through many later steps before the model chooses a token.")]));
    } else {
      card.appendChild(block("Tokens its output most directly promotes", [lensChips(u), el("p", "ab-cap", "Often unreadable for units in the first steps.")]));
    }
    card.appendChild(block("Where it fires", [bars(SECTION_PLAIN, u.sections, M.sections.length - 1),
      el("p", "ab-cap", `Firing per 1,000 tokens in each label section and in general web text. The dashed line is the expected rate of ${TYPICAL}: on the reference text its threshold was set on, every unit fires on about 30 of every 1,000 tokens.`)]));
    const tl = TYPE_PLAIN.slice(1).concat([TYPE_PLAIN[0]]), tv = u.types.slice(1).concat([u.types[0]]);
    card.appendChild(block("Firing by token type", [bars(tl, tv, tl.length - 1),
      el("p", "ab-cap", `Firing per 1,000 tokens of each type, against the expected rate of ${TYPICAL}. Types are tagged by rule, so a few tags are wrong.`)]));
    const rb = reasonBlock(u);
    if (rb) card.appendChild(rb);
    if (c && (c.evidence || []).length) {
      const ev = el("ul", "ab-list");
      c.evidence.forEach((t) => ev.appendChild(add(el("li"), snippet(t, "ab-q ab-quote"))));
      card.appendChild(block("Evidence, quoted from the text", [ev]));
    }
    const dc = drugsAndClasses(u);
    if (dc) card.appendChild(dc);
    if (c) card.appendChild(trustBlock(u));
    const sb = sameBlock(u);
    if (sb) card.appendChild(sb);
    if (u.summaryOnly) card.appendChild(block("Contexts", [el("p", "ab-cap", "Strongest contexts are published for the 30,529 selected units and for the 502 near-silent units that had an early card. For the other units the site keeps the rates above, to stay small.")]));
    const ef = examplesFold(u);
    if (ef) card.appendChild(ef);
    card.appendChild(techFold(u));
    drawPager();
  }

  function drawPager() {
    const pager = card.querySelector(".ab-pager");
    if (!pager) return;
    pager.textContent = "";
    const back = el("button", "ab-back");
    back.type = "button";
    add(back, icon(ICON.up), "Unit list");
    back.addEventListener("click", () => { rail.scrollIntoView({ block: "start" }); q.focus({ preventScroll: true }); });
    pager.appendChild(back);
    const pos = order.indexOf(current);
    if (pos < 0) return;
    const mk = (label, path, dis, d) => {
      const b = el("button");
      b.type = "button";
      b.setAttribute("aria-label", label);
      b.appendChild(icon(path));
      b.disabled = dis;
      b.addEventListener("click", async () => {
        await select(order[order.indexOf(current) + d]);
        const again = card.querySelector(`.ab-pager button[aria-label="${label}"]`);
        if (again && !again.disabled) again.focus();
      });
      return b;
    };
    add(pager, mk("Previous unit", ICON.prev, pos === 0, -1), el("span", "num", `${fmtInt(pos + 1)} of ${fmtInt(order.length)}`), mk("Next unit", ICON.next, pos === order.length - 1, 1));
  }

  function fromHash() {
    const u = parseUnit((location.hash || "").slice(1));
    return u ? u.id : null;
  }
  window.addEventListener("hashchange", () => { if (!M) return; const id = fromHash(); if (id != null && id !== current) select(id); });

  // ---------- start ----------
  (async () => {
    M = await load("meta.json");
    const idx = await load("index.json");
    if (!M || !idx) { card.textContent = ""; card.appendChild(el("p", "ab-loading", "The atlas could not be loaded.")); return; }
    const ix = Object.fromEntries(idx.cols.map((c, i) => [c, i]));
    rows = idx.rows.map((r) => ({ id: r[ix.id], name: r[ix.name], group: r[ix.group], flags: r[ix.flags], score_top: r[ix.score_top], score: r[ix.score], top_section: r[ix.top_section], sel_type: r[ix.sel_type], reason_sections: r[ix.reason_sections], reason_types: r[ix.reason_types] }));
    rows.forEach((r) => byId.set(r.id, r));
    controls.forEach((c) => (c.disabled = false));
    names = await load("names.json");
    M.classesInfo = names ? names.classes : [];
    featured = (await load("featured.json")) || [];
    foot.textContent = "";
    add(foot, `${fmtInt(M.cards)} units have a card. Every one of the ${fmtInt(M.layers * 2 * N())} units has a page with its firing rates; type a name such as L24N11536-high.`, add(el("span", "ab-kbd"), " Arrow keys move through the list."));
    current = fromHash();
    const linked = current != null;
    await setView({ kind: featured.length ? "featured" : "all" });
    if (current == null) current = order[0];
    markCurrent();
    await drawUnit();
    if (linked && narrow()) card.scrollIntoView({ block: "start" });
  })();
}

const root = document.querySelector("[data-atlas-browse]");
if (root) startAtlas(root);
