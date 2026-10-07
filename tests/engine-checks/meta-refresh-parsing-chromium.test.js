'use strict';

/**
 * The meta refresh rules read the refresh time as HTML's shared declarative
 * refresh steps do (#151), checked against what Chromium does with each
 * value: ".5" is a refresh at once (time 0), "1.5.5" is one after 1 second,
 * and a leading no-break space makes the value invalid, so Chromium doesn't
 * refresh and the rules don't apply. The page is scanned with the refresh's
 * target answered by 204 No Content, which keeps the page.
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
const RULES = ['meta-refresh-timing-absent', 'meta-refresh-no-exceptions'];

// [content, whether Chromium refreshes, the rules' outcome]
const CASES = [
  ['1; url=/done', true, 'fail'],
  ['.5; url=/done', true, 'pass'],
  ['1.5.5; url=/done', true, 'fail'],
  [' 1; url=/done', false, 'notApplicable'],
  ['1x; url=/done', false, 'notApplicable']
];

const doc = (content) =>
  '<!doctype html><html lang="en"><head><title>t</title>' +
  `<meta http-equiv="refresh" content="${content}"></head><body><main>x</main></body></html>`;

test('the meta refresh rules read the time as HTML does, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  for (const [content, refreshes, outcome] of CASES) {
    await t.test(JSON.stringify(content), async () => {
      const page = await browser.newPage();
      try {
        await page.route('https://example.test/**', (route) =>
          route.request().url().endsWith('/done')
            ? route.fulfill({ contentType: 'text/html', body: '<title>done</title>' })
            : route.fulfill({ contentType: 'text/html; charset=utf-8', body: doc(content) })
        );
        await page.goto('https://example.test/start');
        await page.waitForTimeout(2500);
        assert.equal(page.url().endsWith('/done'), refreshes, 'Chromium');
      } finally {
        await page.close();
      }

      const scanned = await browser.newPage();
      try {
        await scanned.route('https://example.test/**', (route) =>
          route.request().url().endsWith('/done')
            ? route.fulfill({ status: 204, body: '' })
            : route.fulfill({ contentType: 'text/html; charset=utf-8', body: doc(content) })
        );
        await scanned.goto('https://example.test/start');
        await scanned.waitForTimeout(1500);
        await scanned.addScriptTag({ content: BUNDLE });
        const outcomes = await scanned.evaluate(
          (ids) =>
            window.a11ycore
              .runa11yCoreInPage(null, null, {}, ids)
              .checksResults.map((c) => c.outcome),
          RULES
        );
        assert.deepEqual(outcomes, [outcome, outcome]);
      } finally {
        await scanned.close();
      }
    });
  }
});
