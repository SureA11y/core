// Every fixture, every rule (optInRules all): any check with an error, and checks whose outcome disagrees with its occurrence tiers.
const fs = require('fs');
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const dir = '/home/user/core-r8/tests/fixtures/';
const errs = new Map();
(async () => {
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.html'))) {
  const warn = console.warn; console.warn = () => {};
  let r;
  try { r = runa11yCoreOnHtml(fs.readFileSync(dir + f, 'utf8'), { engineOptions: { optInRules: 'all', wcagLevel: 'AAA' } }); } catch (e) { console.log(f, 'THROW', e.message); continue; } finally { console.warn = warn; }
  for (const c of r.checksResults) {
    if (c.error) { const k = c.ruleId + ': ' + String(c.error).slice(0, 140); errs.set(k, (errs.get(k) || []).concat(f)); }
    const tiers = (c.occurrences || []).map(o => o.occurrenceOutcome || c.outcome);
    const worst = tiers.includes('fail') ? 'fail' : tiers.includes('cantTell') ? 'cantTell' : tiers.length && tiers.every(t => t === 'pass') ? 'pass' : null;
    if (worst && worst !== c.outcome) console.log('MISMATCH', f, c.ruleId, c.outcome, tiers.join(','));
  }
  await new Promise(s => setImmediate(s));
}
for (const [k, v] of errs) console.log('ERROR', k, v.length, v.slice(0, 3).join(' '));
})();
