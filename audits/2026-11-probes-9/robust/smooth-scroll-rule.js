'use strict';
// Which rule leaves a smooth-scrolling page mid-scroll? Runs single rules on the combined page.
const fs = require('fs');
const { serve, launch, addBundle } = require('./lib');
const combined = fs.readFileSync(__dirname + '/combined.html', 'utf8');
const rules = (process.argv[2] || 'text-spacing-content-loss,focus-not-obscured-minimum,contrast-minimum,contrast-computable,target-size-minimum,css-hidden-focus,aria-hidden-focus,moving-content-pausable,reflow-horizontal-scroll,skip-link').split(',');
(async () => {
  const s = await serve({ '/c': { body: combined.replace('<head>', '<head><style>html{scroll-behavior:smooth}</style>') } });
  const { browser, context } = await launch();
  for (const rule of rules) {
    const page = await context.newPage();
    await page.goto(s.base + '/c');
    await page.evaluate(() => window.scrollTo({ top: Math.round(document.scrollingElement.scrollHeight * 0.4), behavior: 'instant' }));
    await page.waitForTimeout(300);
    await addBundle(page, s.base);
    const r = await page.evaluate((rule) => {
      const y0 = scrollY;
      let ok = true;
      try { window.a11ycore.runa11yCoreInPage(null, null, {}, [rule]); } catch (e) { ok = String(e.message).slice(0, 80); }
      return { y0, y1: scrollY, ok };
    }, rule);
    await page.waitForTimeout(1500);
    const y2 = await page.evaluate(() => scrollY);
    console.log(rule.padEnd(30), `before=${r.y0} right-after=${r.y1} 1.5s-later=${y2}`, r.ok === true ? '' : r.ok, r.y0 === r.y1 && r.y0 === y2 ? 'ok' : 'CHANGED');
    await page.close();
  }
  await browser.close();
  s.close();
})();
