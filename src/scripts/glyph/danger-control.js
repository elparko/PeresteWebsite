// Pereste glyph art: danger-control. ES module; imports the shared engine from ./glyph-engine.js.
import { GlyphArt } from "./glyph-engine.js";

(function (window) {
(function () {
  const G = window.GlyphArt, P = G.P;
  const FIELD_WORDS = [
    "urgency", "gap", "danger", "harmless", "200 units", "silence", "swap", "reply", "99%", "43%", "step",
  ];
  const FIELD = { color: P.ink, alpha: 0.095 };
  const PERIOD = 12.0;
  const smooth = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));

  G.register({
    id: "danger-control",
    title: "Silencing 200 units vs swapping the reply position",
    line: "An ASCII field comparing dangerous and harmless urgency readings. Silencing the 200 most predictive units leaves more than 99% of the gap intact, whereas swapping the whole reply position cuts it by 43%.",
    ground: "wash",
    split: true,
    animated: true,
    restT: 1.5,
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
      const pick = (r, j) => FIELD_WORDS[Math.floor(G.hash(r, j, 71) * FIELD_WORDS.length)];
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
        for (let c0 = -Math.floor(G.hash(r, 0, 17) * 14); c0 < cols; ) {
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
      const sw = u < 0.44 ? 0 : u < 0.54 ? smooth((u - 0.44) / 0.1) : u < 0.92 ? 1 : 1 - smooth((u - 0.92) / 0.08);
      const isSwap = sw > 0.5;

      // Silence 200 units: 4.44 vs 0.14 (gap 4.30, >99% remains)
      // Swap whole reply position: 3.89 vs 1.43 (gap 2.46, -43%)
      const hi = 4.44 + (3.89 - 4.44) * sw;
      const lo = 0.14 + (1.43 - 0.14) * sw;
      const gap = hi - lo;

      const fs = env.w < 420 ? 10.5 : 12;
      ctx.textBaseline = "middle";

      // Top header bar
      const headH = 28;
      ctx.fillStyle = isSwap ? P.indigo : P.ink;
      ctx.fillRect(b.x0, b.y0, b.w, headH);
      ctx.font = "500 " + fs + "px " + env.MONO;
      ctx.textAlign = "left";
      ctx.fillStyle = P.soft;
      ctx.fillText(isSwap ? "swap reply position" : "silence 200 danger units", b.x0 + 10, b.y0 + headH / 2 + 0.5);
      ctx.textAlign = "right";
      ctx.fillStyle = isSwap ? P.tealPale : P.amber;
      ctx.fillText(isSwap ? "-43% gap" : ">99% holds", b.x1 - 10, b.y0 + headH / 2 + 0.5);

      // Urgency reading tracks (scale 0..5.0)
      const trackX = b.x0 + 12, trackW = b.w - 24;
      const drawBar = (y, label, val, color) => {
        ctx.font = "500 " + (fs - 1) + "px " + env.MONO;
        ctx.textAlign = "left";
        ctx.fillStyle = P.muted;
        ctx.fillText(label, trackX, y);
        ctx.textAlign = "right";
        ctx.fillStyle = color;
        ctx.fillText(val.toFixed(2), trackX + trackW, y);

        const barY = y + 11, barH = 14;
        ctx.fillStyle = P.line;
        ctx.fillRect(trackX, barY, trackW, barH);
        const w = Math.max(4, (val / 5.0) * trackW);
        ctx.fillStyle = color;
        ctx.fillRect(trackX, barY, w, barH);
      };

      drawBar(b.y0 + 52, "dangerous (level 5)", hi, P.amber);
      drawBar(b.y0 + 104, "harmless  (level 1)", lo, P.teal);

      // Gap summary footer
      ctx.font = "500 " + (fs - 1.5) + "px " + env.MONO;
      ctx.textAlign = "center";
      ctx.fillStyle = P.ink;
      ctx.fillText("urgency gap: " + gap.toFixed(2) + "  (baseline 4.33)", b.x0 + b.w / 2, b.y0 + 150);
    },
  });
})();
})({ GlyphArt });

export const id = "danger-control";
export const ground = "#F1F4F7";

export function mount(element, options) {
  const art = GlyphArt.mount(element, id, options || {});
  return function unmount() { art.destroy(); };
}

export default mount;
