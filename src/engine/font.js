// Texto com fonte de verdade (Cinzel, estilo medieval), desenhado em alta resolução.
// Mesma interface da antiga fonte bitmap: y = topo das letras; scale 1 ≈ letras de 5 unidades de altura.
export const FONT = 'Cinzel';
const SIZE = 7; // tamanho da fonte (unidades lógicas) para scale 1

export const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();

let mctx = null;
function measureCtx() {
  if (!mctx) mctx = document.createElement('canvas').getContext('2d');
  return mctx;
}
const fontFor = scale => `700 ${SIZE * scale}px ${FONT}, Georgia, serif`;

export function textWidth(s, scale = 1) {
  const c = measureCtx();
  c.font = fontFor(scale);
  return c.measureText(norm(s)).width;
}

export function drawText(ctx, s, x, y, color = '#ece2c8', o = {}) {
  const scale = o.scale || 1;
  s = norm(s);
  ctx.save();
  ctx.font = fontFor(scale);
  ctx.textAlign = o.align === 'center' ? 'center' : o.align === 'right' ? 'right' : 'left';
  ctx.textBaseline = 'alphabetic';
  const by = y + 5 * scale; // linha de base
  const shadow = o.shadow === undefined ? 'rgba(8,5,3,0.9)' : o.shadow;
  if (shadow) { ctx.fillStyle = shadow; ctx.fillText(s, x + 0.35 * scale, by + 0.6 * scale); }
  ctx.fillStyle = color;
  ctx.fillText(s, x, by);
  const w = ctx.measureText(s).width;
  ctx.restore();
  return w;
}

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

export async function loadFonts() {
  try { await Promise.race([document.fonts.load(fontFor(1)), new Promise(r => setTimeout(r, 2500))]); } catch (e) {}
}
