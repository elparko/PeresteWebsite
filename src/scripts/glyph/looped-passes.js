// Pereste glyph art: looped-passes. ES module; imports the shared engine from ./glyph-engine.js.
import { GlyphArt } from "./glyph-engine.js";

(function (window) {
(function () {
  const G = window.GlyphArt, P = G.P;
  const FIELD_WORDS = [
    "pass 1", "pass 2", "pass 3", "layer", "loop", "bank", "token", "avoid", "dose", "coda", "depth", "renal",
  ];
  const FIELD = { color: P.ink, alpha: 0.095 };
  const PERIOD = 9.0;

  G.register({
    id: "looped-passes",
    title: "Three passes through shared middle layers",
    line: "An ASCII diagram of layers 6 to 17 repeating across three passes before entering the output layers where the model picks a space for a dose or AV for AVOID.",
    ground: "wash",
    split: true,
    animated: true,
    restT: 6.8,
    tokens: function (env) {
      const fs = env.w < 420 ? 11 : 13;
      env.ctx.font = "400 " + fs + "px " + env.MONO;
      const cw = env.ctx.measureText("0").width, lh = fs * 1.75;
      env.geo = { kind: "words", fs: fs, cw: cw, lh: lh };

      const boxW = Math.min(env.w * 0.8, 350);
      const boxH = Math.min(env.h * 0.64, 174);
      const bx0 = (env.w - boxW) / 2, by0 = (env.h - boxH) / 2;
      env.box = { x0: bx0, y0: by0, x1: bx0 + boxW, y1: by0 + boxH, w: boxW, h: boxH };

      const out = [];
      const rows = Math.ceil(env.h / lh) + 1, cols = Math.ceil(env.w / cw) + 1;
      const put = (y, c0, word) => {
        for (let i = Math.max(c0, 0); i < Math.min(c0 + word.length, cols); i++)
          if (word[i - c0] !== " ") out.push({ x0: i * cw, w: cw, x: (i + 0.5) * cw, y: y, text: word[i - c0], style: FIELD });
      };
      const pick = (r, j) => FIELD_WORDS[Math.floor(G.hash(r, j, 37) * FIELD_WORDS.length)];
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
        for (let c0 = -Math.floor(G.hash(r, 0, 9) * 14); c0 < cols; ) {
          const word = pick(r, j++); put(y, c0, word); c0 += word.length + 1;
        }
      }
      return out;
    },
    rest: (tok) => tok.style,
    paint: (tok) => tok.style,
    after: function (ctx, env) {
      const b = env.box;
      const u = env.reduced ? 0.85 : (((env.t % PERIOD) + PERIOD) % PERIOD) / PERIOD;
      const fs = env.w < 420 ? 10.5 : 12;
      const nCells = 12; // layers 6..17
      const labelW = 54, outW = 68;
      const trackX = b.x0 + labelW;
      const trackW = b.w - labelW - outW - 14;
      const cellW = trackW / nCells;

      ctx.textBaseline = "middle";
      const ys = [b.y0 + 34, b.y0 + 82, b.y0 + 130];
      const scores = ["0.675", "0.664", "0.692"];

      // Loopback dotted connectors between passes
      ctx.fillStyle = P.teal;
      for (let p = 0; p < 2; p++) {
        const yA = ys[p] + 13, yB = ys[p + 1] - 13;
        for (let s = 0; s < 5; s++) {
          const frac = s / 4;
          const xx = trackX + trackW - frac * trackW;
          const yy = yA + frac * (yB - yA);
          ctx.globalAlpha = 0.45;
          ctx.fillRect(xx - 1, yy - 1, 2, 2);
        }
      }
      ctx.globalAlpha = 1;

      const phase = u * 3.4; // 0..1 pass 1, 1..2 pass 2, 2..3 pass 3, 3..3.4 output commit
      for (let p = 0; p < 3; p++) {
        const y = ys[p];
        const active = phase >= p && phase < p + 1;
        const done = phase >= p + 1;
        ctx.font = "500 " + fs + "px " + env.MONO;
        ctx.textAlign = "left";
        ctx.fillStyle = active || done ? P.ink : P.muted;
        ctx.fillText("pass " + (p + 1), b.x0 + 4, y);

        const pos = active ? (phase - p) * nCells : done ? nCells : -1;
        for (let i = 0; i < nCells; i++) {
          const cx = trackX + i * cellW;
          const isHead = active && Math.floor(pos) === i;
          const lit = i < pos;
          ctx.fillStyle = isHead ? P.teal : lit ? (p === 2 ? P.indigo : P.tealPale) : P.line;
          ctx.fillRect(cx + 1, y - 9, Math.max(3, cellW - 2.5), 18);
        }

        // Right-side score or output commitment
        const rx = trackX + trackW + 10;
        if (p < 2) {
          ctx.fillStyle = P.muted;
          ctx.font = "400 " + (fs - 1) + "px " + env.MONO;
          ctx.fillText(scores[p], rx, y);
        } else {
          const committed = phase >= 2.85;
          ctx.fillStyle = committed ? P.ink : P.line;
          ctx.fillRect(rx, y - 11, outW, 22);
          ctx.fillStyle = committed ? P.soft : P.muted;
          ctx.font = "500 " + (fs - 1) + "px " + env.MONO;
          ctx.textAlign = "center";
          ctx.fillText(committed ? '" " / "AV"' : scores[2], rx + outW / 2, y + 0.5);
        }
      }

      ctx.textAlign = "center";
      ctx.font = "400 " + (fs - 2) + "px " + env.MONO;
      ctx.fillStyle = P.muted;
      ctx.fillText("shared layers 6 to 17  ->  output head", b.x0 + b.w / 2, b.y1 - 8);
    },
  });
})();
})({ GlyphArt });

export const id = "looped-passes";
export const ground = "#F1F4F7";

export function mount(element, options) {
  const art = GlyphArt.mount(element, id, options || {});
  return function unmount() { art.destroy(); };
}

export default mount;
