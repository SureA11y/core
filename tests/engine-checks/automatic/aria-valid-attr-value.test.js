'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'aria-valid-attr-value';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no aria-* attributes present`, () => {
  const html = `<!doctype html><html><body><div id="a"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the only aria-* attribute is unrecognized (aria-valid-attr's concern)`, () => {
  const html = `<!doctype html><html><body><div id="a" aria-labell="typo"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass for a valid boolean value`, () => {
  const html = `<!doctype html><html><body><div id="a" aria-hidden="true"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail for an invalid boolean value`, () => {
  const html = `<!doctype html><html><body><div id="a" aria-hidden="yes"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_ATTR_VALUE_INVALID');
});

test(`${RULE_ID}: pass for a valid tristate value ("mixed")`, () => {
  const html = `<!doctype html><html><body><div id="a" aria-checked="mixed"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail for an invalid tristate value`, () => {
  const html = `<!doctype html><html><body><div id="a" aria-checked="maybe"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: fail for an invalid enumerated token`, () => {
  const html = `<!doctype html><html><body><div id="a" aria-live="loud"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: pass for a valid enumerated token`, () => {
  const html = `<!doctype html><html><body><div id="a" aria-live="assertive"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail for a non-integer aria-level`, () => {
  const html = `<!doctype html><html><body><div id="a" role="heading" aria-level="abc"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: pass for a valid integer aria-level`, () => {
  const html = `<!doctype html><html><body><div id="a" role="heading" aria-level="3"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass for an empty ID-reference-list value (allowEmpty)`, () => {
  const html = `<!doctype html><html><body><div id="a" aria-labelledby=""></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass for an empty single-ID-reference value (allowEmpty)`, () => {
  const html = `<!doctype html><html><body><div id="a" role="listbox" aria-activedescendant=""></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass for any non-empty string-typed attribute value`, () => {
  const html = `<!doctype html><html><body><div id="a" aria-label="Anything at all"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when idref-list references only a non-existent id`, () => {
  const html = `<!doctype html><html><body><div id="a" aria-labelledby="does_not_exist"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.valueReason, 'idref-list-none-found');
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_ATTR_VALUE_TARGET_ABSENT');
  assert.equal(rule.occurrences[0].i18n.hintKey, 'ariaValidAttrValue_hint_cantTell_idrefList');
});

test(`${RULE_ID}: a dangling aria-describedby or aria-labelledby on a named button is asked about; a dangling aria-activedescendant still fails`, () => {
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body>
    <button id="a" aria-describedby="nope">a</button>
    <button id="b" aria-labelledby="nope">b</button>
  </body></html>`;
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions });
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
    assert.ok(rule.occurrences.every((o) => o.occurrenceOutcome === 'cantTell'));
  }
  const active = `<!doctype html><html lang="en"><head><title>t</title></head><body>
    <div role="listbox" tabindex="0" aria-label="l" aria-activedescendant="nope"></div>
  </body></html>`;
  assertRule(runa11yCoreOnHtml(active, { runOnly: [RULE_ID] }), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
});

test(`${RULE_ID}: integers outside the range WAI-ARIA sets fail`, () => {
  const cases = [
    ['<div role="heading" aria-level="0">t</div>', 'aria-level'],
    ['<ul><li aria-posinset="0" aria-setsize="3">a</li></ul>', 'aria-posinset'],
    ['<ul><li aria-setsize="-2">a</li></ul>', 'aria-setsize'],
    ['<ul><li aria-setsize="0">a</li></ul>', 'aria-setsize'],
    [
      '<div role="grid"><div role="row" aria-rowindex="0"><div role="gridcell">a</div></div></div>',
      'aria-rowindex'
    ],
    [
      '<div role="table"><div role="row"><div role="cell" aria-colspan="0">a</div></div></div>',
      'aria-colspan'
    ],
    [
      '<div role="table"><div role="row"><div role="cell" aria-rowspan="-1">a</div></div></div>',
      'aria-rowspan'
    ]
  ];
  for (const [body, attr] of cases) {
    const html = `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
    for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
      const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions });
      const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
      assert.equal(rule.occurrences[0].data.details.attr, attr);
      assert.equal(rule.occurrences[0].data.details.valueReason, 'integer-out-of-range');
    }
  }
});

test(`${RULE_ID}: integers inside the range pass, including aria-setsize="-1" and aria-rowspan="0"`, () => {
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body>
    <div role="heading" aria-level="1">t</div>
    <ul><li aria-posinset="1" aria-setsize="-1">a</li></ul>
    <div role="table" aria-colcount="-1"><div role="row"><div role="cell" aria-rowspan="0" aria-colspan="1">a</div></div></div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when idref-list is partially dangling (at least one id resolves)`, () => {
  const html = `<!doctype html><html><body>
    <span id="lbl">Label</span>
    <div id="a" aria-labelledby="lbl does_not_exist"></div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when a single-idref attribute references a non-existent id`, () => {
  const html = `<!doctype html><html><body><div id="a" role="listbox" aria-activedescendant="does_not_exist"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.valueReason, 'idref-not-found');
});

