'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { renderEarlReport, EARL_CONTEXT, OUTCOME_TO_EARL, scSlug } = require('../src/earl.js');
const { getChecksCatalog } = require('../src/index.js');
const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');

function checkResult(ruleId, outcome, normativeMappings = []) {
  return { ruleId, outcome, meta: { normativeMappings } };
}

function scanResult(url, checks) {
  return { url, checksResults: checks };
}

const SC_NON_TEXT = {
  standard: 'WCAG',
  version: '2.2',
  requirement: '1.1.1',
  title: 'Non-text Content',
  conformanceLevel: 'A'
};

test('the document is shaped as the ACT context expects', () => {
  const report = renderEarlReport(
    scanResult('https://example.test/', [checkResult('img-alt-present', 'fail', [SC_NON_TEXT])])
  );

  assert.strictEqual(report['@context'], EARL_CONTEXT);
  assert.strictEqual(report['@graph'].length, 1);

  const subject = report['@graph'][0];
  assert.strictEqual(subject['@type'], 'TestSubject');
  assert.strictEqual(subject.source, 'https://example.test/');

  const assertion = subject.assertions[0];
  assert.strictEqual(assertion['@type'], 'Assertion');
  assert.deepStrictEqual(assertion.test, {
    title: 'img-alt-present',
    isPartOf: ['WCAG2:non-text-content']
  });
  assert.deepStrictEqual(assertion.result, { outcome: 'earl:failed' });
});

test('every engine outcome maps to an EARL outcome', () => {
  const outcomes = ['pass', 'fail', 'cantTell', 'notApplicable'];
  assert.deepStrictEqual(Object.keys(OUTCOME_TO_EARL).sort(), [...outcomes].sort());

  const report = renderEarlReport(
    scanResult(
      'https://example.test/',
      outcomes.map((outcome, i) => checkResult(`rule-${i}`, outcome))
    )
  );

  assert.deepStrictEqual(
    report['@graph'][0].assertions.map((a) => a.result.outcome),
    ['earl:passed', 'earl:failed', 'earl:cantTell', 'earl:inapplicable']
  );
});

test('passes and inapplicables are reported, not filtered out', () => {
  const report = renderEarlReport(
    scanResult('https://example.test/', [
      checkResult('a', 'pass'),
      checkResult('b', 'notApplicable')
    ])
  );

  assert.strictEqual(report['@graph'][0].assertions.length, 2);
});

test('an unknown outcome produces no assertion rather than a broken one', () => {
  const report = renderEarlReport(
    scanResult('https://example.test/', [checkResult('a', 'weird'), checkResult('b', 'pass')])
  );

  assert.deepStrictEqual(
    report['@graph'][0].assertions.map((a) => a.test.title),
    ['b']
  );
});

test('several results group into one subject per url', () => {
  const report = renderEarlReport([
    scanResult('https://b.test/', [checkResult('r1', 'pass')]),
    scanResult('https://a.test/', [checkResult('r2', 'fail')]),
    scanResult('https://a.test/', [checkResult('r3', 'cantTell')])
  ]);

  assert.deepStrictEqual(
    report['@graph'].map((s) => s.source),
    ['https://a.test/', 'https://b.test/']
  );
  assert.deepStrictEqual(
    report['@graph'][0].assertions.map((a) => a.test.title),
    ['r2', 'r3']
  );
});

test('output is deterministic regardless of input order', () => {
  const a = scanResult('https://a.test/', [
    checkResult('z-rule', 'pass'),
    checkResult('a-rule', 'fail')
  ]);
  const b = scanResult('https://b.test/', [checkResult('m-rule', 'cantTell')]);

  assert.strictEqual(
    JSON.stringify(renderEarlReport([a, b])),
    JSON.stringify(renderEarlReport([b, a]))
  );
});

