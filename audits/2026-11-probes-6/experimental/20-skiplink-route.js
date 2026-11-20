const { sd, base, mkPack, C } = require('./lib.js');
const { JSDOM } = require(C + '/node_modules/jsdom');
const { listenerHookScript } = require(C + '/src/index.js');
const { runa11yCoreOnDom } = require(C + '/tests/helpers/runDomRulesOnHtml.js');
const d = base();
d.data[1].requirements = { S1: { title: 'Skip links are present', wcagSc: ['2.4.1'] }, S2: { title: 'Skip links work', wcagSc: ['2.4.1'] } };
d.data[1].ruleMap = { 'skip-link': { requirements: ['S1'], findings: [{ when: { lean: 'fail' }, requirements: ['S2'], outcome: 'fail' }] } };
const p = mkPack(sd.standardFromData(d));
for (const hook of [false, true]) {
  const dom = new JSDOM('<!doctype html><html lang="en"><head><title>t</title></head><body><a href="#main">Skip to main content</a><nav><a href="/a">A</a></nav><div>x</div></body></html>', { runScripts: 'outside-only' });
  dom.window.document.querySelector('*');
  if (hook) dom.window.eval(listenerHookScript({ early: true }));
  const r = runa11yCoreOnDom(dom, { engineOptions: { packs: [p], profile: 'base-1' }, entryPointParity: false });
  const occ = r.checksResults.find((c) => c.ruleId === 'skip-link').occurrences[0];
  const rs = r.rulesResults.filter((x) => /^base-1-/.test(x.ruleId)).map((x) => `${x.ruleId}=${x.outcome}`);
  console.log(`listener hook ${hook ? 'on ' : 'off'}: details.lean=${occ.data.details.lean}  ->  ${rs.join(' ')}`);
}
