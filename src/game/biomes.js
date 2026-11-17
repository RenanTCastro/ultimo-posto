// Cenários por fase: cada tema define piso, cor de detalhe, objetos espalhados e vinheta.
import { PixelBuf, mulberry, bayer } from '../engine/pixel.js';

const RUST = ['#4a241c', '#6e3626', '#924a32', '#b4653f', '#cf8754'];

export const THEMES = {
  ruins: {
    floor: ['#5a5245', '#6a6152', '#7a705e', '#887d69', '#968a74'], tiles: 16, grout: 0, crack: '#4a4238',
    accent: ['#33421f', '#465a29', '#5b7533', '#759040'], accentAmt: 1, stains: ['#6e2a26', '#6e3626'],
    props: { crate: 3, rubble: 2.5, planks: 2, bush: 1.3, pipe: 1.2 }, vignette: '28,20,34', goo: ['#24301c', '#34442a', '#4a5e36'],
  },
  sewer: {
    floor: ['#2a3634', '#33413e', '#3c4c48', '#465752', '#51625c'], tiles: 12, grout: 0, crack: '#1e2826',
    accent: ['#2a4a1a', '#3d6a22', '#56902c', '#7cc23a'], accentAmt: 1.3, stains: ['#1e3a2a', '#3a5a1a'],
    props: { puddle: 3, pipe: 3, grate: 1.5, rubble: 1.5, crate: 0.8 }, vignette: '8,20,18', goo: ['#1e3a1a', '#3d6a22', '#56902c'],
  },
  junk: {
    floor: ['#6a5236', '#7a603f', '#8a6e4a', '#9a7c55', '#a88a60'], tiles: 0, crack: '#5a4430',
    accent: ['#4a3a20', '#6a5028', '#8a6a34', '#a88640'], accentAmt: 0.7, stains: ['#4a3020', '#3a2a20'],
    props: { car: 1.6, tire: 2.5, crate: 2, rubble: 2, planks: 1.5 }, vignette: '40,22,14', goo: ['#3a2418', '#5a3420', '#6e3626'],
  },
  toxic: {
    floor: ['#262420', '#2e2b26', '#36322b', '#3f3a31', '#484137'], tiles: 0, crack: '#1e1c18',
    accent: ['#2a3a1a', '#3a5a1c', '#5a8a1e', '#8fd02a'], accentAmt: 2.2, stains: ['#5a8a1e', '#3a1a44'],
    props: { mushroom: 3.5, bush: 3, rubble: 1, planks: 1 }, vignette: '14,22,8', goo: ['#3a1a44', '#5e2a6a', '#5a8a1e'],
  },
  lab: {
    floor: ['#363a44', '#3e434e', '#474d59', '#515865', '#5c6371'], tiles: 16, grout: 0, crack: '#2a2e36', rivets: true,
    accent: ['#1a3a20', '#2a5a2a', '#3a8a30', '#7dff6a'], accentAmt: 0.35, stains: ['#7dff6a', '#2a5a2a'],
    props: { tank: 2, hazard: 2, crate: 1.5, pipe: 2, rubble: 0.8 }, vignette: '10,14,26', goo: ['#2a5a2a', '#3a8a30', '#5a6b84'],
  },
};

// ruído suave para pisos sem azulejo (terra, areia)
function valueNoise(rnd, W, H, cell) {
  const gw = Math.ceil(W / cell) + 2, gh = Math.ceil(H / cell) + 2;
  const g = Array.from({ length: gw * gh }, rnd);
  return (x, y) => {
    const fx = x / cell, fy = y / cell, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
    const v = (i, j) => g[(iy + j) * gw + (ix + i)] ?? 0.5;
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    return (v(0, 0) * (1 - sx) + v(1, 0) * sx) * (1 - sy) + (v(0, 1) * (1 - sx) + v(1, 1) * sx) * sy;
  };
}

