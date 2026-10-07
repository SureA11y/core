'use strict';

/**
 * Options of the wrong type (#126). Read as if they were missing, they
 * changed what a scan did without a word: a contextSelector that is an
 * element or an { include, exclude } object scanned the whole page, and a
 * wcagVersion of 2.1 (a number) targeted 2.2. A scope that is not a
 * selector now throws, as an unparseable one does; an engineOptions value
 * of the wrong type is ignored with a console.warn saying what the run
 * uses instead, as an unknown profile already was.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml, createDom } = require('./helpers/runa11yCoreOnHtml');
const { runa11yCoreInPage, runDomRulesInPage } = require('../src/core');

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body>' +
  '<main id="main"><img src="a.png" id="m1"></main><footer><img src="b.png" id="f1"></footer>' +
  '</body></html>';

function withConsole(fn) {
  const { warn } = console;
  const warned = [];
  console.warn = (m) => warned.push(String(m));
  try {
    return { value: fn(), warned };
  } finally {
    console.warn = warn;
  }
}

// One entry point, so each warning is logged once.
function scan(engineOptions, runOnly = ['img-alt-present']) {
  return withConsole(() =>
    runa11yCoreOnHtml(PAGE, { engineOptions, runOnly, entryPointParity: false })
  );
}

test('a contextSelector that is not a selector throws in both entry points', () => {
  const dom = createDom(PAGE);
  const main = dom.window.document.getElementById('main');
  for (const run of [runa11yCoreInPage, runDomRulesInPage]) {
    for (const [value, message] of [
      [main, /not an element \(<main>\)/],
      [dom.window.document.querySelectorAll('main'), /not a NodeList/],
      [{ include: ['#main'], exclude: ['footer'] }, /engineOptions\.excludeSelectors/],
      [5, /not the number 5/],
      [['#main', 5], /^contextSelector\[1\] must be a CSS selector/]
    ]) {
      assert.throws(
        () => run(null, value, {}, ['img-alt-present']),
        (err) => err.code === 'INVALID_CONTEXT_SELECTOR' && message.test(err.message),
        String(message)
      );
    }
  }
});

test('a selector, an array of them, or none still scope the scan as before', () => {
  const ids = (contextSelector) =>
    runa11yCoreOnHtml(PAGE, { contextSelector, runOnly: ['img-alt-present'] })
      .checksResults[0].occurrences.map((o) => o.selector)
      .sort();
  assert.deepEqual(ids('main'), ['#m1']);
  assert.deepEqual(ids(['main']), ['#m1']);
  assert.deepEqual(ids(null), ['#f1', '#m1']);
  assert.deepEqual(ids(''), ['#f1', '#m1']);
  assert.deepEqual(ids([]), ['#f1', '#m1']);
});

test('engineOptions.wcagVersion other than "2.0", "2.1" or "2.2" is ignored, and said so', () => {
  for (const [value, shown] of [
    [2.1, 'the number 2.1'],
    ['3.0', '"3.0"'],
    [['2.1'], 'an array']
  ]) {
    const { value: result, warned } = scan({ wcagVersion: value });
    assert.equal(result.engine.wcagVersion, '2.2');
    assert.ok(
      warned.includes(
        `[surea11y] engineOptions.wcagVersion: ignoring ${shown}; use "2.0", "2.1" or "2.2". The run targets WCAG 2.2.`
      ),
      warned.join('\n')
    );
  }
  // The version a profile implies is the one named.
  const { warned } = scan({ wcagVersion: 2, profile: 'section508' }, null);
  assert.ok(
    warned.some((w) => w.endsWith('The run targets WCAG 2.0.')),
    warned.join('\n')
  );
  // A valid version says nothing.
  const ok = scan({ wcagVersion: '2.1' });
  assert.equal(ok.value.engine.wcagVersion, '2.1');
  assert.deepEqual(ok.warned, []);
});

test('engineOptions.profile that is not a string is ignored, and said so', () => {
  const { value, warned } = scan({ profile: 5 });
  assert.equal(value.engine.profile, undefined);
  assert.deepEqual(warned, [
    '[surea11y] engineOptions.profile: ignoring the number 5; name a profile with a string, such as "wcag22-aa". No profile was applied.'
  ]);
});

test('engineOptions.timestamp that is not a string is ignored, and said so', () => {
  for (const [value, shown] of [
    [new Date('2026-10-07T00:00:00Z'), 'a Date'],
    [1791331200000, 'the number 1791331200000']
  ]) {
    const { value: result, warned } = scan({ timestamp: value });
    assert.equal(result.timestamp, null);
    assert.deepEqual(warned, [
      `[surea11y] engineOptions.timestamp: ignoring ${shown}; pass a string, such as new Date().toISOString(). The result's timestamp is null.`
    ]);
  }
  const { value: result, warned } = scan({ timestamp: '2026-10-07T00:00:00Z' });
  assert.equal(result.timestamp, '2026-10-07T00:00:00Z');
  assert.deepEqual(warned, []);
});

test("a pageUrl that is not a string is ignored, and the document's URL is used", () => {
  createDom(PAGE, { url: 'https://example.test/page' });
  for (const run of [runa11yCoreInPage, runDomRulesInPage]) {
    const { value, warned } = withConsole(() => run({}, null, {}, ['img-alt-present']));
    assert.equal(value.url, 'https://example.test/page');
    assert.deepEqual(warned, [
      "[surea11y] pageUrl: ignoring an object; pass a string. The result's url is the document's."
    ]);
    const named = withConsole(() =>
      run('https://example.test/named', null, {}, ['img-alt-present'])
    );
    assert.equal(named.value.url, 'https://example.test/named');
    assert.deepEqual(named.warned, []);
  }
});

test('the optInRules warning lists the opt-in rule tags there are', () => {
  const { warned } = scan({ optInRules: ['nope'] });
  assert.deepEqual(warned, [
    '[surea11y] engineOptions.optInRules: ignoring "nope", no such opt-in rule tag (use "all" or one of: rgaa).'
  ]);
});
