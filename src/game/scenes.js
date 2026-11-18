// Menu, seleção de fases e loja de melhorias permanentes.
import { screen, addButton, clearButtons, setScene, drawPanel, UI } from '../engine/core.js';
import { drawText, wrap } from '../engine/font.js';
import { setMuted, sfx, startMusic } from '../engine/audio.js';
import * as Ads from '../engine/ads.js';
import { exitApp } from '../engine/platform.js';
import { buildArt, buildFloor, PAL } from './art.js';
import { t, META_UPGRADES, STAGE_TEXT, BOSS_TEXT } from './strings.js';
import { STAGES, ENEMIES } from './content.js';
import { meta, saveMeta, resetMeta, META_COSTS } from './meta.js';
import { PlayScene } from './play.js';

export const ART = {};
export function initArt() { Object.assign(ART, buildArt()); }

let bg = null;
function background(ctx, anim) {
  const key = screen.W + 'x' + screen.H;
  if (!bg || bg.key !== key) bg = { key, c: buildFloor(screen.W, screen.H, 3, 40, screen.H * 0.42) };
  ctx.drawImage(bg.c, 0, 0);
  ctx.fillStyle = 'rgba(14,10,18,0.35)'; ctx.fillRect(0, 0, screen.W, screen.H);
}
const bannerSpace = () => Math.ceil(Ads.BANNER_CSS_HEIGHT / screen.scale) + 4;

export class MenuScene {
  enter() {
    this.anim = 0;
    this.layout();
    Ads.showBanner(); startMusic(76, 'menu');
    this.critters = Array.from({ length: 5 }, (_, i) => ({ a: i * 1.3, r: 70 + i * 9, sp: 0.15 + i * 0.03, type: ['spider', 'bat', 'slime', 'crab', 'wasp'][i] }));
  }
  resize() { this.layout(); }
  layout() {
    clearButtons();
    const bw = 120, x = (screen.W - bw) / 2;
    let y = screen.H - bannerSpace() - 92;
    addButton({ x, y, w: bw, h: 22, label: t('play'), scale: 2, color: '#3c2a1e', borderColor: UI.accent, textColor: '#ffd08a', onTap: () => setScene(new StageScene()) });
    y += 30;
    addButton({ x, y, w: bw, label: t('shop'), onTap: () => setScene(new ShopScene()) });
    y += 21;
    this.soundBtn = addButton({ x, y, w: bw, label: meta.muted ? t('sound_off') : t('sound_on'), onTap: () => {
      meta.muted = !meta.muted; setMuted(meta.muted); saveMeta();
      this.soundBtn.label = meta.muted ? t('sound_off') : t('sound_on');
    } });
    y += 21;
    if (Ads.needsPrivacyButton()) addButton({ x, y, w: bw, label: t('privacy'), onTap: () => Ads.showPrivacyOptions() });
  }
  onBack() { exitApp(); }
  update(dt) { this.anim += dt; this.critters.forEach(c => (c.a += c.sp * dt)); }
  draw(ctx) {
    background(ctx, this.anim);
    const cx = screen.W / 2, cy = screen.H * 0.42;
    for (const c of this.critters) {
      const A = ART[c.type], f = (this.anim * 6 | 0) % 2;
      const x = cx + Math.cos(c.a) * c.r, y = cy + Math.sin(c.a) * c.r * 0.9;
      const img = Math.sin(c.a) > 0 ? A.flipped[f] : A.frames[f];
      ctx.drawImage(img, Math.round(x - img.width / 2), Math.round(y - img.height / 2));
    }
    // jogador grande
    const p = ART.player[(this.anim * 1.5 | 0) % 2];
    ctx.drawImage(p, Math.round(cx - 16), Math.round(cy - 20), 32, 46);
    // título
    const ty = 34 + Math.round(Math.sin(this.anim * 2));
    drawText(ctx, t('title1'), cx, ty, '#e8e2d0', { align: 'center', scale: 4 });
    drawText(ctx, t('title2'), cx, ty + 24, UI.accent, { align: 'center', scale: 4 });
    drawText(ctx, t('subtitle'), cx, ty + 50, PAL.cyan, { align: 'center' });
    // recorde e moedas
    drawPanel(ctx, cx - 60, cy + 34, 120, 22, { rivets: true });
    drawText(ctx, `${t('best')}: ${meta.best}`, cx, cy + 37, UI.text, { align: 'center' });
    drawText(ctx, `${t('coins')}: ${meta.coins}`, cx, cy + 46, '#ffd08a', { align: 'center' });
  }
}

