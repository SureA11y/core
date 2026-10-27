'use strict';
// EN 301 549 with packs: a pack rule mapped to WCAG 1.1.1 (meta.wcagSc) and
// an override of a core rule, under the en301549 profile and with
// mappings: ['en301549'], in Node and in Chromium; then the EN clauses the
// reporters show, and the published table for the clause.
const path = require('path');
const L = require('./lib');
const { packScript } = L.packApi;
const { renderSarifReport } = require(path.join(L.ROOT, 'src/sarif.js'));
const { renderJunitReport } = require(path.join(L.ROOT, 'src/junit.js'));
const en = require(path.join(L.ROOT, 'src/en301549.js'));
const P = L.packApi.definePack({
  name: '@e/p', version: '1.0.0', namespace: 'ee', core: '*',
  overrides: ['img-alt-present'],
  rules: [
    { id: 'ee-img', meta: { title: 'img', tags: ['wcag2a', 'wcag111'], wcagSc: ['1.1.1'] }, runInPage: (ctx) => ({ outcome: 'fail', occurrences: [{ __node: ctx.document.querySelector('img') }] }) },
    { id: 'img-alt-present', runInPage: (ctx) => ({ outcome: 'fail', occurrences: [{ __node: ctx.document.querySelector('img'), data: { details: { reasonCode: 'OVR' } } }] }) },
    { id: 'ee-own-sc', meta: { title: 'own', tags: [], wcagSc: ['9.9.9'] }, runInPage: () => ({ outcome: 'pass' }) }
  ]
});
const HTML = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"></main></body></html>';
const enOf = (c) => ((c && c.meta && c.meta.normativeMappings) || []).filter((m) => m.standard && m.standard !== 'WCAG').map((m) => `${m.standard} ${m.version || ''} ${m.requirement}`);
const pick = (r) => ({
  packs: r.engine.packs, profile: r.engine.profile, standards: r.standards && r.standards.map((s) => s.key),
  eeImg: enOf(r.checksResults.find((c) => c.ruleId === 'ee-img')),
  override: enOf(r.checksResults.find((c) => c.ruleId === 'img-alt-present')),
  ownSc: r.checksResults.find((c) => c.ruleId === 'ee-own-sc') && r.checksResults.find((c) => c.ruleId === 'ee-own-sc').meta.normativeMappings,
  rollup111: (r.rulesResults || []).filter((x) => /1\.1\.1/.test(x.ruleId)).map((x) => `${x.ruleId}:${x.outcome}:${JSON.stringify(x.data.details.checksIds)}`),
  sarifTags: JSON.parse(renderSarifReport(r)).runs[0].tool.driver.rules.filter((x) => /^ee-|img-alt-present/.test(x.id)).map((x) => `${x.id}: ${x.properties.tags.filter((t) => /en301549|wcag/.test(t)).join(',')}`),
  junitEn: [...new Set([...renderJunitReport(r).matchAll(/<property name="en301549" value="([^"]*)"/g)].map((m) => m[1]))].slice(0, 5)
});
(async () => {
  console.log('published clauses for 1.1.1:', JSON.stringify(en.en301549ClausesForSc ? en.en301549ClausesForSc('1.1.1') : null));
  await L.withBrowser(async (b) => {
    for (const eo of [{ profile: 'en301549-v4.1.1' }, { mappings: ['en301549'] }]) {
      const node = pick(L.scanNode({ packs: [P], ...eo }));
      const { page, context } = await L.openPage(b);
      await page.addScriptTag({ content: L.BUNDLE });
      await page.addScriptTag({ content: packScript([P]) });
      const web = pick(await L.scanInPage(page, ['@e/p@1.0.0'], eo));
      await context.close();
      L.log(JSON.stringify(eo), { same: JSON.stringify(node) === JSON.stringify(web), node, chromiumIfDifferent: JSON.stringify(node) === JSON.stringify(web) ? undefined : web });
    }
  });
})();
