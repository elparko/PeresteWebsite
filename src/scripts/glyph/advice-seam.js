// Pereste glyph art: advice-seam. ES module; imports the shared engine from ./glyph-engine.js.
// Built by build_dist.py from ../pieces/advice-seam.js; edit the source, not this file.
import { GlyphArt } from "./glyph-engine.js";

(function (window) {
// A field of short requests, each with an advice wording and an education wording. One soft
// vertical seam of letter tiles, indigo to pale teal, crosses the box: slots left of it read as
// advice, slots right of it as education. One solid ink row of emergency words runs across the
// box, and the seam passes behind it without changing it. The seam drifts slowly left and right,
// and each slot whose middle it passes fades out of one wording before fading into the other.
(function () {
  const G = window.GlyphArt, P = G.P;
  const PAIRS = [
    ["what should I take?", "how does it work?"],
    ["should I worry?", "what is it?"],
    ["you should", "it is typically"],
    ["what do I do?", "what causes it?"],
    ["you likely have", "this is usually"],
    ["is this serious?", "how is it treated?"],
    ["your symptoms", "the symptoms"],
  ];
  const EMERGENCY = [
    ["call 911", "words are slurred", "call 911", "face looks lazy", "call 911"],
    ["words are slurred", "call 911", "face looks lazy"],
    ["words are slurred", "call 911"],
    ["call 911"],
  ];

  const PERIOD = 24, SWING = 0.2, CHANGE = 1.1;
  const FALL = [1, 0.75, 0.4];
  const FA = FALL.map((f) => ({ color: G.mix(P.ink, P.indigo, 0.75), alpha: 0.11 * f }));
  const FE = FALL.map((f) => ({ color: G.mix(P.ink, P.teal, 0.7), alpha: 0.11 * f }));
  const EM = { bg: P.ink, bgAlpha: 1, color: P.white, alpha: 0.95, weight: 500 };
  const BG = G.ramp(P.indigo, P.tealPale), FG = G.ramp(P.tealPale, P.ink);

  function seamX(env, t) {
    return env.w * (0.5 + SWING * Math.sin((2 * Math.PI * t) / PERIOD));
  }
  // Each row's part of the seam: its middle and half width wander a little, so the band's
  // edge is ragged row by row, like a column of set type.
  function rowSeam(env, r, t, out) {
    const cw = env.geo.cw;
    const c = seamX(env, t) + cw * 1.3 * (G.noise(r * 0.83 + 3.1, t * 0.06, 11) - 0.5);
    const hw = cw * (1.9 + 0.9 * (G.noise(r * 1.37 + 7.3, t * 0.05, 13) - 0.5));
    out.c = c;
    out.l = c - hw;
    out.r = c + hw;
  }

  function fontSize(env) {
    const fs = Math.min(env.w / 30, env.h / 19.5);
    return G.clamp(Math.floor(fs * 2) / 2, 10, 13.5);
  }

  G.register({
    id: "advice-seam",
    title: "The seam",
    line: "Short patient requests fill the field, worded as advice left of a slow vertical seam of indigo and pale teal letter tiles and as education to its right, while a dark row reading call 911, words are slurred, face looks lazy crosses the seam unchanged.",
    ground: "wash",
    split: true,
    animated: true,
    restT: 0,
    tokens: function (env) {
      const fs = fontSize(env);
      env.ctx.font = "400 " + fs + "px " + env.MONO;
      const cw = env.ctx.measureText("0").width, lh = fs * 1.75;
      env.geo = { kind: "words", fs: fs, cw: cw, lh: lh };
      const inner = Math.floor((env.h - 1.6 * lh) / lh);
      const er = Math.round(0.4 * (inner - 1));
      const r0 = -Math.ceil((env.h / 2 + lh) / lh), r1 = -r0 + inner;
      const out = [], slots = [], rows = [];

      // The emergency bar: whole cells from margin to margin, its phrases spread evenly.
      const mx = Math.max(0.8 * cw, env.w * 0.025);
      const ncell = Math.floor((env.w - 2 * mx) / cw), bx0 = (env.w - ncell * cw) / 2;
      let phr = EMERGENCY[EMERGENCY.length - 1];
      for (const p of EMERGENCY) if (p.join("  ").length + 2 <= ncell) { phr = p; break; }
      const letters = phr.reduce((n, s) => n + s.length, 0);
      const gap = phr.length > 1 ? Math.min(5, Math.floor((ncell - 2 - letters) / (phr.length - 1))) : 0;
      const text = phr.join(" ".repeat(gap));
      const lead = Math.floor((ncell - text.length) / 2);

      for (let r = r0; r < r1; r++) {
        const y = env.h / 2 + (r - (inner - 1) / 2) * lh;
        if (y < -lh / 2 || y > env.h + lh / 2) continue;
        const isIn = r >= 0 && r < inner, dr = Math.abs(r - er);
        const lvl = dr === 1 ? 2 : dr === 2 ? 1 : 0;
        rows.push(r);
        if (r === er) {
          for (let i = 0; i < ncell; i++) {
            const x0 = bx0 + i * cw;
            out.push({ em: true, r: r, x0: x0, w: cw, x: x0 + cw / 2, y: y, text: text[i - lead] || " " });
          }
        }
        let x = -Math.floor(G.hash(r, 0, 3) * 12) * cw, k = 0, last = -1;
        while (x < env.w) {
          let n = Math.floor(G.hash(r, k, 5) * PAIRS.length);
          if (n === last) n = (n + 1) % PAIRS.length;
          last = n;
          const a = PAIRS[n][0], b = PAIRS[n][1], len = Math.max(a.length, b.length);
          const slot = { r: r, cx: x + (len * cw) / 2 };
          slots.push(slot);
          for (let i = 0; i < len + 2; i++) {
            const x0 = x + i * cw;
            if (x0 + cw < 0 || x0 > env.w) continue;
            const on = i < len ? slot : null;
            const tok = { r: r, x0: x0, w: cw, x: x0 + cw / 2, y: y, slot: on, ta: on ? a[i] || " " : " ", tb: on ? b[i] || " " : " " };
            tok.tile = isIn && r !== er;
            tok.lvl = lvl;
            if (r === er) continue;
            out.push(tok);
          }
          x += (len + 2) * cw;
          k++;
        }
      }
      env.slots = slots;
      env.rowList = rows;
      return out;
    },
    setup: function (env, toks) {
      env.seam = {};
      const s = {};
      for (const r of env.rowList) {
        rowSeam(env, r, 0, s);
        env.seam[r] = { c: s.c, l: s.l, r: s.r };
      }
      for (const slot of env.slots) slot.rest = slot.cx > env.seam[slot.r].c ? 1 : 0;
      for (const tok of toks) {
        if (tok.em) continue;
        tok.fs = { color: "", alpha: 0 };
        tok.ts = { bg: "", bgAlpha: 0, color: "", alpha: 0, weight: 500 };
        tok.pair = [tok.fs, tok.ts];
        const e = tok.slot ? tok.slot.rest : 0;
        tok.text = e ? tok.tb : tok.ta;
        tok.rs = (e ? FE : FA)[tok.lvl];
      }
    },
    before: function (ctx, env) {
      const cw = env.geo.cw, t = env.t;
      for (const r of env.rowList) rowSeam(env, r, t, env.seam[r]);
      const step = env.dt / CHANGE, hy = cw * 0.6;
      for (const slot of env.slots) {
        const c = env.seam[slot.r].c;
        if (slot.p === undefined || env.reduced) {
          slot.goal = slot.cx > c ? 1 : 0;
          slot.p = slot.goal;
          continue;
        }
        if (slot.cx > c + hy) slot.goal = 1;
        else if (slot.cx < c - hy) slot.goal = 0;
        if (slot.p < slot.goal) slot.p = Math.min(slot.goal, slot.p + step);
        else if (slot.p > slot.goal) slot.p = Math.max(slot.goal, slot.p - step);
      }
    },
    rest: function (tok) {
      return tok.em ? EM : tok.rs;
    },
    paint: function (tok, env) {
      if (tok.em) return EM;
      const p = tok.slot ? tok.slot.p : 0;
      const edu = p >= 0.5;
      const k = edu ? G.smooth(0.55, 1, p) : 1 - G.smooth(0, 0.45, p);
      const cw = env.geo.cw;
      let a = 0, near = 1, sm = 0;
      if (tok.tile) {
        const sr = env.seam[tok.r];
        a = G.smooth(-0.3 * cw, 0.3 * cw, Math.min(tok.x - sr.l, sr.r - tok.x));
        const d = Math.max(sr.l - tok.x, tok.x - sr.r, 0);
        near = 0.25 + 0.75 * G.smooth(0, 2.6 * cw, d);
        sm = G.clamp((tok.x - sr.l) / (sr.r - sr.l));
      }
      const set = edu ? FE : FA;
      tok.text = edu ? tok.tb : tok.ta;
      if (a === 0 && near === 1 && k === 1) return set[tok.lvl];
      const fs = tok.fs;
      fs.color = set[tok.lvl].color;
      fs.alpha = set[tok.lvl].alpha * k * near * (1 - a);
      if (a === 0) return fs;
      const ts = tok.ts;
      ts.bg = BG(sm);
      ts.bgAlpha = a;
      ts.color = FG(sm);
      ts.alpha = (0.88 - 0.05 * sm) * a * k;
      return tok.pair;
    },
  });
})();

})({ GlyphArt });

export const id = "advice-seam";
export const ground = "#F1F4F7";

export function mount(element, options) {
  const art = GlyphArt.mount(element, id, options || {});
  return function unmount() {
    art.destroy();
  };
}

export default mount;
