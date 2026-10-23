// A rule-mapped standard with no rules of its own: its tag is on its rollups only.
// tags: [<tag>] alone throws "no tag named"; beside another tag it is warned "ignored"
// yet it selects (and reports) the standard's rollups.
const { JSDOM } = require('/home/user/core/node_modules/jsdom');
const core = require('/home/user/core/src/index.js');
const { definePack, ruleMappedStandard } = require('/home/user/core/src/pack.js');
const VERSIONS = [{ version: '1.0', wcagVersion: '2.2' }];
const std = ruleMappedStandard({ standard: 'Probe Standard', tag: 'probe', versions: VERSIONS,
  requirements: { '1.0': { P1: { title: 'Images', wcagSc: ['1.1.1'] } } },
  ruleMap: { '1.0': { 'img-alt-present': { requirements: ['P1'], note: 'n' } } } });
const pack = definePack({ name: 'probe-pack', version: '1.0.0', namespace: 'probe', core: '*',
  standard: { key: 'probe', standard: 'Probe Standard', versions: ['1.0'],
    profiles: { 'probe-1.0': { version: '1.0', tags: ['probe'], mappedRules: true } },
    ruleTag: 'probe', ruleMapped: true, mappingsFor: std.mappingsFor, composites: std.composites, validate: std.validate } });
const dom = new JSDOM('<!doctype html><html lang="en"><head><title>t</title></head><body><img src="a.png"><a href="/x"></a></body></html>', { url: 'https://example.test/' });
global.window = dom.window; global.document = dom.window.document;
const { warn } = console; const warned = []; console.warn = (m) => warned.push(m);
for (const runOnly of [{ tags: ['probe'] }, { tags: ['probe', 'wcag244'] }]) {
  warned.length = 0;
  try {
    const r = core.runDomRulesInPage('https://example.test/', null, { packs: [pack] }, runOnly);
    console.log(JSON.stringify(runOnly), 'rollups:', r.rulesResults.map((x) => x.ruleId + ':' + x.outcome).join(','), '| warned:', warned);
  } catch (e) { console.log(JSON.stringify(runOnly), 'THROWS', e.code, e.message); }
}
console.warn = warn;
