// OP-1..OP-7 rechecks (jsdom, Node API).
'use strict';
const { pack, capture, scan, scanIP } = require('./r4/options/h.js');
const { mk, version } = require('./r4/options/p.js');
const vm = require('node:vm');
const out = (...a) => console.log(...a);
// OP-1: every option from the round-4 list, wrong type, no strict
const bad = { locale: 5, excludeSelectors: 5, mappings: 5, messages: 5, policyContract: 5, policy: 5, output: 5, contrast: 5, rules: 5, tags: 5, tests: 5, visibilityMode: 5,
  'output.detail': { output: { detail: 'finding' } }, 'contrast.mode': { contrast: { mode: 'auditor' } }, 'contrast.rootCanvasFallback': { contrast: { rootCanvasFallback: 5 } },
  'policy.allowedOutcomes': { policy: { allowedOutcomes: 'pass' } }, pingWaitTime: 'x', frameWaitTime: 'x', styleSheetTexts: 5, packs: 5, customRules: 5, optInRules: 5, profile: 5, includeHiddenElements: 'yes' };
const silent = [];
for (const [k, v] of Object.entries(bad)) { const eo = (v && typeof v === 'object') ? v : { [k]: v }; const r = scan(eo); if (r.ok && !r.warns.length) silent.push(k); if (!r.ok) silent.push(k + '(THROWS ' + r.msg.slice(0, 60) + ')'); }
out('OP-1 silent or throwing:', silent.length ? silent : 'none');
// OP-2
{
  const p = { name: '@aaa/p', version: '1.2.0', namespace: 'aaa', core: '^' + version, profiles: { 'aaa-p': { tags: [] } },
    rules: [{ id: 'aaa-r', meta: { tags: ['aaa'], wcagSc: ['1.1.1'] }, runInPage: () => ({ outcome: 'pass' }) }] };
  const d = capture(() => pack.definePack(p));
  const cp = d.ok ? pack.checkPack(d.v) : null;
  const s = d.ok ? scan({ packs: [d.v] }) : null;
  out('OP-2 definePack', d.ok ? 'ok' : 'THROWS ' + d.msg.slice(0, 160), '| checkPack', JSON.stringify(cp).slice(0, 200), '| scan skippedPacks', s && s.ok ? JSON.stringify(s.v.skippedPacks || []).slice(0, 200) : s && s.msg, '| aaa-r ran:', s && s.ok && !!s.v.checksResults.find(c => c.ruleId === 'aaa-r'));
}
// OP-3
{
  const fail = (ctx) => ({ outcome: 'fail', occurrences: [{ __node: ctx.document.body }] });
  const s = Symbol('k'); const o5 = { [s](ctx) { return fail(ctx); } };
  const o6 = { runInPage(ctx) { return fail(ctx); } }; Object.defineProperty(o6.runInPage, 'name', { value: 'other' });
  const g = Object.getOwnPropertyDescriptor({ get x() { return { outcome: 'fail' }; } }, 'x').get;
  const K = 'run'; const o7 = { [K + 'X'](ctx) { return fail(ctx); } };
  const o8 = { 'quoted name'(ctx) { return fail(ctx); } };
  const o9 = { async *gen(ctx) {} };
  const o10 = { ['runInPage'](ctx) { return fail(ctx); } };
  const o11 = { runInPage: (ctx) => fail(ctx) };
  const o12 = { 123(ctx) { return fail(ctx); } };
  const cl = class { static runInPage(ctx) { return fail(ctx); } };
  const o13 = { 'a b'(ctx) { return fail(ctx); } };
  const bound = function f(ctx) { return fail(ctx); }.bind(null);
  for (const [n, fn] of [['symbol', o5[s]], ['renamed', o6.runInPage], ['getter', g], ['computed', o7.runX], ['quoted', o8['quoted name']], ['async gen', o9.gen], ['computed literal', o10.runInPage], ['arrow', o11.runInPage], ['numeric key', o12[123]], ['static class method', cl.runInPage], ['U+2028 key', o13['a b']], ['bound', bound]]) {
    const d = capture(() => pack.definePack(mk({}, [{ id: 'acme-r', meta: { tags: ['acme'] }, runInPage: fn }])));
    if (!d.ok) { out('OP-3', n, ': definePack refuses'); continue; }
    const sc = capture(() => pack.packScript([d.v]));
    if (!sc.ok) { out('OP-3', n, ': packScript THROWS', sc.msg.slice(0, 100)); continue; }
    const reg = capture(() => vm.runInThisContext(sc.v));
    const ip = scanIP({ packs: ['@acme/a11y-rules@1.2.0'] }, ['acme-r']);
    const nd = scan({ packs: [d.v] }, ['acme-r']);
    const o = (r) => r.ok ? ((r.v.checksResults.find((c) => c.ruleId === 'acme-r') || {}).outcome || 'MISSING') : 'THROW ' + r.msg.slice(0, 60);
    out('OP-3', n, ': accepted; registration', reg.ok ? 'ok' : 'THROWS ' + reg.msg.slice(0, 80), '| page', o(ip), '| node', o(nd), o(ip) !== o(nd) ? 'MISMATCH' : '');
  }
}
// OP-4
for (const v of [NaN, Infinity, -Infinity, 0, -1, '4.5', null, 1e308, 4.5000001, 21, 22, 1]) {
  const d = capture(() => pack.definePack(mk({ variants: [{ id: 'acme-cv', from: 'contrast-minimum', config: { normalTextRatio: v }, meta: { tags: ['acme'], i18n: { titleKey: 't' } } }] }, [])));
  out('OP-4 normalTextRatio', String(v), d.ok ? 'ACCEPTED' : 'refused: ' + d.msg.slice(0, 120));
}
// OP-6
{
  const r = capture(() => require('/home/user/core/src/index.js').runDomRulesInPage(null, null, { strictOptions: true, packs: [pack.definePack(mk({ core: '^0.1.0' }))] }));
  out('OP-6 strict pack error code:', r.ok ? 'no throw' : r.code, r.ok ? '' : r.msg.slice(0, 100));
  for (const [n, eo] of [['name string', { strictOptions: true, packs: ['@nope/x'] }], ['dup', { strictOptions: true, packs: [pack.definePack(mk()), pack.definePack(mk())] }]]) {
    require('./r4/options/h.js').setup();
    const q = capture(() => require('/home/user/core/src/index.js').runDomRulesInPage(null, null, eo));
    out('OP-6', n, q.ok ? 'no throw' : q.code);
  }
}
// OP-7
for (const v of [Symbol('s'), 10n, () => 1, 'yes', 1, null]) { const r = scan({ strictOptions: v }); out('OP-7 strictOptions', typeof v, r.ok ? JSON.stringify(r.warns.filter(w => /strictOptions/.test(w))) : 'THROWS ' + r.msg); }
