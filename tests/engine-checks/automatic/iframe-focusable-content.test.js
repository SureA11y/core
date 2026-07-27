'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { createDom, runa11yCoreOnDom, runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'iframe-focusable-content';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when no iframe has a negative tabindex`, () => {
  const dom = createDom(`<!doctype html><html><body><iframe id="a"></iframe></body></html>`);
  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the frame's content document is unreachable (simulated cross-origin)`, () => {
  const dom = createDom(`<!doctype html><html><body><iframe id="a" tabindex="-1"></iframe></body></html>`);
  const el = dom.window.document.getElementById('a');
  Object.defineProperty(el, 'contentDocument', { get: () => null });
  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when the negative-tabindex frame's content has nothing focusable`, () => {
  const dom = createDom(`<!doctype html><html><body><iframe id="a" tabindex="-1"></iframe></body></html>`);
  dom.window.document.getElementById('a').contentDocument.body.innerHTML = '<p>static text</p>';
  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when the negative-tabindex frame's content contains a focusable element`, () => {
  const dom = createDom(`<!doctype html><html><body><iframe id="a" tabindex="-1"></iframe></body></html>`);
  dom.window.document.getElementById('a').contentDocument.body.innerHTML = '<button>Click me</button>';
  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'IFRAME_TABINDEX_NEGATIVE_CONTENT_FOCUSABLE');
});

test(`${RULE_ID}: pass when the focusable candidate itself has tabindex="-1"`, () => {
  const dom = createDom(`<!doctype html><html><body><iframe id="a" tabindex="-1"></iframe></body></html>`);
  dom.window.document.getElementById('a').contentDocument.body.innerHTML = '<button tabindex="-1">Not tabbable</button>';
  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const dom = createDom(`<!doctype html><html><body><iframe id="a" tabindex="-1"></iframe></body></html>`);
  dom.window.document.getElementById('a').contentDocument.body.innerHTML = '<button>Click me</button>';
  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Frames with tabindex="-1" must not contain focusable content');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/iframe-focusable-content-all-scenarios.html)`, () => {
  // Static-HTML-only coverage: the FAIL branch requires mutating
  // iframe.contentDocument after parse (see the fixture's own note and the
  // dedicated test above), which a declarative HTML fixture cannot express
  // in this synchronous jsdom harness. This fixture covers every branch
  // that IS expressible statically: not-applicable and pass.
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'iframe-focusable-content-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});