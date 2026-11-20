const page = (b) => `<!doctype html><html lang="en"><head><title>T</title></head><body><main><h1>P</h1>${b}</main></body></html>`;
const cases = [
  ['1.4em in 12px parent (browser 16.8px)', '<div style="font-size:12px"><div style="font-size:1.4em;font-weight:bold">Opening hours</div><p>Monday to Friday.</p></div>'],
  ['150% in 10px parent (browser 15px)', '<div style="font-size:10px"><p style="font-size:150%;font-weight:bold">Opening hours</p><p>Monday to Friday.</p></div>'],
  ['larger (browser 19.2px)', '<div style="font-size:larger;font-weight:bold">Opening hours</div><p>Monday to Friday.</p>'],
];
for (const [label, root] of [['v1.17.0', './v1170/src/testing.js'], ['HEAD', '/home/user/core/src/testing.js']]) {
  const { runa11yCoreOnHtml } = require(root);
  for (const [n, b] of cases) {
    const r = runa11yCoreOnHtml(page(b), { runOnly: ['p-as-heading'] }).checksResults[0];
    console.log(label.padEnd(8), n.padEnd(40), r.outcome, JSON.stringify(r.occurrences.map(o => o.data.details.reasonCode + '@' + o.data.details.fontSizePx)));
  }
}
