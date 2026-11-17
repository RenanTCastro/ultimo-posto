// Sons sintetizados (sem arquivos) + trilha procedural simples.
let ac = null, master = null, sfxBus = null, musicBus = null;
let muted = false, musicTimer = null, step = 0, nextTime = 0;

export function unlockAudio() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(ac.destination);
    sfxBus = ac.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(master);
    musicBus = ac.createGain(); musicBus.gain.value = 0.22; musicBus.connect(master);
  } catch (e) { ac = null; return; }
  if (pending) { const [b, th] = pending; pending = null; startMusic(b, th); }
}

export function setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.8; }
export function suspendAudio() { if (ac && ac.state === 'running') ac.suspend(); }
export function resumeAudio() { if (ac && ac.state === 'suspended') ac.resume(); }

let noiseBuf = null;
function noise() {
  if (!noiseBuf) {
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = ac.createBufferSource(); s.buffer = noiseBuf; return s;
}

function tone({ type = 'square', f0 = 440, f1 = f0, dur = 0.1, vol = 0.3, at = 0, bus = sfxBus }) {
  if (!ac) return;
  const t = ac.currentTime + at;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.02);
}

function burst({ dur = 0.2, vol = 0.4, freq = 1200, q = 1, at = 0, type = 'lowpass', f1 }) {
  if (!ac) return;
  const t = ac.currentTime + at;
  const s = noise(), f = ac.createBiquadFilter(), g = ac.createGain();
  f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
  if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t); s.stop(t + dur);
}

const last = {};
function throttle(k, ms) {
  const n = performance.now();
  if (last[k] && n - last[k] < ms) return false;
  last[k] = n; return true;
}

export const sfx = {
  shoot() { if (throttle('shoot', 45)) { tone({ f0: 900, f1: 220, dur: 0.07, vol: 0.12 }); burst({ dur: 0.05, vol: 0.08, freq: 3000, type: 'highpass' }); } },
  laser() { if (throttle('laser', 60)) tone({ type: 'sawtooth', f0: 1800, f1: 600, dur: 0.09, vol: 0.06 }); },
  hit() { if (throttle('hit', 30)) burst({ dur: 0.06, vol: 0.18, freq: 1800, q: 2, type: 'bandpass' }); },
  kill() { if (throttle('kill', 40)) { burst({ dur: 0.22, vol: 0.3, freq: 900, f1: 120 }); tone({ type: 'triangle', f0: 180, f1: 50, dur: 0.18, vol: 0.2 }); } },
  hurt() { tone({ type: 'square', f0: 160, f1: 60, dur: 0.25, vol: 0.25 }); burst({ dur: 0.15, vol: 0.25, freq: 500 }); },
  pickup() { if (throttle('pick', 35)) tone({ type: 'sine', f0: 880 + Math.random() * 200, f1: 1600, dur: 0.06, vol: 0.08 }); },
  level() { [523, 659, 784, 1046].forEach((f, i) => tone({ type: 'square', f0: f, dur: 0.12, vol: 0.12, at: i * 0.07 })); },
  pulse() { tone({ type: 'sawtooth', f0: 80, f1: 900, dur: 0.35, vol: 0.2 }); burst({ dur: 0.5, vol: 0.4, freq: 4000, f1: 100 }); },
  click() { tone({ type: 'square', f0: 660, f1: 880, dur: 0.05, vol: 0.1 }); },
  boss() { [110, 104, 98].forEach((f, i) => tone({ type: 'sawtooth', f0: f, f1: f * 0.9, dur: 0.35, vol: 0.2, at: i * 0.3 })); },
  coin() { tone({ type: 'square', f0: 988, dur: 0.06, vol: 0.1 }); tone({ type: 'square', f0: 1318, dur: 0.12, vol: 0.1, at: 0.06 }); },
};

// Trilhas procedurais. 'game' = combate; 'menu' = tema calmo e sombrio da tela inicial.
const BASS = [55, 0, 55, 0, 65.4, 0, 55, 0, 49, 0, 49, 0, 58.3, 0, 61.7, 0];
const LEAD = [0, 0, 0, 0, 220, 0, 0, 0, 0, 0, 196, 0, 0, 233, 0, 0];
// Menu: Lá menor - Fá - Dó - Mi (raiz grave + notas do acorde)
const MENU_CHORDS = [
  [110, 220, 261.6, 329.6], [87.3, 174.6, 220, 261.6], [130.8, 261.6, 329.6, 392], [82.4, 164.8, 207.7, 246.9],
];
const ARP = [0, 1, 2, 3, 2, 1, 2, 1];
const BELL = [659.3, 523.3, 587.3, 493.9];

