// Textos do jogo (PT + EN). O idioma segue o do aparelho.
const S = {
  pt: {
    title1: 'ULTIMO', title2: 'POSTO', subtitle: 'SOBREVIVA AS RUINAS',
    play: 'JOGAR', shop: 'MELHORIAS', sound_on: 'SOM: LIGADO', sound_off: 'SOM: DESLIGADO', privacy: 'PRIVACIDADE',
    best: 'RECORDE', coins: 'SUCATA', hold: 'SEGURE PARA ATIRAR', pulse: 'PULSO',
    score: 'PONTOS', level: 'NV', energy: 'ENERGIA', xp: 'XP',
    levelup: 'SUBIU DE NIVEL!', choose: 'ESCOLHA UMA MELHORIA',
    paused: 'PAUSADO', resume: 'CONTINUAR', menu: 'MENU', quit: 'DESISTIR',
    gameover: 'VOCE CAIU', survived: 'SOBREVIVEU', kills: 'ABATES', earned: 'SUCATA GANHA',
    revive: 'REVIVER (ANUNCIO)', double: 'DOBRAR (ANUNCIO)', doubled: 'DOBRADO!', cont: 'CONTINUAR',
    newbest: 'NOVO RECORDE!', boss: 'ALERTA: RAINHA!', horde: 'HORDA CHEGANDO!',
    back: 'VOLTAR', buy: 'COMPRAR', max: 'MAX', noad: 'ANUNCIO INDISPONIVEL',
    stages: 'FASES', stage: 'FASE', locked: 'BLOQUEADA', cleared: 'CONCLUIDA', endless: 'SEM FIM',
    endless_desc: 'TODOS OS MONSTROS. SOBREVIVA!', unlock_endless: 'VENCA A FASE 5', next: 'PROXIMA FASE',
    victory: 'FASE CONCLUIDA!', boss_in: 'CHEFE', boss_now: 'CHEFE!', bonus: 'BONUS DA FASE',
    reroll: 'TROCAR', reroll_ad: 'TROCAR (ANUNCIO)', powers: 'SEUS PODERES', evos: 'EVOLUCOES',
    reset: 'ZERAR PROGRESSO', reset_confirm: 'TOQUE DE NOVO P/ ZERAR',
    kit: 'KIT INICIAL', weapon: 'ARMA', passive: 'PASSIVO', evo: 'EVOLUCAO', newtag: 'NOVO!', evolved: 'EVOLUIU!', best_time: 'MELHOR',
  },
  en: {
    title1: 'LAST', title2: 'OUTPOST', subtitle: 'SURVIVE THE RUINS',
    play: 'PLAY', shop: 'UPGRADES', sound_on: 'SOUND: ON', sound_off: 'SOUND: OFF', privacy: 'PRIVACY',
    best: 'BEST', coins: 'SCRAP', hold: 'HOLD TO SHOOT', pulse: 'PULSE',
    score: 'SCORE', level: 'LV', energy: 'ENERGY', xp: 'XP',
    levelup: 'LEVEL UP!', choose: 'CHOOSE AN UPGRADE',
    paused: 'PAUSED', resume: 'RESUME', menu: 'MENU', quit: 'QUIT',
    gameover: 'YOU FELL', survived: 'SURVIVED', kills: 'KILLS', earned: 'SCRAP EARNED',
    revive: 'REVIVE (AD)', double: 'DOUBLE (AD)', doubled: 'DOUBLED!', cont: 'CONTINUE',
    newbest: 'NEW BEST!', boss: 'WARNING: QUEEN!', horde: 'HORDE INCOMING!',
    back: 'BACK', buy: 'BUY', max: 'MAX', noad: 'AD UNAVAILABLE',
    stages: 'STAGES', stage: 'STAGE', locked: 'LOCKED', cleared: 'CLEARED', endless: 'ENDLESS',
    endless_desc: 'EVERY MONSTER. SURVIVE!', unlock_endless: 'BEAT STAGE 5', next: 'NEXT STAGE',
    victory: 'STAGE CLEAR!', boss_in: 'BOSS', boss_now: 'BOSS!', bonus: 'STAGE BONUS',
    reroll: 'REROLL', reroll_ad: 'REROLL (AD)', powers: 'YOUR POWERS', evos: 'EVOLUTIONS',
    reset: 'RESET PROGRESS', reset_confirm: 'TAP AGAIN TO RESET',
    kit: 'STARTER KIT', weapon: 'WEAPON', passive: 'PASSIVE', evo: 'EVOLUTION', newtag: 'NEW!', evolved: 'EVOLVED!', best_time: 'BEST',
  },
};
const lang = (navigator.language || 'pt').toLowerCase().startsWith('pt') ? 'pt' : 'en';
export const t = k => S[lang][k] ?? k;
export const LANG = lang;

