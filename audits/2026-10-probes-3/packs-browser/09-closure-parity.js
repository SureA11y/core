'use strict';
// A rule that reads a module-level constant (not self-contained) passes in
// Node with the pack object, as the pack's own tests run it, and gives
// another answer in a page with packScript. Also the warning shown when the
// pack script failed to parse.
const L = require('./lib');
const { packScript } = L.packApi;
const GENERIC = ['click here', 'read more'];
const p = L.pack({
  name: 'cl', namespace: 'cl',
  rules: [L.rule('cl-generic', (ctx) => {
    const links = Array.from(ctx.document.querySelectorAll('a'));
    const bad = links.filter((a) => GENERIC.includes(a.textContent.trim().toLowerCase()));
    return bad.length ? { outcome: 'fail', occurrences: bad.map((a) => ({ __node: a })) } : { outcome: 'pass' };
  })]
});
const HTML = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><a href="/x">click here</a></main></body></html>';
(async () => {
  const node = L.scanNode({ packs: [p] }, { html: HTML });
  const n = node.checksResults.find((c) => c.ruleId === 'cl-generic');
  await L.withBrowser(async (b) => {
    const { page, context } = await L.openPage(b, { html: HTML });
    await page.addScriptTag({ content: L.BUNDLE });
    await page.addScriptTag({ content: packScript([p]) });
    const r = await L.scanInPage(page, ['cl@1.0.0']);
    const c = r.checksResults.find((x) => x.ruleId === 'cl-generic');
    L.log('closure-captured constant', { node: { outcome: n.outcome, error: n.error }, chromium: { outcome: c.outcome, error: c.error } });
    await context.close();

    const bad = L.pack({ name: 'syn', namespace: 'syn', rules: [L.rule('syn-a', new Function('return (ctx = String()) => ({ outcome: "fail", occurrences: [{ __node: ctx.document.body }] })')())] });
    const nodeBad = L.scanNode({ packs: [bad] }, { html: HTML });
    const { page: pg, context: cx, logs } = await L.openPage(b, { html: HTML });
    await pg.addScriptTag({ content: L.BUNDLE });
    const injectError = await pg.addScriptTag({ content: packScript([bad]) }).then(() => null, (e) => e.message);
    const r2 = await L.scanInPage(pg, ['syn@1.0.0']);
    L.log('pack script that does not parse', { node: L.outcome(nodeBad, 'syn-a'), injectError, chromiumPacks: r2.engine.packs || null, chromium: L.outcome(r2, 'syn-a') || null, logs });
    await cx.close();
  });
})();
