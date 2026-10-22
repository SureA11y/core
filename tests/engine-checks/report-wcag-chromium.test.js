'use strict';

/**
 * The HTML report checked by the engine itself, every WCAG 2.2 A and AA
 * rule, in a real browser, in light and dark mode. It began as a contrast
 * check (#137): the report's pass and fail chips were below 4.5:1, and in
 * dark mode its headings and scorecard digits kept colors meant for a light
 * page. Every <details> is opened first, so the collapsed technical data is
 * checked too.
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

const { addBundle } = require('../helpers/browserBundle');
const { renderHtmlReport } = require('../../src/report.js');
const { runa11yCoreOnHtml } = require('../helpers/runa11yCoreOnHtml');

// The WCAG 2.2 A and AA rules that fail on a report, in light and dark
// mode, after `prepare` has run in the page with every <details> open. With
// a `width`, the page is shown that wide and must not scroll sideways.
async function failuresOn(t, browser, html, prepare = () => {}, width = 1280) {
  for (const colorScheme of ['light', 'dark']) {
    await t.test(colorScheme, async () => {
      const page = await browser.newPage({ colorScheme, viewport: { width, height: 900 } });
      try {
        await page.setContent(html);
        await page.evaluate(() =>
          document.querySelectorAll('details').forEach((d) => (d.open = true))
        );
        await page.evaluate(prepare);
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        assert.ok(scrollWidth <= width, `the page is ${scrollWidth} px wide in ${width} px`);
        await addBundle(page);
        const checks = await page.evaluate(
          () =>
            window.a11ycore.runa11yCoreInPage(
              null,
              null,
              {},
              { wcag: { version: '2.2', level: 'AA' } }
            ).checksResults
        );
        assert.ok(checks.some((c) => c.ruleId === 'contrast-minimum'));
        const failed = checks
          .filter((c) => c.outcome === 'fail')
          .map((c) => c.ruleId + ': ' + c.occurrences.map((o) => o.selector).join(', '));
        assert.deepEqual(failed, []);
      } finally {
        await page.close();
      }
    });
  }
}

test(
  'the HTML report fails no WCAG 2.2 AA rule in light and dark mode, in Chromium',
  { skip },
  async (t) => {
    const result = runa11yCoreOnHtml(
      fs.readFileSync(
        path.join(__dirname, '../fixtures/img-alt-present-all-scenarios.html'),
        'utf8'
      )
    );
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    await failuresOn(t, browser, renderHtmlReport(result));
  }
);

// With no occurrence row, the findings table's headers headed no cell, and
// the report failed table-th-has-data-cells (1.3.1): on a clean scan, and
// whenever the filters hid every row.
test(
  'the HTML report fails no WCAG 2.2 AA rule when its table shows no occurrence, in Chromium',
  { skip },
  async (t) => {
    const clean = runa11yCoreOnHtml(
      '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>Hi</h1><img src="a.png" alt="A cat"></main></body></html>',
      { runOnly: { includeRuleIds: ['img-alt-present', 'page-title-present'] } }
    );
    assert.ok(clean.checksResults.every((c) => !c.occurrences.length));
    const failing = runa11yCoreOnHtml(
      fs.readFileSync(
        path.join(__dirname, '../fixtures/img-alt-present-all-scenarios.html'),
        'utf8'
      )
    );
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());

    await t.test('a clean scan', (t) => failuresOn(t, browser, renderHtmlReport(clean)));
    await t.test('filters hiding every row', (t) =>
      failuresOn(t, browser, renderHtmlReport(failing), () => {
        document.querySelectorAll('#filters input:checked').forEach((box) => box.click());
        if (document.querySelector('#findings-body td:not([colspan])')) {
          throw new Error('a row is still shown');
        }
      })
    );
  }
);

// At 320 CSS px the report scrolled sideways as a whole (1.4.10): its WCAG
// tables and the findings table were wider than the window. Each now
// scrolls in a box of its own, which takes focus, so the page reflows.
test(
  'the HTML report reflows at 320 CSS px and fails no WCAG 2.2 AA rule there, in Chromium',
  { skip },
  async (t) => {
    const result = runa11yCoreOnHtml(
      fs.readFileSync(
        path.join(__dirname, '../fixtures/img-alt-present-all-scenarios.html'),
        'utf8'
      )
    );
    result.url = `https://example.com/${'a-long-path-segment'.repeat(8)}/page.html`;
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    const html = renderHtmlReport(result);
    assert.match(html, /<div class="table-scroll" role="region" tabindex="0" aria-labelledby="/);
    await failuresOn(t, browser, html, () => {}, 320);
  }
);
