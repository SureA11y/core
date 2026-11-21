// A pack whose namespace (and so its standard's ruleTag) is a tag core's rules carry.
const { definePack, ruleMappedStandard, checkPack } = require('/home/user/core-r8/src/pack.js');
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const core = require('/home/user/core-r8/src/index.js');
function mk(ns) {
  const std = ruleMappedStandard({ standard: 'S ' + ns, tag: ns, versions: [{ version: '1.0', wcagVersion: '2.2' }], requirements: { '1.0': { 'R.1': { title: 'Alt', wcagSc: ['1.1.1'] } } }, ruleMap: { '1.0': { 'img-alt-present': { requirements: ['R.1'] } } } });
  return { name: 'p-' + ns, version: '1.0.0', namespace: ns, core: '*', standard: { key: ns, standard: 'S ' + ns, versions: ['1.0'], profiles: { [ns + '-1.0']: { version: '1.0', tags: [ns], mappedRules: true } }, ruleTag: ns, ruleMapped: true, mappingsFor: std.mappingsFor, composites: std.composites, validate: std.validate } };
}
const html = '<html lang="en"><head><title>t</title></head><body><div><img src="a"><h1></h1><h3>x</h3></div></body></html>';
(async () => {
  console.warn = (...a) => console.log('  warn', String(a[0]).slice(0, 140)); console.info = () => {};
  const base = await runa11yCoreOnHtml(html, { runOnly: { bestPractices: true } });
  console.log('no pack: best practices ran', base.checksResults.length);
  for (const ns of ['best-practice', 'experimental', 'cat', 'accessibility', 'automatic', 'manual']) {
    const p = mk(ns);
    let def; try { definePack(p); def = 'define ok'; } catch (e) { def = 'define THROW ' + e.message.slice(0, 120); }
    console.log(ns, def, 'check', JSON.stringify(checkPack(p)).slice(0, 200));
    if (def !== 'define ok') continue;
    try {
      const r = await runa11yCoreOnHtml(html, { engineOptions: { packs: [p] }, runOnly: { bestPractices: true } });
      const r2 = await runa11yCoreOnHtml(html, { engineOptions: { packs: [p] } });
      const r0 = await runa11yCoreOnHtml(html, {});
      console.log('  with pack, bestPractices ran', r.checksResults.length, '| default scan ran', r2.checksResults.length, 'vs without pack', r0.checksResults.length, '| skippedPacks', JSON.stringify(r2.skippedPacks));
    } catch (e) { console.log('  THROW', e.code, e.message.slice(0, 200)); }
  }
})();
