'use strict';

// A value a page's script puts on Object.prototype, a plain one as well as a
// read-only one, is read for every key a plain object lacks. The engine
// never reads its own data through the prototype chain: the options, its
// records and a rule's result are copies with no prototype, or are read as
// their own keys. So a scan gives the result it gives without the value
// (round 12, A12-1, A12-2, A12-3), and it never touches Object.prototype:
// page code that runs during the scan (a focus handler) sees it as it is
// (R12F-1 to R12F-6).

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const main = require('../src/index.js');
const { createDom } = require('../src/testing.js');

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>t</h1>' +
  '<img src="a.png"><img src="b.png"><a href="/x"></a></main></body></html>';

// Each key the engine reads of a rule's result, an occurrence, the caller's
// options or a flag only it sets, with a value that changes a scan that
// reads it.
const POISON = {
  occurrenceOutcome: 'pass',
  outcome: 'pass',
  type: 'manual',
  profile: 'wcag20-a',
  severity: 'minor',
  lean: { toward: 'pass' },
  error: 'poisoned',
  applicable: false,
  __budgetSpent: true,
  __profileNotApplied: 'timeBudget',
  __rulesNotRun: ['img-alt-present'],
  timeBudgetMs: 1,
  excludeSelectors: ['main'],
  contextSelector: 'h1',
  maxOccurrencesPerRule: 1,
  output: { maxOccurrencesPerRule: 1 },
  notRun: [{ ruleId: 'img-alt-present', reason: 'timeBudget' }],
  locale: 'de',
  includeHiddenElements: true,
  strictOptions: true,
  optInRules: 'all',
  rules: { 'img-alt-present': { enabled: false } },
  runOnly: { type: 'rule', values: ['html-lang-present'] },
  tags: ['wcag2aaa'],
  policy: { allowedOutcomes: ['pass'] },
  packs: ['acme@1.0.0'],
  messages: { en: { 'img-alt-present_title': 'poisoned' } },
  incomplete: { reason: 'timeBudget' },
  standards: [{ key: 'x' }],
  __a11ycoreSharedCache: { dom: 'x', contrast: 'x' },
  packCodeRuleIds: ['img-alt-present'],
  variant: { of: 'x' },
  settings: ['enabled'],
  allowedOutcomes: ['pass'],
  howToCheck: { steps: [] }
};

const summary = (result) => ({
  checks: result.checksResults.map((c) => [
    c.ruleId,
    c.outcome,
    c.severity,
    (c.occurrences || []).length,
    (c.occurrences || []).map((o) =>
      Object.prototype.hasOwnProperty.call(o, 'occurrenceOutcome') ? o.occurrenceOutcome : null
    ),
    Object.prototype.hasOwnProperty.call(c, 'error') ? c.error : null
  ]),
  rollups: result.rulesResults.map((r) => [r.ruleId, r.outcome, r.severity]),
  ownKeys: Object.keys(result).sort(),
  engineKeys: Object.keys(result.engine).sort()
});

const scans = () => {
  createDom(PAGE);
  return {
    node: () => main.runDomRulesInPage('https://example.test/', null, {}, null),
    inPage: () => main.runa11yCoreInPage('https://example.test/', null, {}, null),
    profiles: () =>
      main.runa11yCoreInPage(
        'https://example.test/',
        null,
        { profile: ['wcag22-aa', 'wcag21-aa'] },
        null
      )
  };
};

function withPrototypeValue(key, descriptor, fn) {
  assert.ok(!Object.prototype.hasOwnProperty.call(Object.prototype, key), key);
  Object.defineProperty(Object.prototype, key, { configurable: true, ...descriptor });
  try {
    return fn();
  } finally {
    delete Object.prototype[key];
  }
}

// Object.prototype as a page sees it: each key in order, its descriptor,
// and whether more can be added.
function prototypeState() {
  return {
    keys: Reflect.ownKeys(Object.prototype).map(String),
    descriptors: Object.getOwnPropertyDescriptors(Object.prototype),
    extensible: Object.isExtensible(Object.prototype)
  };
}

test('a plain or read-only value on Object.prototype changes no scan (round 12, A12-1, A12-2, A12-3)', () => {
  const run = scans();
  const clean = {};
  for (const [name, scan] of Object.entries(run)) clean[name] = summary(scan());
  // The page has failures for the poisoned keys to hide.
  assert.ok(
    clean.inPage.checks.some(([id, outcome]) => id === 'img-alt-present' && outcome === 'fail')
  );
  for (const [key, value] of Object.entries(POISON)) {
    for (const [form, descriptor] of [
      ['plain', { value, writable: true, enumerable: true }],
      ['read-only', { value, writable: false, enumerable: false }]
    ]) {
      for (const [name, scan] of Object.entries(run)) {
        const got = withPrototypeValue(key, descriptor, () => {
          const before = prototypeState();
          const result = scan();
          // Never taken off, nor put back.
          assert.deepEqual(prototypeState(), before, `${key} ${form} ${name}: untouched`);
          return summary(result);
        });
        assert.deepEqual(got, clean[name], `${key} (${form}) on Object.prototype, ${name} scan`);
      }
    }
  }
});

