// checkPack() vs what a scan refuses; reason codes / `when` fields that a rule never reports.
'use strict';
const { definePack, ruleMappedStandard, checkPack } = require('/home/user/core/src/pack.js');
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
function mk(ns, versions, ruleMap) {
  const std = ruleMappedStandard({ standard: 'S', tag: ns, versions, requirements: { '1.0': { 1: { title: 'x', wcagSc: ['1.1.1'] }, 2: { title: 'y', wcagSc: ['1.4.3'] } } }, ruleMap });
  return definePack({ name: ns + '-pack', version: '1.0.0', namespace: ns, core: '*', standard: { key: ns, standard: 'S', versions: ['1.0'], profiles: { [ns + '-1.0']: { version: '1.0', tags: [ns], mappedRules: true } }, ruleTag: ns, ruleMapped: true, mappingsFor: std.mappingsFor, composites: std.composites, validate: std.validate } });
}
const html = '<!doctype html><html lang=en><head><title>t</title></head><body style="background:#fff"><img src=x.png><p style="color:#bbb">pale</p></body></html>';
const go = (label, p) => {
  const warns = []; const ow = console.warn; console.warn = (...a) => warns.push(a.join(' ').replace(/\s+/g, ' ').slice(0, 200));
  let rr; try { const r = runa11yCoreOnHtml(html, { engineOptions: { packs: [p], profile: p.namespace + '-1.0' } }); rr = r.rulesResults.filter((x) => x.ruleId.startsWith(p.namespace)).map((x) => x.ruleId + '=' + x.outcome).join(' ') + ' skipped=' + JSON.stringify(r.skippedPacks || r.engine.skippedPacks || null); } catch (e) { rr = 'THROW ' + e.message.slice(0, 200); }
  console.warn = ow;
  console.log(label.padEnd(40), 'checkPack=' + JSON.stringify(checkPack(p)), '|', rr, '|', warns.join(' // '));
};
go('no wcagVersion on the version', mk('za', [{ version: '1.0' }], { '1.0': { 'img-alt-present': { requirements: ['1'] } } }));
go('reasonCodes for a rule with no codes', mk('zb', [{ version: '1.0', wcagVersion: '2.2' }], { '1.0': { 'img-alt-present': { requirements: ['1', '2'], reasonCodes: { IMG_ALT_MISSING: { requirements: ['1'] } } } } }));
go('reasonCodes code never emitted', mk('zc', [{ version: '1.0', wcagVersion: '2.2' }], { '1.0': { 'contrast-minimum': { requirements: ['1', '2'], reasonCodes: { CONTRAST_TYPO: { requirements: ['1'] } } } } }));
go('when field misspelt', mk('zd', [{ version: '1.0', wcagVersion: '2.2' }], { '1.0': { 'contrast-minimum': { requirements: ['1', '2'], findings: [{ when: { 'typography.isLarge': false }, requirements: ['1'] }] } } }));
go('findings to a requirement not in table', mk('ze', [{ version: '1.0', wcagVersion: '2.2' }], { '1.0': { 'contrast-minimum': { requirements: ['2'], findings: [{ when: { 'typography.isLargeText': false }, requirements: ['9'] }] } } }));
go('findings to req outside the row', mk('zf', [{ version: '1.0', wcagVersion: '2.2' }], { '1.0': { 'contrast-minimum': { requirements: ['2'], findings: [{ when: { 'typography.isLargeText': false }, requirements: ['1'] }] } } }));
