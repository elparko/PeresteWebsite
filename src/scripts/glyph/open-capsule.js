// Pereste glyph art: open-capsule. ES module; imports the shared engine from ./glyph-engine.js.
// Built by build_dist.py from ../pieces/open-capsule.js; edit the source, not this file.
import { GlyphArt } from "./glyph-engine.js";

(function (window) {
// A field of medicine-label words. The letters inside a tilted capsule fill in
// as tiles, one half indigo and one half pale teal. The pointer opens it.
(function () {
  const G = window.GlyphArt, P = G.P;
  const words = [
    "tablet", "capsule", "by mouth", "your medicines", "your care team", "refill", "pharmacy", "label",
    "generic", "store dry", "room temp", "read the label", "your pharmacist", "PERESTE",
    "plain words", "your records", "what it is for", "side effects", "keep cool", "questions",
  ];

  function geom(env) {
    if (env.view === "phone") return { hl: 92, r: 44, a: -0.5 };
    if (env.view === "desktop") return { hl: env.unit * 0.22, r: env.unit * 0.11, a: -0.55 };
    const u = Math.min(env.w, env.h * (env.w / env.h > 1.5 ? 1.4 : 1));
    return { hl: u * 0.27, r: u * 0.125, a: -0.55 };
  }

  G.register({
    id: "open-capsule",
    title: "Open capsule",
    line: "Medicine-label words (tablet, refill, read the label) fill the field, and the letters inside a tilted capsule become tiles, one half indigo and one half pale teal.",
    hint: "Bring the pointer near to open the capsule.",
    ground: "wash",
    split: true,
    quietStrength: 0.92,
    mock: { desktop: { focus: [0.78, 0.5] } },
    tokens: function (env) {
      const fs = env.view === "phone" ? 9.5 : env.view === "desktop" ? 12.5 : env.w < 420 ? 11 : 13;
      env.ctx.font = "400 " + fs + "px " + env.MONO;
      const cw = env.ctx.measureText("0").width, lh = fs * 1.75;
      const rows = Math.ceil(env.h / lh) + 1, cols = Math.ceil(env.w / cw) + 1;
      env.geo = { kind: "words", fs: fs, cw: cw, lh: lh };
      const out = [];
      for (let r = 0; r < rows; r++) {
        const y = (r + 0.5) * lh - (rows * lh - env.h) / 2;
        let line = "", k = 0;
        while (line.length < cols + 24) line += words[Math.floor(G.hash(r, k++, 5) * words.length)] + " ";
        const off = Math.floor(G.hash(r, 0, 3) * 20);
        for (let c = 0; c < cols; c++) out.push({ x0: c * cw, w: cw, x: (c + 0.5) * cw, y: y, text: line[c + off] });
      }
      return out;
    },
    setup: function (env, toks) {
      const g = geom(env);
      env.g = g;
      env.ux = Math.cos(g.a);
      env.uy = Math.sin(g.a);
      env.toks = toks;
      for (const tok of toks) {
        const dx = tok.x - env.fx, dy = tok.y - env.fy;
        tok.s = dx * env.ux + dy * env.uy;
        tok.n = -dx * env.uy + dy * env.ux;
      }
    },
    before: function (ctx, env) {
      const g = env.g, toks = env.toks, v = env.geo.lh * 0.3;
      let open = 0;
      if (env.px !== null) {
        const d = Math.hypot(env.px - env.fx, env.py - env.fy);
        open = env.pk * (1 - G.smooth(g.hl * 0.6, g.hl * 2.6, d));
      }
      const o = open * g.r * 0.9 + env.geo.cw * 0.6;
      for (const tok of toks) {
        const side = tok.s < 0 ? -1 : 1;
        const s = tok.s - side * o;
        let m = side;
        for (const dy of [-v, v]) {
          const ss = s + dy * env.uy, nn = tok.n + dy * env.ux;
          const sc = G.clamp(ss, -g.hl, g.hl);
          if (ss * side < 0 || Math.hypot(ss - sc, nn) > g.r) m = 0;
        }
        tok.m = m;
      }
      let start = 0;
      for (let k = 1; k <= toks.length; k++) {
        if (k < toks.length && toks[k].m === toks[start].m && toks[k].y === toks[start].y) continue;
        if (toks[start].m && k - start < 3) for (let q = start; q < k; q++) toks[q].m = 0;
        start = k;
      }
    },
    paint: function (tok) {
      if (tok.m < 0) return { bg: P.indigo, color: P.tealPale, alpha: 0.85, weight: 500 };
      if (tok.m > 0) return { bg: P.tealPale, color: P.ink, alpha: 0.8, weight: 500 };
      return { color: P.ink, alpha: 0.1 };
    },
  });
})();

})({ GlyphArt });

export const id = "open-capsule";
export const ground = "#F1F4F7";

export function mount(element, options) {
  const art = GlyphArt.mount(element, id, options || {});
  return function unmount() {
    art.destroy();
  };
}

export default mount;
