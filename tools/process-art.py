# Converte a arte bruta (art_src/, PNGs grandes) para WebP otimizado em src/art/.
# Sprites: 8 px de origem = 1 unidade do jogo; guardamos 6 px por unidade (nítido em celulares).
# Uso: python3 tools/process-art.py
import os, sys, json
from PIL import Image
SRC, DST = 'art_src', 'src/art'
SCALE = {  # fator de redução por pasta/arquivo (1 = mantém)
  'player': .75, 'enemies': .75, 'bosses': .75, 'weapons': .75, 'ui': .75, 'pickups': .75,
  'effects/bolt.png': .5, 'effects/poison.png': .5, 'effects/firebomb.png': .5, 'effects/rune.png': .5, 'effects/explosion': .375,
  'backgrounds/floor': .75, 'backgrounds/prop': .75,
}
SKIP = ('app/', 'enemies/crab_0', 'enemies/crab_1', 'enemies/brute_0', 'enemies/brute_1', 'enemies/bomber_0', 'enemies/bomber_1',
        'enemies/moth_0', 'enemies/moth_1', 'bosses/boss_golem_0', 'bosses/boss_golem_1', 'bosses/boss_mother_0', 'bosses/boss_mother_1',
        'bosses/boss_mutant_0', 'bosses/boss_mutant_1', 'player/player_idle')
def scale_for(rel):
    for k in sorted(SCALE, key=len, reverse=True):
        if rel.startswith(k) or rel.startswith(k.replace('backgrounds/floor', 'backgrounds/').rstrip('/')) and False: return SCALE[k]
    if 'floor' in rel: return SCALE['backgrounds/floor']
    if 'prop' in rel: return SCALE['backgrounds/prop']
    if rel.startswith('effects/explosion'): return SCALE['effects/explosion']
    return SCALE.get(rel, SCALE.get(rel.split('/')[0], 1))
total = 0; man = {}
for root, _, fs in os.walk(SRC):
    for f in sorted(fs):
        if not f.endswith('.png'): continue
        rel = os.path.relpath(os.path.join(root, f), SRC)
        if any(rel.startswith(s) for s in SKIP): continue
        im = Image.open(os.path.join(SRC, rel))
        im = im.convert('RGB' if 'floor' in rel else 'RGBA')
        s = scale_for(rel)
        if s != 1: im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
        out = os.path.join(DST, rel[:-4] + '.webp'); os.makedirs(os.path.dirname(out), exist_ok=True)
        im.save(out, 'WEBP', quality=82, method=6)
        total += os.path.getsize(out); man[rel[:-4]] = im.size
print(len(man), 'imagens,', round(total / 1024), 'KB')

# fundo do menu: recorte em pé da tela de abertura
im = Image.open(os.path.join(SRC, 'app/splash.png')).convert('RGB')
W, H = im.size; cw = int(H * 9 / 19.5); x0 = (W - cw) // 2
im = im.crop((x0, 0, x0 + cw, H)).resize((540, int(540 * H / cw)), Image.LANCZOS)
os.makedirs(os.path.join(DST, 'ui'), exist_ok=True)
im.save(os.path.join(DST, 'ui/menu_bg.webp'), 'WEBP', quality=80, method=6)
print('menu_bg ok')
