'use strict';

// engineOptions.timeBudgetMs: once a scan has spent that long, it starts no
// more rules, lists those it didn't start (notRun) and says it is incomplete
// (engine.incomplete); no reporter or gate reads such a scan as clean.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { JSDOM } = require('jsdom');

const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');
const { checkEngineOptions } = require('../src/core/engine-options.js');
const { consoleHelpers } = require('../src/core/console-helpers.js');
const { renderSarifReport } = require('../src/sarif.js');
const { renderJunitReport } = require('../src/junit.js');
const { renderHtmlReport } = require('../src/report.js');
const { renderEarlReport } = require('../src/earl.js');
const { matchBaseline, buildBaselineEntries } = require('../src/baseline.js');

// A clean page: every rule that runs passes or doesn't apply.
const PAGE =
  '<!doctype html><html lang="en"><head><title>Home</title></head><body><main><h1>Home</h1><p>Hello.</p></main></body></html>';
// Spent before the first rule starts, whatever the machine.
const NONE_LEFT = 1e-9;

function quietly(fn) {
  const warn = console.warn;
  const said = [];
  console.warn = (...args) => said.push(args.join(' '));
  try {
    return { value: fn(), said };
  } finally {
    console.warn = warn;
  }
}

function scan(engineOptions, runOnly) {
  return quietly(() => runa11yCoreOnHtml(PAGE, { engineOptions, runOnly }));
}

const RUN_ONLY = { includeRuleIds: ['page-title-present', 'html-lang-attr-present'] };

test('timeBudgetMs takes a number of milliseconds above 0, and nothing else', () => {
  assert.deepEqual(checkEngineOptions({ timeBudgetMs: 250 }), []);
  assert.deepEqual(checkEngineOptions({ timeBudgetMs: 0.5 }), []);
  for (const bad of [0, -1, '250', NaN, -Infinity, null, true]) {
    const problems = checkEngineOptions({ timeBudgetMs: bad });
    assert.equal(problems.length, 1, String(bad));
    assert.equal(problems[0].kind, 'invalid');
    assert.match(problems[0].message, /timeBudgetMs must be a number of milliseconds, more than 0/);
  }
});

test('under strictOptions an invalid timeBudgetMs throws; otherwise it is warned about and ignored', () => {
  assert.throws(
    () => runa11yCoreOnHtml(PAGE, { engineOptions: { strictOptions: true, timeBudgetMs: 0 } }),
    (err) => err.code === 'INVALID_ENGINE_OPTIONS' && /timeBudgetMs/.test(err.message)
  );
  const { value: result, said } = scan({ timeBudgetMs: -5 }, RUN_ONLY);
  assert.ok(said.some((s) => /timeBudgetMs must be .*; ignored\./.test(s)));
  assert.equal(result.engine.incomplete, undefined);
  assert.equal(result.notRun, undefined);
  assert.equal(result.checksResults.length, 2);
});

test('timeBudgetMs: Infinity is no limit, accepted without a warning or a strict error', () => {
  assert.deepEqual(checkEngineOptions({ timeBudgetMs: Infinity }), []);
  const { value: result, said } = scan({ strictOptions: true, timeBudgetMs: Infinity }, RUN_ONLY);
  assert.deepEqual(said, []);
  assert.equal(result.engine.incomplete, undefined);
  assert.equal('notRun' in result, false);
  assert.equal(result.checksResults.length, 2);
  // In a scan of several profiles, too.
  const { value: both, said: saidBoth } = scan({
    timeBudgetMs: Infinity,
    profile: ['wcag21-aa', 'wcag22-aa']
  });
  assert.deepEqual(
    saidBoth.filter((s) => /timeBudgetMs/.test(s)),
    []
  );
  assert.equal(both.engine.incomplete, undefined);
  assert.equal(both.engine.profilesNotRun, undefined);
});

test('a scan within its budget is as without one', () => {
  const plain = scan({}, RUN_ONLY).value;
  const { value: budgeted, said } = scan({ timeBudgetMs: 1e9 }, RUN_ONLY);
  assert.deepEqual(said, []);
  assert.equal(budgeted.engine.incomplete, undefined);
  assert.equal('notRun' in budgeted, false);
  assert.deepEqual(
    budgeted.checksResults.map((c) => [c.ruleId, c.outcome]),
    plain.checksResults.map((c) => [c.ruleId, c.outcome])
  );
});

