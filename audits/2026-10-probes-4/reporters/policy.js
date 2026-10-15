'use strict';
// A policy that does not allow 'fail' should report cantTell (policyOutcome: 'fail').
const C = '/home/user/core';
const { runa11yCoreOnHtml } = require(C + '/src/testing.js');
const { renderSarifReport } = require(C + '/src/sarif.js');
const { renderJunitReport } = require(C + '/src/junit.js');
const PAGE = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"></main></body></html>';
const tiered = {
  id: 'acme-tiered', meta: { title: 'Tiered', wcagSc: ['1.1.1'], tags: ['wcag2a', 'wcag111'] },
  runInPage: (ctx) => ({ outcome: 'fail', occurrences: [{ __node: ctx.document.querySelector('img'), summary: 'bad', occurrenceOutcome: 'fail' }] })
};
const plain = { ...tiered, id: 'acme-plain', runInPage: (ctx) => ({ outcome: 'fail', occurrences: [{ __node: ctx.document.querySelector('img'), summary: 'bad' }] }) };
const policyContract = { id: 'no-fail', allowedOutcomes: ['pass', 'cantTell', 'notApplicable'] };
const r = runa11yCoreOnHtml(PAGE, { runOnly: ['acme-tiered', 'acme-plain', 'img-alt-present'], engineOptions: { policyContract, customRules: [tiered, plain] }, entryPointParity: false });
for (const c of r.checksResults) console.log(c.ruleId, 'outcome=', c.outcome, 'policyOutcome=', c.policyOutcome, 'tiers=', c.occurrences.map(o => o.occurrenceOutcome));
const run = JSON.parse(renderSarifReport(r)).runs[0];
console.log('SARIF levels', run.results.map(x => x.ruleId + ':' + x.level));
console.log('JUnit', renderJunitReport(r).match(/<testsuites[^>]*>/)[0]);
