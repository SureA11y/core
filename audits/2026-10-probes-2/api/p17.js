const { setup, core } = require('./h');
const html = '<html lang="en"><head><title>t</title></head><body><main><div id="widget"></div><div id="light" style="color:#999;background:#fff">Light DOM low contrast</div></main></body></html>';
for (const eo of [{}, { excludeSelectors: ['#widget'] }, { rules: { 'contrast-minimum': { excludeSelectors: ['#widget'] } } }, { excludeSelectors: ['#widget', '#light'] }]) {
  setup(html);
  const sr = document.getElementById('widget').attachShadow({ mode: 'open' });
  sr.innerHTML = '<p style="color:#999;background:#fff">Shadow low contrast text</p>';
  const r = core.runa11yCoreInPage('u', null, eo, ['contrast-minimum']);
  console.log(JSON.stringify(eo), r.checksResults.map(c => c.ruleId + ':' + c.outcome + ':' + c.occurrences.map(o => o.html.slice(0, 50) + (o.shadowHostSelectors ? '@' + o.shadowHostSelectors : '')).join(' | ')));
}
