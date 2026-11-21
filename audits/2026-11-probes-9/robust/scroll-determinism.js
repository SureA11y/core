'use strict';
// Same page, same viewport, scanned at different scroll positions: same verdicts?
const fs = require('fs');
const { serve, launch, addBundle, scanSummary, diff } = require('./lib');
const file = process.argv[2] || 'combined.html';
const html = fs.readFileSync(__dirname + '/' + file, 'utf8');
(async () => {
  const s = await serve({ '/c': { body: html } });
  const { browser, context } = await launch();
  let base;
  for (const pos of [0, 0.25, 0.5, 1]) {
    const page = await context.newPage();
    await page.goto(s.base + '/c');
    await page.waitForTimeout(300);
    await page.evaluate((f) => window.scrollTo(0, Math.round((document.scrollingElement.scrollHeight - innerHeight) * f)), pos);
    await page.waitForTimeout(300);
    await addBundle(page, s.base);
    const y = await page.evaluate(() => scrollY);
    const r = await scanSummary(page);
    const y2 = await page.evaluate(() => scrollY);
    if (!base) { base = r.out; console.log('scrollY', y, 'baseline'); }
    else { const d = diff(base, r.out); console.log('scrollY', y, '->', y2, d.length ? 'DIFF ' + d.length + '\n   ' + d.join('\n   ') : 'same'); }
    await page.close();
  }
  await browser.close();
  s.close();
})();
