const { runa11yCoreOnHtml } = require('./lib.js');
const pages = {
  'skip link to missing target': '<!doctype html><html lang="en"><head><title>t</title></head><body><a href="#main">Skip to content</a><nav><a href="/a">A</a><a href="/b">B</a><a href="/c">C</a></nav><div>Hello</div></body></html>',
  'no skip link, long nav': '<!doctype html><html lang="en"><head><title>t</title></head><body><nav>' + Array.from({ length: 30 }, (_, i) => `<a href="/${i}">L${i}</a>`).join('') + '</nav><main id="main">Hi</main></body></html>'
};
for (const [label, html] of Object.entries(pages)) {
  const r = runa11yCoreOnHtml(html, { engineOptions: { runOnly: ['skip-link'] } });
  const res = r.checksResults.find((x) => x.ruleId === 'skip-link');
  console.log(label, '->', res.outcome, (res.occurrences || []).map((o) => `code=${o.data && o.data.details && o.data.details.reasonCode} details.lean=${o.data && o.data.details && o.data.details.lean} lean.toward=${o.lean && o.lean.toward}`).join(' ; '));
}
