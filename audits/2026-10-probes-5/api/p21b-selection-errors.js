// Catalog functions vs scan on invalid or edge selections and options: same throw, same lists.
'use strict';
const core = require('/home/user/core/src/index.js');
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const html = '<!doctype html><html lang=en><head><title>t</title></head><body><main><img src=x.png></main></body></html>';
const cases = [
  [['nope'], {}], [{ tags: ['wcag22a'] }, {}], [{ tags: ['wcag22a', 'wcag111'] }, {}], [5, {}], [{ wcag: { version: '2.2' } }, {}],
  [null, { wcagLevel: 'AA+' }], [null, { wcagLevel: 'AA+', strictOptions: true }], [null, { profile: 'nope' }], [null, { profile: 'nope', strictOptions: true }],
  [{ includeRuleIds: ['img-alt-present'], excludeRuleIds: ['img-alt-present'] }, {}], [{ includeRuleIds: ['img-alt-present'], excludeRuleIds: ['img-alt-present'] }, { strictOptions: true }],
  [{ includeRuleIds: ['region'], tags: ['wcag2a'] }, {}], [{ includeRuleIds: ['region'], tags: ['wcag2a'] }, { strictOptions: true }],
  [{ includeMode: 'xor', includeRuleIds: ['img-alt-present'] }, { strictOptions: true }],
  [['contrast-computable'], { wcagVersion: '2.2', wcagLevel: 'AA' }], [['wcag-1.4.6-contrast-enhanced'], { wcagLevel: 'AA' }],
  [{ bestPractices: true }, { profile: 'wcag22-aa' }], [{ wcag: { version: '2.2', level: 'AA' } }, { profile: 'section508' }],
  [['duplicate-id'], {}], [['duplicate-id'], { wcagVersion: '2.1' }], [null, { optInRules: ['nope'] }], [null, { optInRules: ['nope'], strictOptions: true }],
  [new Set(['img-alt-present']), {}], [{ type: 'rules', values: 'img-alt-present,  ,link-name-present' }, {}], [[''], {}], [[' '], {}], [',', {}]
];
const ow = console.warn, oi = console.info;
for (const [sel, eo] of cases) {
  const w1 = [], w2 = [];
  let a, b;
  console.warn = (...x) => w1.push(x.join(' ').slice(0, 90)); console.info = console.warn;
  try { a = { c: core.getChecksForRunOnly(sel, eo).length, r: core.getRulesForRunOnly(sel, eo).map((r) => r.id).length }; } catch (e) { a = 'THROW ' + (e.code || '') + ' ' + e.message.slice(0, 80); }
  console.warn = (...x) => w2.push(x.join(' ').slice(0, 90)); console.info = console.warn;
  try { const r = runa11yCoreOnHtml(html, { engineOptions: eo, runOnly: sel }); b = { c: r.checksResults.length, r: (r.rulesResults || []).length }; } catch (e) { b = 'THROW ' + (e.code || '') + ' ' + e.message.slice(0, 80); }
  console.warn = ow; console.info = oi;
  const same = JSON.stringify(a) === JSON.stringify(b);
  console.log(same ? 'same' : 'DIFF', JSON.stringify(sel instanceof Set ? [...sel] : sel), JSON.stringify(eo), JSON.stringify(a), same ? '' : 'scan=' + JSON.stringify(b), '| catalog warns', w1.length, 'scan warns', w2.length);
}
