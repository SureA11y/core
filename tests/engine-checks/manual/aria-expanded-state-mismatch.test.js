'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'aria-expanded-state-mismatch';

function run(body, opts = {}) {
  return runa11yCoreOnHtml(`<!doctype html><html lang="en"><body>${body}</body></html>`, {
    runOnly: [RULE_ID],
    ...opts
  });
}

test(`${RULE_ID}: notApplicable without aria-expanded and aria-controls together`, () => {
  assertRule(run('<button aria-expanded="false">More</button>'), RULE_ID, 'notApplicable');
  assertRule(
    run('<button aria-controls="p">More</button><div id="p">x</div>'),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: pass when the state matches what is shown`, () => {
  assertRule(
    run(
      '<button aria-expanded="false" aria-controls="a">A</button><div id="a" hidden>a</div>' +
        '<button aria-expanded="true" aria-controls="b">B</button><div id="b">b</div>'
    ),
    RULE_ID,
    'pass',
    { maxOccurrences: 0 }
  );
});

test(`${RULE_ID}: cantTell when collapsed but the controlled content is shown`, () => {
  const rule = assertRule(
    run('<button aria-expanded="false" aria-controls="p">More</button><div id="p">Text</div>'),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.deepEqual(rule.occurrences[0].data.details, {
    reasonCode: 'EXPANDED_FALSE_CONTROLLED_SHOWN',
    ariaExpanded: 'false',
    controlledCount: 1
  });
});

test(`${RULE_ID}: cantTell when expanded but every controlled element is hidden`, () => {
  const rule = assertRule(
    run(
      '<button aria-expanded="TRUE" aria-controls="a b">More</button><div id="a" hidden>a</div><div id="b" style="visibility:hidden">b</div>'
    ),
    RULE_ID,
    'cantTell'
  );
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'EXPANDED_TRUE_CONTROLLED_HIDDEN');
  assert.equal(rule.occurrences[0].data.details.controlledCount, 2);
});

test(`${RULE_ID}: a panel whose content-visibility: hidden skips its contents is hidden`, () => {
  const rule = assertRule(
    run(
      '<button aria-expanded="true" aria-controls="p">Menu</button><div id="p" style="content-visibility:hidden">Panel</div>'
    ),
    RULE_ID,
    'cantTell'
  );
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'EXPANDED_TRUE_CONTROLLED_HIDDEN');
  // An inline box can't take it, so its text stays shown.
  assertRule(
    run(
      '<button aria-expanded="true" aria-controls="p">Menu</button><span id="p" style="content-visibility:hidden">Panel</span>'
    ),
    RULE_ID,
    'pass'
  );
});

test(`${RULE_ID}: a partly shown set of controlled elements is left alone`, () => {
  assertRule(
    run(
      '<button aria-expanded="false" aria-controls="a b">More</button><div id="a" hidden>a</div><div id="b">b</div>'
    ),
    RULE_ID,
    'pass'
  );
});

test(`${RULE_ID}: combobox, unknown values, dangling ids and ancestors are left out`, () => {
  assertRule(
    run(
      '<input role="combobox" aria-label="City" aria-expanded="false" aria-controls="l"><ul id="l" role="listbox" aria-label="Cities"><li role="option">Paris</li></ul>' +
        '<button aria-expanded="maybe" aria-controls="p">A</button><div id="p">x</div>' +
        '<button aria-expanded="false" aria-controls="nope">B</button>' +
        '<div id="g"><button aria-expanded="false" aria-controls="g">C</button></div>'
    ),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: hidden content is read the same under includeHiddenElements`, () => {
  const rule = assertRule(
    run('<button aria-expanded="true" aria-controls="p">More</button><div id="p" hidden>x</div>', {
      engineOptions: { includeHiddenElements: true }
    }),
    RULE_ID,
    'cantTell'
  );
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'EXPANDED_TRUE_CONTROLLED_HIDDEN');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/aria-expanded-state-mismatch-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'aria-expanded-state-mismatch-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 3, maxOccurrences: 3 });
  assert.deepEqual(
    rule.occurrences.map((o) => [
      o.html.match(/id="(aesm_case_\d+)"/)[1],
      o.data.details.reasonCode
    ]),
    [
      ['aesm_case_05', 'EXPANDED_FALSE_CONTROLLED_SHOWN'],
      ['aesm_case_06', 'EXPANDED_TRUE_CONTROLLED_HIDDEN'],
      ['aesm_case_07', 'EXPANDED_TRUE_CONTROLLED_HIDDEN']
    ]
  );
});

// Leans: which way each undecided finding points.
function leanOn(html, id, ruleId = RULE_ID) {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body>${html}</body></html>`,
    { runOnly: [ruleId] }
  );
  const rule = assertRule(result, ruleId, 'cantTell', { minOccurrences: 1 });
  const occ = rule.occurrences.find(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
  assert.ok(occ, `expected an occurrence on #${id}`);
  assert.strictEqual(occ.occurrenceOutcome || 'cantTell', 'cantTell');
  return occ.lean;
}

test(`${RULE_ID}: leans fail for a collapsed toggle whose content is shown in full`, () => {
  const lean = leanOn(
    '<button id="a" aria-expanded="false" aria-controls="p">More</button><div id="p">Panel</div>',
    'a'
  );
  assert.strictEqual(lean.toward, 'fail');
  assert.strictEqual(lean.i18n.whyKey, 'ariaExpandedStateMismatch_lean_why_collapsedShown');
});

test(`${RULE_ID}: no lean for a collapsed toggle whose content is moved by a transform`, () => {
  assert.strictEqual(
    leanOn(
      '<button id="a" aria-expanded="false" aria-controls="p">Menu</button><div id="p" style="transform: translateX(-100%)">Panel</div>',
      'a'
    ),
    undefined
  );
});

test(`${RULE_ID}: leans fail for an expanded toggle whose content is not displayed`, () => {
  const lean = leanOn(
    '<button id="a" aria-expanded="true" aria-controls="p">More</button><div id="p" style="display: none">Panel</div>',
    'a'
  );
  assert.strictEqual(lean.toward, 'fail');
  assert.strictEqual(lean.i18n.whyKey, 'ariaExpandedStateMismatch_lean_why_expandedHidden');
});

test(`${RULE_ID}: no lean for an expanded toggle whose content is hidden with aria-hidden`, () => {
  assert.strictEqual(
    leanOn(
      '<button id="a" aria-expanded="true" aria-controls="p">More</button><div id="p" aria-hidden="true">Panel</div>',
      'a'
    ),
    undefined
  );
});
