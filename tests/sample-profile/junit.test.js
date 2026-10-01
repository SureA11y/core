'use strict';

/**
 * The JUnit report with a profile registered: the opt-in rules a scan added
 * are a run property, and a standard's own entries go under the criteria they
 * name, or stay with their rule when they name none. Run against the engine
 * copy with the sample profile (tests/helpers/sampleEngine.js).
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { requireSample } = require('../helpers/sampleEngine');
const { makeOccurrence, makeCheckResult, makeScanResult } = require('../explain/fake-result');

const { renderJunitReport } = requireSample('src/junit.js');
const { runa11yCoreOnHtml } = requireSample('tests/helpers/runDomRulesOnHtml.js');

const { DOMParser } = new JSDOM('').window;

function parse(xml) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  assert.equal(doc.getElementsByTagName('parsererror').length, 0, 'well-formed XML');
  return doc;
}

const attr = (el, name) => el.getAttribute(name);
const suites = (doc) => Array.from(doc.getElementsByTagName('testsuite'));
const suiteNamed = (doc, prefix) => suites(doc).find((s) => attr(s, 'name').startsWith(prefix));
const propertyValues = (suite, name) =>
  Array.from(suite.getElementsByTagName('property'))
    .filter((p) => attr(p, 'name') === name)
    .map((p) => attr(p, 'value'));

test('the opt-in rules a scan added are a run property on every suite', () => {
  const html =
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"><p>x</p></main></body></html>';
  const result = runa11yCoreOnHtml(html, { engineOptions: { optInRules: 'all' } });
  assert.deepEqual(result.engine.optInRules, ['sample']);
  const all = suites(parse(renderJunitReport(result)));
  assert.ok(all.length > 1);
  for (const suite of all) {
    assert.deepEqual(propertyValues(suite, 'optInRules'), ['sample'], attr(suite, 'name'));
  }
  const plain = runa11yCoreOnHtml(html);
  assert.doesNotMatch(renderJunitReport(plain), /name="optInRules"/);
});

test('a rule with no WCAG criterion keeps its other-standard entries', () => {
  const check = makeCheckResult({
    ruleId: 'heading-order',
    outcome: 'fail',
    occurrences: [makeOccurrence()],
    meta: {
      ruleId: 'heading-order',
      normativeMappings: [
        {
          standard: 'Sample Standard',
          version: '2.0',
          requirement: 'S4',
          wcagSc: ['1.3.1', '2.4.6']
        }
      ]
    }
  });
  const suite = suiteNamed(parse(renderJunitReport(makeScanResult([check]))), 'Other checks');
  assert.deepEqual(propertyValues(suite, 'sample'), ['S4']);
});

// A requirement outside WCAG (an entry with an empty wcagSc) belongs to every
// criterion of the rule that names it, as an entry with no wcagSc does.
test('an entry for a requirement outside WCAG stays with its rule', () => {
  const check = makeCheckResult({ ruleId: 'r', outcome: 'fail' });
  check.meta = {
    ...check.meta,
    wcagSc: ['1.1.1'],
    normativeMappings: [
      { standard: 'WCAG', version: '2.2', requirement: '1.1.1', title: 'Non-text Content' },
      {
        standard: 'Sample Standard',
        version: '2.0',
        requirement: 'S1',
        title: 'a',
        wcagSc: ['1.1.1']
      },
      { standard: 'Sample Standard', version: '2.0', requirement: 'S5', title: 'b', wcagSc: [] }
    ]
  };
  const suite = suiteNamed(parse(renderJunitReport(makeScanResult([check]))), 'WCAG 1.1.1');
  assert.deepEqual(propertyValues(suite, 'sample'), ['S1', 'S5']);
});