test('a scan leaves Object.prototype as it is, before, during and after (round 12, R12F-1 to R12F-6)', () => {
  createDom(PAGE);
  Object.prototype.zqSeen = 'kept';
  try {
    const before = prototypeState();
    let during = null;
    const rule = {
      id: 'acme-prototype-state',
      meta: { title: 'Prototype state', type: 'automatic', tags: ['best-practice'] },
      runInPage: () => {
        during = prototypeState();
        return { outcome: 'pass', occurrences: [] };
      }
    };
    for (const scan of [main.runDomRulesInPage, main.runa11yCoreInPage]) {
      during = null;
      scan('https://example.test/', null, { customRules: [rule] }, null);
      assert.deepEqual(during, before, 'during the scan');
      assert.deepEqual(prototypeState(), before, 'after the scan');
      assert.equal({}.zqSeen, 'kept');
    }
  } finally {
    delete Object.prototype.zqSeen;
  }
});

test('the outcome every reporter reads is the occurrence own, not one on Object.prototype (round 12, A12-1)', () => {
  const { occurrenceOutcome, reviewGroupOf, tierOf } = require('../src/occurrence-outcome.js');
  withPrototypeValue(
    'occurrenceOutcome',
    { value: 'pass', writable: true, enumerable: true },
    () => {
      assert.equal(occurrenceOutcome({ outcome: 'fail' }, {}), 'fail');
      assert.equal(reviewGroupOf({ outcome: 'fail' }, {}), 'fail');
    }
  );
  withPrototypeValue('outcome', { value: 'cantTell', writable: true }, () => {
    assert.equal(tierOf({}), undefined);
    assert.equal(occurrenceOutcome({}, {}), null);
  });
  withPrototypeValue('lean', { value: { toward: 'pass' }, writable: true }, () => {
    assert.equal(reviewGroupOf({ outcome: 'cantTell' }, {}), 'open');
  });
});

// The focus handlers a page runs while a rule moves focus see the page's
// Object.prototype, its values included.
function focusPage(rule) {
  createDom(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>t</h1>' +
      '<div aria-hidden="true"><a href="#x">link</a></div>' +
      '<a href="#y" style="opacity:0">hidden link</a>' +
      '<button>ok</button><img src="a.png"><img src="b.png"></main></body></html>'
  );
  const frame = document.createElement('iframe');
  frame.setAttribute('title', 'Embedded');
  frame.setAttribute('tabindex', '-1');
  document.body.appendChild(frame);
  frame.contentDocument.body.innerHTML = '<a href="#in">inside</a>';
  const docs = rule === 'iframe-focusable-content' ? [frame.contentDocument] : [document];
  return docs;
}

test('a page focus handler sees its values on Object.prototype while a rule moves focus (round 12, R12F-1)', () => {
  for (const rule of ['aria-hidden-focus', 'css-hidden-focus', 'iframe-focusable-content']) {
    const docs = focusPage(rule);
    Object.prototype.cfg = { x: 1 };
    const seen = [];
    const errors = [];
    const handler = () => {
      try {
        seen.push({}.cfg.x);
      } catch (err) {
        errors.push(err);
      }
    };
    try {
      for (const doc of docs) doc.addEventListener('focusin', handler, true);
      main.runDomRulesInPage('https://example.test/', null, {}, [rule]);
    } finally {
      for (const doc of docs) doc.removeEventListener('focusin', handler, true);
      delete Object.prototype.cfg;
    }
    assert.ok(seen.length > 0, `${rule} moved focus`);
    assert.deepEqual(errors, [], rule);
    assert.ok(
      seen.every((x) => x === 1),
      rule
    );
  }
});

test('a page write to Object.prototype during the scan stays (round 12, R12F-4)', () => {
  focusPage('aria-hidden-focus');
  Object.prototype.cfg = 1;
  const handler = () => {
    Object.prototype.cfg = 2;
  };
  try {
    document.addEventListener('focusin', handler, true);
    main.runDomRulesInPage('https://example.test/', null, {}, ['aria-hidden-focus']);
    assert.equal({}.cfg, 2);
  } finally {
    document.removeEventListener('focusin', handler, true);
    delete Object.prototype.cfg;
  }
});

test('values page code puts on Object.prototype during the scan change no result (round 12, R12F-5)', () => {
  focusPage('aria-hidden-focus');
  const runOnly = ['aria-hidden-focus', 'img-alt-present'];
  const clean = main.runDomRulesInPage('https://example.test/', null, {}, runOnly);
  const handler = () => {
    Object.prototype.occurrenceOutcome = 'pass';
    Object.prototype.outcome = 'pass';
  };
  let got;
  try {
    document.addEventListener('focusin', handler, true);
    got = main.runDomRulesInPage('https://example.test/', null, {}, runOnly);
    assert.equal({}.occurrenceOutcome, 'pass', 'the handler ran');
  } finally {
    document.removeEventListener('focusin', handler, true);
    delete Object.prototype.occurrenceOutcome;
    delete Object.prototype.outcome;
  }
  const img = got.checksResults.find((c) => c.ruleId === 'img-alt-present');
  assert.equal(img.outcome, 'fail');
  assert.equal(img.occurrences.length, 2);
  assert.deepEqual(summary(got), summary(clean));
});

