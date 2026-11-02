import os; os.environ.setdefault("PLAYWRIGHT_BROWSERS_PATH","/workspace/work/pwb")
import asyncio,sys,subprocess,os
from playwright.async_api import async_playwright
# usage: render.py EPDIR stills t1,t2 | full
async def main(ep,mode,arg=None):
    d=os.path.abspath(ep)
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--allow-file-access-from-files'])
        pg=await b.new_page(viewport={'width':1080,'height':1920})
        pg.on('console',lambda m:print('CONSOLE',m.text)); pg.on('pageerror',lambda e:print('ERR',e))
        await pg.goto('file://'+d+'/index.html'); await pg.evaluate('window.ready')
        el=await pg.query_selector('canvas')
        if mode=='cover':
            await pg.evaluate('window.NOSUB=1'); await pg.evaluate(f'draw({arg})'); await el.screenshot(path=d+'/cover_raw.png')
        elif mode=='stills':
            os.makedirs(d+'/stills',exist_ok=True)
            for i,t in enumerate(float(x) for x in arg.split(',')):
                await pg.evaluate(f'draw({t})'); await el.screenshot(path=f'{d}/stills/s{i:02d}.jpg',type='jpeg',quality=85)
        else:
            dur=await pg.evaluate('window.DUR'); fps=30;n=int(dur*fps)
            ff=subprocess.Popen(['ffmpeg','-v','error','-y','-f','image2pipe','-framerate','30','-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','17','-vf','scale=in_range=pc:out_range=tv,format=yuv420p','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709',d+'/video_noaudio.mp4'],stdin=subprocess.PIPE)
            for i in range(n):
                await pg.evaluate(f'draw({i/fps})'); ff.stdin.write(await el.screenshot(type='jpeg',quality=93))
            ff.stdin.close(); ff.wait()
        await b.close()
asyncio.run(main(*sys.argv[1:]))
