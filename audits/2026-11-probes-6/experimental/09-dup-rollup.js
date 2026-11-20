const { sd, base, mkPack, runa11yCoreOnHtml } = require('./lib.js');
const w = base(); w.versions = [{ version: '1', wcagVersion: '2.2' }, { version: '1-a', wcagVersion: '2.2' }];
w.data = { 1: { requirements: { 'a-b': { title: 'v1 a-b', wcagSc: ['1.1.1'] } }, ruleMap: { 'img-alt-present': { requirements: ['a-b'] } } },
           '1-a': { requirements: { b: { title: 'v1-a b', wcagSc: ['2.4.2'] } }, ruleMap: { 'page-title-present': { requirements: ['b'] } } } };
w.profiles = { 'base-1': { version: '1', tags: ['base'], mappedRules: true }, 'base-1-a': { version: '1-a', tags: ['base'], mappedRules: true } };
const p = mkPack(sd.standardFromData(w));
const html = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"></main></body></html>';
for (const profile of ['base-1', 'base-1-a']) {
  const r = runa11yCoreOnHtml(html, { engineOptions: { packs: [p], profile } });
  const rs = r.rulesResults.filter((x) => /^base-/.test(x.ruleId));
  console.log(profile, rs.map((x) => `${x.ruleId} "${x.title}" ${x.outcome}`).join(' ; '));
}
console.log('checkPack:', JSON.stringify(require('./lib.js').pack.checkPack(p)));
