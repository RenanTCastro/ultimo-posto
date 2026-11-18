// Textos do jogo (PT + EN). O idioma segue o do aparelho.
const S = {
  pt: {
    title1: 'SIEGE OF', title2: 'DARKNESS', subtitle: 'SOBREVIVA AS HORDAS',
    play: 'JOGAR', shop: 'MELHORIAS', sound_on: 'SOM: LIGADO', sound_off: 'SOM: DESLIGADO', privacy: 'PRIVACIDADE',
    best: 'RECORDE', coins: 'OURO', hold: 'SEGURE PARA ATIRAR', pulse: 'PULSO',
    score: 'PONTOS', level: 'NV', energy: 'ENERGIA', xp: 'XP',
    levelup: 'SUBIU DE NIVEL!', choose: 'ESCOLHA UMA MELHORIA',
    paused: 'PAUSADO', resume: 'CONTINUAR', menu: 'MENU', quit: 'DESISTIR',
    gameover: 'VOCE CAIU', survived: 'SOBREVIVEU', kills: 'ABATES', earned: 'OURO GANHO',
    revive: 'REVIVER (ANUNCIO)', double: 'DOBRAR (ANUNCIO)', doubled: 'DOBRADO!', cont: 'CONTINUAR',
    newbest: 'NOVO RECORDE!', boss: 'ALERTA: RAINHA!', horde: 'HORDA CHEGANDO!',
    back: 'VOLTAR', buy: 'COMPRAR', max: 'MAX', noad: 'ANUNCIO INDISPONIVEL',
    stages: 'MUNDOS', stage: 'FASE', locked: 'BLOQUEADA', cleared: 'CONCLUIDA', endless: 'SEM FIM',
    endless_desc: 'TODOS OS MONSTROS. SOBREVIVA!', unlock_endless: 'VENCA O MUNDO 5', next: 'PROXIMA FASE',
    victory: 'FASE CONCLUIDA!', boss_in: 'CHEFE', boss_now: 'CHEFE!', bonus: 'BONUS DA FASE',
    reroll: 'TROCAR', reroll_ad: 'TROCAR (ANUNCIO)', powers: 'SEUS PODERES', evos: 'EVOLUCOES',
    world: 'MUNDO', sub_clear: 'CONCLUIDA!', reward: 'ESCOLHA UMA RECOMPENSA', reached: 'CHEGOU EM', best_sub: 'MELHOR', dodged: 'ESQUIVOU!', defense: 'DEFESA', hidden: 'OUTRAS A DESCOBRIR',
    reset: 'ZERAR PROGRESSO', reset_confirm: 'TOQUE DE NOVO P/ ZERAR',
    kit: 'KIT INICIAL', weapon: 'ARMA', passive: 'PASSIVO', evo: 'EVOLUCAO', newtag: 'NOVO!', evolved: 'EVOLUIU!', best_time: 'MELHOR',
  },
  en: {
    title1: 'SIEGE OF', title2: 'DARKNESS', subtitle: 'SURVIVE THE HORDES',
    play: 'PLAY', shop: 'UPGRADES', sound_on: 'SOUND: ON', sound_off: 'SOUND: OFF', privacy: 'PRIVACY',
    best: 'BEST', coins: 'GOLD', hold: 'HOLD TO SHOOT', pulse: 'PULSE',
    score: 'SCORE', level: 'LV', energy: 'ENERGY', xp: 'XP',
    levelup: 'LEVEL UP!', choose: 'CHOOSE AN UPGRADE',
    paused: 'PAUSED', resume: 'RESUME', menu: 'MENU', quit: 'QUIT',
    gameover: 'YOU FELL', survived: 'SURVIVED', kills: 'KILLS', earned: 'GOLD EARNED',
    revive: 'REVIVE (AD)', double: 'DOUBLE (AD)', doubled: 'DOUBLED!', cont: 'CONTINUE',
    newbest: 'NEW BEST!', boss: 'WARNING: QUEEN!', horde: 'HORDE INCOMING!',
    back: 'BACK', buy: 'BUY', max: 'MAX', noad: 'AD UNAVAILABLE',
    stages: 'WORLDS', stage: 'STAGE', locked: 'LOCKED', cleared: 'CLEARED', endless: 'ENDLESS',
    endless_desc: 'EVERY MONSTER. SURVIVE!', unlock_endless: 'BEAT WORLD 5', next: 'NEXT STAGE',
    victory: 'STAGE CLEAR!', boss_in: 'BOSS', boss_now: 'BOSS!', bonus: 'STAGE BONUS',
    reroll: 'REROLL', reroll_ad: 'REROLL (AD)', powers: 'YOUR POWERS', evos: 'EVOLUTIONS',
    world: 'WORLD', sub_clear: 'CLEARED!', reward: 'CHOOSE A REWARD', reached: 'REACHED', best_sub: 'BEST', dodged: 'DODGED!', defense: 'DEFENSE', hidden: 'MORE TO DISCOVER',
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
    dmg: ['VIROTES PESADOS', '+15% DANO DA BESTA'],
    rate: ['RECARGA RAPIDA', '+10% VELOCIDADE DE TIRO'],
    multi: ['TIRO MULTIPLO', '+1 PROJETIL (CADA UM COM 75% DO DANO)'],
    pierce: ['PERFURANTE', 'TIROS ATRAVESSAM +1 INIMIGO'],
    bounce: ['RICOCHETE', 'TIROS QUICAM PARA +1 INIMIGO'],
    crit: ['PONTO FRACO', '+8% CHANCE DE CRITICO'],
    critdmg: ['CRITICO LETAL', '+40% DANO DOS CRITICOS'],
    burn: ['VIROTE EM CHAMAS', 'TIROS QUEIMAM POR 3 SEGUNDOS'],
    frost: ['VIROTE DE GELO', 'TIROS DEIXAM OS MONSTROS LENTOS'],
    exec: ['EXECUCAO', 'MATA NA HORA QUEM TEM POUCA VIDA (6% POR NIVEL)'],
    drone: ['NOVO ORBE', '+1 ORBE ARCANO TE PROTEGE'],
    laser: ['MAGIA ARCANA', 'ORBES: +20% DANO E +10% VELOCIDADE'],
    power: ['ARSENAL', '+12% DANO DE ORBES E ARMAS EXTRAS'],
    saw: ['MACHADOS GIRATORIOS', 'LAMINAS GIRAM AO SEU REDOR'],
    nade: ['FOGO GREGO', 'ARREMESSA FRASCOS DE FOGO NOS GRUPOS'],
    shock: ['AURA ARCANA', 'FERE QUEM CHEGA PERTO (ACERTA ESPECTROS)'],
    mine: ['RUNAS EXPLOSIVAS', 'ESPALHA RUNAS QUE EXPLODEM AO TOQUE'],
    bolt: ['IRA DIVINA', 'UM RAIO CAI EM UM MONSTRO DE TEMPOS EM TEMPOS'],
    hp: ['KIT MEDICO', '+1 CORACAO MAXIMO E CURA 1'],
    regen: ['REGENERACAO', 'RECUPERA 1 CORACAO A CADA POUCO'],
    dodge: ['REFLEXOS', '+8% CHANCE DE ESQUIVAR DE UM GOLPE'],
    thorns: ['ESPINHOS', 'QUEM TE ATACA LEVA DANO'],
    energy: ['BATERIA', 'PULSO CARREGA 35% MAIS RAPIDO'],
    pulse: ['SOBRECARGA', 'PULSO +30% DANO E +15% ALCANCE'],
    xp: ['SABEDORIA', '+12% XP'],
    greed: ['GANANCIA', '+15% OURO NO FIM DA PARTIDA'],
  },
  en: {
    dmg: ['HEAVY BOLTS', '+15% CROSSBOW DAMAGE'],
    rate: ['QUICK RELOAD', '+10% FIRE RATE'],
    multi: ['MULTISHOT', '+1 PROJECTILE (75% DAMAGE EACH)'],
    pierce: ['PIERCING', 'SHOTS PASS +1 ENEMY'],
    bounce: ['RICOCHET', 'SHOTS BOUNCE TO +1 ENEMY'],
    crit: ['WEAK SPOT', '+8% CRIT CHANCE'],
    critdmg: ['LETHAL CRIT', '+40% CRIT DAMAGE'],
    burn: ['INCENDIARY', 'SHOTS BURN FOR 3 SECONDS'],
    frost: ['FROST ROUNDS', 'SHOTS SLOW MONSTERS'],
    exec: ['EXECUTE', 'INSTANTLY KILLS LOW HP FOES (6% PER LEVEL)'],
    drone: ['NEW ORB', '+1 ARCANE ORB GUARDS YOU'],
    laser: ['ARCANE POWER', 'ORBS: +20% DAMAGE, +10% SPEED'],
    power: ['ARSENAL', '+12% ORB AND WEAPON DAMAGE'],
    saw: ['SPINNING AXES', 'BLADES SPIN AROUND YOU'],
    nade: ['GREEK FIRE', 'THROWS FIRE FLASKS AT GROUPS'],
    shock: ['ARCANE AURA', 'ZAPS ANYTHING CLOSE (HITS SPECTERS)'],
    mine: ['BLAST RUNES', 'DROPS RUNES THAT BLOW ON CONTACT'],
    bolt: ['LIGHTNING', 'A BOLT STRIKES A MONSTER NOW AND THEN'],
    hp: ['MEDKIT', '+1 MAX HEART AND HEAL 1'],
    regen: ['REGENERATION', 'HEAL 1 HEART OVER TIME'],
    dodge: ['REFLEXES', '+8% CHANCE TO DODGE A HIT'],
    thorns: ['THORNS', 'ATTACKERS TAKE DAMAGE'],
    energy: ['BATTERY', 'PULSE CHARGES 35% FASTER'],
    pulse: ['OVERCHARGE', 'PULSE +30% DAMAGE, +15% SIZE'],
    xp: ['WISDOM', '+12% XP'],
    greed: ['GREED', '+15% GOLD AT RUN END'],
  },
}[lang];

