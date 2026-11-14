// Pereste glyph art: name-field. ES module; imports the shared engine from ./glyph-engine.js.
// Built by build_dist.py from ../pieces/name-field.js; edit the source, not this file.
import { GlyphArt } from "./glyph-engine.js";

(function (window) {
(function () {
  const G = window.GlyphArt, P = G.P;
  const NAME = "PERESTE";

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
    paint: function (tok, env) {
      if (tok === env.lamp) return { bg: P.amber, color: P.ink, weight: 500 };
      let ang = 0;
      if (env.px !== null) {
        ang = Math.atan2(env.py - env.ly, env.px - env.lx) * env.pk;
        if (Math.abs(ang) > Math.PI / 2) ang = ang - Math.sign(ang) * Math.PI;
        ang = G.clamp(ang, -0.6, 0.6);
      }
      const dx = tok.wx - env.lx, dy = tok.y - env.ly;
      const ux = Math.cos(ang), uy = Math.sin(ang);
      const along = Math.abs(dx * ux + dy * uy), perp = Math.abs(dy * ux - dx * uy);
      const dist = along + env.off;
      const d = Math.atan2(perp, dist);
      const reach = 1 - G.smooth(env.len * 0.35, env.len, dist);
      const k = (1 - G.smooth(env.half * 0.55, env.half, d)) * reach;
      const lit = k;
      if (perp < env.geo.lh * 0.6 && along < env.len * 0.42) return { color: P.ink, alpha: 0.95, weight: 500 };
      if (lit > 0.55) return { color: P.teal, alpha: 0.6 + 0.4 * lit, weight: 500 };
      if (lit > 0.18) return { color: P.tealPale, alpha: 0.55 + 0.45 * lit, weight: 500 };
      if (lit > 0.04) return { color: P.tealPale, alpha: 0.25 + 0.6 * lit };
      return { color: P.indigo, alpha: 0.15 };
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