export class ShopScene {
  enter() { this.anim = 0; this.layout(); Ads.showBanner(); startMusic(76, 'menu'); }
  resize() { this.layout(); }
  onBack() { setScene(new MenuScene()); }
  layout() {
    clearButtons();
    const keys = Object.keys(META_UPGRADES);
    this.rows = keys.map((k, i) => {
      const y = 46 + i * 42;
      const lvl = meta.up[k], costs = META_COSTS[k], cost = costs[lvl];
      const max = lvl >= costs.length;
      addButton({
        x: screen.W - 62, y: y + 12, w: 52, h: 16, label: max ? t('max') : String(cost),
        disabled: max || meta.coins < cost, textColor: '#ffd08a',
        onTap: () => { meta.coins -= cost; meta.up[k]++; saveMeta(); sfx.coin(); this.layout(); },
      });
      return { k, y };
    });
    addButton({ x: (screen.W - 100) / 2, y: screen.H - bannerSpace() - 26, w: 100, label: t('back'), onTap: () => setScene(new MenuScene()) });
    // zerar progresso: precisa tocar duas vezes
    const rb = addButton({ x: (screen.W - 140) / 2, y: screen.H - bannerSpace() - 50, w: 140, label: t('reset'), textColor: '#8a97a3', borderColor: '#38434f',
      onTap: () => {
        if (rb.armed) { resetMeta(); this.layout(); return; }
        rb.armed = true; rb.label = t('reset_confirm'); rb.textColor = '#ff6a6a'; rb.borderColor = '#e0393e';
        setTimeout(() => { rb.armed = false; rb.label = t('reset'); rb.textColor = '#8a97a3'; rb.borderColor = '#38434f'; }, 3000);
      } });
  }
  update(dt) { this.anim += dt; }
  draw(ctx) {
    background(ctx, this.anim);
    drawText(ctx, t('shop'), screen.W / 2, 14, UI.accent, { align: 'center', scale: 2 });
    drawText(ctx, `${t('coins')}: ${meta.coins}`, screen.W / 2, 32, '#ffd08a', { align: 'center' });
    for (const r of this.rows) {
      drawPanel(ctx, 6, r.y, screen.W - 12, 37, { rivets: true });
      const [name, desc] = META_UPGRADES[r.k];
      drawText(ctx, name, 12, r.y + 6, UI.text);
      wrap(desc, screen.W - 90).forEach((l, j) => drawText(ctx, l, 12, r.y + 15 + j * 7, UI.dim));
      const n = META_COSTS[r.k].length;
      for (let d = 0; d < n; d++) { ctx.fillStyle = d < meta.up[r.k] ? UI.cyan : '#3a4654'; ctx.fillRect(12 + d * 6, r.y + 30, 4, 3); }
    }
  }
}

// ---------------- Seleção de fases ----------------
const thumbs = new Map();
function thumb(theme, w, h) {
  const k = theme + w + 'x' + h;
  if (!thumbs.has(k)) thumbs.set(k, buildFloor(w, h, 5, 0, h / 2, theme));
  return thumbs.get(k);
}