// Melhorias permanentes (loja, compradas com sucata)
export const META_UPGRADES = {
  pt: {
    hp: ['CORACAO EXTRA', '+1 CORACAO INICIAL'],
    dmg: ['CALIBRE', '+20% DANO BASE'],
    drone: ['ORBE EXTRA', '+1 ORBE NO INICIO DA PARTIDA'],
    coin: ['SAQUEADOR', '+25% OURO POR PARTIDA'],
    reroll: ['SORTE', '+1 TROCA DE MELHORIA POR PARTIDA'],
  },
  en: {
    hp: ['EXTRA HEART', '+1 STARTING HEART'],
    dmg: ['CALIBER', '+20% BASE DAMAGE'],
    drone: ['EXTRA ORB', '+1 ORB AT RUN START'],
    coin: ['PLUNDERER', '+25% GOLD PER RUN'],
    reroll: ['LUCK', '+1 UPGRADE REROLL PER RUN'],
  },
}[lang];

// Evoluções: combine duas melhorias no nível pedido
export const EVO_TEXT = {
  pt: {
    railgun: ['BALESTRA REAL', 'TIROS ATRAVESSAM TUDO E FAZEM +60% DANO'],
    swarm: ['CORRENTE ARCANA', 'MAGIA DOS ORBES SALTA PARA +2 INIMIGOS'],
    storm: ['TEMPESTADE', 'PULSO AUTOMATICO A CADA 8 SEGUNDOS'],
    nanobots: ['BENCAO', 'CURA 2 E CURA 1 A CADA 15 ABATES'],
    executor: ['EXECUTOR', 'CRITICOS FAZEM +50% DANO E EXPLODEM'],
    cyclone: ['CICLONE', '+3 MACHADOS GIGANTES E MAIS RAPIDOS'],
    carpet: ['CHUVA DE FOGO', 'CADA FRASCO SE PARTE EM 4'],
    inferno: ['INFERNO', 'FOGO MAIS FORTE E SE ESPALHA AO MATAR'],
    zero: ['ZERO ABSOLUTO', 'LENTOS LEVAM +40% DANO E QUASE PARAM'],
    skyfury: ['FURIA DOS CEUS', 'RAIOS CAEM EM 3 ALVOS E PODEM CRITICAR'],
    minefield: ['CIRCULO RUNICO', 'DOBRO DE RUNAS, EXPLOSOES 50% MAIORES'],
  },
  en: {
    railgun: ['ROYAL BALLISTA', 'SHOTS PIERCE EVERYTHING, +60% DAMAGE'],
    swarm: ['ARCANE CHAIN', 'ORB MAGIC CHAINS TO +2 ENEMIES'],
    storm: ['STORM', 'AUTO PULSE EVERY 8 SECONDS'],
    nanobots: ['BLESSING', 'HEAL 2, THEN 1 EVERY 15 KILLS'],
    executor: ['EXECUTIONER', 'CRITS DEAL +50% AND EXPLODE'],
    cyclone: ['CYCLONE', '+3 GIANT, FASTER AXES'],
    carpet: ['FIRE RAIN', 'EACH FLASK SPLITS INTO 4'],
    inferno: ['INFERNO', 'STRONGER FIRE THAT SPREADS ON KILL'],
    zero: ['ABSOLUTE ZERO', 'SLOWED FOES TAKE +40% AND BARELY MOVE'],
    skyfury: ['SKY FURY', 'BOLTS HIT 3 TARGETS AND CAN CRIT'],
    minefield: ['RUNE CIRCLE', 'DOUBLE RUNES, 50% BIGGER BLASTS'],
  },
}[lang];

