'use strict';
// Policy outcomes: what a disallowed pass/notApplicable becomes, what note it
// carries, and how reporters read it; typos in allowedOutcomes.
const h = require('./h.js');
const { main, sub } = h.load();
const PAGE = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1><img src="a.png" alt="ok"></main></body></html>';
const cases = {
  'allowedOutcomes fail,cantTell': { policy: { allowedOutcomes: ['fail', 'cantTell'] } },
  'allowedOutcomes typo "passed"': { policy: { allowedOutcomes: ['passed', 'fail', 'cantTell', 'notApplicable'] } },
  'allowedOutcomes []': { policy: { allowedOutcomes: [] } },
  'allowedConfidence []': { policy: { allowedConfidence: [] } },
  'allowedConfidence typo': { policy: { allowedConfidence: ['hgh'] } },
  'inline contract strictOptions': { strictOptions: true, policyContract: { allowedOutcomes: ['passed'] } }
};
for (const [name, eo] of Object.entries(cases)) {
  h.setDom(PAGE);
  const r = h.capture(() => main.runDomRulesInPage('https://e.test/', null, eo, ['img-alt-present', 'page-title-present', 'video-caption']));
  if (r.error) { console.log(name, 'THROWS', r.error.message.slice(0, 120)); continue; }
  const j = sub('junit').renderJunitReport(r.value);
  const s = JSON.parse(sub('sarif').renderSarifReport(r.value)).runs[0];
  console.log(`## ${name}: ` + r.value.checksResults.map((c) => `${c.ruleId}=${c.outcome}/${c.confidence}${c.error ? ' error="' + c.error.slice(0, 70) + '"' : ''}`).join(' ; '));
  console.log(`   JUnit ${(j.match(/<testsuites[^>]*>/) || [''])[0]} | SARIF error notifications: ${((s.invocations || [{}])[0].toolExecutionNotifications || []).filter((x) => x.level === 'error').map((x) => x.message.text.slice(0, 80)).join(' / ')} | logs ${r.logs.length}`);
}
process.exit(0);
