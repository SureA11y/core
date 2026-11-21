'use strict';
// focus-not-obscured-* when the page's scrollTo does nothing (scroll lock), or when
// the page undoes the scroll synchronously.
const { serve, launch, addBundle } = require('./lib');

const body = (script) => `<!doctype html><html lang="en"><head><title>t</title><style>
header{position:fixed;top:0;left:0;right:0;height:120px;background:#fff;border-bottom:1px solid #000}
main{padding-top:130px} p{margin:0 0 40px}</style></head><body>
<header><a href="/">Home</a></header><main><h1>Long page</h1>
${Array.from({ length: 60 }, (_, i) => `<p>Paragraph ${i} <a href="#l${i}">link ${i}</a></p>`).join('')}
</main><script>${script}</script></body></html>`;

const variants = {
  plain: '',
  scrollToNoop: 'window.scrollTo=function(){};',
  scrollToNoopAll: 'window.scrollTo=window.scroll=function(){};',
  lockOnScroll: 'const y=0;addEventListener("scroll",()=>{if(scrollY!==y)window.scrollTo({top:y,behavior:"instant"})},true)',
  overflowHiddenRoot: 'document.documentElement.style.overflow="hidden"'
};
(async () => {
  const pages = {};
  for (const [k, v] of Object.entries(variants)) pages['/' + k] = { body: body(v) };
  const s = await serve(pages);
  const { browser, context } = await launch();
  for (const k of Object.keys(variants)) {
    const page = await context.newPage();
    await page.goto(s.base + '/' + k);
    await addBundle(page, s.base);
    const r = await page.evaluate(async () => {
      const r = await window.a11ycore.runa11yCoreInPage(null, null, {}, ['focus-not-obscured-minimum', 'focus-not-obscured-enhanced']);
      return r.checksResults.map((c) => `${c.ruleId}=${c.outcome} x${(c.occurrences || []).length}`).join(' ') + ' scrollY after=' + scrollY;
    });
    console.log(k.padEnd(20), r);
    await page.close();
  }
  await browser.close();
  s.close();
})();
