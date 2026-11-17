import sys, asyncio
from playwright.async_api import async_playwright
async def main(url, out, w, h, wait, actions):
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page(viewport={'width': w, 'height': h})
        logs=[]
        pg.on('console', lambda m: logs.append(m.type+': '+m.text))
        pg.on('pageerror', lambda e: logs.append('ERR: '+str(e)))
        await pg.goto(url)
        await pg.wait_for_timeout(wait)
        if actions: await pg.evaluate(actions); await pg.wait_for_timeout(wait)
        await pg.screenshot(path=out)
        print('\n'.join(logs[:30]))
        await b.close()
a=sys.argv
asyncio.run(main(a[1], a[2], int(a[3]), int(a[4]), int(a[5]), a[6] if len(a)>6 else None))
