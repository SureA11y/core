'use strict';
// No engine: cost of inserting the text-spacing sheet (and removing it) on pages of N broken vs loaded images.
const { serve, launch } = require('./lib');
const css = '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }p { margin-bottom: 2em !important; }';
const mk = (n, src) => `<!doctype html><html lang=en><title>p</title><main>${Array.from({ length: n }, (_, i) => `<div><img ${src(i)} alt="P ${i}"> t${i}</div>`).join('')}</main>`;
(async () => {
  const pages = {};
  for (const n of [2000, 4000, 8000]) {
    pages['/broken' + n] = { body: mk(n, (i) => `src="/i/${i}.png"`) };
    pages['/shadow' + n] = { body: `<!doctype html><html lang=en><title>p</title><main>${Array.from({ length: n }, (_, i) => `<x-c><template shadowrootmode=open><span>in ${i}</span><slot></slot></template>t${i}</x-c>`).join('')}</main>` };
    pages['/inputs' + n] = { body: `<!doctype html><html lang=en><title>p</title><main>${Array.from({ length: n }, (_, i) => `<div><input aria-label=a${i} value=v${i}></div>`).join('')}</main>` };
    pages['/ok' + n] = { body: mk(n, () => 'src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"') };
  }
  const s = await serve(pages);
  const { browser, context } = await launch();
  for (const p of Object.keys(pages)) {
    const page = await context.newPage();
    await page.goto(s.base + p);
    await page.waitForTimeout(500);
    const r = await page.evaluate((css) => {
      const t0 = performance.now();
      const st = document.createElement('style');
      st.textContent = css;
      document.head.appendChild(st);
      void document.body.offsetHeight;
      const t1 = performance.now();
      st.remove();
      void document.body.offsetHeight;
      const t2 = performance.now();
      return { insert: Math.round(t1 - t0), remove: Math.round(t2 - t1) };
    }, css);
    console.log(p.padEnd(12), JSON.stringify(r));
    await page.close();
  }
  await browser.close();
  s.close();
})();
