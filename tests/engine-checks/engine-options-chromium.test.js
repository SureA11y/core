'use strict';

// engineOptions in the browser bundle: with strictOptions, an unknown or
// invalid option throws INVALID_ENGINE_OPTIONS in the page, before the scan;
// without it, a typo of a known option is warned about on the console.

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

test('engineOptions are checked in the page, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const page = await browser.newPage();
  const warnings = [];
  page.on('console', (m) => {
    if (m.type() === 'warning') warnings.push(m.text());
  });
  await page.setContent(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main>x</main></body></html>'
  );
  await page.addScriptTag({ content: BUNDLE });

  const strict = await page.evaluate(() => {
    try {
      window.a11ycore.runa11yCoreInPage(null, null, {
        strictOptions: true,
        lcoale: 'de',
        contrast: { mode: 'strict' }
      });
      return null;
    } catch (e) {
      return { code: e.code, message: e.message, paths: e.problems.map((p) => p.path) };
    }
  });
  assert.deepEqual(strict, {
    code: 'INVALID_ENGINE_OPTIONS',
    message:
      'engineOptions: unknown option "lcoale" (did you mean "locale"?); contrast.mode must be one of "strictConformance", "auditorAssist", not "strict". (strictOptions)',
    paths: ['lcoale', 'contrast.mode']
  });

  const lenient = await page.evaluate(
    () =>
      window.a11ycore.runa11yCoreInPage(null, null, { lcoale: 'de', acmeSetting: 1 }).engine.locale
        .resolved
  );
  assert.equal(lenient, 'en');
  assert.deepEqual(
    warnings.filter((w) => w.includes('unknown option')),
    ['[surea11y] engineOptions: unknown option "lcoale" (did you mean "locale"?); ignored.']
  );
});
