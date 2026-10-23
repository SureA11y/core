'use strict';

// The browser bundle's console helpers (src/core/console-helpers.js):
// a11ycore.version, run(), table(), inspect()'s lists, clearHighlights() and
// openReport(), loaded with a real <script src> as a person would from a
// page. highlight() and inspect()'s drawing need a layout and are covered in
// Chromium
// (tests/engine-checks/browser-console-helpers-chromium.test.js).

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const BUNDLE_URL = pathToFileURL(path.join(ROOT, 'surea11y.browser.js')).href;
const PAGE =
  '<!doctype html><html lang="en"><head><title>T</title></head><body><main>' +
  '<img src="x.png"><button></button><div id="part"><img src="y.png" alt=""><a href="#">Go</a></div>' +
  '</main></body></html>';

// Values made in the page's realm, as plain Node values to compare.
const plain = (v) => JSON.parse(JSON.stringify(v));

function load(html = PAGE) {
  return new Promise((resolve, reject) => {
    const dom = new JSDOM(html.replace('</body>', `<script src="${BUNDLE_URL}"></script></body>`), {
      url: 'https://example.test/',
      runScripts: 'dangerously',
      resources: 'usable'
    });
    dom.window.addEventListener('load', () => resolve(dom));
    dom.window.addEventListener('error', (e) => reject(e.error || new Error('error event')));
  });
}

test('a11ycore.version is the published version', async () => {
  const dom = await load();
  assert.equal(dom.window.a11ycore.version, require('../package.json').version);
  dom.window.close();
});

test('run() scans the page and resolves to the result', async () => {
  const dom = await load();
  const result = await dom.window.a11ycore.run();
  assert.equal(result.url, 'https://example.test/');
  assert.equal(result.checksResults.find((c) => c.ruleId === 'img-alt-present').outcome, 'fail');
  dom.window.close();
});

test('run() takes engine options, context and runOnly', async () => {
  const dom = await load();
  const result = await dom.window.a11ycore.run({
    locale: 'fr',
    context: '#part',
    runOnly: ['img-alt-present', 'link-name-present']
  });
  assert.deepEqual(plain(result.checksResults.map((c) => c.ruleId).sort()), [
    'img-alt-present',
    'link-name-present'
  ]);
  // Only #part was scanned: its image has alt="", so nothing fails there.
  assert.equal(result.checksResults.find((c) => c.ruleId === 'img-alt-present').outcome, 'pass');
  assert.equal(result.engine.locale.requested, 'fr');
  dom.window.close();
});

test('table() lists fail and cantTell occurrences worst first, and prints them', async () => {
  const dom = await load();
  const printed = [];
  dom.window.console.table = (rows) => printed.push(rows);
  const result = await dom.window.a11ycore.run();
  const rows = dom.window.a11ycore.table(result);
  assert.equal(printed.length, 1);
  assert.deepEqual(plain(printed[0]), plain(rows));
  assert.ok(rows.length >= 2);
  const rank = { fail: 0, cantTell: 1 };
  const sev = { critical: 0, serious: 1, moderate: 2, minor: 3 };
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1];
    const b = rows[i];
    assert.ok(
      rank[a.outcome] < rank[b.outcome] ||
        (rank[a.outcome] === rank[b.outcome] && (sev[a.severity] ?? 9) <= (sev[b.severity] ?? 9)),
      `${a.rule} before ${b.rule}`
    );
  }
  const img = rows.find((r) => r.rule === 'img-alt-present');
  assert.deepEqual(plain(Object.keys(img)), ['outcome', 'severity', 'rule', 'element', 'summary']);
  assert.equal(img.outcome, 'fail');
  assert.match(img.element, /img/);
  assert.ok(img.summary);
  dom.window.close();
});

test('table(result, { all: true }) adds the rules that passed or did not apply', async () => {
  const dom = await load();
  dom.window.console.table = () => {};
  const result = await dom.window.a11ycore.run({ runOnly: ['img-alt-present', 'video-caption'] });
  const rows = dom.window.a11ycore.table(result, { all: true });
  assert.deepEqual(plain(rows.map((r) => [r.rule, r.outcome])), [
    ['img-alt-present', 'fail'],
    ['video-caption', 'notApplicable']
  ]);
  dom.window.close();
});

test('run() takes runOnly in any form the scan takes, and the engine checks it', async () => {
  const dom = await load();
  const { a11ycore } = dom.window;
  // A WCAG 2.2 Level A target: img-alt-present (1.1.1, A) runs, the AA
  // contrast rule doesn't.
  const levelA = await a11ycore.run({ runOnly: { wcag: { version: '2.2', level: 'A' } } });
  const ids = plain(levelA.checksResults.map((c) => c.ruleId));
  assert.ok(ids.includes('img-alt-present'));
  assert.ok(!ids.includes('contrast-minimum'));
  const named = await a11ycore.run({ runOnly: ['img-alt-present'] });
  assert.deepEqual(plain(named.checksResults.map((c) => c.ruleId)), ['img-alt-present']);
  await assert.rejects(
    a11ycore.run({ runOnly: ['no-such-rule'] }),
    (err) => err.code === 'INVALID_RUN_ONLY'
  );
  dom.window.close();
});

