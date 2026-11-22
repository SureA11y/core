// jsdom whole-run differential: before vs after, per fixture, per rule.
const fs = require('fs');
const root = process.argv[2], out = process.argv[3];
const { runa11yCoreOnHtml } = require(root + '/src/testing.js');
const dir = '/home/user/r11-review/tests/fixtures/';
const res = {}; let total = 0;
const pages = require('path').join(__dirname, '../bugs/pages/');
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.html')).map((f) => dir + f).concat(['article', 'checkout', 'widgets'].map((n) => pages + n + '.html'))) {
  const html = fs.readFileSync(f, 'utf8');
  const t0 = process.hrtime.bigint();
  let r; try { r = runa11yCoreOnHtml(html, { entryPointParity: false }); } catch (e) { res[f] = 'ERR ' + e.message; continue; }
  total += Number(process.hrtime.bigint() - t0) / 1e6;
  res[f] = {}; for (const c of r.checksResults) res[f][c.ruleId] = c.outcome + ':' + (c.occurrences || []).map((o) => (o.outcome||'') + '@' + o.selector).sort().join('|');
}
fs.writeFileSync(out, JSON.stringify(res));
console.log(root, 'total ms', total.toFixed(0));
