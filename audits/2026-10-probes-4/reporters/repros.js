'use strict';
const C = '/home/user/core';
const { runa11yCoreOnHtml } = require(C + '/src/testing.js');
const { renderHtmlReport } = require(C + '/src/report.js');
const { renderSarifReport } = require(C + '/src/sarif.js');
const { renderJunitReport } = require(C + '/src/junit.js');
const { buildBaselineEntries } = require(C + '/src/baseline.js');
const PAGE = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"></main></body></html>';
const scan = (o = {}) => JSON.parse(JSON.stringify(runa11yCoreOnHtml(PAGE, { entryPointParity: false, ...o })));
const t = (label, fn) => { try { console.log(label, '->', fn()); } catch (e) { console.log(label, '-> THROWS', e.constructor.name + ': ' + e.message); } };

// B2: HTML report crashes on null entries that SARIF/JUnit/EARL/baseline skip
{ const r = scan(); r.checksResults.push(null);
  t('B2 sarif null check', () => typeof renderSarifReport(r)); t('B2 baseline null check', () => buildBaselineEntries(r).length); t('B2 html null check', () => typeof renderHtmlReport(r));
  const r2 = scan(); r2.checksResults.find(c => c.outcome === 'fail').occurrences.push(null); t('B2 html null occurrence', () => typeof renderHtmlReport(r2));
  const r3 = scan(); r3.rulesResults.push(null); t('B2 html null rollup', () => typeof renderHtmlReport(r3)); }
// B3: French JUnit suite name trailing space
{ const r = runa11yCoreOnHtml('<!doctype html><html lang="fr"><head><title>t</title></head><body><main><div role="button"></div></main></body></html>', { entryPointParity: false, engineOptions: { locale: 'fr' } });
  t('B3 fr 4.1.2 suite', () => JSON.stringify(renderJunitReport(r).match(/<testsuite name="WCAG 4\.1\.2[^"]*"/)[0])); }
// B4: SARIF notes for passing rules
{ const r = runa11yCoreOnHtml('<!doctype html><html lang="en"><head><title>t</title></head><body><main><p style="color:#000;background:#fff">Hi</p></main></body></html>', { entryPointParity: false, runOnly: { includeRuleIds: ['contrast-minimum'] } });
  const run = JSON.parse(renderSarifReport(r)).runs[0];
  t('B4 outcome', () => r.checksResults.map(c => c.ruleId + ':' + c.outcome).join());
  t('B4 notifications', () => JSON.stringify(run.invocations && run.invocations[0].toolExecutionNotifications)); }
// B5: SARIF artifact uri not a valid uri-reference when result.url has a space; url non-string throws raw TypeError
{ const { createDom } = require(C + '/src/testing.js'); createDom(PAGE); const r = JSON.parse(JSON.stringify(require(C + '/src/index.js').runDomRulesInPage('dist/my page.html', null, {}, null))); console.log('B5 stored url', JSON.stringify(r.url)); t('B5 uri', () => JSON.parse(renderSarifReport(r)).runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri);
  const r2 = scan(); r2.url = 5; t('B5 url=5', () => typeof renderSarifReport(r2)); }
