const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const { renderSarifReport } = require('/home/user/core/src/sarif.js');
const { renderJunitReport } = require('/home/user/core/src/junit.js');
const sample = require('/home/user/core/tests/fixtures/packs/sample.js');
(async () => {
  for (const profile of [['nope', 'WCAG22-AA'], ['WCAG22-AA', 'Wcag21-A'], [' wcag22-aa ', 'wcag21-a'], ['SAMPLE-1.0', 'wcag21-a'], ['wcag22-aa', 'WCAG22-aa', 'wcag21-a']]) {
    const r = await runa11yCoreOnHtml('<html lang=en><title>t</title><main><img src=a></main></html>', { engineOptions: { profile, packs: [sample] } });
    const s = JSON.parse(renderSarifReport(r)).runs[0].properties;
    const j = (renderJunitReport(r).match(/<property name="profiles?"[^>]*>/g) || []).join(' ');
    console.log(JSON.stringify(profile), '-> engine.profile', r.engine.profile, 'profiles', JSON.stringify(r.engine.profiles), 'notRun', JSON.stringify(r.engine.profilesNotRun), 'sections', JSON.stringify(Object.keys(r.profiles || {})), 'verdict keys', JSON.stringify(Object.keys((r.checksResults[0] || {}).verdicts || {})), '| sarif', JSON.stringify(s.profiles), '| junit', j);
    await new Promise(s => setImmediate(s));
  }
})();
