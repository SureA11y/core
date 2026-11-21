// Per-rule time on the page of NW-bigquote.js with 50 KB values: which rule is slow on long attribute values?
const { runa11yCoreOnHtml } = require(process.env.CORE || '/home/user/core-r8/src/testing.js');
const N = Number(process.argv[2] || 50000);
const big = 'Z'.repeat(N);
const html = require('fs').readFileSync(__dirname + '/NW-bigquote.js', 'utf8').match(/const html = `([\s\S]*?)`;/)[1].replace(/\$\{big\}/g, big);
const warn = console.warn; console.warn = () => {};
const all = runa11yCoreOnHtml('<!doctype html><title>t</title>', { engineOptions: { optInRules: 'all', wcagLevel: 'AAA' } }).checksResults.map(c => c.ruleId);
const times = [];
for (const id of all) { const t0 = Date.now(); try { runa11yCoreOnHtml(html, { runOnly: [id], engineOptions: { optInRules: 'all', wcagLevel: 'AAA' } }); } catch (e) {} times.push([id, Date.now() - t0]); }
console.warn = warn;
times.sort((a, b) => b[1] - a[1]); console.log('N=' + N, times.slice(0, 8).map(x => x.join(' ')).join('\n'));
