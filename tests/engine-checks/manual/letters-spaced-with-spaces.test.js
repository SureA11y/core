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
    ['<p>é t é</p><p>é t é s</p>', 'é t é s']
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.text, text, body);
  }
});

// F32 and RGAA 10.1.3 cover short words too: three capitals that are the
// whole text are asked about.
test(`${RULE_ID}: three capitals making up the whole text are flagged`, () => {
  for (const [body, text] of [
    ['<h2>T O P</h2>', 'T O P'],
    ['<p>É T É</p>', 'É T É'],
    ['<button>N E W</button>', 'N E W']
  ]) {
    for (const options of [RUN, { engineOptions: { profile: 'rgaa-4.1.2' } }]) {
      const rule = assertRule(runa11yCoreOnHtml(page(body), options), RULE_ID, 'cantTell', {
        minOccurrences: 1,
        maxOccurrences: 1
      });
      assert.equal(rule.occurrences[0].data.details.text, text, body);
    }
  }
});

test(`${RULE_ID}: letters split across inline elements are read as one run, on the block`, () => {
  const body =
    '<p id="p"><span>S</span> <span>O</span> <span>L</span> <span>D</span></p>' +
    '<h2 id="h"><b>N</b> E <i>W</i> S</h2>';
  const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 2,
    maxOccurrences: 2
  });
  assert.deepEqual(
    rule.occurrences.map((o) => [(o.html.match(/id="([^"]+)"/) || [])[1], o.data.details.text]),
    [
      ['p', 'S O L D'],
      ['h', 'N E W S']
    ]
  );
});

test(`${RULE_ID}: a run in an inline element is reported once, on its block`, () => {
  const body = '<p id="p">Our <strong>S O L D E S</strong> start today</p>';
  const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.ok(rule.occurrences[0].html.includes('id="p"'));
});

test(`${RULE_ID}: fewer than four letters, letters with punctuation, code and CSS spacing are left alone`, () => {
  for (const body of [
    '<p>Vote for A B C</p>',
    '<p>a b c</p>',
    '<p>N<span>E</span>W<b>S</b></p>',
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
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 4, maxOccurrences: 4 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['lss_case_01', 'lss_case_02', 'lss_case_07', 'lss_case_08']);
});
