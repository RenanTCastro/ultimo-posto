import asyncio, base64, os, json, sys
from playwright.async_api import async_playwright
OUT = sys.argv[1]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg = await b.new_page(); await pg.goto('http://127.0.0.1:5173/tools/export-assets.html'); await pg.wait_for_function('window.__out', timeout=60000)
        out = await pg.evaluate('window.__out'); man = {}
        for k, v in out.items():
            path = os.path.join(OUT, 'atual', k); os.makedirs(os.path.dirname(path), exist_ok=True)
            open(path, 'wb').write(base64.b64decode(v['url'].split(',')[1])); man[k] = [v['w'], v['h']]
        json.dump(man, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)
        print(len(out), 'arquivos')
        await b.close()
asyncio.run(main())
