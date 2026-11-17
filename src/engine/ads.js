// Anúncios: AdMob no celular (banner, intersticial, recompensado + consentimento UMP).
// No navegador mostra anúncios FALSOS para testar o fluxo sem conta.
import { isNative, platform } from './platform.js';

let AdMob = null, E = null, cfg = null;
let ready = false, interstitialLoaded = false, rewardLoaded = false;
let bannerVisible = false, lastInterstitial = 0, gameOvers = 0;
let privacyRequired = false;
export const BANNER_CSS_HEIGHT = 60; // espaço reservado no layout para o banner adaptativo

// IDs oficiais de TESTE do Google — seguros para desenvolvimento.
const TEST = {
  android: { banner: 'ca-app-pub-3940256099942544/9214589741', interstitial: 'ca-app-pub-3940256099942544/1033173712', rewarded: 'ca-app-pub-3940256099942544/5224354917' },
  ios: { banner: 'ca-app-pub-3940256099942544/2435281174', interstitial: 'ca-app-pub-3940256099942544/4411468910', rewarded: 'ca-app-pub-3940256099942544/1712485313' },
};

function ids() {
  const p = platform === 'ios' ? 'ios' : 'android';
  return cfg.testing ? TEST[p] : cfg[p];
}

export async function initAds(config) {
  cfg = config;
  if (!isNative) { ready = true; return; }
  try {
    const mod = await import('@capacitor-community/admob');
    AdMob = mod.AdMob;
    E = { I: mod.InterstitialAdPluginEvents, R: mod.RewardAdPluginEvents, S: mod.AdmobConsentStatus, B: mod.BannerAdPosition, Z: mod.BannerAdSize, P: mod.PrivacyOptionsRequirementStatus };
    await AdMob.initialize({ initializeForTesting: cfg.testing });
    // Consentimento (LGPD/GDPR): obrigatório antes de pedir anúncios
    const info = await AdMob.requestConsentInfo();
    if (info.isConsentFormAvailable && info.status === E.S.REQUIRED) await AdMob.showConsentForm();
    const after = await AdMob.requestConsentInfo();
    privacyRequired = after.privacyOptionsRequirementStatus === E.P.REQUIRED;
    if (platform === 'ios') await AdMob.requestTrackingAuthorization().catch(() => {});
    AdMob.addListener(E.I.Dismissed, () => { interstitialLoaded = false; preloadInterstitial(); });
    AdMob.addListener(E.I.FailedToLoad, () => { interstitialLoaded = false; setTimeout(preloadInterstitial, 30000); });
    AdMob.addListener(E.R.FailedToLoad, () => { rewardLoaded = false; setTimeout(preloadRewarded, 30000); });
    ready = true;
    preloadInterstitial(); preloadRewarded();
  } catch (e) { console.warn('ads init failed', e); }
}

export const needsPrivacyButton = () => privacyRequired;
export async function showPrivacyOptions() { if (AdMob) await AdMob.showPrivacyOptionsForm().catch(() => {}); }

async function preloadInterstitial() {
  if (!AdMob) return;
  try { await AdMob.prepareInterstitial({ adId: ids().interstitial, isTesting: cfg.testing }); interstitialLoaded = true; } catch (e) {}
}
async function preloadRewarded() {
  if (!AdMob) return;
  try { await AdMob.prepareRewardVideoAd({ adId: ids().rewarded, isTesting: cfg.testing }); rewardLoaded = true; } catch (e) {}
}

export async function showBanner() {
  if (!ready || bannerVisible) return;
  bannerVisible = true;
  if (!AdMob) return mockBanner(true);
  try {
    await AdMob.showBanner({ adId: ids().banner, adSize: E.Z.ADAPTIVE_BANNER, position: E.B.BOTTOM_CENTER, margin: 0, isTesting: cfg.testing });
  } catch (e) { bannerVisible = false; }
}
export async function hideBanner() {
  if (!bannerVisible) return;
  bannerVisible = false;
  if (!AdMob) return mockBanner(false);
  try { await AdMob.hideBanner(); } catch (e) {}
}

// Intersticial com frequência controlada (a cada N game overs, respeitando intervalo mínimo)
export async function maybeInterstitial() {
  gameOvers++;
  const now = Date.now();
  if (gameOvers % cfg.interstitialEvery !== 0) return;
  if (now - lastInterstitial < cfg.interstitialCooldownSec * 1000) return;
  lastInterstitial = now;
  if (!AdMob) return mockFullscreen('ANUNCIO INTERSTICIAL (TESTE)', 3, false);
  if (!interstitialLoaded) return;
  try { await AdMob.showInterstitial(); } catch (e) {}
}

export const rewardedAvailable = () => !isNative || rewardLoaded || !!AdMob;

// Retorna true se o jogador ganhou a recompensa
export async function showRewarded() {
  if (!AdMob) return mockFullscreen('ANUNCIO RECOMPENSADO (TESTE)', 4, true);
  if (!rewardLoaded) { await preloadRewarded(); if (!rewardLoaded) return false; }
  try {
    rewardLoaded = false;
    const item = await AdMob.showRewardVideoAd();
    preloadRewarded();
    return !!item;
  } catch (e) { preloadRewarded(); return false; }
}

// ---------- Mocks para o navegador ----------
const ST = 'position:fixed;left:0;right:0;z-index:50;font-family:monospace;color:#e8e2d0;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;';
let bannerEl = null;
function mockBanner(on) {
  if (on && !bannerEl) {
    bannerEl = document.createElement('div');
    bannerEl.style.cssText = ST + `bottom:0;height:${BANNER_CSS_HEIGHT}px;background:#0d1117;border-top:2px solid #6fe3ff;font-size:12px;`;
    bannerEl.textContent = 'BANNER DE TESTE (AdMob aparece aqui no celular)';
    document.body.appendChild(bannerEl);
  } else if (!on && bannerEl) { bannerEl.remove(); bannerEl = null; }
}
function mockFullscreen(title, secs, rewarded) {
  return new Promise(res => {
    const el = document.createElement('div');
    el.style.cssText = ST + 'top:0;bottom:0;background:rgba(8,10,14,.96);gap:14px;font-size:14px;';
    el.innerHTML = `<div style="font-size:16px;color:#6fe3ff">${title}</div><div>Simulação do navegador</div><div id="mc" style="font-size:28px"></div><button id="mx" style="display:none;padding:10px 22px;font:inherit;background:#2b3a48;color:#e8e2d0;border:2px solid #7d98ad">FECHAR</button>${rewarded ? '<button id="mq" style="padding:6px 12px;font:12px monospace;background:none;color:#a99;border:1px solid #544">pular (sem recompensa)</button>' : ''}`;
    document.body.appendChild(el);
    let t = secs;
    const c = el.querySelector('#mc'), x = el.querySelector('#mx'), q = el.querySelector('#mq');
    c.textContent = t;
    const iv = setInterval(() => { t--; c.textContent = t > 0 ? t : (rewarded ? 'RECOMPENSA GANHA!' : ''); if (t <= 0) { clearInterval(iv); x.style.display = 'block'; } }, 1000);
    x.onclick = () => { el.remove(); res(true); };
    if (q) q.onclick = () => { clearInterval(iv); el.remove(); res(false); };
  });
}
