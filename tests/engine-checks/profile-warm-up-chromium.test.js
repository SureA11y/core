'use strict';

/**
 * With profileRules, the shared caches are filled before the first rule
 * and timed apart (perfStats.warmUpMs), in Chromium too, so ruleTimings
 * holds the rules' own time only.
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

test('profileRules reports the warm-up apart, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const page = await browser.newPage();
  await page.setContent(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${'<div><span>x</span></div>'.repeat(300)}</main></body></html>`
  );
  await page.addScriptTag({ content: BUNDLE });
  const stats = await page.evaluate(
    () =>
      window.a11ycore.runa11yCoreInPage(null, null, { perfStats: true, profileRules: true }, [
        'aria-valid-attr',
        'region'
      ]).perfStats
  );
  await page.close();
  assert.equal(typeof stats.warmUpMs, 'number');
  assert.deepEqual(Object.keys(stats.ruleTimings).sort(), ['aria-valid-attr', 'region']);
});
