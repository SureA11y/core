'use strict';

// The walk up from an element reads every ancestor it has, up to 10,000 of
// them: an element 200 or more deep was judged from its nearest 200 and a
// fail on it became a cantTell, with a note in error as if the engine had
// failed. Past the limit, which no browser renders, a fail on the element
// becomes a question with steps of its own, said in ancestorWalkLimit
// (OUTPUT_SCHEMA.md); every other element's verdict stands.

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');
const { createDomHelpers } = require('../src/core/dom-helpers.js');
const { normalizeRuleResult } = require('../src/core.js').__internal;
const { resolvePolicy } = require('../src/policy/resolvePolicy');
const { POLICY_CONTRACTS } = require('../src/policy/contracts');
const { addHowToCheck, occurrenceOutcome } = require('../src/index.js');

const deepImage = (depth) =>
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
  '<div>'.repeat(depth) +
  '<img src="a.png">' +
  '</div>'.repeat(depth) +
  '</main></body></html>';

for (const depth of [200, 300, 500]) {
  test(`an image ${depth} elements deep without alt fails`, () => {
    const result = runa11yCoreOnHtml(deepImage(depth), { runOnly: ['img-alt-present'] });
    const check = result.checksResults.find((r) => r.ruleId === 'img-alt-present');
    assert.equal(check.outcome, 'fail');
    assert.equal(check.error, undefined);
    assert.equal(check.ancestorWalkLimit, undefined);
    assert.equal(check.occurrences.length, 1);
  });
}

test('the same image is hidden by an element more than 200 above it', () => {
  const html = deepImage(300)
    .replace('<main>', '<main><div hidden>')
    .replace('</main>', '</div></main>');
  const result = runa11yCoreOnHtml(html, { runOnly: ['img-alt-present'] });
  const check = result.checksResults.find((r) => r.ruleId === 'img-alt-present');
  assert.equal(check.outcome, 'notApplicable');
});

test('the walk stops after 10,000 nodes, the element counted', () => {
  // A connected tree that deep overflows jsdom's own stack; a detached one
  // walks the same way.
  const { window } = new JSDOM('<!doctype html><body></body>');
  const { document } = window;
  const img = document.createElement('img');
  const above = [];
  let top = img;
  for (let i = 0; i < 10000; i++) {
    const div = document.createElement('div');
    div.appendChild(top);
    above.push(div);
    top = div;
  }
  const helpers = createDomHelpers({ window, document, root: document });
  assert.equal(helpers.hasTruncatedAncestorWalk.limit, 10000);
  // The image and its 10,000 ancestors: one too many.
  assert.equal(helpers.hasTruncatedAncestorWalk(img), true);
  assert.equal(helpers.hasTruncatedAncestorWalk(above[0]), false);
  assert.equal(helpers.hasTruncatedAncestorWalk(above[5000]), false);
});

const policy = resolvePolicy(POLICY_CONTRACTS, {});
const def = {
  ruleId: 'img-alt-present',
  type: 'automatic',
  defaultSeverity: 'serious',
  defaultConfidence: 'high',
  title: 't',
  description: 'd',
  i18n: { titleKey: 'img_altPresent_title', descriptionKey: 'img_altPresent_description' },
  ruleInterfaceVersion: '1',
  ruleVersion: '1',
  normative: true,
  atomic: true
};

// Helpers for which the elements in `deep` are past the walk's limit.
function helpersWith(deep) {
  const hasTruncatedAncestorWalk = (node) => deep.includes(node);
  hasTruncatedAncestorWalk.limit = 10000;
  return { hasTruncatedAncestorWalk };
}

const occurrence = (node) => ({
  __node: node,
  selector: node.id,
  summary: 's',
  hint: 'h',
  html: '<img>',
  data: { details: { reasonCode: 'TEXT_ALTERNATIVE_MISSING' } }
});

test('past the limit, a fail on the element alone is a question, not an error', () => {
  const far = { id: 'far' };
  const out = normalizeRuleResult(
    def,
    { outcome: 'fail', occurrences: [occurrence(far)], engineOptions: { locale: 'fr' } },
    '1.0.0',
    policy,
    helpersWith([far])
  );
  assert.equal(out.outcome, 'cantTell');
  assert.equal(out.error, undefined);
  assert.deepEqual(out.ancestorWalkLimit, { limit: 10000, occurrences: 1, coercedFrom: 'fail' });
  const [o] = out.occurrences;
  assert.equal(o.occurrenceOutcome, 'cantTell');
  assert.equal(o.data.details.reasonCode, 'TEXT_ALTERNATIVE_MISSING', 'the finding keeps its code');
  assert.equal(o.uncertainty.code, 'not-computable');
  assert.deepEqual(o.uncertainty.evidence, { ancestorWalkLimit: 10000 });
  assert.equal(o.howToCheck.steps.length, 3);
  assert.match(o.howToCheck.steps[0], /^Trouvez cet élément/);
  assert.match(o.howToCheck.failWhen, /exposé/);
});

test('past the limit, the rule keeps its fail on the elements the engine saw', () => {
  const far = { id: 'far' };
  const near = { id: 'near' };
  const out = normalizeRuleResult(
    def,
    { outcome: 'fail', occurrences: [occurrence(far), occurrence(near)] },
    '1.0.0',
    policy,
    helpersWith([far])
  );
  assert.equal(out.outcome, 'fail');
  assert.deepEqual(out.ancestorWalkLimit, { limit: 10000, occurrences: 1 });
  assert.deepEqual(
    out.occurrences.map((o) => occurrenceOutcome(out, o)),
    ['cantTell', 'fail']
  );
  assert.equal(out.occurrences[1].howToCheck, undefined);
});

test('the steps past the limit are given in each locale, and kept by addHowToCheck', () => {
  const firstStep = {};
  for (const locale of ['en', 'fr', 'es', 'de', 'ja']) {
    const far = { id: 'far' };
    const out = normalizeRuleResult(
      def,
      { outcome: 'fail', occurrences: [occurrence(far)], engineOptions: { locale } },
      '1.0.0',
      policy,
      helpersWith([far])
    );
    const how = out.occurrences[0].howToCheck;
    for (const text of [...how.steps, how.passWhen, how.failWhen]) {
      assert.ok(typeof text === 'string' && text.length > 20, `${locale}: ${text}`);
    }
    firstStep[locale] = how.steps[0];
    const result = { engine: { locale: { resolved: locale } }, checksResults: [out] };
    const withSteps = addHowToCheck(result, { locale: 'de' });
    assert.deepEqual(withSteps.checksResults[0].occurrences[0].howToCheck, how);
  }
  assert.equal(new Set(Object.values(firstStep)).size, 5, 'each locale has its own text');
});