test(`${RULE_ID}: aria-controls referencing a non-existent id is cantTell, not fail (the controlled element is usually built when the widget opens)`, () => {
  const html = `<!doctype html><html><body><button aria-controls="does_not_exist">Show details</button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.valueReason, 'idref-controls-not-found');
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_ATTR_VALUE_TARGET_ABSENT');
  assert.equal(rule.occurrences[0].occurrenceOutcome, 'cantTell');
});

test(`${RULE_ID}: pass when aria-controls has no target but the widget is collapsed (aria-expanded="false")`, () => {
  const html = `<!doctype html><html><body><button aria-expanded="false" aria-controls="not_yet">Open menu</button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when aria-controls has no target but the tab is unselected (aria-selected="false")`, () => {
  const html = `<!doctype html><html><body><div role="tab" aria-selected="false" aria-controls="not_yet">Second tab</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when aria-controls resolves`, () => {
  const html = `<!doctype html><html><body>
    <button aria-expanded="true" aria-controls="panel">Hide details</button>
    <div id="panel">Details</div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a real fail elsewhere keeps the outcome at fail and carries the aria-controls occurrence along`, () => {
  const html = `<!doctype html><html><body>
    <button aria-controls="does_not_exist">Show details</button>
    <div aria-hidden="yes">Bad boolean</div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });

  const tiers = rule.occurrences.map((o) => o.occurrenceOutcome).sort();
  assert.deepStrictEqual(tiers, ['cantTell', 'fail']);
});

