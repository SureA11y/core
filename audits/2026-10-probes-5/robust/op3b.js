// OP-3 recheck with self-contained rule bodies; OP-2 with its profile selected.
'use strict';
const { pack, capture, scan, scanIP } = require('./r4/options/h.js');
const { mk, version } = require('./r4/options/p.js');
const vm = require('node:vm');
const o10 = { ['runInPage'](ctx) { return { outcome: 'fail', occurrences: [{ __node: ctx.document.body }] }; } };
const o11 = { runInPage: (ctx) => ({ outcome: 'fail', occurrences: [{ __node: ctx.document.body }] }) };
const cl = class { static runInPage(ctx) { return { outcome: 'fail', occurrences: [{ __node: ctx.document.body }] }; } };
const o14 = { ['run' + 'InPage'](ctx) { return { outcome: 'fail', occurrences: [{ __node: ctx.document.body }] }; } };
const o15 = { async runInPage(ctx) { return { outcome: 'fail' }; } };
const o16 = { 'runInPage'(ctx) { return { outcome: 'fail', occurrences: [{ __node: ctx.document.body }] }; } };
const o17 = { /*c*/ runInPage /*c*/ (ctx) { return { outcome: 'fail', occurrences: [{ __node: ctx.document.body }] }; } };
let i = 0;
for (const [n, fn] of [['computed literal', o10.runInPage], ['arrow', o11.runInPage], ['static class method', cl.runInPage], ['computed concat', o14.runInPage], ['async', o15.runInPage], ['quoted same name', o16.runInPage], ['comments around name', o17.runInPage]]) {
  const name = '@acme/r' + (++i);
  const d = capture(() => pack.definePack(mk({ name }, [{ id: 'acme-r', meta: { tags: ['acme'] }, runInPage: fn }])));
  if (!d.ok) { console.log('OP-3', n, ': definePack refuses:', d.msg.slice(0, 90)); continue; }
  const sc = capture(() => pack.packScript([d.v]));
  const reg = sc.ok ? capture(() => vm.runInThisContext(sc.v)) : sc;
  const ip = scanIP({ packs: [name + '@1.2.0'] }, ['acme-r']);
  const nd = scan({ packs: [d.v] }, ['acme-r']);
  const o = (r) => r.ok ? ((r.v.checksResults.find((c) => c.ruleId === 'acme-r') || {}).outcome || 'MISSING') + ' ' + String((r.v.checksResults.find((c) => c.ruleId === 'acme-r') || {}).error || '').slice(0, 60) : 'THROW ' + r.msg.slice(0, 60);
  console.log('OP-3', n, ': accepted; registration', reg.ok ? 'ok' : 'THROWS ' + reg.msg.slice(0, 80), '| page', o(ip), '| node', o(nd));
}
const p = { name: '@aaa/p', version: '1.2.0', namespace: 'aaa', core: '^' + version, profiles: { 'aaa-p': { tags: [] } },
  rules: [{ id: 'aaa-r', meta: { tags: ['aaa'], wcagSc: ['1.1.1'] }, runInPage: (ctx) => ({ outcome: 'fail', occurrences: [{ __node: ctx.document.body }] }) }] };
const d = pack.definePack(p);
for (const eo of [{ packs: [d], profile: 'aaa-p' }, { packs: [d] }]) { const s = scan(eo, eo.profile ? null : ['aaa-r']); console.log('OP-2', JSON.stringify(Object.keys(eo)), s.ok ? 'aaa-r=' + ((s.v.checksResults.find(c => c.ruleId === 'aaa-r') || {}).outcome) + ' skipped=' + JSON.stringify(s.v.skippedPacks || []).slice(0, 150) + ' rollups=' + s.v.rulesResults.filter(r => /1\.1\.1/.test(r.ruleId)).map(r => r.ruleId + ':' + r.outcome) : s.msg, s.warns.slice(0, 2)); }
