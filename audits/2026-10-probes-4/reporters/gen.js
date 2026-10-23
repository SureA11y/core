'use strict';
const fs = require('fs'); const path = require('path');
const C = '/home/user/core';
const { runa11yCoreOnHtml } = require(C + '/src/testing.js');
const FIX = C + '/tests/fixtures';
const sample = require(C + '/tests/fixtures/packs/sample.js');
const files = fs.readdirSync(FIX).filter(f => f.endsWith('.html'));
const custom = {
  id: 'acme-check', meta: { title: 'Acme check', wcagSc: ['1.1.1'], tags: ['wcag2a','wcag111'], helpUrl: 'javascript:alert(1)' },
  runInPage: (ctx) => ({ outcome: 'fail', occurrences: [{ __node: ctx.document.body, summary: 'acme </script><script>window.__pwn=1</script>' }] })
};
const configs = {
  full: {},
  compact: { output: { detail: 'findings' } },
  de: { locale: 'de' }, es: { locale: 'es', output: { detail: 'findings' } }, fr: { locale: 'fr' }, ja: { locale: 'ja', output: { detail: 'findings' } },
  ids: { _runOnly: { includeRuleIds: ['contrast-computable','img-alt-present','link-name-present','duplicate-id'] }, wcagLevel: 'AA' },
  idsCompact: { _runOnly: { includeRuleIds: ['img-alt-present','link-name-present','button-name-present'] }, output: { detail: 'findings' } },
  custom: { customRules: [custom] },
  pack: { packs: [sample], profile: 'sample-1.0' },
  packCompact: { packs: [sample], profile: 'sample-1.0', output: { detail: 'findings' } },
  en: { mappings: ['en301549'], timestamp: '2026-10-14T00:00:00Z' },
};
const pick = process.argv[2] ? files.filter(f => f.includes(process.argv[2])) : files;
const out = {};
for (const [name, cfg] of Object.entries(configs)) {
  const { _runOnly, ...eo } = cfg;
  for (const f of pick) {
    try {
      const r = runa11yCoreOnHtml(fs.readFileSync(path.join(FIX, f), 'utf8'), { url: 'https://example.test/' + f, engineOptions: eo, runOnly: _runOnly || null, entryPointParity: false });
      out[name + ':' + f] = r;
    } catch (e) { console.log('SCAN ERR', name, f, e.message); }
  }
}
fs.writeFileSync(path.join(__dirname, 'out', 'corpus.json'), JSON.stringify(out));
console.log(Object.keys(out).length, 'results');
