// Arte do jogo "Último Posto" — gerada por código no estilo da referência:
// pixel art top-down, ruínas pós-apocalípticas, criaturas azul-ardósia de olhos vermelhos, drones com laser ciano.
import { PixelBuf, mirror, flipX, tint, makeCanvas, mulberry, bayer } from '../engine/pixel.js';
import { addBestiary } from './bestiary.js';

export const PAL = {
  outline: '#0c0e14',
  slate: ['#141821', '#232b3a', '#2f3a4d', '#3f4d63', '#5a6b84'],
  purple: ['#1f1826', '#2f2438', '#433450', '#5c4868', '#7a6286'],
  rust: ['#4a241c', '#6e3626', '#924a32', '#b4653f', '#cf8754'],
  stone: ['#5a5245', '#6a6152', '#7a705e', '#887d69', '#968a74'],
  moss: ['#33421f', '#465a29', '#5b7533', '#759040'],
  bone: '#d9d0bb', eye: '#ff3a3a', eyeHi: '#ffc2a8', cyan: '#6fe3ff', cyanHi: '#e2fbff',
  goo: ['#24301c', '#34442a', '#4a5e36'], blood: '#6e2a26',
};

// ---------------- Jogador ----------------
const PLAYER_PAL = {
  k: '#17131c', h: '#2b2430', H: '#4a3d4f', f: '#3a3238', g: '#ff7a1e', G: '#ffd08a', o: '#b9450f',
  s: '#e3a978', S: '#b07850', d: '#1d302e', j: '#2e4a47', J: '#46695f', b: '#7a6243',
  w: '#24272e', W: '#5a616e', p: '#354d4a', P: '#24383a', B: '#d8cfb6', D: '#9e9480', r: '#d8303a',
};
const PLAYER_HALF = [
  '......kk', '....kkHh', '...kHhhh', '..khHhhh', '..kfffff', '.kfGgoff', '.kfoggfs', '..ksSsss',
  '...ksSSs', '..kkdddd', '.kjJjddj', 'kjJjjjjj', 'kjJbjjjj', 'kssjbwWW', 'kSsjjwww', '.kkjbbbb',
  '..kpPppp', '..kpPpPk', '..kpPpk.', '..kBBDk.', '.kBBBDk.', '.kkkkkk.',
];

function buildPlayer(frame) {
  const b = new PixelBuf(16, 23);
  const rows = mirror(PLAYER_HALF);
  if (frame === 1) { rows.splice(0, 0, '................'); rows.pop(); rows[22] = mirror(['.kkkkkk.'])[0]; } // respiração
  b.map(rows, PLAYER_PAL);
  b.set(11, 11 + frame, PLAYER_PAL.r); b.set(11, 12 + frame, PLAYER_PAL.r);
  return b.toCanvas();
}

// ---------------- Inimigos ----------------
function spider(frame, size = 1, ramp = PAL.slate, accent = null) {
  const s = size;
  const W = Math.round(26 * s), H = Math.round(22 * s);
  const b = new PixelBuf(W, H);
  const cx = W / 2;
  const legC = ramp[1], legHi = ramp[2];
  // patas: 4 por lado, alternando passo
  for (let i = 0; i < 4; i++) {
    const ay = (8 + i * 2.2) * s;
    const ph = ((i + frame) % 2 ? 1 : -1) * s;
    for (const side of [-1, 1]) {
      const ax = cx + side * 4 * s;
      const kx = cx + side * (9 + (i === 1 || i === 2 ? 1 : 0)) * s, ky = ay - (5 - i * 1.6) * s + ph;
      const fx = cx + side * (12.3 - Math.abs(i - 1.5) * 0.6) * s, fy = ay + (i - 1.5) * 3 * s + ph * 1.5 + 3 * s;
      b.line(ax, ay, kx, ky, legC); b.line(ax, ay + 1, kx, ky + 1, legHi);
      b.line(kx, ky, fx, fy, legC);
      if (s > 1.2) b.line(kx + side, ky, fx + side, fy, legC);
    }
  }
  b.blob(cx, 7.5 * s, 7.5 * s, 6.5 * s, ramp, { stripes: 9 });
  if (accent) for (let y = 3 * s; y < 12 * s; y += 3 * s) b.line(cx - 1, y, cx, y + 1, accent);
  b.blob(cx, 15 * s, 5 * s, 4 * s, ramp);
  const ey = Math.round(14.5 * s);
  const ex = Math.round(2 * s);
  for (const side of [-1, 1]) {
    const x = Math.round(cx + side * ex - (side > 0 ? 1 : 0));
    b.set(x, ey, PAL.eye); b.set(x, ey - 1, PAL.eyeHi);
    if (s > 1.2) { b.set(x + side, ey, PAL.eye); b.set(x, ey + 1, PAL.eye); }
  }
  const my = Math.round(17 * s);
  for (let x = -2; x <= 1; x++) b.set(Math.round(cx) + x, my, x % 2 ? PAL.bone : '#5a1a1a');
  b.set(Math.round(cx) - 1, my + 1, PAL.bone); b.set(Math.round(cx), my + 1, '#5a1a1a');
  b.outline(PAL.outline);
  return b.toCanvas();
}

