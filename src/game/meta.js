// Progresso salvo entre partidas
import { load, save } from '../engine/platform.js';
import { setMuted } from '../engine/audio.js';

const KEY = 'ultimoposto.save.v2'; // trocar a versão zera o progresso de todos
export const meta = {
  coins: 0, best: 0, runs: 0, muted: false, tutorial: false,
  unlocked: 1, cleared: {}, bestEndless: 0,
  up: { hp: 0, dmg: 0, drone: 0, coin: 0, reroll: 0 },
};

export const META_COSTS = {
  hp: [120, 300, 650],
  dmg: [100, 220, 450, 800, 1300],
  drone: [400, 1200],
  coin: [150, 400, 900],
  reroll: [250, 700],
};

export async function loadMeta() {
  const d = await load(KEY, null);
  if (d) Object.assign(meta, d, { up: { ...meta.up, ...(d.up || {}) } });
  setMuted(meta.muted);
}
export const saveMeta = () => save(KEY, meta);

// Zera progresso (mantém som e tutorial)
export function resetMeta() {
  Object.assign(meta, { coins: 0, best: 0, runs: 0, unlocked: 1, cleared: {}, bestEndless: 0, up: { hp: 0, dmg: 0, drone: 0, coin: 0, reroll: 0 } });
  return saveMeta();
}
