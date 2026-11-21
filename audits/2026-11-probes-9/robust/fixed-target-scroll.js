'use strict';
// A small fixed "back to top" button: target-size-minimum verdict depends on where the page was scrolled.
const { serve, launch, addBundle } = require('./lib');
const body = `<!doctype html><html lang="en"><head><title>t</title><style>
#top{position:fixed;right:16px;bottom:40px;width:20px;height:20px;padding:0;border:0;font-size:10px}
.row{display:flex;justify-content:flex-end;gap:8px;margin:0;padding-right:22px}
.row a{display:inline-block;width:20px;height:20px;font-size:10px}
</style></head><body><main><h1>Long page</h1>
${Array.from({ length: 40 }, (_, i) => `<p style="height:400px">Section ${i}</p>`).join('')}
<div class="row" style="position:relative;top:0">${Array.from({ length: 4 }, (_, i) => `<a href="#p${i}">${i}</a>`).join('')}</div>
<p style="height:16px"></p>
</main><button id="top" aria-label="Back to top">^</button></body></html>`;
(async () => {
  const s = await serve({ '/': { body } });
  const { browser, context } = await launch();
  for (const where of ['top', 'bottom']) {
    const page = await context.newPage();
    await page.goto(s.base + '/');
    if (where === 'bottom') await page.evaluate(() => window.scrollTo(0, document.scrollingElement.scrollHeight));
    await page.waitForTimeout(200);
    await addBundle(page, s.base);
    const r = await page.evaluate(() => {
      const r = window.a11ycore.runa11yCoreInPage(null, null, {}, ['target-size-minimum']);
      const c = r.checksResults[0];
      const env = r.engine && r.engine.environment;
      const rr = (e) => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width)].join(","); };
      return `top=${rr(document.getElementById("top"))} lastLink=${rr(document.querySelector(".row a:last-child"))} scrollY=${Math.round(scrollY)} ${c.outcome} x${c.occurrences.length} [${c.occurrences.map((o) => o.selector + ':' + o.outcome).join(', ')}] env=${JSON.stringify(env).slice(0, 300)}`;
    });
    console.log(where.padEnd(7), r);
    await page.close();
  }
  await browser.close();
  s.close();
})();
