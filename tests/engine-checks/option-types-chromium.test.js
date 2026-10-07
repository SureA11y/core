'use strict';

/**
 * Options of the wrong type, in a real browser (#126). A contextSelector
 * that is an element or an { include, exclude } object scanned the whole
 * page; it now throws INVALID_CONTEXT_SELECTOR, and the message, which is
 * all that crosses page.evaluate, names what was passed. The cross-frame
 * scan rejects with the same error. An engineOptions value of the wrong
 * type is ignored with a console.warn.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  chromium = null;
}

function findExecutable() {
  if (!chromium) return null;
  const candidates = [];
  try {
    candidates.push(chromium.executablePath());
  } catch {}
  if (process.env.CHROMIUM_EXECUTABLE_PATH) candidates.push(process.env.CHROMIUM_EXECUTABLE_PATH);
  return candidates.find((p) => p && fs.existsSync(p)) || null;
}

const executablePath = findExecutable();
const skip = !chromium
  ? 'playwright not installed'
  : !executablePath
    ? 'no Chromium build found (set CHROMIUM_EXECUTABLE_PATH)'
    : false;

const BUNDLE = fs.readFileSync(path.join(__dirname, '../../surea11y.browser.js'), 'utf8');

// The cross-frame pair is not in the browser bundle; the in-page chunk of
// core.js carries it (see tests/core/frame-scan.test.js).
const CORE = fs.readFileSync(path.join(__dirname, '../../src/core.js'), 'utf8');
const CROSS_FRAME_CHUNK = CORE.slice(
  CORE.indexOf('// SELF-CONTAINED in-page runner'),
  CORE.indexOf('module.exports = {', CORE.indexOf('// SELF-CONTAINED in-page runner'))
);

test('options of the wrong type are not read as missing, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const page = await browser.newPage();
  t.after(() => page.close());
  const warnings = [];
  page.on('console', (m) => {
    if (m.type() === 'warning') warnings.push(m.text());
  });
  await page.setContent(
    '<!doctype html><html lang="en"><head><title>t</title></head><body>' +
      '<main id="main"><img src="data:," id="m1"></main><footer><img src="data:," id="f1"></footer>' +
      '</body></html>'
  );
  await page.addScriptTag({ content: BUNDLE });

  await t.test('an element as the scope throws, naming it', async () => {
    await assert.rejects(
      page.evaluate(() =>
        window.a11ycore.runa11yCoreInPage(null, document.getElementById('main'), {}, [
          'img-alt-present'
        ])
      ),
      /contextSelector must be a CSS selector or an array of them, not an element \(<main>\)/
    );
  });

  await t.test('an { include, exclude } object throws, pointing to excludeSelectors', async () => {
    const code = await page.evaluate(() => {
      try {
        window.a11ycore.runa11yCoreInPage(null, { include: ['main'], exclude: ['footer'] }, {}, [
          'img-alt-present'
        ]);
        return null;
      } catch (e) {
        return e.code + ': ' + e.message;
      }
    });
    assert.match(code, /^INVALID_CONTEXT_SELECTOR: .*engineOptions\.excludeSelectors/);
  });

  await t.test('the cross-frame scan rejects with the same error', async () => {
    await page.addScriptTag({ content: CROSS_FRAME_CHUNK });
    const code = await page.evaluate(() =>
      window
        .runa11yCoreAcrossFrames(null, [document.getElementById('main')], {}, ['img-alt-present'])
        .then(
          () => null,
          (e) => e.code + ': ' + e.message
        )
    );
    assert.equal(
      code,
      'INVALID_CONTEXT_SELECTOR: contextSelector[0] must be a CSS selector, not an element (<main>).'
    );
  });

  await t.test('a selector still scopes the scan', async () => {
    const selectors = await page.evaluate(() =>
      window.a11ycore
        .runa11yCoreInPage(null, 'main', {}, ['img-alt-present'])
        .checksResults[0].occurrences.map((o) => o.selector)
    );
    assert.deepEqual(selectors, ['#m1']);
  });

  await t.test('a wcagVersion of the wrong type is ignored, and said so', async () => {
    warnings.length = 0;
    const version = await page.evaluate(
      () =>
        window.a11ycore.runa11yCoreInPage(null, null, { wcagVersion: 2.1 }, ['img-alt-present'])
          .engine.wcagVersion
    );
    assert.equal(version, '2.2');
    assert.deepEqual(warnings, [
      '[surea11y] engineOptions.wcagVersion: ignoring the number 2.1; use "2.0", "2.1" or "2.2". The run targets WCAG 2.2.'
    ]);
  });
});
