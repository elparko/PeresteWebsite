// Pereste glyph art: advice-seam. ES module; imports the shared engine from ./glyph-engine.js.
// Built by build_dist.py from ../pieces/advice-seam.js; edit the source, not this file.
import { GlyphArt } from "./glyph-engine.js";

(function (window) {
// A field of short reply phrases, each with an advice wording and an education wording, all
// quoted from the post. One vertical seam of letter tiles, four columns wide, crosses the box:
// its left half is indigo, its right half pale teal. Every phrase whose middle lies left of the
// seam reads in its advice wording, every phrase right of it in its education wording. One ink
// row of emergency words runs across the box, and the seam passes behind it without changing it.
// The seam drifts slowly left and right; a phrase it passes fades out of one wording before
// fading into the other.
(function () {
  const G = window.GlyphArt, P = G.P;
  const PAIRS = [
    ["you should", "is typically"],
    ["based on your symptoms", "is typically a sign of"],
    ["you are likely experiencing", "a respiratory infection"],
    ["your healthcare provider", "lowers blood glucose"],
    ["your symptoms", "the symptoms"],
  ];
  const LEN = PAIRS.map((p) => Math.max(p[0].length, p[1].length));
  const EMERGENCY = [
    ["words are slurred", "call 911", "face looks lazy"],
    ["words are slurred", "call 911"],
    ["call 911"],
  ];

  const HOLD = 5, GLIDE = 2.5, SWING = 0.18, CHANGE = 0.8, RATE = 14, BAND = 4;
  const STOPS = [0, 1, 0, -1];
  const CA = P.indigo, CE = G.mix(P.teal, P.ink, 0.15);
  const FIELD_A = 0.13;
  const pair = (o) => [o, Object.assign({}, o)];
  const FA = pair({ color: CA, alpha: FIELD_A }), FE = pair({ color: CE, alpha: FIELD_A });
  const TXI = P.soft, TXT = P.ink;
  const tileStyle = (s, f) => s
    ? { bg: P.tealPale, bgAlpha: f, color: TXT, alpha: 0.85 * f, weight: 500 }
    : { bg: P.indigo, bgAlpha: f, color: TXI, alpha: 0.92 * f, weight: 500 };
  const EDGE_F = 0.32;
  // TILE[side][faint][alt]: alt has the same look but its own identity, used once the letter
  // differs from the one cached at rest so the engine redraws it.
  const TILE = [0, 1].map((s) => [1, EDGE_F].map((f) => pair(tileStyle(s, f))));
  const EM = { bg: P.ink, bgAlpha: 1, color: P.white, alpha: 0.95, weight: 500 };
  const BG = G.ramp(P.indigo, P.tealPale);

  // The seam holds at the middle, glides right, holds, returns, holds, glides left, holds and
  // returns: held for HOLD seconds at each stop, so most of the loop is the settled picture.
  function seamX(env, t) {
    const seg = HOLD + GLIDE, n = STOPS.length;
    const u = (((t + HOLD / 2) % (seg * n)) + seg * n) % (seg * n);
    const i = Math.floor(u / seg), f = G.smooth(HOLD, seg, u - i * seg);
    const v = STOPS[i] + (STOPS[(i + 1) % n] - STOPS[i]) * f;
    return env.w * (0.5 + SWING * v);
  }
  function bandLeft(env, t) {
    return Math.round((seamX(env, t) - env.ox) / env.geo.cw - BAND / 2);
  }

  function fontSize(env) {
    const fs = Math.min(env.w / 30, env.h / 19.5);
    return G.clamp(Math.floor(fs * 2) / 2, 10, 13.5);
  }

  G.register({
    id: "advice-seam",
    title: "The seam",
    line: 'Short reply phrases fill the field, worded as advice left of a slow vertical seam of indigo and pale teal letter tiles and as education to its right, while a dark row of emergency words such as "words are slurred" and "call 911" crosses the seam unchanged.',
    ground: "wash",
    split: true,
    animated: true,
    restT: 0,
    tokens: function (env) {
      const fs = fontSize(env);
      env.ctx.font = "400 " + fs + "px " + env.MONO;
      const cw = env.ctx.measureText("0").width, lh = fs * 1.75;
      env.geo = { kind: "words", fs: fs, cw: cw, lh: lh };
      const nrow = Math.floor(env.h / lh), ncol = Math.floor(env.w / cw);
      const oy = (env.h - nrow * lh) / 2, ox = (env.w - ncol * cw) / 2;
      env.ox = ox;
      env.ncol = ncol;
      const er = Math.round(0.4 * (nrow - 1));
      const out = [], slots = [];

      // The emergency row: whole cells inside a margin, its phrases spread evenly.
      const m = Math.max(1, Math.round((env.w * 0.04) / cw));
      const ecell = ncol - 2 * m;
      let phr = EMERGENCY[EMERGENCY.length - 1];
      for (const p of EMERGENCY) if (p.join("   ").length + 4 <= ecell) { phr = p; break; }
      const letters = phr.reduce((n, s) => n + s.length, 0);
      const gap = phr.length > 1 ? Math.min(6, Math.floor((ecell - 4 - letters) / (phr.length - 1))) : 0;
      const text = phr.join(" ".repeat(gap));
      const lead = Math.floor((ecell - text.length) / 2);

      for (let r = 0; r < nrow; r++) {
        const y = oy + (r + 0.5) * lh;
        if (r === er) {
          for (let i = 0; i < ecell; i++) {
            const x0 = ox + (m + i) * cw;
            out.push({ em: true, x0: x0, w: cw, x: x0 + cw / 2, y: y, text: text[i - lead] || " " });
          }
          continue;
        }
        const rowF = r === 0 || r === nrow - 1 ? 1 : 0;
        let j = Math.floor(G.hash(r, 0, 3) * 3), k = 0, last = -1;
        while (j < ncol) {
          const fit = [];
          for (let q = 0; q < PAIRS.length; q++) if (q !== last && j + LEN[q] <= ncol) fit.push(q);
          if (!fit.length) break;
          const n = fit[Math.floor(G.hash(r, k, 5) * fit.length)];
          const a = PAIRS[n][0], b = PAIRS[n][1], len = LEN[n];
          k++;
          last = n;
          const slot = { key: r + ":" + k, cx: ox + (j + len / 2) * cw };
          slots.push(slot);
          for (let i = 0; i < len + 2 && j + i < ncol; i++) {
            const x0 = ox + (j + i) * cw, on = i < len;
            out.push({
              j: j + i, x0: x0, w: cw, x: x0 + cw / 2, y: y, faint: rowF,
              slot: on ? slot : null, ta: on ? a[i] || " " : " ", tb: on ? b[i] || " " : " ",
            });
          }
          j += len + 2;
        }
        for (; j < ncol; j++) {
          const x0 = ox + j * cw;
          out.push({ j: j, x0: x0, w: cw, x: x0 + cw / 2, y: y, faint: rowF, slot: null, ta: " ", tb: " " });
        }
      }
      env.slots = slots;
      return out;
    },
    setup: function (env, toks) {
      const st = env.state, cw = env.geo.cw;
      const t = st.t === undefined || env.reduced ? 0 : st.t;
      const jL = st.cw === cw && st.jL !== undefined ? st.jL : bandLeft(env, t);
      const xc = env.ox + (jL + BAND / 2) * cw;
      const ss = st.slots || (st.slots = {});
      for (const slot of env.slots) {
        slot.st = ss[slot.key] || (ss[slot.key] = {});
        slot.rest = slot.cx > xc ? 1 : 0;
      }
      for (const tok of toks) {
        if (tok.em) continue;
        const e = tok.slot ? tok.slot.rest : 0;
        tok.rtext = tok.text = e ? tok.tb : tok.ta;
        const lit = tok.j >= jL && tok.j < jL + BAND;
        tok.rs = lit ? TILE[tok.j >= jL + BAND / 2 ? 1 : 0][tok.faint][0] : (e ? FE : FA)[0];
        tok.fs = { color: "", alpha: 0 };
        tok.ts = { bg: "", bgAlpha: 0, color: "", alpha: 0, weight: 500 };
        tok.pair = [tok.fs, tok.ts];
      }
    },
    before: function (ctx, env) {
      const st = env.state, cw = env.geo.cw, n = env.ncol;
      st.t = env.t;
      const jf = (seamX(env, env.t) - env.ox) / cw - BAND / 2;
      const snap = st.jL === undefined || st.cw !== cw || env.reduced || !st.ca || st.ca.length !== n;
      if (snap) {
        st.cw = cw;
        st.jL = Math.round(jf);
        st.ca = new Float32Array(n);
        st.cs = new Float32Array(n);
      } else if (Math.abs(jf - st.jL) > 0.6) st.jL = Math.round(jf);
      const jL = st.jL, e = snap ? 1 : env.ease(RATE);
      for (let j = 0; j < n; j++) {
        const lit = j >= jL && j < jL + BAND;
        let a = st.ca[j], s = st.cs[j];
        const sg = j >= jL + BAND / 2 ? 1 : 0;
        if (lit && a === 0) s = sg;
        a += ((lit ? 1 : 0) - a) * e;
        if (lit) s += (sg - s) * e;
        if (Math.abs(a - (lit ? 1 : 0)) < 0.004) a = lit ? 1 : 0;
        if (Math.abs(s - Math.round(s)) < 0.004) s = Math.round(s);
        st.ca[j] = a;
        st.cs[j] = s;
      }
      const xc = env.ox + (jL + BAND / 2) * cw, step = env.dt / CHANGE;
      for (const slot of env.slots) {
        const s = slot.st, goal = slot.cx > xc ? 1 : 0;
        if (s.p === undefined || env.reduced) s.p = goal;
        else if (s.p < goal) s.p = Math.min(goal, s.p + step);
        else if (s.p > goal) s.p = Math.max(goal, s.p - step);
      }
      env.ca = st.ca;
      env.cs = st.cs;
    },
    rest: function (tok) {
      return tok.em ? EM : tok.rs;
    },
    paint: function (tok, env) {
      if (tok.em) return EM;
      const p = tok.slot ? tok.slot.st.p : 0, edu = p >= 0.5;
      const k = edu ? G.smooth(0.55, 1, p) : 1 - G.smooth(0, 0.45, p);
      tok.text = edu ? tok.tb : tok.ta;
      const alt = tok.text === tok.rtext ? 0 : 1;
      const a = env.ca[tok.j], s = env.cs[tok.j];
      const set = edu ? FE : FA;
      if (a === 0) {
        if (k === 1) return set[alt];
        tok.fs.color = set[0].color;
        tok.fs.alpha = FIELD_A * k;
        return tok.fs;
      }
      if (a === 1 && k === 1 && (s === 0 || s === 1)) return TILE[s][tok.faint][alt];
      const f = tok.faint ? EDGE_F : 1;
      tok.fs.color = set[0].color;
      tok.fs.alpha = FIELD_A * k * (1 - a);
      const ts = tok.ts, w = G.smooth(0.3, 0.7, s);
      ts.bg = BG(s);
      ts.bgAlpha = a * f;
      ts.color = s < 0.5 ? TXI : TXT;
      ts.alpha = (s < 0.5 ? 0.92 : 0.85) * a * f * k * Math.abs(2 * w - 1);
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
