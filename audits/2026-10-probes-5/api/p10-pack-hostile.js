// Rule-mapped standards (ruleMappedStandard) with hostile tables: prototype keys, inherited `when` paths,
// conflicting rows, partial, applicability 'wcag'.
'use strict';
const { definePack, ruleMappedStandard, checkPack } = require('/home/user/core/src/pack.js');
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
function mk(ns, requirements, ruleMap, extra = {}) {
  const std = ruleMappedStandard({ standard: 'S ' + ns, tag: ns, versions: [{ version: '1.0', wcagVersion: '2.2' }], requirements, ruleMap, ...extra });
  return definePack({ name: ns + '-pack', version: '1.0.0', namespace: ns, core: '*', standard: {
    key: ns, standard: 'S ' + ns, versions: ['1.0'], profiles: { [ns + '-1.0']: { version: '1.0', tags: [ns], mappedRules: true } },
    ruleTag: ns, ruleMapped: true, mappingsFor: std.mappingsFor, composites: std.composites, validate: std.validate } });
}
const page = (body) => `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
function scan(pack, body, profile) {
  const r = runa11yCoreOnHtml(page(body), { engineOptions: { packs: [pack], profile } });
  return r;
}
function roll(r, prefix) { return r.rulesResults.filter((x) => x.ruleId.startsWith(prefix)).map((x) => x.ruleId + '=' + x.outcome + (x.data && x.data.details && x.data.details.reasonCode ? '(' + x.data.details.reasonCode.replace('composite.rollup.', '') + ')' : '')).join(' '); }
function attempt(name, f) { try { console.log(name.padEnd(34), f()); } catch (e) { console.log(name.padEnd(34), 'THROW', String(e.message).split('\n').slice(0, 3).join(' | ').slice(0, 300)); } }

// A. a `when` path that reads an inherited property
attempt('A when constructor.name', () => {
  const p = mk('wa', { '1.0': { 1: { title: 'img', wcagSc: ['1.1.1'] }, 2: { title: 'other', wcagSc: ['1.1.1'] } } },
    { '1.0': { 'img-alt-present': { requirements: ['1', '2'], findings: [{ when: { 'constructor.name': 'Object' }, requirements: ['2'] }] } } });
  return roll(scan(p, '<img src="x.png">', 'wa-1.0'), 'wa-');
});
attempt('A2 when reasonCode.length', () => {
  const p = mk('wb', { '1.0': { 1: { title: 'img', wcagSc: ['1.1.1'] } } },
    { '1.0': { 'img-alt-present': { requirements: ['1'], findings: [{ when: { 'reasonCode.length': 999 }, requirements: [] }, { when: { 'toString.name': 'toString' }, requirements: [] }] } } });
  return roll(scan(p, '<img src="x.png">', 'wb-1.0'), 'wb-');
});
// B. prototype-named requirement numbers
for (const key of ['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'valueOf']) {
  attempt('B requirement ' + key, () => {
    const reqs = { '1.0': JSON.parse(`{"${key}": {"title": "x", "wcagSc": ["1.1.1"]}, "2": {"title": "y", "wcagSc": ["4.1.2"]}}`) };
    const map = { '1.0': { 'img-alt-present': { requirements: [key] }, 'button-name-present': { requirements: ['2'] } } };
    const p = mk('pb' + key.replace(/_/g, '').toLowerCase().slice(0, 5), reqs, map);
    return roll(scan(p, '<img src="x.png"><button></button>', p.namespace + '-1.0'), p.namespace + '-');
  });
}
// C. a ruleMap row for a rule id that is a prototype key / unknown rule
for (const rid of ['constructor', '__proto__', 'toString', 'no-such-rule']) {
  attempt('C rule row ' + rid, () => {
    const map = { '1.0': JSON.parse(`{"${rid}": {"requirements": ["1"]}, "img-alt-present": {"requirements": ["1"]}}`) };
    const p = mk('pc' + rid.replace(/_/g, '').toLowerCase().slice(0, 4), { '1.0': { 1: { title: 'x', wcagSc: ['1.1.1'] } } }, map);
    return checkPack(p).join(' ; ') + ' || ' + roll(scan(p, '<img src="x.png">', p.namespace + '-1.0'), p.namespace + '-');
  });
}
// D. reasonCodes / findings naming requirements outside the row or nonexistent
attempt('D findings req not in table', () => {
  const p = mk('pd', { '1.0': { 1: { title: 'x', wcagSc: ['1.1.1'] } } }, { '1.0': { 'img-alt-present': { requirements: ['1'], findings: [{ when: { reasonCode: 'X' }, requirements: ['99'] }] } } });
  return checkPack(p).join(';') || 'accepted';
});
attempt('D reasonCodes __proto__ key', () => {
  const p = mk('pe', { '1.0': { 1: { title: 'x', wcagSc: ['1.1.1'] } } }, { '1.0': { 'img-alt-present': JSON.parse('{"requirements":["1"],"reasonCodes":{"__proto__":{"requirements":[]}}}') } });
  return roll(scan(p, '<img src="x.png">', 'pe-1.0'), 'pe-');
});
attempt('D when value object', () => {
  const p = mk('pf', { '1.0': { 1: { title: 'x', wcagSc: ['1.1.1'] } } }, { '1.0': { 'img-alt-present': { requirements: ['1'], findings: [{ when: { a: {} }, requirements: [] }] } } });
  return 'accepted';
});
const cyc = {}; cyc.self = cyc;
attempt('D when cyclic', () => {
  const p = mk('pg', { '1.0': { 1: { title: 'x', wcagSc: ['1.1.1'] } } }, { '1.0': { 'img-alt-present': { requirements: ['1'], findings: [{ when: cyc, requirements: [] }] } } });
  return 'accepted';
});
// E. partial
attempt('E partial, nothing applies', () => {
  const p = mk('ph', { '1.0': { 1: { title: 'x', wcagSc: ['1.1.1'], partial: true }, 2: { title: 'y', wcagSc: ['1.1.1'] } } }, { '1.0': { 'img-alt-present': { requirements: ['1', '2'] } } });
  return roll(scan(p, '<p>no images</p>', 'ph-1.0'), 'ph-');
});
attempt('E partial: "true" string', () => {
  const p = mk('pi', { '1.0': { 1: { title: 'x', wcagSc: ['1.1.1'], partial: 'true' } } }, { '1.0': { 'img-alt-present': { requirements: ['1'] } } });
  return roll(scan(p, '<p>no images</p>', 'pi-1.0'), 'pi-');
});
attempt('E applicability bogus', () => {
  const p = mk('pj', { '1.0': { 1: { title: 'x', wcagSc: ['1.1.1'] } } }, { '1.0': { 'img-alt-present': { requirements: ['1'] } } }, { applicability: 'WCAG' });
  return roll(scan(p, '<p>no images</p>', 'pj-1.0'), 'pj-');
});
