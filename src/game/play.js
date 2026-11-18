// Cena principal: jogador fixo no centro, inimigos vindo de todos os lados.
// Mundos com 5 fases seguidas (corrida contínua), chefe na 5ª, 26 melhorias e 11 evoluções.
import { screen, input, addButton, clearButtons, removeButton, setScene, drawPanel, UI } from '../engine/core.js';
import { drawText, wrap } from '../engine/font.js';
import { sfx, startMusic, stopMusic } from '../engine/audio.js';
import { vibrate } from '../engine/platform.js';
import * as Ads from '../engine/ads.js';
import { buildFloor, splat, makeCanvas, PAL } from './art.js';
import { t, RUN_UPGRADES, EVO_TEXT, STAGE_TEXT, BOSS_TEXT, SHORT } from './strings.js';
import { meta, saveMeta } from './meta.js';
import { ENEMIES, STAGES, ENDLESS, UPGRADES, EVOLUTIONS, HP_MUL, BASE_DMG, XP_MUL, SCRAP_MUL, SUB_DURATION, ELITE } from './content.js';
import { ART, StageScene } from './scenes.js';

const TOP = 30, BOTTOM_H = 38;
const GOLD = '#ffd23a', ACID = '#9ae04a', FIRE = '#ff8a2a', ICE = '#a8e8ff', DEF = '#7dd87a';
const BOOM = ['#fff4c0', '#ffd08a', '#ff8a2a', '#c85a18'];
const floorCache = new Map();
const lerp = (a, b, k) => a + (b - a) * k;

export class PlayScene {
  constructor(worldId = 1) {
    this.stage = worldId === 'endless' ? ENDLESS : STAGES.find(s => s.id === worldId) || STAGES[0];
    this.endless = this.stage === ENDLESS;
    this.world = this.endless ? 0 : this.stage.id;
  }

  enter() {
    this.cx = screen.W / 2;
    this.cy = Math.round((TOP + screen.H - BOTTOM_H) / 2) + 4;
    this.theme = this.endless ? ENDLESS.themes[(Math.random() * 5) | 0] : this.stage.theme;
    this.sub = 1; this.subT = 0; this.hordeDone = false;
    this.buildFloorFor(1);

    this.lv = Object.fromEntries(Object.keys(UPGRADES).map(k => [k, 0]));
    this.evo = {};
    this.rerolls = 1 + (meta.up.reroll || 0); this.adReroll = true;
    this.maxHp = 5 + meta.up.hp; this.hp = this.maxHp;
    this.recalc();
    this.time = 0; this.score = 0; this.kills = 0; this.level = 1; this.xp = 0; this.xpNext = xpFor(1);
    this.energy = 40; this.iframes = 0; this.regenT = 0; this.revived = false; this.state = 'play';
    this.enemies = []; this.bullets = []; this.beams = []; this.parts = []; this.gems = []; this.texts = [];
    this.rings = []; this.eshots = []; this.nades = []; this.booms = []; this.mines = []; this.bolts = [];
    this.spawnT = 1; this.hordeT = 30; this.fireT = 0; this.aim = -Math.PI / 2; this.shake = 0;
    this.droneAng = 0; this.droneCd = []; this.hurtFlash = 0; this.anim = 0;
    this.sawAng = 0; this.nadeT = 1; this.shockT = 0; this.stormT = 8; this.mineT = 1; this.boltT = 1.5;
    this.boss = null; this.bossSpawned = false; this.nextBossT = ENDLESS.bossEvery; this.bossIdx = 0;
    this.everShot = meta.tutorial;
    this.makeHudButtons();
    Ads.hideBanner();
    startMusic(this.stage.bpm);
    this.say(this.endless ? STAGE_TEXT.endless : `${t('stage')} ${this.world}-1: ${STAGE_TEXT[this.world]}`, UI.accent, 3);
    // kit inicial: mundos avançados começam com melhorias grátis
    this.kit = this.endless ? 2 : this.world - 1;
    if (this.kit > 0) { this.mode = 'kit'; this.openLevelUp(); }
  }
  exit() { stopMusic(); }

  buildFloorFor(sub) {
    const key = `${screen.W}x${screen.H}:${this.theme}:${sub}`;
    if (!floorCache.has(key)) floorCache.set(key, buildFloor(screen.W, screen.H, 11 + sub * 7, 60, this.cy, this.theme));
    this.floor = makeCanvas(screen.W, screen.H);
    this.fctx = this.floor.getContext('2d');
    this.fctx.drawImage(floorCache.get(key), 0, 0);
  }

  // Todos os números das melhorias ficam aqui
  recalc() {
    const L = this.lv, u = meta.up, e = this.evo;
    const metaDmg = 1 + u.dmg * 0.2;
    this.s = {
      gun: BASE_DMG * metaDmg * (1 + 0.15 * L.dmg),
      rate: 4 * Math.pow(1.1, L.rate),
      multi: 1 + L.multi,
      pierce: e.railgun ? 99 : L.pierce,
      bounce: L.bounce,
      crit: 0.05 + 0.08 * L.crit,
      critMul: (2 + 0.4 * L.critdmg) * (e.executor ? 1.5 : 1),
      burn: L.burn, frost: L.frost, exec: 0.06 * L.exec,
      drones: 1 + u.drone + L.drone,
      pow: metaDmg * (1 + 0.12 * L.power),
      droneRate: 0.9 * Math.pow(1.1, L.laser),
      saw: L.saw, nade: L.nade, shock: L.shock, mine: L.mine, bolt: L.bolt,
      regen: L.regen, dodge: 0.08 * L.dodge, thorns: L.thorns,
      energyGain: Math.pow(1.35, L.energy), pulseDmg: 1 + 0.3 * L.pulse, pulseR: 1 + 0.15 * L.pulse,
      xpMul: 1 + 0.12 * L.xp, greed: 1 + 0.15 * L.greed,
    };
    this.s.droneDmg = 1.4 * (1 + 0.2 * L.laser) * this.s.pow;
  }

  makeHudButtons() {
    clearButtons();
    addButton({ x: screen.W - 22, y: 5, w: 17, h: 17, label: '', onTap: () => this.pause(),
      icon: (ctx, x, y) => { ctx.fillStyle = UI.text; ctx.fillRect(x + 6, y + 5, 2, 7); ctx.fillRect(x + 10, y + 5, 2, 7); } });
    addButton({ x: screen.W - 52, y: screen.H - BOTTOM_H + 6, w: 48, h: 26, label: t('pulse'), onTap: () => this.pulse(),
      draw: (ctx, b) => this.drawPulseBtn(ctx, b) });
  }

  // ================= Lógica =================
  update(dt) {
    this.anim += dt; this.hurtFlash -= dt;
    if (this.state === 'dying' || this.state === 'clearing' || this.state === 'subclear') {
      this.endT -= dt;
      this.updateFx(dt * (this.state === 'subclear' ? 1 : 0.3));
      if (this.endT <= 0) {
        if (this.state === 'dying') this.showGameOver();
        else if (this.state === 'clearing') this.showVictory();
        else this.openReward();
      }
      return;
    }
    if (this.state === 'levelup' && this.cardDelay > 0) {
      this.cardDelay -= dt;
      if (this.cardDelay <= 0) this.cards.forEach(c => (c.disabled = false));
    }
    if (this.state !== 'play') { this.updateFx(dt); return; }
    this.time += dt; this.subT += dt;
    this.iframes -= dt; this.shake = Math.max(0, this.shake - dt * 30);

    if (this.s.regen && this.hp < this.maxHp) {
      this.regenT += dt;
      if (this.regenT >= 45 / this.s.regen) { this.regenT = 0; this.hp++; sfx.coin(); }
    }
    this.spawn(dt);
    this.shoot(dt);
    this.updateDrones(dt);
    this.updateWeapons(dt);
    this.updateBullets(dt);
    this.updateEnemies(dt);
    this.updateEnemyShots(dt);
    this.updateGems(dt);
    this.updateFx(dt);
  }

  // ---------- Progresso e spawns ----------
  subDur() { return SUB_DURATION[this.sub - 1]; }
  progress() { return ((this.sub - 1) + Math.min(1, this.subT / this.subDur())) / 5; } // 0..1 no mundo
  tEq() { return this.endless ? this.time : this.progress() * 330; } // "tempo equivalente" p/ tamanho dos bandos

  hpMul() {
    if (this.endless) { const tm = this.time; return 1 + tm / 60 + (tm / 150) ** 2; }
    return lerp(this.stage.hp[0], this.stage.hp[1], this.progress());
  }
  speedMul() { return this.endless ? 1 + this.time / 500 : 1 + 0.035 * (this.sub - 1) + 0.03 * (this.world - 1); }

