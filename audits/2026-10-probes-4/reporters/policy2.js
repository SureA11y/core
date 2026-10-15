'use strict';
const C = '/home/user/core';
const fs = require('fs');
const { runa11yCoreOnHtml } = require(C + '/src/testing.js');
const r = runa11yCoreOnHtml(fs.readFileSync(C + '/tests/fixtures/aria-prohibited-attr-all-scenarios.html', 'utf8'), { engineOptions: { policyContract: { id: 'no-fail', allowedOutcomes: ['pass', 'cantTell', 'notApplicable'] } }, entryPointParity: false });
console.log(r.checksResults.filter(c => c.outcome === 'fail').map(c => [c.ruleId, c.policyOutcome, c.occurrences.map(o => o.occurrenceOutcome).join(',')]));
