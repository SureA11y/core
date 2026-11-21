const pack = require('./gen/acme-a11y');
const { runa11yCoreOnHtml } = require('@surea11y/core/testing');
const { renderSarifReport } = require('@surea11y/core/sarif');
const { renderJunitReport } = require('@surea11y/core/junit');
const { renderHtmlReport } = require('@surea11y/core/report');
const { renderEarlReport } = require('@surea11y/core/earl');
const { buildBaselineEntries } = require('@surea11y/core/baseline');
const html = `<html lang="en"><head><title>Home</title></head><body><main><h1>x</h1><img src="a.png"><a href="/a">click here</a><a href="/b" target="_blank">More info</a><p style="color:#666;background:#fff">Grey text here</p></main></body></html>`;
for (const profile of [['acme-policy'], ['wcag22-aa','acme-policy'], ['acme-quick','wcag22-aa']]) {
  const r = runa11yCoreOnHtml(html, { engineOptions: { packs: [pack], profile, timestamp:'2026-01-01T00:00:00Z' } });
  const fails = r.checksResults.filter(c=>c.outcome==='fail');
  const img = r.checksResults.find(c=>c.ruleId==='img-alt-present');
  const sarif = JSON.parse(renderSarifReport(r, {packs:[pack]}));
  const errs = sarif.runs[0].results.filter(x=>x.level==='error');
  const junit = renderJunitReport(r, {packs:[pack]});
  const jf = (junit.match(/<failure /g)||[]).length;
  const base = buildBaselineEntries(r);
  const earl = renderEarlReport(r);
  const ef = earl['@graph'][0].assertions.filter(a=>a.result.outcome==='earl:failed').map(a=>a.test.title);
  console.log(JSON.stringify(profile), 'engine.profile', r.engine.profile, 'profiles', JSON.stringify(r.engine.profiles));
  console.log('  fails:', fails.map(c=>c.ruleId+'('+c.severity+')'+JSON.stringify(c.verdicts||{})).join(' '));
  console.log('  img severity', img && img.severity, img && img.ruleSeverity, 'sarif errors', errs.map(e=>e.ruleId).join(','), 'junit failures', jf, 'baseline', base.map(b=>b.ruleId).join(','));
  console.log('  rollups', r.rulesResults.filter(x=>x.ruleId.startsWith('acme')).map(x=>x.ruleId+':'+x.outcome).join(' '));
  console.log('  earl failed', ef.length);
}
