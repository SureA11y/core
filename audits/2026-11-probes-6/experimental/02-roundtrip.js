const { sd, base, copy, mkPack, pack } = require('./lib.js');
const assert = require('node:assert');
const tryIt = (label, fn) => { try { const r = fn(); console.log(label, '->', r === undefined ? 'ok' : r); } catch (e) { console.log(label, '-> THROWS', e.message.slice(0, 300)); } };
// 1. Round trip
const x = base();
x.data[1].texts = { fr: { 'requirements.A.title': 'Images FR' } };
x.laws = { 'l-1': { name: 'Law', jurisdiction: 'FR' } };
x.texts = { fr: { 'laws.l-1.name': 'Loi' } };
x.profiles['base-1'].law = 'l-1';
const st = sd.standardFromData(x);
tryIt('deepStrictEqual(standardDataOf(standardFromData(x)), x)', () => assert.deepStrictEqual(sd.standardDataOf(st), x));
console.log('frozen?', Object.isFrozen(sd.standardDataOf(st)), 'same object as input?', sd.standardDataOf(st) === x);
// 2. Integer-like ids reorder: JSON order not preserved
const y = base(); y.data[1].requirements = { '10': { title: 'ten' }, '2': { title: 'two' }, 'A': { title: 'a' } }; y.data[1].ruleMap = {};
const yo = sd.standardDataOf(sd.standardFromData(y));
console.log('key order in:', JSON.stringify(Object.keys(JSON.parse(JSON.stringify(y)).data[1].requirements)), 'note: JS object already reorders integer keys at parse');
// 3. extras override: standardDataOf reflects data, not what the standard does
const z = base(); z.data[1].requirements.A.procedure = { steps: ['s'], passWhen: 'p', failWhen: 'f' };
const st2 = sd.standardFromData(z, { procedures: { 1: {} }, profiles: { other: { version: '1', tags: ['base'] } }, key: 'other-key', versions: ['1', '2'] });
console.log('extras.key overrides key?', st2.key, ' standardDataOf key:', sd.standardDataOf(st2).key);
console.log('extras.profiles:', Object.keys(st2.profiles), ' standardDataOf profiles:', Object.keys(sd.standardDataOf(st2).profiles));
console.log('extras.versions:', st2.versions);
// 4. standardDataOf on a spread copy of the standard (common pack pattern {...std, x})
console.log('standardDataOf({...st}):', sd.standardDataOf({ ...st }));
console.log('standardDataOf(null):', sd.standardDataOf(null), ' standardDataOf("x"):', sd.standardDataOf('x'));
// 5. after definePack, does the pack's standard keep data?
const p = mkPack(sd.standardFromData(base()));
console.log('after definePack, standardDataOf(pack.standard) present?', !!sd.standardDataOf(p.standard));
// 6. ruleMap row problems not caught until definePack
const bad = base(); bad.data[1].ruleMap['img-alt-present'] = { requirements: ['ZZZ'] };
tryIt('standardFromData(row naming missing requirement)', () => { sd.standardFromData(bad); });
tryIt('definePack(that)', () => { mkPack(sd.standardFromData(bad)); });
const bad2 = base(); bad2.data[1].ruleMap['img-alt-present'] = null;
tryIt('standardFromData(null row)', () => { sd.standardFromData(bad2); });
tryIt('definePack(null row)', () => { mkPack(sd.standardFromData(bad2)); });
const bad3 = base(); bad3.data[1].ruleMap['img-alt-present'] = { requirements: ['A'], asks: [] };
tryIt('definePack(asks: [] ) one-level', () => { mkPack(sd.standardFromData(bad3)); });
const bad4 = base(); bad4.data[1].ruleMap['img-alt-present'] = { requirements: ['A'], asks: ['B'] };
tryIt('definePack(asks on one-level standard)', () => { mkPack(sd.standardFromData(bad4)); });
const bad5 = base(); bad5.data[1].ruleMap['img-alt-present'] = { requirements: ['A'], outsideCorrespondence: { B: 'x' } };
tryIt('definePack(outsideCorrespondence on one-level standard)', () => { mkPack(sd.standardFromData(bad5)); });
const bad6 = base(); bad6.options = { wcagCorrespondence: true }; bad6.data[1].ruleMap['img-alt-present'] = { requirements: ['B'] };
tryIt('definePack(wcagCorrespondence on one-level, img-alt -> 3.3.2 req)', () => { mkPack(sd.standardFromData(bad6)); });
const bad7 = base(); bad7.data[1].ruleMap['img-alt-present'] = { requirements: ['A'], findings: [{ when: { a: { b: 1 } }, requirements: ['A'] }] };
tryIt('definePack(findings when object value)', () => { mkPack(sd.standardFromData(bad7)); });
const bad8 = base(); bad8.data[1].requirements.A.wcagSc = ['9.9.9'];
tryIt('definePack(wcagSc 9.9.9)', () => { mkPack(sd.standardFromData(bad8)); });
const bad9 = base(); bad9.lang = 'French';
tryIt('standardFromData(lang French)', () => sd.standardFromData(bad9).lang);
tryIt('definePack(lang French)', () => { mkPack(sd.standardFromData(bad9)); });
const bad10 = base(); bad10.profiles['base-1'].tags = 'base';
tryIt('definePack(profile tags string)', () => { mkPack(sd.standardFromData(bad10)); });