  spawn(dt) {
    const st = this.stage, te = this.tEq();
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      let iv = this.endless ? Math.max(this.time > 180 ? 0.11 : 0.18, 1.15 - this.time * 0.008) : lerp(st.spawn[0], st.spawn[1], this.progress());
      if (this.boss) iv *= 1.3;
      this.spawnT = iv * (0.7 + Math.random() * 0.6);
      const w = this.endless ? st.mobs.filter(m => this.time >= m[0]) : st.mobs.filter(m => this.sub >= m[0]);
      let r = Math.random() * w.reduce((a, b) => a + b[2], 0), type = w[0][1];
      for (const m of w) if ((r -= m[2]) <= 0) { type = m[1]; break; }
      const ang = Math.random() * Math.PI * 2;
      const pack = { mite: 3 + te / 35, wasp: 3 + te / 45, slimelet: 4, spider: 1 + te / 90, bat: 1 + te / 70, rat: 1 + te / 90 }[type];
      const n = pack ? 1 + (Math.random() * pack | 0) : 1;
      for (let i = 0; i < n; i++) this.addEnemy(type, ang + (Math.random() - 0.5) * 0.3, i * 8, true);
    }
    // hordas: uma no meio de cada fase (sem fim: a cada 30s)
    let horde = false;
    if (this.endless) { this.hordeT -= dt; if (this.hordeT <= 0 && !this.boss) { this.hordeT = 30; horde = true; } }
    else if (!this.hordeDone && this.subT >= this.subDur() * 0.5) { this.hordeDone = true; horde = true; }
    if (horde) {
      this.say(t('horde'), UI.accent);
      const type = st.hordes[((this.endless ? this.time / 30 : this.sub) | 0) % st.hordes.length];
      const n = Math.round(this.endless ? 10 + this.time / 8 : 6 + this.sub * 3 + this.world * 2);
      for (let i = 0; i < n; i++) this.addEnemy(type, (i / n) * Math.PI * 2, Math.random() * 10);
    }
    // chefe / fim de fase
    if (this.endless) {
      if (this.time >= this.nextBossT && !this.boss) {
        this.nextBossT += ENDLESS.bossEvery;
        this.spawnBoss(ENDLESS.bosses[this.bossIdx++ % ENDLESS.bosses.length]);
      }
    } else if (this.subT >= this.subDur()) {
      if (this.sub < 5) this.subClear();
      else if (!this.bossSpawned) this.spawnBoss(st.boss);
    }
  }

  spawnBoss(type) {
    this.bossSpawned = true;
    this.say(BOSS_TEXT[type] + '!', UI.red, 3); sfx.boss(); this.shake = 6; vibrate(true);
    this.boss = this.addEnemy(type, Math.random() * Math.PI * 2, 0);
  }

  addEnemy(type, ang, extra, canElite) {
    const dx = Math.cos(ang), dy = Math.sin(ang);
    const hw = screen.W / 2 + 18, hh = screen.H / 2 + 18;
    const d = Math.min(Math.abs(hw / (dx || 1e-6)), Math.abs(hh / (dy || 1e-6))) + extra;
    const elite = canElite && !this.endless && Math.random() < ELITE.chance(this.world, this.sub);
    return this.addEnemyAt(type, this.cx + dx * d, this.cy + dy * d, elite);
  }

  addEnemyAt(type, x, y, elite = false) {
    const T = ENEMIES[type];
    let hp;
    if (T.boss) hp = T.hp * HP_MUL.boss * (this.endless ? 1 + this.time / 90 : this.stage.hp[1] * 0.55);
    else hp = T.hp * HP_MUL.mob * this.hpMul() * (elite ? ELITE.hp : 1);
    const e = {
      type, T, x, y, hp, maxHp: hp, r: T.r, elite,
      speed: T.speed * this.speedMul() * (T.boss ? 1 : 0.85 + Math.random() * 0.3) * (elite ? ELITE.speed : 1),
      atk: 0.5, flash: 0, kx: 0, ky: 0, ph: Math.random() * 6, face: x < this.cx ? -1 : 1,
      mode: 'walk', modeT: 0, dashCd: 1 + Math.random(), shotT: 1 + Math.random() * 1.5,
      sumT: T.summon ? T.summon.cd * 0.6 : 0, sprT: T.spray ? T.spray.cd : 0, healT: 1,
      phT: T.phase ? T.phase.on * Math.random() : 0, ethereal: false, sawT: 0,
      burnT: 0, burnDps: 0, burnAcc: 0, slowT: 0,
    };
    this.enemies.push(e);
    return e;
  }

  // ---------- Fim de cada fase (1-1 ... 1-4) ----------
  subClear() {
    this.state = 'subclear'; this.endT = 1.1;
    for (const o of this.enemies) if (!o.dead) { o.dead = true; this.puff(o.x, o.y, PAL.slate[2], 5); }
    this.enemies = []; this.eshots = []; this.mines = [];
    for (const g of this.gems) this.xp += g.v;
    this.gems = [];
    this.say(`${this.world}-${this.sub} ${t('sub_clear')}`, GOLD, 2);
    sfx.level();
  }
  openReward() {
    this.hp = Math.min(this.maxHp, this.hp + 1);
    this.mode = 'reward';
    this.openLevelUp();
  }
  nextSub() {
    this.sub++; this.subT = 0; this.hordeDone = false; this.spawnT = 1.2;
    this.buildFloorFor(this.sub);
    this.state = 'play';
    this.makeHudButtons();
    this.say(`${t('stage')} ${this.world}-${this.sub}`, this.sub === 5 ? UI.red : UI.accent, 2.5);
    if (this.sub > (meta.bestSub[this.world] || 0)) { meta.bestSub[this.world] = this.sub; saveMeta(); }
  }

  // ---------- Tiro principal ----------
  shoot(dt) {
    this.fireT -= dt;
    if (!input.down || input.consumed) return;
    this.aim = Math.atan2(input.y - this.cy, input.x - this.cx);
    let best = null, bestDiff = 0.3;
    for (const e of this.enemies) {
      if (e.ethereal) continue;
      const a = Math.atan2(e.y - this.cy, e.x - this.cx);
      const diff = Math.abs(Math.atan2(Math.sin(a - this.aim), Math.cos(a - this.aim)));
      if (diff < bestDiff && Math.hypot(e.x - this.cx, e.y - this.cy) < 200) { bestDiff = diff; best = a; }
    }
    const shotAim = best ?? this.aim;
    if (this.fireT > 0) return;
    this.fireT = 1 / this.s.rate;
    if (!this.everShot) { this.everShot = true; meta.tutorial = true; saveMeta(); }
    const n = this.s.multi, rail = this.evo.railgun, sp = rail ? 380 : 240;
    const dmg = this.s.gun * (n > 1 ? 0.75 : 1) * (rail ? 1.6 : 1);
    for (let i = 0; i < n; i++) {
      const a = shotAim + (i - (n - 1) / 2) * 0.13;
      this.bullets.push({ x: this.cx + Math.cos(a) * 9, y: this.cy + 2 + Math.sin(a) * 9, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, sp,
        life: 1.4, pierce: this.s.pierce, bounce: this.s.bounce, hit: new Set(), rail, dmg });
    }
    this.parts.push({ x: this.cx + Math.cos(this.aim) * 10, y: this.cy + 2 + Math.sin(this.aim) * 10, vx: 0, vy: 0, life: 0.05, c: rail ? PAL.cyanHi : '#ffd08a', s: 3 });
    rail ? sfx.laser() : sfx.shoot();
  }

  updateBullets(dt) {
    for (const b of this.bullets) {
      const px = b.x, py = b.y;
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      for (const s of this.eshots) {
        if (!s.dead && segDist2(px, py, b.x, b.y, s.x, s.y) < 16) { s.dead = true; this.puff(s.x, s.y, ACID, 4); this.score += 1; }
      }
      for (const e of this.enemies) {
        if (e.dead || e.ethereal || b.hit.has(e)) continue;
        if (segDist2(px, py, b.x, b.y, e.x, e.y) < (e.r + 2) ** 2) {
          b.hit.add(e);
          this.gunHit(b, e);
          if (b.bounce > 0) { // ricochete: vira para outro inimigo
            const nx = this.nearest(e.x, e.y, 90, b.hit);
            if (nx) {
              const a = Math.atan2(nx.y - e.y, nx.x - e.x);
              b.vx = Math.cos(a) * b.sp; b.vy = Math.sin(a) * b.sp; b.x = e.x; b.y = e.y; b.life = Math.max(b.life, 0.6); b.bounce--;
              break;
            }
          }
          if (b.pierce-- <= 0) { b.life = 0; break; }
        }
      }
      if (b.x < -10 || b.y < -10 || b.x > screen.W + 10 || b.y > screen.H + 10) b.life = 0;
    }
    this.bullets = this.bullets.filter(b => b.life > 0);
  }

  gunHit(b, e) {
    const s = this.s;
    const crit = Math.random() < s.crit;
    const dmg = b.dmg * (crit ? s.critMul : 1);
    this.damage(e, dmg, b.vx / b.sp, b.vy / b.sp, crit);
    if (crit && this.evo.executor) this.explode(e.x, e.y, 22, dmg * 0.5, false, e);
    if (e.dead) return;
    if (s.burn) { e.burnT = 3; e.burnDps = Math.max(e.burnDps, b.dmg * 0.3 * s.burn * (this.evo.inferno ? 1.5 : 1)); }
    if (s.frost) e.slowT = 1.5;
    if (s.exec && !e.T.boss && e.hp / e.maxHp < s.exec) {
      this.texts.push({ x: e.x, y: e.y - e.r, s: 'X', life: 0.6, c: '#ff6a6a', big: true });
      this.kill(e);
    }
  }

  nearest(x, y, maxD, skip) {
    let best = null, bd = maxD * maxD;
    for (const e of this.enemies) {
      if (e.dead || e.ethereal || (skip && skip.has(e))) continue;
      const d = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  updateDrones(dt) {
    this.droneAng += dt * 1.3;
    for (let i = 0; i < this.s.drones; i++) {
      this.droneCd[i] = (this.droneCd[i] ?? i * 0.3) - dt;
      if (this.droneCd[i] > 0) continue;
      const p = this.dronePos(i);
      const best = this.nearest(p.x, p.y, 150);
      if (!best) continue;
      this.droneCd[i] = 1 / this.s.droneRate;
      this.beams.push({ x0: p.x, y0: p.y - 1, x1: best.x, y1: best.y, life: 0.12 });
      this.damage(best, this.s.droneDmg, 0, 0, false);
      if (this.evo.swarm) {
        const hit = new Set([best]); let from = best;
        for (let k = 0; k < 2; k++) {
          const nx = this.nearest(from.x, from.y, 60, hit);
          if (!nx) break;
          hit.add(nx);
          this.beams.push({ x0: from.x, y0: from.y, x1: nx.x, y1: nx.y, life: 0.12 });
          this.damage(nx, this.s.droneDmg * 0.7, 0, 0, false);
          from = nx;
        }
      }
      sfx.laser();
    }
  }
  dronePos(i) {
    const a = this.droneAng + (i / Math.max(1, this.s.drones)) * Math.PI * 2;
    return { x: this.cx + Math.cos(a) * 24, y: this.cy + 2 + Math.sin(a) * 19 };
  }

  // ---------- Armas extras ----------
  sawSetup() {
    const cyc = this.evo.cyclone;
    return { n: this.s.saw + 1 + (cyc ? 3 : 0), r: cyc ? 44 : 32, spin: cyc ? 3.6 : 2.6, dmg: (1 + this.s.saw * 0.5) * (cyc ? 2 : 1) * this.s.pow };
  }
  sawPos(i, S) {
    const a = this.sawAng + i / S.n * Math.PI * 2;
    return { x: this.cx + Math.cos(a) * S.r, y: this.cy + 2 + Math.sin(a) * S.r * 0.85 };
  }
  mineSetup() {
    const mf = this.evo.minefield, L = this.s.mine;
    return { cd: 3.5 - 0.35 * L, max: (2 + L) * (mf ? 2 : 1), r: (20 + 2 * L) * (mf ? 1.5 : 1), dmg: (4 + 2 * L) * this.s.pow };
  }

  updateWeapons(dt) {
    const s = this.s;
    if (s.saw) {
      const S = this.sawSetup();
      this.sawAng += dt * S.spin;
      for (let i = 0; i < S.n; i++) {
        const p = this.sawPos(i, S);
        for (const e of this.enemies) {
          if (e.dead || e.ethereal || e.sawT > this.time) continue;
          if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 < (e.r + 5) ** 2) {
            e.sawT = this.time + 0.35;
            this.damage(e, S.dmg, (e.x - this.cx) / 60, (e.y - this.cy) / 60, false);
            this.puff(p.x, p.y, '#e0e4ec', 2);
          }
        }
      }
    }
    if (s.nade) {
      this.nadeT -= dt;
      if (this.nadeT <= 0 && this.enemies.length) {
        this.nadeT = 3.2 - s.nade * 0.35;
        let best = null, bestN = -1;
        for (let k = 0; k < 6; k++) {
          const e = this.enemies[(Math.random() * this.enemies.length) | 0];
          if (Math.hypot(e.x - this.cx, e.y - this.cy) > 140) continue;
          const n = this.enemies.reduce((a, o) => a + ((o.x - e.x) ** 2 + (o.y - e.y) ** 2 < 900 ? 1 : 0), 0);
          if (n > bestN) { bestN = n; best = e; }
        }
        if (best) this.nades.push({ x0: this.cx, y0: this.cy, x1: best.x, y1: best.y, t: 0, dur: 0.55, r: 16 + s.nade * 3, dmg: (3 + s.nade * 1.5) * s.pow, big: true });
      }
    }
    for (const g of this.nades) {
      g.t += dt;
      if (g.t >= g.dur) {
        g.done = true;
        this.explode(g.x1, g.y1, g.r, g.dmg, false, null, this.evo.inferno);
        if (g.big && this.evo.carpet) for (let k = 0; k < 4; k++) {
          const a = k * Math.PI / 2 + Math.random() * 0.6;
          this.nades.push({ x0: g.x1, y0: g.y1, x1: g.x1 + Math.cos(a) * 24, y1: g.y1 + Math.sin(a) * 24, t: 0, dur: 0.3, r: 13, dmg: g.dmg * 0.5 });
        }
      }
    }
    this.nades = this.nades.filter(g => !g.done);
    if (s.shock) {
      this.shockT -= dt;
      if (this.shockT <= 0) {
        this.shockT = 0.6;
        const R = 24 + s.shock * 3, dmg = (0.6 + s.shock * 0.45) * s.pow;
        let arcs = 0;
        for (const e of this.enemies) {
          if (e.dead || Math.hypot(e.x - this.cx, e.y - this.cy) > R + e.r) continue;
          this.damage(e, dmg, 0, 0, false, true);
          if (this.evo.zero) e.slowT = Math.max(e.slowT, 0.8);
          if (arcs++ < 4) this.beams.push({ x0: this.cx, y0: this.cy, x1: e.x, y1: e.y, life: 0.1, zap: true });
        }
      }
    }
    if (s.mine) {
      const M = this.mineSetup();
      this.mineT -= dt;
      if (this.mineT <= 0 && this.mines.length < M.max) {
        this.mineT = M.cd;
        const a = Math.random() * Math.PI * 2, d = 26 + Math.random() * 46;
        this.mines.push({ x: this.cx + Math.cos(a) * d, y: this.cy + 2 + Math.sin(a) * d * 0.85, arm: 0.4 });
      }
      for (const m of this.mines) {
        m.arm -= dt;
        if (m.arm > 0) continue;
        for (const e of this.enemies) {
          if (!e.dead && (e.x - m.x) ** 2 + (e.y - m.y) ** 2 < (e.r + 5) ** 2) { m.done = true; this.explode(m.x, m.y, M.r, M.dmg, false); break; }
        }
      }
      this.mines = this.mines.filter(m => !m.done);
    }
    if (s.bolt) {
      this.boltT -= dt;
      if (this.boltT <= 0) {
        this.boltT = 2.8 - 0.3 * s.bolt;
        const vis = this.enemies.filter(e => !e.dead && e.x > 0 && e.x < screen.W && e.y > TOP && e.y < screen.H - BOTTOM_H);
        const n = this.evo.skyfury ? 3 : 1;
        for (let k = 0; k < n && vis.length; k++) {
          const e = vis.splice((Math.random() * vis.length) | 0, 1)[0];
          const crit = this.evo.skyfury && Math.random() < s.crit;
          this.bolts.push({ x: e.x, y: e.y, life: 0.2 });
          this.damage(e, (4 + 2.5 * s.bolt) * s.pow * (crit ? s.critMul : 1), 0, 0, crit);
        }
        if (n) { sfx.hit(); this.shake = Math.max(this.shake, 1.5); }
      }
    }
    if (this.evo.storm) {
      this.stormT -= dt;
      if (this.stormT <= 0) { this.stormT = 8; this.rings.push({ t: 0, max: 85 * s.pulseR, dmg: (6 + this.level) * s.pulseDmg, hit: new Set() }); sfx.pulse(); }
    }
  }

  explode(x, y, r, dmg, hostile, skip, ignite) {
    this.booms.push({ x, y, r, t: 0 });
    for (const e of this.enemies) {
      if (e.dead || e === skip) continue;
      const d = Math.hypot(e.x - x, e.y - y);
      if (d < r + e.r) {
        this.damage(e, dmg, (e.x - x) / (d || 1) * 2, (e.y - y) / (d || 1) * 2, false, true);
        if (ignite && !e.dead) { e.burnT = 3; e.burnDps = Math.max(e.burnDps, dmg * 0.2); }
      }
    }
    if (hostile && Math.hypot(this.cx - x, this.cy - y) < r + 6) this.hurt(1);
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * 6.28, sp = 30 + Math.random() * 50;
      this.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.3, c: BOOM[(Math.random() * 4) | 0], s: 2 });
    }
    this.shake = Math.max(this.shake, 2);
    sfx.kill();
  }

  damage(e, dmg, kx, ky, crit, quiet) {
    if (e.dead) return;
    if (e.T.armor) dmg *= 1 - e.T.armor;
    if (this.evo.zero && e.slowT > 0) dmg *= 1.4;
    e.hp -= dmg; e.flash = 0.08;
    const kb = e.T.boss ? 0.3 : e.r >= 9 || e.elite ? 1 : 3.5;
    e.kx += kx * kb * 20; e.ky += ky * kb * 20;
    if (!quiet || crit || Math.random() < 0.3)
      this.texts.push({ x: e.x + (Math.random() - 0.5) * 6, y: e.y - e.r, s: fmt(dmg), life: 0.6, c: crit ? GOLD : '#f2ece0', big: crit });
    if (!quiet) sfx.hit();
    if (e.hp <= 0) this.kill(e);
  }

  kill(e) {
    if (e.dead) return;
    e.dead = true;
    const T = e.T, em = e.elite ? ELITE : null;
    this.kills++; this.score += Math.round(T.score * (em ? em.score : 1));
    if (!this.pulseKill) this.energy = Math.min(100, this.energy + (T.boss ? 100 : 3.2 * this.s.energyGain)); // abates do pulso não recarregam o pulso
    splat(this.fctx, e.x, e.y + 2, e.r * 0.9, T.goo);
    this.puff(e.x, e.y, (T.goo || PAL.goo)[2], 6 + e.r);
    if (this.evo.nanobots && this.kills % 15 === 0 && this.hp < this.maxHp) { this.hp++; sfx.coin(); }
    if (this.evo.inferno && e.burnT > 0) { // fogo se espalha
      for (const o of this.enemies) if (!o.dead && o !== e && (o.x - e.x) ** 2 + (o.y - e.y) ** 2 < 1024) { o.burnT = 3; o.burnDps = Math.max(o.burnDps, e.burnDps); }
      this.puff(e.x, e.y, FIRE, 6);
    }
    const xpMul = this.endless ? 1 : 1 + (this.world - 1) * 0.2;
    let xp = Math.round(T.xp * xpMul * (em ? em.xp : 1));
    while (xp > 0) {
      const big = xp >= 5;
      this.gems.push({ x: e.x + (Math.random() - 0.5) * e.r, y: e.y + (Math.random() - 0.5) * e.r, big, v: (big ? 5 : 1) * XP_MUL * this.s.xpMul });
      xp -= big ? 5 : 1;
    }
    if (T.split) for (let i = 0; i < T.split.n; i++) {
      const a = Math.random() * 6.28;
      const c = this.addEnemyAt(T.split.type, e.x + Math.cos(a) * 5, e.y + Math.sin(a) * 5);
      c.kx = Math.cos(a) * 60; c.ky = Math.sin(a) * 60;
    }
    if (T.explode) this.explode(e.x, e.y, T.explode.r, T.explode.dmg * this.s.pow, true, e);
    sfx.kill();
    if (T.boss) {
      this.shake = 10; vibrate(true);
      this.boss = null;
      if (!this.endless) {
        this.state = 'clearing'; this.endT = 1.6;
        for (const o of this.enemies) if (!o.dead) { o.dead = true; this.puff(o.x, o.y, PAL.slate[2], 6); }
        this.eshots = [];
      }
    }
  }

  puff(x, y, c, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, sp = 20 + Math.random() * 60;
      this.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.25 + Math.random() * 0.3, c: Math.random() < 0.5 ? c : PAL.slate[2 + (Math.random() * 2 | 0)], s: 1 + (Math.random() < 0.3) });
    }
  }

  // ---------- IA dos inimigos ----------
  updateEnemies(dt) {
    const cx = this.cx, cy = this.cy;
    const slowF = this.evo.zero ? 0.25 : Math.max(0.4, 1 - 0.2 * this.s.frost);
    for (const e of this.enemies) {
      if (e.dead) continue;
      const T = e.T;
      e.flash -= dt; e.ph += dt * (T.fly ? 14 : 9);
      if (e.burnT > 0) { // queimadura
        e.burnT -= dt; e.burnAcc += dt;
        if (e.burnAcc >= 0.5) {
          e.burnAcc -= 0.5;
          this.parts.push({ x: e.x + (Math.random() - 0.5) * e.r, y: e.y - e.r * 0.5, vx: 0, vy: -25, life: 0.35, c: Math.random() < 0.5 ? FIRE : GOLD, s: 1 });
          this.damage(e, e.burnDps * 0.5, 0, 0, false, true);
          if (e.dead) continue;
        }
      }
      e.slowT -= dt;
      const sf = e.slowT > 0 ? slowF : 1;
      const dx = cx - e.x, dy = cy - e.y, d = Math.hypot(dx, dy) || 1;
      const ux = dx / d, uy = dy / d;
      const reach = e.r + 6;
      const onScreen = e.x > 4 && e.x < screen.W - 4 && e.y > TOP && e.y < screen.H - BOTTOM_H;

      if (T.phase) {
        e.phT -= dt;
        if (e.phT <= 0) { e.ethereal = !e.ethereal; e.phT = e.ethereal ? T.phase.off : T.phase.on; }
      }
      if (T.summon && onScreen) {
        e.sumT -= dt;
        if (e.sumT <= 0) {
          e.sumT = T.summon.cd;
          for (let i = 0; i < T.summon.n; i++) { const a = Math.random() * 6.28; this.addEnemyAt(T.summon.type, e.x + Math.cos(a) * e.r, e.y + Math.sin(a) * e.r); }
          this.puff(e.x, e.y, (T.goo || PAL.goo)[2], 8);
        }
      }
      if (T.spray && onScreen) {
        e.sprT -= dt;
        if (e.sprT <= 0) {
          e.sprT = T.spray.cd;
          const off = Math.random() * 6.28;
          for (let i = 0; i < T.spray.n; i++) {
            const a = off + i / T.spray.n * Math.PI * 2;
            this.eshots.push({ x: e.x, y: e.y, vx: Math.cos(a) * T.spray.speed, vy: Math.sin(a) * T.spray.speed, life: 6 });
          }
        }
      }
      if (T.healer && onScreen) {
        e.healT -= dt;
        if (e.healT <= 0) {
          e.healT = T.healer.cd;
          for (const o of this.enemies) {
            if (o === e || o.dead || o.hp >= o.maxHp || Math.hypot(o.x - e.x, o.y - e.y) > T.healer.radius) continue;
            o.hp = Math.min(o.maxHp, o.hp + o.maxHp * T.healer.amount);
            this.parts.push({ x: o.x, y: o.y - o.r, vx: 0, vy: -20, life: 0.5, c: '#7dff6a', s: 2 });
          }
          this.beams.push({ x0: e.x, y0: e.y, x1: e.x, y1: e.y, life: 0.3, heal: T.healer.radius });
        }
      }
      if (T.ranged && d < T.ranged.range + 6 && onScreen) {
        e.shotT -= dt * sf;
        if (e.shotT <= 0) {
          e.shotT = T.ranged.cd; e.spit = 0.2;
          this.eshots.push({ x: e.x, y: e.y, vx: ux * T.ranged.speed, vy: uy * T.ranged.speed, life: 4 });
        }
      }
      e.spit = (e.spit || 0) - dt;

      let vx = 0, vy = 0;
      const keep = T.ranged ? T.ranged.range : T.healer ? T.healer.range : 0;
      if (T.dash && e.mode !== 'walk') {
        e.modeT -= dt;
        if (e.mode === 'wind') { if (e.modeT <= 0) { e.mode = 'dash'; e.modeT = 0.8; e.dvx = ux * T.dash.speed; e.dvy = uy * T.dash.speed; } }
        else { vx = e.dvx; vy = e.dvy; if (e.modeT <= 0 || d <= reach) { e.mode = 'walk'; e.dashCd = T.dash.cd; } }
      } else if (d > reach) {
        if (T.dash) {
          e.dashCd -= dt;
          if (d < T.dash.range && e.dashCd <= 0 && onScreen) { e.mode = 'wind'; e.modeT = T.dash.wind; }
        }
        if (keep && d < keep) { vx = -uy * e.speed * 0.4; vy = ux * e.speed * 0.4; }
        else { vx = ux * e.speed; vy = uy * e.speed; }
        if (T.fly) { const w = T.zig ? 45 : 18, f = T.zig ? 0.5 : 0.25; vx += -uy * Math.sin(e.ph * f) * w; vy += ux * Math.sin(e.ph * f) * w; }
        if (e.mode === 'wind') { vx = 0; vy = 0; }
      }
      e.x += (vx * sf + e.kx) * dt; e.y += (vy * sf + e.ky) * dt;
      if (Math.abs(vx) > 1) e.face = vx > 0 ? -1 : 1;
      if (d <= reach) {
        e.atk -= dt * sf;
        if (e.atk <= 0) {
          e.atk = 1.1;
          if (T.explode) { this.hurt(T.dmg, e); if (!e.dead) { e.hp = 0; e.dead = true; this.kills++; this.explode(e.x, e.y, T.explode.r, T.explode.dmg, false, e); } }
          else { this.hurt(T.dmg, e); if (T.kamikaze && !e.dead) { e.hp = 0; this.kill(e); } }
        }
      }
      e.kx *= Math.pow(0.0005, dt); e.ky *= Math.pow(0.0005, dt);
    }
    const es = this.enemies;
    for (let i = 0; i < es.length; i++) for (let j = i + 1; j < es.length; j++) {
      const a = es[i], b = es[j];
      if (!!a.T.fly !== !!b.T.fly) continue;
      const dx = b.x - a.x, dy = b.y - a.y, rr = (a.r + b.r) * 0.8;
      const d2 = dx * dx + dy * dy;
      if (d2 < rr * rr && d2 > 0.01) {
        const d = Math.sqrt(d2), push = (rr - d) / 2 / d;
        const wa = a.T.boss ? 0.1 : 1, wb = b.T.boss ? 0.1 : 1;
        a.x -= dx * push * wa; a.y -= dy * push * wa; b.x += dx * push * wb; b.y += dy * push * wb;
      }
    }
    this.enemies = es.filter(e => !e.dead);
  }

  updateEnemyShots(dt) {
    for (const s of this.eshots) {
      s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
      if ((s.x - this.cx) ** 2 + (s.y - this.cy - 2) ** 2 < 49) { s.dead = true; this.hurt(1); this.puff(s.x, s.y, ACID, 5); }
      if (s.life <= 0) s.dead = true;
    }
    this.eshots = this.eshots.filter(s => !s.dead);
  }

  hurt(dmg, src) {
    if (this.iframes > 0 || this.state !== 'play') return;
    if (Math.random() < this.s.dodge) { // esquiva
      this.iframes = 0.35;
      this.texts.push({ x: this.cx, y: this.cy - 16, s: t('dodged'), life: 0.6, c: DEF });
    } else {
      this.hp -= dmg; this.iframes = 0.7; this.hurtFlash = 0.25; this.shake = 4;
      sfx.hurt(); vibrate(true);
      if (this.hp <= 0) { this.hp = 0; this.state = 'dying'; this.endT = 1.2; }
    }
    if (src && this.s.thorns && !src.dead) { // espinhos (depois do golpe, para não contar em dobro)
      this.damage(src, (2 + this.s.gun * 1.5) * this.s.thorns * this.s.pow, (src.x - this.cx) / 20, (src.y - this.cy) / 20, false, true);
      this.puff(src.x, src.y, DEF, 3);
    }
  }

  updateGems(dt) {
    for (const g of this.gems) {
      const dx = this.cx - g.x, dy = this.cy - g.y, d = Math.hypot(dx, dy);
      g.age = (g.age || 0) + dt;
      if (g.age > 0.35) { const sp = 60 + g.age * 260; g.x += dx / d * sp * dt; g.y += dy / d * sp * dt; }
      if (d < 7) { g.got = true; this.xp += g.v; sfx.pickup(); }
    }
    this.gems = this.gems.filter(g => !g.got);
    if (this.xp >= this.xpNext) {
      this.xp -= this.xpNext; this.level++;
      this.xpNext = xpFor(this.level);
      this.mode = 'level';
      this.openLevelUp();
    }
  }

  updateFx(dt) {
    for (const p of this.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.9; p.vy *= 0.9; p.life -= dt; }
    this.parts = this.parts.filter(p => p.life > 0);
    for (const b of this.beams) b.life -= dt;
    this.beams = this.beams.filter(b => b.life > 0);
    for (const b of this.bolts) b.life -= dt;
    this.bolts = this.bolts.filter(b => b.life > 0);
    for (const b of this.booms) b.t += dt;
    this.booms = this.booms.filter(b => b.t < 0.3);
    for (const x of this.texts) { x.y -= dt * (x.banner ? 0 : 18); x.life -= dt; }
    this.texts = this.texts.filter(x => x.life > 0);
    for (const r of this.rings) {
      r.t += dt;
      const rad = r.t / 0.35 * r.max;
      for (const s of this.eshots) if (Math.hypot(s.x - this.cx, s.y - this.cy) < rad) s.dead = true;
      for (const e of this.enemies) {
        if (e.dead || r.hit.has(e)) continue;
        const d = Math.hypot(e.x - this.cx, e.y - this.cy);
        if (d < rad + e.r) {
          r.hit.add(e);
          if (r.spareBoss && e.T.boss) { e.kx += (e.x - this.cx) / d * 260; e.ky += (e.y - this.cy) / d * 260; continue; }
          if (!r.dmg) continue;
          this.pulseKill = true; // inclui explosões em cadeia causadas pelo pulso
          this.damage(e, r.dmg, (e.x - this.cx) / d * 4, (e.y - this.cy) / d * 4, false, true);
          this.pulseKill = false;
        }
      }
    }
    this.rings = this.rings.filter(r => r.t < 0.45);
  }

  say(s, c, life = 2.4) { this.texts = this.texts.filter(x => !x.banner); this.texts.push({ banner: true, s, c, life, x: 0, y: 0 }); }

  pulse() {
    if (this.state !== 'play' || this.energy < 100) return;
    this.energy = 0;
    this.rings.push({ t: 0, max: 110 * this.s.pulseR, dmg: (8 + this.level * 1.5) * this.s.pulseDmg, hit: new Set() });
    this.shake = 6; sfx.pulse(); vibrate(true);
  }

  // ================= Cartas: nível, kit inicial, recompensa de fase =================
  availableEvos() {
    return Object.entries(EVOLUTIONS).filter(([k, ev]) => !this.evo[k] && Object.entries(ev.req).every(([u, n]) => this.lv[u] >= n)).map(([k]) => k);
  }

  rollOptions() {
    const opts = [];
    const evos = this.availableEvos();
    if (evos.length) opts.push({ evo: evos[(Math.random() * evos.length) | 0] });
    // sorteio com peso: o que você já tem aparece mais (ajuda a fechar builds)
    const pool = Object.keys(UPGRADES).filter(k => this.lv[k] < UPGRADES[k].max)
      .map(k => ({ k, w: this.lv[k] > 0 ? 2.5 : UPGRADES[k].kind === 'weapon' ? 1.2 : 1 }));
    while (opts.length < 3 && pool.length) {
      let r = Math.random() * pool.reduce((a, p) => a + p.w, 0), i = 0;
      for (; i < pool.length - 1; i++) if ((r -= pool[i].w) <= 0) break;
      opts.push({ up: pool.splice(i, 1)[0].k });
    }
    return opts;
  }

  openLevelUp(reroll) {
    if (!reroll) { this.state = 'levelup'; this.cardDelay = 0.6; sfx.level(); }
    const opts = this.rollOptions();
    if (!opts.length) { this.hp = Math.min(this.maxHp, this.hp + 1); this.score += 100; this.afterPick(); return; }
    clearButtons();
    const w = Math.min(176, screen.W - 16), h = 40, x = (screen.W - w) / 2;
    const y = this.cy - 70;
    this.cards = opts.map((o, i) => addButton({
      x, y: y + i * (h + 6), w, h, label: '', disabled: this.cardDelay > 0, onTap: () => this.pick(o),
      draw: (ctx, b) => this.drawCard(ctx, b, o),
    }));
    const ry = y + 3 * (h + 6) + 2;
    if (this.rerolls > 0) addButton({ x: (screen.W - 90) / 2, y: ry, w: 90, label: `${t('reroll')} (${this.rerolls})`, onTap: () => { this.rerolls--; this.openLevelUp(true); } });
    else if (this.adReroll) addButton({ x: (screen.W - 110) / 2, y: ry, w: 110, label: t('reroll_ad'), color: '#1c3340', borderColor: UI.cyan, textColor: UI.cyan,
      onTap: async () => { const ok = await Ads.showRewarded(); if (ok) { this.adReroll = false; this.openLevelUp(true); } } });
  }

  drawCard(ctx, b, o) {
    ctx.globalAlpha = b.disabled ? 0.5 : 1;
    const oy = b.pressed && input.down ? 1 : 0;
    if (o.evo) {
      const glow = (this.anim * 4 | 0) % 2;
      drawPanel(ctx, b.x, b.y + oy, b.w, b.h, { rivets: true, fill: '#3a2c10', border: glow ? '#fff090' : GOLD, hi: '#5a4416' });
      const [name, desc] = EVO_TEXT[o.evo];
      drawText(ctx, t('evo'), b.x + b.w - 6, b.y + oy + 5, GOLD, { align: 'right' });
      drawText(ctx, name, b.x + 6, b.y + oy + 5, '#fff090');
      wrap(desc, b.w - 12).forEach((l, j) => drawText(ctx, l, b.x + 6, b.y + oy + 16 + j * 7, UI.text));
    } else {
      const U = UPGRADES[o.up], [name, desc] = RUN_UPGRADES[o.up];
      const col = U.kind === 'weapon' ? UI.accent : U.kind === 'defense' ? DEF : UI.cyan;
      drawPanel(ctx, b.x, b.y + oy, b.w, b.h, { rivets: true, border: U.kind === 'weapon' ? '#b4653f' : U.kind === 'defense' ? '#3f7a3c' : undefined });
      drawText(ctx, name, b.x + 6, b.y + oy + 5, col);
      const isNew = this.lv[o.up] === 0 && U.kind === 'weapon';
      drawText(ctx, isNew ? t('newtag') : t(U.kind === 'weapon' ? 'weapon' : U.kind === 'defense' ? 'defense' : 'passive'), b.x + b.w - 6, b.y + oy + 30, isNew ? GOLD : '#5c6670', { align: 'right' });
      wrap(desc, b.w - 12).forEach((l, j) => drawText(ctx, l, b.x + 6, b.y + oy + 15 + j * 7, UI.text));
      for (let d = 0; d < U.max; d++) {
        ctx.fillStyle = d < this.lv[o.up] ? UI.cyan : d === this.lv[o.up] ? '#7d98ad' : '#3a4654';
        ctx.fillRect(b.x + 6 + d * 5, b.y + oy + 32, 3, 3);
      }
      const ev = Object.entries(EVOLUTIONS).find(([k, e]) => !this.evo[k] && e.req[o.up]);
      if (ev) { ctx.fillStyle = GOLD; ctx.fillRect(b.x + b.w - 10, b.y + oy + 6, 3, 3); }
    }
    ctx.globalAlpha = 1;
  }

  pick(o) {
    if (o.evo) {
      this.evo[o.evo] = true;
      const ev = EVOLUTIONS[o.evo];
      if (ev.heal) this.hp = Math.min(this.maxHp, this.hp + ev.heal);
      this.say(`${EVO_TEXT[o.evo][0]} ${t('evolved')}`, GOLD, 3);
      this.rings.push({ t: 0, max: 60, dmg: 0, hit: new Set(), gold: true });
      sfx.level(); setTimeout(() => sfx.coin(), 250);
    } else {
      this.lv[o.up]++;
      const U = UPGRADES[o.up];
      if (o.up === 'hp') this.maxHp++;
      if (U.heal) this.hp = Math.min(this.maxHp, this.hp + U.heal);
    }
    this.recalc();
    this.afterPick();
  }

  afterPick() {
    if (this.mode === 'kit' && --this.kit > 0) { this.cardDelay = 0.3; this.openLevelUp(true); return; }
    if (this.mode === 'reward') { this.mode = null; this.nextSub(); return; }
    this.mode = null;
    this.state = 'play';
    this.makeHudButtons();
  }

  // ================= Pausa =================
  pause() {
    if (this.state !== 'play') return;
    this.state = 'paused';
    clearButtons();
    const bw = 110, x = (screen.W - bw) / 2, y = screen.H - BOTTOM_H - 50;
    addButton({ x, y, w: bw, label: t('resume'), onTap: () => { this.state = 'play'; this.makeHudButtons(); } });
    addButton({ x, y: y + 22, w: bw, label: t('quit'), onTap: () => this.die() });
  }
  onBack() { if (this.state === 'play') this.pause(); else if (this.state === 'paused') { this.state = 'play'; this.makeHudButtons(); } }
  onAppPause() { this.pause(); }
  die() { this.hp = 0; this.revived = true; this.state = 'dying'; this.endT = 0.01; }

  // ================= Fim de partida =================
  rewards() {
    const mult = (1 + meta.up.coin * 0.25) * this.s.greed;
    return Math.floor((this.score / 8 + this.time / 2) * mult * SCRAP_MUL);
  }

  showGameOver() {
    this.state = 'over';
    this.earned = this.rewards(); this.doubled = false;
    this.newBest = this.score > meta.best;
    this.finalize = () => {
      meta.coins += this.earned; meta.runs++;
      if (this.newBest) meta.best = this.score;
      if (this.endless) meta.bestEndless = Math.max(meta.bestEndless || 0, Math.floor(this.time));
      saveMeta();
    };
    clearButtons();
    const bw = 150, x = (screen.W - bw) / 2;
    let y = this.cy + 30;
    if (!this.revived) { addButton({ x, y, w: bw, label: t('revive'), color: '#3c2a1e', borderColor: UI.accent, textColor: '#ffd08a', onTap: () => this.reviveAd() }); y += 22; }
    this.dblBtn = addButton({ x, y, w: bw, label: t('double'), color: '#1c3340', borderColor: UI.cyan, textColor: UI.cyan, onTap: () => this.doubleAd() });
    addButton({ x, y: y + 22, w: bw, label: t('cont'), onTap: () => this.finish(() => new StageScene()) });
  }

  showVictory() {
    this.state = 'won';
    const id = this.world;
    this.firstClear = !meta.cleared[id];
    this.bonus = Math.floor((60 + id * 40) * (this.firstClear ? 2 : 1) * SCRAP_MUL * 2); // mundo inteiro = bônus maior
    this.earned = this.rewards() + this.bonus; this.doubled = false;
    sfx.level(); setTimeout(() => sfx.coin(), 300);
    this.finalize = () => {
      meta.coins += this.earned; meta.runs++;
      meta.cleared[id] = true; meta.unlocked = Math.max(meta.unlocked, id + 1); meta.bestSub[id] = 6;
      if (this.score > meta.best) meta.best = this.score;
      saveMeta();
    };
    clearButtons();
    const bw = 150, x = (screen.W - bw) / 2;
    let y = this.cy + 30;
    this.dblBtn = addButton({ x, y, w: bw, label: t('double'), color: '#1c3340', borderColor: UI.cyan, textColor: UI.cyan, onTap: () => this.doubleAd() });
    y += 22;
    const next = id < STAGES.length ? id + 1 : 'endless';
    addButton({ x, y, w: bw, label: next === 'endless' ? t('endless') : t('next'), color: '#3c2a1e', borderColor: UI.accent, textColor: '#ffd08a', onTap: () => this.finish(() => new PlayScene(next)) });
    addButton({ x, y: y + 22, w: bw, label: t('menu'), onTap: () => this.finish(() => new StageScene()) });
  }

  async reviveAd() {
    stopMusic();
    const ok = await Ads.showRewarded();
    if (!ok) { this.say(t('noad'), UI.accent); startMusic(this.stage.bpm); return; }
    this.revived = true; this.hp = Math.ceil(this.maxHp / 2); this.iframes = 2.5; this.state = 'play';
    this.eshots = [];
    this.rings.push({ t: 0, max: 140, dmg: (8 + this.level * 1.5), hit: new Set(), spareBoss: true });
    this.makeHudButtons(); sfx.pulse(); startMusic(this.stage.bpm);
  }

  async doubleAd() {
    if (this.doubled) return;
    const ok = await Ads.showRewarded();
    if (!ok) return;
    this.earned *= 2; this.doubled = true; sfx.coin();
    removeButton(this.dblBtn);
  }

  async finish(next) {
    this.finalize();
    await Ads.maybeInterstitial();
    setScene(next());
  }

  // ================= Desenho =================
  draw(ctx) {
    const sx = this.shake ? Math.round((Math.random() - 0.5) * this.shake) : 0;
    const sy = this.shake ? Math.round((Math.random() - 0.5) * this.shake) : 0;
    ctx.save(); ctx.translate(sx, sy);
    ctx.drawImage(this.floor, 0, 0);

    for (const m of this.mines) {
      const x = Math.round(m.x), y = Math.round(m.y);
      ctx.fillStyle = '#0c0e14'; ctx.fillRect(x - 3, y - 2, 6, 4); ctx.fillRect(x - 2, y - 3, 4, 6);
      ctx.fillStyle = '#4a4b58'; ctx.fillRect(x - 2, y - 2, 4, 4);
      if (m.arm <= 0 && (this.anim * 4 | 0) % 2) { ctx.fillStyle = '#ff3a3a'; ctx.fillRect(x - 1, y - 1, 2, 2); }
    }
    for (const g of this.gems) ctx.drawImage(g.big ? ART.gemBig : ART.gem, Math.round(g.x) - 2, Math.round(g.y) - 2 + (Math.sin(this.anim * 6 + g.x) > 0 ? 0 : -1));

    const alive = this.enemies.filter(e => !e.dead);
    ctx.fillStyle = 'rgba(20,14,24,0.45)';
    for (const e of alive) { const w = e.r * 1.8; ctx.fillRect(Math.round(e.x - w / 2), Math.round(e.y + e.r * 0.7 + (e.T.fly ? 6 : 0)), Math.round(w), 2); }
    ctx.fillRect(this.cx - 7, this.cy + 11, 14, 2);

    if (this.s.shock) {
      const R = 24 + this.s.shock * 3;
      ctx.globalAlpha = 0.25 + (this.shockT > 0.5 ? 0.4 : 0);
      pixCircle(ctx, this.cx, this.cy + 2, R, '#b8a0ff', 2);
      ctx.globalAlpha = 1;
    }
    this.drawReticle(ctx);

    const list = alive.sort((a, b) => a.y - b.y);
    list.filter(e => e.y < this.cy).forEach(e => this.drawEnemy(ctx, e));
    this.drawPlayer(ctx);
    list.filter(e => e.y >= this.cy).forEach(e => this.drawEnemy(ctx, e));

    for (let i = 0; i < this.s.drones; i++) {
      const p = this.dronePos(i);
      ctx.drawImage(ART.drone[(this.anim * 6 + i) % 2 | 0], Math.round(p.x) - 5, Math.round(p.y) - 5);
    }
    if (this.s.saw) {
      const S = this.sawSetup();
      for (let i = 0; i < S.n; i++) {
        const p = this.sawPos(i, S), img = ART.saw[(this.anim * 12 | 0) % 2];
        if (this.evo.cyclone) ctx.drawImage(img, Math.round(p.x) - 8, Math.round(p.y) - 8, 16, 16);
        else ctx.drawImage(img, Math.round(p.x) - 5, Math.round(p.y) - 5);
      }
    }
    for (const g of this.nades) {
      const k = Math.min(1, g.t / g.dur);
      const x = g.x0 + (g.x1 - g.x0) * k, y = g.y0 + (g.y1 - g.y0) * k - Math.sin(k * Math.PI) * (g.big ? 22 : 10);
      ctx.fillStyle = '#0c0e14'; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4);
      ctx.fillStyle = '#4a5e36'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
      if ((this.anim * 10 | 0) % 2) { ctx.fillStyle = '#ff3a3a'; ctx.fillRect(Math.round(x), Math.round(y) - 2, 1, 1); }
    }
    for (const s of this.eshots) {
      const x = Math.round(s.x), y = Math.round(s.y);
      ctx.fillStyle = '#0c0e14'; ctx.fillRect(x - 2, y - 1, 5, 3); ctx.fillRect(x - 1, y - 2, 3, 5);
      ctx.fillStyle = ACID; ctx.fillRect(x - 1, y - 1, 3, 3);
      ctx.fillStyle = '#e8ffc0'; ctx.fillRect(x - 1, y - 1, 1, 1);
    }

    for (const b of this.bullets) {
      if (b.rail) {
        ctx.globalAlpha = 0.4; pixLine(ctx, b.x - b.vx * 0.04, b.y - b.vy * 0.04, b.x, b.y, PAL.cyan); ctx.globalAlpha = 1;
        pixLine(ctx, b.x - b.vx * 0.02, b.y - b.vy * 0.02, b.x, b.y, PAL.cyanHi);
      } else {
        const tail = this.s.burn ? '#c83a10' : this.s.frost ? '#3a8ab8' : '#b4653f';
        const head = this.s.burn ? FIRE : this.s.frost ? ICE : '#ffd08a';
        pixLine(ctx, b.x - b.vx * 0.02, b.y - b.vy * 0.02, b.x, b.y, tail);
        ctx.fillStyle = head; ctx.fillRect(Math.round(b.x) - 1, Math.round(b.y) - 1, 2, 2);
      }
    }
    for (const bm of this.beams) {
      if (bm.heal) { ctx.globalAlpha = bm.life / 0.3 * 0.6; pixCircle(ctx, bm.x0, bm.y0, bm.heal * (1 - bm.life / 0.3), '#7dff6a', 2); ctx.globalAlpha = 1; continue; }
      if (bm.zap) { zigLine(ctx, bm.x0, bm.y0, bm.x1, bm.y1, '#d8c8ff'); continue; }
      ctx.globalAlpha = 0.35; pixLine(ctx, bm.x0, bm.y0 - 1, bm.x1, bm.y1 - 1, PAL.cyan); pixLine(ctx, bm.x0, bm.y0 + 1, bm.x1, bm.y1 + 1, PAL.cyan);
      ctx.globalAlpha = 1; pixLine(ctx, bm.x0, bm.y0, bm.x1, bm.y1, bm.life > 0.06 ? PAL.cyanHi : PAL.cyan);
      ctx.fillStyle = PAL.cyanHi; ctx.fillRect(Math.round(bm.x1) - 1, Math.round(bm.y1) - 1, 3, 3);
    }
    for (const b of this.bolts) { // raio vindo do céu
      zigLine(ctx, b.x + 6, TOP, b.x, b.y, b.life > 0.1 ? '#ffffff' : '#fff090');
      zigLine(ctx, b.x + 5, TOP, b.x, b.y, '#fff090');
      if (b.life > 0.12) { ctx.fillStyle = 'rgba(255,250,200,0.5)'; disc(ctx, b.x, b.y, 7); }
    }
    for (const b of this.booms) {
      const k = b.t / 0.3;
      if (k < 0.3) { ctx.fillStyle = 'rgba(255,220,150,0.5)'; disc(ctx, b.x, b.y, b.r * 0.7); }
      pixCircle(ctx, b.x, b.y, b.r * (0.4 + k * 0.6), k < 0.5 ? BOOM[1] : BOOM[3]);
    }
    for (const r of this.rings) {
      const rad = Math.min(1, r.t / 0.35) * r.max;
      ctx.globalAlpha = 1 - r.t / 0.45;
      pixCircle(ctx, this.cx, this.cy, rad, r.gold ? GOLD : PAL.cyanHi); pixCircle(ctx, this.cx, this.cy, rad - 2, r.gold ? '#ff8a2a' : PAL.cyan);
      ctx.globalAlpha = 1;
    }
    for (const p of this.parts) { ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); }
    for (const x of this.texts) if (!x.banner) drawText(ctx, x.s, x.x, x.y, x.c, { align: 'center', scale: x.big ? 2 : 1 });
    ctx.restore();

    if (this.hurtFlash > 0) { ctx.fillStyle = `rgba(200,30,40,${this.hurtFlash})`; ctx.fillRect(0, 0, screen.W, screen.H); }

    this.drawHud(ctx);
    const bn = this.texts.find(x => x.banner);
    const overlay = ['levelup', 'paused', 'over', 'won'].includes(this.state);
    if (bn && !overlay && (bn.life > 0.6 || (bn.life * 10 | 0) % 2)) {
      const sc = bn.s.length > 15 ? 1 : 2;
      drawText(ctx, bn.s, screen.W / 2, TOP + (this.boss ? 22 : 14), bn.c, { align: 'center', scale: sc });
    }
    if (!this.everShot && this.state === 'play' && (this.anim * 2 | 0) % 2) drawText(ctx, t('hold'), screen.W / 2, this.cy + 44, UI.text, { align: 'center' });

    if (this.state === 'levelup') {
      if (this.mode === 'reward') this.drawOverlay(ctx, `${this.world}-${this.sub} ${t('sub_clear')}`, t('reward'), this.cy - 98, GOLD);
      else if (this.mode === 'kit') this.drawOverlay(ctx, `${t('kit')} (${this.kit})`, t('choose'), this.cy - 98);
      else this.drawOverlay(ctx, t('levelup'), t('choose'), this.cy - 98);
    }
    if (this.state === 'paused') this.drawPause(ctx);
    if (this.state === 'over') this.drawEnd(ctx, t('gameover'), UI.red);
    if (this.state === 'won') this.drawEnd(ctx, t('victory'), GOLD);
  }

  drawEnemy(ctx, e) {
    const A = ART[e.T.art];
    const f = e.spit > 0 ? 1 : (e.ph | 0) % 2;
    const flip = e.face < 0;
    let img = e.flash > 0 ? A.hit : (flip ? A.flipped[f] : A.frames[f]);
    if (e.mode === 'wind' && (this.anim * 16 | 0) % 2) img = A.hit;
    let x = Math.round(e.x - img.width / 2), y = Math.round(e.y - img.height / 2 - (e.T.fly ? 6 : 0));
    if (e.mode === 'wind') x += Math.round(Math.random() * 2 - 1);
    if (e.ethereal) ctx.globalAlpha = 0.28; else if (e.T.phase) ctx.globalAlpha = 0.85;
    if (e.elite) { // contorno vermelho
      const red = flip ? A.redF[f] : A.red[f];
      for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ctx.drawImage(red, x + ox, y + oy);
    }
    ctx.drawImage(img, x, y);
    ctx.globalAlpha = 1;
    if (e.slowT > 0) { ctx.fillStyle = ICE; ctx.fillRect(x + 1, y + img.height - 2, 2, 1); ctx.fillRect(x + img.width - 3, y + 1, 2, 1); }
    if (e.T.armor && !e.T.boss) { ctx.fillStyle = '#93a3ba'; ctx.fillRect(x + img.width - 3, y, 2, 2); }
    if ((e.hp < e.maxHp || e.elite) && !e.T.boss) {
      const w = Math.max(10, e.r * 2), bx = Math.round(e.x - w / 2), by = y - 4;
      ctx.fillStyle = '#120e16'; ctx.fillRect(bx - 1, by - 1, w + 2, 4);
      ctx.fillStyle = '#4a1a1e'; ctx.fillRect(bx, by, w, 2);
      ctx.fillStyle = e.elite ? '#ff6a2a' : '#e0393e'; ctx.fillRect(bx, by, Math.max(0, Math.round(w * e.hp / e.maxHp)), 2);
    }
  }

  drawPlayer(ctx) {
    if (this.iframes > 0 && (this.anim * 20 | 0) % 2 && this.state === 'play') return;
    const left = Math.cos(this.aim) < -0.1;
    const f = (this.anim * 1.5 | 0) % 2;
    const img = this.hurtFlash > 0.15 && this.state === 'play' ? ART.playerHit : (left ? ART.playerL[f] : ART.player[f]);
    ctx.drawImage(img, this.cx - 8, this.cy - 10);
  }

  drawReticle(ctx) {
    ctx.globalAlpha = 0.55;
    pixCircle(ctx, this.cx, this.cy + 2, 30, '#d8c79a', 3);
    const a = this.aim;
    for (const o of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const c = Math.cos(a + o), s = Math.sin(a + o);
      pixLine(ctx, this.cx + c * 26, this.cy + 2 + s * 26, this.cx + c * 34, this.cy + 2 + s * 34, '#d8c79a');
    }
    ctx.globalAlpha = 1;
  }

  drawHud(ctx) {
    const many = this.maxHp > 7;
    const hw = many ? 70 : Math.max(70, this.maxHp * 9 + 8);
    drawPanel(ctx, 4, 4, hw, 22, { rivets: true });
    drawText(ctx, t('score'), 8, 7, UI.text);
    drawText(ctx, this.score, 4 + hw - 4, 7, UI.text, { align: 'right' });
    if (many) { ctx.drawImage(ART.heart, 6, 14); drawText(ctx, `${this.hp}/${this.maxHp}`, 17, 16, UI.text); }
    else for (let i = 0; i < this.maxHp; i++) ctx.drawImage(i < this.hp ? ART.heart : ART.heartEmpty, 6 + i * 9, 14);

    drawPanel(ctx, screen.W - 62, 4, 36, 22, { rivets: true });
    if (this.endless) {
      drawText(ctx, clock(this.time), screen.W - 44, 7, UI.accent, { align: 'center' });
      drawText(ctx, `${t('level')}${this.level}`, screen.W - 44, 16, UI.dim, { align: 'center' });
    } else {
      if (!this.bossSpawned) drawText(ctx, clock(Math.max(0, this.subDur() - this.subT)), screen.W - 44, 7, UI.accent, { align: 'center' });
      else if ((this.anim * 3 | 0) % 2) drawText(ctx, t('boss_now'), screen.W - 44, 7, UI.red, { align: 'center' });
      drawText(ctx, `${this.world}-${this.sub}`, screen.W - 44, 16, this.sub === 5 ? UI.red : UI.text, { align: 'center' });
    }

    if (this.boss) {
      const w = screen.W - 24, x = 12, y = TOP + 1;
      drawText(ctx, BOSS_TEXT[this.boss.type], screen.W / 2, y, UI.red, { align: 'center' });
      ctx.fillStyle = '#0c0e14'; ctx.fillRect(x - 1, y + 7, w + 2, 5);
      ctx.fillStyle = '#4a1a1e'; ctx.fillRect(x, y + 8, w, 3);
      ctx.fillStyle = '#e0393e'; ctx.fillRect(x, y + 8, Math.round(w * Math.max(0, this.boss.hp / this.boss.maxHp)), 3);
    } else if (!this.endless) { // progresso: 5 segmentos, um por fase
      const segW = Math.floor((screen.W - 24 - 8) / 5), x0 = 12, y = TOP;
      for (let i = 0; i < 5; i++) {
        const x = x0 + i * (segW + 2);
        ctx.fillStyle = 'rgba(12,14,20,0.7)'; ctx.fillRect(x, y, segW, 2);
        const k = i + 1 < this.sub ? 1 : i + 1 === this.sub ? Math.min(1, this.subT / this.subDur()) : 0;
        ctx.fillStyle = i === 4 ? UI.red : UI.accent; ctx.fillRect(x, y, Math.round(segW * k), 2);
      }
    }

    const y = screen.H - BOTTOM_H;
    drawPanel(ctx, 2, y + 2, screen.W - 4, BOTTOM_H - 4, { rivets: true });
    ctx.drawImage(ART.portrait, 6, y + 7);
    const bx = 32, bw = screen.W - 32 - 58;
    drawText(ctx, `${t('level')}${this.level}`, bx, y + 8, UI.dim);
    bar(ctx, bx + 18, y + 8, bw - 18, 5, this.xp / this.xpNext, UI.green, '#1c2a1a');
    drawText(ctx, t('energy'), bx, y + 19, UI.dim);
    bar(ctx, bx + 30, y + 19, bw - 30, 5, this.energy / 100, UI.accent, '#2e1e16');
    let ex = bx;
    for (const k in this.evo) { ctx.fillStyle = GOLD; ctx.fillRect(ex, y + 28, 3, 3); ex += 5; void k; }
  }

  drawPulseBtn(ctx, b) {
    const full = this.energy >= 100;
    const glow = full && (this.anim * 4 | 0) % 2;
    drawPanel(ctx, b.x, b.y + (b.pressed && input.down ? 1 : 0), b.w, b.h, { fill: full ? '#1c3340' : '#1e252d', border: glow ? PAL.cyanHi : full ? PAL.cyan : '#38434f' });
    drawText(ctx, t('pulse'), b.x + b.w / 2, b.y + 10, full ? PAL.cyan : '#5c6670', { align: 'center' });
  }

  drawOverlay(ctx, title, sub, y = this.cy - 100, color = UI.accent) {
    ctx.fillStyle = 'rgba(12,10,16,0.75)'; ctx.fillRect(0, 0, screen.W, screen.H);
    drawText(ctx, title, screen.W / 2, y, color, { align: 'center', scale: title.length > 12 ? 1 : 2 });
    if (sub) drawText(ctx, sub, screen.W / 2, y + 16, UI.text, { align: 'center' });
  }

  // Pausa: poderes atuais e receitas de evolução que você já começou
  drawPause(ctx) {
    ctx.fillStyle = 'rgba(12,10,16,0.88)'; ctx.fillRect(0, 0, screen.W, screen.H);
    let y = TOP + 2;
    drawText(ctx, t('paused'), screen.W / 2, y, UI.accent, { align: 'center', scale: 2 });
    y += 16;
    drawText(ctx, t('powers'), 8, y, UI.dim); y += 8;
    const owned = Object.keys(UPGRADES).filter(k => this.lv[k] > 0);
    owned.forEach((k, i) => {
      const col = i % 2, row = i / 2 | 0;
      const x = 8 + col * 86, yy = y + row * 7;
      const kind = UPGRADES[k].kind;
      drawText(ctx, SHORT[k], x, yy, kind === 'weapon' ? UI.accent : kind === 'defense' ? DEF : UI.text);
      drawText(ctx, `${this.lv[k]}/${UPGRADES[k].max}`, x + 80, yy, UI.cyan, { align: 'right' });
    });
    y += Math.ceil(owned.length / 2) * 7 + 5;
    drawText(ctx, t('evos'), 8, y, GOLD); y += 8;
    let hidden = 0;
    for (const [k, ev] of Object.entries(EVOLUTIONS)) {
      const done = this.evo[k], started = Object.keys(ev.req).some(u => this.lv[u] > 0);
      if (!done && !started) { hidden++; continue; }
      if (y > screen.H - BOTTOM_H - 62) { hidden++; continue; }
      drawText(ctx, EVO_TEXT[k][0], 8, y, done ? GOLD : UI.text);
      y += 7;
      const req = Object.entries(ev.req).map(([u, n]) => `${SHORT[u]} ${Math.min(this.lv[u], n)}/${n}`).join(' + ');
      drawText(ctx, done ? 'OK!' : req, 12, y, done ? GOLD : UI.dim);
      y += 9;
    }
    if (hidden) drawText(ctx, `+${hidden} ${t('hidden')}`, 8, y, '#5c6670');
  }

  drawEnd(ctx, title, color) {
    ctx.fillStyle = 'rgba(12,10,16,0.8)'; ctx.fillRect(0, 0, screen.W, screen.H);
    const y = this.cy - 110;
    drawText(ctx, title, screen.W / 2, y, color, { align: 'center', scale: title.length > 10 ? 2 : 3 });
    const rows = [];
    if (!this.endless) rows.push([t('reached'), this.state === 'won' ? `${this.world}-5` : `${this.world}-${this.sub}`]);
    rows.push([t('score'), this.score], [t('survived'), clock(this.time)], [t('kills'), this.kills]);
    if (this.state === 'won') rows.push([t('bonus'), '+' + this.bonus]);
    rows.push([t('earned'), this.earned + (this.doubled ? ' X2' : '')]);
    drawPanel(ctx, 30, y + 22, screen.W - 60, rows.length * 11 + 10, { rivets: true });
    rows.forEach(([k, v], i) => {
      drawText(ctx, k, 38, y + 29 + i * 11, UI.dim);
      drawText(ctx, v, screen.W - 38, y + 29 + i * 11, i === rows.length - 1 ? '#ffd08a' : UI.text, { align: 'right' });
    });
    if (this.newBest && this.state === 'over' && (this.anim * 3 | 0) % 2) drawText(ctx, t('newbest'), screen.W / 2, y + 30 + rows.length * 11 + 10, UI.cyan, { align: 'center' });
  }
}

