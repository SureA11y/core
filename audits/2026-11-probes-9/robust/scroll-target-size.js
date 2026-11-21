'use strict';
// Which target-size-minimum occurrences appear only when the page is scrolled?
const fs = require('fs');
const { serve, launch, addBundle } = require('./lib');
const html = fs.readFileSync(__dirname + '/' + (process.argv[2] || 'combined.html'), 'utf8');
(async () => {
  const s = await serve({ '/c': { body: html } });
  const { browser, context } = await launch();
  const get = async (frac) => {
    const page = await context.newPage();
    await page.goto(s.base + '/c');
    await page.evaluate((f) => window.scrollTo(0, Math.round((document.scrollingElement.scrollHeight - innerHeight) * f)), frac);
    await page.waitForTimeout(200);
    await addBundle(page, s.base);
    const r = await page.evaluate(() => {
      const r = window.a11ycore.runa11yCoreInPage(null, null, {}, ['target-size-minimum']);
      return r.checksResults[0].occurrences.map((o) => ({ sel: o.selector, html: String(o.html).slice(0, 160), msg: String(o.message).slice(0, 200), fixture: (() => { try { const el = document.querySelector(o.selector); const sec = el && el.closest('section[data-fixture]'); return sec ? sec.dataset.fixture : ''; } catch { return '?'; } })() }));
    });
    await page.close();
    return r;
  };
  const a = await get(0);
  const b = await get(0.5);
  const key = (o) => o.sel + '|' + o.msg;
  const A = new Set(a.map(key));
  const B = new Set(b.map(key));
  for (const o of b) if (!A.has(key(o))) console.log('ONLY SCROLLED:', JSON.stringify(o));
  for (const o of a) if (!B.has(key(o))) console.log('ONLY TOP:', JSON.stringify(o));
  await browser.close();
  s.close();
})();
