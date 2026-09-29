'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');

const { renderJunitReport } = require('../src/junit.js');
const { buildBaselineEntries } = require('../src/baseline.js');
const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');
const { makeOccurrence, makeCheckResult, makeScanResult } = require('./explain/fake-result');

const { DOMParser } = new JSDOM('').window;

function parse(xml) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  assert.strictEqual(doc.getElementsByTagName('parsererror').length, 0, 'well-formed XML');
  return doc;
}

const attr = (el, name) => el.getAttribute(name);
const suites = (doc) => Array.from(doc.getElementsByTagName('testsuite'));
const cases = (el) => Array.from(el.getElementsByTagName('testcase'));
const suiteNamed = (doc, prefix) => suites(doc).find((s) => attr(s, 'name').startsWith(prefix));

function wcag(requirement, level = 'A') {
  return { standard: 'WCAG', version: '2.2', requirement, conformanceLevel: level };
}

function check(ruleId, outcome, mappings, overrides = {}) {
  return makeCheckResult({
    ruleId,
    outcome,
    occurrences: outcome === 'fail' || outcome === 'cantTell' ? [makeOccurrence()] : [],
    meta: { ruleId, normativeMappings: mappings },
    ...overrides
  });
}

test('renderJunitReport: an XML declaration and a testsuites root with totals', () => {
  const xml = renderJunitReport(
    makeScanResult([check('a', 'fail', [wcag('1.1.1')]), check('b', 'pass', [wcag('1.1.1')])])
  );
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n'));
  const root = parse(xml).documentElement;
  assert.strictEqual(root.tagName, 'testsuites');
  assert.strictEqual(attr(root, 'name'), 'surea11y');
  assert.strictEqual(attr(root, 'tests'), '2');
  assert.strictEqual(attr(root, 'failures'), '1');
  assert.strictEqual(attr(root, 'skipped'), '0');
  assert.strictEqual(attr(root, 'errors'), '0');
});

test('renderJunitReport: options.name names the testsuites root', () => {
  const root = parse(renderJunitReport(makeScanResult([]), { name: 'home page' })).documentElement;
  assert.strictEqual(attr(root, 'name'), 'home page');
});

test('renderJunitReport: an empty scan is a valid report with no tests', () => {
  const root = parse(renderJunitReport(makeScanResult([]))).documentElement;
  assert.strictEqual(attr(root, 'tests'), '0');
  assert.strictEqual(suites(root.ownerDocument).length, 0);
});

test('renderJunitReport: one suite per WCAG criterion, one testcase per rule', () => {
  const doc = parse(
    renderJunitReport(
      makeScanResult([
        check('img-alt-present', 'fail', [wcag('1.1.1')]),
        check('color-contrast', 'pass', [wcag('1.4.3', 'AA')])
      ])
    )
  );
  assert.deepStrictEqual(
    suites(doc).map((s) => attr(s, 'name')),
    ['WCAG 1.1.1', 'WCAG 1.4.3']
  );
  const [testcase] = cases(suiteNamed(doc, 'WCAG 1.1.1'));
  assert.strictEqual(attr(testcase, 'classname'), 'wcag-1.1.1');
  assert.strictEqual(attr(testcase, 'name'), 'img-alt-present');
});

