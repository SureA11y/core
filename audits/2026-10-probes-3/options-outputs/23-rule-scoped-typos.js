'use strict';
// rules[ruleId].excludeSelectors keyed by a rule id that names no rule (a
// typo, another case): checked by nothing, strictOptions included. And
// reporter options with a value outside their set.
const h = require('./h.js');
const { main, sub } = h.load();
const PAGE = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img class="ad" src="a.png"></main></body></html>';
for (const key of ['img-alt-present', 'img-alt-presnt', 'IMG-ALT-PRESENT', 'a11ycore-img-alt-present']) {
  for (const strict of [false, true]) {
    const r = h.scan(PAGE, { engineOptions: { strictOptions: strict, rules: { [key]: { excludeSelectors: ['.ad'] } } }, runOnly: ['img-alt-present'] });
    console.log(`rules[${JSON.stringify(key)}] strict=${strict}:`, r.error ? 'THROWS ' + r.error.message.slice(0, 80) : `img-alt-present ${r.value.checksResults[0].outcome}`, r.logs.length ? '| ' + r.logs.join('|').slice(0, 100) : '| no warning');
  }
}
h.setDom('<!doctype html><html><body><img src="a.png"><video src="v.mp4"></video></body></html>');
const res = main.runDomRulesInPage('u', null, {}, ['img-alt-quality', 'video-caption', 'img-alt-present']);
for (const v of ['failure', 'Failure', 'fail', true]) {
  const j = sub('junit').renderJunitReport(res, { cantTellAs: v });
  console.log(`junit cantTellAs ${JSON.stringify(v)}:`, (j.match(/<testsuites[^>]*>/) || [''])[0]);
}
process.exit(0);
