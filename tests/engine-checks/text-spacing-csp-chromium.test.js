'use strict';

/**
 * text-spacing-content-loss applies the WCAG 1.4.12 spacing with a <style>
 * element. A page whose Content Security Policy blocks inline styles gives
 * that element no style sheet, so the text was measured against itself and
 * passed. The rule now applies the spacing as a constructed style sheet
 * there, says it couldn't measure when neither applies, and takes the
 * spacing back off the page even when the page's own code breaks removing
 * it. These need a real browser's CSP and layout.
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

// Text in boxes that hide their overflow, which the spacing pushes out. The
// boxes are styled from a file of the page's own origin, which the CSPs
// below allow, as they don't allow style attributes.
const CSS =
  '.one { overflow: hidden; height: 20px; width: 120px; white-space: nowrap; font-size: 16px }' +
  '.two { overflow: hidden; height: 18px; width: 200px; line-height: 18px; font-size: 16px }';
const PAGE = () =>
  '<!doctype html><html lang="en"><head><title>t</title><link rel="stylesheet" href="/s.css"></head><body><main><h1>H</h1>' +
  '<div class="one">clipped text clipped</div>' +
  '<div class="two">Two words fit, but at 1.5 line height the second line is lost lost lost lost lost lost lost</div>' +
  '</main></body></html>';

async function scan(browser, { csp, before = '' } = {}) {
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  try {
    await page.route('https://example.test/', (route) =>
      route.fulfill({
        contentType: 'text/html',
        headers: csp ? { 'Content-Security-Policy': csp } : {},
        body: PAGE()
      })
    );
    await page.route('https://example.test/s.css', (route) =>
      route.fulfill({ contentType: 'text/css', body: CSS })
    );
    await page.goto('https://example.test/');
    // Injected through the debugging protocol, as bindings do, so the CSP
    // doesn't keep the bundle itself out.
    await page.evaluate(BUNDLE);
    if (before) await page.evaluate(before);
    return await page.evaluate(() => {
      const r = window.a11ycore.runa11yCoreInPage(null, null, {}, ['text-spacing-content-loss']);
      const c = r.checksResults.find((x) => x.ruleId === 'text-spacing-content-loss');
      return {
        outcome: c.outcome,
        codes: c.occurrences.map((o) => o.data.details.reasonCode),
        error: c.error || null,
        left: document.querySelectorAll('style[data-surea11y]').length,
        adopted: document.adoptedStyleSheets.length,
        letterSpacing: getComputedStyle(document.querySelector('.two')).letterSpacing
      };
    });
  } finally {
    await page.close();
  }
}

test('text-spacing measures under a CSP that blocks inline styles', { skip }, async () => {
  const browser = await chromium.launch({ executablePath });
  try {
    const open = await scan(browser);
    assert.notEqual(open.outcome, 'pass');
    assert.ok(open.codes.length && !open.codes.includes('SPACING_NOT_APPLIED'));
    for (const csp of ["style-src 'self'", "default-src 'self'", "style-src 'self' 'nonce-abc'"]) {
      const r = await scan(browser, { csp });
      assert.deepEqual([r.outcome, r.codes], [open.outcome, open.codes], csp);
      assert.equal(r.adopted, 0, `${csp}: the spacing is taken off`);
      assert.equal(r.letterSpacing, 'normal', csp);
    }
  } finally {
    await browser.close();
  }
});

test(
  'text-spacing says it could not measure when the spacing applies neither way',
  { skip },
  async () => {
    const browser = await chromium.launch({ executablePath });
    try {
      const r = await scan(browser, {
        csp: "style-src 'self'",
        before: 'delete window.CSSStyleSheet;'
      });
      assert.equal(r.outcome, 'cantTell');
      assert.deepEqual(r.codes, ['SPACING_NOT_APPLIED']);
    } finally {
      await browser.close();
    }
  }
);

test(
  "text-spacing takes the spacing off even when the page's code breaks removing it",
  { skip },
  async () => {
    const browser = await chromium.launch({ executablePath });
    try {
      const r = await scan(browser, {
        before:
          'const rc = Node.prototype.removeChild; let first = true;' +
          "Node.prototype.removeChild = function (c) { if (first) { first = false; throw new Error('rc'); } return rc.call(this, c); };"
      });
      assert.equal(r.left, 0);
      assert.equal(r.letterSpacing, 'normal');
      const open = await scan(browser);
      assert.deepEqual([r.outcome, r.codes], [open.outcome, open.codes]);
    } finally {
      await browser.close();
    }
  }
);
