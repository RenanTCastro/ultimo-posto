// Novas criaturas, chefes e sprites de armas — mesmo estilo (sombreamento + contorno escuro).
import { PixelBuf, bayer } from '../engine/pixel.js';

export const RAMPS = {
  toxic: ['#16200f', '#24361a', '#365224', '#4f7430', '#74a040'],
  sewer: ['#10201f', '#1b3533', '#284c48', '#3a6862', '#548c82'],
  lab: ['#1a1d24', '#2c323d', '#465062', '#66748a', '#93a3ba'],
  orange: ['#4a1a08', '#8a3410', '#c85a18', '#ff8a2a', '#ffd08a'],
  ghost: ['#2a2440', '#4a4470', '#7a78a8', '#b0b4d8', '#e4e8ff'],
  wasp: ['#3a2a08', '#7a5a10', '#b88a18', '#e8c030', '#fff090'],
  rat: ['#1e1814', '#3a2e26', '#584638', '#76604c', '#957c62'],
  moth: ['#1c2418', '#2f3d26', '#4a5e36', '#6f8a4a', '#a4c46a'],
  fungus: ['#1e1024', '#3a1a44', '#5e2a6a', '#8a4096', '#c070c8'],
  rust: ['#4a241c', '#6e3626', '#924a32', '#b4653f', '#cf8754'],
  slate: ['#141821', '#232b3a', '#2f3a4d', '#3f4d63', '#5a6b84'],
};
const OUT = '#0c0e14', EYE = '#ff3a3a', EYEHI = '#ffc2a8', BONE = '#d9d0bb';

function toad(frame, s = 1, ramp = RAMPS.toxic, eye = '#ffd23a') {
  const W = Math.round(24 * s), H = Math.round(20 * s), cx = W / 2;
  const b = new PixelBuf(W, H);
  const sq = frame ? 0.5 * s : 0;
  for (const side of [-1, 1]) b.blob(cx + side * 8.5 * s, 14 * s, 3.8 * s, 2.8 * s, ramp.slice(0, 4));
  b.blob(cx, 11 * s + sq, 9.5 * s, 7 * s - sq, ramp, { stripes: 0 });
  for (let i = 0; i < 6 * s; i++) b.set(cx - 5 * s + ((i * 7) % (10 * s)), 9 * s + ((i * 3) % (5 * s)), ramp[4]); // pintas
  for (const side of [-1, 1]) {
    b.blob(cx + side * 4.5 * s, 5 * s + sq, 2.8 * s, 2.5 * s, ramp);
    b.set(cx + side * 4.5 * s - (side > 0 ? 1 : 0), 5 * s + sq, eye);
    b.set(cx + side * 4.5 * s - (side > 0 ? 1 : 0), 6 * s + sq, OUT);
  }
  const my = Math.round(13 * s + sq);
  if (frame) { b.blob(cx, my, 3 * s, 1.6 * s, ['#3a0f14', '#5a1a1a']); b.set(cx, my, '#9ae04a'); }
  else b.line(cx - 4 * s, my, cx + 4 * s, my, ramp[0]);
  b.outline(OUT);
  return b.toCanvas();
}

function slime(frame, s = 1, ramp = RAMPS.toxic, spots = null) {
  const W = Math.round(20 * s), H = Math.round(17 * s), cx = W / 2;
  const b = new PixelBuf(W, H);
  const [rx, ry, cy] = frame ? [8.6 * s, 5.4 * s, 10.4 * s] : [7.6 * s, 6.3 * s, 9.6 * s];
  b.blob(cx, cy, rx, ry, ramp);
  b.blob(cx + 1 * s, cy + 1 * s, rx * 0.35, ry * 0.3, ramp.slice(0, 2)); // núcleo
  b.set(cx + 1 * s, cy + 1 * s, BONE);
  b.set(cx - rx * 0.5, cy - ry * 0.55, '#f0ffe0'); b.set(cx - rx * 0.5 + 1, cy - ry * 0.55, ramp[4]);
  if (spots) for (let i = 0; i < 7; i++) {
    const a = i * 2.4, r = rx * (0.3 + (i % 3) * 0.2);
    const x = cx + Math.cos(a) * r, y = cy - ry * 0.3 + Math.sin(a) * ry * 0.4;
    b.set(x, y, spots); b.set(x + 1, y, spots);
  }
  for (const side of [-1, 1]) { b.set(cx + side * 2.5 * s - (side > 0 ? 1 : 0), cy - 1 * s, OUT); b.set(cx + side * 2.5 * s - (side > 0 ? 1 : 0), cy - 1 * s + 1, EYE); }
  b.outline(OUT);
  return b.toCanvas();
}

