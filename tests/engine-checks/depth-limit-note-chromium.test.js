'use strict';

/**
 * A fail resting only on elements deeper than the 200-step ancestor walk is
 * downgraded to cantTell, with a note in error, in Chromium too. The rule
 * completed, so it keeps its occurrences (OUTPUT_SCHEMA.md, `error`).
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

test('a depth-limit downgrade keeps its occurrences, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const page = await browser.newPage();
  const deep = '<div>'.repeat(250) + '<img src="a.png">' + '</div>'.repeat(250);
  await page.setContent(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${deep}</main></body></html>`
  );
  await page.addScriptTag({ content: BUNDLE });
  const check = await page.evaluate(() => {
    const c = window.a11ycore.runa11yCoreInPage(null, null, {}, ['img-alt-present'])
      .checksResults[0];
    return { outcome: c.outcome, occurrences: c.occurrences.length, error: c.error || '' };
  });
  await page.close();
  assert.equal(check.outcome, 'cantTell');
  assert.equal(check.occurrences, 1);
  assert.match(check.error, /Ancestor walk hit its depth limit/);
});
