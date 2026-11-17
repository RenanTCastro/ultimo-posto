// Fonte bitmap 3x5 — nítida em qualquer escala.
const G = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110',
  E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101',
  I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
  M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100',
  Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
  Y: '101101010010010', Z: '111001010100111',
  0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
  4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010',
  8: '111101111101111', 9: '111101111001110',
  ':': '000010000010000', '.': '000000000000010', ',': '000000000010100', '!': '010010010000010',
  '?': '110001010000010', '-': '000000111000000', '+': '000010111010000', '/': '001001010100100',
  '%': '101001010100101', '(': '010100100100010', ')': '010001001001010', "'": '010010000000000',
  '>': '100010001010100', '<': '001010100010001', '=': '000111000111000', '*': '101010101000000',
  ' ': '000000000000000',
};

const cache = new Map();
function glyphCanvas(ch, color) {
  const k = ch + color;
  if (cache.has(k)) return cache.get(k);
  const c = document.createElement('canvas');
  c.width = 3; c.height = 5;
  const ctx = c.getContext('2d');
  ctx.fillStyle = color;
  const g = G[ch] || G['?'];
  for (let i = 0; i < 15; i++) if (g[i] === '1') ctx.fillRect(i % 3, (i / 3) | 0, 1, 1);
  cache.set(k, c);
  return c;
}

export const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
export const textWidth = (s, scale = 1) => Math.max(0, norm(s).length * 4 - 1) * scale;

export function drawText(ctx, s, x, y, color = '#e8e2d0', o = {}) {
  const scale = o.scale || 1;
  s = norm(s);
  const w = textWidth(s, scale);
  if (o.align === 'center') x -= w / 2; else if (o.align === 'right') x -= w;
  x = Math.round(x); y = Math.round(y);
  const shadow = o.shadow === undefined ? '#120e16' : o.shadow;
  for (let pass = shadow ? 0 : 1; pass < 2; pass++) {
    const col = pass === 0 ? shadow : color;
    const dy = pass === 0 ? scale : 0;
    for (let i = 0; i < s.length; i++) {
      ctx.drawImage(glyphCanvas(s[i], col), x + i * 4 * scale, y + dy, 3 * scale, 5 * scale);
    }
  }
  return w;
}

// Quebra texto por largura
export function wrap(s, maxW, scale = 1) {
  const words = norm(s).split(' ');
  const lines = []; let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (textWidth(t, scale) > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}
