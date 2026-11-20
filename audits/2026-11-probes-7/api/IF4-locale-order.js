// Prints a digest of order-sensitive outputs; run under different process locales (LANG / LC_ALL).
const crypto = require('crypto');
const core = require('/home/user/core/src/index.js');
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const { renderJunitReport } = require('/home/user/core/src/junit.js');
const { renderSarifReport } = require('/home/user/core/src/sarif.js');
const { renderHtmlReport } = require('/home/user/core/src/report.js');
const h = (s) => crypto.createHash('md5').update(s).digest('hex').slice(0, 8);
const cat = core.getChecksCatalog({ optInRules: true }).map(c => c.ruleId);
const r = runa11yCoreOnHtml(require('./page.js'), { engineOptions: { profile: 'wcag22-aaa' }, runOnly: { bestPractices: true } });
const order = r.checksResults.map(c => c.ruleId);
const junitCases = (renderJunitReport(r).match(/<testcase [^>]*name="[^"]*"/g) || []).join('\n');
const sarifRules = JSON.parse(renderSarifReport(r)).runs[0].tool.driver.rules.map(x => x.id);
const html = renderHtmlReport(r, { manualChecks: false }).replace(/\d{1,2}:\d\d:\d\d[^<]*|Nov \d+, \d+/g, '');
console.log(new Intl.Collator().resolvedOptions().locale.padEnd(6), 'catalog', h(cat.join()), 'checksResults', h(order.join()), 'junit', h(junitCases), 'sarifRules', h(sarifRules.join()), 'html', h(html));
if (process.argv[2]) { console.log(cat.join('\n')); }
