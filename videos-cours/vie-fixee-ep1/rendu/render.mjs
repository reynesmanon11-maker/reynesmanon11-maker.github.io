// Rendu image par image : node render.mjs <page.html> <debut_s> <fin_s> <fps> <sortie.mp4>
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { spawn } from 'node:child_process';
const [,, page_, t0s, t1s, fpss, out] = process.argv;
const t0 = +t0s, t1 = +t1s, fps = +fpss;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args:['--disable-gpu'] });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto('file://' + page_ + '#render');
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
const ff = spawn('ffmpeg', ['-loglevel','error','-y','-f','image2pipe','-framerate',String(fps),'-c:v','mjpeg','-i','-',
  '-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-r',String(fps), out], { stdio: ['pipe','inherit','inherit'] });
const OFF = 4;
const n0 = Math.round(t0 * fps), n1 = Math.round(t1 * fps);
for (let n = n0; n < n1; n++) {
  await page.evaluate(t => window.seek(t), n / fps - OFF);
  const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (n % 250 === 0) console.log(out, ((n - n0) / (n1 - n0) * 100).toFixed(1) + '%');
}
ff.stdin.end();
await new Promise(r => ff.on('close', r));
await browser.close();
if (errs.length) { console.error('ERREURS JS', errs.slice(0, 5)); process.exit(2); }
