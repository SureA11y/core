'use strict';
// definePack/checkPack validation edge cases: namespaces, ids, field types,
// hostile objects. Prints problems (or the thrown error) per case.
const { packApi, base, rule, report } = require('./lib.js');
const { checkPack } = packApi;

function probe(label, pack) {
  try {
    report(label, checkPack(pack));
  } catch (e) {
    report(label, `THROWS ${e.constructor.name}: ${e.message}`);
  }
}

for (const ns of ['', 'Acme', 'a-b', 'wcag', 'wcag2x', 'a11ycore', 'img', 'aria', 'automatic',
  'manual', 'atomic', 'best-practice', 'en301549', 'section508', 'constructor', '__proto__',
  'acmé', 'toString', 'hasownproperty', 'x'.repeat(500)]) {
  probe(`namespace ${JSON.stringify(ns.length > 40 ? ns.slice(0, 10) + '...' : ns)}`, base({ namespace: ns }));
}

probe('rule id not prefixed', base({ rules: [rule('other-x')] }));
probe('rule id exactly ns-', base({ rules: [rule('p-')] }));
probe('rule id with spaces', base({ rules: [rule('p- x y')] }));
probe('duplicate ids in one pack', base({ rules: [rule('p-a'), rule('p-a')] }));
probe('duplicate id rules vs variants', base({ rules: [rule('p-a')], variants: [rule('p-a', { from: 'contrast-minimum' })] }));
probe('rules is object', base({ rules: { a: 1 } }));
probe('rules is string', base({ rules: 'p-a' }));
probe('overrides string', base({ overrides: 'img-alt-present' }));
probe('profiles array', base({ profiles: [] }));
probe('rollups object', base({ rollups: {} }));
probe('dictionaries array', base({ dictionaries: [] }));
probe('version 1.0', base({ version: '1.0' }));
probe('version 1.0.0garbage', base({ version: '1.0.0garbage' }));
probe('name whitespace', base({ name: '   ' }));
probe('name with @version-like', base({ name: 'a@1.0.0' }));
probe('rule with meta not object', base({ rules: [{ id: 'p-a', meta: 'x', runInPage() {} }] }));
probe('rule with severity garbage', base({ rules: [{ id: 'p-a', meta: { defaultSeverity: 'urgent' }, runInPage() {} }] }));
probe('rule with type garbage', base({ rules: [{ id: 'p-a', meta: { type: 'robot' }, runInPage() {} }] }));
probe('runInPage async', base({ rules: [{ id: 'p-a', async runInPage() {} }] }));
probe('runInPage is class', base({ rules: [{ id: 'p-a', runInPage: class {} }] }));
probe('frozen pack', Object.freeze(base({ rules: [Object.freeze(rule('p-a'))] })));

// hostile objects
const throwing = base();
Object.defineProperty(throwing, 'rules', { enumerable: true, get() { throw new Error('getter boom'); } });
probe('getter that throws', throwing);
probe('Proxy throwing on ownKeys', new Proxy(base(), { ownKeys() { throw new Error('ownKeys boom'); } }));
const cyc = base({ rules: [rule('p-a')] });
cyc.rules[0].data = { self: null };
cyc.rules[0].data.self = cyc.rules[0].data;
probe('cyclic rule.data (checkPack only)', cyc);
const viaJson = JSON.parse('{"name":"p","version":"1.0.0","namespace":"p","core":"*","__proto__":{"polluted":true}}');
probe('JSON __proto__ top-level key', viaJson);
probe('profile named __proto__ via JSON', JSON.parse('{"name":"p","version":"1.0.0","namespace":"p","core":"*","profiles":{"__proto__":{"tags":[]}}}'));
probe('profile name without namespace', base({ profiles: { 'wcag22-aa': { tags: [] } } }));
probe('profile name with spaces', base({ profiles: { 'my profile': { tags: [] } } }));
probe('rollup checksIds unknown (checkPack)', base({ rollups: [{ id: 'p-r', title: 'R', checksIds: ['nope'] }] }));
probe('locale zh-Hant-TW', base({ dictionaries: { 'zh-Hant-TW': {} } }));
probe('locale EN', base({ dictionaries: { EN: {} } }));
probe('locale __proto__ via JSON', JSON.parse('{"name":"p","version":"1.0.0","namespace":"p","core":"*","dictionaries":{"__proto__":{"x":"y"}}}'));
probe('dict key __proto__ via JSON', JSON.parse('{"name":"p","version":"1.0.0","namespace":"p","core":"*","dictionaries":{"en":{"__proto__":"x"}}}'));
probe('dict key not namespaced', base({ dictionaries: { en: { foo_title: 'x' } } }));
probe('severity profile value number', base({ profiles: { 'p-1': { tags: [], severity: { 'img-alt-present': 3 } } } }));
probe('profile exclude garbage', base({ profiles: { 'p-1': { tags: [], exclude: 'region' } } }));
probe('profile exclude rules not array', base({ profiles: { 'p-1': { tags: [], exclude: { rules: 'region' } } } }));
probe('probes readBy string', base({ rules: [rule('p-a')], probes: { 'a.b': { description: 'd', readBy: 'p-a' } } }));
probe('standard: {}', base({ standard: {} }));
probe('null pack', null);
probe('array pack', []);
probe('string pack', 'acme@1.0.0');
