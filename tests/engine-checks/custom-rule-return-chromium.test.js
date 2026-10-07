'use strict';

/**
 * What the engine takes from a custom rule's return, in a real browser,
 * through the browser bundle. A rule's type is its meta's (#159).
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

test('a custom rule’s return, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const page = await browser.newPage();
  t.after(() => page.close());
  await page.setContent(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main>x</main></body></html>'
  );
  await page.addScriptTag({ content: BUNDLE });

  // Rules cross into the page as source strings, as a binding passes them.
  const run = (meta, body) =>
    page.evaluate(
      ([m, src]) => {
        const r = window.a11ycore.runa11yCoreInPage(
          null,
          null,
          { customRules: [{ id: 'acme-x', meta: m, runInPage: src }] },
          ['acme-x']
        );
        const c = r.checksResults[0];
        return { outcome: c.outcome, type: c.type, error: c.error || '' };
      },
      [meta, `function (ctx) { return ${body}; }`]
    );

  await t.test('a returned type does not change the rule type', async () => {
    const r = await run(
      { title: 'X', type: 'automatic', tags: ['best-practice'] },
      "{ outcome: 'fail', type: 'manual', occurrences: [] }"
    );
    assert.equal(r.type, 'automatic');
    assert.equal(r.outcome, 'fail');
    assert.match(r.error, /returned type "manual"/);
  });
});
