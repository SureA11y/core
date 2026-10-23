'use strict';
// A checklist profile's severity (ruleSeverity) with options around it:
// output.detail, runOnly beside the profile, locale; and an invalid level.
const h = require('./h.js');
const { main, sub } = h.load();
const { definePack } = require(h.ROOT + '/src/pack.js');
function pack(sev) {
  return definePack({ name: '@t/sev', version: '1.0.0', namespace: 'tsev', core: '>=1.10.0', title: 'Sev',
    profiles: { 'tsev-p': { tags: ['wcag2a'], severity: { 'img-alt-present': sev, 'page-title-present': sev } } },
    rollups: [{ id: 'tsev-images', title: 'Images', checksIds: ['img-alt-present'] }] });
}
const PAGE = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"></main></body></html>';
for (const [name, sev, eo, ro] of [
  ['critical', 'critical', {}, null],
  ['critical, findings', 'critical', { output: { detail: 'findings' } }, null],
  ['critical, runOnly ids', 'critical', {}, ['img-alt-present']],
  ['critical, bestPractices', 'critical', {}, { bestPractices: true }],
  ['invalid "urgent"', 'urgent', {}, null],
  ['invalid "Critical"', 'Critical', {}, null]
]) {
  h.setDom(PAGE);
  const r = h.capture(() => main.runDomRulesInPage('https://e.test/', null, { packs: [pack(sev)], profile: 'tsev-p', ...eo }, ro));
  if (r.error) { console.log(name, 'THROWS', r.error.message.slice(0, 150)); continue; }
  const v = r.value;
  const c = v.checksResults.find((x) => x.ruleId === 'img-alt-present');
  const t = v.checksResults.find((x) => x.ruleId === 'page-title-present');
  const roll = v.rulesResults.find((x) => x.ruleId === 'tsev-images');
  const sarifRes = JSON.parse(sub('sarif').renderSarifReport(v)).runs[0].results.find((x) => x.ruleId === 'img-alt-present');
  console.log(`## ${name}: profile=${v.engine.profile || '-'} img severity=${c && c.severity} ruleSeverity=${c && c.ruleSeverity} | page-title ${t ? (t.severity || 'compact') + '/' + t.ruleSeverity : 'absent'} | rollup ${roll ? roll.severity + ' contrib ' + JSON.stringify(roll.data.details.contributors) : 'absent'} | sarif severity ${sarifRes && sarifRes.properties.severity} | skippedPacks ${JSON.stringify(v.skippedPacks || [])} | logs ${r.logs.map((l) => l.slice(0, 100)).join('|')}`);
}
process.exit(0);