function crab(frame, s = 1, ramp = RAMPS.rust, glow = null) {
  const W = Math.round(30 * s), H = Math.round(22 * s), cx = W / 2;
  const b = new PixelBuf(W, H);
  for (let i = 0; i < 3; i++) for (const side of [-1, 1]) {
    const ay = (7 + i * 2.5) * s, ph = ((i + frame) % 2 ? 1 : -1) * s;
    b.line(cx + side * 6 * s, ay, cx + side * 12 * s, ay - 2 * s + ph, ramp[1]);
    b.line(cx + side * 12 * s, ay - 2 * s + ph, cx + side * 13.5 * s, ay + 3 * s + ph, ramp[1]);
  }
  b.blob(cx, 9 * s, 9.5 * s, 6.5 * s, ramp, { stripes: 5 });
  b.line(cx - 7 * s, 6 * s, cx + 7 * s, 6 * s, ramp[4]); // placa frontal (armadura)
  const cy = (16 - frame) * s;
  for (const side of [-1, 1]) {
    b.line(cx + side * 5 * s, 12 * s, cx + side * 8 * s, cy - 1 * s, ramp[1]);
    b.blob(cx + side * 9 * s, cy, 3.8 * s, 3.2 * s, ramp);
    b.line(cx + side * 9 * s, cy + 1 * s, cx + side * 9 * s, cy + 3.5 * s, OUT); // pinça
    b.line(cx + side * 2 * s, 7 * s, cx + side * 2.5 * s, 3 * s, ramp[2]);
    b.set(cx + side * 2.5 * s - (side > 0 ? 1 : 0), 3 * s, glow || EYE);
    b.set(cx + side * 2.5 * s - (side > 0 ? 1 : 0), 2 * s, glow ? '#e2fbff' : EYEHI);
  }
  if (glow) for (let i = 0; i < 9; i++) b.set(cx - 6 * s + i * 1.5 * s, 9 * s + Math.sin(i) * 2 * s, glow);
  b.outline(OUT);
  return b.toCanvas();
}

function rat(frame) {
  const b = new PixelBuf(20, 17), R = RAMPS.rat, cx = 10;
  const tw = frame ? 2 : -2;
  b.line(cx, 3, cx + tw, 0, '#c08878'); b.line(cx + tw, 0, cx + tw * 2, 1, '#c08878');
  for (let i = 0; i < 2; i++) for (const side of [-1, 1]) b.set(cx + side * 6, 6 + i * 4 + ((i + frame) % 2), R[1]);
  b.blob(cx, 7.5, 6, 4.8, R, { stripes: 0 });
  b.blob(cx, 12, 3.6, 3, R);
  b.blob(cx - 3.2, 9.4, 1.6, 1.6, ['#5a3a38', '#a07070', '#d09a96']); b.blob(cx + 3.2, 9.4, 1.6, 1.6, ['#5a3a38', '#a07070', '#d09a96']);
  b.set(cx - 2, 12, EYE); b.set(cx + 1, 12, EYE);
  b.set(cx - 1, 14, BONE); b.set(cx, 14, BONE);
  b.outline(OUT);
  return b.toCanvas();
}

function ghost(frame) {
  const b = new PixelBuf(18, 20), G = RAMPS.ghost, cx = 9;
  b.blob(cx, 7.5, 6.5, 6.5, G);
  for (let y = 8; y < 18; y++) for (let x = 3; x < 15; x++) {
    const edge = 15 + Math.sin(x * 1.3 + frame * 2.2) * 1.8;
    if (y < edge) b.set(x, y, bayer(x, y) > 0.55 ? G[3] : G[2]);
  }
  for (const ex of [5, 11]) { b.blob(ex + 0.5, 7, 1.5, 2.2, [OUT, OUT]); b.set(ex, 7, '#6fe3ff'); }
  b.set(cx - 1, 11, OUT); b.set(cx, 11, OUT); b.set(cx - 1, 12, OUT); b.set(cx, 12, OUT);
  b.outline('#1a1530');
  return b.toCanvas();
}

