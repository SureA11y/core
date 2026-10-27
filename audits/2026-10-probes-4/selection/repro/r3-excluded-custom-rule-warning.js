// A custom rule the caller explicitly excludes is warned about (and listed in skippedCustomRules)
// as "not selected ... to run one, name its id or one of its tags in runOnly".
const { JSDOM } = require('/home/user/core/node_modules/jsdom');
const core = require('/home/user/core/src/index.js');
const dom = new JSDOM('<!doctype html><html lang="en"><head><title>t</title></head><body><p>x</p></body></html>', { url: 'https://example.test/' });
global.window = dom.window; global.document = dom.window.document;
const mk = (id) => ({ id, meta: { title: id, description: id, wcagSc: ['1.1.1'], tags: ['org'] },
  runInPage: "function (ctx) { return { ruleId: ctx.rule.ruleId, outcome: 'pass', occurrences: [] }; }" });
const r = core.runDomRulesInPage('https://example.test/', null, { customRules: [mk('org-a'), mk('org-b')] },
  { includeRuleIds: ['org-a', 'org-b'], excludeRuleIds: ['org-b'] });
console.log('skippedCustomRules:', JSON.stringify(r.skippedCustomRules));