test('a scan past its budget starts no more rules, lists them and says it is incomplete', () => {
  const { value: result, said } = scan({ timeBudgetMs: NONE_LEFT }, RUN_ONLY);
  assert.deepEqual(result.checksResults, []);
  assert.deepEqual(result.notRun.map((n) => [n.ruleId, n.reason]).sort(), [
    ['html-lang-attr-present', 'timeBudget'],
    ['page-title-present', 'timeBudget']
  ]);
  assert.deepEqual(result.engine.incomplete, {
    reason: 'timeBudget',
    timeBudgetMs: NONE_LEFT,
    rulesNotRun: 2
  });
  assert.ok(said.some((s) => /time budget .* did not run 2 rules/.test(s)));
  // No rollup passes: each misses a rule, marked as not run.
  const target = scan({ timeBudgetMs: NONE_LEFT }, { wcag: { version: '2.2', level: 'A' } }).value;
  assert.ok(target.rulesResults.length > 0);
  for (const rollup of target.rulesResults) {
    assert.equal(rollup.outcome, 'cantTell', rollup.ruleId);
    const contributors = rollup.data.details.contributors;
    assert.ok(contributors.some((c) => c.outcome === 'missing' && c.notRun === 'timeBudget'));
  }
});

test('in a scan of several profiles the budget is the whole scan’s', () => {
  const { value: result } = scan({ timeBudgetMs: NONE_LEFT, profile: ['wcag22-aa', 'wcag21-aa'] });
  assert.deepEqual(result.engine.profiles, ['wcag22-aa']);
  assert.deepEqual(result.engine.profilesNotRun, [{ profile: 'wcag21-aa', reason: 'timeBudget' }]);
  assert.equal(result.engine.incomplete.reason, 'timeBudget');
  assert.equal(result.engine.incomplete.timeBudgetMs, NONE_LEFT);
  assert.equal(result.engine.incomplete.profilesNotRun, 1);
  assert.equal(result.engine.incomplete.rulesNotRun, result.notRun.length);
  assert.ok(result.notRun.length > 0);
  assert.ok(result.notRun.every((n) => n.reason === 'timeBudget'));
  assert.ok(result.notRun.some((n) => n.profile === 'wcag22-aa'));

  const roomy = scan({ timeBudgetMs: 1e9, profile: ['wcag22-aa', 'wcag21-aa'] }).value;
  assert.equal(roomy.engine.incomplete, undefined);
  assert.equal(roomy.notRun, undefined);
  assert.deepEqual(roomy.engine.profiles, ['wcag22-aa', 'wcag21-aa']);
});

// A profile the budget leaves unstarted, after one that started every rule
// it selected: the scan is incomplete in every reader, not only in SARIF and
// JUnit (round 10, S10-1).
test('a profile the budget left unstarted lists its rules in notRun, and every reader sees them', () => {
  const slow = {
    id: 'org-slow',
    meta: { title: 'Slow', tags: ['wcag2a', 'wcag111'], wcagSc: ['1.1.1'] },
    runInPage(ctx) {
      const t = Date.now();
      while (Date.now() - t < 60);
      return { ruleId: ctx.rule.ruleId, outcome: 'pass', severity: 'moderate', occurrences: [] };
    }
  };
  const { value: result, said } = scan(
    { profile: ['wcag21-aa', 'wcag22-aa'], timeBudgetMs: 30, customRules: [slow] },
    undefined
  );
  assert.deepEqual(result.engine.profilesNotRun, [{ profile: 'wcag22-aa', reason: 'timeBudget' }]);
  const skipped = result.notRun.filter((n) => n.profile === 'wcag22-aa');
  assert.ok(skipped.some((n) => n.ruleId === 'target-size-minimum'));
  assert.ok(skipped.every((n) => n.reason === 'timeBudget'));
  assert.equal(result.engine.incomplete.rulesNotRun, result.notRun.length);
  assert.ok(said.some((s) => /before profile "wcag22-aa" started/.test(s)));

  const match = matchBaseline(result, buildBaselineEntries(result));
  assert.ok(match.incomplete.notRun.includes('target-size-minimum'));
  const earl = renderEarlReport(result);
  const target = earl['@graph'][0].assertions.find((a) => a.test.title === 'target-size-minimum');
  assert.equal(target.result.outcome, 'earl:untested');
  const html = renderHtmlReport(result, { manualChecks: false });
  const distinct = new Set(result.notRun.map((n) => n.ruleId)).size;
  assert.match(html, new RegExp(`<div><b>${distinct}</b>rules not run</div>`));
  const warned = [];
  const helpers = consoleHelpers(
    { console: { table: () => {}, warn: (m) => warned.push(m) } },
    {},
    null
  );
  const rows = helpers.table(result);
  assert.ok(rows.some((r) => r.outcome === 'notRun' && r.rule === 'target-size-minimum'));
  assert.ok(warned.some((s) => s.includes(`${result.notRun.length} rule(s) did not run`)));
});