const xpFor = lv => Math.round(5 + lv * 3 + Math.pow(lv, 1.5));
const fmt = v => String(Math.round(v * 10) / 10).replace(/\.0$/, '');
const clock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function segDist2(x0, y0, x1, y1, px, py) {
  const dx = x1 - x0, dy = y1 - y0, l = dx * dx + dy * dy;
  const t = l ? Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / l)) : 0;
  return (x0 + dx * t - px) ** 2 + (y0 + dy * t - py) ** 2;
}

function bar(ctx, x, y, w, h, v, c, bg) {
  ctx.fillStyle = '#0c0e14'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = c;
  const filled = Math.round(w * Math.max(0, Math.min(1, v)));
  for (let i = 0; i < filled; i += 5) ctx.fillRect(x + i, y, Math.min(4, filled - i), h);
}

function disc(ctx, cx, cy, r) {
  for (let y = -r; y <= r; y++) { const w = Math.sqrt(r * r - y * y); ctx.fillRect(Math.round(cx - w), Math.round(cy + y), Math.round(w * 2), 1); }
}

function zigLine(ctx, x0, y0, x1, y1, c) {
  const n = 4; let px = x0, py = y0;
  for (let i = 1; i <= n; i++) {
    const k = i / n, j = i < n ? (Math.random() - 0.5) * 8 : 0;
    const nx = x0 + (x1 - x0) * k + j, ny = y0 + (y1 - y0) * k + j;
    pixLine(ctx, px, py, nx, ny, c); px = nx; py = ny;
  }
}

export function pixLine(ctx, x0, y0, x1, y1, c) {
  ctx.fillStyle = c;
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, n = 0;
  while (n++ < 600) {
    ctx.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
export function pixCircle(ctx, cx, cy, r, c, dash = 0) {
  if (r <= 0) return;
  ctx.fillStyle = c;
  const n = Math.max(12, Math.round(r * 6.3));
  for (let i = 0; i < n; i++) {
    if (dash && (i / dash | 0) % 2) continue;
    const a = i / n * Math.PI * 2;
    ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1);
  }
}
