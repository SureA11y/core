'use strict';
// Boolean options given as the strings 'false' / 'true' (as from an env var or
// a CLI flag): which way does each go, and is anything said?
const h = require('./h.js');
const PAGE = `<!doctype html><html lang="en"><head><title>T</title></head><body><main><h1>x</h1>
<div hidden><img src="h.png"></div><div id="host"></div></main>
<script>document.getElementById('host').attachShadow({mode:'open'}).innerHTML='<img src="s.png">'</script></body></html>`;
function run(eo, ro = ['img-alt-present', 'page-title-present']) {
  const { main } = h.load();
  const dom = h.setDom(PAGE);
  const host = document.getElementById('host');
  if (!host.shadowRoot) host.attachShadow({ mode: 'open' }).innerHTML = '<img src="s.png">';
  return h.capture(() => main.runDomRulesInPage('u', null, eo, ro));
}
const cases = [
  ['fragment', 'false'], ['fragment', false], ['fragment', 'true'], ['fragment', 0], ['fragment', 1],
  ['includeShadowDom', 'false'], ['includeShadowDom', false], ['includeShadowDom', 0], ['includeShadowDom', null],
  ['includeHiddenElements', 'true'], ['includeHiddenElements', true], ['includeHiddenElements', 1],
  ['perfStats', 'false'], ['perfStats', 1],
  ['strictOptions', 'true'], ['strictOptions', 1]
];
for (const [k, v] of cases) {
  const r = run({ [k]: v, ...(k === 'strictOptions' ? { lcoale: 'de' } : {}) });
  if (r.error) { console.log(k, JSON.stringify(v), 'ERR', r.error.code, r.error.message.slice(0, 80)); continue; }
  const s = h.summary(r.value);
  console.log(k.padEnd(22), JSON.stringify(v).padEnd(8), 'img:', s['img-alt-present'], 'title:', s['page-title-present'], 'perf:', r.value.perfStats ? 'obj' : 'null', 'logs:', r.logs.length, r.logs.join(' | ').slice(0, 120));
}
// output.includeHtml 'false'
for (const v of ['false', false, 0]) {
  const r = run({ output: { includeHtml: v, includeSelector: v } }, ['img-alt-present']);
  const o = r.value.checksResults[0].occurrences[0];
  console.log('output.include*', JSON.stringify(v), 'html' in o ? 'html=' + JSON.stringify(o.html).slice(0, 30) : 'no html', 'selector=' + JSON.stringify(o.selector), 'logs', r.logs.length);
}
process.exit(0);