test('run() refuses options that would quietly run every rule', async () => {
  const dom = await load();
  const { a11ycore } = dom.window;
  await assert.rejects(
    a11ycore.run(['img-alt-present']),
    /^TypeError: run: options must be an object, not a list\. .*runOnly/
  );
  await assert.rejects(a11ycore.run('img-alt-present'), /not string\./);
  for (const key of ['wcag', 'bestPractices', 'includeRuleIds']) {
    await assert.rejects(
      a11ycore.run({ [key]: ['x'] }),
      new RegExp(`^TypeError: run: ${key} is part of the selection, which goes under runOnly`)
    );
  }
  // tags and profile are engine options as well.
  const tagged = await a11ycore.run({ tags: ['wcag111'], profile: 'wcag22-aa' });
  assert.ok(tagged.checksResults.length);
  dom.window.close();
});

test('inspect() lists headings and the focus order, leaves hidden elements out, and refuses an unknown kind', async () => {
  const dom = await load(
    '<!doctype html><html lang="en"><head><title>T</title></head><body><main>' +
      '<h1>Shop</h1><h2 hidden>Gone</h2><div role="heading" aria-level="4">Deals</div>' +
      '<a id="a" href="#">One</a><button id="b" tabindex="1">Two</button><a href="#" hidden>Hidden</a>' +
      '</main></body></html>'
  );
  const { a11ycore } = dom.window;
  const headings = await a11ycore.inspect('headings', { draw: false });
  assert.deepEqual(plain(headings.map((h) => [h.level, h.name])), [
    [1, 'Shop'],
    [4, 'Deals']
  ]);
  const order = await a11ycore.inspect('focus-order', { draw: false });
  assert.deepEqual(plain(order.map((o) => [o.order, o.element, o.name])), [
    [1, '#b', 'Two'],
    [2, '#a', 'One']
  ]);
  await assert.rejects(
    a11ycore.inspect('colours'),
    /inspect: kind must be one of headings, landmarks, names, focus-order/
  );
  dom.window.close();
});

test("inspect('names') gives the roles and names the rules use", async () => {
  const dom = await load(
    '<!doctype html><html lang="en"><head><title>T</title></head><body><main>' +
      '<input type="button" value="Add"><input type="submit"><input type="reset"><input type="button">' +
      '<select multiple aria-label="A"><option>a</option></select>' +
      '<select size="3" aria-label="B"><option>b</option></select>' +
      '<select aria-label="C"><option>c</option></select>' +
      '<table role="grid"><tr><td tabindex="0">Cell</td></tr></table>' +
      '</main></body></html>'
  );
  const rows = await dom.window.a11ycore.inspect('names', { draw: false });
  assert.deepEqual(plain(rows.map((r) => [r.role, r.name])), [
    ['button', 'Add'],
    ['button', 'Submit'],
    ['button', 'Reset'],
    ['button', ''],
    ['listbox', 'A'],
    ['listbox', 'B'],
    ['combobox', 'C'],
    ['gridcell', 'Cell']
  ]);
  dom.window.close();
});

test('clearHighlights() is safe with nothing drawn, and run() clears what highlight() drew', async () => {
  const dom = await load();
  const { a11ycore, document } = dom.window;
  a11ycore.clearHighlights();
  const host = document.createElement('div');
  host.setAttribute('data-surea11y-highlights', '');
  document.documentElement.appendChild(host);
  await a11ycore.run({ runOnly: ['img-alt-present'] });
  assert.equal(document.querySelector('[data-surea11y-highlights]'), null);
  dom.window.close();
});

test('openReport() loads surea11y.report.js from beside the bundle and opens the report', async () => {
  const dom = await load();
  const { window } = dom;
  const blobs = [];
  window.URL.createObjectURL = (blob) => {
    blobs.push(blob);
    return 'blob:https://example.test/report';
  };
  const opened = [];
  window.open = (url, target) => {
    opened.push([url, target]);
    return {};
  };
  const result = await window.a11ycore.run();
  const url = await window.a11ycore.openReport(result, { report: { title: 'Home' } });
  assert.equal(url, 'blob:https://example.test/report');
  assert.deepEqual(plain(opened), [['blob:https://example.test/report', '_blank']]);
  const html = await blobs[0].text();
  assert.match(html, /<title>Home — /);
  assert.match(html, /img-alt-present/);
  // The script tag it added to load the report is gone again.
  assert.equal(window.document.querySelectorAll('script[src$="surea11y.report.js"]').length, 0);
  assert.equal(typeof window.a11ycoreReport.renderHtmlReport, 'function');
  dom.window.close();
});

test('openReport() logs the address when no tab can be opened', async () => {
  const dom = await load();
  const { window } = dom;
  window.URL.createObjectURL = () => 'blob:x';
  window.open = () => null;
  const logged = [];
  window.console.info = (m) => logged.push(m);
  await window.a11ycore.openReport(await window.a11ycore.run({ runOnly: ['img-alt-present'] }));
  assert.match(logged[0], /blob:x/);
  dom.window.close();
});

test('openReport() says what to do when the report file cannot be found', async () => {
  const dom = await load();
  const { window } = dom;
  const result = await window.a11ycore.run({ runOnly: ['img-alt-present'] });
  await assert.rejects(
    window.a11ycore.openReport(result, { reportScript: 'https://example.test/missing.js' }),
    /could not load https:\/\/example\.test\/missing\.js/
  );
  dom.window.close();
});
