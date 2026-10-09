'use strict';
// A selection whose excludes cancel its includes runs no rule, without a
// word; what do the reporters make of a page full of failures scanned so?
const h = require('./h.js');
const { main, sub } = h.load();
const PAGE = '<!doctype html><html><body><img src="a.png"><button></button></body></html>';
const sel = {
  'include & exclude same id': { includeRuleIds: ['img-alt-present'], excludeRuleIds: ['img-alt-present'] },
  'wcag target, its tag excluded': { wcag: { version: '2.2', level: 'AA' }, excludeTags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
  'includeMode "xor"': { includeRuleIds: ['region'], tags: ['wcag111'], includeMode: 'xor' }
};
for (const [name, ro] of Object.entries(sel)) {
  h.setDom(PAGE);
  const r = h.capture(() => main.runDomRulesInPage('https://e.test/', null, { strictOptions: true }, ro));
  if (r.error) { console.log(name, 'THROWS', r.error.message); continue; }
  const j = sub('junit').renderJunitReport(r.value);
  const s = JSON.parse(sub('sarif').renderSarifReport(r.value)).runs[0];
  const b = sub('baseline').matchBaseline(r.value, []);
  console.log(`${name}: checks ${r.value.checksResults.length}, logs ${r.logs.length}, strictOptions did not object; JUnit ${(j.match(/<testsuites[^>]*>/) || [''])[0]}; SARIF results ${s.results.length}, notifications ${(s.invocations || []).length}; baseline newCount ${b.newCount}`);
}
process.exit(0);
