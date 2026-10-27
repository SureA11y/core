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

// An alert stays an alert with aria-live beside it; aria-live="off" turns it
// off. Before, any aria-live made it a region added with its text.
test('an alert added with its text is announced whatever aria-live says, unless it is off', async () => {
  const d = await page('<div id="w"></div>', [
    "document.getElementById('w').insertAdjacentHTML('beforeend', '<div role=\"alert\" aria-live=\"assertive\">Payment failed</div>');",
    "document.getElementById('w').insertAdjacentHTML('beforeend', '<div role=\"alert\" aria-live=\"polite\">Saved with warnings</div>');",
    "document.getElementById('w').insertAdjacentHTML('beforeend', '<div role=\"alert\" aria-live=\"off\">Quiet</div>');"
  ]);
  assert.deepEqual(findings(d), []);
  assert.deepEqual(texts(d), [
    ['Payment failed', 'assertive'],
    ['Saved with warnings', 'polite']
  ]);
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

test('a region shown because its dialog or details opened counts from its next text', async () => {
  const d = await page(
    '<dialog id="d"><div id="i" role="status"></div></dialog>' +
      '<dialog id="e"><div id="j" role="status"></div></dialog>' +
      '<details id="t"><summary>More</summary><div id="k" role="status" hidden></div></details>' +
      '<dialog id="f"><div id="h" role="status" hidden></div></dialog>',
    [
      "document.getElementById('d').setAttribute('open', '');",
      "document.getElementById('i').textContent = 'In the dialog';",
      // Given its text while hidden, then shown by the dialog: not recorded.
      "document.getElementById('j').textContent = 'Before'; document.getElementById('e').setAttribute('open', ''); ",
      // Then given text: announced.
      "document.getElementById('j').textContent = 'After';",
      // Its own [hidden] still hides it: shown and filled at once after.
      "document.getElementById('f').setAttribute('open', '');",
      "const h = document.getElementById('h'); h.hidden = false; h.textContent = 'Together';"
    ]
  );
  assert.deepEqual(texts(d), [
    ['In the dialog', 'polite'],
    ['After', 'polite']
  ]);
  assert.deepEqual(findings(d), [['LIVE_REGION_SHOWN_AND_FILLED', 'Together']]);
});

test('the last time each dialog was opened is recorded, in the order of the page’s changes', async () => {
  const d = await page(
    '<div id="s" role="status"></div><dialog id="d"></dialog><dialog id="e"></dialog>',
    [
      "document.getElementById('d').setAttribute('open', '');",
      "document.getElementById('s').textContent = 'One';",
      "document.getElementById('e').setAttribute('open', ''); document.getElementById('d').removeAttribute('open');",
      "document.getElementById('s').textContent = 'Two'; document.getElementById('d').setAttribute('open', '');"
    ]
  );
  const read = readLiveRegionHook(d.window);
  const opened = read.dialogsOpened.map((o) => [o.element.id, o.order]);
  assert.deepEqual(
    opened.map(([id]) => id),
    ['e', 'd']
  );
  const at = (text) => read.announcements.find((a) => a.text === text).order;
  const [[, e], [, dAgain]] = opened;
  assert.ok(at('One') < e, 'One came before e opened');
  assert.ok(e < at('Two') && at('Two') < dAgain, 'Two came after e opened, before d opened again');
  assert.equal(typeof read.dialogsOpened[0].time, 'number');
  assert.equal(read.dropped.dialogsOpened, 0);
});

test('a text given to a region behind an open modal dialog is left out, or kept marked on request', async () => {
  // jsdom has no top layer: an open dialog with aria-modal="true" stands in
  // for one opened with showModal().
  const d = await page(
    '<div id="b" role="status"></div><dialog id="d" aria-modal="true"><div id="i" role="status"></div></dialog>',
    [
      "document.getElementById('b').textContent = 'Before'; document.getElementById('d').setAttribute('open', '');",
      "document.getElementById('i').textContent = 'Inside';",
      "document.getElementById('b').textContent = 'Behind';",
      "document.getElementById('d').removeAttribute('open');",
      "document.getElementById('b').textContent = 'Closed';"
    ]
  );
  assert.deepEqual(
    getAnnouncements(d.window).map((a) => a.text),
    ['Before', 'Inside', 'Closed']
  );
  assert.deepEqual(
    getAnnouncements(d.window, { includeBehindModal: true }).map((a) => [a.text, a.behindModal]),
    [
      ['Before', false],
      ['Inside', false],
      ['Behind', true],
      ['Closed', false]
    ]
  );
  assert.equal(getAnnouncements(d.window, { includeBehindModal: false }).length, 3);
  assert.throws(() => getAnnouncements(d.window, { behindModal: true }), TypeError);
  assert.throws(() => getAnnouncements(d.window, { includeBehindModal: 'yes' }), TypeError);
  assert.throws(() => getAnnouncements(d.window, 'all'), TypeError);

  // Serialized into the page, as a binding does, and run there on the
  // page's own window, with or without options.
  const inPage = d.window.eval(`(${getAnnouncements.toString()})`);
  assert.deepEqual(
    Array.from(inPage(), (a) => a.text),
    ['Before', 'Inside', 'Closed']
  );
  assert.deepEqual(
    Array.from(inPage({ includeBehindModal: true }), (a) => a.text),
    ['Before', 'Inside', 'Behind', 'Closed']
  );
});

test('getAnnouncements({ selectors: true }) names each region by a selector, so the list crosses a driver', async () => {
  const d = await page(
    '<div id="status" aria-live="polite"></div>' +
      '<ul><li><div role="status"></div></li><li><div role="status"></div></li></ul>' +
      '<section><div id="dup" role="log"></div><div id="dup" role="log"></div></section>' +
      '<form><input name="parentElement"><input name="id"><div role="alert" aria-live="polite"></div></form>' +
      '<div id="gone" aria-live="polite"></div>',
    [
      "document.getElementById('status').textContent = 'Saved';",
      "document.querySelectorAll('li [role=status]')[1].textContent = 'Second';",
      "document.querySelectorAll('[role=log]')[1].textContent = 'Logged';",
      "document.querySelector('form [role=alert]').textContent = 'Sent';",
      "document.getElementById('gone').textContent = 'Bye';",
      "document.getElementById('gone').remove();"
    ]
  );
  // As a binding runs it: serialized into the page, its answer copied out
  // through JSON, as a driver's serialization boundary does.
  const inPage = d.window.eval(`(${getAnnouncements.toString()})`);
  const listed = JSON.parse(JSON.stringify(inPage({ selectors: true })));
  assert.deepEqual(
    listed.map((a) => [a.text, a.selector]),
    [
      ['Saved', '#status'],
      [
        'Second',
        'html > body:nth-of-type(1) > main:nth-of-type(1) > ul:nth-of-type(1) > li:nth-of-type(2) > div:nth-of-type(1)'
      ],
      [
        'Logged',
        'html > body:nth-of-type(1) > main:nth-of-type(1) > section:nth-of-type(1) > div:nth-of-type(2)'
      ],
      [
        'Sent',
        'html > body:nth-of-type(1) > main:nth-of-type(1) > form:nth-of-type(1) > div:nth-of-type(1)'
      ],
      ['Bye', null]
    ]
  );
  // Each selector finds its region; no entry holds an element.
  const regions = getAnnouncements(d.window);
  listed.forEach((a, i) => {
    assert.ok(!('element' in a));
    if (a.selector) assert.equal(d.window.document.querySelector(a.selector), regions[i].element);
  });
  // The other fields are those of the plain list.
  const without = (key) => (a) => Object.fromEntries(Object.entries(a).filter(([k]) => k !== key));
  assert.deepEqual(
    listed.map(without('selector')),
    JSON.parse(JSON.stringify(regions.map(without('element'))))
  );
  assert.throws(() => getAnnouncements(d.window, { selectors: 'yes' }), TypeError);
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
