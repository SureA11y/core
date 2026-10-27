'use strict';
const C = '/home/user/core';
const { runa11yCoreOnHtml } = require(C + '/src/testing.js');
const { renderJunitReport } = require(C + '/src/junit.js');
const { renderHtmlReport } = require(C + '/src/report.js');
const PAGE = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><p style="color:#767676;background:#fff">Grey text 4.54:1</p><div id="a"></div><div id="a"></div></main></body></html>';
for (const eo of [{ wcagLevel: 'AA' }, {}]) {
  const r = runa11yCoreOnHtml(PAGE, { engineOptions: eo, runOnly: { includeRuleIds: ['contrast-enhanced', 'contrast-minimum', 'duplicate-id'] }, entryPointParity: false });
  console.log('engine.wcagLevel', r.engine.wcagLevel, 'rollups', r.rulesResults.map(x => x.ruleId + ':' + x.outcome));
  console.log(r.checksResults.map(c => c.ruleId + ':' + c.outcome).join(' '));
  const x = renderJunitReport(r);
  console.log(x.match(/<testsuites[^>]*>/)[0]);
  console.log(x.match(/<testsuite [^>]*>|property name="(wcagLevel|criterionOutcome)" value="[^"]*"/g).join('\n'));
}
