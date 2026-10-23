// Runs the engine in jsdom on an HTML string and prints fail/cantTell
// occurrences (rule, outcome, selector, reason).
const run = require('/home/user/core/tests/helpers/runa11yCoreOnHtml.js');
module.exports = async function jsdomRun(html, runOnly) {
  const r = await run(html, runOnly ? { runOnly } : {});
  const out = [];
  for (const c of r.checksResults || []) for (const o of c.occurrences || []) {
    const t = o.occurrenceOutcome || c.outcome;
    if (t === 'fail' || t === 'cantTell') out.push(`${c.ruleId}:${t}:${o.selector}:${o.data?.details?.reasonCode || ''}`);
  }
  return out;
};
if (require.main === module) {
  const fs = require('fs');
  module.exports(fs.readFileSync(process.argv[2], 'utf8'), process.argv[3] ? process.argv[3].split(',') : null).then((o) => console.log(o.join('\n')));
}
