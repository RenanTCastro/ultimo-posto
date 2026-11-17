import config from '../game.config.js';
import { initCore, start, setScene, getScene, input } from './engine/core.js';
import { initPlatform } from './engine/platform.js';
import { initAds } from './engine/ads.js';
import { suspendAudio, resumeAudio } from './engine/audio.js';
import { initArt, MenuScene } from './game/scenes.js';
import { loadMeta } from './game/meta.js';
import { PlayScene } from './game/play.js';

async function boot() {
  initCore(document.getElementById('game'));
  initArt();
  await initPlatform({
    onBack: () => getScene()?.onBack?.(),
    onPause: () => { getScene()?.onAppPause?.(); suspendAudio(); },
    onResume: () => resumeAudio(),
  });
  await loadMeta();
  await initAds(config.ads);
  setScene(new MenuScene());
  start();
  if (import.meta.env.DEV) { window.__getScene = getScene; window.__input = input; window.__play = (id = 1) => setScene(new PlayScene(id)); }
}
boot();
