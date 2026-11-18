// Menu, seleção de mundos e loja de melhorias permanentes.
import { screen, addButton, clearButtons, setScene, drawPanel, UI } from '../engine/core.js';
import { drawText, wrap } from '../engine/font.js';
import { setMuted, sfx, startMusic } from '../engine/audio.js';
import * as Ads from '../engine/ads.js';
import { exitApp } from '../engine/platform.js';
import { img, drawCreature } from './gfx.js';
import { t, META_UPGRADES, STAGE_TEXT, BOSS_TEXT } from './strings.js';
import { STAGES, ENEMIES } from './content.js';
import { meta, saveMeta, resetMeta, META_COSTS } from './meta.js';
import { PlayScene } from './play.js';

const GOLD = '#f0c060';

// fundo: arte de abertura cobrindo a tela, escurecida
function background(ctx, anim, dark = 0.35) {
  const bg = img('ui/menu_bg');
  const s = Math.max(screen.W / bg.width, screen.H / bg.height) * (1.04 + Math.sin(anim * 0.15) * 0.02);
  const w = bg.width * s, h = bg.height * s;
  ctx.drawImage(bg, (screen.W - w) / 2, (screen.H - h) / 2, w, h);
  ctx.fillStyle = `rgba(8,5,4,${dark})`; ctx.fillRect(0, 0, screen.W, screen.H);
  const g = ctx.createLinearGradient(0, 0, 0, screen.H);
  g.addColorStop(0, 'rgba(8,5,4,0.75)'); g.addColorStop(0.3, 'rgba(8,5,4,0)'); g.addColorStop(0.65, 'rgba(8,5,4,0)'); g.addColorStop(1, 'rgba(8,5,4,0.85)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, screen.W, screen.H);
}
const bannerSpace = () => (Ads.adsEnabled() ? Math.ceil(Ads.BANNER_CSS_HEIGHT / screen.scale) : 0) + 4;

export class MenuScene {
  enter() {
    this.anim = 0;
    this.layout();
    Ads.showBanner(); startMusic(76, 'menu');
  }
  resize() { this.layout(); }
  layout() {
    clearButtons();
    const bw = 120, x = (screen.W - bw) / 2;
    let y = screen.H - bannerSpace() - 92;
    addButton({ x, y, w: bw, h: 22, label: t('play'), scale: 1.7, color: '#3a2412', borderColor: GOLD, textColor: GOLD, onTap: () => setScene(new StageScene()) });
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
  update(dt) { this.anim += dt; }
  draw(ctx) {
    background(ctx, this.anim, 0.15);
    const cx = screen.W / 2;
    const ty = 26 + Math.sin(this.anim * 1.5) * 0.6;
    drawText(ctx, t('title1'), cx, ty, '#ece2c8', { align: 'center', scale: 3.2 });
    drawText(ctx, t('title2'), cx, ty + 22, GOLD, { align: 'center', scale: 3.2 });
    drawText(ctx, t('subtitle'), cx, ty + 46, UI.dim, { align: 'center', scale: 0.9 });
    const py = screen.H - bannerSpace() - 122;
    drawPanel(ctx, cx - 60, py, 120, 22, { rivets: true, alpha: 0.85 });
    drawText(ctx, `${t('best')}: ${meta.best}`, cx, py + 3.5, UI.text, { align: 'center', scale: 0.85 });
    drawText(ctx, `${t('coins')}: ${meta.coins}`, cx, py + 12.5, GOLD, { align: 'center', scale: 0.85 });
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
        x: screen.W - 62, y: y + 11, w: 52, h: 16, label: max ? t('max') : String(cost),
        disabled: max || meta.coins < cost, textColor: GOLD, scale: 0.9,
        onTap: () => { meta.coins -= cost; meta.up[k]++; saveMeta(); sfx.coin(); this.layout(); },
      });
      return { k, y };
    });
    addButton({ x: (screen.W - 100) / 2, y: screen.H - bannerSpace() - 26, w: 100, label: t('back'), onTap: () => setScene(new MenuScene()) });
    const rb = addButton({ x: (screen.W - 140) / 2, y: screen.H - bannerSpace() - 50, w: 140, label: t('reset'), textColor: UI.dim, borderColor: '#3e3428', scale: 0.85,
      onTap: () => {
        if (rb.armed) { resetMeta(); this.layout(); return; }
        rb.armed = true; rb.label = t('reset_confirm'); rb.textColor = '#ff6a5a'; rb.borderColor = UI.red;
        setTimeout(() => { rb.armed = false; rb.label = t('reset'); rb.textColor = UI.dim; rb.borderColor = '#3e3428'; }, 3000);
      } });
  }
  update(dt) { this.anim += dt; }
  draw(ctx) {
    background(ctx, this.anim, 0.6);
    drawText(ctx, t('shop'), screen.W / 2, 12, GOLD, { align: 'center', scale: 1.8 });
    drawText(ctx, `${t('coins')}: ${meta.coins}`, screen.W / 2, 30, GOLD, { align: 'center', scale: 0.9 });
    for (const r of this.rows) {
      drawPanel(ctx, 6, r.y, screen.W - 12, 37, { rivets: true });
      const [name, desc] = META_UPGRADES[r.k];
      drawText(ctx, name, 12, r.y + 5, UI.text, { scale: 0.9 });
      wrap(desc, screen.W - 84, 0.75).forEach((l, j) => drawText(ctx, l, 12, r.y + 14 + j * 7, UI.dim, { scale: 0.75 }));
      const n = META_COSTS[r.k].length;
      for (let d = 0; d < n; d++) { ctx.fillStyle = d < meta.up[r.k] ? UI.cyan : '#3e3428'; ctx.beginPath(); ctx.arc(14 + d * 6, r.y + 31, 1.5, 0, Math.PI * 2); ctx.fill(); }
    }
  }
}

