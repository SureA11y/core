const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const r = runa11yCoreOnHtml('<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>h</h1><label><input type=checkbox aria-checked=yes> Agree</label></main></body></html>', { rules: { include: 'aria-valid-attr-value' } });
const c = r.checksResults.find((x) => x.ruleId === 'aria-valid-attr-value');
console.log(c.outcome, c.occurrences.map((o) => o.occurrenceOutcome + ' ' + o.data.details.reasonCode));
