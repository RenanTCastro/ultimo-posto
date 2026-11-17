// Gera capacitor.config.json a partir do game.config.js
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const cfg = (await import(pathToFileURL(path.join(root, 'game.config.js')).href)).default;
const cap = {
  appId: cfg.appId,
  appName: cfg.name,
  webDir: 'dist',
  backgroundColor: '#120e16',
  android: { backgroundColor: '#120e16', allowMixedContent: false },
  ios: { backgroundColor: '#120e16', contentInset: 'never' },
  plugins: {
    StatusBar: { overlaysWebView: true, style: 'DARK', backgroundColor: '#00000000' },
  },
};
fs.writeFileSync(path.join(root, 'capacitor.config.json'), JSON.stringify(cap, null, 2) + '\n');
console.log('✔ capacitor.config.json', cfg.appId);
