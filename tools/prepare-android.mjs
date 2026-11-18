// Gera/ajusta o projeto Android a partir do game.config.js.
// Uso: node tools/prepare-android.mjs   (roda depois de "npx cap add android")
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const cfg = (await import(pathToFileURL(path.join(root, 'game.config.js')).href)).default;
const A = path.join(root, 'android');
if (!fs.existsSync(A)) { console.error('Pasta android/ não existe. Rode: npx cap add android'); process.exit(1); }

const edit = (rel, fn) => {
  const p = path.join(A, rel);
  const before = fs.readFileSync(p, 'utf8');
  const after = fn(before);
  fs.writeFileSync(p, after);
  console.log((before === after ? '= ' : '✔ ') + rel);
};

// 1) AdMob App ID + tela cheia no manifesto
edit('app/src/main/AndroidManifest.xml', s => {
  if (!s.includes('com.google.android.gms.ads.APPLICATION_ID')) {
    s = s.replace('<activity', `<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="@string/admob_app_id"/>\n\n        <activity`);
  }
  s = s.replace(/android:screenOrientation="[^"]*"\s*/g, '');
  s = s.replace('<activity', '<activity\n            android:screenOrientation="portrait"');
  return s;
});

// 2) Strings: nome do app e ID do AdMob
edit('app/src/main/res/values/strings.xml', s => {
  s = s.replace(/<string name="app_name">[^<]*<\/string>/, `<string name="app_name">${cfg.name}</string>`);
  s = s.replace(/<string name="title_activity_main">[^<]*<\/string>/, `<string name="title_activity_main">${cfg.name}</string>`);
  s = s.replace(/\s*<string name="admob_app_id">[^<]*<\/string>/, '');
  return s.replace('</resources>', `    <string name="admob_app_id">${cfg.ads.android.appId}</string>\n</resources>`);
});

// 3) Versão + assinatura de release via variáveis de ambiente (GitHub Secrets)
edit('app/build.gradle', s => {
  s = s.replace(/versionCode \d+/, `versionCode ${cfg.versionCode}`);
  s = s.replace(/versionName "[^"]*"/, `versionName "${cfg.versionName}"`);
  if (!s.includes('signingConfigs')) {
    s = s.replace(/buildTypes \{/, `signingConfigs {
        release {
            if (System.getenv("ANDROID_KEYSTORE_PATH")) {
                storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))
                storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias System.getenv("ANDROID_KEY_ALIAS")
                keyPassword System.getenv("ANDROID_KEY_PASSWORD")
            }
        }
    }
    buildTypes {`);
    s = s.replace(/release \{\s*\n(\s*)minifyEnabled/, m => m.replace('minifyEnabled', 'signingConfig System.getenv("ANDROID_KEYSTORE_PATH") ? signingConfigs.release : null\n            minifyEnabled'));
  }
  return s;
});

// 3b) Imagens de abertura/ícone em WebP (o gerador cria PNGs enormes para cada densidade de tela)
{
  const sharp = (await import('sharp')).default;
  const res = path.join(A, 'app/src/main/res');
  let before = 0, after = 0;
  for (const dir of fs.readdirSync(res)) {
    if (!/^(drawable|mipmap)/.test(dir)) continue;
    for (const f of fs.readdirSync(path.join(res, dir))) {
      if (!f.endsWith('.png')) continue;
      const src = path.join(res, dir, f), dst = src.replace(/\.png$/, '.webp');
      before += fs.statSync(src).size;
      await sharp(src).webp({ quality: 82 }).toFile(dst);
      fs.unlinkSync(src);
      after += fs.statSync(dst).size;
    }
  }
  if (before) console.log(`✔ imagens Android: ${(before / 1048576).toFixed(1)} MB -> ${(after / 1048576).toFixed(1)} MB (WebP)`);
}

// 4) Tema escuro sem barra (fundo igual ao jogo enquanto carrega)
const colors = path.join(A, 'app/src/main/res/values/colors.xml');
if (!fs.existsSync(colors)) fs.writeFileSync(colors, '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="game_bg">#120e16</color>\n</resources>\n');

console.log(`\nPronto: ${cfg.name} (${cfg.appId}) v${cfg.versionName} (${cfg.versionCode}) — anúncios ${cfg.ads.testing ? 'de TESTE' : 'REAIS'}`);
