'use strict';

/**
 * A criterion checked by several composites, from a scan in a real
 * browser (#135). WCAG 4.1.2 is checked in two parts, its accessible name
 * and its ARIA validity; when the name passes and the ARIA validity
 * fails, the JUnit suite is the criterion's, titled by the name the parts
 * share, and its criterionOutcome is fail.
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
const { renderJunitReport } = require('../../src/junit.js');

test(
  'JUnit takes a criterion outcome from all its composites, in Chromium',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    const page = await browser.newPage();
    t.after(() => page.close());
    await page.setContent(
      '<!doctype html><html lang="en"><head><title>t</title></head><body><main><button aria-pressed="banana">OK</button></main></body></html>'
    );
    await page.addScriptTag({ content: BUNDLE });
    const result = await page.evaluate(() =>
      window.a11ycore.runa11yCoreInPage(null, null, {}, null)
    );

    const suite = renderJunitReport(result).match(
      /<testsuite name="WCAG 4\.1\.2[^]*?<\/properties>/
    )[0];
    assert.match(suite, /^<testsuite name="WCAG 4\.1\.2 Name, role, value" [^>]*failures="1"/);
    assert.match(suite, /<property name="criterionOutcome" value="fail"\/>/);
  }
);
