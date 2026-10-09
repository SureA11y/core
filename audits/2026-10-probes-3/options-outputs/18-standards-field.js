'use strict';
// result.standards against what the result's mappings and rollups name, and
// engine.mappings; the locale of standards[].note.
const h = require('./h.js');
const { main, sub } = h.load();
const PAGE = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"></main></body></html>';
const customEN = { id: 'org-en', meta: { title: 'Org EN', tags: ['wcag111', 'wcag2a'], normativeMappings: [{ standard: 'EN 301 549', version: 'V3.2.1', requirement: '9.1.1.1', title: 'Non-text content' }] }, runInPage: "() => ({ outcome: 'pass', occurrences: [] })" };
const cases = [
  ['none', {}],
  ['mappings en301549', { mappings: 'en301549' }],
  ['mappings bogus', { mappings: 'en301549:V9' }],
  ['profile en301549-v4.1.1 de', { profile: 'en301549-v4.1.1', locale: 'de' }],
  ['custom rule naming EN 301 549', { customRules: [customEN] }],
  ['custom rule + findings', { customRules: [customEN], output: { detail: 'findings' } }]
];
for (const [name, eo] of cases) {
  h.setDom(PAGE);
  const r = h.capture(() => main.runDomRulesInPage('https://e.test/', null, eo, null));
  const res = r.value;
  const named = new Set();
  for (const c of res.checksResults) for (const m of (c.meta && c.meta.normativeMappings) || []) if (m.standard && m.standard !== 'WCAG') named.add(m.standard);
  for (const c of res.rulesResults) if (c.meta && c.meta.standard) named.add(c.meta.standard);
  const sarif = JSON.parse(sub('sarif').renderSarifReport(res));
  const tags = new Set(sarif.runs[0].tool.driver.rules.flatMap((x) => x.properties.tags).filter((t) => /^en301549-/.test(t)));
  console.log(`## ${name}: standards=${JSON.stringify(res.standards && res.standards.map((s) => s.key + (s.note ? ':note(' + s.note.slice(0, 25) + ')' : '')))} engine.mappings=${JSON.stringify(res.engine.mappings)} named=${JSON.stringify([...named])} sarif en301549 tags=${tags.size} logs=${r.logs.map((l) => l.slice(0, 90)).join('|')}`);
}
process.exit(0);
