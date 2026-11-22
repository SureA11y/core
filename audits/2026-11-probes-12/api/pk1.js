'use strict';
const H = require('./h.js'); const { checkPack, definePack, ruleMappedStandard, packScript } = H.pack;
function pack(over = {}, profOver = {}) {
  const std = ruleMappedStandard({ standard: 'Names', tag: 'nm', versions: [{ version: '1.0', wcagVersion: '2.2' }], requirements: { '1.0': { N1: { title: 'Named', wcagSc: ['1.1.1'] } } }, ruleMap: { '1.0': { 'img-alt-present': { requirements: ['N1'] }, 'nm-rule': { requirements: ['N1'] } } } });
  return Object.assign({ name: 'nm-pack', version: '1.0.0', namespace: 'nm', core: '*',
    rules: [{ id: 'nm-rule', meta: { title: 'T', description: 'd', tags: ['nm'], reasonCodes: ['OWN'] }, runInPage: function (ctx) { return { outcome: 'pass', occurrences: [] }; } }],
    standard: { key: 'nm', standard: 'Names', versions: ['1.0'], profiles: { 'nm-1.0': Object.assign({ version: '1.0', tags: ['nm'], mappedRules: true }, profOver) }, ruleTag: 'nm', ruleMapped: true, mappingsFor: std.mappingsFor, composites: std.composites, validate: std.validate } }, over);
}
const tryit = (n, fn) => { const W = console.warn; const w = []; console.warn = (...a) => w.push(String(a[0]).slice(0, 200)); try { const v = fn(); console.log(n, 'OK', JSON.stringify(v).slice(0, 300), w); } catch (e) { console.log(n, 'THROW', (e.code || '') + ' ' + e.message.slice(0, 300)); } finally { console.warn = W; } };
tryit('base checkPack', () => checkPack(pack()));
tryit('base define', () => !!definePack(pack()));
tryit('profile rules unknown', () => checkPack(pack({}, { rules: ['nm-nope'] })));
tryit('profile rules unknown define', () => !!definePack(pack({}, { rules: ['nm-nope'] })));
tryit('severity bad', () => definePack(pack({}, { severity: { 'nm-rule': 'huge' } })) && 'defined');
tryit('exclude.rules unknown', () => definePack(pack({}, { exclude: { rules: ['nm-nope'] } })) && 'defined');
tryit('profile field unknown', () => checkPack(pack({}, { colour: 'red' })));
tryit('profile tag no rule', () => checkPack(pack({}, { tags: ['nm', 'nobody'] })));
tryit('name with <script>', () => definePack(pack({ name: 'nm<script>' })) && 'defined');
tryit('version garbage', () => definePack(pack({ version: '1.0.0<x>' })) && 'defined');
// plain-object pack freeze
const plain = pack(); const html = H.page('<img src=a.png>');
const s1 = H.scan(html, { packs: [plain], profile: 'nm-1.0' }); console.log('plain scan', s1.err ? s1.err.message : JSON.stringify(s1.r.engine.packs), 'frozen?', Object.isFrozen(plain), Object.isFrozen(plain.rules), Object.isFrozen(plain.standard));
try { plain.version = '9.9.9'; console.log('mutation allowed', plain.version); } catch (e) { console.log('mutation throws', e.message.slice(0, 80)); }
try { plain.rules.push({}); console.log('rules push allowed', plain.rules.length); } catch (e) { console.log('rules push throws', e.message.slice(0, 80)); }
try { plain.standard.profiles['nm-1.0'].tags.push('x'); console.log('deep mutation allowed'); } catch (e) { console.log('deep mutation throws', e.message.slice(0, 80)); }
// A pack whose rule function is shared with caller code gets frozen? (freezing caller's function objects)
const shared = { cfg: { x: 1 } }; const p2 = pack({ rules: [{ id: 'nm-rule', meta: { title: 'T', description: 'd', tags: ['nm'], extra: shared.cfg }, runInPage: function () { return { outcome: 'pass', occurrences: [] }; } }] });
H.scan(html, { packs: [p2], profile: 'nm-1.0' }); console.log('caller object reachable from pack frozen?', Object.isFrozen(shared.cfg));
