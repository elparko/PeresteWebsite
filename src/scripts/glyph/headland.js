// Pereste glyph art: headland. ES module; imports the shared engine from ./glyph-engine.js.
// Built by build_dist.py from ../pieces/headland.js; edit the source, not this file.
import { GlyphArt } from "./glyph-engine.js";

(function (window) {
// A headland of filled tiles rises from a sea of "~" glyphs. Its strata run from
// indigo at the base to pale teal at the top, labelled RECORDS, EVIDENCE,
// PLAIN LANGUAGE and PATIENT. A tile lighthouse on the cliff casts a beam line.
(function () {
  const G = window.GlyphArt, P = G.P;
  const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const css = (c) => "rgb(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + ")";
  const BANDS = [
    { name: "PATIENT", bg: rgb(P.soft), next: rgb(P.tealPale), fg: P.ink },
    { name: "PLAIN LANGUAGE", bg: rgb(P.tealPale), next: rgb(P.tealLight), fg: P.ink },
    { name: "EVIDENCE", bg: rgb(P.tealLight), next: rgb(P.teal), fg: P.ink },
    { name: "RECORDS", bg: rgb(P.teal), next: rgb(P.indigo), fg: P.soft },
  ];
  const DEEP = rgb(P.indigo), NAVY = rgb(P.ink), WHITE = rgb(P.white);
  const LAMP = { bg: P.amber, color: P.ink, weight: 500, text: "*" };
  const HOUSE = { bg: P.white, color: P.indigo, weight: 500 };
  const ROOF = { bg: P.white, bgAlpha: 0.9, color: P.indigo, weight: 500, text: "^" };

  function shape(env) {
    const o = env.opts || {}, c = env.geo.c, phone = env.view === "phone";
    const shaft = o.tower === undefined ? 2 : Math.max(1, Math.round(o.tower));
    const bh = phone ? 2 : 3;
    let lx = phone ? -6 : -7, lamp = phone ? -8 : -10;
    if (o.lighthouse) {
      lx = Math.round((o.lighthouse[0] * env.w - env.fx) / c);
      lamp = Math.round((o.lighthouse[1] * env.h - env.fy) / c);
    }
    const ciMin = Math.ceil(0.5 - env.fx / c), ciMax = Math.floor((env.w - env.fx) / c - 0.5);
    const cjMin = Math.ceil(0.5 - env.fy / c), cjMax = Math.floor((env.h - env.fy) / c - 0.5);
    lx = G.clamp(lx, ciMin + 2, Math.max(ciMin + 2, ciMax - 2));
    lamp = G.clamp(lamp, cjMin + 4, Math.max(cjMin + 4, cjMax - shaft - 4));
    const top = lamp + 3 + shaft;
    return { lx: lx, lamp: lamp, top: top, shaft: shaft, cliff: lx - 2, sea: top + 4 * bh + (phone ? 1 : 0), bh: bh, slope: phone ? 0.42 : 0.4 };
  }

  function topAt(s, ci) {
    if (ci < s.cliff) return null;
    if (ci === s.cliff) return s.top + 2;
    const c0 = s.lx + 3;
    if (ci <= c0) return s.top;
    const x = ci - c0;
    return s.top + Math.round(x * s.slope + Math.sin(x * 0.9) * 0.6);
  }

  function beam(tok, env) {
    const c = env.geo.c;
    const dx = (tok.x - env.lampX) / c, dy = (tok.y - env.lampY) / c;
    const al = dx * env.ca + dy * env.sa, along = Math.abs(al), across = Math.abs(dy * env.ca - dx * env.sa);
    if (along <= 0.6) return 0;
    const spread = across / (0.5 + along * 0.13);
    const pulse = env.reduced ? 1 : 0.86 + 0.14 * Math.sin(along * 0.55 - env.t * 1.3);
    const arm = env.spot || al > 0 ? 1 : 0.7;
    return (1 - G.smooth(0.45, env.spot ? 1 : 1.3, spread)) * (1 - G.smooth(4, env.view === "phone" ? 24 : 36, along)) * pulse * arm;
  }

  G.register({
    id: "headland",
    title: "Grounded headland",
    line: "Filled tiles stack into a headland of four strata, records at the base, then evidence and plain language, with the patient at the top; a tile lighthouse casts one beam over a sea of ~ glyphs.",
    hint: "Move the pointer: the beam swings from the lamp to follow it and lights the tiles it crosses.",
    ground: "navy",
    mode: "cells",
    glyphs: "0123456789+-.:/%",
    glyphScale: 0.46,
    animated: true,
    restT: 0,
    quietStrength: 0.9,
    focusLarge: [0.56, 0.5],
    mock: { desktop: { focus: [0.77, 0.47] } },
    cell: function (env) {
      if (env.view === "phone") return 14;
      if (env.view === "desktop") return 22;
      return Math.max(13, Math.round(env.unit / 27));
    },
    setup: function (env, toks) {
      const s = shape(env);
      env.s = s;
      const c = env.geo.c;
      env.lampX = env.fx + s.lx * c;
      env.lampY = env.fy + s.lamp * c;
      env.left = {};
      env.bare = env.opts && env.opts.figure === false;
      env.spot = env.opts && env.opts.light === "spot";
      env.dim = env.opts && env.opts.fieldAlpha !== undefined ? env.opts.fieldAlpha : 0.14;
      env.DIM = { color: P.tealPale, alpha: env.dim };
      for (const tok of toks) {
        tok.kind = "sky";
        if (env.bare) continue;
        const top = topAt(s, tok.ci);
        let land = top !== null && tok.cj >= top;
        if (!land && tok.cj > s.sea) {
          const reach = s.cliff - Math.floor((tok.cj - s.sea) * 1.1 + G.hash(tok.cj, 3, 9) * 1.2);
          land = tok.ci >= reach;
        }
        tok.kind = "sky";
        if (land) {
          const d = tok.cj - s.top;
          let b = Math.min(3, Math.max(0, Math.floor(d / s.bh)));
          const edge = d - b * s.bh;
          if (b < 3 && edge === s.bh - 1 && G.hash(tok.ci, tok.cj, 4) < 0.28) b++;
          else if (b > 0 && edge === 0 && G.hash(tok.ci, tok.cj, 5) < 0.28) b--;
          const B = BANDS[b];
          let col = lerp(B.bg, B.next, G.hash(tok.ci, tok.cj, 6) * 0.35);
          tok.kind = "land";
          tok.col = col;
          tok.fg = B.fg;
          tok.wet = tok.cj > s.sea ? Math.min(0.75, 0.38 + (tok.cj - s.sea) * 0.06) : 0;
          const row = tok.cj;
          if (env.left[row] === undefined || tok.ci < env.left[row]) env.left[row] = tok.ci;
        } else if (tok.cj >= s.sea) {
          tok.kind = "sea";
        }
        const li = tok.ci - s.lx, lj = tok.cj - s.lamp;
        if ((lj === 1 || lj === s.shaft + 2) && Math.abs(li) <= 1) tok.kind = "house";
        if (li === 0 && lj > 1 && lj < s.shaft + 2) tok.kind = "house";
        if (li === 0 && lj === 0) tok.kind = "lamp";
        if (li === 0 && lj === -1) tok.kind = "roof";
      }
      // Each cell's resting style, which the engine caches. Sea cells have none: they change glyph.
      for (const tok of toks) {
        if (tok.kind === "lamp") tok.still = LAMP;
        else if (tok.kind === "house") tok.still = HOUSE;
        else if (tok.kind === "roof") tok.still = ROOF;
        else if (tok.kind === "land") {
          tok.still = tok.wet
            ? { bg: css(tok.col), bgAlpha: 1 - tok.wet, color: tok.fg, alpha: 0.85 * (1 - tok.wet) }
            : { bg: css(tok.col), color: tok.fg, alpha: 0.85 };
        } else tok.still = tok.kind === "sea" ? null : env.DIM;
      }
    },
    rest: function (tok) {
      return tok.still;
    },
    before: function (ctx, env) {
      let target = env.reduced ? 0 : Math.sin(env.t * 0.25) * 0.3;
      if (!env.spot && env.pointerLive && env.px !== null) target = Math.atan2(env.py - env.lampY, env.px - env.lampX);
      if (env.spot) target = 0;
      // The beam angle and its speed live in env.state, so a resize does not reset them. A damped
      // spring carries the beam to its target, so it starts and stops without a jump in speed.
      const st = env.state;
      if (st.ang === undefined || env.reduced || env.spot) {
        st.ang = target;
        st.vel = 0;
      } else G.springAngle(st, target, 10, env.dt);
      env.ca = Math.cos(st.ang);
      env.sa = Math.sin(st.ang);
    },
    paint: function (tok, env) {
      const s = env.s, c = env.geo.c;
      if (tok.kind === "lamp" || tok.kind === "house" || tok.kind === "roof") return tok.still;
      const f = env.bare ? 0 : beam(tok, env);
      if (tok.kind === "land") {
        if (f <= 0.02 && !(env.spot && env.px !== null)) return tok.still;
        let col = tok.col;
        if (env.spot) {
          if (env.px !== null) {
            const d = Math.hypot(tok.x - env.px, tok.y - env.py) / c;
            const k = (1 - G.smooth(1, 5.5, d)) * env.pk;
            if (k > 0.01) col = lerp(col, WHITE, 0.6 * k);
          }
        } else if (f > 0.02) col = lerp(col, WHITE, 0.8 * f);
        if (tok.wet) {
          const wet = tok.wet * (1 - 0.7 * (env.spot ? 0 : f));
          return { bg: css(col), bgAlpha: 1 - wet, color: tok.fg, alpha: 0.85 * (1 - wet) };
        }
        return { bg: css(col), color: tok.fg, alpha: 0.85 };
      }
      if (env.bare) {
        if (env.px === null) return env.DIM;
        const k = (1 - G.smooth(1, 7, Math.hypot(tok.x - env.px, tok.y - env.py) / c)) * env.pk;
        return { color: P.tealPale, alpha: env.dim + 0.4 * k };
      }
      // Sky and sea. g is how far the cell has changed from its unlit state to its lit state;
      // the two are cross-faded, so a glyph the beam reaches brightens instead of switching.
      const g = G.smooth(0, 0.08, f), out = [];
      if (g === 0 && tok.kind !== "sea") return env.DIM;
      if (g < 1) {
        if (tok.kind === "sea") {
          // A sea glyph changes between "~" and "-" every two seconds; the change is a 0.4 s cross-fade.
          const depth = tok.cj - s.sea, a = (depth === 0 ? 0.55 : Math.max(0.14, 0.4 - depth * 0.05)) * (1 - g);
          const p = env.t * 0.5 + G.hash(tok.ci, tok.cj, 2) * 4, n = Math.floor(p);
          const cur = G.hash(tok.ci, tok.cj, n) < 0.75 ? "~" : "-", was = G.hash(tok.ci, tok.cj, n - 1) < 0.75 ? "~" : "-";
          const w = cur === was ? 1 : G.smooth(0, 0.2, p - n);
          if (w < 1) out.push({ text: was, color: P.tealLight, alpha: a * (1 - w) });
          out.push({ text: cur, color: P.tealLight, alpha: a * w });
        } else out.push({ color: P.tealPale, alpha: env.dim * (1 - g) });
      }
      if (g > 0) {
        // Lit glyphs are regular weight below half brightness and medium above; the two weights
        // are cross-faded around the half-way point.
        const a = (0.16 + 0.74 * f) * g, w = G.smooth(0.42, 0.58, f), a1 = a * (1 - w);
        if (w < 1) out.push({ bg: P.tealLight, bgAlpha: 0.26 * f, color: P.white, alpha: a1 });
        if (w > 0) out.push({ bg: w < 1 ? null : P.tealLight, bgAlpha: 0.26 * f, color: P.white, alpha: (a * w) / (1 - a1), weight: 500 });
      }
      return out;
    },
    after: function (ctx, env) {
      if (env.bare) return;
      const s = env.s, c = env.geo.c;
      const fs = env.view === "phone" ? 7.5 : Math.max(c < 16 ? 7.5 : 8.5, c * 0.4);
      const names = (env.opts && env.opts.labels) || BANDS.map(function (b) { return b.name; });
      ctx.font = "500 " + fs + "px " + env.MONO;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      for (let b = 0; b < 4; b++) {
        const row = s.top + b * s.bh + Math.floor(s.bh / 2) + (b === 3 ? 1 : 0);
        const ci = env.left[row];
        if (ci === undefined) continue;
        const x = env.fx + ci * c - c / 2 + 3, y = env.fy + row * c;
        const label = names[b];
        if (!label) continue;
        const w = ctx.measureText(label).width + fs * 1.1, h = Math.min(c - 4, fs * 2);
        ctx.globalAlpha = 0.94;
        ctx.fillStyle = P.ink;
        ctx.fillRect(x, y - h / 2, w, h);
        ctx.globalAlpha = 1;
        ctx.fillStyle = P.white;
        ctx.fillText(label, x + fs * 0.55, y + 0.5);
      }
    },
  });
})();

})({ GlyphArt });

export const id = "headland";
export const ground = "#232C54";

export function mount(element, options) {
  const art = GlyphArt.mount(element, id, options || {});
  return function unmount() {
    art.destroy();
  };
}

export default mount;
