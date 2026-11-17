// Núcleo: tela em baixa resolução escalada (pixel perfeito), loop, input, cenas e botões.
import { drawText, textWidth } from './font.js';
import { unlockAudio, sfx } from './audio.js';

export const LOGICAL_W = 180; // largura lógica: tudo é desenhado nessa resolução e ampliado

export const screen = { W: LOGICAL_W, H: 384, scale: 1, canvas: null, ctx: null };
export const input = { down: false, x: 0, y: 0, justPressed: false, justReleased: false };

let scene = null, lastT = 0, paused = false;
const buttons = [];

export function initCore(parent) {
  const c = document.createElement('canvas');
  c.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;image-rendering:pixelated;image-rendering:crisp-edges;touch-action:none;';
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
  screen.canvas.width = screen.W; screen.canvas.height = screen.H;
  screen.ctx.imageSmoothingEnabled = false;
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
    if (scene) scene.draw?.(screen.ctx);
    drawButtons(screen.ctx);
    input.justPressed = false; input.justReleased = false;
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// ---------- Botões no estilo painel (como o HUD da referência) ----------
export const UI = {
  panel: '#26323f', panelHi: '#33465a', border: '#5b7590', borderDark: '#141b24', text: '#e8e2d0',
  accent: '#ff8a3a', cyan: '#6fe3ff', green: '#5fc04a', red: '#e0393e', dim: '#8a97a3',
};

export function drawPanel(ctx, x, y, w, h, o = {}) {
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = UI.borderDark; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = o.border || UI.border; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = o.fill || UI.panel; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = o.hi || UI.panelHi; ctx.fillRect(x + 1, y + 1, w - 2, 1);
  // cantos chanfrados
  ctx.fillStyle = UI.borderDark;
  [[x - 1, y - 1], [x + w, y - 1], [x - 1, y + h], [x + w, y + h]].forEach(([a, b]) => ctx.fillRect(a, b, 1, 1));
  if (o.rivets) { ctx.fillStyle = UI.border; [[x + 2, y + 2], [x + w - 3, y + 2], [x + 2, y + h - 3], [x + w - 3, y + h - 3]].forEach(([a, b]) => ctx.fillRect(a, b, 1, 1)); }
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
    drawPanel(ctx, b.x, b.y + oy, b.w, b.h, { fill: b.disabled ? '#1e252d' : (b.color || UI.panel), border: b.disabled ? '#38434f' : (b.borderColor || UI.border), hi: b.hi });
    if (b.icon) b.icon(ctx, b.x, b.y + oy);
    drawText(ctx, b.label, b.x + b.w / 2 + (b.icon ? 5 : 0), b.y + oy + (b.h - 5 * b.scale) / 2, b.disabled ? '#5c6670' : (b.textColor || UI.text), { align: 'center', scale: b.scale });
    if (!input.down) b.pressed = false;
  }
}