function cutShort() {
  return scan({ timeBudgetMs: NONE_LEFT }, RUN_ONLY).value;
}

test('SARIF: each rule not run is an error notification, and the run is not successful', () => {
  const sarif = JSON.parse(renderSarifReport(cutShort()));
  const invocation = sarif.runs[0].invocations[0];
  assert.equal(invocation.executionSuccessful, false);
  const notes = invocation.toolExecutionNotifications.filter((n) =>
    /was not run: the scan reached its time budget/.test(n.message.text)
  );
  assert.deepEqual(notes.map((n) => [n.level, n.associatedRule.id]).sort(), [
    ['error', 'html-lang-attr-present'],
    ['error', 'page-title-present']
  ]);
});

test('SARIF and JUnit: a profile the budget left unstarted is an error even with allowProfilesNotRun', () => {
  const { value: result } = scan({ timeBudgetMs: NONE_LEFT, profile: ['wcag22-aa', 'wcag21-aa'] });
  const sarif = JSON.parse(renderSarifReport(result, { allowProfilesNotRun: true }));
  const invocation = sarif.runs[0].invocations[0];
  assert.equal(invocation.executionSuccessful, false);
  const profileNote = invocation.toolExecutionNotifications.find((n) =>
    /profile wcag21-aa was asked for and not run/.test(n.message.text)
  );
  assert.equal(profileNote.level, 'error');
  const xml = renderJunitReport(result, { allowProfilesNotRun: true });
  assert.match(xml, /<testcase classname="profile" name="wcag21-aa" time="0">\s*<error /);
});

test('JUnit: each rule not run is an error test case, so the build is not green', () => {
  const xml = renderJunitReport(cutShort());
  assert.match(xml, /<testsuites name="surea11y" tests="\d+" failures="0" errors="2"/);
  assert.match(xml, /<testsuite name="Rules not run" tests="2" failures="0" errors="2"/);
  assert.match(xml, /<property name="timeBudgetMs" value="1e-9"\/>/);
  assert.match(xml, /<property name="incomplete" value="timeBudget"\/>/);
  assert.match(
    xml,
    /<testcase classname="not-run" name="page-title-present" time="0">\s*<error type="timeBudget" message="Not run: the scan reached its time budget/
  );
});

test('HTML report: says the scan is incomplete, names the rules, and counts them', () => {
  const html = renderHtmlReport(cutShort(), { manualChecks: false });
  assert.match(html, /<p class="incomplete" role="note">Incomplete scan: its time budget of/);
  assert.match(
    html,
    /Not run \(2\): (page-title-present, html-lang-attr-present|html-lang-attr-present, page-title-present)/
  );
  assert.match(html, /<div><b>2<\/b>rules not run<\/div>/);
  const de = renderHtmlReport(scan({ timeBudgetMs: NONE_LEFT, locale: 'de' }, RUN_ONLY).value, {
    manualChecks: false
  });
  assert.match(de, /Unvollständiger Scan/);
  // A complete scan says nothing of the kind.
  const complete = renderHtmlReport(scan({}, RUN_ONLY).value, { manualChecks: false });
  assert.doesNotMatch(complete, /class="incomplete"/);
});

test('HTML report: a frame its scan reached with no budget left makes the scan incomplete', () => {
  const crossFrame = {
    topFrame: scan({}, RUN_ONLY).value,
    frames: [
      { url: 'https://example.test/f.html', selector: 'iframe', topFrame: cutShort(), frames: [] }
    ]
  };
  const html = renderHtmlReport(crossFrame, { manualChecks: false });
  // Before anything found, and again in the frame's own section.
  assert.equal(html.match(/<p class="incomplete" role="note">Incomplete scan/g).length, 2);
  assert.ok(html.indexOf('class="incomplete"') < html.indexOf('class="frame-heading"'));
  // SARIF, JUnit and matchBaseline read every frame.
  assert.equal(
    JSON.parse(renderSarifReport(crossFrame)).runs[0].invocations[0].executionSuccessful,
    false
  );
  assert.match(renderJunitReport(crossFrame), /<error type="timeBudget"/);
  assert.equal(matchBaseline(crossFrame, []).incomplete.notRun.length, 2);
});