function bat(frame) {
  const b = new PixelBuf(24, 15);
  const cx = 12;
  const wing = frame === 0
    ? [[cx - 1, 6], [cx - 6, 1], [cx - 11, 0], [cx - 10, 3], [cx - 12, 5], [cx - 9, 7], [cx - 6, 7], [cx - 3, 9]]
    : [[cx - 1, 6], [cx - 6, 8], [cx - 10, 13], [cx - 9, 10], [cx - 11, 9], [cx - 7, 9], [cx - 3, 9]];
  for (const side of [-1, 1]) {
    const pts = wing.map(([x, y]) => [cx + (x - cx) * side, y]);
    b.poly(pts, (x, y) => (bayer(x, y) > 0.75 ? PAL.slate[2] : PAL.slate[1]));
    b.line(cx + side, 6, pts[2][0], pts[2][1], PAL.slate[3]);
    b.line(cx + side, 7, pts[4][0], pts[4][1], PAL.slate[2]);
  }
  b.blob(cx, 7, 3.2, 4, PAL.slate);
  b.set(cx - 2, 3, PAL.slate[2]); b.set(cx + 1, 3, PAL.slate[2]); // orelhas
  b.set(cx - 2, 6, PAL.eye); b.set(cx + 1, 6, PAL.eye); b.set(cx - 2, 5, PAL.eyeHi);
  b.set(cx - 1, 9, PAL.bone); b.set(cx, 9, PAL.bone);
  b.outline(PAL.outline);
  return b.toCanvas();
}

function mite(frame) {
  const b = new PixelBuf(13, 11);
  const cx = 6.5;
  for (let i = 0; i < 3; i++) for (const side of [-1, 1]) {
    const y = 4 + i * 2, ph = (i + frame) % 2;
    b.line(cx + side * 3, y, cx + side * 5.5, y + ph * 2 - 1, PAL.purple[1]);
  }
  b.blob(cx, 5, 4, 3.6, PAL.purple, { stripes: 6 });
  b.set(5, 7, PAL.eye); b.set(7, 7, PAL.eye);
  b.outline(PAL.outline);
  return b.toCanvas();
}

function brute(frame, s = 1, ramp = PAL.slate, legs = PAL.rust, accent = PAL.rust) {
  const W = Math.round(32 * s), H = Math.round(30 * s);
  const b = new PixelBuf(W, H);
  const cx = Math.round(W / 2);
  for (let i = 0; i < 3; i++) for (const side of [-1, 1]) {
    const ay = (10 + i * 5) * s, ph = ((i + frame) % 2 ? 1 : -1) * s;
    const kx = cx + side * 13 * s, ky = ay - 3 * s + ph;
    b.line(cx + side * 8 * s, ay, kx, ky, legs[1]); b.line(cx + side * 8 * s, ay + 1, kx, ky + 1, legs[0]);
    b.line(kx, ky, kx + side * 2 * s, ky + (6 * s) + ph, legs[1]);
    if (s > 1.2) b.line(kx + side, ky, kx + side * 2 * s + side, ky + 6 * s + ph, legs[1]);
  }
  b.blob(cx, 12 * s, 10 * s, 10 * s, ramp, { stripes: 7 });
  for (let y = Math.round(3 * s); y < 21 * s; y++) b.set(cx, y, ramp[0]);
  [[-5, 6], [4, 9], [-4, 14], [5, 15], [-7, 10], [7, 12]].forEach(([x, y], i) => {
    if (i > 3 && s < 1.2) return;
    b.set(cx + x * s, y * s, accent[2]); b.set(cx + x * s + 1, y * s, accent[3]);
  });
  b.blob(cx, 22.5 * s, 6.5 * s, 4.5 * s, ramp);
  b.line(cx - 4 * s, 25 * s, cx - 6 * s, 28 * s, PAL.bone); b.line(cx + 3 * s, 25 * s, cx + 5 * s, 28 * s, PAL.bone);
  b.line(cx - 3 * s, 25 * s, cx - 1 * s, 27 * s, PAL.bone); b.line(cx + 2 * s, 25 * s, cx, 27 * s, PAL.bone);
  const ey = Math.round(21 * s);
  for (const ex of [-3, -2, 1, 2]) b.set(cx + ex * s, ey, PAL.eye);
  b.set(cx - 3 * s, ey - 1, PAL.eyeHi); b.set(cx + 1 * s, ey - 1, PAL.eyeHi);
  b.outline(PAL.outline);
  return b.toCanvas();
}