// Melhorias durante a partida (escolha 1 de 3 ao subir de nível)
export const RUN_UPGRADES = {
  pt: {
    dmg: ['MUNICAO PESADA', '+1 DE DANO POR TIRO'],
    rate: ['GATILHO RAPIDO', '+10% CADENCIA DE TIRO'],
    multi: ['TIRO DUPLO', '+1 PROJETIL POR DISPARO'],
    pierce: ['PERFURANTE', 'TIROS ATRAVESSAM +1 INIMIGO'],
    drone: ['NOVO DRONE', 'UM DRONE LASER TE PROTEGE'],
    laser: ['LASER TURBINADO', 'DRONES: +DANO E +VELOCIDADE'],
    hp: ['KIT MEDICO', '+1 CORACAO MAXIMO E CURA'],
    regen: ['REGENERACAO', 'RECUPERA 1 CORACAO A CADA POUCO'],
    crit: ['PONTO FRACO', '+12% CHANCE DE CRITICO'],
    energy: ['BATERIA', 'PULSO CARREGA 35% MAIS RAPIDO'],
    saw: ['SERRAS ORBITAIS', 'LAMINAS GIRAM AO SEU REDOR'],
    nade: ['GRANADAS', 'LANCA GRANADAS NOS GRUPOS'],
    shock: ['CAMPO DE CHOQUE', 'ELETRIFICA QUEM CHEGA PERTO (ACERTA ESPECTROS)'],
  },
  en: {
    dmg: ['HEAVY AMMO', '+1 DAMAGE PER SHOT'],
    rate: ['HAIR TRIGGER', '+10% FIRE RATE'],
    multi: ['DOUBLE SHOT', '+1 PROJECTILE PER SHOT'],
    pierce: ['PIERCING', 'SHOTS PASS +1 ENEMY'],
    drone: ['NEW DRONE', 'A LASER DRONE GUARDS YOU'],
    laser: ['LASER BOOST', 'DRONES: +DAMAGE +SPEED'],
    hp: ['MEDKIT', '+1 MAX HEART AND HEAL'],
    regen: ['REGENERATION', 'HEAL 1 HEART OVER TIME'],
    crit: ['WEAK SPOT', '+12% CRIT CHANCE'],
    energy: ['BATTERY', 'PULSE CHARGES 35% FASTER'],
    saw: ['ORBITAL SAWS', 'BLADES SPIN AROUND YOU'],
    nade: ['GRENADES', 'THROWS GRENADES AT GROUPS'],
    shock: ['SHOCK FIELD', 'ZAPS ANYTHING CLOSE (HITS SPECTERS)'],
  },
}[lang];

