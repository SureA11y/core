'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'identical-iframes-same-purpose';

const BASE = 'https://example.test/';

function run(body) {
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
  return runa11yCoreOnHtml(html, { runOnly: [RULE_ID], url: BASE });
}

test(`${RULE_ID}: notApplicable when only one frame carries a given name`, () => {
  const result = run('<iframe title="Contributors" src="/one.html"></iframe>');
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when two frames have different names`, () => {
  const result = run(
    '<iframe title="Contributors" src="/one.html"></iframe><iframe title="Reviewers" src="/two.html"></iframe>'
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when neither frame has an accessible name`, () => {
  const result = run('<iframe src="/one.html"></iframe><iframe src="/two.html"></iframe>');
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when frames sharing a name embed the same resource`, () => {
  const result = run(
    '<iframe title="Contributors" src="/one.html"></iframe><iframe title="Contributors" src="/one.html"></iframe>'
  );
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: names match across different naming mechanisms`, () => {
  const result = run(
    '<iframe title="Contributors" src="/one.html"></iframe><iframe aria-label="Contributors" src="/two.html"></iframe>'
  );
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
});

test(`${RULE_ID}: a trailing slash does not make a second resource`, () => {
  const result = run(
    '<iframe title="Contact us" src="/sub-dir/"></iframe><iframe title="Contact us" src="/sub-dir"></iframe>'
  );
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a fragment does not make a second resource`, () => {
  const result = run(
    '<iframe title="Contributors" src="/one.html#top"></iframe><iframe title="Contributors" src="/one.html"></iframe>'
  );
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell, never fail, when the resources differ`, () => {
  const result = run(
    '<iframe title="Contributors" src="/one.html"></iframe><iframe title="Contributors" src="/two.html"></iframe>'
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  const codes = (rule.occurrences || []).map(
    (o) => o.data && o.data.details && o.data.details.reasonCode
  );
  assert.deepStrictEqual(codes, ['IFRAME_RESOURCE_DIFFERS', 'IFRAME_RESOURCE_DIFFERS']);
});

test(`${RULE_ID}: a frame with no src cannot be shown to embed the same resource`, () => {
  const result = run(
    '<iframe title="Contributors" src="/one.html"></iframe><iframe title="Contributors" srcdoc="<p>hi</p>"></iframe>'
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  const codes = (rule.occurrences || []).map(
    (o) => o.data && o.data.details && o.data.details.reasonCode
  );
  assert.ok(codes.includes('IFRAME_RESOURCE_UNRESOLVED'));
});

test(`${RULE_ID}: a frame hidden from the accessibility tree is not part of a set`, () => {
  const result = run(
    '<iframe aria-hidden="true" title="Contributors" src="/one.html"></iframe><iframe title="Contributors" src="/two.html"></iframe>'
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a display:none frame is not part of a set`, () => {
  const result = run(
    '<iframe style="display:none" title="Contributors" src="/one.html"></iframe><iframe title="Contributors" src="/two.html"></iframe>'
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: <object> is out of scope`, () => {
  const result = run(
    '<object title="Contributors" data="/one.html"></object><object title="Contributors" data="/two.html"></object>'
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

// Sets are judged independently: a clean set elsewhere on the page neither
// rescues nor contaminates the one whose resources differ. Moved here from
// iframe-title-unique when that rule was deprecated in favour of this one.
test(`${RULE_ID}: only the set whose resources differ is reported`, () => {
  const result = run(
    '<iframe id="a" title="Widget" src="/one.html"></iframe><iframe id="b" title="Widget" src="/two.html"></iframe>' +
      '<iframe id="c" title="Unique" src="/three.html"></iframe>' +
      '<iframe id="d" title="Same" src="/four.html"></iframe><iframe id="e" title="Same" src="/four.html"></iframe>'
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  const flagged = (rule.occurrences || [])
    .map((o) => (o.html.match(/\bid="([a-e])"/) || [])[1])
    .sort();
  assert.deepStrictEqual(flagged, ['a', 'b']);
});
