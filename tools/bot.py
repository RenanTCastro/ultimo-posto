# Bot de teste: mira no inimigo mais próximo, escolhe upgrades, usa pulso.
import sys, asyncio, math
from playwright.async_api import async_playwright
async def main(url, secs, lang):
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, locale=lang)
        pg = await ctx.new_page()
        logs=[]
        pg.on('pageerror', lambda e: logs.append('ERR: '+str(e)))
        await pg.goto(url); await pg.wait_for_timeout(1200)
        k = 390/216
        H = await pg.evaluate("Math.round(216*844/390)")
        await pg.mouse.click(195, (H-(60*216/390+4)-92+11)*k)
        await pg.wait_for_timeout(500)
        shots=0
        for step in range(int(secs*5)):
            st = await pg.evaluate("""(()=>{const s=window.__getScene(); if(!s.enemies) return {state:'menu'};
              let best=null,bd=1e9; for(const e of s.enemies){const d=(e.x-s.cx)**2+(e.y-s.cy)**2; if(d<bd){bd=d;best=e}}
              return {state:s.state,t:s.time,hp:s.hp,lvl:s.level,n:s.enemies.length,energy:s.energy,ex:best?best.x:null,ey:best?best.y:null,cy:s.cy}})()""")
            if st['state']=='levelup':
                await pg.mouse.up(); await pg.mouse.click(195, (st['cy']-62+20)*k); continue
            if st['state']!='play': break
            if st['energy']>=100: await pg.mouse.up(); await pg.mouse.click((216-28)*k,(H-38+19)*k)
            if st['ex'] is not None:
                ang=math.atan2(st['ey']-st['cy'], st['ex']-108); r=min(90, math.hypot(st['ey']-st['cy'], st['ex']-108))
                await pg.mouse.move((108+math.cos(ang)*r)*k, (st['cy']+math.sin(ang)*r)*k)
                if shots==0: await pg.mouse.down(); shots=1
            if step%25==0: print(st)
            if step in (30,45): await pg.screenshot(path=f'/tmp/bot_mid{step}.png')
            await pg.wait_for_timeout(200)
        await pg.mouse.up()
        await pg.wait_for_timeout(1800)
        print('final', await pg.evaluate("(()=>{const s=window.__getScene(); return {state:s.state,t:s.time,score:s.score,kills:s.kills,lvl:s.level}})()"))
        await pg.screenshot(path='/tmp/bot_end.png')
        print('\n'.join(logs))
        await b.close()
asyncio.run(main(sys.argv[1], float(sys.argv[2]), sys.argv[3] if len(sys.argv)>3 else 'pt-BR'))