export function buildFloor(W, H, seed = 7, clearR = 70, cy = H / 2, theme = THEMES.ruins) {
  if (typeof theme === 'string') theme = THEMES[theme];
  const rnd = mulberry(seed);
  const b = new PixelBuf(W, H);
  const F = theme.floor;
  if (theme.tiles) {
    const T = theme.tiles;
    const ox = Math.round((W / 2) % T), oy = Math.round(cy % T);
    for (let ty = -1; ty < H / T + 1; ty++) for (let tx = -1; tx < W / T + 1; tx++) {
      const x0 = tx * T + ox - T / 2, y0 = ty * T + oy - T / 2;
      const base = 1 + Math.floor(rnd() * 3);
      const broken = rnd() < 0.08;
      for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
        let i = base;
        const n = rnd();
        if (n < 0.08) i--; else if (n > 0.95) i++;
        if (x === 0 || y === 0) i = 0;
        else if (x === 1 || y === 1) i = Math.min(i + 1, 4);
        else if (x === T - 1 || y === T - 1) i = Math.max(0, i - 1);
        if (theme.rivets && (x === 3 || x === T - 3) && (y === 3 || y === T - 3)) i = 4;
        if (broken && x > 2 && y > 2 && (x + y * 3) % 7 < 2) i = 0;
        b.set(x0 + x, y0 + y, F[Math.max(0, Math.min(4, i))]);
      }
      if (rnd() < 0.3) {
        let x = x0 + 3 + rnd() * (T - 6), y = y0 + 3 + rnd() * (T - 6);
        for (let k = 0; k < T / 2; k++) { b.set(x, y, theme.crack); x += Math.round(rnd() * 2 - 0.6); y += Math.round(rnd() * 2 - 0.4); }
      }
    }
  } else {
    const n1 = valueNoise(rnd, W, H, 14), n2 = valueNoise(rnd, W, H, 5);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const v = n1(x, y) * 0.7 + n2(x, y) * 0.3 + (bayer(x, y) - 0.5) * 0.18 + (rnd() < 0.04 ? -0.25 : 0);
      b.set(x, y, F[Math.max(0, Math.min(4, Math.floor(v * 5)))]);
    }
    for (let k = 0; k < (W * H) / 900; k++) { // pedrinhas
      const x = rnd() * W, y = rnd() * H;
      b.set(x, y, F[4]); b.set(x + 1, y + 1, theme.crack);
    }
  }
  // manchas de detalhe (musgo, gosma, grama seca...)
  const A = theme.accent;
  for (let k = 0; k < (W * H) / 1400 * theme.accentAmt; k++) {
    const x = rnd() * W, y = rnd() * H, r = 2 + rnd() * 4;
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
      const d = Math.hypot(i, j) / r;
      if (d < 1 && rnd() > d * 0.8) b.set(x + i, y + j, A[Math.min(3, Math.floor((1 - d) * 3 + rnd()))]);
    }
  }
  for (let k = 0; k < (W * H) / 6000; k++) {
    const x = rnd() * W, y = rnd() * H;
    for (let i = 0; i < 6; i++) b.set(x + rnd() * 5, y + rnd() * 4, theme.stains[rnd() < 0.5 ? 0 : 1]);
  }
  // objetos nas bordas
  const entries = Object.entries(theme.props), total = entries.reduce((a, e) => a + e[1], 0);
  const placed = [];
  for (let k = 0; k < Math.round((W * H) / 900); k++) {
    const x = rnd() * W, y = rnd() * H;
    if (Math.hypot(x - W / 2, y - cy) < clearR + 25 + rnd() * 30) continue;
    if (placed.some(p => Math.hypot(p[0] - x, p[1] - y) < 20)) continue;
    placed.push([x, y]);
    let r = rnd() * total, kind = entries[0][0];
    for (const [k2, w] of entries) if ((r -= w) <= 0) { kind = k2; break; }
    PROPS[kind](b, x, y, rnd, theme);
  }
  const c = b.toCanvas();
  const ctx = c.getContext('2d');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = (x - W / 2) / (W / 2), dy = (y - cy) / (H / 2);
    const v = Math.max(0, Math.hypot(dx * 0.85, dy * 0.75) - 0.32) * 1.5 + (bayer(x, y) - 0.5) * 0.12;
    const lvl = Math.min(5, Math.floor(v * 7));
    if (lvl > 0) { ctx.fillStyle = `rgba(${theme.vignette},${lvl * 0.13})`; ctx.fillRect(x, y, 1, 1); }
  }
  return c;
}

