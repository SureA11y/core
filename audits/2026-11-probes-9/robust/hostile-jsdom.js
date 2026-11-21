'use strict';
// Odd documents in jsdom through runa11yCoreOnHtml (both entry points, parity asserted).
const { runa11yCoreOnHtml } = require('/home/user/core-r9/src/testing.js');
const deep = (n) => '<div>'.repeat(n) + '<button></button>' + '</div>'.repeat(n);
const cases = [
  ['xhtml', 'application/xhtml+xml', `<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml" lang="en"><head><title>X</title></head><body><main><h1>Hi</h1><img src="a.png"/><button></button></main></body></html>`],
  ['svg', 'image/svg+xml', `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><title>S</title><a href="#x"><circle r="20"/></a><text x="10" y="100">t</text></svg>`],
  ['xml', 'application/xml', `<?xml version="1.0"?><root><item>hi</item></root>`],
  ['empty', 'text/html', ''],
  ['frameset', 'text/html', `<!doctype html><html lang="en"><head><title>F</title></head><frameset cols="50%,50%"><frame src="about:blank"><frame src="about:blank" title="two"></frameset></html>`],
  ['docwrite', 'text/html', `<!doctype html><html lang="en"><head><title>W</title></head><body><script>document.write('<main><h1>W</h1><img src=q.png><button></button></main>')</script></body></html>`],
  ['deep3000', 'text/html', `<!doctype html><html lang="en"><title>d</title><main><h1>d</h1>${deep(3000)}</main>`],
  ['deep10k', 'text/html', `<!doctype html><html lang="en"><title>d</title><main><h1>d</h1>${deep(10000)}</main>`],
  ['hugeattr', 'text/html', `<!doctype html><html lang="en"><title>h</title><main><h1>h</h1><img src="x.png" alt="${'word '.repeat(200000)}"><a href="#" aria-label="${'x'.repeat(2e6)}">a</a><div class="${'c '.repeat(200000)}" id="${'i'.repeat(1e6)}">t</div><button aria-describedby="${Array.from({ length: 50000 }, (_, i) => 'id' + i).join(' ')}">b</button><div role="${'button '.repeat(100000)}">r</div></main>`],
  ['declshadow', 'text/html', `<!doctype html><html lang="en"><title>dsd</title><main><h1>dsd</h1><x-a><template shadowrootmode="open"><button></button><slot></slot></template><span>light</span></x-a></main>`],
  ['root-not-html', 'text/html', `<!doctype html><html><body><script>const s=document.createElement('div');s.innerHTML='<button></button><img src=x>';document.replaceChild(s,document.documentElement)</script>`],
  ['no-body', 'text/html', `<!doctype html><html lang="en"><head><title>nb</title></head><script>document.body.remove()</script></html>`]
];
for (const [name, ct, html] of cases) {
  const t = Date.now();
  try {
    const r = runa11yCoreOnHtml(html, { contentType: ct, engineOptions: {}, entryPointParity: process.env.PARITY !== '0' });
    const errs = r.checksResults.filter((c) => c.error).map((c) => c.ruleId + ': ' + String(c.error).slice(0, 100));
    const notNA = r.checksResults.filter((c) => !['notApplicable', 'pass'].includes(c.outcome)).map((c) => c.ruleId + '=' + c.outcome + 'x' + (c.occurrences || []).length);
    console.log(name, Date.now() - t + 'ms', 'errs', JSON.stringify(errs), 'notNA', notNA.join(' ').slice(0, 600));
  } catch (e) {
    console.log(name, Date.now() - t + 'ms', 'THROW', String(e && e.stack).slice(0, 600));
  }
}
