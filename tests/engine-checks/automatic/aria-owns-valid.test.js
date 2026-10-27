'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const {
  runa11yCoreOnHtml,
  createDom,
  runa11yCoreOnDom
} = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'aria-owns-valid';

function run(body) {
  return runa11yCoreOnHtml(`<!doctype html><html lang="en"><body>${body}</body></html>`, {
    runOnly: [RULE_ID]
  });
}

test(`${RULE_ID}: notApplicable without an aria-owns that names an element`, () => {
  assertRule(run('<div role="list" aria-label="x"></div>'), RULE_ID, 'notApplicable');
  assertRule(
    run('<div role="list" aria-label="x" aria-owns="nope"></div>'),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: pass when each element has one owner`, () => {
  assertRule(
    run(
      '<div role="list" aria-label="x" aria-owns="a b"></div><div id="a" role="listitem">A</div><div id="b" role="listitem">B</div>'
    ),
    RULE_ID,
    'pass',
    { maxOccurrences: 0 }
  );
});

test(`${RULE_ID}: an element with two owners fails once, on the element owned`, () => {
  const rule = assertRule(
    run(
      '<div role="list" aria-label="a" aria-owns="i"></div><div role="list" aria-label="b" aria-owns="i"></div><div role="list" aria-label="c" aria-owns="i"></div><div id="i" role="listitem">x</div>'
    ),
    RULE_ID,
    'fail',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.match(rule.occurrences[0].html, /id="i"/);
  assert.deepEqual(rule.occurrences[0].data.details, {
    reasonCode: 'ARIA_OWNS_DUPLICATE',
    ownerCount: 3,
    ownedId: 'i'
  });
});

test(`${RULE_ID}: an owner naming itself or an ancestor fails, on the owner`, () => {
  const rule = assertRule(
    run('<div id="o"><div id="g" role="group" aria-label="g" aria-owns="o g">x</div></div>'),
    RULE_ID,
    'fail',
    { minOccurrences: 2, maxOccurrences: 2 }
  );
  assert.deepEqual(
    rule.occurrences.map((o) => [o.data.details.reasonCode, o.data.details.ownedId]),
    [
      ['ARIA_OWNS_ANCESTOR', 'o'],
      ['ARIA_OWNS_ANCESTOR', 'g']
    ]
  );
});

test(`${RULE_ID}: ids resolve in each owner's own tree`, () => {
  // An owner in a shadow root and one in the page name the same id, each in
  // its own tree: two different elements, so no conflict.
  const dom = createDom(
    '<!doctype html><html lang="en"><body><div role="list" aria-label="p" aria-owns="i"></div><div id="i" role="listitem">Page</div><div id="host"></div></body></html>'
  );
  dom.window.document.getElementById('host').attachShadow({ mode: 'open' }).innerHTML =
    '<div role="list" aria-label="s" aria-owns="i"></div><div id="i" role="listitem">Shadow</div>';
  assertRule(runa11yCoreOnDom(dom, { runOnly: [RULE_ID] }), RULE_ID, 'pass');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/aria-owns-valid-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'aria-owns-valid-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 3, maxOccurrences: 3 });
  const byId = Object.fromEntries(
    rule.occurrences.map((o) => [o.html.match(/id="(aov_case_\d+)"/)[1], o.data.details.reasonCode])
  );
  assert.deepEqual(byId, {
    aov_case_03: 'ARIA_OWNS_DUPLICATE',
    aov_case_04: 'ARIA_OWNS_ANCESTOR',
    aov_case_05: 'ARIA_OWNS_ANCESTOR'
  });
});
