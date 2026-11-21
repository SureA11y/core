// Scaling of the slow rules on long values, new vs old core
const N = Number(process.argv[2]); const which = process.argv[3];
const { runa11yCoreOnHtml } = require(which === 'old' ? '/home/user/core/src/testing.js' : '/home/user/core-r8/src/testing.js');
const big = 'Z'.repeat(N);
const html = require('fs').readFileSync(__dirname + '/NW-bigquote.js', 'utf8').match(/const html = `([\s\S]*?)`;/)[1].replace(/\$\{big\}/g, big);
const warn = console.warn; console.warn = () => {};
const out = [];
for (const id of ['img-alt-present', 'text-spacing-content-loss', 'meta-refresh-no-exceptions', 'aria-roles-valid', 'avoid-inline-spacing', 'textbox-name-present']) { const t0 = Date.now(); try { runa11yCoreOnHtml(html, { runOnly: [id], engineOptions: { optInRules: 'all', wcagLevel: 'AAA' } }); } catch (e) { out.push(id + ' ERR ' + e.message.slice(0, 50)); continue; } out.push(id + ' ' + (Date.now() - t0)); }
console.warn = warn; console.log(which, 'N=' + N, out.join(' | '));
