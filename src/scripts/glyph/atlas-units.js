// Pereste glyph art: atlas-units. ES module; imports the shared engine from ./glyph-engine.js.
// Built by build_dist.py from ../pieces/atlas-units.js; edit the source, not this file.
import { GlyphArt } from "./glyph-engine.js";

(function (window) {
// One unit of the model at a time, as the atlas shows it. A plate of letter tiles in the middle
// names the unit and says in a few words what it fires on, and words of that kind in the label
// text around it are lit as tiles in its color. Three units from the posts take turns.
(function () {
  const G = window.GlyphArt, P = G.P;

  // Filler for the faint field: label wording with no numbers, no measures and no words for
  // lowering, stopping or changing a drug, so nothing in it could be taken for a firing word.
  const DRUGS = ["warfarin", "metformin", "lisinopril", "amlodipine", "atorvastatin", "methotrexate", "levothyroxine"];
  const WORDS = DRUGS.concat([
    "of", "or", "by", "at", "in", "to", "the", "and", "per", "for", "day", "dose", "with", "oral",
    "once", "each", "week", "food", "meals", "daily", "doses", "usual", "renal", "tablet", "orally",
    "weekly", "dosage", "tablets", "capsules", "by mouth", "the INR", "once daily", "once weekly",
    "with food", "initial dose", "the usual dose", "warfarin sodium", "blood counts",
    "renal function", "administration", "in divided doses", "film-coated", "maintenance dose",
    "at bedtime", "as directed", "hepatic", "serum levels", "the same day",
  ]);
  const hasDrug = (s) => DRUGS.some((d) => s.indexOf(d) >= 0);

  // Firing words are placed on a staggered lattice around the plate, dose phrases and taper words
  // alternating, so each unit's tiles spread evenly over the field. Not every match is lit.
  const DOSES = ["2.5 mg", "10 mg", "5 mL", "500 mg", "1 mg", "20 mg", "0.5 mg", "40 mg", "7.5 mg", "25 mg", "2 mg", "15 mL", "100 mg"];
  const TAPERS = ["stop", "reduce", "discontinue", "lower", "adjust", "stop", "reduce", "lower", "discontinue", "adjust"];

  const UNITS = [
    { name: "dose unit", id: "L23N10618-high", note: "a measure after a dose", bg: P.teal, fg: P.white },
    { name: "dose number", id: "L32N1547-low", note: "a number before mg", bg: P.tealLight, fg: P.ink },
    { name: "tapering", id: "L11N863-high", note: "stop, reduce, discontinue", bg: P.indigo, fg: P.soft },
  ];
  const head = (u) => u.name + "  " + u.id;
  const PW = 2 + Math.max.apply(null, UNITS.map((u) => Math.max(head(u).length, u.note.length)));

  // Each unit holds for H seconds, fades out over F, and the next fades in over F.
  const H = 6.2, F = 0.9, STEP = H + 2 * F, LOOP = STEP * UNITS.length;
  function level(k, t) {
    const x = (((t - k * STEP) % LOOP) + LOOP) % LOOP;
    if (x <= H) return 1;
    if (x < H + F) return 1 - G.smooth(H, H + F, x);
    if (x >= LOOP - F) return G.smooth(LOOP - F, LOOP, x);
    return 0;
  }

  // One field alpha, cleared behind the plate through NF shared steps.
  const NF = 12, FIELDS = [];
  for (let i = 0; i <= NF; i++) FIELDS.push(i ? { color: P.ink, alpha: (0.1 * i) / NF } : { color: null });
  const EMPTY = FIELDS[0];
  const TILES = UNITS.map((u) => ({ bg: u.bg, color: u.fg, alpha: 1, weight: 500 }));
  const INK = { bg: P.ink }, QS = 24, QUIET = 0.55;

  function fill(n, seed) {
    if (n < 2) return " ".repeat(Math.max(0, n));
    let s = "", k = 0, last = "";
    while (s.length < n) {
      const rem = n - s.length, sep = s ? 1 : 0;
      if (rem - sep < 2 || k > 60) {
        s += " ".repeat(rem);
        break;
      }
      const w = WORDS[Math.floor(G.hash(seed, k++, 9) * WORDS.length)], need = sep + w.length;
      if (w === last || (w.length < 4 && last.length < 4 && k < 40)) continue;
      if (need === rem || rem - need >= 3) {
        s += (sep ? " " : "") + w;
        last = w;
        continue;
      }
      const ex = WORDS.filter((x) => x.length === rem - sep);
      if (ex.length) {
        s += (sep ? " " : "") + ex[Math.floor(G.hash(seed, k++, 11) * ex.length)];
        break;
      }
    }
    return s;
  }
  // A filler run whose words next to a taper word are not drug names, so no line reads as
  // "reduce lisinopril".
  function fillClean(n, seed, cleanHead, cleanTail) {
    for (let i = 0; i < 24; i++) {
      const s = fill(n, seed + i * 101);
      const t = s.trim();
      if ((!cleanHead || !hasDrug(t.slice(0, 16))) && (!cleanTail || !hasDrug(t.slice(-16)))) return s;
    }
    return " ".repeat(Math.max(0, n));
  }

  G.register({
    id: "atlas-units",
    title: "One unit firing",
    line: "A plate of letter tiles names one unit of the model and what it fires on, and words of the kind it fires on in the drug label text around it are lit in its color, for three units in turn.",
    ground: "wash",
    split: true,
    animated: true,
    restT: 0,
    tokens: function (env) {
      const fs = G.clamp(Math.floor(Math.min(env.w / 30, env.h / 21.5) * 2) / 2, 10, 13);
      env.ctx.font = "400 " + fs + "px " + env.MONO;
      const cw = env.ctx.measureText("0").width, lh = fs * 1.8;
      let rows = Math.floor(env.h / lh);
      if (rows % 2) rows--;
      const cols = Math.ceil(env.w / cw) + 1, vis = Math.floor(env.w / cw);
      env.geo = { kind: "words", fs: fs, cw: cw, lh: lh };
      const p0 = rows / 2 - 1;
      const c0 = Math.round((vis - PW) / 2);

      // The lattice: in half-column steps h, even rows hold anchors at odd h and odd rows at even h,
      // so the anchors stagger. The rows level with the plate hold one anchor on each side of it.
      // Rows 0 and rows - 1 stay plain field so no tile sits against the box edge.
      const mx = 2, n = Math.max(2, Math.round((vis - 2 * mx) / 12)), S = (vis - 2 * mx) / n;
      const side = (mx + c0 - 3) / 2;
      const placed = [];
      let di = 0, ti = 0;
      for (let r = 1; r <= rows - 2; r++) {
        const odd = (r - p0) & 1, near = r >= p0 - 1 && r <= p0 + 2;
        const row = [], hs = [];
        if (near) hs.push(-1, -2);
        else for (let h = odd ? 2 : 1; h < 2 * n; h += 2) hs.push(h);
        for (const h of hs) {
          const cx = h === -1 ? side : h === -2 ? vis - side : mx + (h / 2) * S;
          const dose = near ? (r - p0 + 1 + (h === -2 ? 1 : 0)) % 2 === 0 : Math.floor((h + r) / 2) % 2 === 0;
          const pool = dose ? DOSES : TAPERS;
          const start = dose ? di : ti;
          let ok = null;
          for (let m = 0; m < pool.length && !ok; m++) {
            const text = pool[(start + m) % pool.length], len = text.length;
            const c = Math.round(cx - len / 2);
            if (c < mx || c + len > vis - mx) continue;
            if (near && c + len > c0 - 3 && c < c0 + PW + 3) continue;
            if (row.some((p) => c < p.c + p.len + 4 && p.c < c + len + 4)) continue;
            ok = { r: r, c: c, len: len, text: text, dose: dose };
          }
          if (!ok) continue;
          if (dose) {
            const k = di++, mL = ok.text.indexOf("mL") >= 0, sp = ok.text.indexOf(" ");
            ok.lit = {};
            if (k % 5 !== 1 && k % 5 !== 3) ok.lit[0] = [sp + 1, ok.len];
            if (!mL && k % 4 !== 2) ok.lit[1] = [0, sp];
          } else {
            const k = ti++;
            ok.lit = k % 5 === 3 ? {} : { 2: [0, ok.len] };
          }
          row.push(ok);
          placed.push(ok);
        }
      }
      const out = [];
      for (let r = 0; r < rows; r++) {
        const y = (r + 0.5) * lh - (rows * lh - env.h) / 2;
        const here = placed.filter((p) => p.r === r).sort((a, b) => a.c - b.c);
        const off = Math.floor(G.hash(r, 0, 3) * 9);
        let line = "", seed = r * 7 + 1, prev = null;
        const lit = [];
        for (const p of here) {
          const gap = p.c - line.length, ct = !p.dose;
          if (!prev) line = fillClean(gap - 2 + off, seed++, false, ct).slice(off) + "  ";
          else line += "  " + fillClean(gap - 4, seed++, !prev.dose, ct) + "  ";
          for (const k in p.lit) {
            const [a, b] = p.lit[k];
            for (let i = a; i < b; i++) lit[p.c + i] = +k;
          }
          line += p.text;
          prev = p;
        }
        if (!line) line = fill(cols + off, seed).slice(off);
        else line += "  " + fillClean(cols - line.length - 2, seed, !prev.dose, false);
        for (let c = 0; c < cols; c++) {
          const ch = line[c] || " ";
          out.push({ x0: c * cw, w: cw, x: (c + 0.5) * cw, y: y, r: r, c: c, text: ch, u: lit[c] === undefined ? -1 : lit[c] });
        }
      }
      env.plate = { p0: p0, c0: c0 };
      return out;
    },
    setup: function (env, toks) {
      const { p0, c0 } = env.plate, lh = env.geo.lh, cw = env.geo.cw;
      const X0 = c0 * cw, X1 = (c0 + PW) * cw;
      const Y0 = toks.find((t) => t.r === p0).y - lh / 2, Y1 = Y0 + 2 * lh;
      // A smooth rounded-rectangle falloff per letter: clear within a cell of the plate, full
      // field alpha about four cells out to the sides and a row and a half above and below.
      for (const t of toks) {
        const inPlate = (t.r === p0 || t.r === p0 + 1) && t.c >= c0 && t.c < c0 + PW;
        t.plate = inPlate ? (t.r === p0 ? 1 : 2) : 0;
        const dx = Math.max(X0 - t.x, 0, t.x - X1) / (4.5 * cw), dy = Math.max(Y0 - t.y, 0, t.y - Y1) / (1.6 * lh);
        const f = G.smooth(0.2, 1, Math.hypot(dx, dy));
        t.fs = t.text === " " || inPlate ? EMPTY : FIELDS[Math.round(f * NF)];
        if (t.u >= 0) t.fs = FIELDS[NF];
        if (inPlate) {
          t.u = -1;
          t.ps = UNITS.map(function (u) {
            if (t.plate === 2) {
              const o = Math.floor((PW - u.note.length) / 2), ch = u.note[t.c - c0 - o] || " ";
              return { bg: u.bg, color: u.fg, alpha: 1, weight: 500, text: ch };
            }
            const s = head(u), o = Math.floor((PW - s.length) / 2), i = t.c - c0 - o, ch = s[i] || " ";
            const quiet = i >= u.name.length;
            return { bg: P.ink, color: quiet ? P.tealPale : P.white, alpha: quiet ? QUIET : 1, weight: 500, text: ch };
          });
        }
      }
      // Build every fading style now, so a change of unit allocates nothing mid-loop.
      for (const t of toks) {
        if (t.plate) {
          t.pc = t.ps.map(function (s) {
            const c = [];
            for (let q = 1; q < QS; q++)
              c[q] = t.plate === 1
                ? { bg: P.ink, color: s.color, alpha: (s.alpha * q) / QS, weight: 500, text: s.text }
                : { bg: s.bg, bgAlpha: q / QS, color: s.color, alpha: q / QS, weight: 500, text: s.text };
            return c;
          });
        } else if (t.u >= 0) {
          const T = TILES[t.u];
          t.fc = [];
          for (let q = 1; q < QS; q++)
            t.fc[q] = [
              { color: P.ink, alpha: t.fs.alpha * (1 - q / QS) },
              { bg: T.bg, bgAlpha: q / QS, color: T.color, alpha: q / QS, weight: 500 },
            ];
        }
      }
      env.lv = [1, 0, 0];
      env.k = 0;
    },
    before: function (ctx, env) {
      const t = env.t, lv = env.lv;
      lv[0] = level(0, t);
      lv[1] = level(1, t);
      lv[2] = level(2, t);
      env.k = lv[0] ? 0 : lv[1] ? 1 : lv[2] ? 2 : -1;
    },
    rest: function (tok) {
      if (tok.plate) return tok.ps[0];
      if (tok.u === 0) return TILES[0];
      return tok.fs;
    },
    paint: function (tok, env) {
      const k = env.k;
      if (tok.plate) {
        if (k < 0) return tok.plate === 1 ? INK : EMPTY;
        const a = env.lv[k];
        if (a === 1) return tok.ps[k];
        const q = Math.round(a * QS);
        if (q === 0) return tok.plate === 1 ? INK : EMPTY;
        return q === QS ? tok.ps[k] : tok.pc[k][q];
      }
      if (tok.u < 0) return tok.fs;
      const a = env.lv[tok.u];
      if (a === 0) return tok.fs;
      if (a === 1) return TILES[tok.u];
      const q = Math.round(a * QS);
      if (q === 0) return tok.fs;
      return q === QS ? TILES[tok.u] : tok.fc[q];
    },
  });
})();

})({ GlyphArt });

export const id = "atlas-units";
export const ground = "#F1F4F7";

export function mount(element, options) {
  const art = GlyphArt.mount(element, id, options || {});
  return function unmount() {
    art.destroy();
  };
}

export default mount;
