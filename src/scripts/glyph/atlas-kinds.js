// Pereste glyph art: atlas-kinds. ES module; imports the shared engine from ./glyph-engine.js.
// Built by build_dist.py from ../pieces/atlas-kinds.js; edit the source, not this file.
import { GlyphArt } from "./glyph-engine.js";

(function (window) {
// Faint drug label wording fills the field. In five rows near the middle, words of the four kinds
// the atlas maps (drug names, doses, routes, frequencies) are letter tiles, each kind in its own
// colour, set in columns with plain wording between them. Every ten and a half seconds one kind
// glows a little stronger while the other three step back to half strength, then all return.
(function () {
  const G = window.GlyphArt, P = G.P;

  // Plain label wording for the field and the gaps: no drug names, doses, routes or frequencies.
  const WORDS = [
    "the", "of", "and", "or", "for", "with", "per", "each", "may", "be", "in", "on", "to", "as",
    "dose", "doses", "dosage", "tablets", "tablet", "the usual", "initial", "adults", "label",
    "with food", "the INR", "renal function", "in divided doses", "based on", "response",
    "maintenance", "monitor", "levels", "hepatic", "elderly", "section", "pediatric", "range",
    "film-coated", "swallow whole", "see table", "titrate", "usual", "weeks", "patients",
    "clinical", "strength", "recommended", "starting", "therapy", "administer", "after meals",
  ];

  // Kinds: 1 drug name, 2 dose with its unit, 3 route, 4 frequency. Each row lists four words;
  // a narrow box uses the first three. The kind order turns by one place each row, so the
  // colours run in diagonals through the lattice.
  const ROWS = [
    [[1, "warfarin"], [2, "5 mg"], [3, "orally"], [4, "once daily"]],
    [[2, "2.5 mg"], [3, "by mouth"], [4, "at bedtime"], [1, "atorvastatin"]],
    [[3, "oral"], [4, "once weekly"], [1, "methotrexate"], [2, "7.5 mg"]],
    [[4, "twice daily"], [1, "metformin"], [2, "500 mg"], [3, "by mouth"]],
    [[1, "levothyroxine"], [2, "50 mcg"], [3, "orally"], [4, "once daily"]],
  ];

  const BG = [null, P.indigo, P.teal, P.tealPale, P.ink];
  const FG = [null, P.tealPale, P.ink, P.ink, P.tealPale];
  const FIELD = { color: P.ink, alpha: 0.1 };

  // Strength of a tile: 0 stepped back, 1 rest, 2 glowing. A stepped-back tile is its own colour
  // halfway to the ground. Its letters stay on the same side (pale on the dark tiles, ink on the
  // teal ones), so they never pass through the tile colour while it fades.
  // Styles are built once, QS steps on each side of rest; STY[k][QS] is the resting tile itself.
  function hex(a, b, t) {
    const m = G.mix(a, b, t).match(/\d+/g);
    return "#" + m.map((v) => (+v).toString(16).padStart(2, "0")).join("");
  }
  const DIM_BG = BG.map((c) => c && hex(c, P.wash, 0.48));
  const DIM_FG = [null, P.white, hex(P.ink, P.teal, 0.2), hex(P.ink, P.wash, 0.25), P.white];
  const HI_FG = [null, P.soft, P.ink, P.ink, P.soft];
  const QS = 16, REST_BG = 0.93;
  const STY = [null];
  for (let k = 1; k <= 4; k++) {
    const list = [];
    const bgR = G.ramp(DIM_BG[k], BG[k]);
    const fgR = G.ramp(DIM_FG[k], FG[k]), hiR = G.ramp(FG[k], HI_FG[k]);
    for (let i = 0; i <= 2 * QS; i++) {
      const s = i / QS;
      list.push(s <= 1
        ? { bg: bgR(s), bgAlpha: REST_BG, color: fgR(s), alpha: 0.92, weight: 500 }
        : { bg: BG[k], bgAlpha: REST_BG + (1 - REST_BG) * (s - 1), color: hiR(s - 1), alpha: 0.92 + 0.08 * (s - 1), weight: 500 });
    }
    STY.push(list);
  }

  // One kind changes every PER seconds, starting S0 seconds into the period: it fades over F,
  // holds for H, and fades back over F. The rest of the period is the settled picture.
  const PER = 10.5, S0 = 3.4, F = 1.0, H = 1.2, SWEEP = 0.4;
  function episode(t) {
    const u = ((t % PER) + PER) % PER;
    const v = G.smooth(S0, S0 + F, u) * (1 - G.smooth(S0 + F + H, S0 + 2 * F + H, u));
    return { k: (((Math.floor(t / PER) % 4) + 4) % 4) + 1, v: v };
  }

  // Plain wording of exactly n letters. Leftover spaces go evenly between the words, so no gap
  // reads as a hole.
  function fill(n, seed) {
    const parts = [];
    let len = 0, k = 0, last = "";
    while (k < 80) {
      const sep = parts.length ? 1 : 0;
      if (n - len - sep < 2) break;
      const w = WORDS[Math.floor(G.hash(seed, k++, 9) * WORDS.length)];
      if (w === last || sep + w.length > n - len) continue;
      parts.push(w);
      len += sep + w.length;
      last = w;
    }
    if (parts.length < 2) return (parts[0] || "") + " ".repeat(Math.max(0, n - len));
    let extra = n - len, o = parts[0];
    for (let i = 1; i < parts.length; i++) {
      const add = Math.floor(extra / (parts.length - i));
      extra -= add;
      o += " ".repeat(1 + add) + parts[i];
    }
    return o;
  }

  G.register({
    id: "atlas-kinds",
    title: "Four kinds of word",
    line: "Faint drug label wording fills the field, and in a lattice near the middle the drug names, doses, routes and frequencies are letter tiles, each kind in its own colour, with one kind at a time glowing a little stronger.",
    ground: "wash",
    split: true,
    animated: true,
    restT: 0,
    tokens: function (env) {
      const fs = env.w < 420 ? 11 : 13;
      env.ctx.font = "400 " + fs + "px " + env.MONO;
      const cw = env.ctx.measureText("0").width, lh = fs * 1.8;
      env.geo = { kind: "words", fs: fs, cw: cw, lh: lh };
      const half = Math.ceil(env.h / 2 / lh) + 1, R = 2 * half + 1;
      const cols = Math.ceil(env.w / cw) + 2;
      const ox = (env.w - cols * cw) / 2;
      // The figure spans these columns, with a margin of at least about three letters.
      const mg = Math.max(3 * cw, 0.08 * env.w);
      const mL = Math.ceil((mg - ox) / cw), mR = Math.floor((env.w - mg - ox) / cw) - 1;
      const span = mR - mL + 1;
      const n = span >= 62 ? 4 : 3;
      const S = span / n;
      const out = [];
      for (let r = 0; r < R; r++) {
        const m = r - half, y = env.h / 2 + m * lh;
        const fr = m % 2 === 0 && Math.abs(m) <= 4 ? (m + 4) / 2 : -1;
        let line = "", kind = [];
        const off = Math.floor(G.hash(r, 0, 3) * 9);
        if (fr < 0) line = fill(cols + off + 2, r * 7 + 1).slice(off);
        else {
          // Each word is centred in its column, then pushed apart to keep three letters between
          // words and pulled back inside the margins.
          const row = ROWS[fr].slice(0, n), pos = [];
          for (let j = 0; j < n; j++) pos[j] = Math.max(mL, Math.round(mL + (j + 0.5) * S - row[j][1].length / 2));
          for (let j = 1; j < n; j++) pos[j] = Math.max(pos[j], pos[j - 1] + row[j - 1][1].length + 3);
          for (let j = n - 1; j >= 0; j--)
            pos[j] = Math.min(pos[j], j === n - 1 ? mR + 1 - row[j][1].length : pos[j + 1] - 3 - row[j][1].length);
          let seed = r * 7 + 1;
          for (let j = 0; j < n; j++) {
            const [k, word] = row[j], c = pos[j];
            const gap = c - line.length;
            if (!line) line = fill(gap - 1 + off, seed++).slice(off) + " ";
            else line += " " + fill(gap - 2, seed++) + " ";
            for (let i = 0; i < word.length; i++) kind[line.length + i] = k;
            line += word;
          }
          line += " " + fill(cols - line.length + 1, seed);
        }
        for (let c = 0; c < cols; c++) {
          out.push({ x0: ox + c * cw, w: cw, x: ox + (c + 0.5) * cw, y: y, text: line[c] || " ", k: kind[c] || 0 });
        }
      }
      // A word changes as one piece, a little later the further right it sits.
      for (const t of out) t.d = SWEEP * G.clamp(t.x / env.w);
      let start = -1;
      for (let i = 0; i <= out.length; i++) {
        const t = out[i];
        if (t && t.k && start >= 0 && out[start].k === t.k && out[start].y === t.y) {
          t.d = out[start].d;
          continue;
        }
        start = t && t.k ? i : -1;
      }
      return out;
    },
    rest: function (tok) {
      return tok.k ? STY[tok.k][QS] : FIELD;
    },
    paint: function (tok, env) {
      if (!tok.k) return FIELD;
      if (env.reduced) return STY[tok.k][QS];
      const e = episode(env.t - tok.d);
      if (e.v === 0) return STY[tok.k][QS];
      const q = Math.round(e.v * QS);
      return STY[tok.k][tok.k === e.k ? QS + q : QS - q];
    },
  });
})();

})({ GlyphArt });

export const id = "atlas-kinds";
export const ground = "#F1F4F7";

export function mount(element, options) {
  const art = GlyphArt.mount(element, id, options || {});
  return function unmount() {
    art.destroy();
  };
}

export default mount;
