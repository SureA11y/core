const { sd, base, mkPack, index, both } = require('./lib.js');
const tryIt = (label, fn) => { try { const r = fn(); console.log(label, '->', typeof r === 'string' ? r : JSON.stringify(r)); } catch (e) { console.log(label, '-> THROWS', e.message.slice(0, 300)); } };
const proc = (s) => ({ steps: [s], passWhen: 'ok ' + s, failWhen: 'no ' + s });
// I1: two tests differing only in case under one requirement -> same facet id
const d = base();
d.data[1].tests = { 'T1': { title: 'Upper', requirements: ['A'], procedure: proc('upper') }, 't1': { title: 'lower', requirements: ['A'], procedure: proc('lower') }, 'B.1': { title: 'b', requirements: ['B'] } };
d.data[1].ruleMap = { 'img-alt-present': { requirements: ['T1'] } };
both('I1 tests T1 and t1', d);
tryIt('I1 definePack', () => { const p = mkPack(sd.standardFromData(d)); const l = index.listProcedures({ packs: [p], standard: 'base' }); const a = l.requirements.find((r) => r.id === 'A'); return a.facets.map((f) => `${f.id}:${f.label}`); });
// I2: dotted ids: requirement "a" with test "b.facets.c", requirement "a.facets.b" with test "c" -> engine keys collide
const e = base();
e.data[1].requirements = { a: { title: 'Req a' }, 'a.facets.b': { title: 'Req a.facets.b' } };
e.data[1].tests = { 'b.facets.c': { title: 'Test one', requirements: ['a'], procedure: proc('one') }, c: { title: 'Test two', requirements: ['a.facets.b'], procedure: proc('two') } };
e.data[1].ruleMap = {};
e.data[1].texts = { fr: { 'tests.c.title': 'Test deux (FR)' } };
both('I2 dotted ids', e);
tryIt('I2 listProcedures fr', () => { const p = mkPack(sd.standardFromData(e)); const l = index.listProcedures({ packs: [p], standard: 'base', locale: 'fr' }); return l.requirements.map((r) => `${r.id}: ${r.facets.map((f) => f.label).join(' | ')}`); });
// I3: unicode / odd ids
const u = base();
u.data[1].requirements = { 'é.1': { title: 'Accent', wcagSc: ['1.1.1'] }, '١': { title: 'Arabic digit' }, '': { title: 'empty id' }, ' ': { title: 'space id' }, 'a\u0000b': { title: 'nul' } };
u.data[1].ruleMap = { 'img-alt-present': { requirements: ['é.1', ''] } };
both('I3 odd requirement ids ("", " ", NUL, unicode)', u);
tryIt('I3 definePack', () => { const p = mkPack(sd.standardFromData(u)); return p.standard.composites().map((r) => r.id); });
// I4: key with dots in rule ids / version ids
const v = base(); v.versions = [{ version: '1.0', wcagVersion: '2.2' }, { version: '1.0.', wcagVersion: '2.2' }]; v.data = { '1.0': base().data[1], '1.0.': base().data[1] }; v.profiles = { 'base-1': { version: '1.0', tags: ['base'] } };
both('I4 versions "1.0" and "1.0."', v);
tryIt('I4 definePack + composites ids', () => mkPack(sd.standardFromData(v)).standard.composites().map((r) => r.id));
// I5: version ids that make rollup ids collide: "1-a" req "b" vs "1" req "a-b"
const w = base(); w.versions = [{ version: '1', wcagVersion: '2.2' }, { version: '1-a', wcagVersion: '2.2' }];
w.data = { 1: { requirements: { 'a-b': { title: 'x', wcagSc: ['1.1.1'] } }, ruleMap: { 'img-alt-present': { requirements: ['a-b'] } } }, '1-a': { requirements: { b: { title: 'y', wcagSc: ['1.1.1'] } }, ruleMap: { 'img-alt-present': { requirements: ['b'] } } } };
w.profiles = { 'base-1': { version: '1', tags: ['base'] } };
both('I5 rollup-id collision base-1-a-b', w);
tryIt('I5 definePack', () => mkPack(sd.standardFromData(w)).standard.composites().map((r) => r.id));
