'use strict';

/**
 * Under a Content Security Policy without 'unsafe-eval', a custom rule
 * given as source can't be turned back into a function, and the reason it
 * is skipped says so, with what to do about it. The scan runs from the
 * page's own script, since Playwright's evaluate is exempt from the page's
 * CSP. A rule passed as a function still runs.
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

const RUN = `
try { new Function('return 1')(); window.__eval = 'allowed'; } catch (e) { window.__eval = e.name; }
const meta = { title: 'X', tags: ['best-practice'] };
window.__result = window.a11ycore.runa11yCoreInPage(null, null, {
  customRules: [
    { id: 'acme-src', meta, runInPage: 'function () { return { outcome: "pass", occurrences: [] }; }' },
    { id: 'acme-fn', meta, runInPage: function () { return { outcome: 'pass', occurrences: [] }; } }
  ]
}, ['acme-src', 'acme-fn']);`;

test('a custom rule source under a strict CSP, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const page = await browser.newPage();
  await page.route('https://example.test/**', (route) => {
    const url = route.request().url();
    if (url.endsWith('/bundle.js'))
      return route.fulfill({ contentType: 'text/javascript', body: BUNDLE });
    if (url.endsWith('/run.js'))
      return route.fulfill({ contentType: 'text/javascript', body: RUN });
    return route.fulfill({
      contentType: 'text/html',
      headers: { 'Content-Security-Policy': "script-src 'self'" },
      body: '<!doctype html><html lang="en"><head><title>t</title><script src="/bundle.js"></script></head><body><main>x</main><script src="/run.js"></script></body></html>'
    });
  });
  await page.goto('https://example.test/');
  const got = await page.evaluate(() => ({
    eval: window.__eval,
    ran: window.__result.checksResults.map((c) => c.ruleId),
    skipped: window.__result.skippedCustomRules
  }));
  await page.close();

  assert.equal(got.eval, 'EvalError', 'the policy blocks eval');
  assert.deepEqual(got.ran, ['acme-fn']);
  assert.equal(got.skipped.length, 1);
  assert.equal(got.skipped[0].id, 'acme-src');
  assert.match(got.skipped[0].reason, /Content Security Policy does not allow evaluating source/);
});