let current = null, pending = null;

function pad(f, at, dur, vol) {
  const t = ac.currentTime + at;
  for (const det of [-4, 4]) {
    const o = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det;
    lp.type = 'lowpass'; lp.frequency.value = 700;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.35); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(lp); lp.connect(g); g.connect(musicBus); o.start(t); o.stop(t + dur + 0.05);
  }
}

function gameStep(s, bar, at, stepDur) {
  const b = BASS[s] * (bar === 3 ? 0.89 : 1);
  if (b) tone({ type: 'sawtooth', f0: b, dur: stepDur * 1.8, vol: 0.35, at, bus: musicBus });
  if (LEAD[s] && bar % 2 === 1) tone({ type: 'triangle', f0: LEAD[s], dur: stepDur * 2.5, vol: 0.18, at, bus: musicBus });
  if (s % 2 === 0) {
    const t = ac.currentTime + at, n = noise(), f = ac.createBiquadFilter(), g = ac.createGain();
    f.type = 'highpass'; f.frequency.value = 7000;
    g.gain.setValueAtTime(s % 4 === 0 ? 0.12 : 0.05, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    n.connect(f); f.connect(g); g.connect(musicBus); n.start(t); n.stop(t + 0.05);
  }
  if (s === 0 || s === 8) tone({ type: 'sine', f0: 120, f1: 40, dur: 0.15, vol: 0.5, at, bus: musicBus });
}

function menuStep(s, bar, at, stepDur) {
  const ch = MENU_CHORDS[bar];
  if (s === 0) {
    pad(ch[1], at, stepDur * 16, 0.07); pad(ch[2], at, stepDur * 16, 0.06); pad(ch[3], at, stepDur * 16, 0.05);
    tone({ type: 'sine', f0: ch[0], dur: stepDur * 7, vol: 0.45, at, bus: musicBus });
  }
  if (s === 8) tone({ type: 'sine', f0: ch[0], dur: stepDur * 6, vol: 0.3, at, bus: musicBus });
  if (s % 2 === 0) { // arpejo suave uma oitava acima
    const i = ARP[s / 2], f = (i === 3 ? ch[1] * 2 : ch[i + 1]) * 2;
    tone({ type: 'triangle', f0: f, dur: stepDur * 3, vol: 0.07, at, bus: musicBus });
  }
  if (s === 12 && (step / 64 | 0) % 2 === 1) tone({ type: 'sine', f0: BELL[bar], dur: stepDur * 10, vol: 0.12, at, bus: musicBus }); // sino
  if (s === 4 || s === 12) { // batida abafada, bem leve
    const t = ac.currentTime + at, n = noise(), f = ac.createBiquadFilter(), g = ac.createGain();
    f.type = 'bandpass'; f.frequency.value = 2500; f.Q.value = 0.7;
    g.gain.setValueAtTime(0.025, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    n.connect(f); f.connect(g); g.connect(musicBus); n.start(t); n.stop(t + 0.13);
  }
}

// Começa (ou troca) a trilha. Se o áudio ainda não foi liberado pelo 1º toque, fica na fila.
export function startMusic(bpm = 116, theme = 'game') {
  if (!ac) { pending = [bpm, theme]; return; }
  if (current === theme && musicTimer) return;
  stopMusic();
  current = theme; step = 0;
  const stepDur = 60 / bpm / 4;
  const fn = theme === 'menu' ? menuStep : gameStep;
  nextTime = ac.currentTime + 0.05;
  musicTimer = setInterval(() => {
    while (nextTime < ac.currentTime + 0.2) {
      fn(step % 16, (step / 16 | 0) % 4, nextTime - ac.currentTime, stepDur);
      nextTime += stepDur; step++;
    }
  }, 50);
}
export function stopMusic() { clearInterval(musicTimer); musicTimer = null; current = null; pending = null; }
export const musicTheme = () => current;
