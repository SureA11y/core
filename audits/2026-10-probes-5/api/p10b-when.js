// Does a `when` path match inherited properties? Does a finding routed to a requirement the table lacks vanish?
'use strict';
const { definePack, ruleMappedStandard, checkPack } = require('/home/user/core/src/pack.js');
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
function mk(ns, requirements, ruleMap) {
  const std = ruleMappedStandard({ standard: 'S ' + ns, tag: ns, versions: [{ version: '1.0', wcagVersion: '2.2' }], requirements, ruleMap });
  return definePack({ name: ns + '-pack', version: '1.0.0', namespace: ns, core: '*', standard: {
    key: ns, standard: 'S ' + ns, versions: ['1.0'], profiles: { [ns + '-1.0']: { version: '1.0', tags: [ns], mappedRules: true } },
    ruleTag: ns, ruleMapped: true, mappingsFor: std.mappingsFor, composites: std.composites, validate: std.validate } });
}
const page = '<!doctype html><html lang="en"><head><title>t</title></head><body><img src="x.png"></body></html>';
const R = { '1.0': { 1: { title: 'one', wcagSc: ['1.1.1'] }, 2: { title: 'two', wcagSc: ['1.1.1'] } } };
const first = runa11yCoreOnHtml(page, { runOnly: ['img-alt-present'] }).checksResults[0].occurrences[0].data.details;
console.log('details keys', Object.keys(first), 'proto is Object.prototype?', Object.getPrototypeOf(first) === Object.prototype, 'ctor', first.constructor && first.constructor.name);
for (const [label, when, reqs] of [
  ['own field reasonCode', { reasonCode: first.reasonCode }, ['2']],
  ['inherited constructor.name', { 'constructor.name': 'Object' }, ['2']],
  ['string length reasonCode.length', { 'reasonCode.length': String(first.reasonCode).length }, ['2']],
  ['to a requirement not in the table', { reasonCode: first.reasonCode }, ['99']],
  ['to none', { reasonCode: first.reasonCode }, []]
]) {
  const p = mk('w' + Math.random().toString(36).slice(2, 6).replace(/\d/g, 'x'), R, { '1.0': { 'img-alt-present': { requirements: ['1', '2'], findings: [{ when, requirements: reqs }] } } });
  const r = runa11yCoreOnHtml(page, { engineOptions: { packs: [p], profile: p.namespace + '-1.0' } });
  const rr = r.rulesResults.filter((x) => x.ruleId.startsWith(p.namespace)).map((x) => x.ruleId.split('-').pop() + '=' + x.outcome).join(' ');
  console.log(label.padEnd(36), 'checkPack:', JSON.stringify(checkPack(p)), ' rollups:', rr, ' img-alt-present:', r.checksResults.find((c) => c.ruleId === 'img-alt-present').outcome);
}
