// Values the engine emits that OUTPUT_SCHEMA.md / index.d.ts don't list:
// occurrence.occurrenceOutcome 'pass' (typed 'fail'|'cantTell'), and
// excludedOccurrences.coercedFrom 'pass' (OUTPUT_SCHEMA's shape block lists "fail"|"cantTell").
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const mk = (outcome, tier) => ({ id: 'org-x', meta: { title: 'T', description: 'd', tags: ['wcag111', 'wcag2a'], wcagSc: ['1.1.1'] },
  runInPage: new Function('ctx', `return { outcome: '${outcome}', occurrences: [{ __node: ctx.document.getElementById('z'), summary: 's', hint: 'h', ${tier ? `occurrenceOutcome: '${tier}',` : ''} data: { details: { reasonCode: 'R' } } }] };`) });
const html = '<html lang="en"><head><title>t</title></head><body><main><div class="ex"><p id="z">z</p></div><p id="y">y</p></main></body></html>';
(async () => {
  let r = await runa11yCoreOnHtml(html, { engineOptions: { customRules: [mk('fail', 'pass')] }, runOnly: ['org-x'] });
  console.log('occurrenceOutcome kept:', r.checksResults[0].occurrences[0].occurrenceOutcome);
  await new Promise(s => setImmediate(s));
  r = await runa11yCoreOnHtml(html, { engineOptions: { customRules: [mk('pass', null)], excludeSelectors: ['.ex'] }, runOnly: ['org-x'] });
  console.log('outcome', r.checksResults[0].outcome, 'excludedOccurrences', JSON.stringify(r.checksResults[0].excludedOccurrences));
})();