test('for-in order on Object.prototype stays as the page left it (round 12, R12F-3)', () => {
  createDom(PAGE);
  Object.prototype.zq1 = 1;
  Object.prototype.zq2 = 2;
  Object.prototype.zq3 = 3;
  try {
    main.runDomRulesInPage('https://example.test/', null, {}, null);
    main.runa11yCoreInPage('https://example.test/', null, {}, null);
    const keys = [];
    for (const key in {}) keys.push(key);
    assert.deepEqual(keys, ['zq1', 'zq2', 'zq3']);
  } finally {
    delete Object.prototype.zq1;
    delete Object.prototype.zq2;
    delete Object.prototype.zq3;
  }
});

// What can't be undone (a non-extensible or non-configurable
// Object.prototype) is tried in a process of its own: the scan is compared
// with one run before the page's script changed Object.prototype.
function inProcess(setup) {
  const script = `
    const main = require(${JSON.stringify(path.join(__dirname, '../src/index.js'))});
    const { createDom } = require(${JSON.stringify(path.join(__dirname, '../src/testing.js'))});
    createDom(${JSON.stringify(PAGE)});
    const brief = (r) => JSON.stringify(r.checksResults.map((c) => [c.ruleId, c.outcome, (c.occurrences || []).length]));
    const scan = () => brief(main.runa11yCoreInPage('https://example.test/', null, {}, null));
    const clean = scan();
    ${setup}
    let out;
    try {
      out = { same: scan() === clean, flag: ({}).flag, own: Object.prototype.hasOwnProperty('flag') };
    } catch (err) {
      out = { code: err.code, message: err.message };
    }
    console.log(JSON.stringify(out));
  `;
  const out = spawnSync(process.execPath, ['-e', script], { encoding: 'utf8' });
  assert.equal(out.status, 0, out.stderr);
  return JSON.parse(out.stdout.trim().split('\n').pop());
}

test('a value on a non-extensible Object.prototype stays (round 12, R12F-2)', () => {
  assert.deepEqual(
    inProcess("Object.prototype.flag = 'on'; Object.preventExtensions(Object.prototype);"),
    { same: true, flag: 'on', own: true }
  );
});

test('a read-only, non-configurable value on Object.prototype scans as without it (round 12, A12-3, R12F-6)', () => {
  assert.deepEqual(inProcess("Object.defineProperty(Object.prototype, 'flag', { value: 'on' });"), {
    same: true,
    flag: 'on',
    own: true
  });
  // Not enumerable: jsdom itself copies every enumerable key into an event.
  assert.deepEqual(
    inProcess(
      "Object.defineProperty(Object.prototype, 'flag', { value: 'on', writable: true, configurable: true }); Object.freeze(Object.prototype);"
    ),
    { same: true, flag: 'on', own: true }
  );
  // A key the engine gives its own objects (result.type) is tried in
  // Chromium (object-prototype-values-browser.test.js): jsdom's own events
  // can't be made with a read-only type on Object.prototype.
});

test('a getter on Object.prototype the engine would read still stops the scan (round 12, A12-1)', () => {
  createDom(PAGE);
  withPrototypeValue(
    'occurrenceOutcome',
    {
      get() {
        return 'pass';
      }
    },
    () => {
      assert.throws(
        () => main.runa11yCoreInPage('https://example.test/', null, {}, null),
        (err) => err.code === 'PAGE_BUILTINS_BROKEN'
      );
    }
  );
});

test('preloadStyleSheets reads its own deadline and timeout, never ones on Object.prototype (round 12, R12F-7)', async () => {
  createDom(PAGE);
  const href = 'https://cdn.other.test/a.css';
  const sheet = {
    href,
    get cssRules() {
      throw new window.DOMException('cross-origin', 'SecurityError');
    }
  };
  const descriptor = Object.getOwnPropertyDescriptor(window.Document.prototype, 'styleSheets');
  Object.defineProperty(window.Document.prototype, 'styleSheets', {
    get: () => [sheet],
    configurable: true
  });
  const fetchWas = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, text: async () => 'a { color: red }' });
  Object.prototype.deadline = 0;
  Object.prototype.timeoutMs = 0;
  try {
    const sheets = await main.preloadStyleSheets();
    assert.deepEqual(
      sheets.map((s) => s.href),
      [href]
    );
    assert.deepEqual(sheets.notRead, []);
  } finally {
    delete Object.prototype.deadline;
    delete Object.prototype.timeoutMs;
    globalThis.fetch = fetchWas;
    Object.defineProperty(window.Document.prototype, 'styleSheets', descriptor);
  }
});
