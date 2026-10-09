'use strict';
// usage: node repro.js <ruleId|all> '<html>'   -> prints outcome/error of the rule(s)
const path = require('node:path');
const { runa11yCoreOnHtml } = require(path.resolve(__dirname, '../../../src/testing.js'));
console.warn = () => {};
const [ruleId, html] = process.argv.slice(2);
const res = runa11yCoreOnHtml(html, { engineOptions: { optInRules: 'all' }, runOnly: ruleId === 'all' ? null : { includeRuleIds: [ruleId] } });
for (const c of res.checksResults) {
  if (ruleId !== 'all' || c.error) console.log(c.ruleId, c.outcome, c.occurrences.length, c.error || '', JSON.stringify(c.occurrences.map((o) => o.selector)).slice(0, 300));
}
