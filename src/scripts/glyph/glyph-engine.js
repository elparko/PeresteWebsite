// Pereste glyph art: the shared canvas engine. ES module, no globals and no network requests.
// Built by build_dist.py from ../engine.js; edit the source, not this file.
const scope = {};
(function (window) {
(function () {
  const P = {
    ink: "#232C54",
    indigo: "#3F518F",
    teal: "#0F9BA8",
    tealLight: "#4FC3D0",
    tealPale: "#8CCFDB",
    soft: "#E6F4F6",
    wash: "#F1F4F7",
    line: "#E3E8EF",
    muted: "#5A6472",
    white: "#FFFFFF",
    amber: "#F2A33A",
  };
  const MONO = '"DM Mono", ui-monospace, "SF Mono", Menlo, monospace';
  const pieces = {};
  const order = [];

  function register(p) {
    pieces[p.id] = p;
    if (!order.includes(p.id)) order.push(p.id);
  }

  function hash(i, j, k) {
    let h = (Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263) + Math.imul(k | 0, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }

  function noise(x, y, seed) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const s = (t) => t * t * (3 - 2 * t);
    const a = hash(xi, yi, seed), b = hash(xi + 1, yi, seed);
    const c = hash(xi, yi + 1, seed), d = hash(xi + 1, yi + 1, seed);
    const u = s(xf), v = s(yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(a, b, t) {
    const A = hexToRgb(a), B = hexToRgb(b);
    t = Math.max(0, Math.min(1, t));
    return "rgb(" + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",") + ")";
  }
  const clamp = (v, a, b) => Math.max(a === undefined ? 0 : a, Math.min(b === undefined ? 1 : b, v));
  const smooth = (a, b, v) => {
    const t = clamp((v - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };

  function inTri(px, py, ax, ay, bx, by, cx, cy) {
    const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
    const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
    const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
    const neg = d1 < 0 || d2 < 0 || d3 < 0, pos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(neg && pos);
  }

  // The Pereste mark in its own coordinates (viewBox 0 0 100 104).
  // Returns the part of the mark at a point, or null.
  function logoPart(x, y) {
    if ((x - 50) * (x - 50) + (y - 18.5) * (y - 18.5) <= 6.25) return "lamp";
    if (inTri(x, y, 50, 6, 41, 15, 59, 15)) return "roof";
    if (x >= 43 && x <= 57 && y >= 15 && y <= 22) return "lantern";
    if (x >= 39 && x <= 61 && y > 22 && y <= 25.5) return "gallery";
    if (y > 25.5 && y <= 62 && Math.abs(x - 50) <= 6 + (4 * (y - 25.5)) / 36.5) return "tower";
    if (x >= 35 && x <= 65 && y > 62 && y <= 66) return "base";
    if (inTri(x, y, 40, 18.5, 2, 7.5, 2, 29.5)) return "beamL";
    if (inTri(x, y, 60, 18.5, 98, 7.5, 98, 29.5)) return "beamR";
    const stones = [[46, 71, 4, 2], [55, 80, 5.5, 2.7], [45, 89, 7, 3.4], [54, 99, 8.5, 4.2]];
    for (let i = 0; i < 4; i++) {
      const s = stones[i];
      const dx = (x - s[0]) / s[2], dy = (y - s[1]) / s[3];
      if (dx * dx + dy * dy <= 1) return "stone" + (i + 1);
    }
    return null;
  }

  // Rasterise any drawing to a sampler(u, v) -> 0..1 coverage.
  function mask(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    draw(g, w, h);
    const d = g.getImageData(0, 0, w, h).data;
    return function (u, v) {
      const x = Math.floor(u * w), y = Math.floor(v * h);
      if (x < 0 || y < 0 || x >= w || y >= h) return 0;
      return d[(y * w + x) * 4 + 3] / 255;
    };
  }

  function mount(host, id, opts) {
    opts = opts || {};
    const piece = pieces[id];
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    const cv = document.createElement("canvas");
    cv.setAttribute("aria-hidden", "true");
    cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
    host.appendChild(cv);
    const ctx = cv.getContext("2d");
    const mono = opts.font || MONO;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ptr = { x: 0, y: 0, tx: 0, ty: 0, on: false, k: 0, seen: false };
    const quietRects = opts.quiet || [];
    const quietStrength = piece.quietStrength === undefined ? 0.82 : piece.quietStrength;
    let env = null, toks = [], raf = 0, visible = true, dpr = 1, geo = null, dead = false, lastDraw = 0;
    const t0 = performance.now();

    function quiet(x, y) {
      let q = 0;
      for (const r of quietRects) {
        const x0 = r.x * env.w, y0 = r.y * env.h, x1 = x0 + r.w * env.w, y1 = y0 + r.h * env.h;
        const dx = Math.max(x0 - x, 0, x - x1), dy = Math.max(y0 - y, 0, y - y1);
        const f = (r.feather === undefined ? 0.16 : r.feather) * env.unit;
        q = Math.max(q, 1 - smooth(0, f, Math.hypot(dx, dy)));
      }
      return q;
    }

    function cellTokens() {
      const c = piece.cell ? piece.cell(env) : env.compact ? 15 : 22;
      const ox = env.fx - c / 2 - Math.ceil(env.fx / c) * c;
      const oy = env.fy - c / 2 - Math.ceil(env.fy / c) * c;
      const cols = Math.ceil((env.w - ox) / c), rows = Math.ceil((env.h - oy) / c);
      const fi = Math.round((env.fx - c / 2 - ox) / c), fj = Math.round((env.fy - c / 2 - oy) / c);
      const g = piece.glyphs || "0123456789";
      const out = [];
      for (let j = 0; j < rows; j++)
        for (let i = 0; i < cols; i++) {
          const ci = i - fi, cj = j - fj;
          out.push({
            i: i, j: j, ci: ci, cj: cj,
            x: ox + (i + 0.5) * c, y: oy + (j + 0.5) * c,
            text: g[Math.floor(hash(ci, cj, 7) * g.length)],
          });
        }
      geo = { kind: "cells", c: c, fs: (piece.glyphScale || 0.5) * c };
      return out;
    }

    function wordTokens() {
      const fs = piece.fontSize ? piece.fontSize(env) : env.compact ? 10 : 13;
      ctx.font = "400 " + fs + "px " + mono;
      const cw = ctx.measureText("0").width;
      const lh = fs * (piece.leading || 1.9);
      const rows = Math.ceil(env.h / lh) + 1;
      const words = typeof piece.words === "function" ? piece.words(env) : piece.words;
      const out = [];
      for (let r = 0; r < rows; r++) {
        let x = -Math.floor(hash(r, 0, 3) * 8) * cw, k = 0, last = -1;
        const y = (r + 0.5) * lh - (rows * lh - env.h) / 2;
        while (x < env.w) {
          let n = Math.floor(hash(r, k, 5) * words.length);
          if (n === last) n = (n + 1) % words.length;
          last = n;
          const wd = words[n];
          const a = typeof wd === "string" ? wd : wd.a;
          const b = typeof wd === "string" ? null : wd.b;
          const slot = Math.max(a.length, b ? b.length : 0);
          const word = { r: r, k: k, n: n, a: a, b: b, x0: x, w: slot * cw, x: x + (slot * cw) / 2, y: y };
          if (piece.split) {
            for (let i = 0; i < slot; i++)
              out.push({
                r: r, k: k, i: i, word: word, x0: x + i * cw, w: cw, x: x + (i + 0.5) * cw, y: y,
                text: a[i] || " ", alt: b ? b[i] || " " : null,
              });
          } else {
            word.text = a;
            word.alt = b;
            out.push(word);
          }
          x += (slot + 1) * cw;
          k++;
        }
      }
      geo = { kind: "words", fs: fs, cw: cw, lh: lh };
      return out;
    }

    function layout() {
      const w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      dpr = Math.min(2, devicePixelRatio || 1);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      const f = opts.focus || piece.focus || [0.5, 0.5];
      env = {
        w: w, h: h, unit: Math.min(w, h), fx: f[0] * w, fy: f[1] * h,
        compact: opts.compact === undefined ? w < 520 : opts.compact,
        view: opts.view || "large", reduced: reduced, t: 0, px: null, py: null, pk: 0,
        P: P, hash: hash, noise: noise, mix: mix, clamp: clamp, smooth: smooth, logoPart: logoPart, mask: mask,
        ctx: ctx, MONO: mono, opts: opts,
      };
      toks = piece.tokens ? piece.tokens(env) : piece.mode === "cells" ? cellTokens() : wordTokens();
      if (piece.tokens) geo = env.geo;
      env.geo = geo;
      if (piece.setup) piece.setup(env, toks);
    }

    function draw() {
      if (!env) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, env.w, env.h);
      ctx.globalAlpha = 1;
      if (piece.before) piece.before(ctx, env);
      ctx.textBaseline = "middle";
      const cells = geo.kind === "cells";
      ctx.textAlign = cells ? "center" : "left";
      let font = "";
      for (let n = 0; n < toks.length; n++) {
        const tok = toks[n];
        const s = piece.paint(tok, env);
        if (!s) continue;
        const fade = 1 - quiet(tok.x, tok.y) * quietStrength;
        if (s.bg) {
          ctx.globalAlpha = (s.bgAlpha === undefined ? 1 : s.bgAlpha) * fade * fade;
          ctx.fillStyle = s.bg;
          if (cells) {
            const g = s.gap === undefined ? 1 : s.gap, c = geo.c;
            ctx.fillRect(tok.x - c / 2 + g, tok.y - c / 2 + g, c - 2 * g, c - 2 * g);
          } else if (piece.split) {
            ctx.fillRect(tok.x0 - 0.3, tok.y - geo.lh / 2 + 1, tok.w + 0.6, geo.lh - 2);
          } else {
            ctx.fillRect(tok.x0 - geo.cw / 2, tok.y - geo.lh / 2 + 1, tok.w + geo.cw, geo.lh - 2);
          }
        }
        const text = s.text === undefined ? tok.text : s.text;
        if (!text || text === " " || !s.color) continue;
        const a = (s.alpha === undefined ? 1 : s.alpha) * fade;
        if (a <= 0.004) continue;
        const want = (s.weight || 400) + " " + (s.size || geo.fs) + "px " + mono;
        if (want !== font) ctx.font = font = want;
        ctx.globalAlpha = a;
        ctx.fillStyle = s.color;
        ctx.fillText(text, cells ? tok.x : tok.x0, tok.y + 0.5);
      }
      ctx.globalAlpha = 1;
      if (piece.after) piece.after(ctx, env);
    }

    function frame() {
      raf = 0;
      if (dead || !env || document.hidden) return;
      const animating = piece.animated && opts.animated !== false && !reduced && visible;
      const now = performance.now();
      if (animating && !ptr.on && now - lastDraw < 30) return request();
      lastDraw = now;
      env.t = reduced ? piece.restT || 0 : (performance.now() - t0) / 1000;
      let on = ptr.on;
      if (!on && piece.idle && animating) {
        const p = piece.idle(env);
        if (p) {
          ptr.tx = p[0];
          ptr.ty = p[1];
          on = true;
          if (!ptr.seen) {
            ptr.x = p[0];
            ptr.y = p[1];
            ptr.seen = true;
          }
        }
      }
      const ease = reduced ? 1 : 0.14;
      ptr.x += (ptr.tx - ptr.x) * ease;
      ptr.y += (ptr.ty - ptr.y) * ease;
      ptr.k += ((on ? 1 : 0) - ptr.k) * (reduced ? 1 : 0.1);
      env.pk = ptr.k < 0.004 ? 0 : ptr.k;
      env.px = env.pk ? ptr.x : null;
      env.py = env.pk ? ptr.y : null;
      env.pointerLive = ptr.on;
      draw();
      const settling = Math.abs(ptr.tx - ptr.x) + Math.abs(ptr.ty - ptr.y) > 0.3 || Math.abs((on ? 1 : 0) - ptr.k) > 0.004;
      if (animating || (settling && visible)) request();
    }
    function request() {
      if (!raf && !dead) raf = requestAnimationFrame(frame);
    }

    const target = opts.pointerTarget || host;
    function onMove(e) {
      if (!env) return;
      const r = host.getBoundingClientRect();
      if (!r.width) return;
      ptr.tx = ((e.clientX - r.left) * env.w) / r.width;
      ptr.ty = ((e.clientY - r.top) * env.h) / r.height;
      if (!ptr.seen) {
        ptr.x = ptr.tx;
        ptr.y = ptr.ty;
        ptr.seen = true;
      }
      ptr.on = true;
      request();
    }
    function onLeave() {
      ptr.on = false;
      request();
    }
    function onUp(e) {
      if (e.pointerType !== "mouse") onLeave();
    }
    function onShow() {
      if (!document.hidden) request();
    }
    document.addEventListener("visibilitychange", onShow);
    if (opts.interactive !== false) {
      target.addEventListener("pointermove", onMove);
      target.addEventListener("pointerdown", onMove);
      target.addEventListener("pointerleave", onLeave);
      target.addEventListener("pointercancel", onLeave);
      target.addEventListener("pointerup", onUp);
    }
    const ro = new ResizeObserver(function () {
      layout();
      request();
    });
    ro.observe(host);
    const io = new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible) request();
    });
    io.observe(host);
    layout();
    request();
    if (document.fonts && document.fonts.load) {
      Promise.all([document.fonts.load("400 14px " + mono), document.fonts.load("500 14px " + mono)]).then(function () {
        if (dead) return;
        layout();
        request();
      });
    }
    return {
      destroy: function () {
        dead = true;
        ro.disconnect();
        io.disconnect();
        target.removeEventListener("pointermove", onMove);
        target.removeEventListener("pointerdown", onMove);
        target.removeEventListener("pointerleave", onLeave);
        target.removeEventListener("pointercancel", onLeave);
        target.removeEventListener("pointerup", onUp);
        document.removeEventListener("visibilitychange", onShow);
        cancelAnimationFrame(raf);
        cv.remove();
      },
    };
  }

  window.GlyphArt = {
    P: P, MONO: MONO, pieces: pieces, order: order, register: register, mount: mount,
    hash: hash, noise: noise, mix: mix, clamp: clamp, smooth: smooth, logoPart: logoPart, mask: mask,
  };
})();

})(scope);

export const GlyphArt = scope.GlyphArt;
