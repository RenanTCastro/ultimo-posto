// Gráficos realistas: carrega a arte (src/art/*.webp) e desenha criaturas, herói, cenário e efeitos.
// Escala: as imagens guardam PPU pixels por unidade lógica do jogo.
import { screen } from '../engine/core.js';
import { mulberry } from '../engine/pixel.js';

const PPU = 6; // pixels da imagem por unidade lógica
const CREATURE_SCALE = 1.45; // a arte realista tem bastante borda vazia: amplia para ler bem no celular
const urls = import.meta.glob('../art/**/*.webp', { eager: true, query: '?url', import: 'default' });
const IMG = {};

export async function loadArt() {
  await Promise.all(Object.entries(urls).map(([path, url]) => new Promise(res => {
    const key = path.replace('../art/', '').replace('.webp', '');
    const im = new Image();
    im.onload = () => { IMG[key] = im; res(); };
    im.onerror = () => { console.warn('falhou', key); res(); };
    im.src = url;
  })));
}
export const img = k => IMG[k];

// silhuetas coloridas (dano = branco, elite = vermelho), geradas uma vez
const tintCache = new Map();
function tinted(k, color) {
  const id = k + color;
  if (tintCache.has(id)) return tintCache.get(id);
  const src = IMG[k];
  const c = document.createElement('canvas');
  c.width = src.width; c.height = src.height;
  const x = c.getContext('2d');
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
  tintCache.set(id, c);
  return c;
}

// halo (contorno borrado) pré-calculado: escuro para destacar do chão, vermelho para elite
const haloCache = new Map();
function halo(k, color, blur) {
  const id = k + color + blur;
  if (haloCache.has(id)) return haloCache.get(id);
  const src = IMG[k], pad = Math.ceil(blur * 2);
  const c = document.createElement('canvas');
  c.width = src.width + pad * 2; c.height = src.height + pad * 2;
  const x = c.getContext('2d');
  x.filter = `blur(${blur}px)`;
  x.drawImage(tinted(k, color), pad, pad);
  x.filter = 'none';
  x.globalAlpha = 0.6; x.drawImage(c, 0, 0); // reforça
  const h = { c, pad };
  haloCache.set(id, h);
  return h;
}
// sprite + halo numa imagem só, já no tamanho exato da tela (1 desenho barato por quadro)
const compCache = new Map();
function composite(k, color, blur, w, h) {
  const S = screen.S, tw = Math.round(w * S), th = Math.round(h * S);
  const id = k + '|' + color + blur + '|' + tw;
  if (compCache.has(id)) return compCache.get(id);
  const hl = halo(k, color, blur), im = IMG[k];
  const sx = tw / im.width, sy = th / im.height;
  const c = document.createElement('canvas');
  c.width = Math.round(hl.c.width * sx); c.height = Math.round(hl.c.height * sy);
  const x = c.getContext('2d');
  x.imageSmoothingQuality = 'high';
  x.drawImage(hl.c, 0, 0, c.width, c.height);
  x.drawImage(im, hl.pad * sx, hl.pad * sy, tw, th);
  const r = { c, padX: hl.pad * sx / S, padY: hl.pad * sy / S };
  compCache.set(id, r);
  return r;
}
function drawComposite(ctx, k, color, blur, w, h, yoff = -0.5) {
  const cp = composite(k, color, blur, w, h), S = screen.S;
  ctx.drawImage(cp.c, -w / 2 - cp.padX, h * yoff - cp.padY, cp.c.width / S, cp.c.height / S);
}
function drawHalo(ctx, k, color, blur, w, h, yoff = -0.5) {
  const hl = halo(k, color, blur), im = IMG[k];
  const sx = w / im.width, sy = h / im.height;
  ctx.drawImage(hl.c, -w / 2 - hl.pad * sx, h * yoff - hl.pad * sy, hl.c.width * sx, hl.c.height * sy);
}

