// node dbg-alone.js <seed> <ruleId> [mode]: diff a rule's result alone vs in the full scan.
const { gen } = require('./gen5.js'); const { runOne } = require('./check5.js'); const { stripVolatile } = require('./check4.js');
console.warn = () => {};
const [seed, rule] = [+process.argv[2], process.argv[3]];
const c = process.argv[4] === 'html' ? { html: require('fs').readFileSync(process.argv[5], 'utf8'), shadows: [] } : gen(seed);
c.engineOptions = { locale: ['en', 'de', 'es', 'fr', 'ja'][seed % 5] };
const f = stripVolatile(runOne(c, null).res).checksResults.find(x => x.ruleId === rule);
const a = stripVolatile(runOne(c, { includeRuleIds: [rule] }).res).checksResults.find(x => x.ruleId === rule);
delete f.engineOptions; delete a.engineOptions;
const fa = JSON.stringify(f, null, 1).split('\n'), aa = JSON.stringify(a, null, 1).split('\n');
for (let i = 0; i < Math.max(fa.length, aa.length); i++) if (fa[i] !== aa[i]) { console.log('line', i, '\n full :', fa.slice(i - 3, i + 4).join('\n        '), '\n alone:', aa.slice(i - 3, i + 4).join('\n        ')); break; }
