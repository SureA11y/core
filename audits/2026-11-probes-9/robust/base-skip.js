'use strict';
// <base href> on another document: "#main" leaves the page. Is it still read as an in-page skip link?
const { serve, launch, addBundle } = require('./lib');
const mk = (head) => `<!doctype html><html lang="en"><head><title>b</title>${head}</head><body>
<header><a href="#main" class="skip">Skip to content</a><nav aria-label="Main">${Array.from({ length: 12 }, (_, i) => `<a href="/n${i}">Nav ${i}</a>`).join(' ')}</nav></header>
<main id="main"><h1>Title</h1><p>Body <a href="#sec">to section</a></p><h2 id="sec">Sec</h2></main></body></html>`;
const pages = {
  '/nobase': { body: mk('') },
  '/base-other': { body: mk('<base href="http://example.invalid/other/">') },
  '/base-same-dir': { body: mk('<base href="/somewhere/else.html">') },
  '/base-self': { body: mk('<base href="/base-self">') }
};
(async () => {
  const s = await serve(pages);
  const { browser, context } = await launch();
  for (const p of Object.keys(pages)) {
    const page = await context.newPage();
    await page.goto(s.base + p);
    await addBundle(page, s.base);
    const r = await page.evaluate(async () => {
      const r = await window.a11ycore.runa11yCoreInPage(null, null, {}, ['skip-link', 'bypass-blocks-present', 'link-name-quality', 'identical-links-same-purpose']);
      return r.checksResults.map((c) => `${c.ruleId}=${c.outcome}x${(c.occurrences || []).length}${(c.occurrences || [])[0] ? ' [' + String((c.occurrences[0].message || '')).slice(0, 90) + ']' : ''}`).join('\n    ') + '\n    resolved href: ' + document.querySelector('.skip').href;
    });
    console.log(p + '\n    ' + r);
    await page.close();
  }
  await browser.close();
  s.close();
})();