// ---------------- Seleção de mundos ----------------
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
    background(ctx, this.anim, 0.6);
    drawText(ctx, t('stages'), screen.W / 2, 9, GOLD, { align: 'center', scale: 1.8 });
  }
  drawRow(ctx, b, row) {
    const st = STAGES.find(s => s.id === row.id);
    const theme = st ? st.theme : ['ruins', 'sewer', 'junk', 'toxic', 'lab'][(this.anim / 2 | 0) % 5];
    const oy = b.pressed && !row.locked ? 1 : 0;
    const x = b.x, y = b.y + oy, w = b.w, h = b.h;
    // miniatura do chão do mundo
    const tile = img(`backgrounds/${theme}_floor`);
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.drawImage(tile, 0, 0, tile.width, tile.width * h / w, x, y, w, h);
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, row.locked ? 'rgba(8,5,4,0.85)' : 'rgba(8,5,4,0.8)'); g.addColorStop(0.7, row.locked ? 'rgba(8,5,4,0.8)' : 'rgba(8,5,4,0.35)'); g.addColorStop(1, 'rgba(8,5,4,0.2)');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    if (st && !row.locked) { // chefe do mundo
      const art = ENEMIES[st.boss].art;
      drawCreature(ctx, art, (this.anim * 2 | 0) % 2, x + w - 22, y + h / 2 + 1, 0, 1, { scale: 0.45 * Math.min(1, h / 36), t: this.anim });
    }
    ctx.restore();
    ctx.strokeStyle = row.locked ? '#3e3428' : meta.cleared[row.id] ? GOLD : UI.border; ctx.lineWidth = 0.7; ctx.strokeRect(x + 0.35, y + 0.35, w - 0.7, h - 0.7);
    const title = st ? `${t('world')} ${st.id}: ${STAGE_TEXT[st.id]}` : STAGE_TEXT.endless;
    drawText(ctx, title, x + 6, y + 4, row.locked ? '#6a5e50' : UI.text, { scale: 0.85 });
    let sub;
    if (row.locked) sub = st ? t('locked') : t('unlock_endless');
    else if (st) sub = `${t('boss_in')}: ${BOSS_TEXT[st.boss]}`;
    else sub = meta.bestEndless ? `${t('best_time')}: ${Math.floor(meta.bestEndless / 60)}:${String(meta.bestEndless % 60).padStart(2, '0')}` : t('endless_desc');
    drawText(ctx, sub, x + 6, y + 13, row.locked ? '#6a5e50' : UI.dim, { scale: 0.72 });
    if (meta.cleared[row.id]) drawText(ctx, t('cleared'), x + 6, y + h - 9, GOLD, { scale: 0.75 });
    else if (st && meta.bestSub[row.id]) drawText(ctx, `${t('best_sub')}: ${row.id}-${meta.bestSub[row.id]}`, x + 6, y + h - 9, UI.accent, { scale: 0.75 });
    if (row.locked) { // cadeado
      const lx = x + w - 16, ly = y + h / 2 - 4;
      ctx.strokeStyle = '#9a8a70'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(lx + 4, ly + 2, 2.6, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = '#c8a860'; ctx.fillRect(lx, ly + 2, 8, 6.5);
      ctx.fillStyle = '#2a1e14'; ctx.fillRect(lx + 3.3, ly + 4, 1.4, 2.6);
    }
  }
}
