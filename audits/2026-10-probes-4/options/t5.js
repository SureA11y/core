const { scan, scanIP, pack, core, capture } = require('./h.js');
const { mk, version } = require('./p.js');
const strip = (v) => JSON.stringify(v, (k, x) => (k === 'perfStats' ? undefined : x));
const base1 = scan({}).v; 
const mkPack = (ns, extra = {}) => pack.definePack(mk({ name: '@' + ns + '/p', namespace: ns, ...extra }, [
  { id: ns + '-r', meta: { title: ns, tags: [ns], wcagSc: ['1.1.1'] }, runInPage(ctx) { return { outcome: 'fail', occurrences: [{ __node: ctx.document.body }] }; } },
  { id: ns + '-always', meta: { title: ns + ' always', tags: ['best-practice'] }, runInPage(ctx) { return { outcome: 'fail', occurrences: [{ __node: ctx.document.body }] }; } }
]));
const A = mkPack('aaa', { profiles: { 'aaa-p': { tags: [], rules: ['img-alt-present'], wcagVersion: '2.0', severity: { 'img-alt-present': 'critical' } } }, rollups: [{ id: 'aaa-items', title: 'Items', checksIds: ['img-alt-present', 'aaa-r'] }] });
const B = mkPack('bbb', { profiles: { 'bbb-p': { tags: ['wcag2a'] } }, rollups: [{ id: 'bbb-items', title: 'B', checksIds: ['bbb-r'] }] });
const rA = scan({ packs: [A], profile: 'aaa-p' }).v;
const rAB = scan({ packs: [A, B], profile: 'aaa-p' });
const rBA = scan({ packs: [B, A], profile: 'aaa-p' });
console.log('AB==BA', rAB.ok && rBA.ok && strip(rAB.v) === strip(rBA.v), rAB.ok ? '' : rAB.msg);
console.log('A profile wcag', rA.engine.wcagVersion, rA.engine.profile, rA.checksResults.map((c) => c.ruleId + ':' + c.outcome + ':' + c.severity).join(' '));
const after = scan({}).v;
console.log('no-pack after packs == before', strip(after) === strip(base1));
// profile from pack B used with only A passed
const rx = scan({ packs: [A], profile: 'bbb-p' }); console.log('profile of other pack', rx.ok ? rx.v.engine.profile : rx.msg, rx.warns.slice(0,2));
// equal copies (not same object) -> new engine each time?
const mkA = () => mkPack('aaa', { profiles: { 'aaa-p': { tags: [], rules: ['img-alt-present'] } } });
let t = Date.now(); for (let i = 0; i < 20; i++) scan({ packs: [mkA()] }); console.log('20 equal copies ms', Date.now() - t);
const one = mkA(); t = Date.now(); for (let i = 0; i < 20; i++) scan({ packs: [one] }); console.log('20 same obj ms', Date.now() - t);
// determinism with packs
const d1 = scan({ packs: [A, B], timestamp: 'x' }).v, d2 = scan({ packs: [A, B], timestamp: 'x' }).v;
console.log('deterministic packs', strip(d1) === strip(d2));
// in-page after node packs: core runa11yCoreInPage with names not registered
const ip = scanIP({ packs: ['@aaa/p@1.2.0'] }); console.log('inpage unregistered', ip.ok ? ip.v.skippedPacks : ip.msg);
// wcagVersion in profile vs explicit
console.log('explicit wins', scan({ packs: [A], profile: 'aaa-p', wcagVersion: '2.2' }).v.engine.wcagVersion);
console.log('explicit invalid', (() => { const r = scan({ packs: [A], profile: 'aaa-p', wcagVersion: '3.0' }); return [r.v.engine.wcagVersion, r.warns]; })());
console.log('explicit 2.1 num', (() => { const r = scan({ packs: [A], profile: 'aaa-p', wcagVersion: 2.1 }); return [r.v.engine.wcagVersion, r.warns]; })());
// profile case-insensitive with pack?
console.log('profile AAA-P', (() => { const r = scan({ packs: [A], profile: 'AAA-P' }); return [r.v.engine.profile, r.v.engine.wcagVersion, r.warns]; })());
// cache LRU eviction > 16 then strict skip
const bad = mk({ name: '@bad/p', namespace: 'bad', core: '^0.1.0' }, [{ id: 'bad-r', meta: { tags: ['bad'] }, runInPage() { return { outcome: 'pass' }; } }]);
const badP = pack.definePack(bad);
const r1 = scan({ packs: [badP] }); console.log('bad core range', r1.v.skippedPacks);
const r2 = scan({ packs: [badP], strictOptions: true }); console.log('strict after cache', r2.ok, r2.code, r2.msg);
// customRules overriding a pack rule
const rc = scan({ packs: [A], profile: 'aaa-p', customRules: [{ id: 'aaa-r', meta: { tags: ['aaa'] }, runInPage() { return { outcome: 'pass' }; } }] });
console.log('custom over pack', rc.ok ? [rc.v.overriddenBuiltinIds, rc.v.checksResults.find(c=>c.ruleId==='aaa-r')?.outcome] : rc.msg, rc.warns.slice(0,2));
