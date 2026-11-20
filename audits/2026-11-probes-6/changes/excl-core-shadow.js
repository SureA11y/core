const { runa11yCoreOnDom, createDom } = require('/home/user/core/src/testing.js');
const { getChecksCatalog } = require('/home/user/core/src/index.js');
const PROBLEMS = `<div class="site-header"><a href="/a">A</a><a href="/b">B</a></div><div class="menu"><a href="/a">Home</a><a href="/b">About</a></div>
<form><input type="search" name="s"><button>Search</button></form><img src="IMG_1234.png"><a href="#"></a><a href="/x">click here</a>
<button></button><div role="button">Do</div><input type="text"><p id="dup">a</p><p id="dup">b</p><div role="buttonx" aria-pressed="maybe" tabindex="5">x</div>
<table><tr><td>1</td><td>2</td></tr><tr><td>3</td><td>4</td></tr></table><h4></h4><h6>Skipped</h6><p><strong>Bold heading</strong></p><p>Plain text after it.</p>
<span style="font-size:8px;color:#ccc;background:#fff">tiny and pale</span><svg role="img"><circle r="4"></circle></svg><div tabindex="0" style="outline:none">F</div>`;
const html = `<!doctype html><html lang="en"><head><title>T</title></head><body><div id="host"></div><div id="wrap"><div id="host2"></div></div><main><h1>Page</h1><p>ok</p></main></body></html>`;
const ALL = getChecksCatalog().map(r => r.ruleId).filter(id => id !== 'reflow-horizontal-scroll');
function run(eo) {
  const dom = createDom(html);
  const d = dom.window.document;
  d.getElementById('host').attachShadow({ mode: 'open' }).innerHTML = PROBLEMS;
  d.getElementById('host2').attachShadow({ mode: 'open' }).innerHTML = PROBLEMS;
  return runa11yCoreOnDom(dom, { runOnly: ALL, engineOptions: { includeShadowDom: true, ...eo } });
}
const base = run({});
const inShadow = base.checksResults.filter(c => c.occurrences.some(o => o.shadowHostSelectors)).map(c => c.ruleId);
console.log('rules reporting inside shadow without exclusion:', inShadow.length);
for (const eo of [{ excludeSelectors: ['#host', '#wrap'] }]) {
  const r = run(eo);
  const leaked = r.checksResults.filter(c => c.occurrences.some(o => o.shadowHostSelectors)).map(c => c.ruleId);
  const needed = r.checksResults.filter(c => c.excludedOccurrences).map(c => c.ruleId + ':' + c.excludedOccurrences.dropped);
  console.log(JSON.stringify(eo), 'leaked:', leaked, 'engine-dropped (core rules that did not skip):', needed);
}
