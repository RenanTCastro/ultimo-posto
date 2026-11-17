// Camada de plataforma: save, vibração, barra de status, botão voltar.
// No navegador cai em fallbacks seguros (localStorage, navigator.vibrate).
import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'android' | 'ios' | 'web'

let Preferences = null, Haptics = null, ImpactStyle = null;

export async function initPlatform({ onBack, onPause, onResume } = {}) {
  if (!isNative) {
    document.addEventListener('visibilitychange', () => (document.hidden ? onPause?.() : onResume?.()));
    return;
  }
  try {
    ({ Preferences } = await import('@capacitor/preferences'));
    ({ Haptics, ImpactStyle } = await import('@capacitor/haptics'));
    const { StatusBar } = await import('@capacitor/status-bar');
    await StatusBar.hide().catch(() => {});
    const { App } = await import('@capacitor/app');
    App.addListener('backButton', () => onBack?.());
    App.addListener('pause', () => onPause?.());
    App.addListener('resume', () => onResume?.());
  } catch (e) { console.warn('platform init', e); }
}

export async function load(key, def) {
  try {
    if (Preferences) {
      const { value } = await Preferences.get({ key });
      return value ? JSON.parse(value) : def;
    }
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : def;
  } catch (e) { return def; }
}

export async function save(key, val) {
  try {
    const s = JSON.stringify(val);
    if (Preferences) await Preferences.set({ key, value: s });
    else localStorage.setItem(key, s);
  } catch (e) { /* sem storage disponível: segue em memória */ }
}

export function vibrate(strong = false) {
  try {
    if (Haptics) Haptics.impact({ style: strong ? ImpactStyle.Heavy : ImpactStyle.Light });
    else navigator.vibrate?.(strong ? 40 : 15);
  } catch (e) {}
}

export async function exitApp() {
  if (!isNative) return;
  const { App } = await import('@capacitor/app');
  App.exitApp();
}
