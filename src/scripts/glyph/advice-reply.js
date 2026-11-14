// Pereste glyph art: advice-reply. ES module; imports the shared engine from ./glyph-engine.js.
// Built by build_dist.py from ../pieces/advice-reply.js; edit the source, not this file.
import { GlyphArt } from "./glyph-engine.js";

(function (window) {
// A question and two replies to it, as rows of letter tiles over a faint field of requests.
// At rest all three are lit: the question in ink, the unchanged model's reply that refers the person
// to a provider in indigo, and the edited model's third-person explanation in pale teal. Once a loop
// the explanation steps back while the referral answers alone, the two trade, and both return.
// Every state keeps the letters at 4.5:1 or more against their own tile.
(function () {
  const G = window.GlyphArt, P = G.P;
  const FIELDWORDS = ["what should I take?", "how does it work?", "should I worry?", "what is it?", "explain", "in general"];
  const QUESTION = ["what should I take?"];
  const ADVICE = ["you should contact your", "healthcare provider"];
  const EDUCATION = ["a cough with yellow phlegm", "that lasts for ten days is", "typically a sign of a", "respiratory infection."];
  const COLS = 26 + 2;

  // Seconds in the loop: the education reply steps back at E_OUT, the two trade at SWAP,
  // and the advice reply returns at A_IN. Each change takes TRADE seconds.
  const PERIOD = 24, E_OUT = 13, SWAP = 16, A_IN = 19, TRADE = 1.5;
  // While both replies rest, a soft lighter patch about three letters wide reads along the
  // explanation from READ0 at READ_RATE letters a second, then leaves it.
  const READ0 = 1.5, READ_RATE = 9, READ_W = 2.5, READ_DIP = 0.25;
  const LEVELS = 24;

  const FIELD = { color: P.ink, alpha: 0.1 };
  const Q = { bg: P.ink, bgAlpha: 1, color: P.white, alpha: 1, weight: 500 };

  // Strength v runs from 0 (set back) to 1 (lit). The indigo tile never drops below 0.8 alpha, where
  // white letters still give 4.7:1; the teal tile fades further because its ink letters stay dark.
  const ADV = [], EDU = [];
  for (let k = 0; k <= LEVELS; k++) {
    const v = k / LEVELS;
    ADV.push({ bg: P.indigo, bgAlpha: 0.8 + 0.2 * v, color: P.white, alpha: 1, weight: 500 });
    EDU.push({ bg: P.tealPale, bgAlpha: 0.28 + 0.72 * v, color: P.ink, alpha: 0.72 + 0.18 * v, weight: 500 });
  }

  function strengths(t) {
    const u = ((t % PERIOD) + PERIOD) % PERIOD;
    const s = (a) => G.smooth(a, a + TRADE, u);
    return [1 - s(SWAP) + s(A_IN), 1 - s(E_OUT) + s(SWAP)];
  }

  function fontSize(env) {
    const fs = Math.min((env.h * 0.72) / (8.4 * 1.7), (env.w * 0.84) / (COLS * 0.6), 17);
    return Math.max(10, Math.floor(fs * 2) / 2);
  }

  G.register({
    id: "advice-reply",
    title: "The reply replaced",
    line: "The question what should I take is answered by two replies in letter tiles, one telling the person to contact a healthcare provider and one explaining that a cough with yellow phlegm that lasts for ten days is typically a sign of a respiratory infection, and once a loop the explanation takes the referral's place.",
    ground: "wash",
    split: true,
    animated: true,
    restT: 0,
    tokens: function (env) {
      const fs = fontSize(env);
      env.ctx.font = "400 " + fs + "px " + env.MONO;
      const cw = env.ctx.measureText("0").width, lh = Math.round(fs * 1.7);
      env.geo = { kind: "words", fs: fs, cw: cw, lh: lh };
      const out = [];

      // The figure: one tile per letter cell, with one blank tile at each end of a row.
      const gap = Math.round(0.6 * lh), height = 7 * lh + 2 * gap;
      const left = Math.round((env.w - COLS * cw) / 2), top = Math.round((env.h - height) / 2);
      const rects = [];
      let read = 0;
      function block(lines, y0, right, kind) {
        lines.forEach(function (s, j) {
          const n = s.length + 2, x0 = right ? left + (COLS - n) * cw : left, y = y0 + (j + 0.5) * lh;
          rects.push([x0, y - lh / 2, x0 + n * cw, y + lh / 2]);
          for (let i = 0; i < n; i++)
            out.push({ x0: x0 + i * cw, w: cw, x: x0 + (i + 0.5) * cw, y: y, text: s[i - 1] || " ", kind: kind, idx: read++ });
        });
      }
      block(QUESTION, top, true, "q");
      block(ADVICE, top + lh + gap, false, "a");
      read = 0;
      block(EDUCATION, top + 3 * lh + 2 * gap, false, "e");

      // The field is set smaller than the figure, as in open-capsule, and starts on a whole row.
      // Field letters whose cell centre lies on a tile row are left out, so the tiles cover the
      // field exactly as opaque tiles would, also while a reply is set back.
      const ffs = env.w < 420 ? 11 : 13;
      env.ctx.font = "400 " + ffs + "px " + env.MONO;
      const fcw = env.ctx.measureText("0").width, flh = ffs * 1.75;
      const rows = Math.floor(env.h / flh), cols = Math.ceil(env.w / fcw) + 1;
      const pad = (env.h - rows * flh) / 2;
      const field = [];
      for (let r = 0; r < rows; r++) {
        const y = pad + (r + 0.5) * flh;
        let line = "", k = 0;
        while (line.length < cols + 24) line += FIELDWORDS[Math.floor(G.hash(r, k++, 5) * FIELDWORDS.length)] + "  ";
        const off = Math.floor(G.hash(r, 0, 3) * 20);
        for (let c = 0; c < cols; c++) {
          const x = (c + 0.5) * fcw;
          let under = false;
          for (const q of rects) if (x > q[0] && x < q[2] && y > q[1] && y < q[3]) under = true;
          if (!under) field.push({ x0: c * fcw, w: fcw, x: x, y: y, text: line[c + off], field: true });
        }
      }
      FIELD.size = ffs;
      return field.concat(out);
    },
    before: function (ctx, env) {
      const s = strengths(env.t);
      env.ka = Math.round(s[0] * LEVELS);
      env.ke = Math.round(s[1] * LEVELS);
      const u = ((env.t % PERIOD) + PERIOD) % PERIOD;
      env.readAt = env.reduced ? -99 : (u - READ0) * READ_RATE;
    },
    rest: function (tok) {
      if (tok.field) return FIELD;
      if (tok.kind === "q") return Q;
      return tok.kind === "a" ? ADV[LEVELS] : EDU[LEVELS];
    },
    paint: function (tok, env) {
      if (tok.field) return FIELD;
      if (tok.kind === "q") return Q;
      if (tok.kind === "a") return ADV[env.ka];
      const d = Math.abs(tok.idx - env.readAt);
      if (d >= READ_W) return EDU[env.ke];
      const dip = READ_DIP * (1 - G.smooth(0, READ_W, d));
      return EDU[Math.min(env.ke, Math.round((1 - dip) * LEVELS))];
    },
  });
})();

})({ GlyphArt });

export const id = "advice-reply";
export const ground = "#F1F4F7";

export function mount(element, options) {
  const art = GlyphArt.mount(element, id, options || {});
  return function unmount() {
    art.destroy();
  };
}

export default mount;
