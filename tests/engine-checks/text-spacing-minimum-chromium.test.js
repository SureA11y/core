'use strict';

/**
 * Spacing set exactly at WCAG 1.4.12's minimum meets it (#108). Browsers
 * report computed lengths to six significant digits (11pt is 14.6667px), so
 * a ratio of two of them can fall a few millionths short: a value relative
 * to the font size is read as declared, and computed ratios are compared
 * within that rounding. Checked for avoid-inline-spacing (inline
 * !important) and text-spacing-content-loss (style sheet !important), in
 * Chromium, whose computed values are the ones rounded.
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

const TEXT = 'Some text that wraps across lines in this paragraph, long enough to wrap. '.repeat(3);

// [declarations, avoid-inline-spacing's outcome inline, text-spacing-content-loss's
// outcome in a style sheet]
const CASES = [
  ['font-size:11pt; line-height:1.5', 'pass', 'pass'],
  ['font-size:11pt; letter-spacing:0.12em', 'pass', 'pass'],
  ['font-size:11pt; word-spacing:0.16em', 'pass', 'pass'],
  ['font-size:1.1em; line-height:1.5', 'pass', 'pass'],
  ['font-size:11pt; line-height:22px', 'pass', 'pass'],
  ['font-size:0.9rem; letter-spacing:0.12em', 'pass', 'pass'],
  ['font-size:13px; line-height:150%', 'pass', 'pass'],
  ['font-size:11pt; line-height:1.49', 'fail', 'cantTell'],
  ['font-size:11pt; letter-spacing:0.119em', 'fail', 'cantTell']
];

const important = (decls) =>
  decls
    .split(';')
    .map((d, i) => (i === 0 ? d : `${d} !important`))
    .join(';');

test('spacing exactly at the minimum meets it, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function outcome(head, body, ruleId) {
    const page = await browser.newPage();
    try {
      await page.setContent(
        `<!doctype html><html lang="en"><head><title>Spacing</title>${head}</head><body>${body}</body></html>`
      );
      await page.evaluate(BUNDLE);
      return await page.evaluate(
        (id) =>
          window.a11ycore
            .runa11yCoreInPage(location.href, null, {}, [id])
            .checksResults.find((c) => c.ruleId === id).outcome,
        ruleId
      );
    } finally {
      await page.close();
    }
  }

  for (const [decls, inline, sheet] of CASES) {
    await t.test(decls, async () => {
      assert.equal(
        await outcome(
          '',
          `<p style="width:300px; ${important(decls)}">${TEXT}</p>`,
          'avoid-inline-spacing'
        ),
        inline
      );
      assert.equal(
        await outcome(
          `<style>.x { ${important(decls)} }</style>`,
          `<p class="x" style="width:300px">${TEXT}</p>`,
          'text-spacing-content-loss'
        ),
        sheet
      );
    });
  }
});