test('the assertor is included when supplied and omitted when refused', () => {
  const checks = [checkResult('r', 'pass')];

  const withAssertor = renderEarlReport(scanResult('https://a.test/', checks), {
    assertor: { name: 'surea11y', version: '1.7.0' },
    mode: 'earl:automatic'
  });
  const assertion = withAssertor['@graph'][0].assertions[0];
  assert.deepStrictEqual(assertion.assertedBy, {
    '@type': 'Assertor',
    name: 'surea11y',
    release: { '@type': 'Version', revision: '1.7.0' }
  });
  assert.strictEqual(assertion.mode, 'earl:automatic');

  const without = renderEarlReport(scanResult('https://a.test/', checks), { assertor: null });
  assert.strictEqual('assertedBy' in without['@graph'][0].assertions[0], false);
  assert.strictEqual('mode' in without['@graph'][0].assertions[0], false);
});

test('Understanding references and other standards are not read as criteria', () => {
  const report = renderEarlReport(
    scanResult('https://a.test/', [
      checkResult('r', 'fail', [
        SC_NON_TEXT,
        {
          standard: 'WCAG',
          version: '2.2',
          type: 'Understanding',
          requirement: '1.1.1',
          title: 'Understanding Non-text Content'
        },
        { standard: 'EN 301 549', version: 'V3.2.1', requirement: '9.1.1.1', title: 'Non-text' }
      ])
    ])
  );

  assert.deepStrictEqual(report['@graph'][0].assertions[0].test.isPartOf, [
    'WCAG2:non-text-content'
  ]);
});

test('a rule claiming no Success Criterion omits isPartOf', () => {
  const report = renderEarlReport(scanResult('https://a.test/', [checkResult('r', 'fail')]));

  assert.deepStrictEqual(report['@graph'][0].assertions[0].test, { title: 'r' });
});

// Slugs are derived, so the whole table is pinned here: a title edit that
// changes a published criterion id has to be seen in review.
test('every criterion the catalog maps to slugifies to its published id', () => {
  const byRequirement = new Map();
  for (const rule of getChecksCatalog()) {
    for (const m of rule.normativeMappings || []) {
      if (!m || m.standard !== 'WCAG' || m.type || !m.conformanceLevel) continue;
      byRequirement.set(m.requirement, scSlug(m.title));
    }
  }

  assert.deepStrictEqual(Object.fromEntries([...byRequirement].sort()), {
    '1.1.1': 'non-text-content',
    '1.2.1': 'audio-only-and-video-only-prerecorded',
    '1.2.2': 'captions-prerecorded',
    '1.3.1': 'info-and-relationships',
    '1.3.4': 'orientation',
    '1.3.5': 'identify-input-purpose',
    '1.4.1': 'use-of-color',
    '1.4.12': 'text-spacing',
    '1.4.2': 'audio-control',
    '1.4.3': 'contrast-minimum',
    '1.4.4': 'resize-text',
    '1.4.6': 'contrast-enhanced',
    '2.1.1': 'keyboard',
    '2.1.3': 'keyboard-no-exception',
    '2.2.1': 'timing-adjustable',
    '2.2.2': 'pause-stop-hide',
    '2.2.4': 'interruptions',
    '2.4.1': 'bypass-blocks',
    '2.4.2': 'page-titled',
    '2.4.3': 'focus-order',
    '2.4.4': 'link-purpose-in-context',
    '2.4.6': 'headings-and-labels',
    '2.4.7': 'focus-visible',
    '2.4.9': 'link-purpose-link-only',
    '2.5.3': 'label-in-name',
    '2.5.8': 'target-size-minimum',
    '3.1.1': 'language-of-page',
    '3.1.2': 'language-of-parts',
    '3.2.5': 'change-on-request',
    '3.3.2': 'labels-or-instructions',
    '3.3.8': 'accessible-authentication-minimum',
    '4.1.1': 'parsing',
    '4.1.2': 'name-role-value'
  });
});

test('a real scan renders a report whose assertions match its results', async () => {
  const result = await runa11yCoreOnHtml('<main><img src="x.png"><p>Text</p></main>', {
    runOnly: { includeTestIds: ['img-alt-present', 'page-title-present'] }
  });
  const report = renderEarlReport(result, { assertor: { name: 'surea11y' } });

  const asserted = new Map(
    report['@graph'][0].assertions.map((a) => [a.test.title, a.result.outcome])
  );
  for (const check of result.checksResults) {
    assert.strictEqual(asserted.get(check.ruleId), OUTCOME_TO_EARL[check.outcome]);
  }
  assert.strictEqual(asserted.size, result.checksResults.length);
});
