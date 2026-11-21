'use strict';

/**
 * A native <marquee> moves its content through its box on a timer of its
 * own, which is no CSS animation the scan can hold still: where its text
 * is at the moment of a scan is chance. Text the marquee had carried out of
 * its box was left out as clipped away, and text in it measured, so the
 * contrast rules gave another outcome from one scan to the next. Text in a
 * marquee is now placed by the marquee's box, which it passes through, and
 * measured on every scan wherever it is. Round 8, RO-4.
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

// #999 on white (2.85:1): fails wherever the marquee has carried it.
const PAGE = `<!doctype html><html lang="en"><head><title>Ticker</title></head><body style="background:#fff; margin:0 0 0 20px"><main><marquee id="m" scrollamount="30" style="width:300px"><span style="color:#999">Breaking: low contrast</span></marquee><p>Body text</p></main></body></html>`;

test('contrast: text in a marquee is measured wherever it is, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  // Stops the marquee once its text is wholly out of its box, or wholly in
  // it, then scans.
  for (const where of ['out of its box', 'in its box']) {
    await t.test(`text the marquee has carried ${where} fails`, async () => {
      const page = await browser.newPage();
      try {
        await page.setContent(PAGE);
        const stopped = await page.evaluate(
          (out) =>
            new Promise((resolve) => {
              const m = document.getElementById('m');
              const s = m.querySelector('span');
              const t0 = performance.now();
              const tick = () => {
                const a = m.getBoundingClientRect();
                const r = s.getBoundingClientRect();
                const there = out
                  ? r.left >= a.right || r.right <= a.left
                  : r.left >= a.left && r.right <= a.right;
                if (there) {
                  m.stop();
                  resolve(true);
                } else if (performance.now() - t0 > 10000) resolve(false);
                else requestAnimationFrame(tick);
              };
              tick();
            }),
          where.startsWith('out')
        );
        assert.ok(stopped, 'the marquee reached the position');
        await page.evaluate(BUNDLE);
        const outcome = await page.evaluate(
          () =>
            window.a11ycore.runa11yCoreInPage(location.href, null, {}, ['contrast-minimum'])
              .checksResults[0].outcome
        );
        assert.equal(outcome, 'fail');
      } finally {
        await page.close();
      }
    });
  }
});
