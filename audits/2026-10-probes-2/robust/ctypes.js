const { scanHtml, close } = require('./pw');
const cases = [
  ['xhtml', '<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml" lang="en"><head><title>X</title></head><body><main><h1>x</h1><img src="a"/><button></button><a href="#"></a><input/></main></body></html>', 'application/xhtml+xml'],
  ['xhtmlNoLang', '<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en"><head><title>X</title></head><body><p>x</p></body></html>', 'application/xhtml+xml'],
  ['svg', '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><title>S</title><a xlink:href="#"><circle r="5"/></a><text>t</text><foreignObject width="100" height="100"><div xmlns="http://www.w3.org/1999/xhtml"><button></button><img src="x"/></div></foreignObject></svg>', 'image/svg+xml'],
  ['xml', '<?xml version="1.0"?><root><a>t</a></root>', 'application/xml'],
  ['text', 'plain text', 'text/plain'],
  ['quirks', '<html><body><img src=x><table><tr><td>1</td></tr></table></body></html>', 'text/html'],
];
(async () => {
  for (const [k, html, ct] of cases) {
    try {
      const o = await scanHtml(html, { contentType: ct });
      if (o.err) { console.log(k, 'THROW', o.err.slice(0, 300)); continue; }
      console.log(k, 'errs=', o.r.checksResults.filter(c => c.error).map(c => c.ruleId + '!' + c.error.slice(0, 60)).join(';'), '| non-pass:', o.r.checksResults.filter(c => !/pass|notApplicable/.test(c.outcome)).map(c => c.ruleId + '=' + c.outcome + ':' + c.occurrences.map(x => x.selector).join('|')).join(' '));
    } catch (e) { console.log(k, 'HARNESS', String(e).slice(0, 200)); }
  }
  await close();
})();
