// Ferramentas de pixel art procedural — reutilizáveis por qualquer jogo da fábrica.

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return c;
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
export const bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];

function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Buffer de pixels com primitivas que já saem "no estilo" (luz de cima-esquerda, dithering, contorno).
export class PixelBuf {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.d = new Array(w * h).fill(null);
  }
  set(x, y, c) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || !c) return;
    this.d[y * this.w + x] = c;
  }
  get(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    return this.d[y * this.w + x];
  }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  // Elipse sombreada com rampa de cores (escuro -> claro)
  blob(cx, cy, rx, ry, ramp, opts = {}) {
    const L = [-0.45, -0.65, 0.62];
    const stripes = opts.stripes || 0;
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
        const r2 = nx * nx + ny * ny;
        if (r2 > 1) continue;
        const nz = Math.sqrt(1 - r2);
        let v = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
        v = v * 0.85 + 0.1;
        if (stripes && Math.abs(Math.sin((ny + 1) * stripes)) < 0.22) v *= 0.55;
        let idx = v * (ramp.length - 1) + (bayer(x, y) - 0.5) * 0.7;
        idx = Math.max(0, Math.min(ramp.length - 1, Math.round(idx)));
        this.set(x, y, ramp[idx]);
      }
    }
  }
  line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  poly(pts, c) {
    let minY = Infinity, maxY = -Infinity;
    pts.forEach(p => { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); });
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      const xs = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        if ((a[1] <= y + 0.5 && b[1] > y + 0.5) || (b[1] <= y + 0.5 && a[1] > y + 0.5)) {
          xs.push(a[0] + (y + 0.5 - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
        }
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.set(x, y, typeof c === 'function' ? c(x, y) : c);
    }
  }
  // Desenha linhas de texto-mapa: '.' = transparente, outros chars via paleta
  map(rows, pal, ox = 0, oy = 0) {
    rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.' && ch !== ' ') this.set(ox + x, oy + y, pal[ch]); }));
  }
  outline(c) {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.get(x, y)) continue;
      if (this.get(x + 1, y) || this.get(x - 1, y) || this.get(x, y + 1) || this.get(x, y - 1)) add.push([x, y]);
    }
    add.forEach(([x, y]) => this.set(x, y, c));
  }
  toCanvas() {
    const c = makeCanvas(this.w, this.h);
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(this.w, this.h);
    const cache = {};
    this.d.forEach((col, i) => {
      if (!col) return;
      const rgb = cache[col] || (cache[col] = hexToRgb(col));
      img.data[i * 4] = rgb[0]; img.data[i * 4 + 1] = rgb[1]; img.data[i * 4 + 2] = rgb[2]; img.data[i * 4 + 3] = 255;
    });
    ctx.putImageData(img, 0, 0);
    return c;
  }
}

// Mapa espelhado: define a metade esquerda, gera o sprite simétrico
export const mirror = rows => rows.map(r => r + [...r].reverse().join(''));

export function flipX(src) {
  const c = makeCanvas(src.width, src.height);
  const ctx = c.getContext('2d');
  ctx.translate(src.width, 0); ctx.scale(-1, 1);
  ctx.drawImage(src, 0, 0);
  return c;
}

// Silhueta de uma cor (flash de dano)
export function tint(src, color) {
  const c = makeCanvas(src.width, src.height);
  const ctx = c.getContext('2d');
  ctx.drawImage(src, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color; ctx.fillRect(0, 0, c.width, c.height);
  return c;
}

export function mulberry(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
