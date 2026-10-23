const { validateSarif, parseXml } = require('./validate.js');
const { renderSarifReport } = require('/home/user/core/src/sarif.js');
const { renderJunitReport } = require('/home/user/core/src/junit.js');
const { renderHtmlReport } = require('/home/user/core/src/report.js');
const fs = require('fs');
for (const name of process.argv.slice(2)) {
  const r = require(`./result.${name}.json`);
  const s = JSON.parse(renderSarifReport(r));
  if (!validateSarif(s)) console.log(name, 'SARIF invalid', JSON.stringify(validateSarif.errors.slice(0,3)));
  const j = renderJunitReport(r, { includeNotApplicable: true });
  parseXml(j);
  fs.writeFileSync(`junit.${name}.xml`, j);
  fs.writeFileSync(`sarif.${name}.json`, JSON.stringify(s, null, 1));
  fs.writeFileSync(`report.${name}.html`, renderHtmlReport(r));
  const tags = new Set(s.runs[0].tool.driver.rules.flatMap(x => x.properties.tags));
  console.log(name, [...tags].filter(t => !t.startsWith('wcag-')).slice(0, 12));
}
