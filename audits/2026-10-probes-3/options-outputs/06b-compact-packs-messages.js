'use strict';
// Compact results under a pack's profile, and with caller-supplied messages,
// read back by the reporters: do titles/mappings/standard rollups survive?
const h = require('./h.js');
const { main, sub } = h.load();
const R = { sarif: sub('sarif'), junit: sub('junit'), report: sub('report'), earl: sub('earl') };
const pack = require(h.ROOT + '/tests/fixtures/packs/sample.js');
const html = '<!doctype html><html lang="en"><head><title>Ok page</title></head><body><main><h1>x</h1><img src="a.png" alt="Logo"><a href="/x">Read</a></main></body></html>';
function both(eo, ro) {
  h.setDom(html);
  const full = main.runDomRulesInPage('https://example.test/', null, { timestamp: '2026-10-09T00:00:00Z', ...eo }, ro);
  h.setDom(html);
  const comp = main.runDomRulesInPage('https://example.test/', null, { timestamp: '2026-10-09T00:00:00Z', ...eo, output: { detail: 'findings' } }, ro);
  return { full, comp };
}
function diff(name, a, b) {
  if (a === b) return console.log('  ' + name + ': identical');
  let i = 0; while (a[i] === b[i]) i++;
  console.log('  ' + name + ` differs @${i}:\n    full   =${JSON.stringify(a.slice(Math.max(0, i - 100), i + 100))}\n    compact=${JSON.stringify(b.slice(Math.max(0, i - 100), i + 100))}`);
}
console.log('## pack profile sample-1.0');
let { full, comp } = both({ packs: [pack], profile: 'sample-1.0' });
const packRules = full.checksResults.filter((c) => c.ruleId.startsWith('sample-'));
console.log('  pack rules', packRules.map((c) => c.ruleId + ':' + c.outcome).join(' '));
diff('sarif', R.sarif.renderSarifReport(full), R.sarif.renderSarifReport(comp));
diff('junit', R.junit.renderJunitReport(full), R.junit.renderJunitReport(comp));
diff('earl', JSON.stringify(R.earl.renderEarlReport(full)), JSON.stringify(R.earl.renderEarlReport(comp)));
diff('report', R.report.renderHtmlReport(full), R.report.renderHtmlReport(comp));
console.log('## messages override on a passing rule');
({ full, comp } = both({ locale: 'de', messages: { de: { img_altPresent_title: 'EIGENER TITEL' } } }, ['img-alt-present', 'page-title-present']));
console.log('  full title:', full.checksResults.find((c) => c.ruleId === 'img-alt-present').title);
diff('junit', R.junit.renderJunitReport(full), R.junit.renderJunitReport(comp));
diff('report', R.report.renderHtmlReport(full), R.report.renderHtmlReport(comp));
console.log('## private locale xx via messages');
({ full, comp } = both({ locale: 'xx', messages: { xx: { img_altPresent_title: 'XX TITLE' } } }, ['img-alt-present']));
console.log('  engine.locale', JSON.stringify(full.engine.locale));
diff('sarif', R.sarif.renderSarifReport(full), R.sarif.renderSarifReport(comp));
process.exit(0);
