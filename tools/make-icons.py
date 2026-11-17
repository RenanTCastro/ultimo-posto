import asyncio, base64, os, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg = await b.new_page(); await pg.goto('http://127.0.0.1:5173/tools/icon.html'); await pg.wait_for_function('window.__out')
        out = await pg.evaluate('window.__out'); os.makedirs('assets', exist_ok=True)
        for k, v in out.items(): open('assets/' + k, 'wb').write(base64.b64decode(v.split(',')[1])); print('assets/' + k)
        await b.close()
asyncio.run(main())
