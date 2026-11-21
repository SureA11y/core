const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const { renderSarifReport } = require('/home/user/core-r8/src/sarif.js');
const { renderJunitReport } = require('/home/user/core-r8/src/junit.js');
const B = require('/home/user/core-r8/src/baseline.js');
const html = '<html lang="en"><head><title>t</title></head><body><p id="a">x</p><p id="a">y</p></body></html>';
const cr = { id: 'org-parse', meta: { title: 'T', description: 'd', tags: ['wcag2a', 'wcag411'], wcagSc: ['4.1.1'] }, runInPage() { return { outcome: 'fail', occurrences: [{ selector: 'p' }] }; } };
(async () => {
  console.warn = () => {}; console.info = () => {};
  for (const [label, eo, ro] of [['wcag22-aa', { profile: 'wcag22-aa' }, null], ['wcag21-aa', { profile: 'wcag21-aa' }, null], ['runOnly tags 2.1 ver', { wcagVersion: '2.1' }, { tags: ['wcag2a'] }], ['multi 22+21', { profile: ['wcag22-aa', 'wcag21-aa'] }, null]]) {
    const r = await runa11yCoreOnHtml(html, { engineOptions: { ...eo, customRules: [cr] }, runOnly: ro });
    const pick = (id) => { const c = r.checksResults.find(c => c.ruleId === id); return c ? c.outcome + (c.occurrences[0] ? '/' + (c.occurrences[0].occurrenceOutcome || '-') + JSON.stringify(c.occurrences[0].verdicts || '') : '') : 'n/a'; };
    const s = JSON.parse(renderSarifReport(r)).runs[0].results.filter(x => x.level === 'error').map(x => x.ruleId);
    const j = [...renderJunitReport(r).matchAll(/name="([^"]+)"[^>]*>\s*<failure/g)].map(m => m[1]);
    console.log(label.padEnd(22), 'duplicate-id', pick('duplicate-id'), '| org-parse', pick('org-parse'), '| sarif err', JSON.stringify(s), '| junit fail', JSON.stringify(j), '| baseline', B.buildBaselineEntries(r).map(e => e.ruleId).join(','));
  }
})();
