'use strict';

/**
 * One page scanned twice in a real browser, merged into EARL (#136). The
 * image fails before the page gives it an alt and passes after; merged
 * in either order, the subject keeps earl:failed, and the two orders give
 * the same output.
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
const { renderEarlReport } = require('../../src/earl.js');

test('EARL keeps a failure whatever the order of the scans, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const page = await browser.newPage();
  t.after(() => page.close());
  await page.setContent(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="data:,"></main></body></html>'
  );
  await page.addScriptTag({ content: BUNDLE });
  const scan = () =>
    page.evaluate(() =>
      window.a11ycore.runa11yCoreInPage('https://example.test/', null, {}, ['img-alt-present'])
    );
  const failing = await scan();
  await page.evaluate(() => document.querySelector('img').setAttribute('alt', 'Logo'));
  const passing = await scan();
  assert.deepEqual(
    [failing, passing].map((r) => r.checksResults[0].outcome),
    ['fail', 'pass']
  );

  const reports = [
    [failing, passing],
    [passing, failing]
  ].map((list) => renderEarlReport(list));
  for (const report of reports) {
    assert.equal(report['@graph'][0].assertions[0].result.outcome, 'earl:failed');
  }
  assert.equal(JSON.stringify(reports[0]), JSON.stringify(reports[1]));
});
