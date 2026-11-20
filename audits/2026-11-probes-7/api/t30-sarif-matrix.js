const fs = require('fs');
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const { renderSarifReport } = require('/home/user/core/src/sarif.js');
const B = require('/home/user/core/src/baseline.js');
const sample = require('/home/user/core/tests/fixtures/packs/sample.js');
(async () => {
  const r1 = await runa11yCoreOnHtml(require('./page.js'), { engineOptions: { profile: ['wcag22-aa', 'sample-1.0', 'nope'], packs: [sample], locale: 'ja' } });
  const r2 = await runa11yCoreOnHtml('<html><body></body></html>', { engineOptions: {} });
  const base = B.buildBaselineEntries(r1, { leanFail: true });
  let i = 0;
  for (const r of [r1, r2]) for (const o of [{}, { leanFailAs: 'error' }, { leanFailAs: 'ERROR', leanFailWcagOnly: true }, { baselineEntries: base, leanFailAs: 'error' }, { allowProfilesNotRun: true, category: 'x y', toolVersion: '', informationUri: 'not a uri' }, { packs: [sample] }]) {
    let out; try { out = renderSarifReport(r, o); } catch (e) { console.log(i, 'THROW', e.message.slice(0, 100)); i++; continue; }
    fs.writeFileSync(`out-s${i}.sarif`, out); i++;
  }
  console.log('wrote', i);
})();
