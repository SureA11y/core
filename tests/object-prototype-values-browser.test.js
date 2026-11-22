'use strict';

// In Chromium, where the page and the engine share Object.prototype: a value
// a page's script put there changes no scan, and the scan never touches it,
// so the page's own code that runs during the scan (a focus handler) sees it
// as it is (round 12, A12-1, A12-3, R12F-1, R12F-2, R12F-5, R12F-6). The
// jsdom side is in object-prototype-values.test.js.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { chromium, executablePath, skip } = require('./helpers/chromium');

const BUNDLE = fs.readFileSync(path.join(__dirname, '..', 'surea11y.browser.js'), 'utf8');

const BODY =
  '<main><h1>t</h1><div aria-hidden="true"><a href="#x">link</a></div>' +
  '<a href="#y" style="opacity:0">hidden link</a><button>ok</button>' +
  '<img src="a.png"><img src="b.png"></main>';
// The page's script runs first, then the bundle, as a page loads it.
const pageHtml = (script, body = BODY) =>
  '<!doctype html><html lang="en"><head><title>t</title>' +
  `<script>${script}</script><script src="/surea11y.browser.js"></script>` +
  `</head><body>${body}</body></html>`;

// Text whose contrast depends on the color scheme the page is drawn in.
const CONTRAST_BODY =
  '<style>:root { color-scheme: light dark }</style><main><h1>t</h1>' +
  '<p style="color:#767676">grey text</p><p style="color:#000">black text</p>' +
  '<p style="color:#555;background:#fff">on white</p><a href="#y" style="opacity:0">hidden</a></main>';

// What a scan found, rule by rule, and whether a rule stopped on an error.
const brief = () => {
  const r = window.a11ycore.runa11yCoreInPage(location.href, null, {}, null);
  return r.checksResults.map((c) => [
    c.ruleId,
    c.outcome,
    (c.occurrences || []).length,
    Object.prototype.hasOwnProperty.call(c, 'error') ? String(c.error) : null
  ]);
};

test('a value on Object.prototype in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function withPage(script, fn, body) {
    const page = await browser.newPage();
    try {
      await page.route('https://example.test/**', (route) =>
        route.request().url().endsWith('.js')
          ? route.fulfill({ contentType: 'text/javascript', body: BUNDLE })
          : route.fulfill({ contentType: 'text/html', body: pageHtml(script, body) })
      );
      await page.goto('https://example.test/');
      return await fn(page);
    } finally {
      await page.close();
    }
  }
  const clean = await withPage('', (page) => page.evaluate(brief));
  assert.ok(clean.some(([id, outcome]) => id === 'img-alt-present' && outcome === 'fail'));

  await t.test('a focus handler reads its value while rules move focus (R12F-1)', async () => {
    const script =
      'Object.prototype.cfg = { x: 1 }; window.seen = []; window.errors = [];' +
      "document.addEventListener('focusin', () => { try { seen.push(({}).cfg.x); } catch (e) { errors.push(String(e)); } }, true);";
    const got = await withPage(script, (page) =>
      page.evaluate(() => {
        window.a11ycore.runa11yCoreInPage(location.href, null, {}, [
          'aria-hidden-focus',
          'css-hidden-focus'
        ]);
        return { seen: window.seen, errors: window.errors };
      })
    );
    assert.ok(got.seen.length > 0);
    assert.deepEqual(got.errors, []);
    assert.ok(got.seen.every((x) => x === 1));
  });

  await t.test(
    'values a handler puts there during the scan change no result (R12F-5)',
    async () => {
      const script =
        "document.addEventListener('focusin', () => { Object.prototype.occurrenceOutcome = 'pass'; Object.prototype.outcome = 'pass'; }, true);";
      const got = await withPage(script, (page) => page.evaluate(brief));
      assert.deepEqual(got, clean);
    }
  );

  // Each one, not configurable, could be neither taken off nor put back.
  for (const [name, script] of [
    [
      'read-only type (A12-3, R12F-6)',
      "Object.defineProperty(Object.prototype, 'type', { value: 'manual' });"
    ],
    [
      'read-only profile (A12-3, R12F-6)',
      "Object.defineProperty(Object.prototype, 'profile', { value: 'wcag20-a' });"
    ],
    [
      'read-only occurrenceOutcome (A12-1, R12F-6)',
      "Object.defineProperty(Object.prototype, 'occurrenceOutcome', { value: 'pass' });"
    ],
    [
      'a value on a non-extensible Object.prototype (R12F-2)',
      "Object.prototype.flag = 'on'; Object.preventExtensions(Object.prototype);"
    ],
    [
      'a value on a frozen Object.prototype (R12F-6)',
      "Object.prototype.flag = 'on'; Object.freeze(Object.prototype);"
    ]
  ]) {
    await t.test(`${name} scans as without it, and stays`, async () => {
      const got = await withPage(script, (page) =>
        page.evaluate((b) => {
          const before = Object.getOwnPropertyNames(Object.prototype).join();
          const result = new Function('return (' + b + ')()')();
          return {
            result,
            same: Object.getOwnPropertyNames(Object.prototype).join() === before,
            flag: {}.flag
          };
        }, brief.toString())
      );
      assert.deepEqual(got.result, clean);
      assert.ok(got.same);
      if (/flag/.test(script)) assert.equal(got.flag, 'on');
    });
  }
  // The contrast helpers build their own option objects without colorScheme
  // or rootCanvasFallbackSet, and read neither from Object.prototype
  // (R12F-6).
  const cleanContrast = await withPage('', (page) => page.evaluate(brief), CONTRAST_BODY);
  assert.ok(cleanContrast.some(([id, outcome]) => id === 'contrast-minimum' && outcome === 'fail'));
  for (const [name, script] of [
    ['a plain colorScheme', "Object.prototype.colorScheme = 'dark';"],
    [
      'a read-only colorScheme',
      "Object.defineProperty(Object.prototype, 'colorScheme', { value: 'dark' });"
    ],
    ['a plain rootCanvasFallbackSet', 'Object.prototype.rootCanvasFallbackSet = true;'],
    [
      'a read-only rootCanvasFallbackSet',
      "Object.defineProperty(Object.prototype, 'rootCanvasFallbackSet', { value: true });"
    ]
  ]) {
    await t.test(`${name} changes no contrast result (R12F-6)`, async () => {
      const got = await withPage(script, (page) => page.evaluate(brief), CONTRAST_BODY);
      assert.deepEqual(got, cleanContrast);
    });
  }
  // The engine's own keys, set on an occurrence (__node) or a cache the
  // rules share: a read-only value of that name on Object.prototype refuses
  // none, so no rule stops on an error (R12F-6).
  for (const key of [
    '__node',
    '__a11ycoreSharedCache',
    '__contrastSharedCache',
    '__pseudo',
    '__elBgCache',
    '__elFgCache',
    '__elBlockerCache',
    '__textScanCache',
    '__colorParseCache',
    '__signRunBudget',
    '__overlapIndex'
  ]) {
    await t.test(`a read-only ${key} stops no rule (R12F-6)`, async () => {
      const script = `Object.defineProperty(Object.prototype, '${key}', { value: null });`;
      assert.deepEqual(await withPage(script, (page) => page.evaluate(brief)), clean);
      assert.deepEqual(
        await withPage(script, (page) => page.evaluate(brief), CONTRAST_BODY),
        cleanContrast
      );
    });
  }
});