const DRONE = {
  pal: { k: '#0c0e14', a: '#252b36', b: '#384252', c: '#55627a', e: '#6fe3ff', E: '#e2fbff', l: '#4a5262' },
  rows: [
    '..kkkkkkk..', '.kccccccbk.', 'kcbbbbbbbak', 'kbbkeEekbak', 'kbbkeeekbak',
    'kabbbbbbaak', '.kaaaaaaak.', '.kl.k.k.lk.', '.k.......k.',
  ],
};
function drone(frame) {
  const b = new PixelBuf(11, 9);
  const rows = DRONE.rows.slice();
  if (frame) { rows[7] = '.k.lk.kl.k.'; rows[8] = '..k.....k..'; }
  b.map(rows, DRONE.pal);
  return b.toCanvas();
}

function heart(full) {
  const b = new PixelBuf(9, 8);
  const pal = full ? { r: '#d8303a', R: '#ff8a80', d: '#8e1c26' } : { r: '#3a2a33', R: '#4a3842', d: '#2a1e26' };
  b.map(['.rr.rr.', 'rRrrrrr', 'rrrrrrd', '.rrrrd.', '..rrd..', '...d...'], pal, 1, 1);
  b.outline('#120e16');
  return b.toCanvas();
}

function gem(color, hi) {
  const b = new PixelBuf(5, 5);
  b.map(['.c.', 'cHc', '.c.'], { c: color, H: hi }, 1, 1);
  b.outline('#0c0e14');
  return b.toCanvas();
}

// Retrato circular (como o canto do HUD da referência)
function portrait() {
  const b = new PixelBuf(22, 22);
  for (let y = 0; y < 22; y++) for (let x = 0; x < 22; x++) {
    const d = Math.hypot(x - 10.5, y - 10.5);
    if (d < 10.5) b.set(x, y, d > 9.4 ? '#5b7590' : (bayer(x, y) > 0.5 ? '#1c2630' : '#202c38'));
  }
  const p = new PixelBuf(16, 23);
  p.map(mirror(PLAYER_HALF), PLAYER_PAL);
  for (let y = 0; y < 14; y++) for (let x = 0; x < 16; x++) {
    const c = p.get(x, y);
    if (c && Math.hypot(x + 3 - 10.5, y + 5 - 10.5) < 9.4) b.set(x + 3, y + 5, c);
  }
  return b.toCanvas();
}

export function buildArt() {
  const A = {};
  A.player = [buildPlayer(0), buildPlayer(1)];
  A.playerL = A.player.map(flipX);
  A.playerHit = tint(A.player[0], '#ffffff');
  const mk = (fn, ...args) => {
    const f = [fn(0, ...args), fn(1, ...args)];
    const fl = f.map(flipX);
    // elite: silhueta vermelha desenhada 1px ao redor do sprite
    return { frames: f, flipped: fl, hit: tint(f[0], '#ffffff'), red: f.map(c => tint(c, '#ff2a2a')), redF: fl.map(c => tint(c, '#ff2a2a')) };
  };
  A.spider = mk(spider);
  A.bat = mk(bat);
  A.mite = mk(mite);
  A.brute = mk(brute);
  A.boss = mk(spider, 1.7, PAL.slate, '#b42a2a');
  addBestiary(A, mk, { spider, brute });
  A.drone = [drone(0), drone(1)];
  A.heart = heart(true); A.heartEmpty = heart(false);
  A.gem = gem('#5fc04a', '#c8ff9a');
  A.gemBig = gem('#6fe3ff', '#e2fbff');
  A.portrait = portrait();
  return A;
}

export { buildFloor, THEMES } from './biomes.js';

// Respingo de criatura morta (fica no chão)
export function splat(ctx, x, y, r, goo = PAL.goo, rnd = Math.random) {
  for (let k = 0; k < r * 3; k++) {
    const a = rnd() * 6.28, d = rnd() * r;
    ctx.fillStyle = rnd() < 0.7 ? goo[(rnd() * 3) | 0] : PAL.slate[1];
    ctx.fillRect(Math.round(x + Math.cos(a) * d), Math.round(y + Math.sin(a) * d * 0.8), 1 + (rnd() < 0.3), 1);
  }
}

export { makeCanvas };
