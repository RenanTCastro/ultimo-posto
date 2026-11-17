# Bot "humano bom": mira perfeita no inimigo mais próximo, reação ~150ms, escolhe upgrade aleatório.
import sys, asyncio
from playwright.async_api import async_playwright
JS = """
window.__bot = setInterval(()=>{const s=window.__getScene(), I=window.__input; if(!s.enemies) return;
 if(s.state==='levelup'){ const c=s.cards[Math.random()*s.cards.length|0]; c.onTap(); return; }
 if(s.state!=='play') return;
 if(s.energy>=100 && s.enemies.filter(e=>Math.hypot(e.x-s.cx,e.y-s.cy)<60).length>=4) s.pulse();
 let b=null,bd=1e9; for(const e of s.enemies){const d=Math.hypot(e.x-s.cx,e.y-s.cy)-(e.T.kamikaze?20:0); if(d<bd){bd=d;b=e}}
 if(b){ I.x=b.x; I.y=b.y; I.down=true; I.consumed=false; } }, 150);
"""
async def main(url, secs):
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg = await br.new_page(viewport={'width': 390, 'height': 844})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(url); await pg.wait_for_timeout(1000)
        await pg.evaluate("window.__getScene().constructor.name") 
        await pg.evaluate("window.__play()")
        await pg.evaluate(JS)
        for i in range(int(secs/10)):
            await pg.wait_for_timeout(10000)
            st = await pg.evaluate("(()=>{const s=window.__getScene(); return {st:s.state,t:Math.round(s.time),hp:s.hp,lvl:s.level,n:s.enemies.length,kills:s.kills,lv:JSON.stringify(s.lv)}})()")
            print(st)
            if i==6: await pg.screenshot(path='/tmp/bot2_mid.png')
            if st['st']=='over': break
        await pg.screenshot(path='/tmp/bot2_end.png')
        print(errs)
        await br.close()
asyncio.run(main(sys.argv[1], float(sys.argv[2])))
