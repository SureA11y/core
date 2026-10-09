'use strict';
// Selection combinations, contradictory ones included: what runs, what the
// catalog says runs (getChecksForRunOnly), what engine.* reports, and whether
// a combination that selects nothing or contradicts itself says so.
const h = require('./h.js');
const { main } = h.load();
const PAGE = h.fixture('img-alt-present-all-scenarios.html');
const custom = { id: 'org-bp', meta: { title: 'Org', tags: ['best-practice'] }, runInPage: "() => ({ outcome: 'pass', occurrences: [] })" };
const combos = [
  ['profile + tags', { profile: 'wcag22-aa' }, { tags: ['wcag412'] }],
  ['profile + excludeRuleIds', { profile: 'section508' }, { excludeRuleIds: ['img-alt-present'] }],
  ['profile + engine rules.exclude', { profile: 'section508', rules: { exclude: 'img-alt-present' } }, null],
  ['profile + engine rules.include', { profile: 'section508', rules: { include: 'img-alt-present' } }, null],
  ['include & exclude same id', {}, { includeRuleIds: ['img-alt-present'], excludeRuleIds: ['img-alt-present'] }],
  ['tags include & exclude same', {}, { tags: ['wcag2a'], excludeTags: ['wcag2a'] }],
  ['includeMode and, disjoint', {}, { includeRuleIds: ['region'], tags: ['wcag111'], includeMode: 'and' }],
  ['includeMode or', {}, { includeRuleIds: ['region'], tags: ['wcag111'], includeMode: 'or' }],
  ['includeMode bogus', {}, { includeRuleIds: ['region'], tags: ['wcag111'], includeMode: 'xor' }],
  ['wcag 2.0 A + wcagVersion 2.2', { wcagVersion: '2.2' }, { wcag: { version: '2.0', level: 'A' } }],
  ['wcag lower-case level', {}, { wcag: { version: '2.2', level: 'aa' } }],
  ['wcag version number', {}, { wcag: { version: 2.2, level: 'AA' } }],
  ['wcag + profile', { profile: 'section508' }, { wcag: { version: '2.2', level: 'AA' } }],
  ['wcag excluding everything', {}, { wcag: { version: '2.0', level: 'A' }, excludeTags: ['wcag2a'] }],
  ['runOnly wins over engine tags', { tags: { include: 'best-practice' } }, { includeRuleIds: ['img-alt-present'] }],
  ['engine exclude ignored with runOnly', { rules: { exclude: 'img-alt-present' } }, { tags: ['wcag111'] }],
  ['bestPractices false alone', {}, { bestPractices: false }],
  ['bestPractices + profile + custom bp', { profile: 'wcag22-aa', customRules: [custom] }, { bestPractices: true }],
  ['profile + custom bp', { profile: 'wcag22-aa', customRules: [custom] }, null],
  ['508 profile + wcagVersion 2.2', { profile: 'section508', wcagVersion: '2.2' }, null],
  ['en301549-v3.2.1 + wcagVersion 2.2', { profile: 'en301549-v3.2.1', wcagVersion: '2.2' }, null],
  ['profile mixed case', { profile: 'WCAG22-AA' }, null],
  ['profile + optInRules all', { profile: 'wcag22-aa', optInRules: 'all' }, null],
  ['excludeRuleIds composite', {}, { excludeRuleIds: ['wcag-1.1.1-non-text-content'] }],
  ['excludeTestIds typo', {}, { excludeTestIds: ['img-alt-presnt'] }],
  ['includeTestIds typo', {}, { includeTestIds: ['img-alt-presnt'] }],
  ['tags only wcag22a', {}, { tags: ['wcag22a'] }],
  ['legacy type rule w/ composite', {}, { type: 'rule', values: ['wcag-1.1.1-non-text-content'] }],
  ['exclude all by tag a11ycore', {}, { excludeTags: ['a11ycore'] }],
  ['engine rules.exclude all via tag?', { tags: { exclude: 'a11ycore' } }, null]
];
for (const [name, eo, ro] of combos) {
  h.setDom(PAGE);
  const r = h.capture(() => main.runDomRulesInPage('https://e.test/', null, eo, ro));
  const cat = h.capture(() => main.getChecksForRunOnly(ro, eo));
  if (r.error) { console.log(`## ${name}: THROWS ${r.error.code || ''} ${r.error.message.slice(0, 140)} | catalog ${cat.error ? 'throws too' : 'returns ' + cat.value.length}`); continue; }
  const ran = r.value.checksResults.map((c) => c.ruleId).sort();
  const catIds = cat.error ? null : cat.value.map((c) => c.ruleId).sort();
  const same = catIds && JSON.stringify(ran) === JSON.stringify(catIds);
  const e = r.value.engine;
  console.log(`## ${name}: ran ${ran.length} rules, ${r.value.rulesResults.length} rollups | catalog ${cat.error ? 'THROWS ' + cat.error.message.slice(0, 60) : catIds.length}${same ? '' : ' (DIFFERS: run-only ' + ran.filter((x) => !catIds || !catIds.includes(x)).slice(0, 4) + ' / catalog-only ' + (catIds || []).filter((x) => !ran.includes(x)).slice(0, 4) + ')'}` +
    ` | wcagVersion ${e.wcagVersion} profile ${e.profile || '-'} | img-alt-present ${ran.includes('img-alt-present') ? 'ran' : 'no'} | skippedCustom ${r.value.skippedCustomRules.length}` +
    (r.logs.length ? `\n     logs: ${r.logs.map((l) => l.slice(0, 170)).join('\n           ')}` : ''));
}
process.exit(0);
