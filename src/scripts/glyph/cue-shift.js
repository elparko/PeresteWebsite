// Pereste glyph art: cue-shift. ES module; imports the shared engine from ./glyph-engine.js.
import { GlyphArt } from "./glyph-engine.js";

(function (window) {
(function () {
  const G = window.GlyphArt, P = G.P;
  const FIELD_WORDS = [
    "911", "ems", "stop", "routine", "cost", "distance", "doctor", "neutral", "same length", "triage", "urgent",
  ];
  const FIELD = { color: P.ink, alpha: 0.095 };
  const PERIOD = 11.0;
  const smooth = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));

  G.register({
    id: "cue-shift",
    title: "Same length, softer triage",
    line: "An ASCII field comparing a neutral sentence against a patient circumstance sentence of identical token length; when the circumstance sentence slides in, the emergency triage marker drops.",
    ground: "wash",
    split: true,
    animated: true,
    restT: 6.5,
    tokens: function (env) {
      const fs = env.w < 420 ? 11 : 13;
      env.ctx.font = "400 " + fs + "px " + env.MONO;
      const cw = env.ctx.measureText("0").width, lh = fs * 1.75;
      env.geo = { kind: "words", fs: fs, cw: cw, lh: lh };

      const boxW = Math.min(env.w * 0.8, 348);
      const boxH = Math.min(env.h * 0.62, 168);
      const bx0 = (env.w - boxW) / 2, by0 = (env.h - boxH) / 2;
      env.box = { x0: bx0, y0: by0, x1: bx0 + boxW, y1: by0 + boxH, w: boxW, h: boxH };

      const out = [];
      const rows = Math.ceil(env.h / lh) + 1, cols = Math.ceil(env.w / cw) + 1;
      const put = (y, c0, word) => {
        for (let i = Math.max(c0, 0); i < Math.min(c0 + word.length, cols); i++)
          if (word[i - c0] !== " ") out.push({ x0: i * cw, w: cw, x: (i + 0.5) * cw, y: y, text: word[i - c0], style: FIELD });
      };
      const pick = (r, j) => FIELD_WORDS[Math.floor(G.hash(r, j, 53) * FIELD_WORDS.length)];
      for (let r = 0; r < rows; r++) {
        const y = (r + 0.5) * lh - (rows * lh - env.h) / 2;
        let j = 0;
        if (y + lh / 2 > by0 - 6 && y - lh / 2 < by0 + boxH + 6) {
          for (let c1 = Math.floor((bx0 - cw) / cw); c1 > 0 && bx0 > 8 * cw; ) {
            const word = pick(r, j++); put(y, c1 - word.length, word); c1 -= word.length + 1;
          }
          for (let c0 = Math.ceil((bx0 + boxW + cw) / cw); c0 < cols && env.w - (bx0 + boxW) > 8 * cw; ) {
            const word = pick(r, j++); put(y, c0, word); c0 += word.length + 1;
          }
          continue;
        }
        for (let c0 = -Math.floor(G.hash(r, 0, 13) * 14); c0 < cols; ) {
          const word = pick(r, j++); put(y, c0, word); c0 += word.length + 1;
        }
      }
      return out;
    },
    rest: (tok) => tok.style,
    paint: (tok) => tok.style,
    after: function (ctx, env) {
      const b = env.box;
      const u = env.reduced ? 0.65 : (((env.t % PERIOD) + PERIOD) % PERIOD) / PERIOD;
      const cue = u < 0.42 ? 0 : u < 0.52 ? smooth((u - 0.42) / 0.1) : u < 0.92 ? 1 : 1 - smooth((u - 0.92) / 0.08);
      const isCue = cue > 0.5;
      const fs = env.w < 420 ? 10.5 : 12;

      ctx.textBaseline = "middle";
      // Identical-width token bar (representing exact 0-token-delta)
      const barX = b.x0 + 10, barW = b.w - 20, barH = 28;
      ctx.fillStyle = isCue ? P.amber : P.tealPale;
      ctx.fillRect(barX, b.y0 + 10, barW, barH);
      ctx.font = "500 " + fs + "px " + env.MONO;
      ctx.fillStyle = P.ink;
      ctx.textAlign = "left";
      ctx.fillText(isCue ? "+ no insurance / cost cue" : "+ neutral filler sentence", barX + 10, b.y0 + 24.5);
      ctx.textAlign = "right";
      ctx.fillText("delta: 0 tok", barX + barW - 10, b.y0 + 24.5);

      // Fixed emergency prompt bar underneath
      ctx.fillStyle = P.indigo;
      ctx.fillRect(barX, b.y0 + 44, barW, 24);
      ctx.fillStyle = P.soft;
      ctx.textAlign = "left";
      ctx.fillText("acute emergency question", barX + 10, b.y0 + 56.5);

      // Horizontal safety rank scale (0..3.0)
      const scY = b.y0 + 108;
      const score = 2.544 - (2.544 - 2.119) * cue;
      const fillW = (score / 3.0) * barW;
      const refW = (2.544 / 3.0) * barW;

      ctx.font = "500 " + (fs - 1) + "px " + env.MONO;
      ctx.textAlign = "left";
      ctx.fillStyle = P.muted;
      ctx.fillText("Qwen3-4B triage rank", barX, scY - 14);
      ctx.textAlign = "right";
      ctx.fillStyle = isCue ? P.amber : P.teal;
      ctx.fillText(score.toFixed(2) + " / 3.00", barX + barW, scY - 14);

      ctx.fillStyle = P.line;
      ctx.fillRect(barX, scY, barW, 18);
      // Ghost neutral reference
      ctx.fillStyle = P.tealPale;
      ctx.globalAlpha = 0.45;
      ctx.fillRect(barX, scY, refW, 18);
      ctx.globalAlpha = 1;
      // Active bar
      ctx.fillStyle = isCue ? P.amber : P.teal;
      ctx.fillRect(barX, scY, fillW, 18);

      // Scale ticks
      ctx.font = "400 " + (fs - 2) + "px " + env.MONO;
      ctx.fillStyle = P.muted;
      ctx.textAlign = "left";
      ctx.fillText("home / clinic", barX, scY + 32);
      ctx.textAlign = "right";
      ctx.fillText("call 911 now", barX + barW, scY + 32);
    },
  });
})();
})({ GlyphArt });

export const id = "cue-shift";
export const ground = "#F1F4F7";

export function mount(element, options) {
  const art = GlyphArt.mount(element, id, options || {});
  return function unmount() { art.destroy(); };
}

export default mount;
