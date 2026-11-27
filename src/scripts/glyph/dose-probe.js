// Pereste glyph art: dose-probe. ES module; imports the shared engine from ./glyph-engine.js.
import { GlyphArt } from "./glyph-engine.js";

(function (window) {
(function () {
  const G = window.GlyphArt, P = G.P;
  const FIELD_WORDS = [
    "renal", "hepatic", "CrCl", "avoid", "dose", "schedule", "label", "probe", "check", "mg", "daily", "filter",
  ];
  const FIELD = { color: P.ink, alpha: 0.095 };
  const PERIOD = 12.0;
  const smooth = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));

  G.register({
    id: "dose-probe",
    title: "Self-check blind spot vs internal probe",
    line: "An ASCII field of dosing label words around a central answer line. When the answer switches to a wrongly refused AVOID, the self-check gauge drops below chance while the internal probe catches it.",
    ground: "wash",
    split: true,
    animated: true,
    restT: 1.5,
    tokens: function (env) {
      const fs = env.w < 420 ? 11 : 13;
      env.ctx.font = "400 " + fs + "px " + env.MONO;
      const cw = env.ctx.measureText("0").width, lh = fs * 1.75;
      env.geo = { kind: "words", fs: fs, cw: cw, lh: lh };

      const boxW = Math.min(env.w * 0.78, 340);
      const boxH = Math.min(env.h * 0.62, 168);
      const bx0 = (env.w - boxW) / 2, by0 = (env.h - boxH) / 2;
      env.box = { x0: bx0, y0: by0, x1: bx0 + boxW, y1: by0 + boxH, w: boxW, h: boxH };

      const out = [];
      const rows = Math.ceil(env.h / lh) + 1, cols = Math.ceil(env.w / cw) + 1;
      const put = (y, c0, word) => {
        for (let i = Math.max(c0, 0); i < Math.min(c0 + word.length, cols); i++)
          if (word[i - c0] !== " ") out.push({ x0: i * cw, w: cw, x: (i + 0.5) * cw, y: y, text: word[i - c0], style: FIELD });
      };
      const pick = (r, j) => FIELD_WORDS[Math.floor(G.hash(r, j, 23) * FIELD_WORDS.length)];
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
        for (let c0 = -Math.floor(G.hash(r, 0, 5) * 14); c0 < cols; ) {
          const word = pick(r, j++); put(y, c0, word); c0 += word.length + 1;
        }
      }
      return out;
    },
    rest: (tok) => tok.style,
    paint: (tok) => tok.style,
    after: function (ctx, env) {
      const b = env.box;
      const u = env.reduced ? 0 : (((env.t % PERIOD) + PERIOD) % PERIOD) / PERIOD;
      // 0..0.45: wrongly refused AVOID; 0.5..0.95: numeric dose error
      const blend = u < 0.42 ? 0 : u < 0.52 ? smooth((u - 0.42) / 0.1) : u < 0.92 ? 1 : 1 - smooth((u - 0.92) / 0.08);
      const isDose = blend > 0.5;
      const selfScore = 0.399 + (0.653 - 0.399) * blend;
      const probeScore = 0.743 + (0.751 - 0.743) * blend;

      const fs = env.w < 420 ? 11 : 12.5;
      ctx.textBaseline = "middle";

      // Header tile
      const headH = 30;
      ctx.fillStyle = P.ink;
      ctx.fillRect(b.x0, b.y0, b.w, headH);
      ctx.font = "500 " + fs + "px " + env.MONO;
      ctx.fillStyle = P.soft;
      ctx.textAlign = "left";
      ctx.fillText(isDose ? "FINAL: 500 mg q8h" : "FINAL: AVOID", b.x0 + 12, b.y0 + headH / 2 + 0.5);
      ctx.textAlign = "right";
      ctx.fillStyle = isDose ? P.tealPale : P.amber;
      ctx.fillText(isDose ? "wrong dose" : "wrong refusal", b.x1 - 12, b.y0 + headH / 2 + 0.5);

      // Two gauge rows
      const trackX = b.x0 + 12, trackW = b.w - 24;
      const chanceX = trackX + trackW * 0.5;
      const drawRow = (y, label, val, color) => {
        ctx.font = "500 " + (fs - 1.5) + "px " + env.MONO;
        ctx.textAlign = "left";
        ctx.fillStyle = P.muted;
        ctx.fillText(label, trackX, y);
        ctx.textAlign = "right";
        ctx.fillStyle = color;
        ctx.fillText(val.toFixed(3), trackX + trackW, y);

        const barY = y + 12, barH = 14;
        ctx.fillStyle = P.line;
        ctx.fillRect(trackX, barY, trackW, barH);
        const cells = 24;
        const filled = Math.round(val * cells);
        const cellW = trackW / cells;
        ctx.fillStyle = color;
        for (let i = 0; i < filled; i++) {
          ctx.fillRect(trackX + i * cellW + 1, barY + 2, Math.max(2, cellW - 2.5), barH - 4);
        }
        // 0.50 coin-flip marker
        ctx.fillStyle = P.ink;
        ctx.globalAlpha = 0.45;
        ctx.fillRect(chanceX - 0.75, barY - 3, 1.5, barH + 6);
        ctx.globalAlpha = 1;
      };

      drawRow(b.y0 + 56, "self-check P(No)", selfScore, selfScore < 0.5 ? P.amber : P.indigo);
      drawRow(b.y0 + 114, "internal probe", probeScore, P.teal);

      ctx.font = "400 " + (fs - 2.5) + "px " + env.MONO;
      ctx.textAlign = "center";
      ctx.fillStyle = P.muted;
      ctx.fillText("0.50", chanceX, b.y0 + 150);
    },
  });
})();
})({ GlyphArt });

export const id = "dose-probe";
export const ground = "#F1F4F7";

export function mount(element, options) {
  const art = GlyphArt.mount(element, id, options || {});
  return function unmount() { art.destroy(); };
}

export default mount;
