'use strict';
// Packs that pass checkPack but may break preparation or a scan: what the
// scan does with them (runs, skips with reason, or throws).
const { scan, quiet, base, rule, outcome, report, packApi } = require('./lib.js');

function run(label, packs, opts = {}, runOnly) {
  const { r, error, warnings } = quiet(() => scan({ packs, ...opts }, { runOnly }));
  if (error) return report(label, `THROWS ${error.constructor.name}: ${error.message.slice(0, 400)}`);
  report(label, {
    packs: r.engine.packs,
    skipped: r.skippedPacks,
    warnings: warnings.slice(0, 3).map((w) => w.slice(0, 300)),
    n: r.checksResults.length,
    ...(opts.show ? { show: opts.show(r) } : {})
  });
  return r;
}

run('ns img, rule img-alt-present without overrides', [base({ name: 'i', namespace: 'img', rules: [rule('img-alt-present')] })]);
run('duplicate ids in one pack', [base({ rules: [rule('p-a'), rule('p-a')] })]);
run('rule id "p-" (empty after ns)', [base({ rules: [rule('p-')] })]);
run('rule id with spaces', [base({ rules: [rule('p- x y')] })], { show: (r) => r.checksResults.filter((c) => c.ruleId.startsWith('p-')).map((c) => [c.ruleId, c.outcome]) });
run('meta not object', [base({ rules: [{ id: 'p-a', meta: 'x', runInPage: () => ({ outcome: 'pass' }) }] })], { show: (r) => outcome(r, 'p-a') });
run('defaultSeverity urgent', [base({ rules: [{ id: 'p-a', meta: { defaultSeverity: 'urgent' }, runInPage: () => ({ outcome: 'fail', occurrences: [{ __node: global.document.body }] }) }] })], { show: (r) => r.checksResults.filter((c) => c.ruleId === 'p-a').map((c) => [c.outcome, c.severity]) });
run('type robot', [base({ rules: [{ id: 'p-a', meta: { type: 'robot' }, runInPage: () => ({ outcome: 'pass' }) }] })], { show: (r) => r.checksResults.filter((c) => c.ruleId === 'p-a').map((c) => [c.outcome, c.type]) });
run('profile named wcag22-aa', [base({ profiles: { 'wcag22-aa': { tags: [] } } })]);
run('profile named like other pack ns', [base({ profiles: { 'zzz-1': { tags: ['wcag2a'] } } })]);
run('profile __proto__ (JSON)', [JSON.parse('{"name":"p","version":"1.0.0","namespace":"p","core":"*","profiles":{"__proto__":{"tags":["wcag2a"]}}}')], { profile: '__proto__', show: (r) => [r.engine.profile, r.checksResults.length] });
run('dict key __proto__ (JSON)', [JSON.parse('{"name":"p","version":"1.0.0","namespace":"p","core":"*","dictionaries":{"en":{"__proto__":"x"}}}')]);
run('dict key constructor', [base({ dictionaries: { en: { constructor: 'x' } } })]);
run('dict key hasOwnProperty', [base({ dictionaries: { en: { hasOwnProperty: 'x' } } })]);
run('severity value number', [base({ profiles: { 'p-1': { tags: [], severity: { 'img-alt-present': 3 } } } })]);
run('profile exclude string', [base({ profiles: { 'p-1': { tags: ['wcag2a'], exclude: 'region' } } })], { profile: 'p-1', show: (r) => [r.engine.profile, r.checksResults.length] });
run('profile exclude rules string', [base({ profiles: { 'p-1': { tags: ['wcag2a'], exclude: { rules: 'img-alt-present' } } } })], { profile: 'p-1', show: (r) => [r.engine.profile, outcome(r, 'img-alt-present')] });
run('profile exclude unknown rule', [base({ profiles: { 'p-1': { tags: ['wcag2a'], exclude: { rules: ['nope'] } } } })], { profile: 'p-1', show: (r) => r.engine.profile });
run('profile exclude criteria garbage', [base({ profiles: { 'p-1': { tags: ['wcag2a'], exclude: { criteria: ['9.9.9'] } } } })], { profile: 'p-1', show: (r) => r.engine.profile });
run('standard: {}', [base({ standard: {} })]);
run('standard: { key: "p" } only', [base({ standard: { key: 'p' } })]);
run('cyclic rule.data', (() => { const p = base({ rules: [rule('p-a')] }); p.rules[0].data = {}; p.rules[0].data.self = p.rules[0].data; return [p]; })());
let hits = 0;
const throwing = base({ name: 'thrower' });
Object.defineProperty(throwing, 'rules', { enumerable: true, get() { hits++; throw new Error('getter boom'); } });
run('getter that throws (non-strict)', [throwing]);
run('Proxy ownKeys throws (non-strict)', [new Proxy(base({ name: 'proxy' }), { ownKeys() { throw new Error('ownKeys boom'); } })]);
// version with garbage suffix: reported version
run('version 1.0.0garbage', [base({ version: '1.0.0garbage', rules: [rule('p-a')] })], { show: (r) => r.engine.packs });
// name with @ => name@version ambiguity
run('name a@1.0.0', [base({ name: 'a@1.0.0', rules: [rule('p-a')] })], { show: (r) => r.engine.packs });
// two packs with the same namespace, different names, disjoint ids
run('two packs same namespace disjoint ids', [base({ name: 'n1', rules: [rule('p-a')] }), base({ name: 'n2', rules: [rule('p-b')] })], { show: (r) => [outcome(r, 'p-a'), outcome(r, 'p-b')] });
// two checklists, same namespace
run('two checklists same namespace', [base({ name: 'c1', rollups: [{ id: 'p-r1', title: 'R', checksIds: ['region'] }] }), base({ name: 'c2', rollups: [{ id: 'p-r2', title: 'R', checksIds: ['region'] }] })]);
// overlapping namespaces a / a-b
run('namespaces a and a-b', [base({ name: 'a', namespace: 'a', rules: [rule('a-b-x')] }), base({ name: 'ab', namespace: 'a-b', rules: [rule('a-b-x')] })]);
// pack rule id collides with core rollup id
run('rule id equal to a core rollup id', [base({ name: 'w', namespace: 'wcag-x' })]);
// rollup id collides with a rule id of the same pack
run('rollup id equal to pack rule id', [base({ rules: [rule('p-a')], rollups: [{ id: 'p-a', title: 'A', checksIds: ['p-a'] }] })], { profile: undefined });
