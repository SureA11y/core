const { runa11yCoreOnHtml } = require('@surea11y/core/testing');
const { leaningFailures, reviewGroupOf, occurrenceOutcome } = require('@surea11y/core');
const { renderSarifReport } = require('@surea11y/core/sarif');
const { renderJunitReport } = require('@surea11y/core/junit');
const { renderHtmlReport } = require('@surea11y/core/report');
const { buildBaselineEntries, matchBaseline } = require('@surea11y/core/baseline');
const fs = require('fs');
const html = fs.readFileSync('/home/user/core-r9/tests/fixtures/heading-order-all-scenarios.html','utf8') ;
for (const [label, eo, ro] of [['all', {}, null], ['wcag22aa', {}, {wcag:{version:'2.2',level:'AA'}}], ['wcag22aa+bp', {}, {wcag:{version:'2.2',level:'AA'}, bestPractices:true}], ['profile wcag21-a', {profile:'wcag21-a'}, null]]) {
  const r = runa11yCoreOnHtml(html, { engineOptions: eo, runOnly: ro, entryPointParity:false });
  const lf = leaningFailures(r), lfw = leaningFailures(r, {wcagOnly:true});
  const allLeanFail = []; for (const c of r.checksResults) for (const o of c.occurrences||[]) if (reviewGroupOf(c,o)==='leanFail') allLeanFail.push(c.ruleId);
  const s = JSON.parse(renderSarifReport(r, { leanFailAs: 'error' })); const sErr = s.runs[0].results.filter(x=>x.level==='error').length;
  const sW = JSON.parse(renderSarifReport(r, { leanFailAs: 'error', leanFailWcagOnly: true })).runs[0].results.filter(x=>x.level==='error').length;
  const j = renderJunitReport(r, { leanFailAs: 'failure' }); const jLean = (j.match(/type="leanFail"/g)||[]).length;
  const fails = r.checksResults.reduce((n,c)=>n+(c.occurrences||[]).filter(o=>occurrenceOutcome(c,o)==='fail').length,0);
  const be = buildBaselineEntries(r, { leanFail: true }); const beLean = be.filter(e=>e.lean==='fail').length;
  const h = renderHtmlReport(r); 
  console.log(label.padEnd(16), 'leaningFailures', lf.length, 'wcagOnly', lfw.length, 'reviewGroup leanFail', allLeanFail.length, '| sarif errors', sErr, '(fails', fails+')', 'wcagOnly errs', sW, '| junit leanFail rules', jLean, '| baseline lean entries', beLean, [...new Set(allLeanFail)].join(','), '| lf rules', [...new Set(lf.map(x=>x.ruleId))].join(','));
}