test('renderJunitReport: a fail lists every failing occurrence in the failure body', () => {
  const doc = parse(
    renderJunitReport(
      makeScanResult([
        check('img-alt-present', 'fail', [wcag('1.1.1')], {
          occurrences: [
            makeOccurrence({ selector: '#one', html: '<img id="one">' }),
            makeOccurrence({ selector: '#two', html: '<img id="two">' })
          ]
        })
      ])
    )
  );
  const failure = doc.getElementsByTagName('failure')[0];
  assert.strictEqual(attr(failure, 'type'), 'fail');
  assert.match(attr(failure, 'message'), /^2 failing occurrences: Image missing alt text\.$/);
  assert.match(failure.textContent, /selector: #one/);
  assert.match(failure.textContent, /html: <img id="two">/);
});

test('renderJunitReport: a pass is a bare testcase', () => {
  const doc = parse(renderJunitReport(makeScanResult([check('a', 'pass', [wcag('1.1.1')])])));
  const [testcase] = cases(doc);
  assert.strictEqual(testcase.children.length, 0);
});

test('renderJunitReport: cantTell is skipped by default, never a failure', () => {
  const doc = parse(renderJunitReport(makeScanResult([check('m', 'cantTell', [wcag('2.4.3')])])));
  const skipped = doc.getElementsByTagName('skipped')[0];
  assert.strictEqual(attr(skipped, 'message'), '1 occurrence need manual review');
  assert.strictEqual(doc.getElementsByTagName('failure').length, 0);
  assert.strictEqual(attr(doc.documentElement, 'skipped'), '1');
  assert.match(doc.getElementsByTagName('system-out')[0].textContent, /Needs manual review:/);
});

test('renderJunitReport: cantTellAs "failure" turns cantTell into a failure of its own type', () => {
  const doc = parse(
    renderJunitReport(makeScanResult([check('m', 'cantTell', [wcag('2.4.3')])]), {
      cantTellAs: 'failure'
    })
  );
  const failure = doc.getElementsByTagName('failure')[0];
  assert.strictEqual(attr(failure, 'type'), 'cantTell');
  assert.strictEqual(attr(doc.documentElement, 'failures'), '1');
});

test('renderJunitReport: a cantTell rule with no occurrences still reads as needing review', () => {
  const noOccurrences = check('m', 'cantTell', [wcag('2.4.3')], { occurrences: [] });
  const skipped = parse(renderJunitReport(makeScanResult([noOccurrences]))).getElementsByTagName(
    'skipped'
  )[0];
  assert.strictEqual(attr(skipped, 'message'), 'Needs manual review');

  const failure = parse(
    renderJunitReport(makeScanResult([noOccurrences]), { cantTellAs: 'failure' })
  ).getElementsByTagName('failure')[0];
  assert.strictEqual(attr(failure, 'message'), 'Needs manual review');
});

test('renderJunitReport: a fail that also has cantTell occurrences fails and shows both', () => {
  const doc = parse(
    renderJunitReport(
      makeScanResult([
        check('mixed', 'fail', [wcag('1.1.1')], {
          occurrences: [
            makeOccurrence({ selector: '#bad', occurrenceOutcome: 'fail' }),
            makeOccurrence({ selector: '#unsure', occurrenceOutcome: 'cantTell' })
          ]
        })
      ])
    )
  );
  assert.match(doc.getElementsByTagName('failure')[0].textContent, /#bad/);
  assert.doesNotMatch(doc.getElementsByTagName('failure')[0].textContent, /#unsure/);
  assert.match(doc.getElementsByTagName('system-out')[0].textContent, /#unsure/);
});

test('renderJunitReport: notApplicable is omitted unless includeNotApplicable is set', () => {
  const result = makeScanResult([
    check('na', 'notApplicable', [wcag('1.1.1')]),
    check('ok', 'pass', [wcag('1.1.1')])
  ]);
  assert.deepStrictEqual(
    cases(parse(renderJunitReport(result))).map((c) => attr(c, 'name')),
    ['ok']
  );

  const doc = parse(renderJunitReport(result, { includeNotApplicable: true }));
  const na = cases(doc).find((c) => attr(c, 'name') === 'na');
  assert.strictEqual(attr(na.getElementsByTagName('skipped')[0], 'message'), 'Not applicable');
  assert.strictEqual(attr(doc.documentElement, 'skipped'), '1');
});

test('renderJunitReport: a rule mapped to two criteria appears in both suites', () => {
  const doc = parse(
    renderJunitReport(makeScanResult([check('two', 'fail', [wcag('1.3.1'), wcag('4.1.2')])]))
  );
  assert.deepStrictEqual(
    suites(doc).map((s) => attr(s, 'name')),
    ['WCAG 1.3.1', 'WCAG 4.1.2']
  );
  assert.strictEqual(attr(doc.documentElement, 'tests'), '2');
});

test('renderJunitReport: rules with no WCAG criterion go in a final "Other checks" suite', () => {
  const doc = parse(
    renderJunitReport(
      makeScanResult([
        check('best-practice-rule', 'fail', []),
        check('understanding-only', 'fail', [
          { standard: 'WCAG', type: 'Understanding', requirement: '2.1.1' }
        ]),
        check('img-alt-present', 'fail', [wcag('1.1.1')])
      ])
    )
  );
  const names = suites(doc).map((s) => attr(s, 'name'));
  assert.deepStrictEqual(names, ['WCAG 1.1.1', 'Other checks']);
  const other = suiteNamed(doc, 'Other checks');
  assert.deepStrictEqual(
    cases(other).map((c) => attr(c, 'classname')),
    ['other', 'other']
  );
});

test('renderJunitReport: suites sort by criterion numerically, testcases by rule id', () => {
  const doc = parse(
    renderJunitReport(
      makeScanResult([
        check('z-rule', 'pass', [wcag('1.4.10', 'AA')]),
        check('b-rule', 'pass', [wcag('1.4.3', 'AA')]),
        check('a-rule', 'pass', [wcag('1.4.3', 'AA')])
      ])
    )
  );
  assert.deepStrictEqual(
    suites(doc).map((s) => attr(s, 'name')),
    ['WCAG 1.4.3', 'WCAG 1.4.10']
  );
  assert.deepStrictEqual(
    cases(suiteNamed(doc, 'WCAG 1.4.3')).map((c) => attr(c, 'name')),
    ['a-rule', 'b-rule']
  );
});

test('renderJunitReport: suite properties carry criterion, level, EN 301 549 clause and run context', () => {
  const result = makeScanResult([
    check('color-contrast', 'fail', [
      wcag('1.4.3', 'AA'),
      { standard: 'EN 301 549', version: 'V3.2.1', requirement: '9.1.4.3' },
      { standard: 'EN 301 549', version: 'V4.1.1', requirement: '9.1.4.3' }
    ])
  ]);
  result.engine = {
    tag: 'a11ycore',
    schemaVersion: '1.0.0',
    wcagVersion: '2.2',
    profile: 'en301549-v4.1.1',
    locale: { requested: 'en', resolved: 'en', reason: 'ok' }
  };
  result.rulesResults = [
    {
      ruleId: 'wcag-1.4.3-contrast-minimum',
      title: 'Contrast: minimum',
      outcome: 'fail',
      meta: { normativeMappings: [{ standard: 'WCAG', requirement: '1.4.3', level: 'AA' }] }
    }
  ];

  const suite = suites(parse(renderJunitReport(result)))[0];
  assert.strictEqual(attr(suite, 'name'), 'WCAG 1.4.3 Contrast: minimum');
  const properties = Array.from(suite.getElementsByTagName('property')).map((p) => [
    attr(p, 'name'),
    attr(p, 'value')
  ]);
  assert.deepStrictEqual(properties, [
    ['wcagCriterion', '1.4.3'],
    ['wcagLevel', 'AA'],
    ['en301549', '9.1.4.3'],
    ['criterionOutcome', 'fail'],
    ['engine', 'a11ycore'],
    ['schemaVersion', '1.0.0'],
    ['wcagVersion', '2.2'],
    ['profile', 'en301549-v4.1.1'],
    ['locale', 'en'],
    ['url', 'https://example.test/']
  ]);
});

test("renderJunitReport: another standard's entry goes under the criteria it names in wcagSc", () => {
  const en = (requirement, sc) => ({
    standard: 'EN 301 549',
    version: 'V4.1.1',
    requirement,
    wcagSc: [sc]
  });
  const result = makeScanResult([
    check('two-criteria', 'fail', [
      wcag('1.3.1'),
      wcag('4.1.2'),
      en('9.1.3.1', '1.3.1'),
      en('9.4.1.2', '4.1.2')
    ])
  ]);
  const doc = parse(renderJunitReport(result));
  const enOfSuite = (name) =>
    Array.from(suiteNamed(doc, name).getElementsByTagName('property'))
      .filter((p) => attr(p, 'name') === 'en301549')
      .map((p) => attr(p, 'value'));
  assert.deepStrictEqual(enOfSuite('WCAG 1.3.1'), ['9.1.3.1']);
  assert.deepStrictEqual(enOfSuite('WCAG 4.1.2'), ['9.4.1.2']);
});

test('renderJunitReport: a rule with no WCAG criterion keeps its other-standard entries', () => {
  const result = makeScanResult([
    check('heading-order', 'fail', [
      { standard: 'RGAA', version: '4.1.2', requirement: '9.1.1', wcagSc: ['1.3.1', '2.4.6'] }
    ])
  ]);
  const suite = suiteNamed(parse(renderJunitReport(result)), 'Other checks');
  const rgaa = Array.from(suite.getElementsByTagName('property'))
    .filter((p) => attr(p, 'name') === 'rgaa')
    .map((p) => attr(p, 'value'));
  assert.deepStrictEqual(rgaa, ['9.1.1']);
});

test('renderJunitReport: timestamp appears only when the result carries one', () => {
  const result = makeScanResult([check('a', 'pass', [wcag('1.1.1')])]);
  assert.strictEqual(suites(parse(renderJunitReport(result)))[0].hasAttribute('timestamp'), false);

  result.timestamp = '2026-09-27T12:00:00Z';
  assert.strictEqual(
    attr(suites(parse(renderJunitReport(result)))[0], 'timestamp'),
    '2026-09-27T12:00:00Z'
  );
});

// --- baseline ---------------------------------------------------------------

test('renderJunitReport: a rule whose every failure is baselined is skipped, not passed', () => {
  const result = makeScanResult([check('img-alt-present', 'fail', [wcag('1.1.1')])]);
  const doc = parse(renderJunitReport(result, { baselineEntries: buildBaselineEntries(result) }));
  const skipped = doc.getElementsByTagName('skipped')[0];
  assert.strictEqual(attr(skipped, 'message'), '1 known failure recorded in the baseline');
  assert.strictEqual(attr(doc.documentElement, 'failures'), '0');
});

test('renderJunitReport: only failures missing from the baseline are reported', () => {
  const before = makeScanResult([
    check('img-alt-present', 'fail', [wcag('1.1.1')], {
      occurrences: [makeOccurrence({ html: '<img id="old">' })]
    })
  ]);
  const after = makeScanResult([
    check('img-alt-present', 'fail', [wcag('1.1.1')], {
      occurrences: [
        makeOccurrence({ html: '<img id="old">' }),
        makeOccurrence({ html: '<img id="new">', selector: '#new' })
      ]
    })
  ]);
  const failure = parse(
    renderJunitReport(after, { baselineEntries: buildBaselineEntries(before) })
  ).getElementsByTagName('failure')[0];
  assert.match(attr(failure, 'message'), /^1 failing occurrence/);
  assert.match(failure.textContent, /#new/);
  assert.doesNotMatch(failure.textContent, /id="old"/);
});

test('renderJunitReport: a rule in two suites uses its baseline entries once, not per suite', () => {
  const result = makeScanResult([check('two', 'fail', [wcag('1.3.1'), wcag('4.1.2')])]);
  const doc = parse(renderJunitReport(result, { baselineEntries: buildBaselineEntries(result) }));
  assert.deepStrictEqual(
    suites(doc).map((s) => attr(s.getElementsByTagName('skipped')[0], 'message')),
    ['1 known failure recorded in the baseline', '1 known failure recorded in the baseline']
  );
});

// --- robustness --------------------------------------------------------------

test('renderJunitReport: markup is escaped and characters XML forbids are dropped', () => {
  const doc = parse(
    renderJunitReport(
      makeScanResult([
        check('r', 'fail', [wcag('1.1.1')], {
          occurrences: [
            makeOccurrence({
              summary: 'a\u0001b\ud800c & <d> "e"',
              html: "<p class='x'>\u0007</p>"
            })
          ]
        })
      ])
    )
  );
  const failure = doc.getElementsByTagName('failure')[0];
  assert.strictEqual(attr(failure, 'message'), '1 failing occurrence: abc & <d> "e"');
  assert.match(failure.textContent, /html: <p class='x'><\/p>/);
});

test('renderJunitReport: tolerates a missing or partial result', () => {
  for (const result of [null, undefined, {}, { checksResults: [null, {}] }]) {
    const root = parse(renderJunitReport(result)).documentElement;
    assert.strictEqual(attr(root, 'tests'), '0');
  }
});

test('renderJunitReport: a real scan renders deterministically and parses', () => {
  const html =
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
    '<img src="a.png"><p style="color:#999;background:#fff">low contrast</p></main></body></html>';
  const result = runa11yCoreOnHtml(html, { engineOptions: { profile: 'wcag22-aa' } });
  const xml = renderJunitReport(result);
  assert.strictEqual(renderJunitReport(result), xml);

  const doc = parse(xml);
  const imgAlt = cases(doc).find((c) => attr(c, 'name') === 'img-alt-present');
  assert.strictEqual(imgAlt.getElementsByTagName('failure').length, 1);
  const root = doc.documentElement;
  const sum = (a) => suites(doc).reduce((n, s) => n + Number(attr(s, a)), 0);
  assert.strictEqual(Number(attr(root, 'tests')), sum('tests'));
  assert.strictEqual(Number(attr(root, 'failures')), sum('failures'));
  assert.strictEqual(Number(attr(root, 'skipped')), sum('skipped'));
});
