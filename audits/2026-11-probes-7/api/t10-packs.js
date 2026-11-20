const P = require('/home/user/core/src/pack.js');
const base = () => ({ name: 'acme-pack', version: '1.0.0', namespace: 'acme', core: '>=1.10.0', rules: [{ id: 'acme-r', meta: { title: 'R', description: 'd', tags: ['acme','wcag111','wcag2a'], wcagSc: ['1.1.1'] }, runInPage() { return { outcome: 'pass', occurrences: [] }; } }], dictionaries: { en: {} } });
const cases = {
  ok: base(),
  nsProto: { ...base(), namespace: '__proto__' },
  nsConstructor: { ...base(), namespace: 'constructor', rules: [] },
  nsUpper: { ...base(), namespace: 'Acme' },
  nsWcag: { ...base(), namespace: 'wcag', rules: [] },
  nsCoreTag: { ...base(), namespace: 'best-practice', rules: [] },
  nsEmpty: { ...base(), namespace: '' },
  versionBad: { ...base(), version: 'banana' },
  coreBad: { ...base(), core: '>=x' },
  coreFuture: { ...base(), core: '>=9.0.0' },
  coreHuge: { ...base(), core: '^1.0.0 || '.repeat(5000) + '^1.0.0' },
  nameHtml: { ...base(), name: '<img src=x onerror=alert(1)>' },
  dictProto: { ...base(), dictionaries: JSON.parse('{"en":{},"__proto__":{"x":"y"}}') },
  dictKeyProto: { ...base(), dictionaries: { en: JSON.parse('{"__proto__":"x"}') } },
  dictLocaleBad: { ...base(), dictionaries: { en: {}, 'zz-<b>': { a: 'b' } } },
  ruleIdOutsideNs: { ...base(), rules: [{ ...base().rules[0], id: 'other-r' }] },
  ruleIdCore: { ...base(), rules: [{ ...base().rules[0], id: 'img-alt-present' }] },
  ruleIdUpper: { ...base(), rules: [{ ...base().rules[0], id: 'acme-R' }] },
  ruleDup: { ...base(), rules: [base().rules[0], base().rules[0]] },
  rulesHuge: { ...base(), rules: Array.from({ length: 3000 }, (_, i) => ({ ...base().rules[0], id: 'acme-r' + i })) },
  getterThrows: (() => { const p = base(); Object.defineProperty(p, 'rules', { get() { throw new Error('boom'); }, enumerable: true }); return p; })(),
  proxyThrows: new Proxy(base(), { get(t, k) { if (k === 'standard') throw new Error('proxy boom'); return t[k]; } }),
  proxyOwnKeysThrow: new Proxy(base(), { ownKeys() { throw new Error('ownKeys boom'); } }),
  notObject: 'pack',
  arr: [],
  nullProto: Object.assign(Object.create(null), base()),
  frozenRules: { ...base(), rules: Object.freeze(base().rules) },
  extraKey: { ...base(), nmae: 'x' },
};
for (const [k, p] of Object.entries(cases)) {
  let cp, dp, desc;
  const t = Date.now();
  try { cp = P.checkPack(p); } catch (e) { cp = 'THROW ' + e.message.slice(0, 100); }
  try { P.definePack(p); dp = 'ok'; } catch (e) { dp = 'THROW ' + (e.code || '') + ' ' + e.message.slice(0, 140); }
  try { desc = P.describePacks([p]); desc = JSON.stringify(desc).slice(0, 120); } catch (e) { desc = 'THROW ' + e.message.slice(0, 100); }
  console.log(k.padEnd(18), Date.now() - t + 'ms', '| check', JSON.stringify(cp).slice(0, 160), '| define', dp.slice(0, 160));
}
