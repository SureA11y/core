const { validateSarif, parseXml } = require('./validate.js');
const { renderSarifReport } = require('/home/user/core/src/sarif.js');
const { renderJunitReport } = require('/home/user/core/src/junit.js');
const { renderEarlReport } = require('/home/user/core/src/earl.js');
const { renderHtmlReport } = require('/home/user/core/src/report.js');
const fs = require('fs');
for (const loc of ['en','de','fr','es','ja']) {
  const r = require(`./result.${loc}.json`);
  const s = JSON.parse(renderSarifReport(r));
  if (!validateSarif(s)) console.log(loc, 'SARIF invalid', JSON.stringify(validateSarif.errors.slice(0,5)));
  const j = renderJunitReport(r, { includeNotApplicable: true });
  try { parseXml(j); } catch (e) { console.log(loc, e.message); }
  const e = renderEarlReport(r);
  fs.writeFileSync(`earl.${loc}.json`, JSON.stringify(e, null, 1));
  const h = renderHtmlReport(r);
  fs.writeFileSync(`report.${loc}.html`, h);
  fs.writeFileSync(`junit.${loc}.xml`, j);
  fs.writeFileSync(`sarif.${loc}.json`, JSON.stringify(s, null, 1));
  const parts = e['@graph'].flatMap(g => g.assertions.flatMap(a => a.test.isPartOf || []));
  console.log(loc, 'sarif results', s.runs[0].results.length, 'earl isPartOf sample', [...new Set(parts)].slice(0, 6));
}
