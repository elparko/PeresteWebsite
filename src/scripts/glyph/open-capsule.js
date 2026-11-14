// Pereste glyph art: open-capsule. ES module; imports the shared engine from ./glyph-engine.js.
// Built by build_dist.py from ../pieces/open-capsule.js; edit the source, not this file.
import { GlyphArt } from "./glyph-engine.js";

(function (window) {
// A field of medicine-label words. The letters inside a tilted capsule fill in
// as tiles, one half indigo and one half pale teal. The capsule turns in place.
(function () {
  const G = window.GlyphArt, P = G.P;
  const words = [
    "tablet", "capsule", "by mouth", "your medicines", "your care team", "refill", "pharmacy", "label",
    "generic", "store dry", "room temp", "read the label", "your pharmacist", "PERESTE",
    "plain words", "your records", "what it is for", "side effects", "keep cool", "questions",
  ];

  const FIELD = { color: P.ink, alpha: 0.1 };
  const BG = G.ramp(P.indigo, P.tealPale), FG = G.ramp(P.tealPale, P.ink);

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
    hint: "The capsule turns slowly in place. Point anywhere and it turns to face the pointer.",
    ground: "wash",
    split: true,
    animated: true,
    restT: 0,
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
      env.g = geom(env);
      if (env.opts && env.opts.angle !== undefined) env.g.a = env.opts.angle;
      env.toks = toks;
    },
    before: function (ctx, env) {
      const g = env.g, toks = env.toks, v = env.geo.lh * 0.3, st = env.state;
      // The angle and its speed live in env.state, so a resize or a late font does not reset them.
      if (st.ang === undefined || env.reduced) {
        st.ang = g.a;
        st.vel = 0.16;
      } else if (env.pointerLive && env.px !== null && Math.hypot(env.px - env.fx, env.py - env.fy) > g.r * 0.6) {
        G.springAngle(st, Math.atan2(env.py - env.fy, env.px - env.fx), 7, env.dt);
      } else {
        st.vel += (0.16 - st.vel) * env.ease(2.5);
        st.ang += st.vel * env.dt;
      }
      // Letters cross-fade in about 0.2 s at the idle turn, and faster the faster the capsule turns,
      // so a quick turn toward the pointer does not leave a long trail of half-faded tiles.
      env.rate = 10 + 6 * Math.abs(st.vel);
      const ux = Math.cos(st.ang), uy = Math.sin(st.ang), o = env.geo.cw * 0.6;
      for (const tok of toks) {
        const dx = tok.x - env.fx, dy = tok.y - env.fy;
        const s0 = dx * ux + dy * uy, n0 = -dx * uy + dy * ux;
        const side = s0 < 0 ? -1 : 1;
        const s = s0 - side * o;
        let m = side;
        for (const d of [-v, v]) {
          const ss = s + d * uy, nn = n0 + d * ux;
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
    // Every letter rests as plain field text; the engine caches that and draws only the tiles.
    rest: function () {
      return FIELD;
    },
    // A letter does not switch between field and tile in one frame: tok.a (how much it is a tile)
    // and tok.s (which half, 0 indigo to 1 pale teal) ease toward their targets, and the two
    // states are drawn on top of each other while they cross-fade.
    paint: function (tok, env) {
      if (tok.m) {
        tok.side = tok.m > 0 ? 1 : 0;
        if (!tok.a) tok.s = tok.side;
      }
      const a = env.fade(tok, "a", tok.m ? 1 : 0, env.rate);
      const s = env.fade(tok, "s", tok.side || 0, env.rate);
      if (a === 0) return FIELD;
      const tile = {
        bg: BG(s),
        bgAlpha: a,
        color: FG(s),
        alpha: (0.85 - 0.05 * s) * a,
        weight: 500,
      };
      return a === 1 ? tile : [{ color: P.ink, alpha: 0.1 * (1 - a) }, tile];
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
