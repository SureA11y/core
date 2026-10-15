'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');

const { renderJunitReport } = require('../src/junit.js');
const { buildBaselineEntries } = require('../src/baseline.js');
const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');
const { makeOccurrence, makeCheckResult, makeScanResult } = require('./helpers/fake-result');

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
  assert.strictEqual(attr(skipped, 'message'), '1 occurrence needs manual review');
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

test('renderJunitReport: the manual-review message agrees with the count', () => {
  const two = check('m', 'cantTell', [wcag('2.4.3')], {
    occurrences: [makeOccurrence(), makeOccurrence()]
  });
  const skipped = parse(renderJunitReport(makeScanResult([two]))).getElementsByTagName(
    'skipped'
  )[0];
  assert.strictEqual(attr(skipped, 'message'), '2 occurrences need manual review');

  for (const [occurrences, expected] of [
    [[makeOccurrence()], '1 occurrence needs manual review'],
    [[makeOccurrence(), makeOccurrence()], '2 occurrences need manual review']
  ]) {
    const doc = parse(
      renderJunitReport(
        makeScanResult([check('m', 'cantTell', [wcag('2.4.3')], { occurrences })]),
        {
          cantTellAs: 'failure'
        }
      )
    );
    assert.strictEqual(attr(doc.getElementsByTagName('failure')[0], 'message'), expected);
  }
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
    environment: {
      layout: true,
      viewport: { width: 1280, height: 720 },
      devicePixelRatio: 2,
      colorScheme: 'light',
      fonts: 'loaded'
    },
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
  assert.strictEqual(attr(suite, 'name'), 'WCAG 1.4.3');
  const properties = Array.from(suite.getElementsByTagName('property')).map((p) => [
    attr(p, 'name'),
    attr(p, 'value')
  ]);
  assert.deepStrictEqual(properties, [
    ['wcagCriterion', '1.4.3'],
    ['title', 'Contrast: minimum'],
    ['wcagLevel', 'AA'],
    ['en301549', '9.1.4.3'],
    ['criterionOutcome', 'fail'],
    ['engine', 'a11ycore'],
    ['schemaVersion', '1.0.0'],
    ['wcagVersion', '2.2'],
    ['profile', 'en301549-v4.1.1'],
    ['layout', 'true'],
    ['viewport', '1280x720'],
    ['devicePixelRatio', '2'],
    ['colorScheme', 'light'],
    ['fonts', 'loaded'],
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

test('renderJunitReport: a missing result throws; a partial one renders', () => {
  // tests="0" failures="0" for a scan that never ran would pass a CI gate.
  for (const result of [null, undefined, {}]) {
    assert.throws(() => renderJunitReport(result), TypeError);
  }
  const root = parse(renderJunitReport({ checksResults: [null, {}] })).documentElement;
  assert.strictEqual(attr(root, 'tests'), '0');
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

// A criterion checked by several composites (#135): the suite took its
// title and criterionOutcome from the first composite only, so 4.1.2
// read "pass" while its ARIA validity failed.
test('a criterion checked by several composites takes the worst outcome and their shared name', () => {
  const result = runa11yCoreOnHtml(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main><button aria-pressed="banana">OK</button></main></body></html>'
  );
  const parts = result.rulesResults
    .filter((c) => c.ruleId.startsWith('wcag-4.1.2-'))
    .map((c) => [c.ruleId, c.outcome]);
  assert.deepStrictEqual(parts, [
    ['wcag-4.1.2-name', 'pass'],
    ['wcag-4.1.2-aria-validity', 'fail']
  ]);
  const suite = renderJunitReport(result).match(
    /<testsuite name="WCAG 4\.1\.2[^]*?<\/properties>/
  )[0];
  assert.match(suite, /^<testsuite name="WCAG 4\.1\.2" /);
  assert.match(suite, /<property name="title" value="Name, role, value"\/>/);
  assert.match(suite, /<property name="criterionOutcome" value="fail"\/>/);

  // Either order of the composites gives the same suite.
  const reversed = { ...result, rulesResults: result.rulesResults.slice().reverse() };
  assert.strictEqual(renderJunitReport(reversed), renderJunitReport(result));

  // A criterion with one composite keeps its whole title.
  assert.match(
    renderJunitReport(result),
    /<testsuite name="WCAG 1\.4\.3" [^]*?<property name="title" value="Contrast: minimum"\/>/
  );
});

// French puts a space before the colon, so the name the parts share kept a
// trailing space: "Nom, rôle et valeur ". It is the suite's title property.
test('a criterion checked in parts takes their shared name without the space French puts before the colon', () => {
  const result = runa11yCoreOnHtml(
    '<!doctype html><html lang="fr"><head><title>t</title></head><body><main><div role="button"></div></main></body></html>',
    { engineOptions: { locale: 'fr' } }
  );
  const suite = suiteNamed(parse(renderJunitReport(result)), 'WCAG 4.1.2');
  const title = Array.from(suite.getElementsByTagName('property')).find(
    (p) => attr(p, 'name') === 'title'
  );
  assert.strictEqual(attr(title, 'value'), 'Nom, rôle et valeur');
});

// Issue #227: suite names carried the criterion's translated title ("WCAG
// 4.1.2 Nom, rôle et valeur"), so the same page scanned in another locale
// gave other test names, and CI history, keyed on them, read every test as
// new. Names are now the same in every locale; the title is a property.
test('the same scan in English and French gives the same suite and testcase names, with translated titles', () => {
  const html =
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
    '<img src="a.png"><div role="button"></div>' +
    '<p style="color:#999;background:#fff">low contrast</p></main></body></html>';
  const render = (locale) =>
    parse(renderJunitReport(runa11yCoreOnHtml(html, { engineOptions: { locale } })));
  const names = (doc) =>
    suites(doc).map((s) => [
      attr(s, 'name'),
      cases(s).map((c) => `${attr(c, 'classname')} ${attr(c, 'name')}`)
    ]);
  const titles = (doc) =>
    suites(doc).map((s) => {
      const p = Array.from(s.getElementsByTagName('property')).find(
        (q) => attr(q, 'name') === 'title'
      );
      return p ? attr(p, 'value') : null;
    });
  const en = render('en');
  const fr = render('fr');
  assert.ok(suites(en).length > 2);
  assert.deepStrictEqual(names(fr), names(en));
  for (const s of suites(en)) assert.match(attr(s, 'name'), /^(WCAG \d+\.\d+\.\d+|Other checks)$/);

  const enTitles = titles(en);
  const frTitles = titles(fr);
  assert.strictEqual(
    enTitles[names(en).findIndex(([n]) => n === 'WCAG 4.1.2')],
    'Name, role, value'
  );
  assert.strictEqual(
    frTitles[names(fr).findIndex(([n]) => n === 'WCAG 4.1.2')],
    'Nom, rôle et valeur'
  );
  const both = enTitles.map((t, i) => [t, frTitles[i]]).filter(([e]) => e);
  assert.ok(both.length > 2);
  for (const [e, f] of both) assert.notStrictEqual(f, e);
});

// Issue #219: JUnit built its suites from each rule's own mappings, so a
// scan at wcagLevel AA still had a failing "WCAG 1.4.6" suite, and an AA
// build went red on an AAA criterion; duplicate-id named under 2.2 gave a
// 4.1.1 suite, which 2.2 removed. The criteria the scan's level and version
// leave out of rulesResults are left out of the report too.
const GREY_TEXT =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
  '<p style="color:#777;background:#fff">Grey text</p></main></body></html>';
const DUPLICATE_IDS =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
  '<div id="a"></div><div id="a"></div></main></body></html>';
const quiet = (fn) => {
  const { warn, info } = console;
  console.warn = console.info = () => {};
  try {
    return fn();
  } finally {
    console.warn = warn;
    console.info = info;
  }
};
const suiteNames = (doc) => suites(doc).map((s) => attr(s, 'name'));
const testcase = (doc, ruleId) =>
  Array.from(doc.getElementsByTagName('testcase')).filter((c) => attr(c, 'name') === ruleId);

test("a criterion above the scan's wcagLevel gets no suite, and its rule's failure does not count", () => {
  const result = quiet(() => runa11yCoreOnHtml(GREY_TEXT, { engineOptions: { wcagLevel: 'AA' } }));
  const enhanced = result.checksResults.find((c) => c.ruleId === 'contrast-enhanced');
  assert.strictEqual(enhanced.outcome, 'fail');
  const doc = parse(renderJunitReport(result));
  assert.ok(!suiteNames(doc).some((n) => n.startsWith('WCAG 1.4.6')));
  // The rule is still reported, with the rules mapped to no criterion, and
  // its failure is shown but skipped.
  const [tc] = testcase(doc, 'contrast-enhanced');
  assert.strictEqual(attr(tc.parentNode, 'name'), 'Other checks');
  assert.strictEqual(attr(tc, 'classname'), 'other');
  assert.strictEqual(tc.getElementsByTagName('failure').length, 0);
  assert.strictEqual(
    attr(tc.getElementsByTagName('skipped')[0], 'message'),
    "Not counted: WCAG 1.4.6 is outside the scan's target, WCAG 2.2 AA; 1 failing occurrence"
  );
  assert.match(tc.getElementsByTagName('system-out')[0].textContent, /^Failing:\n- .*7:1/);
  // Root failures count the AA failures only.
  const failing = Array.from(doc.getElementsByTagName('failure')).length;
  assert.strictEqual(attr(doc.documentElement, 'failures'), String(failing));
  // Without the level, 1.4.6 is reported as before.
  const all = parse(renderJunitReport(quiet(() => runa11yCoreOnHtml(GREY_TEXT))));
  assert.ok(suiteNames(all).some((n) => n.startsWith('WCAG 1.4.6')));
});

test('a named check keeps only the criteria the scan reports', () => {
  const result = quiet(() =>
    runa11yCoreOnHtml(GREY_TEXT, {
      engineOptions: { wcagLevel: 'AA' },
      runOnly: { includeRuleIds: ['contrast-computable'] }
    })
  );
  assert.deepStrictEqual(suiteNames(parse(renderJunitReport(result))), ['WCAG 1.4.3']);
  // A rollup named by id is reported whatever the level, and so is its suite.
  const named = quiet(() =>
    runa11yCoreOnHtml(GREY_TEXT, {
      engineOptions: { wcagLevel: 'AA' },
      runOnly: { includeRuleIds: ['wcag-1.4.6-contrast-enhanced'] }
    })
  );
  assert.deepStrictEqual(
    named.rulesResults.map((r) => r.ruleId),
    ['wcag-1.4.6-contrast-enhanced']
  );
  const doc = parse(renderJunitReport(named));
  assert.ok(suiteNamed(doc, 'WCAG 1.4.6'));
  assert.strictEqual(attr(doc.documentElement, 'failures'), '1');
});

// A level the selection gives (a WCAG target, or level tags beside rule
// ids) gated the rollups, but the result didn't record it, so JUnit gated by
// the version alone and gave an AA scan a "WCAG 1.4.6" suite.
test('a level given only by the selection leaves its criteria out of the suites', () => {
  const target = quiet(() =>
    runa11yCoreOnHtml(GREY_TEXT, { runOnly: { wcag: { version: '2.2', level: 'AA' } } })
  );
  assert.strictEqual(target.engine.wcagLevel, 'AA');
  assert.ok(!target.rulesResults.some((r) => r.ruleId.startsWith('wcag-1.4.6')));
  const doc = parse(renderJunitReport(target));
  assert.ok(suiteNames(doc).some((n) => n.startsWith('WCAG 1.4.3')));
  assert.ok(!suiteNames(doc).some((n) => n.startsWith('WCAG 1.4.6')));

  const tags = quiet(() =>
    runa11yCoreOnHtml(GREY_TEXT, {
      runOnly: {
        tags: ['wcag2a', 'wcag2aa'],
        includeRuleIds: ['contrast-enhanced'],
        includeMode: 'or'
      }
    })
  );
  assert.strictEqual(tags.engine.wcagLevel, 'AA');
  assert.strictEqual(
    tags.checksResults.find((c) => c.ruleId === 'contrast-enhanced').outcome,
    'fail'
  );
  const byTags = parse(renderJunitReport(tags));
  assert.ok(!suiteNames(byTags).some((n) => n.startsWith('WCAG 1.4.6')));
  assert.strictEqual(
    attr(testcase(byTags, 'contrast-enhanced')[0].parentNode, 'name'),
    'Other checks'
  );
});

test("a criterion the scan's WCAG version doesn't have gets no suite unless the scan reports it", () => {
  const named = quiet(() =>
    runa11yCoreOnHtml(DUPLICATE_IDS, { runOnly: { includeRuleIds: ['duplicate-id'] } })
  );
  assert.deepStrictEqual(named.rulesResults, []);
  const doc = parse(renderJunitReport(named));
  assert.deepStrictEqual(suiteNames(doc), ['Other checks']);
  assert.match(
    attr(testcase(doc, 'duplicate-id')[0].getElementsByTagName('skipped')[0], 'message'),
    /^Not counted: WCAG 4\.1\.1 is outside the scan's target, WCAG 2\.2; 2 occurrences need manual review$/
  );
  // Under 2.1 it is the criterion's own suite.
  const under21 = quiet(() =>
    runa11yCoreOnHtml(DUPLICATE_IDS, {
      engineOptions: { wcagVersion: '2.1' },
      runOnly: { includeRuleIds: ['duplicate-id'] }
    })
  );
  assert.ok(suiteNamed(parse(renderJunitReport(under21)), 'WCAG 4.1.1'));
  // A 2.2 scan that selects 4.1.1 reports it, as the scan does.
  const full = quiet(() => runa11yCoreOnHtml(DUPLICATE_IDS));
  assert.ok(suiteNamed(parse(renderJunitReport(full)), 'WCAG 4.1.1'));
});

test('a result that records no level or version keeps every criterion', () => {
  const checks = [
    check('contrast-enhanced', 'fail', [wcag('1.4.6', 'AAA')]),
    check('duplicate-id', 'fail', [wcag('4.1.1')])
  ];
  const old = makeScanResult(checks);
  assert.deepStrictEqual(suiteNames(parse(renderJunitReport(old))), ['WCAG 1.4.6', 'WCAG 4.1.1']);
  // The same result with a target leaves both out, in every frame.
  const scoped = (url) => ({
    ...makeScanResult(checks),
    url,
    engine: { tag: 'a11ycore', schemaVersion: '1.0.0', wcagVersion: '2.2', wcagLevel: 'AA' }
  });
  const crossFrame = {
    topFrame: scoped('https://example.test/'),
    frames: [
      {
        url: 'https://ads.test/',
        selector: '#ad',
        topFrame: scoped('https://ads.test/'),
        frames: []
      }
    ]
  };
  const doc = parse(renderJunitReport(crossFrame));
  assert.deepStrictEqual(suiteNames(doc), ['Other checks', 'Frame #ad: Other checks']);
  // A frame's testcases are keyed apart from the page's, for a CI that keys
  // tests on classname and name.
  const classnames = [...doc.getElementsByTagName('testcase')].map((t) => attr(t, 'classname'));
  assert.ok(classnames.includes('other'));
  assert.ok(classnames.includes('frame #ad other'));
  assert.strictEqual(attr(doc.documentElement, 'failures'), '0');
  assert.strictEqual(attr(doc.documentElement, 'skipped'), '4');
  // A rule mapped to an in-scope criterion too fails there.
  const both = {
    ...scoped('https://example.test/'),
    checksResults: [
      check('contrast-computable', 'fail', [wcag('1.4.3', 'AA'), wcag('1.4.6', 'AAA')])
    ]
  };
  const bothDoc = parse(renderJunitReport(both));
  assert.deepStrictEqual(suiteNames(bothDoc), ['WCAG 1.4.3']);
  assert.strictEqual(attr(bothDoc.documentElement, 'failures'), '1');
});
