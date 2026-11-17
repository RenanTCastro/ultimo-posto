// ============================================================
//  CONTEÚDO DO JOGO — inimigos, fases, melhorias e evoluções.
//  Para criar fases/monstros novos, edite só este arquivo (+ a arte).
// ============================================================

// Comportamentos disponíveis (combináveis):
//  fly        voa (ziguezague leve)         zig       ziguezague forte
//  kamikaze   morre ao encostar             armor     reduz dano de cada golpe
//  ranged     para à distância e cospe      healer    cura monstros próximos
//  dash       prepara e dá um bote          phase     fica intangível de tempos em tempos
//  split      divide ao morrer              explode   explode ao morrer (fere monstros e você)
//  summon     (chefe) invoca lacaios        spray     (chefe) rajada circular de projéteis
// Ajuste global de dificuldade (vida dos monstros)
export const HP_MUL = { mob: 1.6, boss: 1.4 };
export const BASE_DMG = 1; // dano base do tiro do jogador
export const XP_MUL = 0.8; // XP que cada monstro dá (1 = normal)

export const ENEMIES = {
  spider: { hp: 2, speed: 19, r: 8, dmg: 1, score: 10, xp: 1, art: 'spider' },
  bat: { hp: 1.6, speed: 40, r: 6, dmg: 1, score: 8, xp: 1, art: 'bat', fly: true },
  mite: { hp: 1, speed: 33, r: 4, dmg: 1, score: 4, xp: 1, art: 'mite', kamikaze: true },
  brute: { hp: 16, speed: 12, r: 12, dmg: 2, score: 45, xp: 5, art: 'brute' },
  spitter: { hp: 3.5, speed: 15, r: 7, dmg: 1, score: 15, xp: 2, art: 'spitter', ranged: { range: 78, cd: 2.6, speed: 58 } },
  slime: { hp: 5, speed: 14, r: 8, dmg: 1, score: 12, xp: 1, art: 'slime', split: { type: 'slimelet', n: 2 }, goo: ['#2a4a1a', '#4f7430', '#74a040'] },
  slimelet: { hp: 1.2, speed: 27, r: 4, dmg: 1, score: 3, xp: 1, art: 'slimelet', goo: ['#2a4a1a', '#4f7430', '#74a040'] },
  crab: { hp: 6, speed: 13, r: 9, dmg: 1, score: 20, xp: 2, art: 'crab', armor: 0.4 },
  rat: { hp: 2.2, speed: 20, r: 6, dmg: 1, score: 12, xp: 1, art: 'rat', dash: { range: 80, wind: 0.5, speed: 140, cd: 2.5 } },
  ghost: { hp: 3, speed: 16, r: 7, dmg: 1, score: 16, xp: 2, art: 'ghost', fly: true, phase: { on: 2.2, off: 1.4 } },
  moth: { hp: 4, speed: 18, r: 7, dmg: 1, score: 25, xp: 3, art: 'moth', fly: true, healer: { range: 92, radius: 50, amount: 0.3, cd: 2.5 } },
  bomber: { hp: 2, speed: 22, r: 6, dmg: 2, score: 12, xp: 1, art: 'bomber', kamikaze: true, explode: { r: 28, dmg: 6 }, goo: ['#8a3410', '#c85a18', '#ff8a2a'] },
  wasp: { hp: 1, speed: 46, r: 4, dmg: 1, score: 5, xp: 1, art: 'wasp', fly: true, zig: true },

  // Chefes (fim de cada fase)
  queen: { boss: true, hp: 80, speed: 9, r: 18, dmg: 2, score: 500, xp: 30, art: 'boss', summon: { type: 'mite', n: 4, cd: 5 } },
  toad: { boss: true, hp: 110, speed: 7, r: 17, dmg: 2, score: 700, xp: 30, art: 'bossToad', spray: { n: 10, cd: 3.4, speed: 48 }, goo: ['#1b3533', '#3a6862', '#548c82'] },
  golem: { boss: true, hp: 150, speed: 7, r: 19, dmg: 2, score: 900, xp: 30, art: 'bossGolem', armor: 0.5, dash: { range: 150, wind: 0.9, speed: 110, cd: 5 } },
  mother: { boss: true, hp: 140, speed: 6, r: 19, dmg: 2, score: 1100, xp: 30, art: 'bossMother', summon: { type: 'slime', n: 2, cd: 5 }, spray: { n: 8, cd: 4.5, speed: 40 }, goo: ['#3a1a44', '#5e2a6a', '#8a4096'] },
  mutant: { boss: true, hp: 220, speed: 9, r: 18, dmg: 2, score: 1500, xp: 30, art: 'bossMutant', armor: 0.35, dash: { range: 130, wind: 0.7, speed: 120, cd: 4.5 }, spray: { n: 12, cd: 4, speed: 52 }, summon: { type: 'bomber', n: 3, cd: 7 } },
};