// ---------------- Criaturas ----------------
// kind: rot = vista de cima, gira para onde anda | dir3 = frente/costas/lado | none = sem direção
export const CREATURES = {
  spider: { path: 'enemies/spider', kind: 'rot' },
  mite: { path: 'enemies/mite', kind: 'rot' },
  rat: { path: 'enemies/rat', kind: 'rot', sway: 0.12 },
  wasp: { path: 'enemies/wasp', kind: 'rot' },
  bat: { path: 'enemies/bat', kind: 'rot' },
  spitter: { path: 'enemies/spitter', kind: 'rot' },
  boss: { path: 'bosses/boss_queen', kind: 'rot' },
  bossToad: { path: 'bosses/boss_toad', kind: 'rot' },
  brute: { path: 'enemies/brute', kind: 'dir3' },
  crab: { path: 'enemies/crab', kind: 'dir3' },
  bomber: { path: 'enemies/bomber', kind: 'dir3' },
  moth: { path: 'enemies/moth', kind: 'dir3' },
  bossGolem: { path: 'bosses/boss_golem', kind: 'dir3' },
  bossMother: { path: 'bosses/boss_mother', kind: 'dir3' },
  bossMutant: { path: 'bosses/boss_mutant', kind: 'dir3' },
  slime: { path: 'enemies/slime', kind: 'none' },
  slimelet: { path: 'enemies/slimelet', kind: 'none' },
  ghost: { path: 'enemies/ghost', kind: 'none' },
};

function creatureKey(c, frame, dx, dy) {
  if (c.kind === 'dir3') {
    if (Math.abs(dx) > Math.abs(dy) * 0.9) return { k: `${c.path}_side_${frame}`, flip: dx < 0 };
    return { k: `${c.path}_${dy < 0 ? 'back' : 'front'}_${frame}`, flip: false };
  }
  return { k: `${c.path}_${frame}`, flip: c.kind === 'none' && dx < 0 };
}

// Desenha uma criatura centrada em (x,y). dx,dy = direção em que anda. o: { flash, elite, alpha, scale, ang, t }
export function drawCreature(ctx, art, frame, x, y, dx, dy, o = {}) {
  const c = CREATURES[art];
  const { k, flip } = creatureKey(c, frame, dx, dy);
  const im = IMG[k];
  if (!im) return;
  const s = (o.scale || 1) * CREATURE_SCALE / PPU;
  const w = im.width * s, h = im.height * s;
  ctx.save();
  ctx.translate(x, y);
  if (c.kind === 'rot') ctx.rotate((o.ang ?? Math.atan2(dy, dx)) + Math.PI / 2 + (c.sway ? Math.sin((o.t || 0) * 12) * c.sway : 0));
  else ctx.translate(0, -Math.abs(Math.sin((o.t || 0) * 9)) * 0.8); // balanço ao andar
  if (flip) ctx.scale(-1, 1);
  if (o.alpha != null) ctx.globalAlpha = o.alpha;
  // contorno escuro suave (destaca do chão); elite ganha brilho vermelho
  drawComposite(ctx, k, o.elite ? '#ff2a14' : '#000000', o.elite ? 7 : 4, w, h);
  if (o.flash) { ctx.globalAlpha = (o.alpha ?? 1) * 0.4; ctx.drawImage(tinted(k, '#ffffff'), -w / 2, -h / 2, w, h); }
  ctx.restore();
}

// tamanho (unidades) da imagem de uma criatura, para posicionar barra de vida etc.
export function creatureSize(art) {
  const c = CREATURES[art];
  const im = IMG[c.kind === 'dir3' ? `${c.path}_front_0` : `${c.path}_0`];
  return im ? { w: im.width * CREATURE_SCALE / PPU, h: im.height * CREATURE_SCALE / PPU } : { w: 20, h: 20 };
}

// ---------------- Herói (8 direções, 5 desenhos + espelho) ----------------
const PLAYER_DIRS = ['e', 'se', 's', 'se', 'e', 'ne', 'n', 'ne']; // índice = ângulo / 45°
export function drawPlayer(ctx, x, y, ang, o = {}) {
  let i = Math.round(ang / (Math.PI / 4));
  i = ((i % 8) + 8) % 8;
  const k = 'player/player_' + PLAYER_DIRS[i];
  const flip = i >= 3 && i <= 5; // lado esquerdo
  const im = IMG[k];
  const s = (o.scale || 1.6) / PPU;
  const w = im.width * s, h = im.height * s;
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  const breathe = 1 + Math.sin((o.t || 0) * 2.2) * 0.012;
  ctx.scale(1, breathe);
  drawComposite(ctx, k, '#000000', 4, w, h, -0.62);
  if (o.flash) { ctx.globalAlpha = 0.7; ctx.drawImage(tinted(k, '#ffffff'), -w / 2, -h * 0.62, w, h); }
  ctx.restore();
}

