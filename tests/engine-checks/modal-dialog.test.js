'use strict';

// While a modal dialog is open, the rest of the page is inert: assistive
// technology gets only the dialog. Element rules leave the inert content out,
// and rules about the page's own structure are notApplicable, since the scan
// saw a dialog, not the page (#58). jsdom has no top layer, so these use an
// open dialog with aria-modal="true", the form the engine has always treated
// as modal; modal-dialog-chromium.test.js covers showModal().

const test = require('node:test');
const assert = require('node:assert');

const { assertRule } = require('../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../helpers/runDomRulesOnHtml.js');

const page = (dialog) =>
  '<!doctype html><html lang="en"><head><title>Shop</title></head><body>' +
  '<nav aria-label="Primary"><a href="/">Home</a></nav>' +
  '<main><h1>Shop</h1><img id="behind" src="x.png"></main>' +
  dialog +
  '</body></html>';
const MODAL =
  '<dialog open aria-modal="true" aria-label="Sign in"><nav aria-label="Primary"><a href="/a">A</a></nav><img id="inside" src="y.png"><button>Close</button></dialog>';

function outcome(html, ruleId) {
  const result = runa11yCoreOnHtml(html, { runOnly: [ruleId] });
  return result.checksResults.find((c) => c.ruleId === ruleId);
}

for (const ruleId of [
  'page-has-heading-one',
  'landmark-one-main',
  'bypass-blocks-present',
  'region'
]) {
  test(`${ruleId}: notApplicable while a modal dialog is open, and judged as before without one`, () => {
    assert.strictEqual(outcome(page(MODAL), ruleId).outcome, 'notApplicable');
    assert.notStrictEqual(outcome(page(''), ruleId).outcome, 'notApplicable');
  });
}

test('img-alt-present: an image behind an open modal dialog is not judged; one inside it is', () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page(MODAL), { runOnly: ['img-alt-present'] }),
    'img-alt-present',
    'fail',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.ok(rule.occurrences[0].html.includes('id="inside"'));
});

test('landmark-unique: the inert page nav does not collide with the dialog nav', () => {
  assertRule(
    runa11yCoreOnHtml(page(MODAL), { runOnly: ['landmark-unique'] }),
    'landmark-unique',
    'notApplicable',
    { minOccurrences: 0, maxOccurrences: 0 }
  );
});

test('a dialog that is open but not modal leaves the page as it is', () => {
  const html = page('<dialog open aria-label="Note"><p>Hi</p></dialog>');
  assertRule(runa11yCoreOnHtml(html, { runOnly: ['img-alt-present'] }), 'img-alt-present', 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.strictEqual(outcome(html, 'page-has-heading-one').outcome, 'pass');
});
