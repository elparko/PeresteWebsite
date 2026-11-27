// Pereste glyph art: dose-steps. ES module; imports the shared engine from ./glyph-engine.js.
// Built by build_dist.py from ../pieces/dose-steps.js; edit the source, not this file.
import { GlyphArt } from "./glyph-engine.js";

(function (window) {
// The instruction "warfarin 5 mg orally once daily" sits in a row near the top. Each part hangs below
// its own place at a depth proportional to the step, of the model's 36, by which half of the units for
// its kind of word have appeared: 6, 10, 11, 14 and 28. The four other parts hang at most half as far
// as the 5. Once a loop the parts rise to line up just under the row and sink again, warfarin settling
// first and the 5 last.
(function () {
  const G = window.GlyphArt, P = G.P;
  const FIELD_WORDS = [
    "drug name", "dose number", "dose unit", "route", "frequency", "dosage form", "processing step",
    "selective", "fires", "label", "token", "unit", "step", "layer",
  ];
  const PARTS = [
    { text: "warfarin", step: 6, lag: 0 },
    { text: "5", step: 28, lag: 0.05 },
    { text: "mg", step: 11, lag: 0.45 },
    { text: "orally", step: 10, lag: 0.25 },
    { text: "once daily", step: 14, lag: 0.65 },
  ];
  const PHRASE = PARTS.map((p) => p.text).join(" ");
  const HOLD = 17.5, RISE = 2.8, TOP = 1.0, SINK = 4.6, PERIOD = HOLD + RISE + TOP + SINK;
  const FIELD = { color: P.ink, alpha: 0.1 };

  const smooth = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));

  // How far down each part hangs, as a fraction of its settled depth.
  function frac(t, p) {
    const u = ((t % PERIOD) + PERIOD) % PERIOD;
    if (u < HOLD) return 1;
    if (u < HOLD + RISE) return 1 - smooth((u - HOLD) / RISE);
    const s = u - HOLD - RISE - TOP - p.lag;
    return smooth(s / (2.3 + 2.2 * (p.step / 28)));
  }

  G.register({
    id: "dose-steps",
    title: "Dose parts by step",
    line: "The instruction warfarin 5 mg orally once daily sits in a row. Each part hangs below its place at a depth set by the step, of the model's 36, by which half of the units for its kind of word have appeared. Warfarin hangs a little way down, and the 5 hangs far below the rest.",
    ground: "wash",
    split: true,
    animated: true,
    restT: 0,
    tokens: function (env) {
      const fs = env.w < 420 ? 11 : 13;
      env.ctx.font = "400 " + fs + "px " + env.MONO;
      const cw = env.ctx.measureText("0").width, lh = fs * 1.75;
      env.geo = { kind: "words", fs: fs, cw: cw, lh: lh };

      env.ctx.font = "400 100px " + env.MONO;
      const ratio = env.ctx.measureText("0").width / 100;
      const n = PHRASE.length;
      const H = G.clamp(Math.min((env.w * 0.78) / n / ratio, env.h / 16), 11, 19);
      const hcw = ratio * H, th = Math.round(H * 1.55), pad = Math.round(hcw * 0.3);
      const big = 1.45, th5 = th * big;
      const m = Math.max(20, env.h * 0.11);
      // Depth per step: the 36th step would sit at the foot of the free height, so the 5 at step 28
      // keeps visible room below it.
      const k = Math.min((env.h - 2 * m - th / 2) / 36, env.w * 0.024);
      const fig = th / 2 + 28 * k + th5 / 2;
      const yRow = Math.round(G.clamp((env.h - fig) / 2 + env.h * 0.03, m * 0.9, env.h - m - fig) + th / 2);
      let x = Math.round(env.w / 2 - (n * hcw) / 2);
      env.parts = PARTS.map(function (p) {
        const q = { text: p.text, step: p.step, lag: p.lag, x: x, w: p.text.length * hcw, five: p.text === "5" };
        x += (p.text.length + 1) * hcw;
        return q;
      });
      // Risen, the parts line up as a second row, half a line below the first, so no tile touches it.
      const d0 = Math.min(th * 1.5, 6 * k);
      env.hero = { H: H, hcw: hcw, th: th, pad: pad, yRow: yRow, k: k, big: big, d0: d0 };

      const out = [];
      // The source row, as calm ink letters with no tiles. It rests for good.
      const ROW = { color: P.ink, alpha: 0.8, size: H };
      for (const p of env.parts)
        for (let i = 0; i < p.text.length; i++)
          out.push({ x0: p.x + i * hcw, w: hcw, x: p.x + (i + 0.5) * hcw, y: yRow, text: p.text[i], style: ROW });

      // Faint label words at one alpha. Rows beside the figure are laid out from the figure outward, so
      // whole words stop a little short of it and only the tile edge cuts a word.
      const box = {
        x0: env.parts[0].x - pad - cw, x1: x - hcw + pad + cw,
        y0: yRow - th / 2 - lh * 0.45, y1: yRow + 28 * k + th5 / 2 + lh * 0.45,
      };
      const rows = Math.ceil(env.h / lh) + 1, cols = Math.ceil(env.w / cw) + 1;
      const put = (y, c0, word) => {
        for (let i = Math.max(c0, 0); i < Math.min(c0 + word.length, cols); i++)
          if (word[i - c0] !== " ") out.push({ x0: i * cw, w: cw, x: (i + 0.5) * cw, y: y, text: word[i - c0], style: FIELD });
      };
      const pick = (r, j) => FIELD_WORDS[Math.floor(G.hash(r, j, 11) * FIELD_WORDS.length)];
      for (let r = 0; r < rows; r++) {
        const y = (r + 0.5) * lh - (rows * lh - env.h) / 2;
        let j = 0;
        if (y + lh / 2 > box.y0 && y - lh / 2 < box.y1) {
          // A side strip narrower than ten letters would hold only cut words, so it stays empty.
          for (let c1 = Math.floor(box.x0 / cw) - Math.floor(G.hash(r, 1, 7) * 3); c1 > 0 && box.x0 > 10 * cw; ) {
            const word = pick(r, j++);
            put(y, c1 - word.length, word);
            c1 -= word.length + 1;
          }
          for (let c0 = Math.ceil(box.x1 / cw) + Math.floor(G.hash(r, 2, 7) * 3); c0 < cols && env.w - box.x1 > 10 * cw; ) {
            const word = pick(r, j++);
            put(y, c0, word);
            c0 += word.length + 1;
          }
          continue;
        }
        for (let c0 = -Math.floor(G.hash(r, 0, 3) * 16); c0 < cols; ) {
          const word = pick(r, j++);
          put(y, c0, word);
          c0 += word.length + 1;
        }
      }
      return out;
    },
    rest: function (tok) {
      return tok.style;
    },
    paint: function (tok) {
      return tok.style;
    },
    after: function (ctx, env) {
      const h = env.hero, dpr = Math.min(2, window.devicePixelRatio || 1);
      const snap = (v) => Math.round(v * dpr) / dpr;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      for (const p of env.parts) p.f = env.reduced ? 1 : frac(env.t, p);

      // One quiet thread, from the row down to the 5. Each dot fades in as the 5 passes it.
      const five = env.parts[1], gap = 4, dot = 1.4;
      {
        const s = 1 + (h.big - 1) * five.f;
        const top = h.yRow + h.d0 + (five.step * h.k - h.d0) * five.f - (h.th * s) / 2 - 3;
        const cx = Math.round(five.x + five.w / 2);
        ctx.fillStyle = P.teal;
        for (let yy = h.yRow + h.th / 2 + 3; yy < top; yy += gap) {
          ctx.globalAlpha = 0.45 * G.smooth(0, gap * 2, top - yy) * G.smooth(0, 0.35, five.f);
          ctx.fillRect(cx - dot / 2, yy, dot, dot);
        }
      }

      // The parts: bold indigo tiles with pale letters, and the 5 as a pale teal tile with an ink numeral.
      for (const p of env.parts) {
        const s = p.five ? 1 + (h.big - 1) * p.f : 1;
        const y = h.yRow + h.d0 + (p.step * h.k - h.d0) * p.f;
        const cx = p.x + p.w / 2, th = h.th * s;
        let hw = (p.w / 2 + h.pad) * s;
        if (p.five) hw += (th / 2 - hw) * p.f;
        ctx.globalAlpha = 1;
        ctx.fillStyle = p.five ? P.tealPale : P.indigo;
        ctx.fillRect(snap(cx - hw), snap(y - th / 2), snap(2 * hw), snap(th));
        ctx.font = "500 " + (h.H * s).toFixed(2) + "px " + env.MONO;
        ctx.fillStyle = p.five ? P.ink : P.soft;
        ctx.fillText(p.text, cx - (p.w / 2) * s, y + 0.5);
      }
      ctx.globalAlpha = 1;
    },
  });
})();

})({ GlyphArt });

export const id = "dose-steps";
export const ground = "#F1F4F7";

export function mount(element, options) {
  const art = GlyphArt.mount(element, id, options || {});
  return function unmount() {
    art.destroy();
  };
}

export default mount;
