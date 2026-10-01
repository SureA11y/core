'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const {
  runa11yCoreOnHtml,
  createDom,
  runa11yCoreOnDom
} = require('../../../../../tests/helpers/runa11yCoreOnHtml');

const RULE_ID = 'label-for-target-valid';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
}

function reasonOf(html) {
  const rule = assertRule(runa11yCoreOnHtml(page(html), RUN), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  return rule.occurrences[0];
}

test(`${RULE_ID}: notApplicable without a label carrying for`, () => {
  assertRule(runa11yCoreOnHtml(page('<label>Age <input></label>'), RUN), RULE_ID, 'notApplicable');
});

test(`${RULE_ID}: a for matching each kind of labelable element passes`, () => {
  const html = page(
    '<label for="a">A</label><input id="a">' +
      '<label for="b">B</label><select id="b"><option>x</option></select>' +
      '<label for="c">C</label><textarea id="c"></textarea>' +
      '<label for="d">D</label><button id="d">Go</button>' +
      '<label for="e">E</label><meter id="e" value="1"></meter>' +
      '<label for="f">F</label><output id="f"></output>' +
      '<label for="g">G</label><progress id="g"></progress>'
  );
  assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
});

test(`${RULE_ID}: a for matching no id fails as missingTarget`, () => {
  const occ = reasonOf('<label for="nope">Phone</label><input id="phone">');
  assert.equal(occ.data.details.reasonCode, 'missingTarget');
  assert.equal(occ.i18n.summaryKey, 'labelForTargetValid_summary_fail_missing');
  assert.equal(occ.data.details.value, 'nope');
  assert.equal(occ.summary, 'This label points to id "nope", which no element in its tree has.');
});

test(`${RULE_ID}: a for matching an element that cannot be labelled fails as notLabelable`, () => {
  for (const [markup, element] of [
    ['<div id="t">x</div>', 'div'],
    ['<input id="t" type="hidden">', 'input'],
    ['<a id="t" href="/x">x</a>', 'a']
  ]) {
    const occ = reasonOf(`<label for="t">Name</label>${markup}`);
    assert.equal(occ.data.details.reasonCode, 'notLabelable', markup);
    assert.equal(occ.data.details.target, element, markup);
    assert.equal(occ.i18n.summaryKey, 'labelForTargetValid_summary_fail_notLabelable');
  }
});

// RGAA 11.1.2 asks only that the field has an id equal to the for value; the
// glossary counts these ARIA roles as form fields. The name HTML does not
// give such a field is 11.1.1's concern.
test(`${RULE_ID}: a for matching an element with a form-field ARIA role passes`, () => {
  for (const markup of [
    '<div id="t" role="textbox" contenteditable="true"></div>',
    '<div id="t" role="combobox" tabindex="0"></div>',
    '<span id="t" role="switch checkbox" aria-checked="false" tabindex="0"></span>',
    '<div id="t" role="slider" aria-valuenow="1" tabindex="0"></div>'
  ]) {
    const html = page(`<label for="t">Name</label>${markup}`);
    assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
    assertRule(
      runa11yCoreOnHtml(html, { engineOptions: { profile: 'rgaa-4.1.2' } }),
      RULE_ID,
      'pass',
      { maxOccurrences: 0 }
    );
  }
});

test(`${RULE_ID}: a for matching a role that is not a form field still fails`, () => {
  for (const markup of [
    '<div id="t" role="button" tabindex="0">x</div>',
    '<p id="t" role="none">x</p>'
  ]) {
    const occ = reasonOf(`<label for="t">Name</label>${markup}`);
    assert.equal(occ.data.details.reasonCode, 'notLabelable', markup);
  }
});

test(`${RULE_ID}: with duplicate ids the first element decides, as in HTML`, () => {
  const occ = reasonOf('<label for="t">Name</label><span id="t"></span><input id="t">');
  assert.equal(occ.data.details.reasonCode, 'notLabelable');
});

test(`${RULE_ID}: an empty for fails even with the field nested inside the label`, () => {
  const occ = reasonOf('<label for="">Nickname <input></label>');
  assert.equal(occ.data.details.reasonCode, 'emptyFor');
  assert.equal(occ.i18n.summaryKey, 'labelForTargetValid_summary_fail_empty');
});

test(`${RULE_ID}: a label in a shadow root resolves its for in that shadow root`, () => {
  const dom = createDom(page('<div id="host"></div><input id="outside">'));
  const root = dom.window.document.getElementById('host').attachShadow({ mode: 'open' });
  root.innerHTML =
    '<label for="inside">In</label><input id="inside"><label for="outside">Out</label>';
  const result = runa11yCoreOnDom(dom, RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.value, 'outside');
});

test(`${RULE_ID}: opt-in, so a default run does not include it`, () => {
  const result = runa11yCoreOnHtml(page('<label for="nope">x</label>'));
  assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/label-for-target-valid-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'label-for-target-valid-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 4, maxOccurrences: 4 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['lft_case_03', 'lft_case_04', 'lft_case_05', 'lft_case_06']);
});
