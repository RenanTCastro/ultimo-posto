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
export const HP_MUL = { mob: 1.92, boss: 1.68 };
export const BASE_DMG = 1; // dano base do tiro do jogador
export const XP_MUL = 0.65; // XP que cada monstro dá (1 = normal)
export const SCRAP_MUL = 0.5; // sucata ganha por partida (1 = normal)

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

// ============================================================
//  MUNDOS: cada um tem 5 fases seguidas (1-1 ... 1-5) numa corrida contínua.
//  Você mantém nível e melhorias entre as fases; o chefe aparece no fim da 5ª.
//  hp: vida dos monstros no começo da 1ª fase -> fim da 5ª (multiplicador)
//  spawn: intervalo entre levas (segundos) no começo -> fim
//  mobs: [fase em que começa a aparecer, monstro, peso]
// ============================================================
export const SUB_DURATION = [60, 60, 65, 70, 70]; // segundos de cada fase (o chefe vem ao fim da 5ª)

export const STAGES = [
  { id: 1, theme: 'ruins', bpm: 112, boss: 'queen', hp: [1, 2.6], spawn: [1.1, 0.3],
    mobs: [[1, 'spider', 6], [1, 'mite', 4], [2, 'bat', 4], [3, 'bomber', 1.5], [4, 'brute', 1.5], [5, 'spitter', 1.5]], hordes: ['mite', 'bat'] },
  { id: 2, theme: 'sewer', bpm: 118, boss: 'toad', hp: [1.5, 3.8], spawn: [1.0, 0.27],
    mobs: [[1, 'slime', 4], [1, 'spider', 3], [1, 'mite', 2], [2, 'spitter', 3], [3, 'rat', 3], [4, 'brute', 1.5], [5, 'bomber', 2]], hordes: ['slimelet', 'mite'] },
  { id: 3, theme: 'junk', bpm: 124, boss: 'golem', hp: [2.1, 5.3], spawn: [0.95, 0.25],
    mobs: [[1, 'rat', 4], [1, 'crab', 3], [1, 'wasp', 3], [2, 'bomber', 3], [3, 'spitter', 2], [4, 'brute', 2], [5, 'ghost', 2]], hordes: ['wasp', 'rat'] },
  { id: 4, theme: 'toxic', bpm: 128, boss: 'mother', hp: [2.8, 7.2], spawn: [0.9, 0.23],
    mobs: [[1, 'slime', 4], [1, 'wasp', 4], [2, 'moth', 1.5], [2, 'ghost', 3], [3, 'spitter', 3], [4, 'crab', 2], [5, 'brute', 2]], hordes: ['wasp', 'slimelet'] },
  { id: 5, theme: 'lab', bpm: 134, boss: 'mutant', hp: [3.6, 9.5], spawn: [0.85, 0.2],
    mobs: [[1, 'spider', 3], [1, 'crab', 3], [1, 'bomber', 2], [1, 'wasp', 2], [2, 'ghost', 3], [2, 'rat', 3], [3, 'moth', 1.5], [3, 'spitter', 3], [4, 'brute', 2.5], [5, 'slime', 2]],
    hordes: ['bomber', 'wasp', 'mite'] },
];
// Monstros "elite": mais vida e contorno vermelho. Chance cresce a cada fase/mundo.
export const ELITE = { hp: 3.5, speed: 1.1, xp: 4, score: 4, chance: (world, sub) => Math.min(0.2, 0.015 + 0.025 * (sub - 1) + 0.015 * (world - 1)) };

export const ENDLESS = {
  id: 'endless', themes: ['ruins', 'sewer', 'junk', 'toxic', 'lab'], bpm: 128,
  bosses: ['queen', 'toad', 'golem', 'mother', 'mutant'], bossEvery: 90,
  mobs: [[0, 'spider', 5], [0, 'mite', 3], [15, 'bat', 3], [25, 'slime', 3], [35, 'rat', 3], [45, 'spitter', 2], [55, 'wasp', 3],
    [65, 'crab', 2], [75, 'bomber', 2], [90, 'ghost', 2], [100, 'moth', 1.2], [110, 'brute', 2]],
  hordes: ['mite', 'wasp', 'slimelet', 'bomber'],
};

// ============================================================
//  MELHORIAS DA PARTIDA (25). Os números de cada uma ficam em play.js -> recalc().
//  kind: weapon (arma nova) | passive (melhora algo) | defense (sobrevivência)
//  heal: cura ao pegar
// ============================================================
export const UPGRADES = {
  // tiro
  dmg: { max: 6, kind: 'passive' },      // +15% dano do tiro
  rate: { max: 6, kind: 'passive' },     // +10% cadência
  multi: { max: 3, kind: 'passive' },    // +1 projétil (cada um 75% do dano)
  pierce: { max: 3, kind: 'passive' },   // atravessa +1
  bounce: { max: 3, kind: 'passive' },   // ricocheteia +1
  crit: { max: 5, kind: 'passive' },     // +8% chance de crítico
  critdmg: { max: 4, kind: 'passive' },  // +40% dano crítico
  burn: { max: 3, kind: 'passive' },     // tiros queimam
  frost: { max: 3, kind: 'passive' },    // tiros deixam lento
  exec: { max: 3, kind: 'passive' },     // executa quem tem pouca vida
  // drones e armas
  drone: { max: 4, kind: 'weapon' },     // +1 drone
  laser: { max: 5, kind: 'passive' },    // drones +20% dano, +10% velocidade
  power: { max: 5, kind: 'passive' },    // +12% dano de todas as armas extras
  saw: { max: 5, kind: 'weapon' },
  nade: { max: 5, kind: 'weapon' },
  shock: { max: 5, kind: 'weapon' },
  mine: { max: 5, kind: 'weapon' },
  bolt: { max: 5, kind: 'weapon' },
  // sobrevivência e utilidade
  hp: { max: 4, kind: 'defense', heal: 1 },
  regen: { max: 3, kind: 'defense' },
  dodge: { max: 4, kind: 'defense' },    // +8% chance de esquivar
  thorns: { max: 3, kind: 'defense' },   // fere quem te toca
  energy: { max: 4, kind: 'passive' },   // pulso carrega mais rápido
  pulse: { max: 3, kind: 'passive' },    // pulso mais forte e maior
  xp: { max: 4, kind: 'passive' },       // +12% XP
  greed: { max: 3, kind: 'passive' },    // +15% sucata
};

// Evoluções: carta dourada quando os requisitos são atingidos
export const EVOLUTIONS = {
  railgun: { req: { multi: 2, pierce: 3 } },
  swarm: { req: { drone: 2, laser: 3 } },
  storm: { req: { energy: 3, shock: 3 } },
  nanobots: { req: { hp: 3, regen: 3 }, heal: 2 },
  executor: { req: { crit: 4, critdmg: 3 } },
  cyclone: { req: { saw: 5, rate: 3 } },
  carpet: { req: { nade: 5, multi: 2 } },
  inferno: { req: { burn: 3, nade: 3 } },
  zero: { req: { frost: 3, shock: 3 } },
  skyfury: { req: { bolt: 5, crit: 2 } },
  minefield: { req: { mine: 5, pulse: 2 } },
};
