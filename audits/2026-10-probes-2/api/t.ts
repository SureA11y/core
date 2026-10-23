import { runDomRulesInPage, CustomRule } from '/home/user/core/src/index';
runDomRulesInPage(null, null, {}, { type: 'rule', values: ['img-alt-present'] });
runDomRulesInPage(null, null, {}, { type: 'tag', values: 'wcag2a' });
const c: CustomRule = { id: 'x', runInPage: () => ({}) };
