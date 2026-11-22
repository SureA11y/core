'use strict';
const fs = require('fs'); const zlib = require('zlib'); const { execFileSync } = require('child_process');
const { chromium } = require('/home/user/core-r11/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const b of ['v117', 'r8', 'r11']) {
    const src = fs.readFileSync(`/home/user/core-${b}/surea11y.browser.js`, 'utf8');
    const t = [];
    for (let i = 0; i < 7; i++) {
      const p = await browser.newPage();
      await p.setContent('<!doctype html><title>x</title><p>x');
      t.push(await p.evaluate((s) => { const el = document.createElement('script'); el.textContent = s; const t0 = performance.now(); document.head.appendChild(el); return performance.now() - t0; }, src));
      await p.close();
    }
    t.sort((a, c) => a - c);
    const req = [];
    for (let i = 0; i < 5; i++) req.push(+execFileSync('node', ['-e', `const t=process.hrtime.bigint();require('/home/user/core-${b}/src/index.js');console.log(Number(process.hrtime.bigint()-t)/1e6)`]).toString());
    req.sort((a, c) => a - c);
    const side = fs.readdirSync(`/home/user/core-${b}`).filter((f) => /^surea11y\..*\.js$/.test(f) && f !== 'surea11y.browser.js').map((f) => `${f}=${Math.round(fs.statSync(`/home/user/core-${b}/${f}`).size / 1024)}KB`);
    console.log(`${b} bundle=${(src.length / 1024).toFixed(0)}KB bytes=${Buffer.byteLength(src)} gzip=${(zlib.gzipSync(src).length / 1024).toFixed(0)}KB brotli=${(zlib.brotliCompressSync(src).length / 1024).toFixed(0)}KB parse+run median=${t[3].toFixed(1)}ms (min ${t[0].toFixed(1)}) node require(src/index.js) median=${req[2].toFixed(0)}ms side: ${side.join(' ')}`);
  }
  await browser.close();
})();
