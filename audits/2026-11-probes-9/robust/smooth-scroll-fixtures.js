'use strict';
// For each fixture: html{scroll-behavior:smooth}, scrolled to 40%, text-spacing-content-loss only:
// does the page keep its scroll position?
const fs = require('fs');
const path = require('path');
const { serve, launch, addBundle } = require('./lib');
const DIR = '/home/user/core-r9/tests/fixtures';
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.html'));
(async () => {
  const pages = {};
  for (const f of files) pages['/' + f] = { body: fs.readFileSync(path.join(DIR, f), 'utf8').replace(/<head>/i, '<head><style>html{scroll-behavior:smooth}</style>') };
  const s = await serve(pages);
  const { browser, context } = await launch();
  let n = 0;
  for (const f of files) {
    const page = await context.newPage();
    await page.goto(s.base + '/' + f);
    const scrollable = await page.evaluate(() => { window.scrollTo({ top: Math.round((document.scrollingElement.scrollHeight - innerHeight) * 0.6), behavior: 'instant' }); return scrollY; });
    if (!scrollable) { await page.close(); continue; }
    await page.waitForTimeout(100);
    await addBundle(page, s.base);
    const r = await page.evaluate(() => { const y0 = scrollY; window.a11ycore.runa11yCoreInPage(null, null, {}, ['text-spacing-content-loss']); return { y0, y1: scrollY }; });
    await page.waitForTimeout(1200);
    const y2 = await page.evaluate(() => scrollY);
    if (r.y0 !== r.y1 || r.y0 !== y2) { n++; console.log(f, `before=${r.y0} right-after=${r.y1} 1.2s-later=${y2}`); }
    await page.close();
  }
  console.log('changed:', n);
  await browser.close();
  s.close();
})();