test('EARL: a rule not run is asserted earl:untested', () => {
  const earl = renderEarlReport(cutShort());
  const outcomes = earl['@graph'][0].assertions.map((a) => [a.test.title, a.result.outcome]);
  assert.deepEqual(outcomes.sort(), [
    ['html-lang-attr-present', 'earl:untested'],
    ['page-title-present', 'earl:untested']
  ]);
});

test('matchBaseline: an incomplete scan says so, so no new failure is not clean', () => {
  const result = cutShort();
  const match = matchBaseline(result, buildBaselineEntries(result));
  assert.equal(match.newCount, 0);
  assert.deepEqual(match.incomplete.notRun.sort(), [
    'html-lang-attr-present',
    'page-title-present'
  ]);
  assert.equal('incomplete' in matchBaseline(scan({}, RUN_ONLY).value, []), false);
});

test('console helpers: table() lists each rule not run and warns that the scan is incomplete', () => {
  const said = [];
  const global = { console: { table: () => {}, warn: (m) => said.push(m) } };
  const helpers = consoleHelpers(global, {}, null);
  const rows = helpers.table(cutShort());
  assert.deepEqual(rows.map((r) => [r.outcome, r.rule]).sort(), [
    ['notRun', 'html-lang-attr-present'],
    ['notRun', 'page-title-present']
  ]);
  assert.ok(said.some((s) => /This scan is incomplete/.test(s)));
});

test('the browser bundle honors timeBudgetMs', async () => {
  const src = pathToFileURL(path.join(__dirname, '..', 'surea11y.browser.js')).href;
  const dom = await new Promise((resolve, reject) => {
    const d = new JSDOM(PAGE.replace('</body>', `<script src="${src}"></script></body>`), {
      url: 'https://example.test/',
      runScripts: 'dangerously',
      resources: 'usable'
    });
    d.window.addEventListener('load', () => resolve(d));
    d.window.addEventListener('error', (e) => reject(e.error));
  });
  try {
    const { value: result } = quietly(() =>
      dom.window.a11ycore.runa11yCoreInPage(null, null, { timeBudgetMs: NONE_LEFT }, RUN_ONLY)
    );
    assert.equal(result.engine.incomplete.reason, 'timeBudget');
    assert.equal(result.notRun.length, 2);
    const { value: full } = quietly(() =>
      dom.window.a11ycore.runa11yCoreInPage(null, null, { timeBudgetMs: 1e9 }, RUN_ONLY)
    );
    assert.equal(full.engine.incomplete, undefined);
    assert.equal(full.checksResults.length, 2);
  } finally {
    dom.window.close();
  }
});

// A frame the scan reaches with no budget left, in a scan of several
// profiles: its first profile starts no rule and the others are not run, as
// at the top (round 12, A12-4). Its warnings give the scan's budget, not
// what was left of it (A12-5).
test('a frame reached with no budget left, scanning several profiles, lists the profiles not run (round 12, A12-4, A12-5)', () => {
  const main = require('../src/index.js');
  const { createDom } = require('../src/testing.js');
  const { budgetedOptions } = require('../src/core/frame-scan.js');
  createDom(PAGE);
  const given = { timeBudgetMs: 300, profile: ['wcag22-aa', 'wcag21-aa'] };
  // Started 1 s ago: nothing left.
  const frameOptions = budgetedOptions(given, given, 300, Date.now() - 1000);
  const { value: frame, said } = quietly(() =>
    main.runa11yCoreInPage('https://example.test/f.html', null, frameOptions, null)
  );
  assert.deepEqual(frame.engine.profiles, ['wcag22-aa']);
  assert.deepEqual(frame.engine.profilesNotRun, [{ profile: 'wcag21-aa', reason: 'timeBudget' }]);
  assert.equal(frame.engine.incomplete.profilesNotRun, 1);
  assert.equal(frame.engine.incomplete.timeBudgetMs, 300);
  assert.equal(frame.engine.incomplete.rulesNotRun, frame.notRun.length);
  assert.ok(said.some((s) => s.includes("time budget of 300 ms before this frame's scan started")));
  assert.ok(
    said.some((s) => s.includes('time budget of 300 ms before profile "wcag21-aa" started'))
  );

  // A frame with some budget left: its warnings give the scan's 300 ms, not
  // a fraction of a ms left over.
  const partOptions = budgetedOptions(given, given, 300, Date.now() - 299.9999);
  const { said: partSaid } = quietly(() =>
    main.runa11yCoreInPage('https://example.test/f.html', null, partOptions, null)
  );
  const budgets = partSaid
    .map((s) => /time budget of ([^ ]+) ms/.exec(s))
    .filter(Boolean)
    .map((m) => m[1]);
  assert.ok(budgets.length > 0);
  assert.ok(
    budgets.every((b) => b === '300'),
    String(budgets)
  );
});

