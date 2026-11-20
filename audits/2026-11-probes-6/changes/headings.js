const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const page = (b) => `<!doctype html><html lang="en"><head><title>T</title></head><body><main>${b}</main></body></html>`;
function go(name, body) {
  const res = runa11yCoreOnHtml(page(body), { runOnly: ['heading-order', 'page-has-heading-one'] });
  for (const id of ['heading-order', 'page-has-heading-one']) {
    const r = res.checksResults.find(c => c.ruleId === id);
    console.log(`## ${name} :: ${id} = ${r.outcome} ${JSON.stringify(r.occurrences.map(o => [o.selector.replace('html > body > main > ', ''), o.data && o.data.details && o.data.details.reasonCode, o.summary.slice(0, 110)]))}`);
  }
}
go('h1 then h2 aria-level=10 (Chromium: level 2)', '<h1>A</h1><h2 aria-level="10">B</h2><p>x</p>');
go('h1 aria-level=10 (Chromium: level 1)', '<h1 aria-level="10">A</h1><h2>B</h2>');
go('h2 aria-level=0 only (Chromium: level 1)', '<h2 aria-level="0">A</h2><h3>B</h3>');
go('div heading aria-level=abc (Chromium: level 1)', '<div role="heading" aria-level="abc">A</div><h3>B</h3>');
go('h1 then h3 role=heading', '<h1>A</h1><h3 role="heading">B</h3>');
go('h3 role=heading then h4', '<h1>A</h1><h2>x</h2><h3 role="heading">B</h3><h4>C</h4>');
go('h1 role=heading', '<h1 role="heading">A</h1><h2>B</h2>');
go('h1 with huge aria-level', '<h1 aria-level="99999999999999999999">A</h1><h2>B</h2>');
