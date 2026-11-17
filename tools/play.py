import sys, asyncio
from playwright.async_api import async_playwright
async def main(url):
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1)
        logs=[]
        pg.on('console', lambda m: logs.append(m.type+': '+m.text) if m.type in ('error','warning') else None)
        pg.on('pageerror', lambda e: logs.append('ERR: '+str(e)))
        await pg.goto(url); await pg.wait_for_timeout(1500)
        await pg.screenshot(path='/tmp/s1_menu.png')
        # JOGAR: find button roughly -> click center area of play button
        H = await pg.evaluate("Math.round(216*844/390)")
        await pg.mouse.click(195, (H-  (60*216/390+4) - 92 + 11)*390/216)
        await pg.wait_for_timeout(800)
        await pg.mouse.move(195, 200); await pg.mouse.down()
        for i in range(60):
            await pg.mouse.move(195+150*__import__('math').cos(i/5), 422+300*__import__('math').sin(i/5))
            await pg.wait_for_timeout(250)
        await pg.screenshot(path='/tmp/s2_play.png')
        await pg.mouse.up()
        await pg.wait_for_timeout(16000)
        await pg.screenshot(path='/tmp/s3_later.png')
        print('\n'.join(logs[:30]))
        await b.close()
asyncio.run(main(sys.argv[1]))