test('the budget warnings give the scan’s budget in whole ms (round 12, A12-5)', () => {
  const slow = {
    id: 'org-slow',
    meta: { title: 'Slow', tags: ['wcag2a', 'wcag111'], wcagSc: ['1.1.1'] },
    runInPage(ctx) {
      const t = Date.now();
      while (Date.now() - t < 20);
      return { ruleId: ctx.rule.ruleId, outcome: 'pass', severity: 'moderate', occurrences: [] };
    }
  };
  const { said } = scan({
    profile: ['wcag21-aa', 'wcag22-aa'],
    timeBudgetMs: 12.345,
    customRules: [slow]
  });
  const named = said.filter((s) => /time budget/.test(s));
  assert.ok(named.length >= 1, String(named));
  for (const s of named) assert.match(s, /time budget of 12 ms/, s);
});

// A scan of several profiles lists a rule once for each profile it did not
// run in; the HTML report counts each rule once, and names the profiles the
// budget left unstarted apart from the rules (round 12, A12-6).
test('HTML report: counts each rule not run once, and lists unstarted profiles apart (round 12, A12-6)', () => {
  const { value: result } = scan({
    timeBudgetMs: NONE_LEFT,
    profile: ['wcag22-aa', 'wcag21-aa', 'wcag20-a']
  });
  const ids = [...new Set(result.notRun.map((n) => n.ruleId))];
  assert.ok(result.notRun.length > ids.length);
  const html = renderHtmlReport(result, { manualChecks: false });
  assert.match(html, new RegExp(`<div><b>${ids.length}</b>rules not run</div>`));
  const banner = /<p class="incomplete" role="note">([^<]*)<\/p>/.exec(html)[1];
  assert.match(banner, new RegExp(`Not run \\(${ids.length}\\): `));
  assert.match(banner, /Profiles not started: wcag21-aa, wcag20-a\./);
  const listed = /Not run \(\d+\): ([^.]*)\./.exec(banner)[1].split(', ');
  assert.deepEqual(listed.sort(), ids.sort());
});

// The browser bundle's runa11yCoreInPageAsync counts the style sheets it
// fetches against the budget: it stops waiting for them when the budget is
// spent, names those it did not read, and lists the rules it did not start
// (round 12, A12-7).
test('runa11yCoreInPageAsync counts fetching style sheets against the time budget (round 12, A12-7)', async () => {
  const src = pathToFileURL(path.join(__dirname, '..', 'surea11y.browser.js')).href;
  const dom = await new Promise((resolve, reject) => {
    const d = new JSDOM(PAGE.replace('</body>', `<script src="${src}"></script></body>`), {
      url: 'https://example.test/',
      runScripts: 'dangerously',
      resources: 'usable'
    });
    d.window.addEventListener('load', () => resolve(d));
    d.window.addEventListener('error', (e) => reject(e.error));
  });
  try {
    const w = dom.window;
    // A sheet from another origin the page can't read, whose server never
    // answers.
    const sheet = {
      href: 'https://cdn.other.test/slow.css',
      get cssRules() {
        throw new w.DOMException('cross-origin', 'SecurityError');
      }
    };
    Object.defineProperty(w.Document.prototype, 'styleSheets', {
      get: () => [sheet],
      configurable: true
    });
    w.fetch = () => new Promise(() => {});
    const warned = [];
    const warn = w.console.warn;
    w.console.warn = (m) => warned.push(String(m));
    const started = Date.now();
    let result;
    try {
      result = await w.a11ycore.runa11yCoreInPageAsync(null, null, { timeBudgetMs: 100 }, RUN_ONLY);
    } finally {
      w.console.warn = warn;
    }
    // Far less than the 5 s each fetch may otherwise take.
    assert.ok(Date.now() - started < 3000);
    assert.equal(result.engine.incomplete.reason, 'timeBudget');
    assert.equal(result.engine.incomplete.timeBudgetMs, 100);
    assert.deepEqual([...result.engine.incomplete.styleSheetsNotRead], [sheet.href]);
    assert.equal(result.notRun.length, 2);
    assert.ok(
      warned.some((m) => m.includes(`not read: ${sheet.href}`)),
      String(warned)
    );
    assert.ok(
      warned.some((m) =>
        /fetching the style sheets the page can't read, before any rule started/.test(m)
      )
    );
  } finally {
    dom.window.close();
  }
});
