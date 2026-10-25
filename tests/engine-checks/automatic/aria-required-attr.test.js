'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'aria-required-attr';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no role attributes present`, () => {
  const html = `<!doctype html><html><body><div id="a"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when role has no required-attrs entry`, () => {
  const html = `<!doctype html><html><body><div id="a" role="button"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when the required attribute is present`, () => {
  const html = `<!doctype html><html><body><div id="a" role="checkbox" aria-checked="true"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when the required attribute is missing`, () => {
  const html = `<!doctype html><html><body><div id="a" role="checkbox"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.attr, 'aria-checked');
  assert.equal(rule.occurrences[0].data.details.role, 'checkbox');
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_ATTR_REQUIRED_MISSING');
});

test(`${RULE_ID}: fail when the required attribute is present but empty`, () => {
  const html = `<!doctype html><html><body><div id="a" role="checkbox" aria-checked="   "></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: notApplicable when role has an unknown/invalid role token`, () => {
  const html = `<!doctype html><html><body><div id="a" role="chekbox"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><div id="a" role="checkbox"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Roles with a required ARIA state/property must carry it');
});

test(`${RULE_ID}: pass when role="heading" has aria-level present`, () => {
  const html = `<!doctype html><html><body><div id="a" role="heading" aria-level="2"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when role="heading" has no aria-level, ARIA gives heading an implicit level of 2`, () => {
  const html = `<!doctype html><html><body><div id="a" role="heading"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.attr, 'aria-level');
  assert.equal(rule.occurrences[0].data.details.role, 'heading');
  assert.equal(rule.occurrences[0].data.details.implicitValue, '2');
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_ATTR_REQUIRED_MISSING_IMPLICIT');
});

test(`${RULE_ID}: cantTell when role="combobox" has no aria-expanded, ARIA gives combobox an implicit "false"`, () => {
  const html = `<!doctype html><html><body><div id="a" role="combobox"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.implicitValue, 'false');
});

test(`${RULE_ID}: role="checkbox" without aria-checked stays a fail, ARIA supplies no implicit value for it`, () => {
  const html = `<!doctype html><html><body><div id="a" role="checkbox"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_ATTR_REQUIRED_MISSING');
});

test(`${RULE_ID}: a fail-tier finding outranks a cantTell-tier one, and neither is dropped`, () => {
  const html = `<!doctype html><html><body>
    <div id="a" role="checkbox"></div>
    <div id="b" role="heading">Title</div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  const byId = (id) => rule.occurrences.find((o) => o.html && o.html.includes(`id="${id}"`));
  assert.equal(byId('a').occurrenceOutcome, 'fail');
  assert.equal(byId('b').occurrenceOutcome, 'cantTell');
});

test(`${RULE_ID}: the implicit-value table matches aria-query, no hand-picked list`, () => {
  const { roles } = require('aria-query');
  const expected = {};
  for (const [name, def] of roles.entries()) {
    if (def.abstract) continue;
    for (const [prop, implicit] of Object.entries(def.requiredProps || {})) {
      if (implicit === null || implicit === undefined) continue;
      expected[`${name}/${prop}`] = String(implicit);
    }
  }
  const { createAriaHelpers } = require('../../../src/core/aria-helpers.js');
  const aria = createAriaHelpers({}, {});
  for (const [key, value] of Object.entries(expected)) {
    const [role, attr] = key.split('/');
    assert.equal(aria.getRequiredAttrImplicitValue(role, attr), value, key);
  }
  assert.equal(aria.getRequiredAttrImplicitValue('checkbox', 'aria-checked'), null);
});

test(`${RULE_ID}: fail when role="meter" has no aria-valuenow (meter has no "indeterminate" concept unlike progressbar, so this is unconditional)`, () => {
  const html = `<!doctype html><html><body><div id="a" role="meter" aria-valuemin="0" aria-valuemax="100"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.attr, 'aria-valuenow');
  assert.equal(rule.occurrences[0].data.details.role, 'meter');
});

test(`${RULE_ID}: pass when role="meter" has aria-valuenow present`, () => {
  const html = `<!doctype html><html><body><div id="a" role="meter" aria-valuenow="42" aria-valuemin="0" aria-valuemax="100"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when role="progressbar" has no aria-valuenow (not required on purpose, an indeterminate progressbar legitimately omits it)`, () => {
  const html = `<!doctype html><html><body><div id="a" role="progressbar"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass for role="combobox" with aria-expanded present but no aria-controls (aria-controls is not required unconditionally, only once the popup is displayed, per MDN's combobox role page; adding it here would risk a false fail)`, () => {
  const html = `<!doctype html><html><body><div id="a" role="combobox" aria-expanded="false"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable for a native <h2> with no explicit role (implicit level, not this rule's concern)`, () => {
  const html = `<!doctype html><html><body><h2 id="a">Native heading</h2></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the element has the hidden attribute (not currently exposed to the accessibility tree)`, () => {
  const html = `<!doctype html><html><body><div id="a" role="checkbox" hidden></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

// WAI-ARIA's aria-busy exception covers required owned elements, not
// required states, and ACT 4e8ab6 makes none.
for (const busy of ['true', 'false']) {
  test(`${RULE_ID}: aria-busy="${busy}" does not exempt a missing required state`, () => {
    const html = `<!doctype html><html><body><div id="a" role="checkbox" aria-busy="${busy}"></div></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    assert.equal(rule.occurrences[0].data.details.attr, 'aria-checked');
  });
}

test(`${RULE_ID}: fail when a focusable role="separator" has no aria-valuenow`, () => {
  const html = `<!doctype html><html><body><p>a</p><div role="separator" tabindex="0" id="a"></div><p>b</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.strictEqual(rule.occurrences[0].data.details.attr, 'aria-valuenow');
});

test(`${RULE_ID}: a non-focusable role="separator" needs no aria-valuenow`, () => {
  const html = `<!doctype html><html><body><div role="separator" id="a"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a native checkbox or radio with another checkable role needs no aria-checked`, () => {
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body>
    <label><input type="checkbox" role="switch" id="a"> a</label>
    <label><input type="checkbox" role="menuitemcheckbox" id="b"> b</label>
    <label><input type="radio" role="menuitemradio" name="r" id="c"> c</label>
    <label><input type="checkbox" role="radio" id="d"> d</label>
  </body></html>`;
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a non-checkable input with role="switch" still needs aria-checked`, () => {
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body>
    <input type="text" role="switch" id="a" aria-label="x">
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.attr, 'aria-checked');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/aria-required-attr-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'aria-required-attr-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 7, maxOccurrences: 7 });

  const expectedFailIds = [
    'ara_case_02',
    'ara_case_03',
    'ara_case_09',
    'ara_case_14',
    'ara_case_15'
  ];
  const expectedCantTellIds = ['ara_case_07', 'ara_case_17'];

  for (const id of expectedCantTellIds) {
    const occ = rule.occurrences.find((o) => o.html && o.html.includes(`id="${id}"`));
    assert.ok(occ, `Expected occurrence for id="${id}"`);
    assert.equal(occ.occurrenceOutcome, 'cantTell', `Expected cantTell tier for id="${id}"`);
  }
  const expectedNoOccIds = [
    'ara_case_01',
    'ara_case_04',
    'ara_case_05',
    'ara_case_06',
    'ara_case_08',
    'ara_case_10',
    'ara_case_11',
    'ara_case_12',
    'ara_case_13',
    'ara_case_16',
    'ara_case_18'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
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

test(`${RULE_ID}: leans fail for a combobox without aria-expanded whose popup is shown`, () => {
  const lean = leanOn(
    '<div id="a" role="combobox" aria-controls="l"></div><ul id="l" role="listbox"><li role="option">One</li></ul>',
    'a'
  );
  assert.strictEqual(lean.toward, 'fail');
  assert.strictEqual(lean.i18n.whyKey, 'ariaRequiredAttr_lean_why_comboboxOpen');
});

test(`${RULE_ID}: no lean for a combobox without aria-expanded whose popup is hidden`, () => {
  assert.strictEqual(
    leanOn(
      '<div id="a" role="combobox" aria-controls="l"></div><ul id="l" role="listbox" hidden><li role="option">One</li></ul>',
      'a'
    ),
    undefined
  );
});

test(`${RULE_ID}: no lean for a heading without aria-level`, () => {
  assert.strictEqual(leanOn('<div id="a" role="heading">Title</div>', 'a'), undefined);
});

test(`${RULE_ID}: state_internals leans by what the component's code does`, () => {
  const {
    createDom: createLeanDom,
    runa11yCoreOnDom: runLeanOnDom
  } = require('../../helpers/runDomRulesOnHtml.js');
  const dom = createLeanDom(
    '<!doctype html><html lang="en"><body><x-plain id="a" role="checkbox"></x-plain><x-set id="b" role="checkbox"></x-set><x-other id="c" role="checkbox"></x-other></body></html>'
  );
  const W = dom.window;
  W.customElements.define('x-plain', class extends W.HTMLElement {});
  W.customElements.define(
    'x-set',
    class extends W.HTMLElement {
      #internals;
      constructor() {
        super();
        this.#internals = this.attachInternals();
        this.#internals.ariaChecked = 'false';
      }
    }
  );
  W.customElements.define(
    'x-other',
    class extends W.HTMLElement {
      constructor() {
        super();
        this.attachInternals();
      }
    }
  );
  const rule = assertRule(runLeanOnDom(dom, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 3,
    maxOccurrences: 3
  });
  const lean = (id) => rule.occurrences.find((o) => o.html.includes(`id="${id}"`)).lean;
  for (const o of rule.occurrences)
    assert.strictEqual(o.data.details.reasonCode, 'state_internals');
  assert.strictEqual(lean('a').toward, 'fail');
  assert.strictEqual(lean('a').i18n.whyKey, 'ariaRequiredAttr_lean_why_internalsUnused');
  assert.strictEqual(lean('b').toward, 'pass');
  assert.strictEqual(lean('b').i18n.whyKey, 'ariaRequiredAttr_lean_why_internalsSet');
  assert.strictEqual(lean('c'), undefined);
});