export class StageScene {
  enter() { this.anim = 0; this.layout(); Ads.showBanner(); startMusic(76, 'menu'); }
  resize() { this.layout(); }
  onBack() { setScene(new MenuScene()); }
  layout() {
    clearButtons();
    const items = [...STAGES.map(s => s.id), 'endless'];
    const top = 30, bottomRoom = bannerSpace() + 30;
    const ph = Math.min(40, Math.floor((screen.H - top - bottomRoom) / items.length) - 4);
    this.rows = items.map((id, i) => {
      const y = top + i * (ph + 4);
      const locked = id === 'endless' ? !meta.cleared[STAGES.length] : id > meta.unlocked;
      const row = { id, y, h: ph, locked };
      addButton({ x: 6, y, w: screen.W - 12, h: ph, label: '', disabled: locked, onTap: () => setScene(new PlayScene(id)), draw: (ctx, b) => this.drawRow(ctx, b, row) });
      return row;
    });
    addButton({ x: (screen.W - 100) / 2, y: screen.H - bannerSpace() - 24, w: 100, label: t('back'), onTap: () => setScene(new MenuScene()) });
  }
  update(dt) { this.anim += dt; }
  draw(ctx) {
    background(ctx, this.anim);
    drawText(ctx, t('stages'), screen.W / 2, 10, UI.accent, { align: 'center', scale: 2 });
  }
  drawRow(ctx, b, row) {
    const st = STAGES.find(s => s.id === row.id);
    const theme = st ? st.theme : ['ruins', 'sewer', 'junk', 'toxic', 'lab'][(this.anim / 2 | 0) % 5];
    const oy = b.pressed && !row.locked ? 1 : 0;
    drawPanel(ctx, b.x, b.y + oy, b.w, b.h, { border: row.locked ? '#38434f' : meta.cleared[row.id] ? '#ffd23a' : UI.border });
    ctx.drawImage(thumb(theme, b.w - 2, b.h - 2), b.x + 1, b.y + oy + 1);
    ctx.fillStyle = row.locked ? 'rgba(10,8,14,0.78)' : 'rgba(10,8,14,0.45)';
    ctx.fillRect(b.x + 1, b.y + oy + 1, b.w - 2, b.h - 2);
    const title = st ? `${t('world')} ${st.id}: ${STAGE_TEXT[st.id]}` : STAGE_TEXT.endless;
    drawText(ctx, title, b.x + 6, b.y + oy + 5, row.locked ? '#5c6670' : UI.text);
    let sub;
    if (row.locked) sub = st ? t('locked') : t('unlock_endless');
    else if (st) sub = `${t('boss_in')}: ${BOSS_TEXT[st.boss]}`;
    else sub = meta.bestEndless ? `${t('best_time')}: ${Math.floor(meta.bestEndless / 60)}:${String(meta.bestEndless % 60).padStart(2, '0')}` : t('endless_desc');
    drawText(ctx, sub, b.x + 6, b.y + oy + 14, row.locked ? '#5c6670' : UI.dim);
    if (meta.cleared[row.id]) drawText(ctx, t('cleared'), b.x + 6, b.y + oy + b.h - 9, '#ffd23a');
    else if (st && meta.bestSub[row.id]) drawText(ctx, `${t('best_sub')}: ${row.id}-${meta.bestSub[row.id]}`, b.x + 6, b.y + oy + b.h - 9, UI.accent);
    if (st && !row.locked) { // retrato do chefe
      const A = ART[ENEMIES[st.boss].art].frames[(this.anim * 3 | 0) % 2];
      const sc = Math.min(1, (b.h - 4) / A.height);
      ctx.drawImage(A, Math.round(b.x + b.w - A.width * sc - 4), Math.round(b.y + oy + (b.h - A.height * sc) / 2), Math.round(A.width * sc), Math.round(A.height * sc));
    }
    if (row.locked) { // cadeado
      const lx = b.x + b.w - 16, ly = b.y + oy + b.h / 2 - 5;
      ctx.fillStyle = '#7d98ad'; ctx.fillRect(lx + 1, ly, 6, 2); ctx.fillRect(lx, ly + 1, 2, 4); ctx.fillRect(lx + 6, ly + 1, 2, 4);
      ctx.fillStyle = '#d8c79a'; ctx.fillRect(lx - 1, ly + 4, 10, 7); ctx.fillStyle = '#26323f'; ctx.fillRect(lx + 3, ly + 6, 2, 3);
    }
  }
}
