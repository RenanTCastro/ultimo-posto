import '@fontsource/cinzel/700.css';
import config from '../game.config.js';
import { initCore, start, setScene, getScene, input } from './engine/core.js';
import { initPlatform } from './engine/platform.js';
import { initAds } from './engine/ads.js';
import { suspendAudio, resumeAudio } from './engine/audio.js';
import { MenuScene } from './game/scenes.js';
import { loadArt } from './game/gfx.js';
import { loadFonts } from './engine/font.js';
import { loadMeta } from './game/meta.js';
import { PlayScene } from './game/play.js';

async function boot() {
  initCore(document.getElementById('game'));
  await Promise.all([loadArt(), loadFonts()]);
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
