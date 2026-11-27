// Pereste glyph art: atlas-kinds. ES module; imports the shared engine from ./glyph-engine.js.
// Built by build_dist.py from ../pieces/atlas-kinds.js; edit the source, not this file.
import { GlyphArt } from "./glyph-engine.js";

(function (window) {
// Faint drug label wording fills the field. Near the middle, three label dosing phrases are letter
// tiles, split into the five parts the atlas types separately: drug name, dose number, dose unit,
// route and frequency, each part in its own color. Every ten and a half seconds one part stands
// out a little while the other four step back to about half strength, then all return.
(function () {
  const G = window.GlyphArt, P = G.P;

  // Plain label wording for the field: no drug names, doses, units, routes or frequencies.
  const WORDS = [
    "the", "of", "and", "or", "for", "per", "each", "may", "be", "in", "on", "to", "as",
    "dosage", "tablets", "the usual", "initial", "adults", "label", "the INR", "renal function",
    "in divided doses", "based on", "response", "maintenance", "monitor", "levels", "hepatic",
    "elderly", "section", "pediatric", "range", "film-coated", "swallow whole", "see table",
    "titrate", "usual", "patients", "clinical", "strength", "recommended", "starting", "therapy",
    "administer",
  ];

  // Parts: 1 drug name, 2 dose number, 3 dose unit, 4 route, 5 frequency.
  const PHRASES = [
    [[1, "warfarin"], [2, "5"], [3, "mg"], [4, "orally"], [5, "once daily"]],
    [[1, "methotrexate"], [2, "7.5"], [3, "mg"], [4, "orally"], [5, "once weekly"]],
    [[1, "metformin"], [2, "500"], [3, "mg"], [4, "orally"], [5, "twice daily"]],
  ];
  const plen = (p) => p.reduce((n, w) => n + w[1].length + 1, -1);

  const BG = [null, P.indigo, P.teal, P.tealLight, P.tealPale, P.ink];
  const FG = [null, P.tealPale, P.ink, P.ink, P.ink, P.tealPale];

  // Every tile keeps its own color. A part steps back by fading its letters into the tile, and
  // the part that stands out takes full strength and a thin underline in its own color.
  // STY[k][QS] is the resting tile, below it quieter, above it stronger.
  const QS = 12, REST_BG = 0.9, REST_FG = 0.95, DIM_FG = 0.42;
  const STY = [null];
  for (let k = 1; k <= 5; k++) {
    const list = [];
    for (let i = 0; i <= 2 * QS; i++) {
      const s = i / QS, up = Math.max(0, s - 1);
      list.push({
        bg: BG[k], bgAlpha: REST_BG + (1 - REST_BG) * up,
        color: FG[k], alpha: s <= 1 ? DIM_FG + (REST_FG - DIM_FG) * s : REST_FG + (1 - REST_FG) * up,
        weight: 500,
      });
    }
    STY.push(list);
  }

  // Field text fades out around the figure, in a few shared steps.
  const FL = 6;
  const FIELD = [null];
  for (let i = 1; i <= FL; i++) FIELD.push({ color: P.ink, alpha: (0.1 * i) / FL });

  // One part changes every PER seconds, starting S0 into the period: it fades over F, holds for H
  // and fades back over F. The rest of the period is the settled picture.
  const PER = 10.5, S0 = 3.4, F = 1.0, H = 1.2;

  function words(n, seed) {
    let s = "", k = 0, last = -1;
    while (s.length < n) {
      let i = Math.floor(G.hash(seed, k++, 9) * WORDS.length);
      if (i === last) i = (i + 1) % WORDS.length;
      last = i;
      s += (s ? " " : "") + WORDS[i];
    }
    return s;
  }

  G.register({
    id: "atlas-kinds",
    title: "Five parts of a dose",
    line: "Faint drug label wording fills the field, and three label dosing phrases such as warfarin 5 mg orally once daily are set as letter tiles, with the drug name, dose number, dose unit, route and frequency each in its own color, one part at a time standing out while the others step back.",
    ground: "wash",
    split: true,
    animated: true,
    restT: 0,
    tokens: function (env) {
      const fs = env.w < 420 ? 11 : 13;
      env.ctx.font = "400 " + fs + "px " + env.MONO;
      const cw = env.ctx.measureText("0").width;
      const longest = Math.max(...PHRASES.map(plen));
      const mg = Math.max(3 * cw, 0.1 * env.w);
      // A narrow box sets each phrase on two lines instead of shrinking the letters.
      const narrow = longest * cw > env.w - 2 * mg;
      const lines = [];
      PHRASES.forEach((p, i) => {
        if (narrow) {
          const c = 3.5 - 3 * i;
          lines.push({ m: -c, parts: p.slice(0, 3) }, { m: -c + 1, parts: p.slice(3) });
        } else lines.push({ m: 2 * i - 2, parts: p });
      });
      // Whole rows from top to bottom edge: an odd count puts a row on the center, an even count
      // puts the center between two rows, whichever the figure needs.
      let N = Math.max(3, Math.round(env.h / (fs * 1.8)));
      if ((N % 2 === 0) !== narrow) N += env.h / N > fs * 1.8 ? 1 : -1;
      const lh = env.h / N;
      env.geo = { kind: "words", fs: fs, cw: cw, lh: lh };
      const cols = Math.ceil(env.w / cw) + 2;
      const ox = (env.w - cols * cw) / 2;
      const runs = [];
      const out = [];
      env.ul = [];
      for (let r = 0; r < N; r++) {
        const m = r - (N - 1) / 2, y = (r + 0.5) * lh;
        const fl = lines.find((l) => l.m === m);
        let line, kind = [];
        if (!fl) {
          const off = Math.floor(G.hash(r, 0, 3) * 9);
          line = words(cols + off, r * 7 + 1).slice(off);
        } else {
          const len = plen(fl.parts);
          const c0 = Math.round((cols - len) / 2);
          const left = words(c0 + 1, r * 7 + 1);
          line = left.slice(left.length - (c0 - 1)) + " ";
          fl.parts.forEach(([k, w], j) => {
            if (j) line += " ";
            for (let i = 0; i < w.length; i++) kind[line.length + i] = k;
            line += w;
          });
          runs.push({ x0: ox + c0 * cw, x1: ox + (c0 + len) * cw, y: y });
          let c = c0;
          for (const [k, w] of fl.parts) {
            env.ul.push({ k: k, x0: ox + c * cw, w: w.length * cw, y: y + lh / 2 + 1 });
            c += w.length + 1;
          }
          line += " " + words(cols - line.length, r * 7 + 2);
        }
        for (let c = 0; c < cols; c++)
          out.push({ x0: ox + c * cw, w: cw, x: ox + (c + 0.5) * cw, y: y, text: line[c] || " ", k: kind[c] || 0 });
      }
      // The field clears behind the figure's bounding box and returns smoothly around it.
      const bx0 = Math.min(...runs.map((R) => R.x0)), bx1 = Math.max(...runs.map((R) => R.x1));
      const by0 = runs[0].y, by1 = runs[runs.length - 1].y;
      for (const t of out) {
        if (t.k) continue;
        const dx = Math.max(bx0 - t.x, 0, t.x - bx1) / (9 * cw), dy = Math.max(by0 - t.y, 0, t.y - by1) / (2.6 * lh);
        const f = G.smooth(0.12, 1, Math.hypot(dx, dy));
        t.st = t.text === " " ? null : FIELD[Math.round(f * FL)];
      }
      return out;
    },
    before: function (ctx, env) {
      const u = ((env.t % PER) + PER) % PER;
      env.ek = (Math.floor(env.t / PER) % 5) + 1;
      env.ev = env.reduced ? 0 : G.smooth(S0, S0 + F, u) * (1 - G.smooth(S0 + F + H, S0 + 2 * F + H, u));
    },
    after: function (ctx, env) {
      if (env.ev === 0) return;
      ctx.globalAlpha = env.ev;
      ctx.fillStyle = BG[env.ek];
      for (const u of env.ul) if (u.k === env.ek) ctx.fillRect(u.x0, u.y, u.w, 1.5);
      ctx.globalAlpha = 1;
    },
    rest: function (tok) {
      return tok.k ? STY[tok.k][QS] : tok.st;
    },
    paint: function (tok, env) {
      if (!tok.k) return tok.st;
      if (env.ev === 0) return STY[tok.k][QS];
      const q = Math.round(env.ev * QS);
      return STY[tok.k][tok.k === env.ek ? QS + q : QS - q];
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
