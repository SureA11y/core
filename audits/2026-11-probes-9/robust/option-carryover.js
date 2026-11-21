'use strict';
// Does one scan's options carry over into the next scan in the same page (shared caches)?
// For each option set X: fresh page scan X  vs  (default scan, then X) in one page; and
// default after X vs fresh default.
const fs = require('fs');
const { serve, launch, addBundle, diff } = require('./lib');
const html = fs.readFileSync(__dirname + '/' + (process.argv[2] || 'combined.html'), 'utf8');
const sets = {
  includeHidden: [null, { includeHiddenElements: true }],
  noShadow: [null, { includeShadowDom: false }],
  exclude: [null, { excludeSelectors: ['main', 'section:nth-of-type(odd)'] }],
  context: ['section:nth-of-type(3n)', {}],
  topLevel: [null, { topLevelDocument: true }],
  locale: [null, { locale: 'de' }],
  profile: [null, { profile: 'wcag22-aa' }]
};
(async () => {
  const s = await serve({ '/c': { body: html } });
  const { browser, context } = await launch();
  const scan = (page, ctx, eo) => page.evaluate(([ctx, eo]) => {
    try {
      const r = window.a11ycore.runa11yCoreInPage(null, ctx, eo, null);
      const out = {};
      for (const c of r.checksResults) out[c.ruleId] = c.outcome + ' x' + (c.occurrences || []).length;
      return out;
    } catch (e) { return { THROW: String(e.message).slice(0, 200) }; }
  }, [ctx, eo]);
  const fresh = async (ctx, eo) => {
    const p = await context.newPage();
    await p.goto(s.base + '/c');
    await addBundle(p, s.base);
    const r = await scan(p, ctx, eo);
    await p.close();
    return r;
  };
  const freshDefault = await fresh(null, {});
  for (const [name, [ctx, eo]] of Object.entries(sets)) {
    const freshX = await fresh(ctx, eo);
    const p = await context.newPage();
    await p.goto(s.base + '/c');
    await addBundle(p, s.base);
    await scan(p, null, {});
    const xAfterDefault = await scan(p, ctx, eo);
    const defaultAfterX = await scan(p, null, {});
    await p.close();
    const d1 = diff(freshX, xAfterDefault);
    const d2 = diff(freshDefault, defaultAfterX);
    console.log(name.padEnd(14), 'X after default vs fresh X:', d1.length ? 'DIFF ' + d1.join(' | ') : 'same', ' ; default after X vs fresh default:', d2.length ? 'DIFF ' + d2.join(' | ') : 'same');
  }
  await browser.close();
  s.close();
})();
