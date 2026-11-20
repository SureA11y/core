const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const core = require('/home/user/core/src/index.js');
const tick = () => new Promise(r => setImmediate(r));
const html = '<html lang="en"><head><title>t</title></head><body><main><img src="a"><button></button></main></body></html>';
(async () => {
  const getterThrow = {}; Object.defineProperty(getterThrow, 'locale', { get() { throw new Error('getter boom'); }, enumerable: true });
  let reads = 0; const counting = {}; Object.defineProperty(counting, 'locale', { get() { reads++; return reads > 1 ? 'de' : 'en'; }, enumerable: true });
  const cases = {
    proxyThrowGet: new Proxy({}, { get() { throw new Error('proxy get boom'); } }),
    proxyThrowOwnKeys: new Proxy({}, { ownKeys() { throw new Error('ownKeys boom'); } }),
    proxyHas: new Proxy({ locale: 'de' }, { has() { throw new Error('has boom'); } }),
    getterThrow,
    counting,
    hugeExclude: { excludeSelectors: Array.from({ length: 200000 }, (_, i) => '.c' + i) },
    hugeProfileList: { profile: Array.from({ length: 5000 }, () => 'wcag22-aa') },
    hugeProfileDistinct: { profile: ['wcag20-a','wcag20-aa','wcag20-aaa','wcag21-a','wcag21-aa','wcag21-aaa','wcag22-a','wcag22-aa','wcag22-aaa','en301549-v3.2.1','en301549-v4.1.1','section508'] },
    protoPollute: JSON.parse('{"__proto__": {"strictOptions": true, "polluted": 1}, "locale": "fr"}'),
    rulesProto: { rules: JSON.parse('{"__proto__": {"exclude": ["img-alt-present"]}}') },
    contrastProto: { contrast: JSON.parse('{"__proto__": {"mode":"x"}}') },
    customRulesHuge: { customRules: Array.from({ length: 3000 }, (_, i) => ({ id: 'org-r' + i, meta: { title: 't', description: 'd', tags: ['wcag111'] }, runInPage() { return { outcome: 'pass', occurrences: [] }; } })) },
    frozenOpts: Object.freeze({ locale: 'de', contrast: Object.freeze({ mode: 'auto' }) }),
    symbolKey: { [Symbol('x')]: 1, locale: 'es' },
    numberKey: { 0: 'x' },
    nullProtoOpts: Object.assign(Object.create(null), { locale: 'ja' }),
  };
  for (const [name, eo] of Object.entries(cases)) {
    const t = Date.now(); let msg;
    try { const r = await runa11yCoreOnHtml(html, { engineOptions: eo }); msg = 'OK ' + JSON.stringify(r.engine.locale) + ' profiles=' + JSON.stringify(r.engine.profiles && r.engine.profiles.length) + ' n=' + r.checksResults.length + ' img=' + (r.checksResults.find(c => c.ruleId === 'img-alt-present') || {}).outcome + ' skippedCR=' + (r.skippedCustomRules||[]).length; } catch (e) { msg = 'THROW ' + (e.code || '') + ' ' + e.message.slice(0, 160); }
    console.log(name.padEnd(20), (Date.now() - t + 'ms').padEnd(8), msg);
    if (name === 'counting') console.log('   locale getter reads', reads);
    await tick();
  }
  console.log('Object.prototype polluted?', ({}).polluted, ({}).strictOptions);
})();
