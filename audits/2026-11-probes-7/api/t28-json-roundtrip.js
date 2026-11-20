const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const { renderSarifReport } = require('/home/user/core/src/sarif.js');
const { renderJunitReport } = require('/home/user/core/src/junit.js');
const { renderEarlReport } = require('/home/user/core/src/earl.js');
const { renderHtmlReport } = require('/home/user/core/src/report.js');
const B = require('/home/user/core/src/baseline.js');
const core = require('/home/user/core/src/index.js');
const sample = require('/home/user/core/tests/fixtures/packs/sample.js');
const strip = (s) => s.replace(/\d{1,2}:\d\d:\d\d[^<]*|Nov \d+, \d+/g, '');
(async () => {
  for (const eo of [{ profile: ['wcag22-aa', 'sample-1.0'], packs: [sample] }, { profile: 'wcag21-aa', excludeSelectors: ['nav'] }]) {
    const r = await runa11yCoreOnHtml(require('./page.js'), { engineOptions: eo });
    const j = JSON.parse(JSON.stringify(r));
    const sc = structuredClone(r);
    for (const [n, f] of [['sarif', (x) => renderSarifReport(x, { packs: [sample] })], ['junit', renderJunitReport], ['earl', (x) => JSON.stringify(renderEarlReport(x))], ['html', (x) => strip(renderHtmlReport(x, { packs: [sample] }))], ['baseline', (x) => JSON.stringify(B.buildBaselineEntries(x, { leanFail: true }))], ['leaning', (x) => JSON.stringify(core.leaningFailures(x))], ['addHow', (x) => JSON.stringify(core.addHowToCheck(x, { locale: 'fr' }).checksResults.map(c => c.occurrences.map(o => o.howToCheck)))]]) {
      const a = f(r), b = f(j), c = f(sc);
      console.log(JSON.stringify(eo.profile), n, a === b && a === c ? 'same' : 'DIFF');
    }
    await new Promise(s => setImmediate(s));
  }
})();
