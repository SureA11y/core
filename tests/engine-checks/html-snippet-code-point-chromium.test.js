'use strict';

/**
 * An occurrence's html is cut at 2,000 UTF-16 units without splitting a
 * surrogate pair, in Chromium too: an emoji at the cut is left out whole,
 * not halved into a lone surrogate.
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

test('the html snippet is cut at a code point, in Chromium', { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  for (const pad of [1980, 1981]) {
    const page = await browser.newPage();
    const src = 'x'.repeat(pad) + '😀'.repeat(10) + '.png';
    await page.setContent(
      `<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="${src}"></main></body></html>`
    );
    await page.addScriptTag({ content: BUNDLE });
    const html = await page.evaluate(
      () =>
        window.a11ycore.runa11yCoreInPage(null, null, {}, ['img-alt-present']).checksResults[0]
          .occurrences[0].html
    );
    await page.close();
    assert.ok(html.endsWith('…'), pad);
    assert.ok(!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/u.test(html), pad);
  }
});