export const SHORT = {
  pt: { dmg: 'DANO', rate: 'CADENCIA', multi: 'MULTIPLO', pierce: 'PERFURAR', bounce: 'RICOCHETE', crit: 'CRITICO', critdmg: 'CRIT LETAL',
    burn: 'FOGO', frost: 'GELO', exec: 'EXECUCAO', drone: 'ORBES', laser: 'ARCANO', power: 'ARSENAL', saw: 'MACHADOS', nade: 'FOGO GREGO',
    shock: 'AURA', mine: 'RUNAS', bolt: 'IRA DIVINA', hp: 'VIDA', regen: 'REGEN', dodge: 'REFLEXOS', thorns: 'ESPINHOS', energy: 'BATERIA',
    pulse: 'SOBRECARGA', xp: 'SABEDORIA', greed: 'GANANCIA' },
  en: { dmg: 'DAMAGE', rate: 'FIRE RATE', multi: 'MULTI', pierce: 'PIERCE', bounce: 'RICOCHET', crit: 'CRIT', critdmg: 'CRIT DMG',
    burn: 'FIRE', frost: 'FROST', exec: 'EXECUTE', drone: 'ORBS', laser: 'ARCANE', power: 'ARSENAL', saw: 'AXES', nade: 'GREEK FIRE',
    shock: 'AURA', mine: 'RUNES', bolt: 'DIVINE', hp: 'HEALTH', regen: 'REGEN', dodge: 'REFLEXES', thorns: 'THORNS', energy: 'BATTERY',
    pulse: 'OVERCHARGE', xp: 'WISDOM', greed: 'GREED' },
}[lang];

export const STAGE_TEXT = {
  pt: { 1: 'RUINAS DO CASTELO', 2: 'CATACUMBAS', 3: 'CAMPO DE BATALHA', 4: 'FLORESTA SOMBRIA', 5: 'TORRE DO NECROMANTE', endless: 'SEM FIM' },
  en: { 1: 'CASTLE RUINS', 2: 'CATACOMBS', 3: 'BATTLEFIELD', 4: 'DARK FOREST', 5: 'NECROMANCER TOWER', endless: 'ENDLESS' },
}[lang];

export const BOSS_TEXT = {
  pt: { queen: 'RAINHA ARANHA', toad: 'SAPO DO PANTANO', golem: 'GOLEM DE PEDRA', mother: 'BRUXA DO PANTANO', mutant: 'O LICH' },
  en: { queen: 'SPIDER QUEEN', toad: 'SWAMP TOAD', golem: 'STONE GOLEM', mother: 'SWAMP WITCH', mutant: 'THE LICH' },
}[lang];