// ---------------- Imagens simples ----------------
export function drawImg(ctx, k, x, y, size, o = {}) { // size = largura em unidades
  const im = IMG[k];
  if (!im) return;
  const w = size, h = size * im.height / im.width;
  ctx.save();
  ctx.translate(x, y);
  if (o.rot) ctx.rotate(o.rot);
  if (o.alpha != null) ctx.globalAlpha = o.alpha;
  ctx.drawImage(im, -w / 2, -h / 2, w, h);
  ctx.restore();
}

// ---------------- Cenário: textura de chão + objetos espalhados + vinheta ----------------
const FLOOR_KEY = { ruins: 'ruins', sewer: 'sewer', junk: 'junk', toxic: 'toxic', lab: 'lab' };
export function buildScene(theme, W, H, cy, seed = 1, clearR = 62) {
  const S = screen.S;
  const c = document.createElement('canvas');
  c.width = Math.round(W * S); c.height = Math.round(H * S);
  const ctx = c.getContext('2d');
  ctx.setTransform(S, 0, 0, S, 0, 0);
  const t = FLOOR_KEY[theme] || 'ruins';
  const tile = IMG[`backgrounds/${t}_floor`];
  const T = 120; // tamanho do ladrilho em unidades
  const ox = (seed * 37) % T;
  for (let y = -ox; y < H; y += T) for (let x = -ox; x < W; x += T) ctx.drawImage(tile, x, y, T + 0.5, T + 0.5);
  // escurece levemente o chão para os personagens se destacarem
  ctx.fillStyle = 'rgba(18,12,9,0.42)'; ctx.fillRect(0, 0, W, H);
  // objetos nas bordas
  const rnd = mulberry(seed * 7919 + t.length);
  const props = [1, 2, 3, 4, 5, 6].map(i => IMG[`backgrounds/${t}_prop_${i}`]).filter(Boolean);
  const placed = [];
  for (let k = 0; k < 60 && placed.length < 11; k++) {
    const x = rnd() * W, y = rnd() * H;
    if (Math.hypot((x - W / 2) * 1.1, y - cy) < clearR + 30) continue;
    const size = 24 + rnd() * 16;
    if (placed.some(p => Math.hypot(p[0] - x, p[1] - y) < (p[2] + size) * 0.55)) continue;
    placed.push([x, y, size]);
    const im = props[(rnd() * props.length) | 0];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rnd() - 0.5) * 0.5);
    if (rnd() < 0.5) ctx.scale(-1, 1);
    // sombra suave
    ctx.fillStyle = 'rgba(10,6,4,0.35)';
    ctx.beginPath(); ctx.ellipse(1.5, size * 0.28, size * 0.42, size * 0.16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.drawImage(im, -size / 2, -size / 2, size, size * im.height / im.width);
    ctx.restore();
  }
  // vinheta + luz da tocha em volta do herói
  const g = ctx.createRadialGradient(W / 2, cy, 20, W / 2, cy, Math.max(W, H) * 0.75);
  g.addColorStop(0, 'rgba(255,190,120,0.07)');
  g.addColorStop(0.35, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(8,5,4,0.78)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  return c;
}

// mancha de sangue/gosma que fica no chão
export function splat(fctx, x, y, r, colors) {
  fctx.save();
  for (let i = 0; i < 7; i++) {
    const a = Math.random() * 6.28, d = Math.random() * r * 0.8, rr = r * (0.15 + Math.random() * 0.3);
    fctx.globalAlpha = 0.35 + Math.random() * 0.25;
    fctx.fillStyle = colors[(Math.random() * colors.length) | 0];
    fctx.beginPath(); fctx.ellipse(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7, rr, rr * 0.7, a, 0, Math.PI * 2); fctx.fill();
  }
  fctx.restore();
}
