# Bot de balanceamento: mira no mais próximo (reação 150ms), prefere evoluções.
import sys, asyncio, json
from playwright.async_api import async_playwright
JS = """
window.__bot = setInterval(()=>{const s=window.__getScene(), I=window.__input; if(!s.enemies) return;
 if(s.state==='levelup'){ if(s.cardDelay>0) return; const c=s.cards[0]; const ev=s.availableEvos().length; (ev? s.cards[0] : s.cards[Math.random()*s.cards.length|0]).onTap(); return; }
 if(s.state!=='play') return;
 if(s.energy>=100 && s.enemies.filter(e=>Math.hypot(e.x-s.cx,e.y-s.cy)<60).length>=4) s.pulse();
 let b=null,bd=1e9; for(const e of s.enemies){ if(e.ethereal) continue; const d=Math.hypot(e.x-s.cx,e.y-s.cy)-(e.T.kamikaze?20:0)-(e.T.ranged?30:0); if(d<bd){bd=d;b=e}}
 for(const sh of s.eshots){const d=Math.hypot(sh.x-s.cx,sh.y-s.cy); if(d<35 && d<bd){bd=d;b=sh}}
 if(b){ I.x=b.x; I.y=b.y; I.down=true; I.consumed=false; } }, 150);
"""
async def main(url, stage, secs, shots):
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg = await br.new_page(viewport={'width': 390, 'height': 844}, locale='pt-BR')
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(url); await pg.wait_for_timeout(1000)
        await pg.evaluate(f"window.__play({json.dumps(stage)})")
        await pg.evaluate(JS)
        for i in range(int(secs/10)):
            await pg.wait_for_timeout(10000)
            st = await pg.evaluate("(()=>{const s=window.__getScene(); if(!s.lv) return {st:'left'}; return {st:s.state,t:Math.round(s.time),hp:s.hp,lvl:s.level,n:s.enemies.length,k:s.kills,boss:s.boss?Math.round(s.boss.hp):null,evo:Object.keys(s.evo).join(',')}})()")
            print(st, flush=True)
            if i in shots: await pg.screenshot(path=f'/tmp/b3_{stage}_{i}.png')
            if st['st'] in ('over','won','left'): break
        await pg.screenshot(path=f'/tmp/b3_{stage}_end.png')
        print('lv', await pg.evaluate("JSON.stringify(window.__getScene().lv||{})"))
        print(errs[:5]); await br.close()
asyncio.run(main(sys.argv[1], int(sys.argv[2]) if sys.argv[2]!='endless' else 'endless', float(sys.argv[3]), [int(x) for x in sys.argv[4].split(',')] if len(sys.argv)>4 else []))
