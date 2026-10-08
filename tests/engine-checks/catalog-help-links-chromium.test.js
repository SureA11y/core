'use strict';

// A built-in rule mapped to no WCAG criterion links its section of the rule
// catalog, in the browser bundle's results as in Node's (#164).

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
const VERSION = require('../../package.json').version;

test('rules with no criterion link their catalog section, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const page = await browser.newPage();
  await page.setContent(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><div>x</div></body></html>'
  );
  await page.addScriptTag({ content: BUNDLE });
  const got = await page.evaluate(() =>
    window.a11ycore
      .runa11yCoreInPage(null, null, null, ['region', 'img-alt-present'])
      .checksResults.map((c) => [c.ruleId, c.meta.helpUrl])
      .sort()
  );
  assert.deepEqual(got, [
    ['img-alt-present', ''],
    ['region', `https://github.com/SureA11y/core/blob/v${VERSION}/docs/RULE_CATALOG.md#region`]
  ]);
});
