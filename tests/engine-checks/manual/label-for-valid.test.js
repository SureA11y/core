'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'label-for-valid';

function run(body) {
  return runa11yCoreOnHtml(`<!doctype html><html lang="en"><body>${body}</body></html>`, {
    runOnly: [RULE_ID]
  });
}

test(`${RULE_ID}: notApplicable without a label carrying for`, () => {
  assertRule(
    run('<label>Name <input></label><label for="">Empty</label>'),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: pass when for names a labelable element`, () => {
  assertRule(
    run(
      '<label for="a">A</label><input id="a"><label for="b">B</label><textarea id="b"></textarea><label for="c">C</label><meter id="c" value="1"></meter><label for="d">D</label><button id="d">x</button>'
    ),
    RULE_ID,
    'pass',
    { maxOccurrences: 0 }
  );
});

test(`${RULE_ID}: a for naming no element is asked about`, () => {
  const rule = assertRule(run('<label for="nope">Name</label>'), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.deepEqual(rule.occurrences[0].data.details, {
    reasonCode: 'LABEL_FOR_TARGET_MISSING',
    for: 'nope'
  });
  assert.equal(rule.occurrences[0].uncertainty, undefined, 'a manual rule carries no uncertainty');
});

test(`${RULE_ID}: a for naming an element that can't be labelled is asked about`, () => {
  const rule = assertRule(
    run('<label for="x">Name</label><span id="x">x</span>'),
    RULE_ID,
    'cantTell'
  );
  assert.deepEqual(rule.occurrences[0].data.details, {
    reasonCode: 'LABEL_FOR_NOT_LABELABLE',
    for: 'x',
    targetElement: 'span'
  });
});

test(`${RULE_ID}: is a best practice, mapped to no WCAG criterion`, () => {
  const rule = assertRule(run('<label for="nope">Name</label>'), RULE_ID, 'cantTell');
  assert.deepEqual(rule.wcagSc || [], []);
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/label-for-valid-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'label-for-valid-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 3, maxOccurrences: 3 });
  assert.deepEqual(
    rule.occurrences.map((o) => [
      o.html.match(/id="(lfv_case_\d+)"/)[1],
      o.data.details.reasonCode
    ]),
    [
      ['lfv_case_04', 'LABEL_FOR_TARGET_MISSING'],
      ['lfv_case_05', 'LABEL_FOR_NOT_LABELABLE'],
      ['lfv_case_06', 'LABEL_FOR_NOT_LABELABLE']
    ]
  );
});
