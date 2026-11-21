const { runa11yCoreOnHtml } = require('@surea11y/core/testing');
const { renderSarifReport } = require('@surea11y/core/sarif');
const { computeBaselineKey } = require('@surea11y/core/baseline');
const crypto = require('crypto');
const pack = require('./gen/acme-a11y');
const html = `<html><head><title>Home</title></head><body><img src="x.png"><img src="x.png"><a href="#">click here</a><button></button>
<h1>Title</h1><h3>Skip</h3><div role="button" onclick="x()">Go</div><input type="text"><p style="color:#777;background:#fff">low</p><div id="d"></div><div id="d"></div>
<div id="host"></div><script>document.getElementById('host').attachShadow({mode:'open'}).innerHTML='<img src=y.png><button></button>'</script></body></html>`;
for (const [label, eo] of [['plain', {}], ['pack multi', { packs:[pack], profile:['wcag22-aa','acme-policy'] }], ['de', {locale:'de'}], ['compact', {output:{detail:'findings'}}]]) {
  const r = runa11yCoreOnHtml(html, { engineOptions: eo, entryPointParity:false });
  const s = JSON.parse(renderSarifReport(r, eo.packs?{packs:eo.packs}:{}));
  const run = s.runs[0]; const rules = run.tool.driver.rules;
  const probs = [];
  run.results.forEach((x,i) => {
    if (x.ruleIndex !== undefined && (!rules[x.ruleIndex] || rules[x.ruleIndex].id !== x.ruleId)) probs.push(`result ${i} ruleIndex ${x.ruleIndex} -> ${rules[x.ruleIndex]&&rules[x.ruleIndex].id} vs ${x.ruleId}`);
    if (!rules.some(r=>r.id===x.ruleId)) probs.push('no rule '+x.ruleId);
    if (!['error','warning','note','none'].includes(x.level)) probs.push('level '+x.level);
    if (!x.message || !x.message.text) probs.push('empty message '+x.ruleId);
  });
  const ids = rules.map(r=>r.id); if (new Set(ids).size !== ids.length) probs.push('dup rule ids');
  // fingerprint check
  const fps = run.results.map(x=>x.partialFingerprints && x.partialFingerprints['surea11y/violation/v2']);
  const fails = r.checksResults.filter(c=>c.outcome==='fail').reduce((n,c)=>n+c.occurrences.length,0);
  const errs = run.results.filter(x=>x.level==='error').length;
  console.log(label, 'results', run.results.length, 'errors', errs, 'fail occ', fails, 'rules', rules.length, 'dupFP', fps.length - new Set(fps).size, probs.slice(0,5));
  // verify fingerprint formula on one
  const ex = run.results.find(x=>x.ruleId==='img-alt-present');
  if (ex) { const occ = r.checksResults.find(c=>c.ruleId==='img-alt-present').occurrences[0]; const key = computeBaselineKey('img-alt-present', occ.data.details.reasonCode, occ.html); console.log('  fp formula match', crypto.createHash('sha256').update(key).digest('hex') === ex.partialFingerprints['surea11y/violation/v2'], 'locations', JSON.stringify(ex.locations).slice(0,200)); }
}
