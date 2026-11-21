'use strict';
// Minimal: a page with html{scroll-behavior:smooth} whose paragraphs have a large bottom margin,
// scrolled to the end. text-spacing-content-loss sets p{margin-bottom:2em}, the page gets shorter,
// the scroll position is clamped, and the rule puts it back with a plain scrollTo(x, y), which the
// page's smooth scroll-behavior animates: the scan returns with the page scrolled elsewhere.
const { serve, launch, addBundle } = require('./lib');
const mk = (smooth) => `<!doctype html><html lang="en"><head><title>t</title><style>${smooth ? 'html{scroll-behavior:smooth}' : ''}
p{margin:0 0 120px}</style></head><body><main><h1>Article</h1>
${Array.from({ length: 80 }, (_, i) => `<p>Paragraph ${i}.</p>`).join('')}</main></body></html>`;
(async () => {
  const s = await serve({ '/smooth': { body: mk(true) }, '/plain': { body: mk(false) } });
  const { browser, context } = await launch();
  for (const p of ['/plain', '/smooth']) {
    for (const runOnly of [['text-spacing-content-loss'], null]) {
      const page = await context.newPage();
      await page.goto(s.base + p);
      await page.evaluate(() => window.scrollTo({ top: document.scrollingElement.scrollHeight, behavior: 'instant' }));
      await page.waitForTimeout(200);
      await addBundle(page, s.base);
      const r = await page.evaluate((ro) => { const y0 = scrollY; window.a11ycore.runa11yCoreInPage(null, null, {}, ro); return { y0, y1: scrollY }; }, runOnly);
      await page.waitForTimeout(100);
      const y100 = await page.evaluate(() => scrollY);
      await page.waitForTimeout(1500);
      const y2 = await page.evaluate(() => scrollY);
      console.log(p.padEnd(8), (runOnly ? runOnly[0] : 'full scan').padEnd(26), `scrollY before=${r.y0} when scan returns=${r.y1} +100ms=${y100} +1.6s=${y2}`);
      await page.close();
    }
  }
  await browser.close();
  s.close();
})();
