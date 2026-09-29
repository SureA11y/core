'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'letters-spaced-with-spaces';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
}

const FLAGGED = '<h2>S O L D E S</h2>';

test(`${RULE_ID}: four or more single letters separated by spaces are flagged, never failed`, () => {
  const rule = assertRule(runa11yCoreOnHtml(page(FLAGGED), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.deepEqual(occ.data.details, {
    reasonCode: 'lettersSeparatedBySpaces',
    text: 'S O L D E S'
  });
  assert.deepEqual(occ.i18n.params, { text: 'S O L D E S' });
  assert.equal(occ.summary, 'The text "S O L D E S" has its letters separated by spaces.');
});

test(`${RULE_ID}: no-break spaces, several spaces and accented letters count`, () => {
  for (const [body, text] of [
    ['<p>H&nbsp;E&nbsp;L&nbsp;L&nbsp;O!</p>', 'H E L L O'],
    ['<p>Big  S  A  L  E  today</p>', 'S A L E'],
    ['<p>É T É</p><p>É T É S</p>', 'É T É S']
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.text, text, body);
  }
});

test(`${RULE_ID}: fewer than four letters, letters with punctuation, code and CSS spacing are left alone`, () => {
  for (const body of [
    '<p>Vote for A B C</p>',
    '<p>Choose a, b, c or d</p>',
    '<p>J. R. R. T. Tolkien</p>',
    '<p><code>a b c d</code></p>',
    '<pre>x y z w</pre>',
    '<p style="letter-spacing: 1em">SOLDES</p>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: opt-in, so a default run does not include it`, () => {
  const result = runa11yCoreOnHtml(page(FLAGGED));
  assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/letters-spaced-with-spaces-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'letters-spaced-with-spaces-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['lss_case_01', 'lss_case_02']);
});