const SHADOW = '#1a1420';
const PROPS = {
  crate(b, x, y, rnd, th) {
    const w = Math.round(13 + rnd() * 12), h = Math.round(11 + rnd() * 9);
    x = Math.round(x - w / 2); y = Math.round(y - h / 2);
    b.rect(x + 2, y + 2, w, h, SHADOW);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      let c = RUST[2 + (bayer(x + i, y + j) > 0.7 ? 1 : 0)];
      if (j === 0 || i === 0) c = RUST[4];
      if (j === h - 1 || i === w - 1) c = RUST[0];
      if (j % 4 === 3 && i > 0 && i < w - 1) c = RUST[1];
      if (rnd() < 0.05) c = th.accent[1];
      b.set(x + i, y + j, c);
    }
    b.line(x + 1, y + 1, x + w - 2, y + h - 2, RUST[1]);
  },
  rubble(b, x, y, rnd) {
    for (let k = 0; k < 4 + rnd() * 4; k++) {
      const rx = 1.5 + rnd() * 3.5, px = x + rnd() * 14 - 7, py = y + rnd() * 10 - 5;
      b.blob(px + 1, py + 1, rx, rx * 0.8, [SHADOW, SHADOW]);
      b.blob(px, py, rx, rx * 0.8, ['#3e3a3a', '#575151', '#6f6a66', '#8a837c']);
    }
  },
  planks(b, x, y, rnd) {
    const a = rnd() * Math.PI, len = 10 + rnd() * 8;
    for (let k = 0; k < 2 + rnd() * 2; k++) {
      const dx = Math.cos(a) * len / 2, dy = Math.sin(a) * len / 2, o = k * 3 - 3;
      const ox = Math.cos(a + Math.PI / 2) * o, oy = Math.sin(a + Math.PI / 2) * o;
      b.line(x - dx + ox + 1, y - dy + oy + 1, x + dx + ox + 1, y + dy + oy + 1, SHADOW);
      b.line(x - dx + ox, y - dy + oy, x + dx + ox, y + dy + oy, RUST[3]);
      b.line(x - dx + ox, y - dy + oy + 1, x + dx + ox, y + dy + oy + 1, RUST[1]);
    }
  },
  bush(b, x, y, rnd, th) { for (let k = 0; k < 6; k++) b.blob(x + rnd() * 10 - 5, y + rnd() * 8 - 4, 2 + rnd() * 2.5, 2 + rnd() * 2, th.accent); },
  pipe(b, x, y, rnd) {
    const vertical = rnd() < 0.5, len = 18 + rnd() * 16;
    for (let i = 0; i < len; i++) for (let j = 0; j < 4; j++) {
      const c = ['#3a3a44', '#5f6170', '#4a4b58', '#2a2a33'][j];
      vertical ? b.set(x + j, y + i, c) : b.set(x + i, y + j, c);
    }
    const jx = len * 0.5;
    for (let j = -1; j < 5; j++) vertical ? b.set(x + j, y + jx, '#2a2a33') : b.set(x + jx, y + j, '#2a2a33');
  },
  puddle(b, x, y, rnd) {
    const rx = 6 + rnd() * 8, ry = 3 + rnd() * 4;
    b.blob(x, y, rx, ry, ['#0e1e22', '#163038', '#1e4450', '#2a5a68']);
    for (let i = 0; i < 3; i++) b.set(x - rx * 0.4 + i * 2, y - ry * 0.3, '#7ab8c4');
  },
  grate(b, x, y) {
    x = Math.round(x); y = Math.round(y);
    b.rect(x - 7, y - 7, 15, 15, '#1e2624'); b.rect(x - 6, y - 6, 13, 13, '#0a1210');
    for (let i = -5; i <= 5; i += 2) b.line(x + i, y - 6, x + i, y + 6, '#4a5652');
  },
  tire(b, x, y, rnd) {
    for (let k = 0; k < 1 + rnd() * 2; k++) {
      const px = x + k * 5, py = y - k * 3;
      b.blob(px + 1, py + 1, 6, 4.5, [SHADOW, SHADOW]);
      b.blob(px, py, 6, 4.5, ['#141418', '#222228', '#34343c', '#44444e']);
      b.blob(px, py, 2.5, 1.8, ['#0c0c10', '#18181c']);
    }
  },
  car(b, x, y, rnd) {
    x = Math.round(x - 14); y = Math.round(y - 8);
    b.rect(x + 2, y + 3, 28, 16, SHADOW);
    for (let j = 0; j < 15; j++) for (let i = 0; i < 28; i++) {
      let c = RUST[(bayer(x + i, y + j) > 0.6 ? 2 : 1) + (j < 2 ? 2 : 0)];
      if (rnd() < 0.08) c = RUST[0];
      b.set(x + i, y + j, c);
    }
    b.rect(x + 7, y + 3, 6, 9, '#1a2028'); b.rect(x + 15, y + 3, 6, 9, '#1a2028');
    b.set(x + 8, y + 4, '#5a6b84'); b.set(x + 16, y + 4, '#5a6b84');
    b.rect(x - 1, y + 2, 2, 4, '#141418'); b.rect(x + 27, y + 9, 2, 4, '#141418');
  },
  mushroom(b, x, y, rnd) {
    const F = ['#1e1024', '#3a1a44', '#5e2a6a', '#8a4096', '#c070c8'];
    for (let k = 0; k < 2 + rnd() * 3; k++) {
      const px = x + rnd() * 14 - 7, py = y + rnd() * 10 - 5, r = 2 + rnd() * 3;
      b.line(px, py, px, py + r + 2, '#d9d0bb');
      b.blob(px, py, r + 1, r * 0.75, F);
      b.set(px - 1, py - 1, '#f0c8f8'); b.set(px + 1, py, '#7dff6a');
    }
  },
  tank(b, x, y, rnd) {
    x = Math.round(x - 6); y = Math.round(y - 10);
    b.rect(x + 2, y + 2, 12, 20, SHADOW);
    for (let j = 0; j < 20; j++) for (let i = 0; i < 12; i++) b.set(x + i, y + j, ['#3a3f4a', '#666f7e', '#93a3ba', '#666f7e', '#515865', '#3a3f4a'][Math.min(5, i >> 1)]);
    for (let j = 5; j < 15; j++) for (let i = 2; i < 10; i++) b.set(x + i, y + j, j < 7 ? '#1a3a20' : (bayer(i, j) > 0.7 ? '#b8ff9a' : '#7dff6a'));
    b.rect(x, y, 12, 2, '#2a2e36'); b.rect(x, y + 18, 12, 2, '#2a2e36');
  },
  hazard(b, x, y) {
    x = Math.round(x - 9); y = Math.round(y - 5);
    for (let j = 0; j < 10; j++) for (let i = 0; i < 18; i++) b.set(x + i, y + j, ((i + j) >> 2) % 2 ? '#d8c030' : '#1a1a20');
  },
};
