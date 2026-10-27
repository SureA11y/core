// A standard's rollup id with the legacy "a11ycore-" prefix (documented as accepted)
// does not select the opt-in rules it groups; the all-caps spelling does.
const { JSDOM } = require('/home/user/core/node_modules/jsdom');
const core = require('/home/user/core/src/index.js');
const pack = require('/home/user/core/tests/fixtures/packs/sample.js');
const dom = new JSDOM('<!doctype html><html lang="en"><head><title>t</title></head><body><p>x</p></body></html>', { url: 'https://example.test/' });
global.window = dom.window; global.document = dom.window.document;
for (const id of ['sample-1.0-S6', 'A11YCORE-SAMPLE-1.0-S6', 'a11ycore-sample-1.0-S6']) {
  const r = core.runDomRulesInPage('https://example.test/', null, { packs: [pack] }, { includeRuleIds: [id] });
  console.log(id.padEnd(26), 'checks:', r.checksResults.map((c) => c.ruleId + ':' + c.outcome).join(',') || '(none)',
    '| rollups:', r.rulesResults.map((x) => x.ruleId + ':' + x.outcome).join(','));
}
