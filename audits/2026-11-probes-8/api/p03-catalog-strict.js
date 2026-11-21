const core = require('/home/user/core-r8/src/index.js');
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const html = '<html lang="en"><head><title>t</title></head><body><main><img src="a"></main></body></html>';
const S = (o) => Object.assign({ strictOptions: true }, o);
const cases = {
  mapUnknown: S({ mappings: ['nope'] }),
  optInUnknown: S({ optInRules: ['nope'] }),
  exclBad: S({ excludeSelectors: ['main['] }),
  ruleExclBad: S({ rules: { 'img-alt-present': { excludeSelectors: ['[[['] } } }),
  policyContractBad: S({ policyContract: 'nope' }),
  unknownRuleKey: S({ rules: { 'no-such-rule': { x: 1 } } }),
  rootCanvasBad: S({ contrast: { rootCanvasFallback: 'inherit' } }),
  profileUnknown: S({ profile: 'nope' }),
  packsStr: S({ packs: 'x' }),
  excludeHole: S({ excludeSelectors: [, 'main'] }),
};
const fns = {
  getChecksCatalog: eo => core.getChecksCatalog(eo),
  getRulesCatalog: eo => core.getRulesCatalog(eo),
  getCheckDefById: eo => core.getCheckDefById('img-alt-present', eo),
  getCompositeRuleById: eo => core.getCompositeRuleById('wcag-1.1.1', eo),
  getChecksForRunOnly: eo => core.getChecksForRunOnly(null, eo),
  getRulesForRunOnly: eo => core.getRulesForRunOnly(null, eo),
  getTestsForRunOnly: eo => core.getTestsForRunOnly(null, eo),
};
(async () => {
  console.warn = () => {};
  for (const [k, eo] of Object.entries(cases)) {
    let scan;
    try { await runa11yCoreOnHtml(html, { engineOptions: eo }); scan = 'ok'; } catch (e) { scan = 'THROW'; }
    const row = Object.entries(fns).map(([n, f]) => { try { f(eo); return n.replace(/^get/,'') + ':ok'; } catch (e) { return n.replace(/^get/,'') + ':THROW'; } });
    console.log(k.padEnd(18), 'scan:' + scan, row.join(' '));
  }
})();
