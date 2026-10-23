// A custom rule selected by its own tag adds the criteria it maps to -- unless the tag starts with "wcag".
const { JSDOM } = require('/home/user/core/node_modules/jsdom');
const core = require('/home/user/core/src/index.js');
const dom = new JSDOM('<!doctype html><html lang="en"><head><title>t</title></head><body><p>x</p></body></html>', { url: 'https://example.test/' });
global.window = dom.window; global.document = dom.window.document;
for (const tag of ['team', 'wcagteam']) {
  const customRules = [{ id: 'org-chart', meta: { title: 't', description: 'd', wcagSc: ['1.1.1'], tags: [tag] },
    runInPage: "function (ctx) { return { ruleId: ctx.rule.ruleId, outcome: 'fail', occurrences: [] }; }" }];
  const r = core.runDomRulesInPage('https://example.test/', null, { customRules }, { tags: [tag] });
  console.log(tag.padEnd(9), 'check:', r.checksResults.map((c) => c.ruleId + ':' + c.outcome + ' rollupIds=' + JSON.stringify(c.rollupIds)).join(','),
    '| rulesResults:', JSON.stringify(r.rulesResults.map((x) => x.ruleId + ':' + x.outcome)),
    '| listed:', JSON.stringify(core.getRulesForRunOnly({ tags: [tag] }, { customRules }).map((x) => x.id)));
}
