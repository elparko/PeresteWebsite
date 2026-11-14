// Pereste glyph art: name-field. ES module; imports the shared engine from ./glyph-engine.js.
// Built by build_dist.py from ../pieces/name-field.js; edit the source, not this file.
import { GlyphArt } from "./glyph-engine.js";

(function (window) {
(function () {
  const G = window.GlyphArt, P = G.P;
  const NAME = "PERESTE";
  const LAMP = { bg: P.amber, color: P.ink, weight: 500 }, DARK = { color: P.indigo, alpha: 0.15 };

  G.register({
    id: "name-field",
    title: "Name in the beams",
    line: "The word PERESTE, letterspaced in offset rows, forms an even texture; two long cones of lit letters spread left and right from one amber lamp, the twin beams of the mark.",
    hint: "Move the pointer and the beams turn to follow it.",
    ground: "light",
    animated: true,
    restT: 0,
    quietStrength: 0.9,
    tokens: function (env) {
      const fs = env.view === "phone" ? 9 : env.view === "desktop" ? 11 : 12;
      env.ctx.font = "400 " + fs + "px " + env.MONO;
      const cw = env.ctx.measureText("0").width, lh = fs * 2.1;
      env.geo = { kind: "words", fs: fs, cw: cw, lh: lh };
      const period = NAME.length * 2 + 3;
      const rows = Math.ceil(env.h / lh) + 1, cols = Math.ceil(env.w / cw) + period;
      const r0 = Math.round(env.fy / lh - 0.5);
      const out = [];
      for (let r = 0; r < rows; r++) {
        const y = (r + 0.5) * lh + (env.fy - (r0 + 0.5) * lh);
        if (y < -lh || y > env.h + lh) continue;
        const shift = ((r - r0) & 1) * Math.floor(period / 2);
        for (let c = -period; c < cols; c++) {
          const k = (((c + shift) % period) + period) % period;
          if (k >= NAME.length * 2 || k & 1) continue;
          const x0 = c * cw;
          if (x0 < -cw || x0 > env.w) continue;
          const wx = (c - k + NAME.length - 1) * cw + cw / 2;
          out.push({ x0: x0, w: cw, x: x0 + cw / 2, y: y, wx: wx, text: NAME[k >> 1], r: r - r0 });
        }
      }
      return out;
    },
    setup: function (env, toks) {
      const phone = env.view === "phone";
      env.half = phone ? 0.42 : env.view === "desktop" ? 0.3 : 0.27;
      env.len = phone ? env.w * 0.75 : env.unit * (env.view === "desktop" ? 1.05 : 1.15);
      env.off = env.geo.cw * (phone ? 10 : 14);
      let best = null, bd = 1e9;
      for (const t of toks) {
        const d = Math.hypot(t.x - env.fx, t.y - env.fy);
        if (d < bd) {
          bd = d;
          best = t;
        }
      }
      env.lamp = best;
      env.lx = best.x;
      env.ly = best.y;
    },
    idle: function (env) {
      const a = Math.sin(env.t * 0.25) * 0.05;
      return [env.lx + Math.cos(a) * env.unit, env.ly + Math.sin(a) * env.unit];
    },
    // The beams turn toward the pointer, up to 0.6 radians either way. When the pointer passes
    // above or below the lamp the target flips from one limit to the other, so the angle follows
    // its target through a damped spring and sweeps across instead of flipping in one frame.
    before: function (ctx, env) {
      let target = 0;
      if (env.px !== null) {
        target = Math.atan2(env.py - env.ly, env.px - env.lx);
        if (Math.abs(target) > Math.PI / 2) target = target - Math.sign(target) * Math.PI;
        target = G.clamp(target, -0.6, 0.6) * env.pk;
      }
      const st = env.state;
      if (st.ang === undefined || env.reduced) {
        st.ang = target;
        st.vel = 0;
      } else {
        G.springAngle(st, target, 16, env.dt);
        if (Math.abs(st.ang - target) > 0.002 || Math.abs(st.vel) > 0.002) env.busy = true;
      }
      env.ux = Math.cos(st.ang);
      env.uy = Math.sin(st.ang);
    },
    // Every letter rests as a dim indigo letter; the engine caches that and draws only the lit ones.
    rest: function (tok, env) {
      return tok === env.lamp ? LAMP : DARK;
    },
    paint: function (tok, env) {
      if (tok === env.lamp) return LAMP;
      const dx = tok.wx - env.lx, dy = tok.y - env.ly;
      const ux = env.ux, uy = env.uy;
      const along = Math.abs(dx * ux + dy * uy), perp = Math.abs(dy * ux - dx * uy);
      const dist = along + env.off;
      const d = Math.atan2(perp, dist);
      const reach = 1 - G.smooth(env.len * 0.35, env.len, dist);
      const k = (1 - G.smooth(env.half * 0.55, env.half, d)) * reach;
      const lit = k;
      // The letter's look is a continuous function of how lit it is. Each state below has the
      // same color, weight and opacity as before; near a boundary the two neighbouring states are
      // cross-faded, so a letter the beam reaches or leaves changes over several frames.
      const core = (1 - G.smooth(env.geo.lh * 0.45, env.geo.lh * 0.75, perp)) * (1 - G.smooth(env.len * 0.38, env.len * 0.46, along));
      const w1 = G.smooth(0.02, 0.06, lit), w2 = G.smooth(0.14, 0.22, lit), w3 = G.smooth(0.49, 0.61, lit), rest = 1 - core;
      const a0 = 0.15 * (1 - w1) * rest, a1 = (0.25 + 0.6 * lit) * w1 * (1 - w2) * rest;
      const a2 = (0.55 + 0.45 * lit) * w2 * (1 - w3) * rest, a3 = (0.6 + 0.4 * lit) * w3 * rest, a4 = 0.95 * core;
      if (a0 === 0.15) return DARK;
      const out = [];
      if (a0 > 0.004) out.push({ color: P.indigo, alpha: a0 });
      if (a1 > 0.004) out.push({ color: P.tealPale, alpha: a1 });
      if (a2 > 0.004) out.push({ color: P.tealPale, alpha: a2, weight: 500 });
      if (a3 > 0.004) out.push({ color: P.teal, alpha: a3, weight: 500 });
      if (a4 > 0.004) out.push({ color: P.ink, alpha: a4, weight: 500 });
      return out;
    },
  });
})();

})({ GlyphArt });

export const id = "name-field";
export const ground = "#F6F8FA";

export function mount(element, options) {
  const art = GlyphArt.mount(element, id, options || {});
  return function unmount() {
    art.destroy();
  };
}

export default mount;
