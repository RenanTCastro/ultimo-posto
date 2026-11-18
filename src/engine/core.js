// Núcleo: coordenadas lógicas (180 de largura) desenhadas na resolução real da tela, loop, input, cenas e botões.
import { drawText, textWidth } from './font.js';
import { unlockAudio, sfx } from './audio.js';

export const LOGICAL_W = 180; // largura lógica: o jogo pensa nessas unidades; o desenho sai na resolução real da tela

export const screen = { W: LOGICAL_W, H: 384, scale: 1, S: 1, canvas: null, ctx: null };
export const input = { down: false, x: 0, y: 0, justPressed: false, justReleased: false };

let scene = null, lastT = 0, paused = false;
const buttons = [];

export function initCore(parent) {
  const c = document.createElement('canvas');
  c.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;touch-action:none;';
  parent.appendChild(c);
  screen.canvas = c;
  screen.ctx = c.getContext('2d');
  resize();
  window.addEventListener('resize', resize);

  const toLogical = e => {
    const r = c.getBoundingClientRect();
    input.x = (e.clientX - r.left) / r.width * screen.W;
    input.y = (e.clientY - r.top) / r.height * screen.H;
  };
  c.addEventListener('pointerdown', e => {
    unlockAudio();
    c.setPointerCapture?.(e.pointerId);
    toLogical(e); input.down = true; input.justPressed = true;
    // Botões têm prioridade sobre o gameplay
    for (let i = buttons.length - 1; i >= 0; i--) {
      const b = buttons[i];
      if (!b.disabled && input.x >= b.x && input.x <= b.x + b.w && input.y >= b.y && input.y <= b.y + b.h) {
        input.consumed = true; b.pressed = true; sfx.click(); b.onTap(); break;
      }
    }
  });
  c.addEventListener('pointermove', e => { if (input.down || e.pointerType === 'mouse') toLogical(e); });
  const up = e => { toLogical(e); input.down = false; input.justReleased = true; input.consumed = false; };
  c.addEventListener('pointerup', up);
  c.addEventListener('pointercancel', up);
}

function resize() {
  const vw = window.innerWidth, vh = window.innerHeight;
  screen.W = LOGICAL_W;
  screen.H = Math.round(LOGICAL_W * vh / vw);
  screen.H = Math.max(270, Math.min(440, screen.H));
  screen.scale = vw / screen.W;
  // pixels reais por unidade lógica (limitado para não pesar em tablets)
  const dpr = window.devicePixelRatio || 1;
  screen.S = Math.min(vw * dpr, 1440) / screen.W;
  screen.canvas.width = Math.round(screen.W * screen.S); screen.canvas.height = Math.round(screen.H * screen.S);
  screen.ctx.imageSmoothingEnabled = true; screen.ctx.imageSmoothingQuality = 'low';
  scene?.resize?.();
}

export function setScene(s) {
  buttons.length = 0;
  scene?.exit?.();
  scene = s;
  s.enter?.();
}
export const getScene = () => scene;
export function setPaused(p) { paused = p; }
export const isPaused = () => paused;

export function start() {
  lastT = performance.now();
  const frame = t => {
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    if (scene && !paused) scene.update?.(dt);
    const ctx = screen.ctx;
    ctx.setTransform(screen.S, 0, 0, screen.S, 0, 0);
    if (scene) scene.draw?.(ctx);
    drawButtons(ctx);
    input.justPressed = false; input.justReleased = false;
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// ---------- Botões no estilo painel (como o HUD da referência) ----------
export const UI = {
  panel: '#211913', panelHi: '#3a2c20', border: '#8a6e48', borderDark: '#0b0806', text: '#ece2c8',
  accent: '#e3a548', cyan: '#8fd8ff', green: '#86c45e', red: '#d4483c', dim: '#a39378',
};

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

// Painel estilo couro escuro com moldura de bronze
export function drawPanel(ctx, x, y, w, h, o = {}) {
  ctx.save();
  rrect(ctx, x, y, w, h, 2);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  const fill = o.fill || UI.panel;
  g.addColorStop(0, o.hi || UI.panelHi); g.addColorStop(0.35, fill); g.addColorStop(1, fill);
  ctx.fillStyle = g; ctx.globalAlpha = o.alpha ?? 0.94; ctx.fill(); ctx.globalAlpha = 1;
  ctx.lineWidth = 1.1; ctx.strokeStyle = UI.borderDark; ctx.stroke();
  rrect(ctx, x + 0.7, y + 0.7, w - 1.4, h - 1.4, 1.6);
  ctx.lineWidth = 0.6; ctx.strokeStyle = o.border || UI.border; ctx.stroke();
  if (o.rivets) {
    ctx.fillStyle = o.border || UI.border;
    for (const [a, b] of [[x + 2.4, y + 2.4], [x + w - 2.4, y + 2.4], [x + 2.4, y + h - 2.4], [x + w - 2.4, y + h - 2.4]]) {
      ctx.beginPath(); ctx.arc(a, b, 0.75, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

export function addButton(b) {
  const btn = { pressed: false, scale: 1, ...b };
  if (!btn.w) btn.w = textWidth(btn.label, btn.scale) + 14;
  if (!btn.h) btn.h = 7 * btn.scale + 8;
  buttons.push(btn);
  return btn;
}
export function clearButtons() { buttons.length = 0; }
export function removeButton(b) { const i = buttons.indexOf(b); if (i >= 0) buttons.splice(i, 1); }

function drawButtons(ctx) {
  for (const b of buttons) {
    if (b.hidden) continue;
    if (b.draw) { b.draw(ctx, b); continue; }
    const held = input.down && b.pressed;
    const oy = held ? 1 : 0;
    drawPanel(ctx, b.x, b.y + oy, b.w, b.h, { fill: b.disabled ? '#17120e' : (b.color || UI.panel), border: b.disabled ? '#3e3428' : (b.borderColor || UI.border), hi: b.hi });
    if (b.icon) b.icon(ctx, b.x, b.y + oy);
    drawText(ctx, b.label, b.x + b.w / 2 + (b.icon ? 5 : 0), b.y + oy + (b.h - 5 * b.scale) / 2, b.disabled ? '#6a5e50' : (b.textColor || UI.text), { align: 'center', scale: b.scale });
    if (!input.down) b.pressed = false;
  }
}