function moth(frame) {
  const b = new PixelBuf(26, 18), M = RAMPS.moth, cx = 13;
  const up = frame ? [5, 5.4] : [6.5, 4.2];
  for (const side of [-1, 1]) {
    b.blob(cx + side * 6.5, 6.5, up[0], up[1], M);
    b.blob(cx + side * 4.8, 12, 4, 3, M.slice(0, 4));
    const ex = cx + side * 7 - (side > 0 ? 1 : 0);
    b.set(ex, 6, '#ffd23a'); b.set(ex + 1, 6, '#ffd23a'); b.set(ex, 7, '#ffd23a'); b.set(ex + 1, 7, OUT);
    b.line(cx + side, 3, cx + side * 3, 0, M[3]);
  }
  b.blob(cx, 8.5, 1.8, 6, RAMPS.slate);
  b.set(cx - 1, 4, '#7dff6a'); b.set(cx, 4, '#7dff6a');
  b.outline(OUT);
  return b.toCanvas();
}

function bomber(frame) {
  const b = new PixelBuf(17, 17), cx = 8.5;
  const O = frame ? RAMPS.orange.slice(1).concat('#fff4c0') : RAMPS.orange;
  for (let i = 0; i < 3; i++) for (const side of [-1, 1]) b.line(cx + side * 4, 6 + i * 2.5, cx + side * 7, 5 + i * 3 + ((i + frame) % 2), RAMPS.slate[1]);
  b.blob(cx, 6.5, 5.5, 5, O, { stripes: 7 });
  b.blob(cx, 12.2, 3.6, 2.8, RAMPS.slate);
  b.set(cx - 2, 12, EYE); b.set(cx + 1, 12, EYE);
  if (frame) { b.set(cx - 1, 3, '#ffffff'); b.set(cx + 2, 6, '#ffffff'); }
  b.outline(OUT);
  return b.toCanvas();
}

function wasp(frame) {
  const b = new PixelBuf(16, 14), cx = 8;
  const wing = frame ? [[cx, 6], [cx - 7, 1], [cx - 6, 5]] : [[cx, 6], [cx - 7, 8], [cx - 5, 10]];
  for (const side of [-1, 1]) b.poly(wing.map(([x, y]) => [cx + (x - cx) * side, y]), (x, y) => (bayer(x, y) > 0.5 ? '#e8f4f8' : '#9ab8c4'));
  b.blob(cx, 8.5, 2.6, 3.8, RAMPS.wasp, { stripes: 7 });
  b.blob(cx, 3.6, 2.2, 1.9, RAMPS.slate);
  b.set(cx - 1, 3, EYE); b.set(cx, 3, EYE);
  b.set(cx, 13, OUT);
  b.outline(OUT);
  return b.toCanvas();
}

function saw(frame) {
  const b = new PixelBuf(11, 11), c = 5;
  b.blob(c + 0.5, c + 0.5, 4.2, 4.2, ['#2a2a33', '#4a4b58', '#7a7d8c', '#b8bcc8', '#e0e4ec']);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2 + frame * Math.PI / 8;
    b.set(c + 0.5 + Math.cos(a) * 5.2, c + 0.5 + Math.sin(a) * 5.2, '#d0d4dc');
  }
  b.set(c, c, '#1a1a20'); b.set(c + 1, c, '#ff8a2a');
  b.outline(OUT);
  return b.toCanvas();
}

export function addBestiary(A, mk, { spider, brute }) {
  A.spitter = mk(toad, 0.85, RAMPS.toxic);
  A.slime = mk(slime, 1, RAMPS.toxic);
  A.slimelet = mk(slime, 0.55, RAMPS.toxic);
  A.crab = mk(crab, 0.85, RAMPS.rust);
  A.rat = mk(rat);
  A.ghost = mk(ghost);
  A.moth = mk(moth);
  A.bomber = mk(bomber);
  A.wasp = mk(wasp);
  // chefes
  A.bossToad = mk(toad, 2, RAMPS.sewer, '#ff3a3a');
  A.bossGolem = mk(brute, 1.45, RAMPS.rust, RAMPS.slate, RAMPS.orange);
  A.bossMother = mk(slime, 2.4, RAMPS.fungus, '#f0c8f8');
  A.bossMutant = mk(crab, 1.7, RAMPS.lab, '#7dff6a');
  A.saw = [saw(0), saw(1)];
}
