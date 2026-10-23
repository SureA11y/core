'use strict';
// Scans with packs in Chromium and stores the results as JSON, for
// 10b-render-stored.js to render in a process that never loads a pack.
const fs = require('fs');
const path = require('path');
const L = require('./lib');
const sample = require(path.join(L.ROOT, 'tests/fixtures/packs/sample.js'));
const { packScript } = L.packApi;
const checklist = L.packApi.definePack({
  name: '@acme/policy', version: '2.0.0', namespace: 'acme', core: '*', title: 'Acme Policy',
  rules: [{ id: 'acme-always-fail', meta: { title: 'Acme always fails', tags: ['acme'], defaultSeverity: 'serious' }, runInPage: (ctx) => ({ outcome: 'fail', occurrences: [{ __node: ctx.document.body, data: { details: { reasonCode: 'ACME' } } }] }) }],
  profiles: { 'acme-policy': { tags: ['wcag2a', 'wcag2aa'], rules: ['acme-always-fail'] } },
  rollups: [{ id: 'acme-item', title: 'Acme item', checksIds: ['acme-always-fail', 'img-alt-present'] }]
});
const HTML = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"><a href="/x"></a></main></body></html>';
(async () => {
  fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
  await L.withBrowser(async (b) => {
    for (const [file, packs, eo] of [
      ['10-sample.json', [sample], { profile: 'sample-1.0' }],
      ['10-checklist.json', [checklist], { profile: 'acme-policy' }],
      ['10-both.json', [sample, checklist], { mappings: ['sample'], optInRules: ['acme', 'sample'] }],
      ['10-sample-compact.json', [sample], { profile: 'sample-1.0', output: { detail: 'findings' } }],
      ['10-sample-compact-fr.json', [sample], { profile: 'sample-1.0', locale: 'fr', output: { detail: 'findings' } }]
    ]) {
      const { page, context } = await L.openPage(b, { html: HTML });
      await page.addScriptTag({ content: L.BUNDLE });
      await page.addScriptTag({ content: packScript(packs) });
      const r = await L.scanInPage(page, packs.map((p) => `${p.name}@${p.version}`), eo);
      await context.close();
      fs.writeFileSync(path.join(__dirname, 'out', file), JSON.stringify(r));
      console.log(file, 'standards:', JSON.stringify(r.standards), 'rollups:', (r.rulesResults || []).filter((x) => x.meta && x.meta.standard).map((x) => x.ruleId + ':' + x.outcome).join(' '));
    }
  });
})();