test(`${RULE_ID}: aria-errormessage referencing a non-existent id is not flagged (ACT 6a7281: the target may be created only once the error actually occurs)`, () => {
  const html = `<!doctype html><html><body><div role="textbox" aria-errormessage="does_not_exist" aria-label="A textbox"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a bare boolean/tristate attribute with no "=value" at all is out of scope, not invalid (ACT 6a7281: applicability requires a non-empty value)`, () => {
  const html = `<!doctype html><html><body><div role="checkbox" aria-checked>Accept terms</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: an empty token-list value is out of scope, not invalid`, () => {
  const html = `<!doctype html><html><body><div id="a" aria-relevant=""></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><div id="a" aria-hidden="yes"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'aria-* attribute values must match their declared type');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/aria-valid-attr-value-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'aria-valid-attr-value-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 15, maxOccurrences: 15 });

  const expectedFailIds = [
    'avav_case_06',
    'avav_case_07',
    'avav_case_08',
    'avav_case_09',
    'avav_case_15',
    'avav_case_18',
    'avav_case_19',
    'avav_case_21',
    'avav_case_22',
    'avav_case_23',
    'avav_case_24'
  ];
  const expectedCantTellIds = ['avav_case_14', 'avav_case_17', 'avav_case_25', 'avav_case_26'];
  const expectedNoOccIds = [
    'avav_case_01',
    'avav_case_02',
    'avav_case_03',
    'avav_case_04',
    'avav_case_05',
    'avav_case_10',
    'avav_case_11',
    'avav_case_12',
    'avav_case_13',
    'avav_case_16',
    'avav_case_20',
    'avav_case_27',
    'avav_case_28',
    'avav_case_29',
    'avav_case_30',
    'avav_case_31',
    'avav_case_32'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedCantTellIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }

  const tierById = {};
  for (const o of rule.occurrences) {
    const match = /id="(avav_case_\d+)"/.exec(typeof o.html === 'string' ? o.html : '');
    if (match) tierById[match[1]] = o.occurrenceOutcome;
  }
  for (const id of expectedFailIds) assert.strictEqual(tierById[id], 'fail');
  for (const id of expectedCantTellIds) assert.strictEqual(tierById[id], 'cantTell');
});

test(`${RULE_ID}: true, false and mixed are valid in any case, as Chromium reads them`, () => {
  const html = `<!doctype html><html><body>
    <div role="checkbox" tabindex="0" aria-checked="TRUE">a</div>
    <div role="checkbox" tabindex="0" aria-checked="Mixed">b</div>
    <button aria-pressed="False">c</button>
    <button aria-expanded="FALSE">d</button>
    <div aria-hidden="True"><span>e</span></div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass');
});

test(`${RULE_ID}: a misspelt boolean still fails in any case`, () => {
  const html = `<!doctype html><html><body><button aria-pressed="TRUEE">c</button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail');
});

function relation(body) {
  const result = runa11yCoreOnHtml(`<!doctype html><html lang="en"><body>${body}</body></html>`, {
    runOnly: [RULE_ID]
  });
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  const o = rule.occurrences[0];
  return { outcome: rule.outcome, details: o ? o.data.details : null, occurrence: o };
}

test(`${RULE_ID}: a range whose minimum is above its maximum fails`, () => {
  const r = relation(
    '<div role="slider" tabindex="0" aria-label="v" aria-valuemin="10" aria-valuemax="0" aria-valuenow="5"></div>'
  );
  assert.equal(r.outcome, 'fail');
  assert.deepEqual(r.details, {
    reasonCode: 'ARIA_VALUE_RANGE_INVERTED',
    role: 'slider',
    valuemin: 10,
    valuemax: 0
  });
});

test(`${RULE_ID}: aria-valuenow outside the range fails, with ARIA's defaults where the role has them`, () => {
  const cases = [
    [
      '<div role="slider" tabindex="0" aria-label="v" aria-valuemin="0" aria-valuemax="10" aria-valuenow="50"></div>',
      'fail',
      0,
      10
    ],
    [
      '<div role="slider" tabindex="0" aria-label="v" aria-valuemin="20" aria-valuenow="5"></div>',
      'fail',
      20,
      100
    ],
    ['<div role="meter" aria-label="v" aria-valuenow="101"></div>', 'fail', 0, 100],
    [
      '<div role="scrollbar" aria-controls="x" aria-label="v" aria-valuenow="-1"></div><div id="x"></div>',
      'fail',
      0,
      100
    ],
    [
      '<div role="spinbutton" tabindex="0" aria-label="v" aria-valuemax="10" aria-valuenow="50"></div>',
      'fail',
      null,
      10
    ],
    ['<div role="spinbutton" tabindex="0" aria-label="v" aria-valuenow="-50"></div>', 'pass'],
    ['<div role="slider" tabindex="0" aria-label="v" aria-valuenow="100"></div>', 'pass'],
    [
      '<div role="slider" tabindex="0" aria-label="v" aria-valuenow="150" aria-valuetext="Max plus"></div>',
      'pass'
    ],
    // A native element's range is its own min and max (HTML-AAM), not 0 to 100.
    [
      '<progress role="progressbar" aria-label="v" max="1000" value="500" aria-valuenow="500"></progress>',
      'pass'
    ],
    [
      '<input type="range" role="slider" aria-label="v" min="1900" max="2100" value="2000" aria-valuenow="2000">',
      'pass'
    ],
    [
      '<meter role="meter" aria-label="v" max="500" value="250" aria-valuenow="250"></meter>',
      'pass'
    ],
    ['<meter role="meter" aria-label="v" value="0.5" aria-valuenow="7"></meter>', 'fail', 0, 1],
    [
      '<input type="number" role="spinbutton" aria-label="v" max="5" aria-valuenow="9">',
      'fail',
      null,
      5
    ]
  ];
  for (const [markup, outcome, min, max] of cases) {
    const r = relation(markup);
    assert.equal(r.outcome, outcome, markup);
    if (outcome === 'fail') {
      assert.equal(r.details.reasonCode, 'ARIA_VALUENOW_OUT_OF_RANGE', markup);
      assert.equal(r.details.valuemin, min, markup);
      assert.equal(r.details.valuemax, max, markup);
    }
  }
});

test(`${RULE_ID}: an invalid value is reported once, not compared too`, () => {
  const r = relation(
    '<div role="slider" tabindex="0" aria-label="v" aria-valuemin="0" aria-valuemax="10" aria-valuenow="lots"></div>'
  );
  assert.equal(r.details.reasonCode, 'ARIA_ATTR_VALUE_INVALID');
});

test(`${RULE_ID}: aria-posinset beyond aria-setsize fails; an unknown size does not`, () => {
  const r = relation(
    '<div role="listbox" aria-label="l"><div role="option" aria-posinset="4" aria-setsize="3">a</div></div>'
  );
  assert.equal(r.outcome, 'fail');
  assert.deepEqual(r.details, {
    reasonCode: 'ARIA_POSINSET_EXCEEDS_SETSIZE',
    posinset: 4,
    setsize: 3
  });
  assert.equal(
    relation(
      '<div role="listbox" aria-label="l"><div role="option" aria-posinset="4" aria-setsize="-1">a</div></div>'
    ).outcome,
    'pass'
  );
});

test(`${RULE_ID}: aria-haspopup naming another role than its popup's is asked about`, () => {
  const r = relation(
    '<button aria-haspopup="true" aria-controls="p">a</button><div id="p" role="listbox" aria-label="l"><div role="option">x</div></div>'
  );
  assert.equal(r.outcome, 'cantTell');
  assert.deepEqual(r.details, {
    reasonCode: 'ARIA_HASPOPUP_ROLE_MISMATCH',
    haspopup: 'true',
    expectedRole: 'menu',
    popupRole: 'listbox'
  });
  assert.equal(r.occurrence.uncertainty.code, 'runtime-dependent');
  for (const markup of [
    '<button aria-haspopup="dialog" aria-controls="d">a</button><dialog id="d" open>x</dialog>',
    '<button aria-haspopup="grid" aria-controls="w">a</button><div id="w"><div role="grid" aria-label="g"></div></div>',
    '<button aria-haspopup="menu" aria-controls="w">a</button><div id="w">no role</div>',
    // A select with multiple or a size above 1 is a listbox.
    '<button aria-haspopup="listbox" aria-controls="s">a</button><select id="s" multiple aria-label="l"><option>x</option></select>',
    '<button aria-haspopup="listbox" aria-controls="s">a</button><select id="s" size="3" aria-label="l"><option>x</option></select>'
  ]) {
    assert.equal(relation(markup).outcome, 'pass', markup);
  }
});

test(`${RULE_ID}: aria-activedescendant outside the host is asked about, unless owned or controlled`, () => {
  const r = relation(
    '<div role="listbox" tabindex="0" aria-label="l" aria-activedescendant="o"></div><div id="o" role="option">a</div>'
  );
  assert.equal(r.outcome, 'cantTell');
  assert.equal(r.details.reasonCode, 'ARIA_ACTIVEDESCENDANT_OUTSIDE');
  assert.equal(r.occurrence.uncertainty.code, 'spec-only');
  for (const markup of [
    '<div role="listbox" tabindex="0" aria-label="l" aria-owns="o" aria-activedescendant="o"></div><div id="o" role="option">a</div>',
    '<div role="listbox" tabindex="0" aria-label="l" aria-activedescendant="o"><div id="o" role="option">a</div></div>',
    '<div role="combobox" tabindex="0" aria-label="c" aria-expanded="true" aria-activedescendant="o"></div><div role="listbox" aria-label="l"><div id="o" role="option">a</div></div>'
  ]) {
    assert.equal(relation(markup).outcome, 'pass', markup);
  }
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

test(`${RULE_ID}: leans fail for a reference to an id that differs only in case`, () => {
  const lean = leanOn(
    '<div id="a" aria-describedby="Hint-Text">x</div><p id="hint-text">h</p>',
    'a'
  );
  assert.strictEqual(lean.toward, 'fail');
  assert.strictEqual(lean.i18n.whyKey, 'ariaValidAttrValue_lean_why_nearMiss');
});

test(`${RULE_ID}: no lean for a reference to the next number of a numbered id`, () => {
  assert.strictEqual(
    leanOn('<div id="a" aria-describedby="item-3">x</div><p id="item-2">h</p>', 'a'),
    undefined
  );
});

test(`${RULE_ID}: leans fail for a reference to an id in another shadow tree`, () => {
  const { createDom, runa11yCoreOnDom } = require('../../helpers/runDomRulesOnHtml.js');
  const dom = createDom(
    '<!doctype html><html lang="en"><body><div id="a" aria-describedby="tip">x</div><div id="host"></div></body></html>'
  );
  const host = dom.window.document.getElementById('host');
  host.attachShadow({ mode: 'open' }).innerHTML = '<p id="tip">Tip</p>';
  const rule = assertRule(runa11yCoreOnDom(dom, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 1
  });
  const occ = rule.occurrences.find((o) => o.html.includes('id="a"'));
  assert.strictEqual(occ.lean.toward, 'fail');
  assert.strictEqual(occ.lean.i18n.whyKey, 'ariaValidAttrValue_lean_why_otherTree');
});

test(`${RULE_ID}: leans fail for an open popup with another role than aria-haspopup`, () => {
  const lean = leanOn(
    '<button id="a" aria-haspopup="menu" aria-controls="p" aria-expanded="true">Open</button><div id="p" role="dialog">d</div>',
    'a'
  );
  assert.strictEqual(lean.toward, 'fail');
  assert.strictEqual(lean.i18n.whyKey, 'ariaValidAttrValue_lean_why_haspopupOpen');
});

test(`${RULE_ID}: no lean for a closed popup with another role than aria-haspopup`, () => {
  assert.strictEqual(
    leanOn(
      '<button id="a" aria-haspopup="menu" aria-controls="p" aria-expanded="false">Open</button><div id="p" role="dialog" hidden>d</div>',
      'a'
    ),
    undefined
  );
});
