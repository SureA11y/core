'use strict';

/**
 * Real-world component patterns (tests/patterns/), each built accessibly, in
 * the states a person meets them in: a dialog with an autocomplete open, a
 * menu scrolled with overflow: auto and with overflow: hidden, a carousel
 * between slides, a sticky header over scrolled content, a virtual list, an
 * off-canvas drawer, a table with a sticky header. No rule may fail any of
 * them: a rule that does is wrong on a common page, as the contrast rules
 * and target-size-minimum were on scrolled lists (#176, #177, #181). A
 * failure a finding explains is listed in the patterns' knownFailures until
 * it is fixed.
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

const DIR = path.join(__dirname, '../patterns');
const PATTERNS = require('../patterns/index.js');
const { knownFailures } = PATTERNS;
const ORIGIN = 'https://patterns.test/';

test('every pattern page is in the manifest', () => {
  const pages = fs.readdirSync(DIR).filter((f) => f.endsWith('.html'));
  assert.deepEqual(pages.sort(), PATTERNS.map((p) => p.file).sort());
});

test('no rule fails a real-world component pattern, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  for (const pattern of PATTERNS) {
    for (const [state, script] of Object.entries(pattern.states)) {
      await t.test(`${pattern.file}: ${state}`, async () => {
        const page = await browser.newPage({ viewport: { width: 1024, height: 700 } });
        try {
          // Served over https, so the shared style sheet is readable.
          await page.route(`${ORIGIN}**`, (route) => {
            const file = path.join(DIR, new URL(route.request().url()).pathname.slice(1));
            const found = path.dirname(file) === DIR && fs.existsSync(file);
            route.fulfill({
              status: found ? 200 : 404,
              contentType: file.endsWith('.css') ? 'text/css' : 'text/html; charset=utf-8',
              body: found ? fs.readFileSync(file) : ''
            });
          });
          await page.goto(ORIGIN + pattern.file);
          if (script) await page.evaluate(script);
          await page.evaluate(BUNDLE);
          const failed = await page.evaluate(() =>
            window.a11ycore
              .runa11yCoreInPage(location.href, null, {}, null)
              .checksResults.filter((c) => c.outcome === 'fail')
              .map((c) => ({
                ruleId: c.ruleId,
                where: c.occurrences.map((o) => o.selector).slice(0, 3)
              }))
          );
          const unexplained = failed.filter(
            (f) => !knownFailures[`${pattern.file}|${state}|${f.ruleId}`]
          );
          assert.deepEqual(unexplained, [], JSON.stringify(unexplained));
        } finally {
          await page.close();
        }
      });
    }
  }
});
