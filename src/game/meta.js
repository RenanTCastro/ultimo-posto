// Progresso salvo entre partidas
import { load, save } from '../engine/platform.js';
import { setMuted } from '../engine/audio.js';

const KEY = 'ultimoposto.save.v2'; // trocar a versão zera o progresso de todos
export const meta = {
  coins: 0, best: 0, runs: 0, muted: false, tutorial: false,
  unlocked: 1, cleared: {}, bestSub: {}, bestEndless: 0,
  up: { hp: 0, dmg: 0, drone: 0, coin: 0, reroll: 0 },
};

export const META_COSTS = {
  hp: [250, 600, 1300],
  dmg: [200, 450, 900, 1600, 2600],
  drone: [800, 2400],
  coin: [300, 800, 1800],
  reroll: [500, 1400],
};

export async function loadMeta() {
  const d = await load(KEY, null);
  if (d) Object.assign(meta, d, { up: { ...meta.up, ...(d.up || {}) } });
  setMuted(meta.muted);
}
export const saveMeta = () => save(KEY, meta);

// Zera progresso (mantém som e tutorial)
export function resetMeta() {
  Object.assign(meta, { coins: 0, best: 0, runs: 0, unlocked: 1, cleared: {}, bestSub: {}, bestEndless: 0, up: { hp: 0, dmg: 0, drone: 0, coin: 0, reroll: 0 } });
  return saveMeta();
}