// Fases: [segundo em que começa a aparecer, monstro, peso]
export const STAGES = [
  { id: 1, theme: 'ruins', duration: 150, hpMul: 1, spawn: [1.15, 0.27], bpm: 112, boss: 'queen',
    mobs: [[0, 'spider', 6], [0, 'mite', 4], [20, 'bat', 4], [50, 'bomber', 1.5], [70, 'brute', 1.5]], hordes: ['mite', 'bat'] },
  { id: 2, theme: 'sewer', duration: 150, hpMul: 1.5, spawn: [1.0, 0.24], bpm: 118, boss: 'toad',
    mobs: [[0, 'slime', 4], [0, 'spider', 3], [0, 'mite', 2], [20, 'spitter', 3], [45, 'rat', 3], [90, 'brute', 1.5]], hordes: ['slimelet', 'mite'] },
  { id: 3, theme: 'junk', duration: 160, hpMul: 2.1, spawn: [1.05, 0.23], bpm: 124, boss: 'golem',
    mobs: [[0, 'rat', 4], [0, 'crab', 3], [0, 'wasp', 3], [25, 'bomber', 3], [50, 'spitter', 2], [80, 'brute', 2]], hordes: ['wasp', 'rat'] },
  { id: 4, theme: 'toxic', duration: 160, hpMul: 2.8, spawn: [1.0, 0.21], bpm: 128, boss: 'mother',
    mobs: [[0, 'slime', 4], [0, 'wasp', 4], [15, 'moth', 1.5], [30, 'ghost', 3], [55, 'spitter', 3], [85, 'crab', 2]], hordes: ['wasp', 'slimelet'] },
  { id: 5, theme: 'lab', duration: 170, hpMul: 3.6, spawn: [0.95, 0.19], bpm: 134, boss: 'mutant',
    mobs: [[0, 'spider', 3], [0, 'crab', 3], [0, 'bomber', 2], [0, 'wasp', 2], [15, 'ghost', 3], [30, 'rat', 3], [45, 'moth', 1.5], [60, 'spitter', 3], [90, 'brute', 2.5]],
    hordes: ['bomber', 'wasp', 'mite'] },
];
export const ENDLESS = {
  id: 'endless', themes: ['ruins', 'sewer', 'junk', 'toxic', 'lab'], duration: Infinity, bpm: 128,
  bosses: ['queen', 'toad', 'golem', 'mother', 'mutant'], bossEvery: 90,
  mobs: [[0, 'spider', 5], [0, 'mite', 3], [15, 'bat', 3], [25, 'slime', 3], [35, 'rat', 3], [45, 'spitter', 2], [55, 'wasp', 3],
    [65, 'crab', 2], [75, 'bomber', 2], [90, 'ghost', 2], [100, 'moth', 1.2], [110, 'brute', 2]],
  hordes: ['mite', 'wasp', 'slimelet', 'bomber'],
};

// Melhorias da partida. kind: weapon (arma) | passive (passivo)
export const UPGRADES = {
  dmg: { max: 8, kind: 'passive', apply: p => (p.s.dmg += 1) },
  rate: { max: 8, kind: 'passive', apply: p => (p.s.rate *= 1.10) },
  multi: { max: 4, kind: 'passive', apply: p => p.s.multi++ },
  pierce: { max: 3, kind: 'passive', apply: p => p.s.pierce++ },
  drone: { max: 5, kind: 'weapon', apply: p => p.s.drones++ },
  laser: { max: 6, kind: 'passive', apply: p => { p.s.droneDmg += 0.8; p.s.droneRate *= 1.2; } },
  hp: { max: 5, kind: 'passive', apply: p => { p.maxHp++; p.hp = Math.min(p.maxHp, p.hp + 2); } },
  regen: { max: 3, kind: 'passive', apply: p => p.s.regen++ },
  crit: { max: 5, kind: 'passive', apply: p => (p.s.crit += 0.12) },
  energy: { max: 4, kind: 'passive', apply: p => (p.s.energyGain *= 1.35) },
  saw: { max: 5, kind: 'weapon', apply: p => p.s.saw++ },
  nade: { max: 5, kind: 'weapon', apply: p => p.s.nade++ },
  shock: { max: 5, kind: 'weapon', apply: p => p.s.shock++ },
};

// Evoluções: aparecem como carta dourada quando os requisitos são atingidos
export const EVOLUTIONS = {
  railgun: { req: { multi: 3, pierce: 3 } },
  swarm: { req: { drone: 4, laser: 3 } },
  storm: { req: { energy: 3, shock: 3 } },
  nanobots: { req: { hp: 3, regen: 3 }, apply: p => { p.maxHp += 2; p.hp = Math.min(p.maxHp, p.hp + 2); } },
  executor: { req: { dmg: 4, crit: 4 }, apply: p => (p.s.crit += 0.1) },
  cyclone: { req: { saw: 5, rate: 3 } },
  carpet: { req: { nade: 5, multi: 2 } },
};