// Melhorias permanentes (loja, compradas com sucata)
export const META_UPGRADES = {
  pt: {
    hp: ['CORACAO EXTRA', '+1 CORACAO INICIAL'],
    dmg: ['CALIBRE', '+20% DANO BASE'],
    drone: ['DRONE EXTRA', '+1 DRONE NO INICIO DA PARTIDA'],
    coin: ['CATADOR', '+25% SUCATA POR PARTIDA'],
    reroll: ['SORTE', '+1 TROCA DE MELHORIA POR PARTIDA'],
  },
  en: {
    hp: ['EXTRA HEART', '+1 STARTING HEART'],
    dmg: ['CALIBER', '+20% BASE DAMAGE'],
    drone: ['EXTRA DRONE', '+1 DRONE AT RUN START'],
    coin: ['SCAVENGER', '+25% SCRAP PER RUN'],
    reroll: ['LUCK', '+1 UPGRADE REROLL PER RUN'],
  },
}[lang];

// Evoluções: combine duas melhorias no nível pedido
export const EVO_TEXT = {
  pt: {
    railgun: ['CANHAO DE TRILHOS', 'TIROS ATRAVESSAM TUDO COM DANO DOBRADO'],
    swarm: ['ENXAME', 'LASER DOS DRONES RICOCHETEIA EM +2 INIMIGOS'],
    storm: ['TEMPESTADE', 'PULSO AUTOMATICO A CADA 8 SEGUNDOS'],
    nanobots: ['NANOBOTS', '+2 CORACOES E CURA 1 A CADA 15 ABATES'],
    executor: ['EXECUTOR', 'CRITICOS FAZEM 4X DANO E EXPLODEM'],
    cyclone: ['CICLONE', '+3 SERRAS GIGANTES E MAIS RAPIDAS'],
    carpet: ['BOMBARDEIO', 'CADA GRANADA SOLTA 4 BOMBINHAS'],
  },
  en: {
    railgun: ['RAILGUN', 'SHOTS PIERCE EVERYTHING, DOUBLE DAMAGE'],
    swarm: ['SWARM', 'DRONE LASERS CHAIN TO +2 ENEMIES'],
    storm: ['STORM', 'AUTO PULSE EVERY 8 SECONDS'],
    nanobots: ['NANOBOTS', '+2 HEARTS, HEAL 1 EVERY 15 KILLS'],
    executor: ['EXECUTIONER', 'CRITS DEAL 4X AND EXPLODE'],
    cyclone: ['CYCLONE', '+3 GIANT, FASTER SAWS'],
    carpet: ['CARPET BOMB', 'EACH GRENADE DROPS 4 BOMBLETS'],
  },
}[lang];

export const SHORT = {
  pt: { dmg: 'DANO', rate: 'CADENCIA', multi: 'TIRO DUPLO', pierce: 'PERFURAR', drone: 'DRONES', laser: 'LASER', hp: 'VIDA', regen: 'REGEN', crit: 'CRITICO', energy: 'BATERIA', saw: 'SERRAS', nade: 'GRANADAS', shock: 'CHOQUE' },
  en: { dmg: 'DAMAGE', rate: 'FIRE RATE', multi: 'MULTISHOT', pierce: 'PIERCE', drone: 'DRONES', laser: 'LASER', hp: 'HEALTH', regen: 'REGEN', crit: 'CRIT', energy: 'BATTERY', saw: 'SAWS', nade: 'GRENADES', shock: 'SHOCK' },
}[lang];

export const STAGE_TEXT = {
  pt: { 1: 'RUINAS', 2: 'ESGOTO', 3: 'FERRO-VELHO', 4: 'FLORESTA TOXICA', 5: 'LABORATORIO X', endless: 'SEM FIM' },
  en: { 1: 'RUINS', 2: 'SEWERS', 3: 'JUNKYARD', 4: 'TOXIC FOREST', 5: 'LAB X', endless: 'ENDLESS' },
}[lang];

export const BOSS_TEXT = {
  pt: { queen: 'RAINHA ARANHA', toad: 'SAPO DO ESGOTO', golem: 'GOLEM DE SUCATA', mother: 'MAE FUNGO', mutant: 'MUTANTE X' },
  en: { queen: 'SPIDER QUEEN', toad: 'SEWER TOAD', golem: 'SCRAP GOLEM', mother: 'FUNGUS MOTHER', mutant: 'MUTANT X' },
}[lang];
