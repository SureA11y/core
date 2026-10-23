const L = require('./lib'); const { core, packApi } = L;
const pack = packApi.definePack({ name: 'px', version: '1.0.0', namespace: 'px', title: 'PX', core: '*',
  profiles: { 'px-a': { tags: [], rules: ['link-name-present'], exclude: { rules: ['link-name-quality'] } },
              'px-b': { tags: [], rules: ['link-name-present', 'link-name-quality'], exclude: { criteria: ['2.4.4'] } } } });
for (const p of ['px-a', 'px-b']) {
  const s = L.scan(null, { packs: [pack], profile: p }, '<!doctype html><html lang="en"><head><title>t</title></head><body><main><a href="/x">Home</a></main></body></html>');
  const r = s.value;
  console.log(p, r.checksResults.map((c) => c.ruleId + ':' + c.outcome).join(','));
  for (const x of r.rulesResults) console.log('  ', x.ruleId, x.outcome, x.data.details.reasonCode, JSON.stringify(x.data.details.contributors.filter((c) => c.outcome === 'missing').map((c) => c.testId + (c.notSelected ? '(ns)' : ''))));
}
