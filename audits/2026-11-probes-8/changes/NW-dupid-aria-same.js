// duplicate-id-aria: same findings old vs new on its fixture and on card pages (summaries, leans)
const html1 = require('fs').readFileSync('/home/user/core-r8/tests/fixtures/duplicate-id-aria-all-scenarios.html', 'utf8');
let cards = ''; for (let i = 0; i < 6; i++) cards += `<section><div><h3 id="t">Card ${i}</h3></div><a href="/p${i}" aria-labelledby="t">Open</a><p id="d">same</p><button aria-describedby="d">b</button></section>`;
const html2 = `<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1>${cards}<div aria-labelledby="t">far</div></main></body></html>`;
const sig = (core, html) => { const { runa11yCoreOnHtml } = require(core); const c = runa11yCoreOnHtml(html, { runOnly: ['duplicate-id-aria'] }).checksResults[0]; return c.outcome + '\n' + c.occurrences.map(o => o.selector + ' ' + o.summary + ' ' + JSON.stringify(o.lean && o.lean.toward)).join('\n'); };
for (const h of [html1, html2]) { const a = sig('/home/user/core/src/testing.js', h), b = sig('/home/user/core-r8/src/testing.js', h); console.log(a === b ? 'same (' + b.split('\n').length + ' lines)' : 'DIFF\n' + a + '\n---\n' + b); }
