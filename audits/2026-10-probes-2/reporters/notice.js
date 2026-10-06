const run = require('/home/user/core/tests/helpers/runa11yCoreOnHtml.js');
const { validateSarif } = require('./validate.js');
const { renderSarifReport } = require('/home/user/core/src/sarif.js');
const r = run('<!doctype html><html lang="en"><head><title>Notice test page</title></head><body><main><h1>Hi</h1><p>Some text</p></main></body></html>', { url: 'https://example.test/' });
for (const c of r.checksResults) if ((c.outcome === 'notApplicable' || c.outcome === 'pass') && c.occurrences.length) console.log(c.ruleId, c.outcome, c.occurrences[0].summary);
const s = JSON.parse(renderSarifReport(r));
console.log(validateSarif(s), JSON.stringify(validateSarif.errors), JSON.stringify(s.runs[0].invocations).slice(0, 300));
