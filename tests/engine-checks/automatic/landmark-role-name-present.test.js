'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'landmark-role-name-present';

function run(body) {
  return runa11yCoreOnHtml(`<!doctype html><html><body>${body}</body></html>`, {
    runOnly: [RULE_ID]
  });
}

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no element has role="region" or role="form"`, () => {
  assertRule(
    run('<section>A</section><form><input aria-label="x"></form><nav>B</nav>'),
    RULE_ID,
    'notApplicable',
    {
      minOccurrences: 0,
      maxOccurrences: 0
    }
  );
});

test(`${RULE_ID}: pass when every region and form role is named`, () => {
  assertRule(
    run(
      '<div role="region" aria-label="News">A</div><h2 id="h">Login</h2><div role="form" aria-labelledby="h"><input aria-label="u"></div>'
    ),
    RULE_ID,
    'pass',
    { minOccurrences: 0, maxOccurrences: 0 }
  );
});

for (const role of ['region', 'form']) {
  test(`${RULE_ID}: cantTell for an unnamed role="${role}", with its role and reason code`, () => {
    const rule = assertRule(run(`<div role="${role}" id="a">A</div>`), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.ok(hasOccurrenceForId(rule, 'a'));
    const details = rule.occurrences[0].data.details;
    assert.equal(details.reasonCode, 'LANDMARK_ROLE_NAME_MISSING');
    assert.equal(details.role, role);
    assert.equal(rule.occurrences[0].uncertainty.code, 'spec-only');
  });
}

test(`${RULE_ID}: an element hidden from the accessibility tree is left out`, () => {
  assertRule(
    run(
      '<div role="region" style="display:none">A</div><div aria-hidden="true"><div role="form">B</div></div>'
    ),
    RULE_ID,
    'notApplicable',
    { minOccurrences: 0, maxOccurrences: 0 }
  );
});

test(`${RULE_ID}: i18n default is English`, () => {
  const rule = assertRule(run('<div role="region" id="a">A</div>'), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.match(rule.occurrences[0].summary, /role="region" but no accessible name/);
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/landmark-role-name-present-all-scenarios.html)`, () => {
  const fixtureHtml = fs.readFileSync(
    path.join(__dirname, '../..', 'fixtures', 'landmark-role-name-present-all-scenarios.html'),
    'utf8'
  );
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 6, maxOccurrences: 6 });
  for (const n of ['04', '05', '06', '07', '08', '09']) {
    assert.ok(hasOccurrenceForId(rule, `lrn_case_${n}`), `case ${n} reported`);
  }
  for (const n of ['01', '02', '03', '10', '11', '12', '13', '14']) {
    assert.ok(!hasOccurrenceForId(rule, `lrn_case_${n}`), `case ${n} not reported`);
  }
});
