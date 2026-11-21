'use strict';
// A page with html{scroll-behavior:smooth}, scrolled part-way: is its scroll position the same
// after a scan, and are the verdicts the same as without smooth scrolling?
const fs = require('fs');
const { serve, launch, addBundle, diff } = require('./lib');
const combined = fs.readFileSync(__dirname + '/combined.html', 'utf8');
const simple = (smooth) => `<!doctype html><html lang="en"><head><title>t</title><style>${smooth ? 'html{scroll-behavior:smooth}' : ''}
header{position:sticky;top:0;background:#fff;height:60px} p{margin:0 0 20px;line-height:1.2}</style></head><body><header><a href="/">Home</a></header><main><h1>Long</h1>
${Array.from({ length: 300 }, (_, i) => `<p>Paragraph ${i} with some text that may wrap when spacing grows <a href="#x${i}">link ${i}</a></p>`).join('')}</main></body></html>`;
(async () => {
  const s = await serve({
    '/simple-smooth': { body: simple(true) },
    '/simple-plain': { body: simple(false) },
    '/combined-smooth': { body: combined.replace('<head>', '<head><style>html{scroll-behavior:smooth}</style>') },
    '/combined-plain': { body: combined }
  });
  const { browser, context } = await launch();
  const results = {};
  for (const p of ['/simple-plain', '/simple-smooth', '/combined-plain', '/combined-smooth']) {
    const page = await context.newPage();
    await page.goto(s.base + p);
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = getComputedStyle(document.documentElement).scrollBehavior; window.scrollTo({ top: Math.round(document.scrollingElement.scrollHeight * 0.4), behavior: 'instant' }); });
    await page.waitForTimeout(300);
    await addBundle(page, s.base);
    const r = await page.evaluate(() => {
      const y0 = scrollY;
      const r = window.a11ycore.runa11yCoreInPage(null, null, {}, null);
      const out = {};
      for (const c of r.checksResults) out[c.ruleId] = c.outcome + ' x' + (c.occurrences || []).length;
      return { y0, y1: scrollY, out };
    });
    await page.waitForTimeout(1500);
    const y2 = await page.evaluate(() => scrollY);
    results[p] = r.out;
    console.log(p.padEnd(18), `scrollY before=${r.y0} right after scan=${r.y1} 1.5s later=${y2}`);
    await page.close();
  }
  for (const k of ['simple', 'combined']) {
    const d = diff(results['/' + k + '-plain'], results['/' + k + '-smooth']);
    console.log(k, 'plain vs smooth verdicts:', d.length ? 'DIFF ' + d.join(' | ') : 'same');
  }
  await browser.close();
  s.close();
})();
