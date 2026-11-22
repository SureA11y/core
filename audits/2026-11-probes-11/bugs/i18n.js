const { js, rule } = require('./h.js');
const html = `<!doctype html><html lang="en"><head><title>Probe page for tests</title></head><body><main><h1>T</h1>
<label><input type=radio name=s> S</label><label><input type=radio name=s> M</label>
<label><input type=checkbox name=t> A</label><label><input type=checkbox name=t> B</label>
<span style="color:#ccc">★★★☆☆</span>
<p><b>Ingredients:</b></p><p>Rice and water and salt.</p>
<video poster="p.png" controls></video>
</main></body></html>`;
for (const locale of ['en','de','es','fr','ja']) {
  const r = js(html, ['form-group-name-present','symbol-graphic-contrast','p-as-heading','video-poster-text-alternative-present'], { locale });
  for (const c of r.checksResults) for (const o of c.occurrences || []) console.log(locale, c.ruleId, '|', o.summary, '|', o.hint && o.hint.slice(0,140), '|', o.lean && o.lean.why && o.lean.why.slice(0,120), '|', o.lean && o.lean.caution);
}
