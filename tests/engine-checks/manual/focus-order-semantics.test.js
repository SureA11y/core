'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'focus-order-semantics';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no element has both tabindex and role`, () => {
  const html = `<!doctype html><html><body><div tabindex="0">no role</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the role is interactive`, () => {
  const html = `<!doctype html><html><body><div role="button" tabindex="0">button</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when tabindex is negative`, () => {
  const html = `<!doctype html><html><body><div role="heading" tabindex="-1">heading</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when tabindex="0" has a non-interactive role`, () => {
  const html = `<!doctype html><html><body><div role="heading" tabindex="0">heading</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'TABBABLE_WITH_NON_INTERACTIVE_ROLE');
});

test(`${RULE_ID}: leans fail with a click handler, pass when it scrolls or is a document in an application`, () => {
  const { createDom, runa11yCoreOnDom } = require('../../helpers/runDomRulesOnHtml.js');
  const leanOf = (body, setup) => {
    const dom = createDom(`<!doctype html><html><body>${body}</body></html>`);
    if (setup) setup(dom.window.document);
    const rule = assertRule(runa11yCoreOnDom(dom, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'TABBABLE_WITH_NON_INTERACTIVE_ROLE');
    return rule.occurrences[0].lean;
  };
  const clickable = leanOf('<div id="h" role="heading" tabindex="0" onclick="toggle()">Menu</div>');
  assert.equal(clickable.toward, 'fail');
  assert.equal(clickable.i18n.whyKey, 'focusOrderSemantics_lean_why_handler');

  // jsdom has no layout: give the box the sizes a browser would measure.
  const scroller = leanOf(
    '<div id="t" role="table" tabindex="0" style="overflow-y: auto; height: 50px"><div role="row"><div role="cell">1</div></div></div>',
    (doc) => {
      const t = doc.getElementById('t');
      Object.defineProperty(t, 'scrollHeight', { value: 400 });
      Object.defineProperty(t, 'clientHeight', { value: 50 });
    }
  );
  assert.equal(scroller.toward, 'pass');
  assert.equal(scroller.i18n.whyKey, 'focusOrderSemantics_lean_why_scrolls');

  const doc = leanOf(
    '<div role="application" aria-label="Editor"><div role="document" tabindex="0">Text</div></div>'
  );
  assert.equal(doc.toward, 'pass');
  assert.equal(doc.i18n.whyKey, 'focusOrderSemantics_lean_why_documentInApplication');

  // overflow: auto with nothing measured to overflow, and no handler: no lean.
  assert.equal(
    leanOf(
      '<div role="table" tabindex="0" style="overflow-y: auto"><div role="row"><div role="cell">1</div></div></div>'
    ),
    undefined
  );
});

test(`${RULE_ID}: notApplicable when tabindex="0" has role="region"`, () => {
  const html = `<!doctype html><html><body><div role="region" aria-label="Cookie consent banner" tabindex="0">Accept cookies?</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when tabindex="0" has role="tabpanel", which the APG makes focusable when it holds no focusable content`, () => {
  const html = `<!doctype html><html><body><div role="tablist"><button role="tab" aria-selected="true" aria-controls="p">One</button></div><div role="tabpanel" id="p" tabindex="0">Text only</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when tabindex="0" has role="navigation" (only region was removed from the non-interactive-role list, not the whole landmark family)`, () => {
  const html = `<!doctype html><html><body><div id="a" role="navigation" tabindex="0">Nav</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><div role="heading" tabindex="0">heading</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(
    rule.title,
    'Elements added to the tab order should have interactive semantics'
  );
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/focus-order-semantics-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'focus-order-semantics-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });

  const expectedFlaggedIds = ['fos_case_01', 'fos_case_02'];
  const expectedNoOccIds = ['fos_case_03', 'fos_case_04', 'fos_case_05', 'fos_case_06'];

  for (const id of expectedFlaggedIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test(`${RULE_ID}: the role attribute is a fallback list: role="foo heading" is a heading, role="foo" is no role (#91)`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html><body><div role="foo heading" tabindex="0">A</div><div role="foo" tabindex="0">B</div></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: an upper-case role resolves too: role="HEADING" is a heading (#91)`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html><body><div role="HEADING" tabindex="0">A</div></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});
