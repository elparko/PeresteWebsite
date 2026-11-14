// Pereste glyph art: the capsule in three forms for the DoseGate page. ES module; imports ./glyph-engine.js.
// Built by build_dist.py from ../pieces/dosegate.js; edit the source, not this file.
import { GlyphArt } from "./glyph-engine.js";

(function (window) {
// Three forms of the capsule piece made for the DoseGate research page.
// check: a field of dose strings, one value inside the capsule marked and struck.
// split: the capsule held open, one half labelled ORDER and the other OUTPUT, one output value marked.
// gate:  the capsule turning on a vertical gate of characters; what is past the gate is teal, one value is stopped.
// In all three the only motion is the capsule rotating in place.
(function () {
  const G = window.GlyphArt, P = G.P;
  const DOSES = [
    "5 mg", "10 mg", "20 mg", "25 mg", "40 mg", "50 mg", "100 mg", "250 mg", "500 mg", "2.5 mg", "0.5 mg", "1 mg",
    "2 mg", "80 mg", "7.5 mg", "1 g", "5 mL", "10 mL", "2.5 mL", "15 mL", "1 tab", "2 tabs", "1 cap", "50 mcg", "100 mcg",
  ];
  const FIELDS = [
    "order", "dose", "unit", "route", "frequency", "strength", "form", "source", "by mouth", "tablet", "capsule",
    "once a day", "twice a day", "5 mg", "10 mg", "25 mg", "2.5 mL", "50 mcg", "100 mg", "1 tab",
  ];

  function unitOf(env) {
    return Math.min(env.w, env.h * (env.w / env.h > 1.5 ? 1.4 : 1));
  }

  function layout(words) {
    return function (env) {
      const fs = env.w < 420 ? 11 : 13;
      env.ctx.font = "400 " + fs + "px " + env.MONO;
      const cw = env.ctx.measureText("0").width, lh = fs * 1.75;
      const rows = Math.ceil(env.h / lh) + 1, cols = Math.ceil(env.w / cw) + 1;
      env.geo = { kind: "words", fs: fs, cw: cw, lh: lh };
      env.words = [];
      const out = [];
      for (let r = 0; r < rows; r++) {
        const y = (r + 0.5) * lh - (rows * lh - env.h) / 2;
        let col = -Math.floor(G.hash(r, 0, 3) * 9), k = 0, last = -1;
        while (col < cols) {
          let n = Math.floor(G.hash(r, k++, 5) * words.length);
          if (n === last) n = (n + 1) % words.length;
          last = n;
          const text = words[n];
          const word = { text: text, x: (col + text.length / 2) * cw, y: y, x0: col * cw, w: text.length * cw, num: /\d/.test(text) };
          env.words.push(word);
          for (let i = 0; i <= text.length; i++) {
            const c = col + i;
            if (c < 0 || c >= cols) continue;
            out.push({ x0: c * cw, w: cw, x: (c + 0.5) * cw, y: y, text: i < text.length ? text[i] : " ", word: i < text.length ? word : null });
          }
          col += text.length + 1;
        }
      }
      return out;
    };
  }

  function carve(env, toks, cx, cy, a, open, gap) {
    const g = env.g, ux = Math.cos(a), uy = Math.sin(a), v = env.geo.lh * 0.3;
    const o = open * g.r * 0.9 + (gap === undefined ? env.geo.cw * 0.6 : gap);
    for (const tok of toks) {
      const dx = tok.x - cx, dy = tok.y - cy;
      const s0 = dx * ux + dy * uy, n0 = -dx * uy + dy * ux;
      const side = s0 < 0 ? -1 : 1;
      const s = s0 - side * o;
      let m = side;
      for (const d of [-v, v]) {
        const ss = s + d * uy, nn = n0 + d * ux;
        const sc = G.clamp(ss, -g.hl, g.hl);
        if (ss * side < 0 || Math.hypot(ss - sc, nn) > g.r) m = 0;
      }
      tok.m = m;
    }
    let start = 0;
    for (let k = 1; k <= toks.length; k++) {
      if (k < toks.length && toks[k].m === toks[start].m && toks[k].y === toks[start].y) continue;
      if (toks[start].m && k - start < 3) for (let q = start; q < k; q++) toks[q].m = 0;
      start = k;
    }
  }

  function flag(env, tx, ty) {
    let best = null, bd = 1e9;
    for (const w of env.words) {
      if (!w.num || w.x0 < 4 || w.x0 + w.w > env.w - 4) continue;
      const d = Math.hypot(w.x - tx, (w.y - ty) * 1.6);
      if (d < bd) {
        bd = d;
        best = w;
      }
    }
    env.flagged = best;
    if (best) best.flag = true;
  }

  function strike(ctx, env) {
    const w = env.flagged;
    if (!w) return;
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w.x0 - 1, w.y + 0.5);
    ctx.lineTo(w.x0 + w.w + 1, w.y + 0.5);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function chip(ctx, env, text, x, y, dark) {
    const fs = 9;
    ctx.font = "500 " + fs + "px " + env.MONO;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const w = ctx.measureText(text).width + 12, h = 17;
    x = G.clamp(x - w / 2, 4, env.w - w - 4);
    y = G.clamp(y, h / 2 + 4, env.h - h / 2 - 4);
    ctx.fillStyle = dark ? P.ink : P.white;
    ctx.fillRect(x, y - h / 2, w, h);
    if (!dark) {
      ctx.strokeStyle = P.tealPale;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y - h / 2 + 0.5, w - 1, h - 1);
    }
    ctx.fillStyle = dark ? P.white : P.ink;
    ctx.fillText(text, x + 6, y + 0.5);
  }

  const FLAG = { bg: P.amber, color: P.ink, weight: 500 };
  const BG = G.ramp(P.indigo, P.tealPale), FG = G.ramp(P.tealPale, P.ink);

  // A letter does not switch between field and tile in one frame: tok.a (how much it is a tile)
  // and tok.s (which half, 0 indigo to 1 pale teal) ease toward their targets, and the field
  // style and the tile style are drawn on top of each other while they cross-fade.
  function tile(tok, env, field) {
    if (tok.word && tok.word.flag) return FLAG;
    if (tok.m) {
      tok.side = tok.m > 0 ? 1 : 0;
      if (!tok.a) tok.s = tok.side;
    }
    const a = env.fade(tok, "a", tok.m ? 1 : 0, env.rate);
    const s = env.fade(tok, "s", tok.side || 0, env.rate);
    if (a === 0) return field;
    const t = {
      bg: BG(s),
      bgAlpha: a,
      color: FG(s),
      alpha: (0.85 - 0.05 * s) * a,
      weight: 500,
    };
    if (a === 1 || !field) return t;
    return [{ color: field.color, alpha: field.alpha * (1 - a) }, t];
  }

  // The capsule's angle and speed live in env.state, so a resize or a late font does not reset
  // them. Idle: a steady slow turn. Pointer present: a damped spring toward the pointer, so the
  // turn starts and stops without a jump in speed.
  function spin(env, start) {
    const st = env.state;
    if (st.ang === undefined || env.reduced) {
      st.ang = env.opts && env.opts.angle !== undefined ? env.opts.angle : start;
      st.vel = 0.16;
    } else if (env.pointerLive && env.px !== null && Math.hypot(env.px - env.fx, env.py - env.fy) > env.g.r * 0.6) {
      G.springAngle(st, Math.atan2(env.py - env.fy, env.px - env.fx), 7, env.dt);
    } else {
      st.vel += (0.16 - st.vel) * env.ease(2.5);
      st.ang += st.vel * env.dt;
    }
    // Letters cross-fade in about 0.2 s at the idle turn, and faster the faster the capsule turns,
    // so a quick turn toward the pointer does not leave a long trail of half-faded tiles.
    env.rate = 10 + 6 * Math.abs(st.vel);
    return st.ang;
  }

  const TILT = -0.55;
  const GATE_REST = { text: "|", color: P.ink, alpha: 0.55, weight: 500 };
  function gateField(tok, env, col) {
    if (Math.abs(col - env.gc) === 1 && !(tok.word && tok.word.flag)) return null;
    return tok.x > env.gx ? TEAL_FIELD : INK_FIELD;
  }
  const CHECK_FIELD = { color: P.ink, alpha: 0.12 }, INK_FIELD = { color: P.ink, alpha: 0.11 }, TEAL_FIELD = { color: P.teal, alpha: 0.3 };

  G.register({
    id: "dosegate-check",
    title: "Dose check",
    line: "A field of dose strings (5 mg, 2.5 mL, 1 tab) with the capsule picked out in tiles; one value at its centre is marked and struck through.",
    hint: "The capsule turns slowly in place. Point anywhere and it turns to face the pointer.",
    ground: "wash",
    split: true,
    animated: true,
    restT: 0,
    tokens: layout(DOSES),
    setup: function (env, toks) {
      const u = unitOf(env);
      env.g = { hl: u * 0.27, r: u * 0.125 };
      env.toks = toks;
      flag(env, env.fx, env.fy);
    },
    before: function (ctx, env) {
      carve(env, env.toks, env.fx, env.fy, spin(env, TILT), 0);
    },
    rest: function (tok) {
      return tok.word && tok.word.flag ? FLAG : CHECK_FIELD;
    },
    paint: function (tok, env) {
      return tile(tok, env, CHECK_FIELD);
    },
    after: strike,
  });

  G.register({
    id: "dosegate-split",
    title: "Order and output",
    line: "Order vocabulary (dose, unit, route, frequency) fills the field; the capsule is held open, one half labelled ORDER and the other OUTPUT, with one value marked in the gap between them.",
    hint: "The capsule turns slowly in place. Point anywhere and it turns to face the pointer.",
    ground: "wash",
    split: true,
    animated: true,
    restT: 0,
    tokens: layout(FIELDS),
    setup: function (env, toks) {
      const u = unitOf(env);
      env.g = { hl: u * 0.25, r: u * 0.12 };
      env.toks = toks;
      flag(env, env.fx, env.fy);
    },
    before: function (ctx, env) {
      carve(env, env.toks, env.fx, env.fy, spin(env, TILT), 0.42);
    },
    rest: function (tok) {
      return tok.word && tok.word.flag ? FLAG : INK_FIELD;
    },
    paint: function (tok, env) {
      return tile(tok, env, INK_FIELD);
    },
    after: function (ctx, env) {
      strike(ctx, env);
      if (env.w < 400) return;
      const g = env.g, ux = Math.cos(env.state.ang), uy = Math.sin(env.state.ang), d = g.hl + g.r * 1.5 + 22;
      chip(ctx, env, "ORDER", env.fx - ux * d, env.fy - uy * d, true);
      chip(ctx, env, "OUTPUT", env.fx + ux * d, env.fy + uy * d, false);
    },
  });

  G.register({
    id: "dosegate-gate",
    title: "Through the gate",
    line: "The capsule turns on a vertical gate of characters: whatever is past the gate is teal, the field beyond it reads as checked, and one value is stopped at the gate.",
    hint: "The capsule turns slowly in place. Point anywhere and it turns to face the pointer.",
    ground: "wash",
    split: true,
    animated: true,
    restT: 0,
    tokens: layout(FIELDS),
    setup: function (env, toks) {
      const u = unitOf(env);
      env.g = { hl: u * 0.22, r: u * 0.105 };
      env.toks = toks;
      const cw = env.geo.cw;
      env.gc = Math.round(env.fx / cw - 0.5);
      env.gx = (env.gc + 0.5) * cw;
      let best = null, bd = 1e9;
      const ty = env.fy - env.g.hl - env.g.r - env.geo.lh * 0.9;
      for (const w of env.words) {
        if (!w.num || w.y > ty + 1 || w.y < env.geo.lh * 0.5) continue;
        const gap = env.gx - cw - (w.x0 + w.w);
        if (gap < 0 || gap > cw * 6 || w.x0 < 4) continue;
        const d = Math.abs(w.y - ty) + gap * 0.2;
        if (d < bd) {
          bd = d;
          best = w;
        }
      }
      env.flagged = best;
      if (best) best.flag = true;
    },
    before: function (ctx, env) {
      carve(env, env.toks, env.gx, env.fy, spin(env, 0), 0, 0);
      for (const tok of env.toks) if (tok.m) tok.m = tok.x < env.gx ? -1 : 1;
    },
    // The resting style of each letter, which the engine caches: the gate column, the blocked
    // value, a blank column on each side of the gate, and field text (teal past the gate).
    rest: function (tok, env) {
      const col = Math.round(tok.x0 / env.geo.cw);
      if (col === env.gc) return GATE_REST;
      return tok.word && tok.word.flag ? FLAG : gateField(tok, env, col);
    },
    paint: function (tok, env) {
      const col = Math.round(tok.x0 / env.geo.cw);
      if (col === env.gc) {
        const a = env.fade(tok, "a", tok.m ? 1 : 0, env.rate);
        return a === 0 ? GATE_REST : { text: "|", color: P.ink, alpha: 0.55 + 0.35 * a, weight: 500, bg: P.white, bgAlpha: a };
      }
      return tile(tok, env, gateField(tok, env, col));
    },
    after: function (ctx, env) {
      strike(ctx, env);
      if (env.w < 400) return;
      chip(ctx, env, "GATE", env.gx, env.h - 16, true);
      const w = env.flagged;
      if (w) chip(ctx, env, "BLOCKED", w.x0 - 38, w.y, false);
    },
  });
})();

})({ GlyphArt });

export const variants = ["check", "split", "gate"];
export const ground = "#F1F4F7";

export function mount(element, options) {
  const o = options || {};
  const art = GlyphArt.mount(element, "dosegate-" + (o.variant || "gate"), o);
  return function unmount() {
    art.destroy();
  };
}

export default mount;
