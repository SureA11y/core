const root = process.argv[2], kind = process.argv[3], only = process.argv[4];
const { runa11yCoreOnHtml } = require(root + '/src/testing.js');
let body = '';
for (let i = 0; i < 300; i++) {
  if (kind === 'plain') body += `<section><h2>Part ${i}</h2><p>Some text <a href="/x${i}">link ${i}</a> and <span style="overflow:hidden">more</span> text.</p><table><tr><td>a</td><td>b</td></tr></table></section>`;
  else body += `<section><h2>Part ${i}</h2><p><font color="#333">Some <b>text <i>deep</i></b></font> <a href="/x${i}">link ${i}</a></p><table bgcolor="#fff"><tr bgcolor="#eee"><td bgcolor="#ddd">a</td><td>b</td></tr></table><svg width=10 height=10 fill="#555"><g><rect width=5 height=5 /></g></svg></section>`;
}
const html = `<!doctype html><html lang="en"><head><title>Perf</title></head><body${kind==='hints'?' text="#222" link="#00e"':''}><main>${body}</main></body></html>`;
const opts = { entryPointParity: false }; if (only) opts.runOnly = only.split(',');
runa11yCoreOnHtml(html, opts); // warm
const ts = [];
for (let k = 0; k < 3; k++) { const t0 = process.hrtime.bigint(); runa11yCoreOnHtml(html, opts); ts.push(Number(process.hrtime.bigint() - t0) / 1e6); }
ts.sort((a,b)=>a-b);
console.log(root.split('/').pop().padEnd(12), kind.padEnd(6), (only||'all').padEnd(18), 'median ms', ts[1].toFixed(0), ' runs', ts.map(x=>x.toFixed(0)).join(','));
