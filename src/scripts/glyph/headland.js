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

  function shape(env) {
    if (env.view === "phone") return { cliff: -8, top: -3, lx: -6, sea: 6, bh: 2, slope: 0.42 };
    return { cliff: -9, top: -5, lx: -7, sea: 7, bh: 3, slope: 0.4 };
  }

  function topAt(s, ci) {
    if (ci < s.cliff) return null;
    if (ci === s.cliff) return s.top + 2;
    const c0 = s.lx + 3;
    if (ci <= c0) return s.top;
    const x = ci - c0;
    return s.top + Math.round(x * s.slope + Math.sin(x * 0.9) * 0.6);
  }

  G.register({
    id: "headland",
    title: "Grounded headland",
    line: "Filled tiles stack into a headland of four strata, records at the base, then evidence and plain language, with the patient at the top; a tile lighthouse casts one beam over a sea of ~ glyphs.",
    hint: "Move the pointer across the headland to lift the strata beneath it.",
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
      env.lampY = env.fy + (s.top - 5) * c;
      env.left = {};
      env.bare = env.opts && env.opts.figure === false;
      env.dim = env.opts && env.opts.fieldAlpha !== undefined ? env.opts.fieldAlpha : 0.14;
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
        const li = tok.ci - s.lx, lj = tok.cj - s.top;
        if ((lj === -1 || lj === -4) && Math.abs(li) <= 1) tok.kind = "house";
        if (li === 0 && (lj === -2 || lj === -3)) tok.kind = "house";
        if (li === 0 && lj === -5) tok.kind = "lamp";
        if (li === 0 && lj === -6) tok.kind = "roof";
      }
    },
    paint: function (tok, env) {
      const s = env.s, c = env.geo.c;
      if (tok.kind === "lamp") return { bg: P.amber, color: P.ink, weight: 500, text: "*" };
      if (tok.kind === "house") return { bg: P.white, color: P.indigo, weight: 500 };
      if (tok.kind === "roof") return { bg: P.white, bgAlpha: 0.9, color: P.indigo, weight: 500, text: "^" };
      if (tok.kind === "land") {
        let col = tok.col;
        if (env.px !== null) {
          const d = Math.hypot(tok.x - env.px, tok.y - env.py) / c;
          const k = (1 - G.smooth(1, 5.5, d)) * env.pk;
          if (k > 0.01) col = lerp(col, WHITE, 0.6 * k);
        }
        if (tok.wet) return { bg: css(col), bgAlpha: 1 - tok.wet, color: tok.fg, alpha: 0.85 * (1 - tok.wet) };
        return { bg: css(col), color: tok.fg, alpha: 0.85 };
      }
      if (env.bare) {
        if (env.px === null) return { color: P.tealPale, alpha: env.dim };
        const k = (1 - G.smooth(1, 7, Math.hypot(tok.x - env.px, tok.y - env.py) / c)) * env.pk;
        return { color: P.tealPale, alpha: env.dim + 0.4 * k };
      }
      const along = Math.abs(tok.x - env.lampX) / c, across = Math.abs(tok.y - env.lampY) / c;
      if (along > 0.6) {
        const spread = across / (0.45 + along * 0.12);
        const pulse = env.reduced ? 1 : 0.86 + 0.14 * Math.sin(along * 0.55 - env.t * 1.3);
        const f = (1 - G.smooth(0.55, 1, spread)) * (1 - G.smooth(4, env.view === "phone" ? 24 : 36, along)) * pulse;
        if (f > 0.03) return { bg: P.tealLight, bgAlpha: 0.26 * f, color: P.white, alpha: 0.16 + 0.74 * f, weight: f > 0.5 ? 500 : 400 };
      }
      if (tok.kind === "sea") {
        const depth = tok.cj - s.sea;
        const wave = G.hash(tok.ci, tok.cj, Math.floor(env.t * 0.5 + G.hash(tok.ci, tok.cj, 2) * 4)) < 0.75 ? "~" : "-";
        return { text: wave, color: P.tealLight, alpha: depth === 0 ? 0.55 : Math.max(0.14, 0.4 - depth * 0.05) };
      }
      return { color: P.tealPale, alpha: env.dim };
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
