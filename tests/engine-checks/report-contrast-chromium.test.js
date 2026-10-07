'use strict';

/**
 * The HTML report checked by the engine's own contrast rules, in a real
 * browser, in light and dark mode (#137). Its pass and fail chips were
 * below 4.5:1, and in dark mode its headings and scorecard digits kept
 * colors meant for a light page.
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
const { renderHtmlReport } = require('../../src/report.js');
const { runa11yCoreOnHtml } = require('../helpers/runa11yCoreOnHtml');

test('the HTML report meets contrast in light and dark mode, in Chromium', { skip }, async (t) => {
  const result = runa11yCoreOnHtml(
    fs.readFileSync(path.join(__dirname, '../fixtures/img-alt-present-all-scenarios.html'), 'utf8')
  );
  const html = renderHtmlReport(result);
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  for (const colorScheme of ['light', 'dark']) {
    await t.test(colorScheme, async () => {
      const page = await browser.newPage({ colorScheme, viewport: { width: 1280, height: 900 } });
      try {
        await page.setContent(html);
        await page.evaluate(() =>
          document.querySelectorAll('details').forEach((d) => (d.open = true))
        );
        await page.addScriptTag({ content: BUNDLE });
        const check = await page.evaluate(
          () =>
            window.a11ycore.runa11yCoreInPage(null, null, {}, ['contrast-minimum']).checksResults[0]
        );
        assert.equal(check.outcome, 'pass', check.occurrences.map((o) => o.selector).join('\n'));
      } finally {
        await page.close();
      }
    });
  }
});
