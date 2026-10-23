'use strict';

/**
 * The live-region hook's script (liveRegionHookScript,
 * src/core/live-region-hook.js), how the engine reads its registry
 * (getAnnouncements, engine.environment.liveRegionHook), and what
 * live-region-announcements makes of what it recorded. Run in jsdom; the
 * browser side is tested in Chromium, in
 * engine-checks/live-region-hook-chromium.test.js.
 *
 * The hook records nothing until the document has loaded, so each page here
 * waits for jsdom's load event before the page's own changes run.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const { liveRegionHookScript, getAnnouncements } = require('../../src/index.js');
const {
  readLiveRegionHook,
  MAX_ENTRIES,
  CONCRETE_ROLES
} = require('../../src/core/live-region-hook.js');
const { createAriaHelpers } = require('../../src/core/aria-helpers.js');
const { runa11yCoreOnDom } = require('../helpers/runDomRulesOnHtml');

const KEY = Symbol.for('surea11y.liveRegions');
const RULE_ID = 'live-region-announcements';

function dom(body) {
  return new JSDOM(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>t</h1>${body}</main></body></html>`,
    { runScripts: 'outside-only' }
  );
}

const loaded = (d) =>
  d.window.document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise((resolve) => d.window.addEventListener('load', resolve));

// A loaded jsdom page with the hook installed before it loaded, unless said
// otherwise; then each script in turn, each as a task of its own.
async function page(body, scripts = [], { hook = true, early } = {}) {
  const d = dom(body);
  if (hook) d.window.eval(liveRegionHookScript(early === undefined ? undefined : { early }));
  await loaded(d);
  for (const script of [].concat(scripts)) {
    d.window.eval(script);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return d;
}

const texts = (d) => (getAnnouncements(d.window) || []).map((a) => [a.text, a.politeness]);
const findings = (d) => readLiveRegionHook(d.window).findings.map((f) => [f.code, f.text]);

function scan(d, options = {}) {
  const result = runa11yCoreOnDom(d, {
    runOnly: [RULE_ID],
    entryPointParity: false,
    ...options
  });
  const rule = result.checksResults.find((c) => c.ruleId === RULE_ID);
  return { rule, environment: result.engine.environment };
}

test('the script parses, and holds nothing that evaluates text or ends an inline script', () => {
  for (const source of [liveRegionHookScript(), liveRegionHookScript({ early: true })]) {
    assert.doesNotThrow(() => new vm.Script(source));
    assert.doesNotMatch(source, /\beval\s*\(|new Function|<\/script/i);
  }
  assert.notEqual(liveRegionHookScript(), liveRegionHookScript({ early: true }));
});

test('the role list is the engine’s own', () => {
  assert.deepEqual([...CONCRETE_ROLES].sort(), createAriaHelpers({}).concreteRoles().sort());
});

test('options are checked', () => {
  assert.throws(() => liveRegionHookScript(null), TypeError);
  assert.throws(() => liveRegionHookScript([]), TypeError);
  assert.throws(() => liveRegionHookScript({ erly: true }), /no option named "erly"/);
  assert.throws(() => liveRegionHookScript({ early: 'yes' }), /early must be true or false/);
  assert.doesNotThrow(() => liveRegionHookScript({ early: false }));
});

test('without the hook there is nothing to read', async () => {
  const d = await page('<div role="status"></div>', [], { hook: false });
  assert.equal(getAnnouncements(d.window), null);
  assert.equal(readLiveRegionHook(d.window), null);
  assert.equal(scan(d).environment.liveRegionHook, undefined);
});

test('a text a shown live region is given is recorded as made available to announce', async () => {
  const d = await page(
    '<div id="s" role="status"></div><div id="l" aria-live="assertive"></div><output id="o"></output><div id="g" role="log"></div>',
    [
      "document.getElementById('s').textContent = 'Saved';",
      "document.getElementById('l').textContent = '  Two \\n  errors  ';",
      "document.getElementById('o').textContent = '42';",
      "document.getElementById('g').appendChild(document.createElement('p')).textContent = 'Joined';"
    ]
  );
  assert.deepEqual(texts(d), [
    ['Saved', 'polite'],
    ['Two errors', 'assertive'],
    ['42', 'polite'],
    ['Joined', 'polite']
  ]);
  const first = getAnnouncements(d.window)[0];
  assert.equal(first.element, d.window.document.getElementById('s'));
  assert.equal(typeof first.time, 'number');
  assert.deepEqual(findings(d), []);
});

test('a change to a text node inside the region counts, and the same text again does not', async () => {
  const d = await page('<div id="s" role="status"><span>Idle</span></div>', [
    "document.querySelector('#s span').firstChild.data = 'Loading';",
    "document.querySelector('#s span').firstChild.data = 'Loading';",
    "document.querySelector('#s span').firstChild.data = 'Done';"
  ]);
  assert.deepEqual(texts(d), [
    ['Loading', 'polite'],
    ['Done', 'polite']
  ]);
});

test('nothing is recorded for a region turned off, hidden, or out of reach of assistive technology', async () => {
  const d = await page(
    [
      '<div id="off" role="status" aria-live="off"></div>',
      '<div hidden><div id="h" role="status"></div></div>',
      '<div aria-hidden="true"><div id="ah" role="status"></div></div>',
      '<div inert><div id="in" aria-live="polite"></div></div>',
      '<div id="plain"></div>'
    ].join(''),
    "for (const id of ['off', 'h', 'ah', 'in', 'plain']) document.getElementById(id).textContent = 'x ' + id;"
  );
  assert.deepEqual(texts(d), []);
  assert.deepEqual(findings(d), []);
});

test('the page as it loads is its starting state, not a change', async () => {
  const d = dom('<div id="s" role="status"></div>');
  d.window.eval(liveRegionHookScript());
  d.window.eval(
    "document.getElementById('s').textContent = 'Welcome'; document.querySelector('main').insertAdjacentHTML('beforeend', '<div role=\"status\">Ready</div>');"
  );
  await loaded(d);
  assert.deepEqual(texts(d), []);
  assert.deepEqual(findings(d), []);
});

test('a region added with its text is asked about, except an alert, which is announced', async () => {
  const d = await page('<div id="w"></div>', [
    "document.getElementById('w').innerHTML = '<div role=\"status\">Saved</div>';",
    "document.getElementById('w').insertAdjacentHTML('beforeend', '<div role=\"alert\">Failed</div>');",
    "document.getElementById('w').insertAdjacentHTML('beforeend', '<section><p aria-live=\"polite\">Nested</p></section>');"
  ]);
  assert.deepEqual(findings(d), [
    ['LIVE_REGION_INSERTED_WITH_CONTENT', 'Saved'],
    ['LIVE_REGION_INSERTED_WITH_CONTENT', 'Nested']
  ]);
  assert.deepEqual(texts(d), [['Failed', 'assertive']]);
});

test('a region added empty and given its text later is announced; added and filled in one task is not', async () => {
  const d = await page('<div id="w"></div>', [
    "const r = document.createElement('div'); r.setAttribute('role', 'status'); r.id = 'r'; document.getElementById('w').append(r);",
    "document.getElementById('r').textContent = 'Saved';",
    "const q = document.createElement('div'); q.setAttribute('aria-live', 'polite'); document.getElementById('w').append(q); q.textContent = 'At once';"
  ]);
  assert.deepEqual(texts(d), [['Saved', 'polite']]);
  assert.deepEqual(findings(d), [['LIVE_REGION_INSERTED_WITH_CONTENT', 'At once']]);
});

test('a hidden region shown and filled in one task is asked about; shown first and filled after is announced', async () => {
  const d = await page(
    '<div id="a" role="status" hidden></div><div id="b" role="status" style="display:none"></div>',
    [
      "const a = document.getElementById('a'); a.hidden = false; a.textContent = 'Together';",
      "document.getElementById('b').style.display = 'block';",
      "document.getElementById('b').textContent = 'Apart';"
    ]
  );
  assert.deepEqual(findings(d), [['LIVE_REGION_SHOWN_AND_FILLED', 'Together']]);
  assert.deepEqual(texts(d), [['Apart', 'polite']]);
});

test('a role attribute gives its first known role, in any case', async () => {
  const d = await page(
    '<div id="a" role="zzunknown status"></div><div id="b" role="STATUS"></div><div id="c" role="note status"></div>',
    "for (const id of ['a', 'b', 'c']) document.getElementById(id).textContent = id;"
  );
  assert.deepEqual(texts(d), [
    ['a', 'polite'],
    ['b', 'polite']
  ]);
});

test('an element that becomes a live region counts from its next change', async () => {
  const d = await page('<div id="r">Idle</div>', [
    "const r = document.getElementById('r'); r.setAttribute('role', 'status'); r.textContent = 'With it';",
    "document.getElementById('r').textContent = 'Next';"
  ]);
  assert.deepEqual(texts(d), [['Next', 'polite']]);
  assert.deepEqual(findings(d), []);
});

test('a change made in the same task as the scan is read', async () => {
  const d = await page('<div id="s" role="status"></div>');
  d.window.document.getElementById('s').textContent = 'Now';
  assert.deepEqual(texts(d), [['Now', 'polite']]);
});

test('a long text is cut at 300 characters, and the lists stop at their limit and count the rest', async () => {
  const d = await page('<div id="s" role="status"></div>');
  const s = d.window.document.getElementById('s');
  s.textContent = 'a'.repeat(400);
  assert.equal(getAnnouncements(d.window)[0].text.length, 300);
  // Each read hands the pending change to the hook, so each counts.
  for (let i = 0; i < MAX_ENTRIES + 5; i++) {
    s.textContent = 'n' + i;
    readLiveRegionHook(d.window);
  }
  const read = readLiveRegionHook(d.window);
  assert.equal(read.announcements.length, MAX_ENTRIES);
  assert.equal(read.dropped.announcements, 6);
});

test('only the first copy installed counts', async () => {
  const d = dom('<div id="s" role="status"></div>');
  d.window.eval(liveRegionHookScript());
  const registry = d.window[KEY];
  d.window.eval(liveRegionHookScript({ early: true }));
  assert.equal(d.window[KEY], registry);
});

test('a hook installed after the page loaded is late unless the caller says early', async () => {
  const late = dom('<div id="s" role="status"></div>');
  await loaded(late);
  late.window.eval(liveRegionHookScript());
  late.window.document.getElementById('s').textContent = 'Saved';
  assert.equal(readLiveRegionHook(late.window).early, false);
  assert.deepEqual(texts(late), [['Saved', 'polite']]);
  assert.equal(scan(late).environment.liveRegionHook, 'late');

  const early = dom('<div id="s" role="status"></div>');
  await loaded(early);
  early.window.eval(liveRegionHookScript({ early: true }));
  assert.equal(scan(early).environment.liveRegionHook, 'early');
});

test('a registry the hook did not make is ignored, and the lists read are copies', async () => {
  const forged = dom('');
  Object.defineProperty(forged.window, KEY, {
    value: { version: 1, early: true, announcements: [{ text: 'x' }], findings: [] }
  });
  assert.equal(readLiveRegionHook(forged.window), null, 'not frozen');

  const wrong = dom('');
  Object.defineProperty(wrong.window, KEY, {
    value: Object.freeze({ version: 2, announcements: [], findings: [] })
  });
  assert.equal(readLiveRegionHook(wrong.window), null, 'another version');

  let ran = false;
  const getter = dom('');
  const entry = {};
  Object.defineProperty(entry, 'text', {
    get() {
      ran = true;
      return 'y';
    }
  });
  Object.defineProperty(getter.window, KEY, {
    value: Object.freeze({ version: 1, early: true, announcements: [entry], findings: [] })
  });
  assert.deepEqual(readLiveRegionHook(getter.window).announcements, []);
  assert.equal(ran, false, 'no getter ran');

  const d = await page(
    '<div id="s" role="status"></div>',
    "document.getElementById('s').textContent = 'A';"
  );
  getAnnouncements(d.window).length = 0;
  assert.deepEqual(texts(d), [['A', 'polite']]);
});

test(`${RULE_ID}: the hook's findings are asked about on the region`, async () => {
  const d = await page('<div id="w"></div><div id="h" role="status" hidden></div>', [
    'document.getElementById(\'w\').innerHTML = \'<div id="t" role="status">Saved</div>\';',
    "const h = document.getElementById('h'); h.hidden = false; h.textContent = 'Shown';"
  ]);
  const { rule } = scan(d);
  assert.equal(rule.outcome, 'cantTell');
  assert.deepEqual(
    rule.occurrences.map((o) => [o.selector, o.data.details]),
    [
      [
        '#t',
        { reasonCode: 'LIVE_REGION_INSERTED_WITH_CONTENT', politeness: 'polite', text: 'Saved' }
      ],
      ['#h', { reasonCode: 'LIVE_REGION_SHOWN_AND_FILLED', politeness: 'polite', text: 'Shown' }]
    ]
  );
  assert.equal(
    rule.occurrences[0].i18n.summaryKey,
    'liveRegionAnnouncements_summary_cantTell_inserted'
  );
  assert.deepEqual(rule.occurrences[0].i18n.params, { text: 'Saved' });
});

test(`${RULE_ID}: a region no longer on the page is reported on the document, once per text`, async () => {
  const toast =
    "const t = document.createElement('div'); t.setAttribute('role', 'status'); t.className = 'toast'; t.textContent = 'Copied'; document.querySelector('main').append(t);";
  const d = await page('', [
    toast,
    "document.querySelector('.toast').remove();",
    toast,
    "document.querySelector('.toast').remove();"
  ]);
  const { rule } = scan(d);
  assert.equal(rule.occurrences.length, 1);
  assert.equal(rule.occurrences[0].selector, 'html');
  assert.deepEqual(rule.occurrences[0].data.details, {
    reasonCode: 'LIVE_REGION_INSERTED_WITH_CONTENT',
    politeness: 'polite',
    text: 'Copied',
    removed: true,
    region: { tag: 'div', role: 'status', id: null }
  });

  // Scanning part of the page leaves it out, as it can't tell where it was.
  const part = scan(d, { contextSelector: 'main' }).rule;
  assert.equal(part.outcome, 'notApplicable');
});

test(`${RULE_ID}: a region outside the scanned part of the page is left out`, async () => {
  const d = await page('<section id="a"></section><section id="b"></section>', [
    "document.getElementById('a').innerHTML = '<div role=\"status\">In</div>';",
    "document.getElementById('b').innerHTML = '<div role=\"status\">Out</div>';"
  ]);
  const { rule } = scan(d, { contextSelector: '#a' });
  assert.deepEqual(
    rule.occurrences.map((o) => o.data.details.text),
    ['In']
  );
});

test(`${RULE_ID}: with the hook and nothing to ask, a live region passes`, async () => {
  const d = await page(
    '<div id="s" role="status"></div>',
    "document.getElementById('s').textContent = 'Saved';"
  );
  assert.equal(scan(d).rule.outcome, 'pass');
});
